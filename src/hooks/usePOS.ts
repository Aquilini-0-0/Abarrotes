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
  const [productPriceOverrides, setProductPriceOverrides] = useState<Record<string, { price1?: number; price2?: number; price3?: number; price4?: number; price5?: number }>>({});

  // Check for existing open cash register on component mount
  const checkExistingCashRegister = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCashRegister(data);
      }
    } catch (err) {
      console.error('Error checking existing cash register:', err);
    }
  };

  // Add refresh function to force re-fetch of all data
  const refreshAllData = async () => {
    await Promise.all([fetchProducts(), fetchClients(), fetchOrders()]);
  };

  // Update product prices temporarily
  const updateProductPrices = (productId: string, prices: { price1?: number; price2?: number; price3?: number; price4?: number; price5?: number }) => {
    setProductPriceOverrides(prev => ({
      ...prev,
      [productId]: { ...prev[productId], ...prices }
    }));
  };

  // Get effective price for a product (with overrides)
  const getEffectivePrice = (product: POSProduct, level: 1 | 2 | 3 | 4 | 5): number => {
    const override = productPriceOverrides[product.id];
    if (override && override[`price${level}`] !== undefined) {
      return override[`price${level}`]!;
    }
    return product.prices[`price${level}`];
  };
  // Fetch products with 5 price levels
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, code, line, subline, unit, stock, price1, price2, price3, price4, price5, status')
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
        stock: Number(product.stock) || 0,
        prices: {
          price1: product.price1 || 0,
          price2: product.price2 || (product.price1 || 0) * 1.1,
          price3: product.price3 || (product.price1 || 0) * 1.2,
          price4: product.price4 || (product.price1 || 0) * 1.3,
          price5: product.price5 || (product.price1 || 0) * 1.4,
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
      console.log('Fetching clients for POS...');
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      
      console.log('Raw client data from database:', data);

      const posClients: POSClient[] = data.map(client => ({
        id: client.id,
        name: client.name,
        rfc: client.rfc,
        credit_limit: Number(client.credit_limit) || 0,
        balance: Number(client.balance) || 0,
        default_price_level: 1, // Default to price level 1
        zone: client.zone
      }));

      console.log('Formatted POS clients:', posClients);
      setClients(posClients);
    } catch (err) {
      console.error('Error in fetchClients:', err);
      setError(err instanceof Error ? err.message : 'Error fetching clients');
    }
  };

  // Initialize new order
  const initializeOrder = (clientName: string = 'Cliente General', clientId?: string): POSOrder => {
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
    return newOrder;
  };

  // Add item to current order
  const addItemToOrder = (order: POSOrder, product: POSProduct, quantity: number, priceLevel: 1 | 2 | 3 | 4 | 5, customUnitPrice?: number): POSOrder => {
    if (!order) throw new Error('No hay pedido activo');

    // Validate stock
    if (quantity > product.stock) {
      throw new Error(`Stock insuficiente. Disponible: ${product.stock} unidades`);
    }

    const unitPrice = customUnitPrice || getEffectivePrice(product, priceLevel);
    const existingItemIndex = order.items.findIndex(
      item => item.product_id === product.id && item.price_level === priceLevel
    );

    let updatedItems: POSOrderItem[];

    if (existingItemIndex >= 0) {
      // Update existing item
      updatedItems = order.items.map((item, index) => 
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
      updatedItems = [...order.items, newItem];
    }

    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    return {
      ...order,
      items: updatedItems,
      subtotal,
      total: subtotal - order.discount_total
    };
  };

  // Remove item from order
  const removeItemFromOrder = (order: POSOrder, itemId: string): POSOrder => {
    if (!order) throw new Error('No hay pedido activo');

    const updatedItems = order.items.filter(item => item.id !== itemId);
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    return {
      ...order,
      items: updatedItems,
      subtotal,
      total: subtotal - order.discount_total
    };
  };

  // Update item quantity
  const updateItemQuantity = (order: POSOrder, itemId: string, newQuantity: number): POSOrder => {
    if (!order || newQuantity <= 0) throw new Error('Cantidad inválida');

    // Find the item and product to validate stock
    const item = order.items.find(i => i.id === itemId);
    if (item) {
      const product = products.find(p => p.id === item.product_id);
      if (product && newQuantity > product.stock) {
        throw new Error(`Stock insuficiente. Disponible: ${product.stock} unidades`);
      }
    }

    const updatedItems = order.items.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.unit_price }
        : item
    );

    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    return {
      ...order,
      items: updatedItems,
      subtotal,
      total: subtotal - order.discount_total
    };
  };

  // Update item price and level
  const updateItemPrice = (order: POSOrder, itemId: string, newPriceLevel: 1 | 2 | 3 | 4 | 5, customPrice?: number): POSOrder => {
    if (!order) throw new Error('No hay pedido activo');

    const updatedItems = order.items.map(item => {
      if (item.id === itemId) {
        const product = products.find(p => p.id === item.product_id);
        if (!product) return item;

        const unitPrice = customPrice !== undefined ? customPrice : getEffectivePrice(product, newPriceLevel);
        return {
          ...item,
          price_level: newPriceLevel,
          unit_price: unitPrice,
          total: item.quantity * unitPrice
        };
      }
      return item;
    });

    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    return {
      ...order,
      items: updatedItems,
      subtotal,
      total: subtotal - order.discount_total
    };
  };
  // Apply discount to order
  const applyDiscount = (order: POSOrder, discountAmount: number): POSOrder => {
    if (!order) throw new Error('No hay pedido activo');

    return {
      ...order,
      discount_total: discountAmount,
      total: order.subtotal - discountAmount
    };
  };

  // Save order to database
  const saveOrder = async (order: POSOrder, stockOverride: boolean = false) => {
    try {
      // Validate stock before saving (unless overridden)
      if (!stockOverride) {
        for (const item of order.items) {
          const product = products.find(p => p.id === item.product_id);
          if (product && item.quantity > product.stock) {
            throw new Error(`No se puede guardar el pedido porque no hay stock suficiente para ${item.product_name}. Disponible: ${product.stock} unidades, Solicitado: ${item.quantity} unidades`);
          }
        }
      }

      let saleData;
      let isNewOrder = order.id.startsWith('temp-');
      
      // Check if this is an existing order (not temp)
      if (!isNewOrder) {
        // For existing orders, always save as pending when using save button
        // Payment processing should be done through the payment modal
        const { data: currentOrder, error: fetchError } = await supabase
          .from('sales')
          .select('amount_paid')
          .eq('id', order.id)
          .single();

        if (fetchError) throw fetchError;

        const amountPaid = currentOrder.amount_paid || 0;
        const newRemainingBalance = order.total - amountPaid;
        const newStatus = newRemainingBalance <= 0.01 ? 'paid' : 'pending';

        // Update existing order
        const { data: updatedSale, error: updateError } = await supabase
          .from('sales')
          .update({
            client_id: order.client_id,
            client_name: order.client_name,
            date: order.date,
            total: order.total,
            remaining_balance: newRemainingBalance,
            status: newStatus
          })
          .eq('id', order.id)
          .select()
          .single();

        if (updateError) throw updateError;
        saleData = updatedSale;

        // Delete existing sale items
        const { error: deleteItemsError } = await supabase
          .from('sale_items')
          .delete()
          .eq('sale_id', order.id);

        if (deleteItemsError) throw deleteItemsError;
      } else {
        // Create new sale record
        const { data: newSale, error: saleError } = await supabase
          .from('sales')
          .insert({
            client_id: order.client_id,
            client_name: order.client_name,
            date: order.date,
            total: order.total,
            status: order.status === 'draft' ? 'pending' : (order.status || 'pending'),
            amount_paid: 0,
            remaining_balance: order.total,
            created_by: order.created_by
          })
          .select()
          .single();

        if (saleError) throw saleError;
        saleData = newSale;
      }

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

      await fetchOrders();
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      // Trigger ERS sales sync
      window.dispatchEvent(new CustomEvent('posDataUpdate'));
      
      return saleData;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error saving order');
    }
  };

  // Process payment for an order
  const processPayment = async (orderId: string, paymentData: {
    amount: number;
    method: 'cash' | 'card' | 'transfer' | 'credit' | 'vales';
    reference?: string;
    selectedVale?: any;
    stockOverride?: boolean;
  }) => {
    try {
      // Get current order data
      const { data: orderData, error: orderError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            product_id,
            product_name,
            quantity,
            price,
            total
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Handle credit sales differently
      if (paymentData.method === 'credit') {
        // Update order to mark as credit (pending status) with remaining balance
        const { error: updateError } = await supabase
          .from('sales')
          .update({
            status: 'pending',
            amount_paid: 0,
            remaining_balance: orderData.total // This makes it appear in credit payments modal
          })
          .eq('id', orderId);

        if (updateError) throw updateError;

        // Update client balance for credit sale
        if (orderData.client_id) {
          const { data: client } = await supabase
            .from('clients')
            .select('balance')
            .eq('id', orderData.client_id)
            .single();

          if (client) {
            await supabase
              .from('clients')
              .update({ balance: client.balance + orderData.total })
              .eq('id', orderData.client_id);
          }
        }

        return { newAmountPaid: 0, newRemainingBalance: orderData.total, newStatus: 'pending' };
      } else {
        // For non-credit payments, process normally
        // Create payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            sale_id: orderId,
            amount: paymentData.amount,
            payment_method: paymentData.method,
            reference: paymentData.reference || `PAY-${Date.now().toString().slice(-6)}`,
            created_by: user?.id
          });

        if (paymentError) throw paymentError;

        // Calculate new totals
        const newAmountPaid = (orderData.amount_paid || 0) + paymentData.amount;
        const newRemainingBalance = Math.max(0, orderData.total - newAmountPaid);
        const newStatus = newRemainingBalance <= 0.01 ? 'paid' : 'pending';

        // Update order with payment info
        const { error: updateError } = await supabase
          .from('sales')
          .update({
            amount_paid: newAmountPaid,
            remaining_balance: newRemainingBalance,
            status: newStatus
          })
          .eq('id', orderId);

        if (updateError) throw updateError;

        // If fully paid, create inventory movements and update stock
        if (newStatus === 'paid') {
          // Check for negative stock and create notification for admin
          const stockIssues = [];
          
          for (const item of orderData.sale_items) {
            const { data: product } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.product_id)
              .single();

            if (product && item.quantity > product.stock) {
              stockIssues.push({
                product_name: item.product_name,
                required: item.quantity,
                available: product.stock,
                deficit: item.quantity - product.stock
              });
            }
          }

          // If there are stock issues and stockOverride was used, create notification for admin
          if (stockIssues.length > 0 && paymentData.stockOverride) {
            try {
              console.warn('ADMIN NOTIFICATION: Venta con stock negativo procesada', {
                orderId: orderId,
                user: user?.name,
                stockIssues: stockIssues,
                timestamp: new Date().toISOString()
              });
              
              // Create notification for admin in the database
              try {
                await supabase.from('admin_notifications').insert({
                  type: 'negative_stock_sale',
                  title: 'Venta con Stock Negativo',
                  message: `Venta procesada con stock insuficiente por ${user?.name}`,
                  data: { 
                    orderId, 
                    stockIssues,
                    user_name: user?.name,
                    sale_total: orderData.total
                  },
                  created_at: new Date().toISOString()
                }).select();
              } catch (notifError) {
                console.warn('Could not create admin notification (table may not exist):', notifError);
              }
            } catch (notificationError) {
              console.error('Error creating admin notification:', notificationError);
            }
          }

          // Handle vales payment
          if (paymentData.method === 'vales' && paymentData.selectedVale) {
            // Mark vale as used
            await supabase
              .from('vales_devolucion')
              .update({
                estatus: 'USADO',
                disponible: 0
              })
              .eq('id', paymentData.selectedVale.id);
          }
          
          for (const item of orderData.sale_items) {
            // Create inventory movement
            await supabase
              .from('inventory_movements')
              .insert({
                product_id: item.product_id,
                product_name: item.product_name,
                type: 'salida',
                quantity: item.quantity,
                date: orderData.date,
                reference: `POS-${orderId.slice(-6)}`,
                user_name: user?.name || 'POS User',
                created_by: user?.id
              });

            // Update product stock
            const { data: product } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.product_id)
              .single();

            if (product) {
              await supabase
                .from('products')
                .update({ stock: product.stock - item.quantity })
                .eq('id', item.product_id);
            }
          }

          // Update vale balance - only mark as used if balance reaches 0
          if (paymentData.method === 'vales' && paymentData.selectedVale) {
            const newValeBalance = paymentData.selectedVale.disponible - paymentData.amount;
            const newValeStatus = newValeBalance <= 0 ? 'USADO' : 'HABILITADO';
            
            await supabase
              .from('vales_devolucion')
              .update({
                disponible: Math.max(0, newValeBalance),
                estatus: newValeStatus
              })
              .eq('id', paymentData.selectedVale.id);
          }
        }

        // For non-credit payments, reduce client balance if they had previous credit
        if (paymentData.method !== 'credit' && orderData.client_id && newAmountPaid > 0) {
          const { data: client } = await supabase
            .from('clients')
            .select('balance')
            .eq('id', orderData.client_id)
            .single();

          if (client) {
            await supabase
              .from('clients')
              .update({ balance: Math.max(0, client.balance - paymentData.amount) })
              .eq('id', orderData.client_id);
          }
        }

        return { newAmountPaid, newRemainingBalance, newStatus };
      }

      await fetchOrders();
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      // Trigger ERS sales sync
      window.dispatchEvent(new CustomEvent('posDataUpdate'));
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error processing payment');
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
          ),
          payments (
            id,
            amount,
            payment_method,
            reference,
            date,
            created_at
          )
        `)
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
        subtotal: sale.total - (sale.amount_paid || 0),
        discount_total: 0,
        total: sale.remaining_balance || sale.total,
        status: sale.status,
        is_credit: sale.status === 'pending' && (sale.amount_paid || 0) === 0,
        is_invoice: false,
        is_quote: false,
        is_external: false,
        created_by: sale.created_by,
        created_at: sale.created_at,
        payments: sale.payments || []
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
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
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

      // Clear cash register to allow opening a new one
      setCashRegister(null);
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error closing cash register');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchClients(), fetchOrders(), checkExistingCashRegister()]);
      setLoading(false);
    };

    if (user) {
      initialize();
    }
  }, [user]);

  return {
    products,
    clients,
    orders,
    cashRegister,
    loading,
    error,
    initializeOrder,
    addItemToOrder,
    removeItemFromOrder,
    updateItemQuantity,
    updateItemPrice,
    applyDiscount,
    saveOrder,
    openCashRegister,
    closeCashRegister,
    updateProductPrices,
    getEffectivePrice,
    refetch: refreshAllData,
    processPayment
  };
}