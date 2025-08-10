import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { POSProduct, POSOrder, POSOrderItem, CashRegister, POSClient } from '../types/pos';
import { useAuth } from '../context/AuthContext';

export function usePOS() {
  const { user } = useAuth();
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [clients, setClients] = useState<POSClient[]>([]);
  const [currentOrder, setCurrentOrder] = useState<POSOrder | null>(null);
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add refresh function to force re-fetch of all data
  const refreshAllData = async () => {
    await Promise.all([fetchProducts(), fetchClients(), fetchOrders()]);
  };

  // Fetch products with 5 price levels
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;

      const posProducts: POSProduct[] = data.map(product => ({
        id: product.id,
        name: product.name,
        code: product.code,
        line: product.line,
        subline: product.subline,
        unit: product.unit,
        stock: product.stock,
        prices: {
          price1: product.price,
          price2: product.price * 1.1, // 10% más
          price3: product.price * 1.2, // 20% más
          price4: product.price * 1.3, // 30% más
          price5: product.price * 1.4, // 40% más
        },
        status: product.status,
        has_tara: product.line === 'Granos' || product.line === 'Aceites' // Example logic
      }));

      setProducts(posProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching products');
    }
  };

  // Fetch clients
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;

      const posClients: POSClient[] = data.map(client => ({
        id: client.id,
        name: client.name,
        rfc: client.rfc,
        credit_limit: client.credit_limit,
        balance: client.balance,
        default_price_level: 1, // Default to price level 1
        zone: client.zone
      }));

      setClients(posClients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching clients');
    }
  };

  // Initialize new order
  const initializeOrder = (clientName: string = 'Cliente General', clientId?: string) => {
    const newOrder: POSOrder = {
      id: `temp-${Date.now()}`,
      client_id: clientId,
      client_name: clientName,
      date: new Date().toISOString().split('T')[0],
      items: [],
      subtotal: 0,
      discount_total: 0,
      total: 0,
      status: 'draft',
      is_credit: false,
      is_invoice: false,
      is_quote: false,
      is_external: false,
      created_by: user?.id || '',
      created_at: new Date().toISOString()
    };
    setCurrentOrder(newOrder);
    return newOrder;
  };

  // Add item to current order
  const addItemToOrder = (product: POSProduct, quantity: number, priceLevel: 1 | 2 | 3 | 4 | 5) => {
    if (!currentOrder) return;

    // Validate stock
    if (quantity > product.stock) {
      throw new Error(`Stock insuficiente. Disponible: ${product.stock} unidades`);
    }

    const unitPrice = product.prices[`price${priceLevel}`];
    const existingItemIndex = currentOrder.items.findIndex(
      item => item.product_id === product.id && item.price_level === priceLevel
    );

    let updatedItems: POSOrderItem[];

    if (existingItemIndex >= 0) {
      // Update existing item
      updatedItems = currentOrder.items.map((item, index) => 
        index === existingItemIndex 
          ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * unitPrice }
          : item
      );
    } else {
      // Add new item
      const newItem: POSOrderItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
        quantity,
        price_level: priceLevel,
        unit_price: unitPrice,
        total: quantity * unitPrice
      };
      updatedItems = [...currentOrder.items, newItem];
    }

    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const updatedOrder = {
      ...currentOrder,
      items: updatedItems,
      subtotal,
      total: subtotal - currentOrder.discount_total
    };

    setCurrentOrder(updatedOrder);
  };

  // Remove item from order
  const removeItemFromOrder = (itemId: string) => {
    if (!currentOrder) return;

    const updatedItems = currentOrder.items.filter(item => item.id !== itemId);
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const updatedOrder = {
      ...currentOrder,
      items: updatedItems,
      subtotal,
      total: subtotal - currentOrder.discount_total
    };

    setCurrentOrder(updatedOrder);
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (!currentOrder || newQuantity <= 0) return;

    // Find the item and product to validate stock
    const item = currentOrder.items.find(i => i.id === itemId);
    if (item) {
      const product = products.find(p => p.id === item.product_id);
      if (product && newQuantity > product.stock) {
        throw new Error(`Stock insuficiente. Disponible: ${product.stock} unidades`);
      }
    }

    const updatedItems = currentOrder.items.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.unit_price }
        : item
    );

    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const updatedOrder = {
      ...currentOrder,
      items: updatedItems,
      subtotal,
      total: subtotal - currentOrder.discount_total
    };

    setCurrentOrder(updatedOrder);
  };

  // Apply discount to order
  const applyDiscount = (discountAmount: number) => {
    if (!currentOrder) return;

    const updatedOrder = {
      ...currentOrder,
      discount_total: discountAmount,
      total: currentOrder.subtotal - discountAmount
    };

    setCurrentOrder(updatedOrder);
  };

  // Save order to database
  const saveOrder = async (order: POSOrder) => {
    try {
      // Validate stock for all items before saving
      for (const item of order.items) {
        const product = products.find(p => p.id === item.product_id);
        if (product && item.quantity > product.stock) {
          throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock} unidades`);
        }
      }

      // Create sale record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          client_id: order.client_id,
          client_name: order.client_name,
          date: order.date,
          total: order.total,
          status: order.payment_method === 'credit' || order.is_credit ? 'pending' : 'paid',
          created_by: order.created_by
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = order.items.map(item => ({
        sale_id: saleData.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.unit_price,
        total: item.total
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Create inventory movements and update stock
      // Only update stock if order is paid, not for saved/draft orders
      if (order.status === 'paid') {
        for (const item of order.items) {
          // Create inventory movement
          await supabase
            .from('inventory_movements')
            .insert({
              product_id: item.product_id,
              product_name: item.product_name,
              type: 'salida',
              quantity: item.quantity,
              date: order.date,
              reference: `POS-${saleData.id.slice(-6)}`,
              user_name: user?.name || 'POS User'
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
              .update({ stock: Math.max(0, product.stock - item.quantity) })
              .eq('id', item.product_id);
          }
        }
      }

      // Update client balance if credit sale
      if (order.is_credit && order.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('balance')
          .eq('id', order.client_id)
          .single();

        if (client) {
          await supabase
            .from('clients')
            .update({ balance: client.balance + order.total })
            .eq('id', order.client_id);
        }
      }

      await fetchOrders();
      return saleData;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error saving order');
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            product_id,
            product_name,
            quantity,
            price,
            total
          )
        `)
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const posOrders: POSOrder[] = data.map(sale => ({
        id: sale.id,
        client_id: sale.client_id,
        client_name: sale.client_name,
        date: sale.date,
        items: sale.sale_items.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_code: '',
          quantity: item.quantity,
          price_level: 1 as const,
          unit_price: item.price,
          total: item.total
        })),
        subtotal: sale.total,
        discount_total: 0,
        total: sale.total,
        status: sale.status === 'paid' ? 'paid' : 'pending',
        is_credit: sale.status === 'pending',
        is_invoice: false,
        is_quote: false,
        is_external: false,
        created_by: sale.created_by,
        created_at: sale.created_at
      }));

      setOrders(posOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching orders');
    }
  };

  // Open cash register
  const openCashRegister = async (openingAmount: number) => {
    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .insert({
          user_id: user?.id,
          opening_amount: openingAmount,
          total_sales: 0,
          total_cash: 0,
          total_card: 0,
          total_transfer: 0,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      setCashRegister(data);
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error opening cash register');
    }
  };

  // Close cash register
  const closeCashRegister = async (closingAmount: number) => {
    if (!cashRegister) return;

    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .update({
          closing_amount: closingAmount,
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', cashRegister.id)
        .select()
        .single();

      if (error) throw error;

      setCashRegister(data);
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error closing cash register');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchClients(), fetchOrders()]);
      setLoading(false);
    };

    if (user) {
      initialize();
    }
  }, [user]);

  return {
    products,
    clients,
    currentOrder,
    orders,
    cashRegister,
    loading,
    error,
    initializeOrder,
    addItemToOrder,
    removeItemFromOrder,
    updateItemQuantity,
    applyDiscount,
    saveOrder,
    openCashRegister,
    closeCashRegister,
    refetch: refreshAllData
  };
}