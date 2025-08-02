import React, { useState, useEffect } from 'react';
import { X, Calculator, Calendar, DollarSign, TrendingUp, TrendingDown, Download, Eye } from 'lucide-react';

interface CashCut {
  id: string;
  date: string;
  opening_amount: number;
  closing_amount: number;
  total_sales: number;
  total_cash: number;
  total_card: number;
  total_transfer: number;
  total_expenses: number;
  difference: number;
  user_name: string;
  created_at: string;
}

interface POSCashCutsModalProps {
  onClose: () => void;
}

export function POSCashCutsModal({ onClose }: POSCashCutsModalProps) {
  const [cashCuts, setCashCuts] = useState<CashCut[]>([]);
  const [selectedCut, setSelectedCut] = useState<CashCut | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchCashCuts();
  }, []);

  const fetchCashCuts = async () => {
    try {
      // Simulamos datos de cortes de caja - en producción vendrían de la base de datos
      const mockCashCuts: CashCut[] = [
        {
          id: '1',
          date: '2025-01-15',
          opening_amount: 5000.00,
          closing_amount: 18500.00,
          total_sales: 25300.00,
          total_cash: 15000.00,
          total_card: 8500.00,
          total_transfer: 1800.00,
          total_expenses: 2300.00,
          difference: 0.00,
          user_name: 'Juan Pérez',
          created_at: '2025-01-15T18:30:00'
        },
        {
          id: '2',
          date: '2025-01-14',
          opening_amount: 4500.00,
          closing_amount: 16200.00,
          total_sales: 22800.00,
          total_cash: 13500.00,
          total_card: 7800.00,
          total_transfer: 1500.00,
          total_expenses: 1800.00,
          difference: -200.00,
          user_name: 'María García',
          created_at: '2025-01-14T19:15:00'
        },
        {
          id: '3',
          date: '2025-01-13',
          opening_amount: 5000.00,
          closing_amount: 19800.00,
          total_sales: 28500.00,
          total_cash: 16800.00,
          total_card: 9200.00,
          total_transfer: 2500.00,
          total_expenses: 2000.00,
          difference: 100.00,
          user_name: 'Carlos López',
          created_at: '2025-01-13T20:00:00'
        }
      ];
      
      setCashCuts(mockCashCuts);
    } catch (err) {
      console.error('Error fetching cash cuts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCuts = cashCuts.filter(cut => {
    if (dateFilter && cut.date !== dateFilter) return false;
    return true;
  });

  const exportCashCut = (cut: CashCut) => {
    const content = `
CORTE DE CAJA - ${new Date(cut.date).toLocaleDateString('es-MX')}
================================================

INFORMACIÓN GENERAL:
- Fecha: ${new Date(cut.date).toLocaleDateString('es-MX')}
- Usuario: ${cut.user_name}
- Hora de Corte: ${new Date(cut.created_at).toLocaleTimeString('es-MX')}

MOVIMIENTOS DE EFECTIVO:
- Apertura de Caja:       $${cut.opening_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Cierre de Caja:         $${cut.closing_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Diferencia:             $${cut.difference.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

VENTAS POR MÉTODO DE PAGO:
- Ventas en Efectivo:     $${cut.total_cash.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Ventas con Tarjeta:     $${cut.total_card.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Ventas Transferencia:   $${cut.total_transfer.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                         _______________
Total Ventas:            $${cut.total_sales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

GASTOS:
- Total Gastos:           $${cut.total_expenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

RESUMEN:
- Efectivo Esperado:      $${(cut.opening_amount + cut.total_cash - cut.total_expenses).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Efectivo Contado:       $${cut.closing_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Diferencia Final:       $${cut.difference.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

================================================
Generado el ${new Date().toLocaleString('es-MX')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corte_caja_${cut.date}_${cut.user_name.replace(/\s+/g, '_')}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalSales = filteredCuts.reduce((sum, cut) => sum + cut.total_sales, 0);
  const totalDifferences = filteredCuts.reduce((sum, cut) => sum + Math.abs(cut.difference), 0);
  const averageSales = filteredCuts.length > 0 ? totalSales / filteredCuts.length : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4 border-b border-orange-600">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">Mis Cortes de Caja</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:text-red-500 rounded-full p-1 transition"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    ${totalSales.toLocaleString('es-MX')}
                  </div>
                  <div className="text-sm text-green-700">Total Ventas</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center">
                <Calculator className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredCuts.length}
                  </div>
                  <div className="text-sm text-blue-700">Cortes Realizados</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    ${averageSales.toLocaleString('es-MX')}
                  </div>
                  <div className="text-sm text-yellow-700">Promedio Diario</div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    ${totalDifferences.toLocaleString('es-MX')}
                  </div>
                  <div className="text-sm text-red-700">Total Diferencias</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Fecha</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Mostrando {filteredCuts.length} de {cashCuts.length} cortes
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-orange-100 to-red-100">
                <tr>
                  <th className="text-left p-3 text-gray-700 font-semibold">Fecha</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Usuario</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Apertura</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Cierre</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Total Ventas</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Diferencia</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredCuts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No se encontraron cortes de caja
                    </td>
                  </tr>
                ) : (
                  filteredCuts.map((cut, index) => (
                    <tr
                      key={cut.id}
                      className={`border-b border-gray-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-orange-50 transition`}
                    >
                      <td className="p-3 text-gray-900 font-medium">
                        {new Date(cut.date).toLocaleDateString('es-MX')}
                      </td>
                      <td className="p-3 text-gray-700">{cut.user_name}</td>
                      <td className="p-3 text-right font-mono text-blue-600">
                        ${cut.opening_amount.toLocaleString('es-MX')}
                      </td>
                      <td className="p-3 text-right font-mono text-green-600">
                        ${cut.closing_amount.toLocaleString('es-MX')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-orange-600">
                        ${cut.total_sales.toLocaleString('es-MX')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        <span className={`${
                          Math.abs(cut.difference) < 0.01 ? 'text-green-600' :
                          cut.difference > 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {cut.difference > 0 ? '+' : ''}${cut.difference.toLocaleString('es-MX')}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedCut(cut);
                              setShowDetail(true);
                            }}
                            className="p-1 text-orange-600 hover:text-orange-800"
                            title="Ver detalle"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => exportCashCut(cut)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Exportar"
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

        {/* Detail Modal */}
        {showDetail && selectedCut && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold">
                    Detalle del Corte - {new Date(selectedCut.date).toLocaleDateString('es-MX')}
                  </h3>
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      setSelectedCut(null);
                    }}
                    className="text-orange-100 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* General Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Información General</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fecha:</span>
                        <span className="font-medium">{new Date(selectedCut.date).toLocaleDateString('es-MX')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Usuario:</span>
                        <span className="font-medium">{selectedCut.user_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hora de Corte:</span>
                        <span>{new Date(selectedCut.created_at).toLocaleTimeString('es-MX')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Movimientos de Efectivo</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Apertura:</span>
                        <span className="font-mono text-blue-600">${selectedCut.opening_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cierre:</span>
                        <span className="font-mono text-green-600">${selectedCut.closing_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold text-gray-900">Diferencia:</span>
                        <span className={`font-bold ${
                          Math.abs(selectedCut.difference) < 0.01 ? 'text-green-600' :
                          selectedCut.difference > 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {selectedCut.difference > 0 ? '+' : ''}${selectedCut.difference.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sales Breakdown */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">Desglose de Ventas</h4>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          ${selectedCut.total_cash.toLocaleString('es-MX')}
                        </div>
                        <div className="text-sm text-green-700">Efectivo</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          ${selectedCut.total_card.toLocaleString('es-MX')}
                        </div>
                        <div className="text-sm text-blue-700">Tarjeta</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          ${selectedCut.total_transfer.toLocaleString('es-MX')}
                        </div>
                        <div className="text-sm text-purple-700">Transferencia</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total Ventas:</span>
                        <span className="text-2xl font-bold text-orange-600">
                          ${selectedCut.total_sales.toLocaleString('es-MX')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => exportCashCut(selectedCut)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Download size={16} />
                    <span>Exportar Corte</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      setSelectedCut(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}