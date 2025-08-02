import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  supplier_name: string;
  date: string;
  total: number;
  status: 'pending' | 'approved' | 'received' | 'cancelled';
  items: PurchaseItem[];
}

export interface PurchaseItem {
  id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  cost: number;
  total: number;
}

export function usePurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items (
            id,
            product_id,
            product_name,
            quantity,
            cost,
            total
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders: PurchaseOrder[] = data.map(order => ({
        id: order.id,
        supplier_id: order.supplier_id,
        supplier_name: order.supplier_name,
        date: order.date,
        total: order.total,
        status: order.status,
        items: order.purchase_order_items.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          cost: item.cost,
          total: item.total
        }))
      }));

      setOrders(formattedOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: Omit<PurchaseOrder, 'id'>) => {
    try {
      // Create the purchase order
      const { data: orderRecord, error: orderError } = await supabase
        .from('purchase_orders')
        .insert([{
          supplier_id: orderData.supplier_id,
          supplier_name: orderData.supplier_name,
          date: orderData.date,
          total: orderData.total,
          status: orderData.status
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create purchase order items
      const orderItems = orderData.items.map(item => ({
        purchase_order_id: orderRecord.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        cost: item.cost,
        total: item.total
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Always create inventory movements when creating purchase order
      for (const item of orderData.items) {
        await supabase
          .from('inventory_movements')
          .insert({
            product_id: item.product_id,
            product_name: item.product_name,
            type: 'entrada',
            quantity: item.quantity,
            date: orderData.date,
            reference: `COMP-${orderRecord.id.slice(-6)}`,
            user_name: 'Sistema Compras'
          });

        // Update product stock immediately
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock + item.quantity })
            .eq('id', item.product_id);
        }
      }

      const newOrder: PurchaseOrder = {
        id: orderRecord.id,
        supplier_id: orderRecord.supplier_id,
        supplier_name: orderRecord.supplier_name,
        date: orderRecord.date,
        total: orderRecord.total,
        status: orderRecord.status,
        items: orderData.items
      };

      setOrders(prev => [newOrder, ...prev]);
      return newOrder;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating purchase order');
    }
  };

  const updateOrderStatus = async (orderId: string, status: PurchaseOrder['status']) => {
    try {
      // Get order details for inventory movements
      const { data: orderData, error: orderError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items (
            product_id,
            product_name,
            quantity
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // Note: Inventory movements are created when the order is initially created
      // Status changes only update the order status, not inventory

      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating order status');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    refetch: fetchOrders
  };
}