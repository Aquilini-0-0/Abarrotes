import React, { useState, useEffect } from 'react';
import { X, FileText, Search, Eye, Download, Plus, DollarSign } from 'lucide-react';

interface Vale {
  id: string;
  folio_vale: string;
  folio_remision: string;
  fecha_expedicion: string;
  cliente: string;
  importe: number;
  disponible: number;
  estatus: 'HABILITADO' | 'USADO' | 'VENCIDO';
  tipo: string;
  factura: string;
}

interface POSValesModalProps {
  onClose: () => void;
}

export function POSValesModal({ onClose }: POSValesModalProps) {
  const [vales, setVales] = useState<Vale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVales();
  }, []);

  const fetchVales = async () => {
    try {
      // Simulamos datos de vales por devolución
      const mockVales: Vale[] = [
        {
          id: '1',
          folio_vale: 'VAL-001',
          folio_remision: 'REM-001',
          fecha_expedicion: '2025-01-15',
          cliente: 'Supermercado El Águila',
          importe: 500.00,
          disponible: 500.00,
          estatus: 'HABILITADO',
          tipo: 'Devolución',
          factura: 'FAC-001'
        },
        {
          id: '2',
          folio_vale: 'VAL-002',
          folio_remision: 'REM-003',
          fecha_expedicion: '2025-01-14',
          cliente: 'Tienda La Esquina',
          importe: 250.00,
          disponible: 100.00,
          estatus: 'HABILITADO',
          tipo: 'Devolución Parcial',
          factura: 'FAC-003'
        },
        {
          id: '3',
          folio_vale: 'VAL-003',
          folio_remision: 'REM-005',
          fecha_expedicion: '2025-01-12',
          cliente: 'Abarrotes Don José',
          importe: 800.00,
          disponible: 0.00,
          estatus: 'USADO',
          tipo: 'Devolución',
          factura: 'FAC-005'
        }
      ];
      
      setVales(mockVales);
    } catch (err) {
      console.error('Error fetching vales:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVales = vales.filter(vale => {
    const matchesSearch = vale.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vale.folio_vale.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vale.folio_remision.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || vale.estatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalDisponible = filteredVales.reduce((sum, v) => sum + v.disponible, 0);
  const valesHabilitados = filteredVales.filter(v => v.estatus === 'HABILITADO').length;

  const getStatusColor = (estatus: string) => {
    switch (estatus) {
      case 'HABILITADO': return 'bg-green-100 text-green-800';
      case 'USADO': return 'bg-gray-100 text-gray-800';
      case 'VENCIDO': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4 border-b border-orange-600">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">Vales por Devolución</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:text-red-500 rounded-full p-1 transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <div className="text-xl font-bold text-green-600">{valesHabilitados}</div>
                  <div className="text-sm text-green-700">Vales Habilitados</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <div className="text-xl font-bold text-blue-600">
                    ${totalDisponible.toLocaleString('es-MX')}
                  </div>
                  <div className="text-sm text-blue-700">Total Disponible</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-yellow-600 mr-3" />
                <div>
                  <div className="text-xl font-bold text-yellow-600">{filteredVales.length}</div>
                  <div className="text-sm text-yellow-700">Total Vales</div>
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
                <option value="HABILITADO">Habilitado</option>
                <option value="USADO">Usado</option>
                <option value="VENCIDO">Vencido</option>
              </select>
            </div>

            <button
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90"
            >
              <Plus size={16} />
              <span>Nuevo Vale</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="bg-gradient-to-r from-orange-100 to-red-100">
                <tr>
                  <th className="text-left p-3 text-gray-700 font-semibold">Folio Vale</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Folio Remisión</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Fecha Expedición</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Cliente</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Importe</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Disponible</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Estatus</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Tipo</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Factura</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredVales.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-500">
                      No se encontraron vales
                    </td>
                  </tr>
                ) : (
                  filteredVales.map((vale, index) => (
                    <tr
                      key={vale.id}
                      className={`border-b border-gray-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-orange-50 transition`}
                    >
                      <td className="p-3 font-mono text-orange-600 font-bold">{vale.folio_vale}</td>
                      <td className="p-3 font-mono text-blue-600">{vale.folio_remision}</td>
                      <td className="p-3 text-gray-700">
                        {new Date(vale.fecha_expedicion).toLocaleDateString('es-MX')}
                      </td>
                      <td className="p-3 text-gray-900 font-medium">{vale.cliente}</td>
                      <td className="p-3 text-right font-mono text-gray-900">
                        ${vale.importe.toLocaleString('es-MX')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-green-600">
                        ${vale.disponible.toLocaleString('es-MX')}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vale.estatus)}`}>
                          {vale.estatus}
                        </span>
                      </td>
                      <td className="p-3 text-center text-gray-700">{vale.tipo}</td>
                      <td className="p-3 text-gray-700">{vale.factura}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </button>
                          {vale.estatus === 'HABILITADO' && vale.disponible > 0 && (
                            <button
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Usar vale"
                            >
                              <Download size={16} />
                            </button>
                          )}
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