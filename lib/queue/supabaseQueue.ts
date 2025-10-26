/**
 * Supabase Job Queue
 * Database-backed job queue using jobs table
 */

import { supabaseAdmin } from '@/lib/supabase/client';

export type JobType = 'token_transfer' | 'payment_verification' | 'kyc_verification' | 'notification';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'retrying';

export interface Job {
  id: string;
  user_id?: string;
  order_id?: string;
  job_type: JobType;
  status: JobStatus;
  payload: any;
  priority: number;
  attempts: number;
  max_attempts: number;
  error_message?: string;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseQueue {
  
  /**
   * Add a job to the queue
   */
  static async enqueue(
    jobType: JobType,
    payload: any,
    options: {
      userId?: string;
      orderId?: string;
      priority?: number;
      maxAttempts?: number;
      scheduledAt?: Date;
    } = {}
  ): Promise<string | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('jobs')
        .insert({
          job_type: jobType,
          payload,
          user_id: options.userId,
          order_id: options.orderId,
          priority: options.priority || 0,
          max_attempts: options.maxAttempts || 3,
          scheduled_at: options.scheduledAt?.toISOString() || new Date().toISOString(),
          status: 'queued'
        })
        .select('id')
        .single();

      if (error) {
        console.error('[Queue] Error enqueueing job:', error);
        return null;
      }

      console.log('[Queue] Job enqueued:', data.id, jobType);
      return data.id;
    } catch (error) {
      console.error('[Queue] Error enqueueing job:', error);
      return null;
    }
  }

  /**
   * Get next job to process (with advisory lock)
   */
  static async dequeue(): Promise<Job | null> {
    try {
      // Get next queued job
      const { data: jobs, error } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .eq('status', 'queued')
        .lte('scheduled_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1);

      if (error || !jobs || jobs.length === 0) {
        return null;
      }

      const job = jobs[0];

      // Try to claim the job by updating status
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('jobs')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
          attempts: job.attempts + 1
        })
        .eq('id', job.id)
        .eq('status', 'queued') // Only update if still queued
        .select()
        .single();

      if (updateError || !updated) {
        // Job was claimed by another worker
        return null;
      }

      return updated as Job;
    } catch (error) {
      console.error('[Queue] Error dequeuing job:', error);
      return null;
    }
  }

  /**
   * Mark job as completed
   */
  static async complete(jobId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);

      return !error;
    } catch (error) {
      console.error('[Queue] Error completing job:', error);
      return false;
    }
  }

  /**
   * Mark job as failed
   */
  static async fail(jobId: string, errorMessage: string, retry: boolean = true): Promise<boolean> {
    try {
      const { data: job } = await supabaseAdmin
        .from('jobs')
        .select('attempts, max_attempts')
        .eq('id', jobId)
        .single();

      if (!job) return false;

      const shouldRetry = retry && job.attempts < job.max_attempts;

      const { error } = await supabaseAdmin
        .from('jobs')
        .update({
          status: shouldRetry ? 'retrying' : 'failed',
          error_message: errorMessage,
          completed_at: shouldRetry ? undefined : new Date().toISOString()
        })
        .eq('id', jobId);

      // If retrying, reset status to queued after a delay
      if (shouldRetry) {
        setTimeout(async () => {
          await supabaseAdmin
            .from('jobs')
            .update({ status: 'queued' })
            .eq('id', jobId);
        }, 5000 * job.attempts); // Exponential backoff
      }

      return !error;
    } catch (error) {
      console.error('[Queue] Error failing job:', error);
      return false;
    }
  }

  /**
   * Get job status
   */
  static async getJobStatus(jobId: string): Promise<Job | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) return null;
      return data as Job;
    } catch (error) {
      console.error('[Queue] Error getting job status:', error);
      return null;
    }
  }

  /**
   * Get user's jobs
   */
  static async getUserJobs(userId: string, limit: number = 10): Promise<Job[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return [];
      return data as Job[];
    } catch (error) {
      console.error('[Queue] Error getting user jobs:', error);
      return [];
    }
  }

  /**
   * Clean old completed/failed jobs
   */
  static async cleanOldJobs(daysOld: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await supabaseAdmin
        .from('jobs')
        .delete()
        .in('status', ['completed', 'failed'])
        .lt('completed_at', cutoffDate.toISOString())
        .select('id');

      if (error) return 0;
      return data?.length || 0;
    } catch (error) {
      console.error('[Queue] Error cleaning old jobs:', error);
      return 0;
    }
  }

  /**
   * Get queue statistics
   */
  static async getStats(): Promise<{
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('jobs')
        .select('status');

      if (error || !data) {
        return { queued: 0, processing: 0, completed: 0, failed: 0 };
      }

      const stats = {
        queued: data.filter(j => j.status === 'queued').length,
        processing: data.filter(j => j.status === 'processing').length,
        completed: data.filter(j => j.status === 'completed').length,
        failed: data.filter(j => j.status === 'failed').length
      };

      return stats;
    } catch (error) {
      console.error('[Queue] Error getting stats:', error);
      return { queued: 0, processing: 0, completed: 0, failed: 0 };
    }
  }
}

export default SupabaseQueue;
