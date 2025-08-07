import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useProducts } from '../../hooks/useProducts';
import { Plus, ArrowRightLeft, Package, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Traspaso {
  id: string;
  folio: string;
  fecha: string;
  almacen_origen: string;
  almacen_destino: string;
  producto: string;
  cantidad: number;
  estatus: 'pendiente' | 'en_transito' | 'completado' | 'cancelado';
  usuario: string;
  fecha_creacion: string;
  observaciones: string;
}

export function EstadoTraspaso() {
  const { products } = useProducts();
  
  const [traspasos, setTraspasos] = useState<Traspaso[]>([
    {
      id: '1',
      folio: 'TRP-001',
      fecha: '2025-01-15',
      almacen_origen: 'BODEGA-PRINCIPAL',
      almacen_destino: 'SUCURSAL-CENTRO',
      producto: 'Aceite Comestible 1L',
      cantidad: 50,
      estatus: 'completado',
      usuario: 'Admin',
      fecha_creacion: '2025-01-15',
      observaciones: 'Traspaso regular'
    },
    {
      id: '2',
      folio: 'TRP-002',
      fecha: '2025-01-16',
      almacen_origen: 'BODEGA-PRINCIPAL',
      almacen_destino: 'SUCURSAL-NORTE',
      producto: 'Arroz Blanco 1Kg',
      cantidad: 100,
      estatus: 'en_transito',
      usuario: 'Gerente',
      fecha_creacion: '2025-01-16',
      observaciones: 'Urgente'
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newTraspaso, setNewTraspaso] = useState({
    almacen_origen: '',
    almacen_destino: '',
    producto: '',
    cantidad: 0,
    observaciones: ''
  });

  const [filtros, setFiltros] = useState({
    almacen_origen: '',
    almacen_destino: '',
    estatus: '',
    fecha_ini: '',
    fecha_fin: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newTraspaso.almacen_origen === newTraspaso.almacen_destino) {
      alert('El almacén de origen y destino no pueden ser el mismo');
      return;
    }

    const traspaso: Traspaso = {
      id: (traspasos.length + 1).toString(),
      folio: `TRP-${(traspasos.length + 1).toString().padStart(3, '0')}`,
      fecha: new Date().toISOString().split('T')[0],
      almacen_origen: newTraspaso.almacen_origen,
      almacen_destino: newTraspaso.almacen_destino,
      producto: newTraspaso.producto,
      cantidad: newTraspaso.cantidad,
      estatus: 'pendiente',
      usuario: 'Usuario Actual',
      fecha_creacion: new Date().toISOString().split('T')[0],
      observaciones: newTraspaso.observaciones
    };

    setTraspasos(prev => [traspaso, ...prev]);
    setNewTraspaso({
      almacen_origen: '',
      almacen_destino: '',
      producto: '',
      cantidad: 0,
      observaciones: ''
    });
    setShowForm(false);
    alert('Traspaso creado exitosamente');
  };

  const updateEstatus = (traspasoId: string, nuevoEstatus: Traspaso['estatus']) => {
    setTraspasos(prev => prev.map(t => 
      t.id === traspasoId ? { ...t, estatus: nuevoEstatus } : t
    ));
  };

  const traspasosFiltrados = traspasos.filter(traspaso => {
    if (filtros.almacen_origen && traspaso.almacen_origen !== filtros.almacen_origen) return false;
    if (filtros.almacen_destino && traspaso.almacen_destino !== filtros.almacen_destino) return false;
    if (filtros.estatus && traspaso.estatus !== filtros.estatus) return false;
    if (filtros.fecha_ini && traspaso.fecha < filtros.fecha_ini) return false;
    if (filtros.fecha_fin && traspaso.fecha > filtros.fecha_fin) return false;
    return true;
  });

  const columns = [
    { key: 'folio', label: 'Folio', sortable: true },
    { 
      key: 'fecha', 
      label: 'Fecha', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    { key: 'almacen_origen', label: 'Almacén Origen', sortable: true },
    { key: 'almacen_destino', label: 'Almacén Destino', sortable: true },
    { key: 'producto', label: 'Producto', sortable: true },
    { 
      key: 'cantidad', 
      label: 'Cantidad', 
      sortable: true,
      render: (value: number) => value.toLocaleString('es-MX')
    },
    {
      key: 'estatus',
      label: 'Estatus',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'completado' ? 'bg-green-100 text-green-800' :
          value === 'en_transito' ? 'bg-blue-100 text-blue-800' :
          value === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value === 'completado' ? 'Completado' :
           value === 'en_transito' ? 'En Tránsito' :
           value === 'pendiente' ? 'Pendiente' : 'Cancelado'}
        </span>
      )
    },
    { key: 'usuario', label: 'Usuario', sortable: true },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, traspaso: Traspaso) => (
        <div className="flex items-center space-x-2">
          {traspaso.estatus === 'pendiente' && (
            <button
              onClick={() => updateEstatus(traspaso.id, 'en_transito')}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Marcar en tránsito"
            >
              <Clock size={16} />
            </button>
          )}
          {traspaso.estatus === 'en_transito' && (
            <button
              onClick={() => updateEstatus(traspaso.id, 'completado')}
              className="p-1 text-green-600 hover:text-green-800"
              title="Marcar completado"
            >
              <CheckCircle size={16} />
            </button>
          )}
          <button
            onClick={() => updateEstatus(traspaso.id, 'cancelado')}
            className="p-1 text-red-600 hover:text-red-800"
            title="Cancelar"
          >
            <XCircle size={16} />
          </button>
        </div>
      )
    }
  ];

  const totalTraspasos = traspasosFiltrados.length;
  const traspasosCompletados = traspasosFiltrados.filter(t => t.estatus === 'completado').length;
  const traspasosPendientes = traspasosFiltrados.filter(t => t.estatus === 'pendiente').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Estado de Traspaso</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Nuevo Traspaso</span>
        </button>
      </div>

      <hr className="border-gray-300" />

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Traspasos">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <ArrowRightLeft className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalTraspasos}</div>
              <div className="text-sm text-gray-500">Registrados</div>
            </div>
          </div>
        </Card>

        <Card title="Completados">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{traspasosCompletados}</div>
              <div className="text-sm text-gray-500">Finalizados</div>
            </div>
          </div>
        </Card>

        <Card title="Pendientes">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{traspasosPendientes}</div>
              <div className="text-sm text-gray-500">Por procesar</div>
            </div>
          </div>
        </Card>

        <Card title="En Tránsito">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {traspasosFiltrados.filter(t => t.estatus === 'en_transito').length}
              </div>
              <div className="text-sm text-gray-500">En movimiento</div>
            </div>
          </div>
        </Card>
      </div>

      <hr className="border-gray-300" />

      {/* Filtros */}
      <Card title="Filtros de Búsqueda">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Almacén Origen
            </label>
            <select
              value={filtros.almacen_origen}
              onChange={(e) => setFiltros(prev => ({ ...prev, almacen_origen: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="BODEGA-PRINCIPAL">BODEGA-PRINCIPAL</option>
              <option value="ALMACEN-A">ALMACEN-A</option>
              <option value="ALMACEN-B">ALMACEN-B</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Almacén Destino
            </label>
            <select
              value={filtros.almacen_destino}
              onChange={(e) => setFiltros(prev => ({ ...prev, almacen_destino: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="SUCURSAL-CENTRO">SUCURSAL-CENTRO</option>
              <option value="SUCURSAL-NORTE">SUCURSAL-NORTE</option>
              <option value="SUCURSAL-SUR">SUCURSAL-SUR</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estatus
            </label>
            <select
              value={filtros.estatus}
              onChange={(e) => setFiltros(prev => ({ ...prev, estatus: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_transito">En Tránsito</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Ini
            </label>
            <input
              type="date"
              value={filtros.fecha_ini}
              onChange={(e) => setFiltros(prev => ({ ...prev, fecha_ini: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={filtros.fecha_fin}
              onChange={(e) => setFiltros(prev => ({ ...prev, fecha_fin: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      <hr className="border-gray-300" />

      {/* Listado de Traspasos */}
      <Card title="Listado de Traspasos">
        <DataTable
          data={traspasosFiltrados}
          columns={columns}
          title="Traspasos de Mercancía"
        />
      </Card>

      {/* Modal de Nuevo Traspaso */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Nuevo Traspaso</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-white hover:text-gray-200"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Almacén Origen *
                  </label>
                  <select
                    value={newTraspaso.almacen_origen}
                    onChange={(e) => setNewTraspaso(prev => ({ ...prev, almacen_origen: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar origen</option>
                    <option value="BODEGA-PRINCIPAL">BODEGA-PRINCIPAL</option>
                    <option value="ALMACEN-A">ALMACEN-A</option>
                    <option value="ALMACEN-B">ALMACEN-B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Almacén Destino *
                  </label>
                  <select
                    value={newTraspaso.almacen_destino}
                    onChange={(e) => setNewTraspaso(prev => ({ ...prev, almacen_destino: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar destino</option>
                    <option value="SUCURSAL-CENTRO">SUCURSAL-CENTRO</option>
                    <option value="SUCURSAL-NORTE">SUCURSAL-NORTE</option>
                    <option value="SUCURSAL-SUR">SUCURSAL-SUR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Producto *
                  </label>
                  <select
                    value={newTraspaso.producto}
                    onChange={(e) => setNewTraspaso(prev => ({ ...prev, producto: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar producto</option>
                    {products.map(product => (
                      <option key={product.id} value={product.name}>
                        {product.name} - Stock: {product.stock}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    value={newTraspaso.cantidad}
                    onChange={(e) => setNewTraspaso(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={newTraspaso.observaciones}
                  onChange={(e) => setNewTraspaso(prev => ({ ...prev, observaciones: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Observaciones del traspaso..."
                />
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Traspaso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}