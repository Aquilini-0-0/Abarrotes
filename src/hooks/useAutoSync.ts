import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface TableConfig {
  name: string;
  timestampColumn?: string;
}

interface AutoSyncOptions {
  onDataUpdate?: () => void;
  interval?: number; // milliseconds
  tables?: (string | TableConfig)[];
}

export function useAutoSync({ onDataUpdate, interval = 5000, tables = [] }: AutoSyncOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        let hasUpdates = false;

        for (const tableConfig of tables) {
          const tableName = typeof tableConfig === 'string' ? tableConfig : tableConfig.name;
          const timestampColumn = typeof tableConfig === 'string' ? 'updated_at' : (tableConfig.timestampColumn || 'updated_at');
          
          const { data, error } = await supabase
            .from(tableName)
            .select(timestampColumn)
            .order(timestampColumn, { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) continue;

          const lastUpdate = data?.[timestampColumn];
          if (lastUpdate && lastUpdate !== lastUpdateRef.current[tableName]) {
            lastUpdateRef.current[tableName] = lastUpdate;
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

    tables.forEach(tableConfig => {
      const tableName = typeof tableConfig === 'string' ? tableConfig : tableConfig.name;
      
      const subscription = supabase
        .channel(`${tableName}_changes`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: tableName }, 
          (payload) => {
            console.log(`Real-time update in ${tableName}:`, payload);
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