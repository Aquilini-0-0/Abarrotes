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

// Mock warehouses since the table doesn't exist yet
const mockWarehouses: Warehouse[] = [
  { id: '1', name: 'Almacén Principal', location: 'Planta Baja', active: true },
  { id: '2', name: 'Almacén Secundario', location: 'Primer Piso', active: true },
  { id: '3', name: 'Almacén de Productos Terminados', location: 'Bodega A', active: true }
];

export function useWarehouseTransfers() {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>(mockWarehouses);
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStock[]>([]);
  const [transfers, setTransfers] = useState<WarehouseTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouses = async () => {
    // Using mock data since warehouses table doesn't exist
    setWarehouses(mockWarehouses);
  };

  const fetchWarehouseStock = async () => {
    try {
      // Get products and create mock warehouse stock
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, stock')
        .eq('status', 'active');

      if (error) throw error;

      // Create mock warehouse stock based on existing products
      const mockStock: WarehouseStock[] = [];
      products?.forEach(product => {
        mockWarehouses.forEach(warehouse => {
          mockStock.push({
            id: `${warehouse.id}-${product.id}`,
            warehouse_id: warehouse.id,
            warehouse_name: warehouse.name,
            product_id: product.id,
            product_name: product.name,
            stock: Math.floor(product.stock / mockWarehouses.length) // Distribute stock across warehouses
          });
        });
      });

      setWarehouseStock(mockStock);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching warehouse stock');
    }
  };

  const fetchTransfers = async () => {
    try {
      // Use inventory_movements as a proxy for transfers
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert inventory movements to transfer format
      const formattedTransfers: WarehouseTransfer[] = (data || []).map(item => ({
        id: item.id,
        from_warehouse_id: '1', // Default to main warehouse
        from_warehouse_name: 'Almacén Principal',
        to_warehouse_id: '2', // Default to secondary warehouse
        to_warehouse_name: 'Almacén Secundario',
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: Math.abs(item.quantity),
        status: item.type === 'entrada' ? 'completed' : 'pending',
        date: item.date,
        reference: item.reference,
        notes: `Movimiento de ${item.type}`,
        created_by: item.user_name,
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
      const availableStock = getWarehouseStock(transferData.from_warehouse_id, transferData.product_id);
      
      if (availableStock < transferData.quantity) {
        throw new Error('Stock insuficiente en el almacén de origen');
      }

      // Create an inventory movement as a proxy for the transfer
      const { data, error } = await supabase
        .from('inventory_movements')
        .insert([{
          product_id: transferData.product_id,
          product_name: transferData.product_name,
          type: 'salida',
          quantity: transferData.quantity,
          date: transferData.date,
          reference: transferData.reference,
          user_name: user?.name || 'Usuario',
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
      // Update the corresponding inventory movement
      const { data, error } = await supabase
        .from('inventory_movements')
        .update({ 
          type: status === 'completed' ? 'entrada' : 'salida'
        })
        .eq('id', transferId)
        .select()
        .single();

      if (error) throw error;

      await fetchTransfers();
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