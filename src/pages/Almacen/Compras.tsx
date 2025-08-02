import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { ModalNuevoDetalle } from '../../components/Almacen/ModalNuevoDetalle';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useProducts } from '../../hooks/useProducts';
import { Plus, ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-react';

interface DetalleCompra {
  producto_id: string;
  producto_nombre: string;
  codigo_barras: string;
  marca: string;
  cantidad: number;
  unidad_medida: string;
  costo_unitario_sin_iva: number;
  subtotal: number;
  precio_actual: number;
  precio_nuevo: number;
  tasa_impuesto: number;
  promedia_precios: boolean;
  ubicacion_fisica: string;
}

export function Compras() {
  const { orders, loading, error, createOrder, updateOrderStatus } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  
  const [showForm, setShowForm] = useState(false);
  const [showModalDetalle, setShowModalDetalle] = useState(false);
  const [detallesCompra, setDetallesCompra] = useState<DetalleCompra[]>([]);
  const [newOrder, setNewOrder] = useState({
    supplier_id: '',
    items: [{ product_id: '', quantity: 0, cost: 0 }]
  });

  const handleAddItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 0, cost: 0 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find(s => s.id === newOrder.supplier_id);
    if (!supplier) return;

    const orderItems = newOrder.items.map(item => {
      const product = products.find(p => p.id === item.product_id);
      return {
        product_id: item.product_id,
        product_name: product?.name || '',
        quantity: item.quantity,
        cost: item.cost,
        total: item.quantity * item.cost
      };
    });

    const total = orderItems.reduce((sum, item) => sum + item.total, 0);

    const orderData = {
      supplier_id: newOrder.supplier_id,
      supplier_name: supplier.name,
      date: new Date().toISOString().split('T')[0],
      total,
      status: 'pending',
      items: orderItems
    };

    try {
      await createOrder(orderData);
      setNewOrder({
        supplier_id: '',
        items: [{ product_id: '', quantity: 0, cost: 0 }]
      });
      setShowForm(false);
      alert('Orden de compra creada exitosamente');
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Error al crear la orden de compra');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: any) => {
    try {
      await updateOrderStatus(orderId, status);
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const handleSaveDetalle = (detalle: DetalleCompra) => {
    setDetallesCompra(prev => [...prev, detalle]);
    console.log('Detalle agregado:', detalle);
  };

  const columns = [
    { 
      key: 'date', 
      label: 'Fecha', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    { key: 'supplier_name', label: 'Proveedor', sortable: true },
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
      key: 'status',
      label: 'Estado',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          value === 'approved' ? 'bg-blue-100 text-blue-800' :
          value === 'received' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value === 'pending' ? 'Pendiente' :
           value === 'approved' ? 'Aprobada' :
           value === 'received' ? 'Recibida' : 'Cancelada'}
        </span>
      )
    },
    {
      key: 'items',
      label: 'Productos',
      render: (items: PurchaseItem[]) => `${items.length} productos`
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, order: any) => (
        <div className="flex items-center space-x-2">
          {order.status === 'pending' && (
            <>
              <button
                onClick={() => handleUpdateOrderStatus(order.id, 'approved')}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="Aprobar"
              >
                <CheckCircle size={16} />
              </button>
              <button
                onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                className="p-1 text-red-600 hover:text-red-800"
                title="Cancelar"
              >
                <XCircle size={16} />
              </button>
            </>
          )}
          {order.status === 'approved' && (
            <button
              onClick={() => handleUpdateOrderStatus(order.id, 'received')}
              className="p-1 text-green-600 hover:text-green-800"
              title="Marcar como Recibida"
            >
              <CheckCircle size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  const totalCompras = orders.reduce((sum, order) => sum + order.total, 0);
  const ordenesPendientes = orders.filter(o => o.status === 'pending').length;
  const ordenesAprobadas = orders.filter(o => o.status === 'approved').length;

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Compras</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Nueva Orden</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Compras">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${totalCompras.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Acumulado</div>
            </div>
          </div>
        </Card>

        <Card title="Pendientes">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{ordenesPendientes}</div>
              <div className="text-sm text-gray-500">Órdenes</div>
            </div>
          </div>
        </Card>

        <Card title="Aprobadas">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{ordenesAprobadas}</div>
              <div className="text-sm text-gray-500">Órdenes</div>
            </div>
          </div>
        </Card>

        <Card title="Total Órdenes">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{orders.length}</div>
              <div className="text-sm text-gray-500">Registradas</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Órdenes de Compra">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Historial de Compras</h3>
              <button
                onClick={() => setShowModalDetalle(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Plus size={16} />
                <span>Agregar Detalle</span>
              </button>
            </div>
            
            {detallesCompra.length > 0 && (
              <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Detalles de Compra Agregados:</h4>
                <div className="space-y-2">
                  {detallesCompra.map((detalle, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{detalle.producto_nombre}</span>
                      <span>Cant: {detalle.cantidad} | Costo: ${detalle.costo_unitario_sin_iva} | Subtotal: ${detalle.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="font-bold text-blue-900">
                    Total: ${detallesCompra.reduce((sum, d) => sum + d.subtotal, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
            
            <DataTable
              data={orders}
              columns={columns}
              title="Historial de Compras"
            />
          </Card>
        </div>

        <div className="space-y-6">
          {showForm && (
            <Card title="Nueva Orden de Compra">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proveedor
                  </label>
                  <select
                    value={newOrder.supplier_id}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, supplier_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar proveedor</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Productos
                    </label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Agregar producto
                    </button>
                  </div>
                  
                  {newOrder.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                      <select
                        value={item.product_id}
                        onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                        className="col-span-6 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      >
                        <option value="">Producto</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Cant."
                        min="1"
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={item.cost}
                        onChange={(e) => handleItemChange(index, 'cost', parseFloat(e.target.value) || 0)}
                        className="col-span-3 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Costo"
                        min="0"
                        required
                      />
                      {newOrder.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="col-span-1 text-red-600 hover:text-red-800 text-sm"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Crear Orden
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </Card>
          )}

          <Card title="Resumen por Proveedor">
            <div className="space-y-3">
              {suppliers.slice(0, 3).map(supplier => {
                const supplierOrders = orders.filter(o => o.supplier_id === supplier.id);
                const supplierTotal = supplierOrders.reduce((sum, o) => sum + o.total, 0);
                
                return (
                  <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{supplier.name}</div>
                      <div className="text-sm text-gray-500">{supplierOrders.length} órdenes</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">
                        ${supplierTotal.toLocaleString('es-MX')}
                      </div>
                      <div className="text-xs text-gray-500">total</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
      
      <ModalNuevoDetalle
        isOpen={showModalDetalle}
        onClose={() => setShowModalDetalle(false)}
        onSave={handleSaveDetalle}
      />
    </div>
  );
}