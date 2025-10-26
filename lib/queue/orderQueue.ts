/**
 * Order Queue System
 * Background job processing for orders and blockchain transactions
 */

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { TradeExecutor } from '@/lib/blockchain/tradeExecutor';
import { supabaseAdmin } from '@/lib/supabase/client';
import { CacheService } from '@/lib/cache/redis';

// Redis connection for BullMQ
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Order Processing Queue
export const orderQueue = new Queue('orders', { connection });

// Blockchain Transaction Queue
export const blockchainQueue = new Queue('blockchain', { connection });

// Notification Queue
export const notificationQueue = new Queue('notifications', { connection });

/**
 * Order Job Data Interface
 */
interface OrderJobData {
  orderId: string;
  userId: string;
  tokenId: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
}

/**
 * Blockchain Job Data Interface
 */
interface BlockchainJobData {
  orderId: string;
  tokenAddress: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  tokenId: string;
}

/**
 * Add order to processing queue
 */
export async function queueOrder(orderData: OrderJobData) {
  try {
    const job = await orderQueue.add('process-order', orderData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 1000,
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
      },
    });

    console.log('[Order Queue] Order queued:', job.id);
    return job.id;
  } catch (error) {
    console.error('[Order Queue] Error queuing order:', error);
    throw error;
  }
}

/**
 * Add blockchain transaction to queue
 */
export async function queueBlockchainTransaction(txData: BlockchainJobData) {
  try {
    const job = await blockchainQueue.add('execute-transaction', txData, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      timeout: 300000, // 5 minutes timeout
    });

    console.log('[Blockchain Queue] Transaction queued:', job.id);
    return job.id;
  } catch (error) {
    console.error('[Blockchain Queue] Error queuing transaction:', error);
    throw error;
  }
}

/**
 * Send notification
 */
export async function queueNotification(userId: string, message: string, type: string) {
  try {
    await notificationQueue.add('send-notification', {
      userId,
      message,
      type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Notification Queue] Error queuing notification:', error);
  }
}

/**
 * Order Processing Worker
 */
export const orderWorker = new Worker(
  'orders',
  async (job: Job<OrderJobData>) => {
    console.log('[Order Worker] Processing order:', job.id);
    
    try {
      const { orderId, userId } = job.data;

      // Update order status
      await supabaseAdmin
        .from('orders')
        .update({ status: 'processing' })
        .eq('id', orderId);

      // Simulate payment verification (in real scenario, this would be done via webhook)
      await job.updateProgress(50);

      // Queue blockchain transaction
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*, tokens(*)')
        .eq('id', orderId)
        .single();

      if (order && order.tokens) {
        await queueBlockchainTransaction({
          orderId: order.id,
          tokenAddress: order.tokens.contract_address,
          fromAddress: process.env.PLATFORM_WALLET_ADDRESS!,
          toAddress: order.user_id, // Should be user's wallet address
          amount: order.quantity.toString(),
          tokenId: order.token_id,
        });
      }

      await job.updateProgress(100);
      
      // Send notification
      await queueNotification(userId, 'Order processed successfully', 'order_success');

      return { success: true, orderId };
    } catch (error) {
      console.error('[Order Worker] Error:', error);
      
      // Update order status to failed
      await supabaseAdmin
        .from('orders')
        .update({ 
          status: 'failed',
          error_message: (error as Error).message 
        })
        .eq('id', job.data.orderId);

      throw error;
    }
  },
  { connection, concurrency: 5 }
);

/**
 * Blockchain Transaction Worker
 */
export const blockchainWorker = new Worker(
  'blockchain',
  async (job: Job<BlockchainJobData>) => {
    console.log('[Blockchain Worker] Processing transaction:', job.id);
    
    try {
      const txData = job.data;

      // Update order status
      await supabaseAdmin
        .from('orders')
        .update({ 
          status: 'executing',
          blockchain_status: 'pending' 
        })
        .eq('id', txData.orderId);

      await job.updateProgress(25);

      // Execute blockchain transaction
      const result = await TradeExecutor.executeTokenTransfer(txData);

      await job.updateProgress(75);

      // Update order status
      await supabaseAdmin
        .from('orders')
        .update({ 
          status: 'completed',
          blockchain_status: 'confirmed',
          blockchain_tx_hash: result.txHash,
          completed_at: new Date().toISOString()
        })
        .eq('id', txData.orderId);

      // Invalidate user cache
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('user_id')
        .eq('id', txData.orderId)
        .single();

      if (order) {
        await CacheService.invalidateUserCache(order.user_id);
        await queueNotification(order.user_id, 'Trade executed successfully!', 'trade_success');
      }

      await job.updateProgress(100);

      return { success: true, txHash: result.txHash };
    } catch (error) {
      console.error('[Blockchain Worker] Error:', error);
      
      // Update order status to failed
      await supabaseAdmin
        .from('orders')
        .update({ 
          status: 'failed',
          blockchain_status: 'failed',
          error_message: (error as Error).message 
        })
        .eq('id', job.data.orderId);

      throw error;
    }
  },
  { connection, concurrency: 3 }
);

/**
 * Notification Worker
 */
export const notificationWorker = new Worker(
  'notifications',
  async (job: Job) => {
    console.log('[Notification Worker] Sending notification:', job.id);
    
    try {
      const { userId, message, type } = job.data;

      // Save notification to database
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          message,
          type,
          read: false,
          created_at: new Date().toISOString()
        });

      // TODO: Send push notification, email, etc.

      return { success: true };
    } catch (error) {
      console.error('[Notification Worker] Error:', error);
      throw error;
    }
  },
  { connection, concurrency: 10 }
);

// Event listeners
orderWorker.on('completed', (job) => {
  console.log(`[Order Worker] Job ${job.id} completed`);
});

orderWorker.on('failed', (job, err) => {
  console.error(`[Order Worker] Job ${job?.id} failed:`, err);
});

blockchainWorker.on('completed', (job) => {
  console.log(`[Blockchain Worker] Job ${job.id} completed`);
});

blockchainWorker.on('failed', (job, err) => {
  console.error(`[Blockchain Worker] Job ${job?.id} failed:`, err);
});

export default { orderQueue, blockchainQueue, notificationQueue };
