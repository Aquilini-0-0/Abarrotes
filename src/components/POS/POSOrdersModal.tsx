import React, { useState } from 'react';
import { X, Search, Eye, Trash2, CreditCard, Edit } from 'lucide-react';
import { POSOrder } from '../../types/pos';

interface POSOrdersModalProps {
  orders: POSOrder[];
  onClose: () => void;
  onSelectOrder: (order: POSOrder) => void;
  onEditOrder?: (order: POSOrder) => void;
}

export function POSOrdersModal({ orders, onClose, onSelectOrder, onEditOrder }: POSOrdersModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'draft': return 'text-blue-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Sin Cobrar';
      case 'draft': return 'Borrador';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };
return ( 
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl lg:max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
      {/* Header sin degradado, fondo blanco */}
      <div className="bg-white p-2 sm:p-4 border-b border-gray-200 rounded-t-lg flex-shrink-0">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h2 className="text-gray-900 font-bold text-sm sm:text-lg lg:text-xl">Mis Pedidos</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 flex-shrink-0">
            <X size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          <div>
            <label className="block text-gray-600 text-xs sm:text-sm mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2 top-1.5 sm:top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100 text-gray-900 pl-6 sm:pl-8 pr-2 sm:pr-3 py-1 sm:py-2 rounded text-xs sm:text-sm"
                placeholder="Folio o cliente..."
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 text-xs sm:text-sm mb-1">Estatus</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-gray-100 text-gray-900 px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="pending">Sin Cobrar</option>
              <option value="paid">Pagado</option>
              <option value="draft">Borrador</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <div className="text-gray-600 text-xs sm:text-sm">
              Mostrando {filteredOrders.length} de {orders.length} pedidos
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto overflow-x-auto">
        <table className="w-full text-xs sm:text-sm min-w-[600px]">
          <thead className="bg-gray-100 sticky top-0 border-b border-gray-200">
            <tr>
              <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Folio</th>
              <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Fecha</th>
              <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Importe</th>
              <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Cliente</th>
              <th className="text-center p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Estatus</th>
              <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Vendedor</th>
              <th className="text-center p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, index) => (
              <tr
                key={order.id}
                className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
                onClick={() => onSelectOrder(order)}
              >
                <td className="p-1 sm:p-2 lg:p-3 font-mono text-blue-600">
                  {order.id.slice(-6).toUpperCase()}
                </td>
                <td className="p-1 sm:p-2 lg:p-3 text-gray-700">
                  {new Date(order.date).toLocaleDateString('es-MX')}
                </td>
                <td className="p-1 sm:p-2 lg:p-3 text-right font-mono text-green-600 font-bold">
                  ${order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-1 sm:p-2 lg:p-3 text-gray-900">
                  <div className="font-medium">
                    <span className="sm:hidden">{order.client_name.length > 10 ? `${order.client_name.substring(0, 10)}...` : order.client_name}</span>
                    <span className="hidden sm:inline">{order.client_name}</span>
                  </div>
                  {order.is_credit && (
                    <div className="text-[10px] sm:text-xs text-orange-500 flex items-center">
                      <CreditCard size={10} className="sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                      Crédito
                    </div>
                  )}
                </td>
                <td className="p-1 sm:p-2 lg:p-3 text-center">
                  <span className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                  {order.is_credit && order.status === 'pending' && (
                    <div className="text-[10px] sm:text-xs text-red-500 mt-0.5 sm:mt-1 flex items-center justify-center">
                      <CreditCard size={8} className="sm:w-2.5 sm:h-2.5 mr-0.5" />
                      Sin Pagar
                    </div>
                  )}
                </td>
                <td className="p-1 sm:p-2 lg:p-3 text-gray-700">
                  Usuario
                </td>
                <td className="p-1 sm:p-2 lg:p-3">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEditOrder) {
                          onEditOrder(order);
                        } else {
                          onSelectOrder(order);
                        }
                      }}
                      className="p-0.5 sm:p-1 text-blue-600 hover:text-blue-800"
                      title="Editar pedido"
                    >
                      <Edit size={12} className="sm:w-4 sm:h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrder(order);
                      }}
                      className="p-0.5 sm:p-1 text-green-600 hover:text-green-800"
                      title="Ver detalles"
                    >
                      <Eye size={12} className="sm:w-4 sm:h-4" />
                    </button>

                    {order.status === 'draft' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('¿Eliminar este pedido?')) {
                            // Handle delete
                          }
                        }}
                        className="p-0.5 sm:p-1 text-red-600 hover:text-red-500"
                        title="Eliminar"
                      >
                        <Trash2 size={12} className="sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 sm:p-8 text-center text-gray-500">
                  No se encontraron pedidos
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Summary con degradado naranja a rojo */}
      <div
        className="p-2 sm:p-4 border-t border-gray-200 rounded-b-lg text-white flex-shrink-0"
        style={{
          background: 'linear-gradient(90deg, #ff7f50, #d32f2f)', // naranja a rojo
        }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm font-semibold">
          <div className="text-center">
            <div className="text-[10px] sm:text-xs lg:text-sm">Total Pedidos</div>
            <div className="text-sm sm:text-base lg:text-lg font-bold">{filteredOrders.length}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] sm:text-xs lg:text-sm">Sin Cobrar</div>
            <div className="text-yellow-300 text-sm sm:text-base lg:text-lg font-bold">
              {filteredOrders.filter(o => o.status === 'pending').length}
            </div>
          </div>
          <div className="text-center lg:block hidden">
            <div className="text-[10px] sm:text-xs lg:text-sm">Pagados</div>
            <div className="text-green-200 text-sm sm:text-base lg:text-lg font-bold">
              {filteredOrders.filter(o => o.status === 'paid').length}
            </div>
          </div>
          <div className="text-center font-mono col-span-2 lg:col-span-1">
            <div className="text-[10px] sm:text-xs lg:text-sm">Importe Total</div>
            <div className="text-sm sm:text-base lg:text-lg font-bold">
              ${filteredOrders.reduce((sum, o) => sum + o.total, 0).toLocaleString('es-MX')}
            </div>
          </div>
          
          {/* Mostrar "Pagados" en móviles/tabletas como overlay o información adicional */}
          <div className="lg:hidden col-span-2 text-center text-[10px] sm:text-xs opacity-75 mt-1">
            Pagados: {filteredOrders.filter(o => o.status === 'paid').length}
          </div>
        </div>
      </div>
    </div>
  </div>
);



}