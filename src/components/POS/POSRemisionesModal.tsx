import React, { useState, useEffect } from 'react';
import { X, FileText, Search, Eye, Download, DollarSign } from 'lucide-react';

interface Remision {
  id: string;
  folio: string;
  folio_remision: string;
  fecha: string;
  importe: number;
  cliente: string;
  estatus: string;
  tipo_pago: string;
  forma_pago: string;
  caja: string;
  dev: string;
  factura: string;
  vendedor: string;
  cajero: string;
  observaciones: string;
}

interface POSRemisionesModalProps {
  onClose: () => void;
}

export function POSRemisionesModal({ onClose }: POSRemisionesModalProps) {
  const [remisiones, setRemisiones] = useState<Remision[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRemisiones();
  }, []);

  const fetchRemisiones = async () => {
    try {
      // Simulamos datos de remisiones
      const mockRemisiones: Remision[] = [
        {
          id: '1',
          folio: 'VTA-001',
          folio_remision: 'REM-001',
          fecha: '2025-01-15',
          importe: 3250.00,
          cliente: 'Supermercado El Águila',
          estatus: 'CERRADA',
          tipo_pago: 'Contado',
          forma_pago: 'Efectivo',
          caja: 'CAJA-01',
          dev: 'NO',
          factura: 'FAC-001',
          vendedor: 'Juan Pérez',
          cajero: 'María García',
          observaciones: 'Entrega inmediata'
        },
        {
          id: '2',
          folio: 'VTA-002',
          folio_remision: 'REM-002',
          fecha: '2025-01-15',
          importe: 1580.00,
          cliente: 'Tienda La Esquina',
          estatus: 'CERRADA',
          tipo_pago: 'Crédito',
          forma_pago: 'Crédito',
          caja: 'CAJA-02',
          dev: 'NO',
          factura: 'Pendiente',
          vendedor: 'Carlos López',
          cajero: 'Ana Martínez',
          observaciones: 'Cliente frecuente'
        },
        {
          id: '3',
          folio: 'VTA-003',
          folio_remision: 'REM-003',
          fecha: '2025-01-14',
          importe: 2100.00,
          cliente: 'Abarrotes Don José',
          estatus: 'CERRADA',
          tipo_pago: 'Contado',
          forma_pago: 'Tarjeta',
          caja: 'CAJA-01',
          dev: 'NO',
          factura: 'FAC-003',
          vendedor: 'Juan Pérez',
          cajero: 'Juan Pérez',
          observaciones: 'Pago con tarjeta de débito'
        }
      ];
      
      setRemisiones(mockRemisiones);
    } catch (err) {
      console.error('Error fetching remisiones:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRemisiones = remisiones.filter(remision => {
    const matchesSearch = remision.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         remision.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         remision.folio_remision.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || remision.estatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalImporte = filteredRemisiones.reduce((sum, r) => sum + r.importe, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4 border-b border-orange-600">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">Historial de Remisiones</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:text-red-500 rounded-full p-1 transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <div className="text-xl font-bold text-green-600">{filteredRemisiones.length}</div>
                  <div className="text-sm text-green-700">Total Remisiones</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <div className="text-xl font-bold text-blue-600">
                    ${totalImporte.toLocaleString('es-MX')}
                  </div>
                  <div className="text-sm text-blue-700">Importe Total</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-yellow-600 mr-3" />
                <div>
                  <div className="text-xl font-bold text-yellow-600">
                    {filteredRemisiones.filter(r => r.estatus === 'CERRADA').length}
                  </div>
                  <div className="text-sm text-yellow-700">Cerradas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Buscar cliente, folio..."
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Todos los estados</option>
                <option value="CERRADA">Cerrada</option>
                <option value="ABIERTA">Abierta</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Mostrando {filteredRemisiones.length} de {remisiones.length} remisiones
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow overflow-x-auto">
            <table className="w-full text-sm min-w-[1200px]">
              <thead className="bg-gradient-to-r from-orange-100 to-red-100">
                <tr>
                  <th className="text-left p-3 text-gray-700 font-semibold">Folio</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Folio Remisión</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Fecha</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Importe</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Cliente</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Estatus</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Tipo Pago</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Forma Pago</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Caja</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">DEV</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Factura</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Vendedor</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Cajero</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Observaciones</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={15} className="p-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredRemisiones.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="p-8 text-center text-gray-500">
                      No se encontraron remisiones
                    </td>
                  </tr>
                ) : (
                  filteredRemisiones.map((remision, index) => (
                    <tr
                      key={remision.id}
                      className={`border-b border-gray-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-orange-50 transition`}
                    >
                      <td className="p-3 font-mono text-orange-600">{remision.folio}</td>
                      <td className="p-3 font-mono text-blue-600">{remision.folio_remision}</td>
                      <td className="p-3 text-gray-700">
                        {new Date(remision.fecha).toLocaleDateString('es-MX')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-green-600">
                        ${remision.importe.toLocaleString('es-MX')}
                      </td>
                      <td className="p-3 text-gray-900 font-medium">{remision.cliente}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {remision.estatus}
                        </span>
                      </td>
                      <td className="p-3 text-center text-gray-700">{remision.tipo_pago}</td>
                      <td className="p-3 text-center text-gray-700">{remision.forma_pago}</td>
                      <td className="p-3 text-center font-mono text-blue-600">{remision.caja}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          remision.dev === 'NO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {remision.dev}
                        </span>
                      </td>
                      <td className="p-3 text-gray-700">{remision.factura}</td>
                      <td className="p-3 text-gray-700">{remision.vendedor}</td>
                      <td className="p-3 text-gray-700">{remision.cajero}</td>
                      <td className="p-3 text-gray-600 text-xs">{remision.observaciones}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Descargar"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}