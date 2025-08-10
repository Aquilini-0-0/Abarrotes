import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface OrderLock {
  id: string;
  order_id: string;
  user_id: string;
  user_name: string;
  locked_at: string;
  expires_at: string;
  session_id: string;
}

export function useOrderLocks() {
  const { user } = useAuth();
  const [locks, setLocks] = useState<OrderLock[]>([]);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Generate unique session ID for this browser session
  useEffect(() => {
    // Store session ID in sessionStorage for cleanup on page reload
    sessionStorage.setItem('pos_session_id', sessionId);
    
    // Cleanup locks on page unload
    const handleBeforeUnload = () => {
      cleanupUserLocks();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupUserLocks();
    };
  }, [sessionId]);

  const fetchLocks = async () => {
    try {
      const { data, error } = await supabase
        .from('order_locks')
        .select('*')
        .order('locked_at', { ascending: false });

      if (error) throw error;
      setLocks(data || []);
    } catch (err) {
      console.error('Error fetching locks:', err);
    }
  };

  const createLock = async (orderId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // First check if order is already locked
      const { data: existingLock } = await supabase
        .from('order_locks')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (existingLock) {
        // Check if lock is expired
        const expiresAt = new Date(existingLock.expires_at);
        const now = new Date();
        
        if (expiresAt > now) {
          // Lock is still active
          return false;
        } else {
          // Lock expired, remove it
          await supabase
            .from('order_locks')
            .delete()
            .eq('order_id', orderId);
        }
      }

      // Create new lock
      const { error } = await supabase
        .from('order_locks')
        .insert({
          order_id: orderId,
          user_id: user.id,
          user_name: user.name,
          session_id: sessionId,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        });

      if (error) throw error;

      await fetchLocks();
      return true;
    } catch (err) {
      console.error('Error creating lock:', err);
      return false;
    }
  };

  const extendLock = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('order_locks')
        .update({
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        })
        .eq('order_id', orderId)
        .eq('user_id', user?.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error extending lock:', err);
    }
  };

  const releaseLock = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('order_locks')
        .delete()
        .eq('order_id', orderId)
        .eq('user_id', user?.id);

      if (error) throw error;
      await fetchLocks();
    } catch (err) {
      console.error('Error releasing lock:', err);
    }
  };

  const cleanupUserLocks = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('order_locks')
        .delete()
        .eq('user_id', user.id)
        .eq('session_id', sessionId);

      if (error) throw error;
    } catch (err) {
      console.error('Error cleaning up locks:', err);
    }
  };

  const isOrderLocked = (orderId: string): { locked: boolean; lockedBy?: string } => {
    const lock = locks.find(l => l.order_id === orderId);
    if (!lock) return { locked: false };

    const expiresAt = new Date(lock.expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      // Lock expired
      return { locked: false };
    }

    // Check if locked by current user
    if (lock.user_id === user?.id && lock.session_id === sessionId) {
      return { locked: false }; // User can edit their own locked orders
    }

    return { locked: true, lockedBy: lock.user_name };
  };

  const cleanExpiredLocks = async () => {
    try {
      const { error } = await supabase
        .from('order_locks')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;
      await fetchLocks();
    } catch (err) {
      console.error('Error cleaning expired locks:', err);
    }
  };

  // Auto-cleanup expired locks every minute
  useEffect(() => {
    const interval = setInterval(cleanExpiredLocks, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchLocks();
  }, []);

  return {
    locks,
    createLock,
    extendLock,
    releaseLock,
    cleanupUserLocks,
    isOrderLocked,
    sessionId
  };
}