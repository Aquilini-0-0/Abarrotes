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
        default_price_level: client.default_price_level || 1,
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
  const initializeOrder = (clientName: string = 'Cliente General', clientId: string | null = null): POSOrder => {
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
  function applyDiscount(order: POSOrder, discountAmount: number): POSOrder {
    if (!order) throw new Error('No hay pedido activo');
    
    const updatedOrder = {
      ...order,
      discount_total: discountAmount,
      total: order.subtotal - discountAmount
    };
    
    return updatedOrder;
  }

  // Save order to database
  const saveOrder = async (order: POSOrder, stockOverride: boolean = false): Promise<POSOrder> => {
    try {
      // Get warehouse distributions from POSLayout state
      const currentWarehouseDistributions = (window as any).currentWarehouseDistributions || {};
      
      // Validate stock before saving (unless overridden)
      if (!stockOverride) {
        for (const item of order.items) {
          const product = products.find(p => p.id === item.product_id);
          if (product && item.quantity > product.stock) {
            throw new Error(`No se puede guardar el pedido porque no hay stock suficiente para ${item.product_name}. Disponible: ${product.stock} unidades, Solicitado: ${item.quantity} unidades`);
          }
        }
      }

      // Map POS order status to valid database status
      const mapStatusToDatabase = (posStatus: string): 'pending' | 'paid' | 'overdue' | 'saved' => {
        switch (posStatus) {
          case 'draft':
            return 'pending';
          case 'cancelled':
            return 'overdue';
          case 'saved':
            return 'saved';
          case 'paid':
            return 'paid';
          case 'pending':
            return 'pending';
          default:
            return 'pending';
        }
      };

      // Helper function to check if ID is a valid UUID
      const isValidUUID = (id: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
      };

      let saleData;
      let isNewOrder = order.id.startsWith('temp-') || !isValidUUID(order.id);
      
      // Check if this is an existing order (not temp)
      if (!isNewOrder) {
        // For existing orders, get the previous items to calculate stock differences
        const { data: previousOrder, error: fetchPreviousError } = await supabase
          .from('sales')
          .select(`
            *,
            sale_items (
              product_id,
              quantity
            ),
            order_warehouse_distribution (
              product_id,
              warehouse_id,
              quantity
            )
          `)
          .eq('id', order.id)
          .single();

        if (fetchPreviousError) throw fetchPreviousError;

        // Calculate differences between previous and current items
        const stockDifferences: Record<string, number> = {};
        const warehouseDifferences: Record<string, Record<string, number>> = {};

        // Calculate current totals by product
        const currentTotals: Record<string, number> = {};
        order.items.forEach(item => {
          currentTotals[item.product_id] = (currentTotals[item.product_id] || 0) + item.quantity;
        });

        // Calculate previous totals by product
        const previousTotals: Record<string, number> = {};
        previousOrder.sale_items.forEach((item: any) => {
          previousTotals[item.product_id] = (previousTotals[item.product_id] || 0) + item.quantity;
        });

        // Calculate differences
        Object.keys(currentTotals).forEach(productId => {
          const currentQty = currentTotals[productId] || 0;
          const previousQty = previousTotals[productId] || 0;
          const difference = currentQty - previousQty;
          if (difference !== 0) {
            stockDifferences[productId] = difference;
          }
        });

        // Handle products that were completely removed
        Object.keys(previousTotals).forEach(productId => {
          if (!currentTotals[productId]) {
            stockDifferences[productId] = -previousTotals[productId];
          }
        });

        // For existing orders, always save as pending when using save button
        // Payment processing should be done through the payment modal
        const { data: currentOrderData, error: fetchError } = await supabase
          .from('sales')
          .select('amount_paid')
          .eq('id', order.id)
          .single();

        if (fetchError) throw fetchError;

        const amountPaid = currentOrderData.amount_paid || 0;
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
        // Delete existing warehouse distribution
        const { error: deleteDistributionError } = await supabase
          .from('order_warehouse_distribution')
          .delete()
          .eq('order_id', order.id);

        if (deleteDistributionError) throw deleteDistributionError;

        // Update stock for differences only
        for (const [productId, difference] of Object.entries(stockDifferences)) {
          if (difference !== 0) {
            // Update general product stock
            const { data: product } = await supabase
              .from('products')
              .select('stock')
              .eq('id', productId)
              .single();

            if (product) {
              await supabase
                .from('products')
                .update({ stock: Math.max(0, product.stock - difference) })
                .eq('id', productId);
            }

            // Update warehouse stock based on new distribution
            const productDistribution = currentWarehouseDistributions[productId];
            if (productDistribution && productDistribution.length > 0) {
              for (const dist of productDistribution) {
                const { data: warehouseStock, error: warehouseError } = await supabase
                  .from('stock_almacenes')
                  .select('stock')
                  .eq('almacen_id', dist.warehouse_id)
                  .eq('product_id', productId)
                  .maybeSingle();

                if (warehouseError && warehouseError.code !== 'PGRST116') {
                  throw warehouseError;
                }

                const currentWarehouseStock = warehouseStock?.stock || 0;
                const newWarehouseStock = currentWarehouseStock - dist.quantity;

                if (warehouseStock) {
                  await supabase
                    .from('stock_almacenes')
                    .update({ stock: Math.max(0, newWarehouseStock) })
                    .eq('almacen_id', dist.warehouse_id)
                    .eq('product_id', productId);
                } else {
                  await supabase
                    .from('stock_almacenes')
                    .insert({
                      almacen_id: dist.warehouse_id,
                      product_id: productId,
                      stock: Math.max(0, newWarehouseStock)
                    });
                }
              }
            }

            // Create inventory movement for the difference
            if (difference > 0) {
              const product = products.find(p => p.id === productId);
              await supabase
                .from('inventory_movements')
                .insert({
                  product_id: productId,
                  product_name: product?.name || 'Producto',
                  type: 'salida',
                  quantity: difference,
                  date: order.date,
                  reference: `EDIT-${order.id.slice(-6)}`,
                  user_name: user?.name || 'POS User',
                  created_by: user?.id
                });
            }
          }
        }
        // Create new sale record
        const { data: newSale, error: saleError } = await supabase
          .from('sales')
          .insert({
            client_id: order.client_id,
            client_name: order.client_name,
            date: order.date,
            total: order.total,
            status: mapStatusToDatabase(order.status || 'pending'),
            amount_paid: 0,
            remaining_balance: order.total,
            created_by: order.created_by
          })
          .select()
          .single();

        if (saleError) throw saleError;
        saleData = newSale;

        // For new orders, update stock immediately when saving
        for (const item of order.items) {
          // Update general product stock
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

          // Update warehouse stock based on distribution
          const productDistribution = currentWarehouseDistributions[item.product_id];
          if (productDistribution && productDistribution.length > 0) {
            for (const dist of productDistribution) {
              const { data: warehouseStock, error: warehouseError } = await supabase
                .from('stock_almacenes')
                .select('stock')
                .eq('almacen_id', dist.warehouse_id)
                .eq('product_id', item.product_id)
                .maybeSingle();

              if (warehouseError && warehouseError.code !== 'PGRST116') {
                throw warehouseError;
              }

              const currentWarehouseStock = warehouseStock?.stock || 0;
              const newWarehouseStock = currentWarehouseStock - dist.quantity;

              if (warehouseStock) {
                await supabase
                  .from('stock_almacenes')
                  .update({ stock: Math.max(0, newWarehouseStock) })
                  .eq('almacen_id', dist.warehouse_id)
                  .eq('product_id', item.product_id);
              } else {
                await supabase
                  .from('stock_almacenes')
                  .insert({
                    almacen_id: dist.warehouse_id,
                    product_id: item.product_id,
                    stock: Math.max(0, newWarehouseStock)
                  });
              }
            }
          }

          // Create inventory movement
          await supabase
            .from('inventory_movements')
            .insert({
              product_id: item.product_id,
              product_name: item.product_name,
              type: 'salida',
              quantity: item.quantity,
              date: order.date,
              reference: `SAVE-${saleData.id.slice(-6)}`,
              user_name: user?.name || 'POS User',
              created_by: user?.id
            });
        }
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

      // Save warehouse distribution if available
      if (Object.keys(currentWarehouseDistributions).length > 0) {
        const distributionRecords = [];
        
        for (const [productId, distributions] of Object.entries(currentWarehouseDistributions)) {
          const distributionArray = distributions as Array<{warehouse_id: string; warehouse_name: string; quantity: number}>;
          for (const dist of distributionArray) {
            distributionRecords.push({
              order_id: saleData.id,
              product_id: productId,
              warehouse_id: dist.warehouse_id,
              warehouse_name: dist.warehouse_name,
              quantity: dist.quantity
            });
          }
        }
        
        if (distributionRecords.length > 0) {
          const { error: distributionError } = await supabase
            .from('order_warehouse_distribution')
            .insert(distributionRecords);

          if (distributionError) {
            console.error('Error saving warehouse distribution:', distributionError);
            // Don't throw error, just log it as this is not critical for order saving
          }
        }
      }

      await fetchOrders();
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      // Trigger ERS sales sync
      window.dispatchEvent(new CustomEvent('posDataUpdate'));
      
      // Return a complete POSOrder object with the database ID
      const savedOrder: POSOrder = {
        ...order,
        id: saleData.id,
        status: saleData.status,
        created_at: saleData.created_at,
        amount_paid: saleData.amount_paid || 0,
        remaining_balance: saleData.remaining_balance || saleData.total
      };
      
      return savedOrder;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error saving order');
    }
  };

  // Process payment for an order
  const processPayment = async (orderId: string, paymentData: {
    amount: number;
    method: 'cash' | 'card' | 'transfer' | 'credit' | 'vales' | 'mixed';
    reference?: string;
    selectedVale?: any;
    stockOverride?: boolean;
    valeAmount?: number;
    cashAmount?: number;
    breakdown?: {
      cash: number;
      card: number;
      transfer: number;
      credit: number;
    };
  }) => {
    try {
      // Get warehouse distribution from database for this order
      const { data: savedDistribution, error: distributionError } = await supabase
        .from('order_warehouse_distribution')
        .select('*')
        .eq('order_id', orderId);

      if (distributionError) {
        console.error('Error fetching warehouse distribution:', distributionError);
      }

      // Convert to the expected format
      const warehouseDistribution: Record<string, Array<{warehouse_id: string; warehouse_name: string; quantity: number}>> = {};
      if (savedDistribution && savedDistribution.length > 0) {
        savedDistribution.forEach(dist => {
          if (!warehouseDistribution[dist.product_id]) {
            warehouseDistribution[dist.product_id] = [];
          }
          warehouseDistribution[dist.product_id].push({
            warehouse_id: dist.warehouse_id,
            warehouse_name: dist.warehouse_name,
            quantity: dist.quantity
          });
        });
      }

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

      // Handle mixed payment with credit
      if (paymentData.method === 'mixed' && paymentData.breakdown && paymentData.breakdown.credit > 0) {
        const cashCardTransferTotal = paymentData.breakdown.cash + paymentData.breakdown.card + paymentData.breakdown.transfer;
        const creditAmount = paymentData.breakdown.credit;

        // Process the cash/card/transfer portion first
        if (cashCardTransferTotal > 0) {
          await supabase.from('payments').insert({
            sale_id: orderId,
            amount: cashCardTransferTotal,
            payment_method: 'cash', // Simplified for mixed payments
            reference: paymentData.reference || `MIX-${Date.now().toString().slice(-6)}`,
            created_by: user?.id
          });
        }

        // Update sale: status = pending, amount_paid = cash+card+transfer, remaining_balance = credit
        const { error: updateError } = await supabase
          .from('sales')
          .update({
            total: orderData.total, // Keep original total
            amount_paid: cashCardTransferTotal,
            remaining_balance: creditAmount,
            status: 'pending' // Mark as pending since there's credit remaining
          })
          .eq('id', orderId);

        if (updateError) throw updateError;

        // Update client balance for the credit portion
        if (orderData.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('balance')
            .eq('id', orderData.client_id)
            .single();

          if (clientData) {
            await supabase
              .from('clients')
              .update({ balance: clientData.balance + creditAmount })
              .eq('id', orderData.client_id);
          }
        }

        return { newAmountPaid: cashCardTransferTotal, newRemainingBalance: creditAmount, newStatus: 'pending' };
      } else if (paymentData.method === 'mixed' && paymentData.breakdown && paymentData.breakdown.credit === 0) {
        // Mixed payment WITHOUT credit - mark as paid
        const totalPaid = paymentData.breakdown.cash + paymentData.breakdown.card + paymentData.breakdown.transfer;
        
        // Create payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            sale_id: orderId,
            amount: totalPaid,
            payment_method: 'cash', // Simplified for mixed payments
            reference: paymentData.reference || `MIX-${Date.now().toString().slice(-6)}`,
            created_by: user?.id
          });

        if (paymentError) throw paymentError;

        // Update sale: status = paid, amount_paid = total, remaining_balance = 0
        const { error: updateError } = await supabase
          .from('sales')
          .update({
            total: orderData.total, // Keep original total
            amount_paid: totalPaid,
            remaining_balance: 0,
            status: 'paid' // Mark as paid since no credit
          })
          .eq('id', orderId);

        if (updateError) throw updateError;

        // Process inventory movements and update stock for paid orders
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

        return { newAmountPaid: totalPaid, newRemainingBalance: 0, newStatus: 'paid' };
      }

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

        // Process inventory movements and update stock for credit sales too
        if (Object.keys(warehouseDistribution).length > 0) {
          for (const item of orderData.sale_items) {
            const distribution = warehouseDistribution[item.product_id];
            
            if (distribution && distribution.length > 0) {
              // Create inventory movement for each warehouse
              for (const dist of distribution) {
                await supabase
                  .from('inventory_movements')
                  .insert({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    type: 'salida',
                    quantity: dist.quantity,
                    date: orderData.date,
                    reference: `POS-CREDIT-${orderId.slice(-6)}-${dist.warehouse_name}`,
                    user_name: user?.name || 'POS User',
                    created_by: user?.id
                  });
              }

              // Update warehouse stocks
              for (const dist of distribution) {
                const { data: currentStock, error: fetchError } = await supabase
                  .from('stock_almacenes')
                  .select('stock')
                  .eq('almacen_id', dist.warehouse_id)
                  .eq('product_id', item.product_id)
                  .maybeSingle();

                if (fetchError && fetchError.code !== 'PGRST116') {
                  throw fetchError;
                }

                const newStock = (currentStock?.stock || 0) - dist.quantity;
                
                if (currentStock) {
                  // Update existing warehouse stock
                  await supabase
                    .from('stock_almacenes')
                    .update({ stock: Math.max(0, newStock) })
                    .eq('almacen_id', dist.warehouse_id)
                    .eq('product_id', item.product_id);
                } else {
                  // Create new warehouse stock record if it doesn't exist
                  await supabase
                    .from('stock_almacenes')
                    .insert({
                      almacen_id: dist.warehouse_id,
                      product_id: item.product_id,
                      stock: Math.max(0, newStock)
                    });
                }
              }
              
              // Update main product stock with total quantity
              const totalQuantityToReduce = distribution.reduce((sum, dist) => sum + dist.quantity, 0);
              const { data: product } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.product_id)
                .single();

              if (product) {
                await supabase
                  .from('products')
                  .update({ stock: Math.max(0, product.stock - totalQuantityToReduce) })
                  .eq('id', item.product_id);
              }
            } else {
              // Fallback to original behavior if no distribution
              // Create inventory movement
              await supabase
                .from('inventory_movements')
                .insert({
                  product_id: item.product_id,
                  product_name: item.product_name,
                  type: 'salida',
                  quantity: item.quantity,
                  date: orderData.date,
                  reference: `POS-CREDIT-${orderId.slice(-6)}`,
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
          }
        } else {
          // Original stock update logic when no warehouse distribution
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
                reference: `POS-CREDIT-${orderId.slice(-6)}`,
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
        }
        
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
      } else if (paymentData.method === 'vales' && paymentData.selectedVale) {
        // Handle vale payment - save only the cash amount paid
        const valeAmount = paymentData.valeAmount || Math.min(paymentData.selectedVale.disponible, orderData.total);
        const cashAmount = paymentData.cashAmount || Math.max(0, orderData.total - valeAmount);
        const totalPaidInCash = cashAmount; // Only the cash portion
        
        // Create payment record for cash portion only
        if (cashAmount > 0) {
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              sale_id: orderId,
              amount: cashAmount,
              payment_method: 'cash',
              reference: paymentData.reference || `VALE-CASH-${Date.now().toString().slice(-6)}`,
              created_by: user?.id
            });

          if (paymentError) throw paymentError;
        }

        // Update vale balance
        const newValeBalance = paymentData.selectedVale.disponible - valeAmount;
        const newValeStatus = newValeBalance <= 0 ? 'USADO' : 'HABILITADO';
        
        await supabase
          .from('vales_devolucion')
          .update({
            disponible: Math.max(0, newValeBalance),
            estatus: newValeStatus
          })
          .eq('id', paymentData.selectedVale.id);

        // Calculate new totals - save only cash amount as the total
        const newAmountPaid = (orderData.amount_paid || 0) + cashAmount;
        const adjustedTotal = cashAmount; // Save only the cash amount as total
        const newRemainingBalance = 0; // Fully paid since vale covered the rest
        const newStatus = 'paid';

        // Update order with adjusted total (cash amount only)
        const { error: updateError } = await supabase
          .from('sales')
          .update({
            total: adjustedTotal, // Save only cash amount
            amount_paid: newAmountPaid,
            remaining_balance: newRemainingBalance,
            status: newStatus
          })
          .eq('id', orderId);

        if (updateError) throw updateError;

        // Process inventory movements for the full order (regardless of payment method)
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
              reference: `POS-VALE-${orderId.slice(-6)}`,
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

        return { newAmountPaid, newRemainingBalance, newStatus };
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
          
          // Update stock based on saved warehouse distribution
          if (Object.keys(warehouseDistribution).length > 0) {
            for (const item of orderData.sale_items) {
              const distribution = warehouseDistribution[item.product_id];
              
              if (distribution && distribution.length > 0) {
                // Create inventory movement for each warehouse
                for (const dist of distribution) {
                  await supabase
                    .from('inventory_movements')
                    .insert({
                      product_id: item.product_id,
                      product_name: item.product_name,
                      type: 'salida',
                      quantity: dist.quantity,
                      date: orderData.date,
                      reference: `POS-${orderId.slice(-6)}-${dist.warehouse_name}`,
                      user_name: user?.name || 'POS User',
                      created_by: user?.id
                    });
                }

                // Update warehouse stocks
                for (const dist of distribution) {
                  const { data: currentStock, error: fetchError } = await supabase
                    .from('stock_almacenes')
                    .select('stock')
                    .eq('almacen_id', dist.warehouse_id)
                    .eq('product_id', item.product_id)
                    .maybeSingle();

                  if (fetchError && fetchError.code !== 'PGRST116') {
                    throw fetchError;
                  }

                  const newStock = (currentStock?.stock || 0) - dist.quantity;
                  
                  if (currentStock) {
                    // Update existing warehouse stock
                    await supabase
                      .from('stock_almacenes')
                      .update({ stock: Math.max(0, newStock) })
                      .eq('almacen_id', dist.warehouse_id)
                      .eq('product_id', item.product_id);
                  } else {
                    // Create new warehouse stock record if it doesn't exist
                    await supabase
                      .from('stock_almacenes')
                      .insert({
                        almacen_id: dist.warehouse_id,
                        product_id: item.product_id,
                        stock: Math.max(0, newStock)
                      });
                  }
                }
                
                // Update main product stock with total quantity
                const totalQuantityToReduce = distribution.reduce((sum, dist) => sum + dist.quantity, 0);
                const { data: product } = await supabase
                  .from('products')
                  .select('stock')
                  .eq('id', item.product_id)
                  .single();

                if (product) {
                  await supabase
                    .from('products')
                    .update({ stock: Math.max(0, product.stock - totalQuantityToReduce) })
                    .eq('id', item.product_id);
                }
              } else {
                // Fallback to original behavior if no distribution
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
            }
          } else {
            // Original stock update logic when no warehouse distribution
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
      
      // Update the total_sales in the database with actual calculated sales
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total')
        .eq('created_by', user?.id)
        .gte('created_at', cashRegister.opened_at)
        .lte('created_at', new Date().toISOString());

      if (!salesError && salesData) {
        const actualTotalSales = salesData.reduce((sum, sale) => sum + sale.total, 0);
        
        // Update the cash register with the actual total sales
        await supabase
          .from('cash_registers')
          .update({ total_sales: actualTotalSales })
          .eq('id', cashRegister.id);
      }
      
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