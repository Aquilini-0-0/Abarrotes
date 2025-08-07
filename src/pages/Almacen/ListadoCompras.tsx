import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useProducts } from '../../hooks/useProducts';
import { Plus, Edit, FileText, Trash2, ChevronLeft, ChevronRight, SkipForward, Search } from 'lucide-react';

interface CompraDetallada {
  id: string;
  id_factura: string;
  folio_factura: string;
  fecha: string;
  almacen_entrada: string;
  proveedor: string;
  monto_total: number;
  estatus: string;
  usuario: string;
  fecha_captura: string;
}

interface DetalleCompra {
  producto: string;
  codigo_barras: string;
  marca: string;
  cantidad: number;
  unidad_medida: string;
  costo_unitario: number;
  importe: number;
  lista: string;
  precio_iva: number;
  tasa_impuestos: number;
  ieps: number;
  promedio_precio: boolean;
  ubicacion_fisica: string;
  precio1: number;
  precio2: number;
  precio3: number;
  precio4: number;
  precio5: number;
}

export function ListadoCompras() {
  const { orders, loading, error, createOrder } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  
  const [filtros, setFiltros] = useState({
    almacen_entrada: 'BODEGA',
    proveedor: '',
    folio: '',
    fecha_ini: '',
    fecha_fin: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingCompra, setEditingCompra] = useState<CompraDetallada | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState<CompraDetallada | null>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.product-search-container')) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [newDetalle, setNewDetalle] = useState<DetalleCompra>({
    producto: '',
    codigo_barras: '',
    marca: '',
    cantidad: 1,
    unidad_medida: '',
    costo_unitario: 0,
    importe: 0,
    lista: '',
    precio_iva: 0,
    tasa_impuestos: 16,
    ieps: 0,
    promedio_precio: false,
    ubicacion_fisica: '',
    precio1: 0,
    precio2: 0,
    precio3: 0,
    precio4: 0,
    precio5: 0
  });

  // Filtrar productos basado en la búsqueda
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.line.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setProductSearchTerm(product.name);
    setShowProductDropdown(false);
    
    // Auto-llenar campos relacionados
    handleInputChange('producto', product.name);
    handleInputChange('codigo_barras', product.code);
    handleInputChange('marca', product.line);
    handleInputChange('unidad_medida', product.unit);
    
    // Sugerir precio basado en el costo actual + margen
    const precioSugerido = product.cost * 1.3; // 30% de margen
    handleInputChange('precio1', precioSugerido);
    handleInputChange('precio2', precioSugerido * 1.1);
    handleInputChange('precio3', precioSugerido * 1.2);
    handleInputChange('precio4', precioSugerido * 1.3);
    handleInputChange('precio5', precioSugerido * 1.4);
  };

  // Convertir órdenes de compra a formato de compras detalladas
  const comprasDetalladas: CompraDetallada[] = orders.map((order, index) => ({
    id: order.id,
    id_factura: `FAC-${order.id.slice(-6)}`,
    folio_factura: `${index + 1}`.padStart(6, '0'),
    fecha: order.date,
    almacen_entrada: 'BODEGA',
    proveedor: order.supplier_name,
    monto_total: order.total,
    estatus: 'Activo',
    usuario: 'Admin',
    fecha_captura: order.created_at
  }));

  const comprasFiltradas = comprasDetalladas.filter(compra => {
    if (filtros.almacen_entrada && compra.almacen_entrada !== filtros.almacen_entrada) return false;
    if (filtros.proveedor && !compra.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
    if (filtros.folio && !compra.folio_factura.includes(filtros.folio)) return false;
    if (filtros.fecha_ini && compra.fecha < filtros.fecha_ini) return false;
    if (filtros.fecha_fin && compra.fecha > filtros.fecha_fin) return false;
    return true;
  });

  const itemsPerPage = 20;
  const totalPages = Math.ceil(comprasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCompras = comprasFiltradas.slice(startIndex, startIndex + itemsPerPage);

  const handleEdit = (compra: CompraDetallada) => {
    setEditingCompra(compra);
    setShowForm(true);
  };

  const handleViewDetail = (compra: CompraDetallada) => {
    setSelectedCompra(compra);
    setShowDetailModal(true);
  };

  const handleDelete = (compraId: string) => {
    if (confirm('¿Está seguro de eliminar esta compra?')) {
      // Implementar eliminación
      alert('Compra eliminada');
    }
  };

  const handleSubmitDetalle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación: costo debe ser menor que precio
    if (newDetalle.costo_unitario >= newDetalle.precio1) {
      alert('ADVERTENCIA: El costo unitario debe ser menor que el precio de venta');
      return;
    }

    try {
      // Crear la compra
      const orderData = {
        supplier_id: '',
        supplier_name: newDetalle.marca,
        date: new Date().toISOString().split('T')[0],
        total: newDetalle.importe,
        status: 'received' as const,
        items: [{
          product_id: '',
          product_name: newDetalle.producto,
          quantity: newDetalle.cantidad,
          cost: newDetalle.costo_unitario,
          total: newDetalle.importe
        }]
      };

      await createOrder(orderData);
      
      setNewDetalle({
        producto: '',
        codigo_barras: '',
        marca: '',
        cantidad: 1,
        unidad_medida: '',
        costo_unitario: 0,
        importe: 0,
        lista: '',
        precio_iva: 0,
        tasa_impuestos: 16,
        ieps: 0,
        promedio_precio: false,
        ubicacion_fisica: '',
        precio1: 0,
        precio2: 0,
        precio3: 0,
        precio4: 0,
        precio5: 0
      });
      setShowForm(false);
      alert('Compra registrada exitosamente');
    } catch (err) {
      console.error('Error creating purchase:', err);
      alert('Error al registrar la compra');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setNewDetalle(prev => {
      const updated = { ...prev, [field]: value };
      
      // Calcular importe automáticamente
      if (field === 'cantidad' || field === 'costo_unitario') {
        updated.importe = updated.cantidad * updated.costo_unitario;
      }
      
      // Calcular precio con IVA
      if (field === 'costo_unitario' || field === 'tasa_impuestos') {
        const margen = 1.3; // 30% de margen por defecto
        const precioBase = updated.costo_unitario * margen;
        updated.precio_iva = precioBase * (1 + updated.tasa_impuestos / 100);
        
        // Calcular los 5 precios
        updated.precio1 = precioBase;
        updated.precio2 = precioBase * 1.1;
        updated.precio3 = precioBase * 1.2;
        updated.precio4 = precioBase * 1.3;
        updated.precio5 = precioBase * 1.4;
      }
      
      return updated;
    });
  };

  const columns = [
    { key: 'id_factura', label: 'Id Factura', sortable: true },
    { key: 'folio_factura', label: 'Folio Factura', sortable: true },
    { 
      key: 'fecha', 
      label: 'Fecha', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    { key: 'almacen_entrada', label: 'Almacén de Entrada', sortable: true },
    { key: 'proveedor', label: 'Proveedor', sortable: true },
    { 
      key: 'monto_total', 
      label: 'Monto Total', 
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-green-600">
          ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'estatus',
      label: 'Estatus',
      render: () => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Activo
        </span>
      )
    },
    { key: 'usuario', label: 'Usuario', sortable: true },
    { 
      key: 'fecha_captura', 
      label: 'Fecha Captura', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    {
      key: 'edicion',
      label: 'Edición',
      render: (_, compra: CompraDetallada) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(compra)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleViewDetail(compra)}
            className="p-1 text-green-600 hover:text-green-800"
            title="Ver documento"
          >
            <FileText size={16} />
          </button>
          <button
            onClick={() => handleDelete(compra.id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Listado de Compras</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Alta Compra</span>
        </button>
      </div>

      <div className="border-b-2 border-blue-500 w-full"></div>

      {/* Sección de Búsqueda y Filtrado */}
      <Card title="Búsqueda y Filtrado">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Almacén de Entrada
            </label>
            <select
              value={filtros.almacen_entrada}
              onChange={(e) => setFiltros(prev => ({ ...prev, almacen_entrada: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="BODEGA">BODEGA</option>
              <option value="ALMACEN-A">ALMACEN-A</option>
              <option value="ALMACEN-B">ALMACEN-B</option>
              <option value="SUCURSAL-1">SUCURSAL-1</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedor
            </label>
            <input
              type="text"
              value={filtros.proveedor}
              onChange={(e) => setFiltros(prev => ({ ...prev, proveedor: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del proveedor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Folio
            </label>
            <input
              type="text"
              value={filtros.folio}
              onChange={(e) => setFiltros(prev => ({ ...prev, folio: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Número de folio"
            />
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

        {/* Navegación */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <SkipForward size={16} />
              <span className="text-sm">Última</span>
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Total de registros: {comprasFiltradas.length}
          </div>
        </div>
      </Card>

      <div className="border-b-2 border-blue-500 w-full"></div>

      {/* Listado de Registros */}
      <Card title="Listado de Compras">
        <DataTable
          data={paginatedCompras}
          columns={columns}
          title="Compras Registradas"
          searchable={false}
          exportable={true}
        />
      </Card>

      {/* Modal de Alta Compra */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {editingCompra ? 'Editar Compra' : 'Alta Compra'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingCompra(null);
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitDetalle} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna Izquierda */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Producto *
                    </label>
                    <div className="relative product-search-container">
                      <div className="relative">
                        <input
                          type="text"
                          value={productSearchTerm}
                          onChange={(e) => {
                            setProductSearchTerm(e.target.value);
                            setShowProductDropdown(true);
                            if (!e.target.value) {
                              setSelectedProduct(null);
                              handleInputChange('producto', '');
                            }
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Buscar producto por nombre, código o línea..."
                          required
                        />
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      </div>
                      
                      {showProductDropdown && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.slice(0, 10).map(product => (
                              <div
                                key={product.id}
                                onClick={() => handleProductSelect(product)}
                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500 flex items-center justify-between">
                                  <span>Código: {product.code} | Línea: {product.line}</span>
                                  <span className="text-blue-600">Stock: {product.stock}</span>
                                </div>
                                <div className="text-xs text-green-600">
                                  Costo: ${product.cost.toFixed(2)} | Precio: ${product.price.toFixed(2)}
                                </div>
                              </div>
                            ))
                          ) : productSearchTerm ? (
                            <div className="px-4 py-3 text-gray-500 text-center">
                              No se encontraron productos
                            </div>
                          ) : (
                            <div className="px-4 py-3 text-gray-500 text-center">
                              Escribe para buscar productos...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Barras
                    </label>
                    <input
                      type="text"
                      value={newDetalle.codigo_barras}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      placeholder="Código de barras"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marca
                    </label>
                    <input
                      type="text"
                      value={newDetalle.marca}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      placeholder="Marca del producto"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        value={newDetalle.cantidad}
                        onChange={(e) => handleInputChange('cantidad', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unidad de Medida *
                      </label>
                      <select
                        value={newDetalle.unidad_medida}
                        onChange={(e) => handleInputChange('unidad_medida', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Seleccionar</option>
                        <option value="PIEZA">PIEZA</option>
                        <option value="KILOGRAMO">KILOGRAMO</option>
                        <option value="LITRO">LITRO</option>
                        <option value="CAJA">CAJA</option>
                        <option value="PAQUETE">PAQUETE</option>
                        <option value="METRO">METRO</option>
                        <option value="TONELADA">TONELADA</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Costo Unitario *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newDetalle.costo_unitario}
                        onChange={(e) => handleInputChange('costo_unitario', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Importe
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newDetalle.importe}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold text-green-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Columna Derecha */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lista
                    </label>
                    <select
                      value={newDetalle.lista}
                      onChange={(e) => handleInputChange('lista', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar lista</option>
                      <option value="Lista A">Lista A</option>
                      <option value="Lista B">Lista B</option>
                      <option value="Lista C">Lista C</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio IVA
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newDetalle.precio_iva}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tasa de Impuestos (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newDetalle.tasa_impuestos}
                        onChange={(e) => handleInputChange('tasa_impuestos', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IEPS (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newDetalle.ieps}
                        onChange={(e) => handleInputChange('ieps', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="promedio_precio"
                        checked={newDetalle.promedio_precio}
                        onChange={(e) => handleInputChange('promedio_precio', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="promedio_precio" className="ml-2 block text-sm text-gray-900">
                        Promedio Precio
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación Física
                    </label>
                    <select
                      value={newDetalle.ubicacion_fisica}
                      onChange={(e) => handleInputChange('ubicacion_fisica', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar ubicación</option>
                      <option value="BODEGA-A1">BODEGA-A1</option>
                      <option value="BODEGA-A2">BODEGA-A2</option>
                      <option value="BODEGA-B1">BODEGA-B1</option>
                      <option value="ALMACEN-PRINCIPAL">ALMACEN-PRINCIPAL</option>
                      <option value="AREA-FRIO">AREA-FRIO</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-b-2 border-blue-500 w-full my-6"></div>

              {/* Sección de 5 Precios */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">5 Precios Posibles del Producto</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map(nivel => (
                    <div key={nivel} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Precio {nivel}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newDetalle[`precio${nivel}` as keyof DetalleCompra] as number}
                        onChange={(e) => handleInputChange(`precio${nivel}`, parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="0.00"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {nivel === 1 ? 'General' : 
                         nivel === 2 ? 'Mayoreo' : 
                         nivel === 3 ? 'Distribuidor' : 
                         nivel === 4 ? 'VIP' : 'Especial'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCompra(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      {showDetailModal && selectedCompra && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Detalle de Compra - {selectedCompra.folio_factura}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedCompra(null);
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">ID Factura:</span>
                    <p className="text-gray-900">{selectedCompra.id_factura}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Proveedor:</span>
                    <p className="text-gray-900">{selectedCompra.proveedor}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Almacén:</span>
                    <p className="text-gray-900">{selectedCompra.almacen_entrada}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Fecha:</span>
                    <p className="text-gray-900">{new Date(selectedCompra.fecha).toLocaleDateString('es-MX')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Monto Total:</span>
                    <p className="text-green-600 font-bold">${selectedCompra.monto_total.toLocaleString('es-MX')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Usuario:</span>
                    <p className="text-gray-900">{selectedCompra.usuario}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedCompra(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}