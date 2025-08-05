import React, { useEffect, useState } from 'react';
import { FileText, User, ShoppingCart, DollarSign, Clock, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function HeaderOnly() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch orders directly without authentication dependency
  const fetchOrders = async () => {
    try {
      setLoading(true);
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
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching orders:', error);
        // If there's an error, show a placeholder
        setOrders([]);
        setLastOrder(null);
        return;
      }

      setOrders(data || []);
      
      if (data && data.length > 0) {
        const latest = data[0];
        const products = latest.sale_items?.map((item: any) => ({
          name: item.product_name,
          quantity: item.quantity
        })) || [];
        
        setLastOrder({
          id: latest.id,
          client_name: latest.client_name,
          total: latest.total,
          items_count: latest.sale_items?.length || 0,
          products: products,
          date: latest.created_at,
          status: latest.status
        });
      } else {
        setLastOrder(null);
      }
    } catch (err) {
      console.error('Error in fetchOrders:', err);
      setOrders([]);
      setLastOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchOrders();
    
    // Refresh every 5 seconds to get real-time updates
    const refreshInterval = setInterval(fetchOrders, 5000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-orange-500 mx-auto mb-8"></div>
          <p className="text-gray-600 text-2xl font-medium">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!lastOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl shadow-2xl p-16 border border-gray-200">
          <Package size={120} className="mx-auto text-gray-300 mb-8" />
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            No hay pedidos recientes
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Esperando el primer pedido del día...
          </p>
          <div className="text-lg text-gray-500">
            {currentTime.toLocaleString('es-MX', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'draft': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'PAGADO';
      case 'pending': return 'PENDIENTE';
      case 'draft': return 'GUARDADO';
      default: return status.toUpperCase();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-8">
      <div className="w-full max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">
            DURAN - PUNTO DE VENTA
          </h1>
          <div className="text-2xl text-gray-600 font-medium">
            {currentTime.toLocaleString('es-MX', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-orange-400 via-red-500 to-red-400 p-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              <h2 className="text-white font-bold text-4xl">ÚLTIMO PEDIDO REALIZADO</h2>
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* Left Column - Order Info */}
              <div className="space-y-8">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <FileText size={48} className="text-orange-600" />
                  </div>
                  <div className="text-gray-600 text-xl font-medium mb-2">FOLIO</div>
                  <div className="text-4xl font-bold text-orange-600 font-mono">
                    #{lastOrder.id.slice(-6).toUpperCase()}
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <User size={48} className="text-blue-600" />
                  </div>
                  <div className="text-gray-600 text-xl font-medium mb-2">CLIENTE</div>
                  <div className="text-3xl font-bold text-gray-800">
                    {lastOrder.client_name}
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <Clock size={48} className="text-purple-600" />
                  </div>
                  <div className="text-gray-600 text-xl font-medium mb-2">HORA</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {new Date(lastOrder.date).toLocaleTimeString('es-MX', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              {/* Center Column - Products */}
              <div className="space-y-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-6">
                    <ShoppingCart size={48} className="text-green-600" />
                  </div>
                  <div className="text-gray-600 text-xl font-medium mb-4">PRODUCTOS VENDIDOS</div>
                  <div className="text-3xl font-bold text-green-600 mb-8">
                    {lastOrder.items_count} ARTÍCULOS
                  </div>
                </div>

                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {lastOrder.products && lastOrder.products.map((product: any, index: number) => (
                    <div 
                      key={index} 
                      className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-lg font-bold text-gray-800 truncate">
                            {product.name}
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <span className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                            {product.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Total & Status */}
              <div className="space-y-8">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <DollarSign size={64} className="text-green-600" />
                  </div>
                  <div className="text-gray-600 text-xl font-medium mb-2">TOTAL</div>
                  <div className="text-6xl font-bold text-green-600 font-mono">
                    ${lastOrder.total.toLocaleString('es-MX')}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-gray-600 text-xl font-medium mb-4">ESTADO</div>
                  <div className={`inline-flex items-center px-8 py-4 rounded-2xl text-2xl font-bold ${getStatusColor(lastOrder.status)}`}>
                    <div className="w-4 h-4 rounded-full bg-current mr-4 animate-pulse"></div>
                    {getStatusText(lastOrder.status)}
                  </div>
                </div>

                <div className="text-center bg-gray-50 rounded-2xl p-6">
                  <div className="text-gray-600 text-lg font-medium mb-2">FECHA</div>
                  <div className="text-xl font-bold text-gray-800">
                    {new Date(lastOrder.date).toLocaleDateString('es-MX', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="text-gray-500 text-lg">
            Actualización automática en tiempo real
          </div>
        </div>
      </div>
    </div>
  );
}