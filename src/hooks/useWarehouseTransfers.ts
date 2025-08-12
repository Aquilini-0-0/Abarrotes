import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  active: boolean;
}

export interface WarehouseStock {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  product_id: string;
  product_name: string;
  stock: number;
}

export interface WarehouseTransfer {
  id: string;
  from_warehouse_id: string;
  from_warehouse_name: string;
  to_warehouse_id: string;
  to_warehouse_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  date: string;
  reference: string;
  notes: string;
  created_by: string;
  created_at: string;
}

export function useWarehouseTransfers() {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStock[]>([]);
  const [transfers, setTransfers] = useState<WarehouseTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setWarehouses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching warehouses');
    }
  };

  const fetchWarehouseStock = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouse_stock')
        .select(`
          *,
          warehouses!warehouse_stock_warehouse_id_fkey(name),
          products!warehouse_stock_product_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedStock: WarehouseStock[] = (data || []).map(item => ({
        id: item.id,
        warehouse_id: item.warehouse_id,
        warehouse_name: item.warehouses?.name || '',
        product_id: item.product_id,
        product_name: item.products?.name || '',
        stock: item.stock
      }));

      setWarehouseStock(formattedStock);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching warehouse stock');
    }
  };

  const fetchTransfers = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouse_transfers')
        .select(`
          *,
          from_warehouse:warehouses!warehouse_transfers_from_warehouse_id_fkey(name),
          to_warehouse:warehouses!warehouse_transfers_to_warehouse_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTransfers: WarehouseTransfer[] = (data || []).map(item => ({
        id: item.id,
        from_warehouse_id: item.from_warehouse_id,
        from_warehouse_name: item.from_warehouse?.name || '',
        to_warehouse_id: item.to_warehouse_id,
        to_warehouse_name: item.to_warehouse?.name || '',
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        status: item.status,
        date: item.date,
        reference: item.reference,
        notes: item.notes,
        created_by: item.created_by,
        created_at: item.created_at
      }));

      setTransfers(formattedTransfers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching transfers');
    }
  };

  const createTransfer = async (transferData: Omit<WarehouseTransfer, 'id' | 'from_warehouse_name' | 'to_warehouse_name' | 'created_at'>) => {
    try {
      // Check stock availability
      const { data: stockData, error: stockError } = await supabase
        .from('warehouse_stock')
        .select('stock')
        .eq('warehouse_id', transferData.from_warehouse_id)
        .eq('product_id', transferData.product_id)
        .single();

      if (stockError || !stockData || stockData.stock < transferData.quantity) {
        throw new Error('Stock insuficiente en el almacén de origen');
      }

      // Create transfer
      const { data, error } = await supabase
        .from('warehouse_transfers')
        .insert([{
          from_warehouse_id: transferData.from_warehouse_id,
          to_warehouse_id: transferData.to_warehouse_id,
          product_id: transferData.product_id,
          product_name: transferData.product_name,
          quantity: transferData.quantity,
          status: transferData.status,
          date: transferData.date,
          reference: transferData.reference,
          notes: transferData.notes,
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchTransfers();
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating transfer');
    }
  };

  const updateTransferStatus = async (transferId: string, status: WarehouseTransfer['status']) => {
    try {
      const { data, error } = await supabase
        .from('warehouse_transfers')
        .update({ status })
        .eq('id', transferId)
        .select()
        .single();

      if (error) throw error;

      // If completed, update warehouse stocks
      if (status === 'completed') {
        const transfer = transfers.find(t => t.id === transferId);
        if (transfer) {
          // Reduce stock from source warehouse
          await supabase.rpc('update_warehouse_stock', {
            p_warehouse_id: transfer.from_warehouse_id,
            p_product_id: transfer.product_id,
            p_quantity_change: -transfer.quantity
          });

          // Increase stock in destination warehouse
          await supabase.rpc('update_warehouse_stock', {
            p_warehouse_id: transfer.to_warehouse_id,
            p_product_id: transfer.product_id,
            p_quantity_change: transfer.quantity
          });
        }
      }

      await fetchTransfers();
      await fetchWarehouseStock();
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating transfer status');
    }
  };

  const getWarehouseStock = (warehouseId: string, productId: string): number => {
    const stock = warehouseStock.find(s => s.warehouse_id === warehouseId && s.product_id === productId);
    return stock?.stock || 0;
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([fetchWarehouses(), fetchWarehouseStock(), fetchTransfers()]);
      setLoading(false);
    };

    initialize();
  }, []);

  return {
    warehouses,
    warehouseStock,
    transfers,
    loading,
    error,
    createTransfer,
    updateTransferStatus,
    getWarehouseStock,
    refetch: () => Promise.all([fetchWarehouses(), fetchWarehouseStock(), fetchTransfers()])
  };
}