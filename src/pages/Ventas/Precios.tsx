import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useProducts } from '../../hooks/useProducts';
import { useClients } from '../../hooks/useClients';
import { DollarSign, Percent, TrendingUp, Users, Edit, Save, X } from 'lucide-react';

interface PrecioEspecial {
  id: string;
  cliente_id: string;
  cliente_nombre: string;
  producto_id: string;
  producto_nombre: string;
  precio_normal: number;
  precio_especial: number;
  descuento_porcentaje: number;
  fecha_inicio: string;
  fecha_fin?: string;
  activo: boolean;
}

export function PreciosVentas() {
  const { products } = useProducts();
  const { clients } = useClients();
  
  const [preciosEspeciales, setPreciosEspeciales] = useState<PrecioEspecial[]>([
    {
      id: '1',
      cliente_id: '1',
      cliente_nombre: 'Supermercado El Águila',
      producto_id: '1',
      producto_nombre: 'Aceite Comestible 1L',
      precio_normal: 65.00,
      precio_especial: 60.00,
      descuento_porcentaje: 7.69,
      fecha_inicio: '2025-01-01',
      fecha_fin: '2025-12-31',
      activo: true
    },
    {
      id: '2',
      cliente_id: '2',
      cliente_nombre: 'Tienda La Esquina',
      producto_id: '2',
      producto_nombre: 'Arroz Blanco 1Kg',
      precio_normal: 35.00,
      precio_especial: 32.00,
      descuento_porcentaje: 8.57,
      fecha_inicio: '2025-01-01',
      activo: true
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [newPrecio, setNewPrecio] = useState({
    cliente_id: '',
    producto_id: '',
    precio_especial: 0,
    fecha_inicio: '',
    fecha_fin: ''
  });

  const [filtros, setFiltros] = useState({
    cliente: '',
    producto: '',
    activo: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cliente = clients.find(c => c.id === newPrecio.cliente_id);
    const producto = products.find(p => p.id === newPrecio.producto_id);
    
    if (!cliente || !producto) return;

    const descuento = ((producto.price - newPrecio.precio_especial) / producto.price) * 100;

    const precio: PrecioEspecial = {
      id: (preciosEspeciales.length + 1).toString(),
      cliente_id: newPrecio.cliente_id,
      cliente_nombre: cliente.name,
      producto_id: newPrecio.producto_id,
      producto_nombre: producto.name,
      precio_normal: producto.price,
      precio_especial: newPrecio.precio_especial,
      descuento_porcentaje: descuento,
      fecha_inicio: newPrecio.fecha_inicio,
      fecha_fin: newPrecio.fecha_fin || undefined,
      activo: true
    };

    setPreciosEspeciales(prev => [precio, ...prev]);
    setNewPrecio({
      cliente_id: '',
      producto_id: '',
      precio_especial: 0,
      fecha_inicio: '',
      fecha_fin: ''
    });
    setShowForm(false);
    alert('Precio especial configurado exitosamente');
  };

  const handleEditPrice = (precioId: string, nuevoPrecio: number) => {
    setPreciosEspeciales(prev => prev.map(p => {
      if (p.id === precioId) {
        const descuento = ((p.precio_normal - nuevoPrecio) / p.precio_normal) * 100;
        return {
          ...p,
          precio_especial: nuevoPrecio,
          descuento_porcentaje: descuento
        };
      }
      return p;
    }));
    setEditingPrice(null);
  };

  const toggleActivo = (precioId: string) => {
    setPreciosEspeciales(prev => prev.map(p => 
      p.id === precioId ? { ...p, activo: !p.activo } : p
    ));
  };

  const preciosFiltrados = preciosEspeciales.filter(precio => {
    if (filtros.cliente && precio.cliente_id !== filtros.cliente) return false;
    if (filtros.producto && precio.producto_id !== filtros.producto) return false;
    if (filtros.activo && precio.activo.toString() !== filtros.activo) return false;
    return true;
  });

  const columns = [
    { key: 'cliente_nombre', label: 'Cliente', sortable: true },
    { key: 'producto_nombre', label: 'Producto', sortable: true },
    { 
      key: 'precio_normal', 
      label: 'Precio Normal', 
      sortable: true,
      render: (value: number) => `$${value.toFixed(2)}`
    },
    { 
      key: 'precio_especial', 
      label: 'Precio Especial', 
      sortable: true,
      render: (value: number, row: PrecioEspecial) => (
        <div className="flex items-center space-x-2">
          {editingPrice === row.id ? (
            <div className="flex items-center space-x-1">
              <input
                type="number"
                step="0.01"
                defaultValue={value}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEditPrice(row.id, parseFloat((e.target as HTMLInputElement).value));
                  } else if (e.key === 'Escape') {
                    setEditingPrice(null);
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector(`input[defaultValue="${value}"]`) as HTMLInputElement;
                  handleEditPrice(row.id, parseFloat(input.value));
                }}
                className="p-1 text-green-600 hover:text-green-800"
              >
                <Save size={12} />
              </button>
              <button
                onClick={() => setEditingPrice(null)}
                className="p-1 text-red-600 hover:text-red-800"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-green-600">${value.toFixed(2)}</span>
              <button
                onClick={() => setEditingPrice(row.id)}
                className="p-1 text-blue-600 hover:text-blue-800"
              >
                <Edit size={12} />
              </button>
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'descuento_porcentaje', 
      label: 'Descuento', 
      sortable: true,
      render: (value: number) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value > 10 ? 'bg-red-100 text-red-800' :
          value > 5 ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {value.toFixed(1)}%
        </span>
      )
    },
    { 
      key: 'fecha_inicio', 
      label: 'Vigencia Desde', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    { 
      key: 'fecha_fin', 
      label: 'Vigencia Hasta', 
      render: (value?: string) => value ? new Date(value).toLocaleDateString('es-MX') : 'Indefinida'
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (value: boolean, row: PrecioEspecial) => (
        <button
          onClick={() => toggleActivo(row.id)}
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {value ? 'Activo' : 'Inactivo'}
        </button>
      )
    }
  ];

  const totalDescuentos = preciosEspeciales.reduce((sum, p) => sum + (p.precio_normal - p.precio_especial), 0);
  const preciosActivos = preciosEspeciales.filter(p => p.activo).length;
  const clientesConDescuento = new Set(preciosEspeciales.map(p => p.cliente_id)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Precios de Ventas</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <DollarSign size={16} />
          <span>Nuevo Precio Especial</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Precios Especiales">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{preciosActivos}</div>
              <div className="text-sm text-gray-500">Activos</div>
            </div>
          </div>
        </Card>

        <Card title="Descuento Total">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <Percent className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${totalDescuentos.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Ahorro clientes</div>
            </div>
          </div>
        </Card>

        <Card title="Clientes Beneficiados">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{clientesConDescuento}</div>
              <div className="text-sm text-gray-500">Con descuentos</div>
            </div>
          </div>
        </Card>

        <Card title="Descuento Promedio">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {preciosEspeciales.length > 0 
                  ? (preciosEspeciales.reduce((sum, p) => sum + p.descuento_porcentaje, 0) / preciosEspeciales.length).toFixed(1)
                  : '0.0'
                }%
              </div>
              <div className="text-sm text-gray-500">Por producto</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Lista de Precios Especiales">
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <select 
                  value={filtros.cliente}
                  onChange={(e) => setFiltros(prev => ({ ...prev, cliente: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los clientes</option>
                  {clients.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>{cliente.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Producto
                </label>
                <select 
                  value={filtros.producto}
                  onChange={(e) => setFiltros(prev => ({ ...prev, producto: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los productos</option>
                  {products.map(producto => (
                    <option key={producto.id} value={producto.id}>{producto.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select 
                  value={filtros.activo}
                  onChange={(e) => setFiltros(prev => ({ ...prev, activo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>
            </div>

            <DataTable
              data={preciosFiltrados}
              columns={columns}
              title="Precios Especiales"
            />
          </Card>
        </div>

        <div className="space-y-6">
          {showForm && (
            <Card title="Nuevo Precio Especial">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente
                  </label>
                  <select
                    value={newPrecio.cliente_id}
                    onChange={(e) => setNewPrecio(prev => ({ ...prev, cliente_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Producto
                  </label>
                  <select
                    value={newPrecio.producto_id}
                    onChange={(e) => setNewPrecio(prev => ({ ...prev, producto_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar producto</option>
                    {products.map(producto => (
                      <option key={producto.id} value={producto.id}>
                        {producto.name} - ${producto.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Especial
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPrecio.precio_especial}
                    onChange={(e) => setNewPrecio(prev => ({ ...prev, precio_especial: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                  {newPrecio.producto_id && newPrecio.precio_especial > 0 && (
                    <div className="mt-1 text-sm text-gray-600">
                      Descuento: {(((products.find(p => p.id === newPrecio.producto_id)?.price || 0) - newPrecio.precio_especial) / (products.find(p => p.id === newPrecio.producto_id)?.price || 1) * 100).toFixed(1)}%
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vigencia Desde
                  </label>
                  <input
                    type="date"
                    value={newPrecio.fecha_inicio}
                    onChange={(e) => setNewPrecio(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vigencia Hasta (Opcional)
                  </label>
                  <input
                    type="date"
                    value={newPrecio.fecha_fin}
                    onChange={(e) => setNewPrecio(prev => ({ ...prev, fecha_fin: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Crear Precio
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

          <Card title="Productos con Mayor Descuento">
            <div className="space-y-3">
              {preciosEspeciales
                .sort((a, b) => b.descuento_porcentaje - a.descuento_porcentaje)
                .slice(0, 5)
                .map(precio => (
                  <div key={precio.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{precio.producto_nombre}</div>
                      <div className="text-sm text-gray-500">{precio.cliente_nombre}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">
                        {precio.descuento_porcentaje.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        ${(precio.precio_normal - precio.precio_especial).toFixed(2)} ahorro
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          <Card title="Clientes con Más Descuentos">
            <div className="space-y-3">
              {Array.from(new Set(preciosEspeciales.map(p => p.cliente_id)))
                .map(clienteId => {
                  const cliente = clients.find(c => c.id === clienteId);
                  const preciosCliente = preciosEspeciales.filter(p => p.cliente_id === clienteId);
                  const ahorroTotal = preciosCliente.reduce((sum, p) => sum + (p.precio_normal - p.precio_especial), 0);
                  
                  return {
                    cliente: cliente?.name || '',
                    cantidad: preciosCliente.length,
                    ahorro: ahorroTotal
                  };
                })
                .sort((a, b) => b.cantidad - a.cantidad)
                .slice(0, 3)
                .map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{item.cliente}</div>
                      <div className="text-sm text-gray-500">{item.cantidad} productos con descuento</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        ${item.ahorro.toLocaleString('es-MX')}
                      </div>
                      <div className="text-xs text-gray-500">ahorro total</div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}