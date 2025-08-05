import React, { useEffect, useState } from 'react';
import { FileText, User, ShoppingCart, DollarSign, Clock, Package, Calendar } from 'lucide-react';
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-8 border-orange-400 mx-auto mb-12 shadow-2xl"></div>
          <p className="text-white text-4xl font-bold tracking-wide">Cargando información...</p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!lastOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-blue-900 flex items-center justify-center p-8">
        <div className="text-center bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-3xl shadow-2xl p-20 border border-gray-300 max-w-4xl">
          <div className="relative mb-12">
            <Package size={160} className="mx-auto text-gray-400 mb-8 drop-shadow-lg" />
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-6xl font-bold text-gray-800 mb-6 tracking-tight">
            No hay pedidos recientes
          </h1>
          <p className="text-3xl text-gray-600 mb-12 font-medium">
            Esperando el primer pedido del día...
          </p>
          <div className="text-2xl text-gray-500 bg-white rounded-2xl p-6 shadow-inner border border-gray-200">
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
      case 'paid': return 'text-green-800 bg-gradient-to-r from-green-200 to-green-300 border-green-400';
      case 'pending': return 'text-yellow-800 bg-gradient-to-r from-yellow-200 to-yellow-300 border-yellow-400';
      case 'draft': return 'text-blue-800 bg-gradient-to-r from-blue-200 to-blue-300 border-blue-400';
      default: return 'text-gray-800 bg-gradient-to-r from-gray-200 to-gray-300 border-gray-400';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-blue-900 flex flex-col justify-center p-8">
      <div className="w-full max-w-8xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="relative inline-block mb-8">
            <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 tracking-wider drop-shadow-2xl">
              DURAN
            </h1>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-6 tracking-wide">
            PUNTO DE VENTA
          </h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl max-w-4xl mx-auto">
            <div className="text-3xl text-white font-medium mb-2">
              {currentTime.toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
            <div className="text-6xl font-bold text-orange-300 font-mono tracking-wider">
              {currentTime.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center space-x-6 mb-4">
                <div className="w-6 h-6 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                <h2 className="text-white font-black text-5xl tracking-wider drop-shadow-lg">
                  ÚLTIMO PEDIDO REALIZADO
                </h2>
                <div className="w-6 h-6 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
              </div>
              <div className="text-orange-100 text-xl font-medium">
                Actualización en tiempo real
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-20 translate-y-20"></div>
          </div>

          {/* Card Content */}
          <div className="p-12">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
              
              {/* Left Column - Order Info */}
              <div className="space-y-12">
                <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 shadow-lg border border-blue-200">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <FileText size={48} className="text-white" />
                  </div>
                  <div className="text-blue-600 text-2xl font-bold mb-3 tracking-wide">FOLIO</div>
                  <div className="text-6xl font-black text-blue-700 font-mono tracking-wider drop-shadow-sm">
                    #{lastOrder.id.slice(-6).toUpperCase()}
                  </div>
                </div>

                <div className="text-center bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-8 shadow-lg border border-green-200">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <User size={48} className="text-white" />
                  </div>
                  <div className="text-green-600 text-2xl font-bold mb-3 tracking-wide">CLIENTE</div>
                  <div className="text-4xl font-black text-green-700 leading-tight">
                    {lastOrder.client_name}
                  </div>
                </div>

                <div className="text-center bg-gradient-to-br from-purple-50 to-violet-100 rounded-3xl p-8 shadow-lg border border-purple-200">
                  <div className="bg-gradient-to-br from-purple-500 to-violet-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Clock size={48} className="text-white" />
                  </div>
                  <div className="text-purple-600 text-2xl font-bold mb-3 tracking-wide">HORA</div>
                  <div className="text-3xl font-black text-purple-700 font-mono">
                    {new Date(lastOrder.date).toLocaleTimeString('es-MX', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              {/* Center Column - Products */}
              <div className="space-y-8">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                    <ShoppingCart size={56} className="text-white" />
                  </div>
                  <div className="text-orange-600 text-3xl font-bold mb-6 tracking-wide">PRODUCTOS VENDIDOS</div>
                  <div className="text-7xl font-black text-orange-700 mb-12 drop-shadow-lg">
                    {lastOrder.items_count}
                  </div>
                  <div className="text-2xl font-bold text-gray-600 tracking-wide">ARTÍCULOS</div>
                </div>

                <div className="space-y-6 max-h-96 overflow-y-auto custom-scrollbar">
                  {lastOrder.products && lastOrder.products.map((product: any, index: number) => (
                    <div 
                      key={index} 
                      className="bg-gradient-to-r from-orange-100 via-red-100 to-pink-100 border-2 border-orange-300 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-2xl font-bold text-gray-800 truncate leading-tight">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">Producto #{index + 1}</div>
                        </div>
                        <div className="ml-6 flex-shrink-0">
                          <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white px-8 py-4 rounded-2xl font-black text-3xl shadow-xl">
                            {product.quantity}
                          </div>
                          <div className="text-center text-xs text-gray-500 mt-2 font-medium">UNIDADES</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Total & Status */}
              <div className="space-y-12">
                <div className="text-center bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-8 shadow-lg border border-green-200">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                    <DollarSign size={64} className="text-white" />
                  </div>
                  <div className="text-green-600 text-3xl font-bold mb-6 tracking-wide">TOTAL</div>
                  <div className="text-8xl font-black text-green-700 font-mono tracking-wider drop-shadow-lg">
                    ${lastOrder.total.toLocaleString('es-MX')}
                  </div>
                </div>

                <div className="text-center bg-gradient-to-br from-gray-50 to-slate-100 rounded-3xl p-8 shadow-lg border border-gray-200">
                  <div className="text-gray-600 text-2xl font-bold mb-6 tracking-wide">ESTADO</div>
                  <div className={`inline-flex items-center px-12 py-6 rounded-3xl text-3xl font-black border-2 shadow-xl ${getStatusColor(lastOrder.status)}`}>
                    <div className="w-6 h-6 rounded-full bg-current mr-6 animate-pulse shadow-lg"></div>
                    {getStatusText(lastOrder.status)}
                  </div>
                </div>

                <div className="text-center bg-gradient-to-br from-yellow-50 to-amber-100 rounded-3xl p-8 shadow-lg border border-yellow-200">
                  <div className="bg-gradient-to-br from-yellow-500 to-amber-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Calendar size={48} className="text-white" />
                  </div>
                  <div className="text-yellow-600 text-2xl font-bold mb-4 tracking-wide">FECHA</div>
                  <div className="text-2xl font-bold text-yellow-700 leading-relaxed">
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
        <div className="text-center mt-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              <div className="text-white text-2xl font-bold">Sistema Activo</div>
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="text-blue-200 text-lg font-medium">
              Actualización automática cada 5 segundos
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}