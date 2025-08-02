import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { useSuppliers } from '../../hooks/useSuppliers';
import { BarChart3, TrendingUp, DollarSign, Calendar } from 'lucide-react';

export function ReporteCompras() {
  const { orders, loading } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    proveedor: '',
    estado: ''
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Flatten orders with items for detailed report
  const comprasDetalladas = orders.flatMap(order => 
    order.items.map(item => ({
      id: `${order.id}-${item.product_id}`,
      fecha: order.date,
      proveedor: order.supplier_name,
      producto: item.product_name,
      cantidad: item.quantity,
      costo_unitario: item.cost,
      total: item.total,
      estado: order.status === 'received' ? 'recibida' : order.status === 'pending' ? 'pendiente' : 'cancelada'
    }))
  );

  const comprasFiltradas = comprasDetalladas.filter(compra => {
    if (filtros.proveedor && compra.proveedor !== filtros.proveedor) return false;
    if (filtros.estado && compra.estado !== filtros.estado) return false;
    if (filtros.fechaInicio && compra.fecha < filtros.fechaInicio) return false;
    if (filtros.fechaFin && compra.fecha > filtros.fechaFin) return false;
    return true;
  });

  const columns = [
    { 
      key: 'fecha', 
      label: 'Fecha', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    { key: 'proveedor', label: 'Proveedor', sortable: true },
    { key: 'producto', label: 'Producto', sortable: true },
    { 
      key: 'cantidad', 
      label: 'Cantidad', 
      sortable: true,
      render: (value: number) => value.toLocaleString('es-MX')
    },
    { 
      key: 'costo_unitario', 
      label: 'Costo Unit.', 
      sortable: true,
      render: (value: number) => `$${value.toFixed(2)}`
    },
    { 
      key: 'total', 
      label: 'Total', 
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-blue-600">
          ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value: 'recibida' | 'pendiente' | 'cancelada') => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'recibida' ? 'bg-green-100 text-green-800' :
          value === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    }
  ];

  const totalCompras = comprasFiltradas.reduce((sum, compra) => sum + compra.total, 0);
  const comprasRecibidas = orders.filter(o => o.status === 'received').reduce((sum, o) => sum + o.total, 0);
  const comprasPendientes = orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + o.total, 0);
  const promedioCompra = comprasFiltradas.length > 0 ? totalCompras / comprasFiltradas.length : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reporte de Compras</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Compras">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${totalCompras.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Periodo actual</div>
            </div>
          </div>
        </Card>

        <Card title="Compras Recibidas">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${comprasRecibidas.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Completadas</div>
            </div>
          </div>
        </Card>

        <Card title="Pendientes">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                ${comprasPendientes.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Por recibir</div>
            </div>
          </div>
        </Card>

        <Card title="Promedio">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                ${promedioCompra.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Por compra</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Detalle de Compras">
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proveedor
                </label>
                <select 
                  value={filtros.proveedor}
                  onChange={(e) => setFiltros(prev => ({ ...prev, proveedor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los proveedores</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select 
                  value={filtros.estado}
                  onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los estados</option>
                  <option value="recibida">Recibida</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <DataTable
              data={comprasFiltradas}
              columns={columns}
              title="Historial de Compras"
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Top Proveedores">
            <div className="space-y-4">
              {suppliers.slice(0, 3).map((proveedor, index) => {
                const ordersProveedor = orders.filter(o => o.supplier_name === proveedor.name);
                const totalProveedor = ordersProveedor.reduce((sum, o) => sum + o.total, 0);
                
                return (
                  <div key={proveedor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{proveedor.name}</div>
                      <div className="text-sm text-gray-500">#{index + 1} en compras</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">
                        ${totalProveedor.toLocaleString('es-MX')}
                      </div>
                      <div className="text-xs text-gray-500">{ordersProveedor.length} órdenes</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Productos Más Comprados">
            <div className="space-y-4">
              {Array.from(new Set(comprasDetalladas.map(c => c.producto)))
                .slice(0, 3)
                .map((producto, index) => {
                const comprasProducto = comprasDetalladas.filter(c => c.producto === producto);
                const cantidadTotal = comprasProducto.reduce((sum, c) => sum + c.cantidad, 0);
                
                return (
                  <div key={producto} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{producto}</div>
                      <div className="text-sm text-gray-500">#{index + 1} más comprado</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{cantidadTotal}</div>
                      <div className="text-xs text-gray-500">unidades</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Análisis Mensual">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Enero 2025</div>
                  <div className="text-sm text-gray-500">Mes actual</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">
                    ${orders.reduce((sum, o) => sum + o.total, 0).toLocaleString('es-MX')}
                  </div>
                  <div className="text-xs text-gray-500">{orders.length} órdenes</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}