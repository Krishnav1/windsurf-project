/**
 * Supabase Realtime Service
 * Real-time updates using Supabase Realtime (replaces Pusher)
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase instance for realtime
export const supabaseRealtime = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Subscribe to order updates for a user
 */
export function subscribeToOrderUpdates(
  userId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabaseRealtime
    .channel(`orders:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('[Realtime] Order update:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to blockchain transaction updates for a user
 */
export function subscribeToTransactionUpdates(
  userId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabaseRealtime
    .channel(`transactions:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'blockchain_transactions',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('[Realtime] Transaction update:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to holdings updates for a user
 */
export function subscribeToHoldingsUpdates(
  userId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabaseRealtime
    .channel(`holdings:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_holdings',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('[Realtime] Holdings update:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to job status updates for a user
 */
export function subscribeToJobUpdates(
  userId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabaseRealtime
    .channel(`jobs:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'jobs',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('[Realtime] Job update:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to notifications for a user
 */
export function subscribeToNotifications(
  userId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabaseRealtime
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('[Realtime] New notification:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribe(channel: RealtimeChannel) {
  await supabaseRealtime.removeChannel(channel);
}

/**
 * Subscribe to all user updates (convenience function)
 */
export function subscribeToAllUserUpdates(
  userId: string,
  callbacks: {
    onOrderUpdate?: (payload: any) => void;
    onTransactionUpdate?: (payload: any) => void;
    onHoldingsUpdate?: (payload: any) => void;
    onJobUpdate?: (payload: any) => void;
    onNotification?: (payload: any) => void;
  }
) {
  const channels: RealtimeChannel[] = [];

  if (callbacks.onOrderUpdate) {
    channels.push(subscribeToOrderUpdates(userId, callbacks.onOrderUpdate));
  }

  if (callbacks.onTransactionUpdate) {
    channels.push(subscribeToTransactionUpdates(userId, callbacks.onTransactionUpdate));
  }

  if (callbacks.onHoldingsUpdate) {
    channels.push(subscribeToHoldingsUpdates(userId, callbacks.onHoldingsUpdate));
  }

  if (callbacks.onJobUpdate) {
    channels.push(subscribeToJobUpdates(userId, callbacks.onJobUpdate));
  }

  if (callbacks.onNotification) {
    channels.push(subscribeToNotifications(userId, callbacks.onNotification));
  }

  return {
    channels,
    unsubscribeAll: async () => {
      for (const channel of channels) {
        await unsubscribe(channel);
      }
    }
  };
}

export default supabaseRealtime;
