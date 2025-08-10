import React, { useState, useEffect } from 'react';
import { X, DollarSign, Plus, Calendar, User, Building2 } from 'lucide-react';

interface CashMovement {
  id: string;
  fecha: string;
  tipo: 'caja_mayor' | 'deposito_bancario' | 'gasto' | 'pago_proveedor' | 'prestamo' | 'traspaso_caja' | 'otros';
  monto: number;
  cargo: string;
  numero_caja: string;
  descripcion: string;
  usuario: string;
  created_at: string;
}

interface POSCashMovementsModalProps {
  onClose: () => void;
}

export function POSCashMovementsModal({ onClose }: POSCashMovementsModalProps) {
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newMovement, setNewMovement] = useState({
    tipo: 'gasto' as const,
    monto: 0,
    cargo: '',
    numero_caja: 'CAJA-01',
    descripcion: ''
  });

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      // Simulamos datos de movimientos de efectivo
      const mockMovements: CashMovement[] = [
        {
          id: '1',
          fecha: '2025-01-15',
          tipo: 'gasto',
          monto: 500.00,
          cargo: 'Gastos Operativos',
          numero_caja: 'CAJA-01',
          descripcion: 'Compra de material de oficina',
          usuario: 'Juan Pérez',
          created_at: '2025-01-15T10:30:00'
        },
        {
          id: '2',
          fecha: '2025-01-15',
          tipo: 'deposito_bancario',
          monto: 15000.00,
          cargo: 'Depósito Diario',
          numero_caja: 'CAJA-01',
          descripcion: 'Depósito de ventas del día',
          usuario: 'María García',
          created_at: '2025-01-15T16:45:00'
        },
        {
          id: '3',
          fecha: '2025-01-14',
          tipo: 'pago_proveedor',
          monto: 8500.00,
          cargo: 'Pago a Proveedores',
          numero_caja: 'CAJA-02',
          descripcion: 'Pago a Distribuidora Nacional',
          usuario: 'Carlos López',
          created_at: '2025-01-14T14:20:00'
        }
      ];
      
      setMovements(mockMovements);
    } catch (err) {
      console.error('Error fetching cash movements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMovement = () => {
    if (!newMovement.cargo.trim() || newMovement.monto <= 0) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    const movement: CashMovement = {
      id: `mov-${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      tipo: newMovement.tipo,
      monto: newMovement.monto,
      cargo: newMovement.cargo,
      numero_caja: newMovement.numero_caja,
      descripcion: newMovement.descripcion,
      usuario: 'Usuario Actual',
      created_at: new Date().toISOString()
    };

    setMovements(prev => [movement, ...prev]);
    setNewMovement({
      tipo: 'gasto',
      monto: 0,
      cargo: '',
      numero_caja: 'CAJA-01',
      descripcion: ''
    });
    setShowForm(false);
    alert('Movimiento registrado exitosamente');
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'caja_mayor': return 'Caja Mayor';
      case 'deposito_bancario': return 'Depósito Bancario';
      case 'gasto': return 'Gasto';
      case 'pago_proveedor': return 'Pago Proveedor';
      case 'prestamo': return 'Préstamo';
      case 'traspaso_caja': return 'Traspaso Caja';
      case 'otros': return 'Otros';
      default: return tipo;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'caja_mayor': return 'bg-blue-100 text-blue-800';
      case 'deposito_bancario': return 'bg-green-100 text-green-800';
      case 'gasto': return 'bg-red-100 text-red-800';
      case 'pago_proveedor': return 'bg-orange-100 text-orange-800';
      case 'prestamo': return 'bg-purple-100 text-purple-800';
      case 'traspaso_caja': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalMovements = movements.reduce((sum, m) => sum + m.monto, 0);
  const gastos = movements.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.monto, 0);
  const depositos = movements.filter(m => m.tipo === 'deposito_bancario').reduce((sum, m) => sum + m.monto, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4 border-b border-orange-600">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">Movimientos de Efectivo</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${totalMovements.toLocaleString('es-MX')}
                  </div>
                  <div className="text-sm text-blue-700">Total Movimientos</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    ${depositos.toLocaleString('es-MX')}
                  </div>
                  <div className="text-sm text-green-700">Depósitos</div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    ${gastos.toLocaleString('es-MX')}
                  </div>
                  <div className="text-sm text-red-700">Gastos</div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">{movements.length}</div>
                  <div className="text-sm text-purple-700">Registros</div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Historial de Movimientos</h3>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90 transition"
            >
              <Plus size={16} />
              <span>Nuevo Movimiento</span>
            </button>
          </div>

          {/* Movements Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-gray-700 font-semibold">Fecha</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Tipo</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Monto</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Cargo</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Caja</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Usuario</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Hora</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No hay movimientos registrados
                    </td>
                  </tr>
                ) : (
                  movements.map((movement, index) => (
                    <tr
                      key={movement.id}
                      className={`border-b border-gray-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-orange-50 transition`}
                    >
                      <td className="p-3 text-gray-900">
                        {new Date(movement.fecha).toLocaleDateString('es-MX')}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(movement.tipo)}`}>
                          {getTipoLabel(movement.tipo)}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-green-600">
                        ${movement.monto.toLocaleString('es-MX')}
                      </td>
                      <td className="p-3 text-gray-900 font-medium">{movement.cargo}</td>
                      <td className="p-3 text-center font-mono text-blue-600">{movement.numero_caja}</td>
                      <td className="p-3 text-gray-700">{movement.usuario}</td>
                      <td className="p-3 text-center text-gray-600">
                        {new Date(movement.created_at).toLocaleTimeString('es-MX', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Movement Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold">Nuevo Movimiento de Efectivo</h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-orange-100 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Movimiento
                  </label>
                  <select
                    value={newMovement.tipo}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, tipo: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="caja_mayor">Caja Mayor</option>
                    <option value="deposito_bancario">Depósito Bancario</option>
                    <option value="gasto">Gasto</option>
                    <option value="pago_proveedor">Pago Proveedor</option>
                    <option value="prestamo">Préstamo</option>
                    <option value="traspaso_caja">Traspaso Caja</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMovement.monto}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={newMovement.cargo}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, cargo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Descripción del cargo..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Caja
                  </label>
                  <select
                    value={newMovement.numero_caja}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, numero_caja: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="CAJA-01">CAJA-01</option>
                    <option value="CAJA-02">CAJA-02</option>
                    <option value="CAJA-03">CAJA-03</option>
                    <option value="CAJA-PRINCIPAL">CAJA-PRINCIPAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={newMovement.descripcion}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    placeholder="Descripción adicional del movimiento..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateMovement}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90"
                  >
                    Registrar Movimiento
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
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