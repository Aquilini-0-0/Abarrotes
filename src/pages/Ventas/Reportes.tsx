import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useSales } from '../../hooks/useSales';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Eye, X } from 'lucide-react';

export function ReportesVentas() {
  const { sales, loading, error } = useSales();
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const columns = [
    { 
      key: 'date', 
      label: 'Fecha', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    { key: 'client_name', label: 'Cliente', sortable: true },
    { 
      key: 'total', 
      label: 'Total', 
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-green-600">
          ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'paid' ? 'bg-green-100 text-green-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value === 'paid' ? 'Pagado' : value === 'pending' ? 'Pendiente' : 'Vencido'}
        </span>
      )
    },
    {
      key: 'items',
      label: 'Productos',
      render: (items: any[]) => `${items.length} productos`
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, sale: any) => (
        <button
          onClick={() => {
            setSelectedSale(sale);
            setShowDetailModal(true);
          }}
          className="p-1 text-blue-600 hover:text-blue-800"
          title="Ver detalle"
        >
          <Eye size={16} />
        </button>
      )
    }
  ];

  const totalVentas = sales.reduce((sum, sale) => sum + sale.total, 0);
  const ventasPagadas = sales.filter(s => s.status === 'paid').reduce((sum, sale) => sum + sale.total, 0);
  const ventasPendientes = sales.filter(s => s.status === 'pending').reduce((sum, sale) => sum + sale.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reportes de Ventas</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Ventas Totales">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${totalVentas.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Acumulado</div>
            </div>
          </div>
        </Card>

        <Card title="Ventas Cobradas">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${ventasPagadas.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Efectivo</div>
            </div>
          </div>
        </Card>

        <Card title="Por Cobrar">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <ShoppingCart className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                ${ventasPendientes.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Pendiente</div>
            </div>
          </div>
        </Card>

        <Card title="Promedio Venta">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                ${(totalVentas / sales.length).toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Por venta</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Reporte de Ventas">
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Todos los clientes</option>
                  <option value="1">Supermercado El Águila</option>
                  <option value="2">Tienda La Esquina</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <DataTable
              data={sales}
              columns={columns}
              title="Historial de Ventas"
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Productos Más Vendidos">
            <div className="space-y-4">
              {['Aceite Comestible 1L', 'Arroz Blanco 1Kg', 'Leche Entera 1L'].map((producto, index) => (
                <div key={producto} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{producto}</div>
                    <div className="text-sm text-gray-500">#{index + 1} más vendido</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{50 - index * 10}</div>
                    <div className="text-xs text-gray-500">unidades</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Clientes Top">
            <div className="space-y-4">
              {sales.map((sale, index) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{sale.client_name}</div>
                    <div className="text-sm text-gray-500">#{index + 1} en ventas</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      ${sale.total.toLocaleString('es-MX')}
                    </div>
                    <div className="text-xs text-gray-500">total</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de Detalle de Venta */}
      {showDetailModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 p-4 border-b border-blue-700 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-xl">
                  Detalle de Venta - {selectedSale.id.slice(-6).toUpperCase()}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-blue-100 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Información de la Venta</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Folio:</span>
                      <span className="font-mono">{selectedSale.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-medium">{selectedSale.client_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span>{new Date(selectedSale.date).toLocaleDateString('es-MX')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedSale.status === 'paid' ? 'bg-green-100 text-green-800' :
                        selectedSale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedSale.status === 'paid' ? 'Pagado' : 
                         selectedSale.status === 'pending' ? 'Pendiente' : 'Vencido'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Resumen Financiero</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-mono">${selectedSale.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Descuentos:</span>
                      <span className="font-mono text-red-600">$0.00</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold text-gray-900">Total:</span>
                      <span className="font-bold text-green-600 text-lg">${selectedSale.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalle de Productos */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Productos Vendidos</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-gray-700 font-semibold">Producto</th>
                        <th className="text-center p-3 text-gray-700 font-semibold">Cantidad</th>
                        <th className="text-right p-3 text-gray-700 font-semibold">Precio Unit.</th>
                        <th className="text-right p-3 text-gray-700 font-semibold">Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSale.items.map((item: any, index: number) => (
                        <tr key={index} className={`border-b border-gray-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}>
                          <td className="p-3">
                            <div className="font-medium text-gray-900">{item.product_name}</div>
                            <div className="text-xs text-gray-500">ID: {item.product_id}</div>
                          </td>
                          <td className="p-3 text-center font-semibold text-blue-600">
                            {item.quantity}
                          </td>
                          <td className="p-3 text-right font-mono text-green-600">
                            ${item.price.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-gray-900">
                            ${item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td colSpan={3} className="p-3 text-right font-semibold text-gray-900">
                          TOTAL:
                        </td>
                        <td className="p-3 text-right font-bold text-green-600 text-lg">
                          ${selectedSale.total.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}