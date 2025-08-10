import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface AutoSyncOptions {
  onDataUpdate?: () => void;
  interval?: number; // milliseconds
  tables?: string[];
}

export function useAutoSync({ onDataUpdate, interval = 5000, tables = [] }: AutoSyncOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        let hasUpdates = false;

        for (const table of tables) {
          const { data, error } = await supabase
            .from(table)
            .select('updated_at')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

          if (error) continue;

          const lastUpdate = data?.updated_at;
          if (lastUpdate && lastUpdate !== lastUpdateRef.current[table]) {
            lastUpdateRef.current[table] = lastUpdate;
            hasUpdates = true;
          }
        }

        if (hasUpdates && onDataUpdate) {
          onDataUpdate();
        }
      } catch (err) {
        console.error('Error checking for updates:', err);
      }
    };

    // Initial check
    checkForUpdates();

    // Set up interval
    intervalRef.current = setInterval(checkForUpdates, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onDataUpdate, interval, tables]);

  // Real-time subscriptions for critical tables
  useEffect(() => {
    const subscriptions: any[] = [];

    tables.forEach(table => {
      const subscription = supabase
        .channel(`${table}_changes`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table }, 
          (payload) => {
            console.log(`Real-time update in ${table}:`, payload);
            if (onDataUpdate) {
              // Debounce updates to avoid excessive re-renders
              setTimeout(onDataUpdate, 100);
            }
          }
        )
        .subscribe();

      subscriptions.push(subscription);
    });

    return () => {
      subscriptions.forEach(sub => {
        supabase.removeChannel(sub);
      });
    };
  }, [tables, onDataUpdate]);

  return {
    // Expose method to manually trigger sync
    triggerSync: () => {
      if (onDataUpdate) {
        onDataUpdate();
      }
    }
  };
}