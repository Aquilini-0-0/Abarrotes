import React, { useState } from 'react';
import { X, Search, Eye, Trash2, CreditCard } from 'lucide-react';
import { POSOrder } from '../../types/pos';

interface POSOrdersModalProps {
  orders: POSOrder[];
  onClose: () => void;
  onSelectOrder: (order: POSOrder) => void;
}

export function POSOrdersModal({ orders, onClose, onSelectOrder }: POSOrdersModalProps) {
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
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
      {/* Header sin degradado, fondo blanco */}
      <div className="bg-white p-4 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900 font-bold text-xl">Mis Pedidos</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-600 text-sm mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100 text-gray-900 pl-8 pr-3 py-2 rounded"
                placeholder="Folio o cliente..."
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-1">Estatus</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-gray-100 text-gray-900 px-3 py-2 rounded"
            >
              <option value="">Todos</option>
              <option value="pending">Sin Cobrar</option>
              <option value="paid">Pagado</option>
              <option value="draft">Borrador</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-gray-600 text-sm">
              Mostrando {filteredOrders.length} de {orders.length} pedidos
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0 border-b border-gray-200">
            <tr>
              <th className="text-left p-3 text-gray-700">Folio</th>
              <th className="text-left p-3 text-gray-700">Fecha</th>
              <th className="text-right p-3 text-gray-700">Importe</th>
              <th className="text-left p-3 text-gray-700">Cliente</th>
              <th className="text-center p-3 text-gray-700">Estatus</th>
              <th className="text-left p-3 text-gray-700">Vendedor</th>
              <th className="text-center p-3 text-gray-700">Acciones</th>
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
                <td className="p-3 font-mono text-blue-600">
                  {order.id.slice(-6).toUpperCase()}
                </td>
                <td className="p-3 text-gray-700">
                  {new Date(order.date).toLocaleDateString('es-MX')}
                </td>
                <td className="p-3 text-right font-mono text-green-600 font-bold">
                  ${order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-gray-900">
                  <div className="font-medium">{order.client_name}</div>
                  {order.is_credit && (
                    <div className="text-xs text-orange-500 flex items-center">
                      <CreditCard size={12} className="mr-1" />
                      Crédito
                    </div>
                  )}
                </td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                  {order.is_credit && order.status === 'pending' && (
                    <div className="text-xs text-red-500 mt-1 flex items-center justify-center">
                      <CreditCard size={10} className="mr-1" />
                      Sin Pagar
                    </div>
                  )}
                </td>
                <td className="p-3 text-gray-700">
                  Usuario
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrder(order);
                      }}
                      className="p-1 text-blue-600 hover:text-blue-500"
                      title="Ver detalles"
                    >
                      <Eye size={16} />
                    </button>

                    {order.status === 'draft' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('¿Eliminar este pedido?')) {
                            // Handle delete
                          }
                        }}
                        className="p-1 text-red-600 hover:text-red-500"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No se encontraron pedidos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary con degradado naranja a rojo */}
      <div
        className="p-4 border-t border-gray-200 rounded-b-lg text-white"
        style={{
          background: 'linear-gradient(90deg, #ff7f50, #d32f2f)', // naranja a rojo
        }}
      >
        <div className="grid grid-cols-4 gap-4 text-sm font-semibold">
          <div className="text-center">
            <div>Total Pedidos</div>
            <div>{filteredOrders.length}</div>
          </div>
          <div className="text-center">
            <div>Sin Cobrar</div>
            <div className="text-yellow-300">
              {filteredOrders.filter(o => o.status === 'pending').length}
            </div>
          </div>
          <div className="text-center">
            <div>Pagados</div>
            <div className="text-green-200">
              {filteredOrders.filter(o => o.status === 'paid').length}
            </div>
          </div>
          <div className="text-center font-mono">
            <div>Importe Total</div>
            <div>
              ${filteredOrders.reduce((sum, o) => sum + o.total, 0).toLocaleString('es-MX')}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);



}