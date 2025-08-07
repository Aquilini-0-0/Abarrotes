import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useSales } from '../../hooks/useSales';
import { FileText, Truck, Printer, ChevronLeft, ChevronRight, SkipForward, Download } from 'lucide-react';

interface Remision {
  id: string;
  folio: string;
  sucursal: string;
  cliente: string;
  fecha_emision: string;
  total: number;
  factura: string;
  tipo: string;
  capturista: string;
  estatus: string;
}

export function ListadoRemisiones() {
  const { sales, loading, error } = useSales();
  
  const [filtros, setFiltros] = useState({
    sucursal: 'BODEGA',
    cliente: '',
    folio: '',
    tipo_pago: '',
    fecha_ini: '',
    fecha_fin: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRemision, setSelectedRemision] = useState<Remision | null>(null);

  // Convertir ventas a remisiones
  const remisiones: Remision[] = sales.map((sale, index) => ({
    id: sale.id,
    folio: `REM-${(index + 1).toString().padStart(6, '0')}`,
    sucursal: 'BODEGA',
    cliente: sale.client_name,
    fecha_emision: sale.date,
    total: sale.total,
    factura: sale.status === 'paid' ? `FAC-${sale.id.slice(-6)}` : 'Pendiente',
    tipo: sale.status === 'paid' ? 'Contado' : 'Crédito',
    capturista: 'Usuario Sistema',
    estatus: 'Cerrada'
  }));

  const remisionesFiltradas = remisiones.filter(remision => {
    if (filtros.sucursal && remision.sucursal !== filtros.sucursal) return false;
    if (filtros.cliente && !remision.cliente.toLowerCase().includes(filtros.cliente.toLowerCase())) return false;
    if (filtros.folio && !remision.folio.includes(filtros.folio)) return false;
    if (filtros.tipo_pago && remision.tipo !== filtros.tipo_pago) return false;
    if (filtros.fecha_ini && remision.fecha_emision < filtros.fecha_ini) return false;
    if (filtros.fecha_fin && remision.fecha_emision > filtros.fecha_fin) return false;
    return true;
  });

  const itemsPerPage = 20;
  const totalPages = Math.ceil(remisionesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRemisiones = remisionesFiltradas.slice(startIndex, startIndex + itemsPerPage);

  const handleViewDetail = (remision: Remision) => {
    setSelectedRemision(remision);
    setShowDetailModal(true);
  };

  const handlePrintPDF = () => {
    // Generar PDF de todas las remisiones
    const content = `
LISTADO DE REMISIONES
=====================

Total de registros: ${remisionesFiltradas.length}
Fecha de generación: ${new Date().toLocaleString('es-MX')}

${remisionesFiltradas.map(remision => `
Folio: ${remision.folio}
Cliente: ${remision.cliente}
Fecha: ${new Date(remision.fecha_emision).toLocaleDateString('es-MX')}
Total: $${remision.total.toLocaleString('es-MX')}
Tipo: ${remision.tipo}
Estatus: ${remision.estatus}
---
`).join('')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `listado_remisiones_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'folio', label: 'Folio', sortable: true },
    { key: 'sucursal', label: 'Sucursal', sortable: true },
    { key: 'cliente', label: 'Cliente', sortable: true },
    { 
      key: 'fecha_emision', 
      label: 'Fecha Emisión', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
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
    { key: 'factura', label: 'Factura', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: true },
    { key: 'capturista', label: 'Capturista', sortable: true },
    {
      key: 'estatus',
      label: 'Estatus',
      render: () => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Cerrada
        </span>
      )
    },
    {
      key: 'edicion',
      label: 'Edición',
      render: (_, remision: Remision) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewDetail(remision)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Ver detalles"
          >
            <FileText size={16} />
          </button>
          <button
            className="p-1 text-green-600 hover:text-green-800"
            title="Gestionar logística"
          >
            <Truck size={16} />
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Listado de Remisiones</h1>
        <button
          onClick={handlePrintPDF}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Printer size={16} />
          <span>Imprimir PDF</span>
        </button>
      </div>

      <hr className="border-gray-300" />

      {/* Sección de Búsqueda y Filtrado */}
      <Card title="Búsqueda y Filtrado">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sucursal
            </label>
            <select
              value={filtros.sucursal}
              onChange={(e) => setFiltros(prev => ({ ...prev, sucursal: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="BODEGA">BODEGA</option>
              <option value="SUCURSAL-CENTRO">SUCURSAL-CENTRO</option>
              <option value="SUCURSAL-NORTE">SUCURSAL-NORTE</option>
              <option value="SUCURSAL-SUR">SUCURSAL-SUR</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente
            </label>
            <input
              type="text"
              value={filtros.cliente}
              onChange={(e) => setFiltros(prev => ({ ...prev, cliente: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del cliente"
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
              Tipo de Pago
            </label>
            <select
              value={filtros.tipo_pago}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo_pago: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="Contado">Contado</option>
              <option value="Crédito">Crédito</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fechas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filtros.fecha_ini}
                onChange={(e) => setFiltros(prev => ({ ...prev, fecha_ini: e.target.value }))}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                title="Fecha Ini"
              />
              <input
                type="date"
                value={filtros.fecha_fin}
                onChange={(e) => setFiltros(prev => ({ ...prev, fecha_fin: e.target.value }))}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                title="Fecha Fin"
              />
            </div>
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
            Total de registros: {remisionesFiltradas.length}
          </div>
        </div>
      </Card>

      <hr className="border-gray-300" />

      {/* Listado de Remisiones */}
      <Card title="Listado de Remisiones">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">
            Remisiones Registradas
          </div>
          <button
            onClick={handlePrintPDF}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Download size={16} />
            <span>Exportar PDF</span>
          </button>
        </div>
        
        <DataTable
          data={paginatedRemisiones}
          columns={columns}
          title="Remisiones"
          searchable={false}
          exportable={true}
        />
      </Card>

      {/* Modal de Detalle */}
      {showDetailModal && selectedRemision && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Detalle de Remisión - {selectedRemision.folio}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRemision(null);
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <FileText size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Folio:</span>
                    <p className="text-gray-900 font-mono">{selectedRemision.folio}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Cliente:</span>
                    <p className="text-gray-900">{selectedRemision.cliente}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Sucursal:</span>
                    <p className="text-gray-900">{selectedRemision.sucursal}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Tipo:</span>
                    <p className="text-gray-900">{selectedRemision.tipo}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Fecha Emisión:</span>
                    <p className="text-gray-900">{new Date(selectedRemision.fecha_emision).toLocaleDateString('es-MX')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Total:</span>
                    <p className="text-green-600 font-bold text-lg">${selectedRemision.total.toLocaleString('es-MX')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Factura:</span>
                    <p className="text-gray-900">{selectedRemision.factura}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Capturista:</span>
                    <p className="text-gray-900">{selectedRemision.capturista}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRemision(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Printer size={16} />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}