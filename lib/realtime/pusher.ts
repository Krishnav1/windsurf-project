/**
 * Real-time Updates Service using Pusher
 * WebSocket connections for live updates
 */

import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
  useTLS: true,
});

// Client-side Pusher instance
export const getPusherClient = () => {
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
  });
};

/**
 * Send order update to user
 */
export async function sendOrderUpdate(userId: string, orderData: any) {
  try {
    await pusherServer.trigger(
      `user-${userId}`,
      'order-update',
      orderData
    );
    console.log('[Pusher] Order update sent to user:', userId);
  } catch (error) {
    console.error('[Pusher] Error sending order update:', error);
  }
}

/**
 * Send trade execution update
 */
export async function sendTradeUpdate(userId: string, tradeData: any) {
  try {
    await pusherServer.trigger(
      `user-${userId}`,
      'trade-update',
      tradeData
    );
    console.log('[Pusher] Trade update sent to user:', userId);
  } catch (error) {
    console.error('[Pusher] Error sending trade update:', error);
  }
}

/**
 * Send portfolio update
 */
export async function sendPortfolioUpdate(userId: string, portfolioData: any) {
  try {
    await pusherServer.trigger(
      `user-${userId}`,
      'portfolio-update',
      portfolioData
    );
    console.log('[Pusher] Portfolio update sent to user:', userId);
  } catch (error) {
    console.error('[Pusher] Error sending portfolio update:', error);
  }
}

/**
 * Send price update to all users
 */
export async function sendPriceUpdate(tokenId: string, priceData: any) {
  try {
    await pusherServer.trigger(
      'prices',
      `price-${tokenId}`,
      priceData
    );
    console.log('[Pusher] Price update sent for token:', tokenId);
  } catch (error) {
    console.error('[Pusher] Error sending price update:', error);
  }
}

/**
 * Send notification to user
 */
export async function sendNotification(userId: string, notification: any) {
  try {
    await pusherServer.trigger(
      `user-${userId}`,
      'notification',
      notification
    );
    console.log('[Pusher] Notification sent to user:', userId);
  } catch (error) {
    console.error('[Pusher] Error sending notification:', error);
  }
}

/**
 * Broadcast system announcement
 */
export async function broadcastAnnouncement(message: string, type: string = 'info') {
  try {
    await pusherServer.trigger(
      'system',
      'announcement',
      { message, type, timestamp: new Date().toISOString() }
    );
    console.log('[Pusher] System announcement broadcasted');
  } catch (error) {
    console.error('[Pusher] Error broadcasting announcement:', error);
  }
}

export default pusherServer;
