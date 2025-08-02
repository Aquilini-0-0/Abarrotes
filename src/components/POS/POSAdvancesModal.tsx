import React, { useState, useEffect } from 'react';
import { X, Search, DollarSign, Calendar, User, Plus, Eye, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Advance {
  id: string;
  client_id: string;
  client_name: string;
  amount: number;
  date: string;
  description: string;
  status: 'active' | 'applied' | 'cancelled';
  applied_to_sale?: string;
  created_by: string;
}

interface POSAdvancesModalProps {
  onClose: () => void;
}

export function POSAdvancesModal({ onClose }: POSAdvancesModalProps) {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [newAdvance, setNewAdvance] = useState({
    client_id: '',
    amount: 0,
    description: ''
  });

  useEffect(() => {
    fetchAdvances();
    fetchClients();
  }, []);

  const fetchAdvances = async () => {
    try {
      // En un sistema real, tendríamos una tabla de anticipos
      // Por ahora simulamos algunos anticipos
      const mockAdvances: Advance[] = [
        {
          id: '1',
          client_id: '1',
          client_name: 'Supermercado El Águila',
          amount: 5000.00,
          date: '2025-01-10',
          description: 'Anticipo para compras de enero',
          status: 'active',
          created_by: 'admin'
        },
        {
          id: '2',
          client_id: '2',
          client_name: 'Tienda La Esquina',
          amount: 2500.00,
          date: '2025-01-12',
          description: 'Anticipo para mercancía',
          status: 'applied',
          applied_to_sale: 'SALE-001',
          created_by: 'admin'
        },
        {
          id: '3',
          client_id: '1',
          client_name: 'Supermercado El Águila',
          amount: 1500.00,
          date: '2025-01-14',
          description: 'Anticipo adicional',
          status: 'active',
          created_by: 'admin'
        }
      ];
      setAdvances(mockAdvances);
    } catch (err) {
      console.error('Error fetching advances:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const handleCreateAdvance = async () => {
    if (!newAdvance.client_id || newAdvance.amount <= 0) {
      alert('Por favor complete todos los campos');
      return;
    }

    const client = clients.find(c => c.id === newAdvance.client_id);
    if (!client) return;

    try {
      const advance: Advance = {
        id: `adv-${Date.now()}`,
        client_id: newAdvance.client_id,
        client_name: client.name,
        amount: newAdvance.amount,
        date: new Date().toISOString().split('T')[0],
        description: newAdvance.description,
        status: 'active',
        created_by: 'current_user'
      };

      // En un sistema real, guardaríamos en la base de datos
      setAdvances(prev => [advance, ...prev]);
      
      setNewAdvance({
        client_id: '',
        amount: 0,
        description: ''
      });
      setShowForm(false);
      alert('Anticipo registrado exitosamente');
    } catch (err) {
      console.error('Error creating advance:', err);
      alert('Error al registrar el anticipo');
    }
  };

  const handleCancelAdvance = (advanceId: string) => {
    if (confirm('¿Está seguro de cancelar este anticipo?')) {
      setAdvances(prev => prev.map(adv => 
        adv.id === advanceId ? { ...adv, status: 'cancelled' } : adv
      ));
    }
  };

  const filteredAdvances = advances.filter(advance => {
    const matchesSearch = advance.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         advance.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || advance.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAdvances = advances.filter(a => a.status === 'active').reduce((sum, a) => sum + a.amount, 0);
  const appliedAdvances = advances.filter(a => a.status === 'applied').reduce((sum, a) => sum + a.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'applied': return 'Aplicado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
      
      {/* Header */}
      <div className=" bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4 border-b border-orange-600">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-xl">Historial de Anticipos</h2>
          <button onClick={onClose} className="text-white hover:bg-white hover:text-red-500 rounded-full p-1 transition">
            <X size={22} />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ${totalAdvances.toLocaleString('es-MX')}
                </div>
                <div className="text-sm text-green-700">Anticipos Activos</div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  ${appliedAdvances.toLocaleString('es-MX')}
                </div>
                <div className="text-sm text-orange-700">Anticipos Aplicados</div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <User className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-red-600">{advances.length}</div>
                <div className="text-sm text-red-700">Total Registros</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Buscar cliente o folio..."
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="applied">Aplicados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90 transition-colors"
          >
            <Plus size={16} />
            <span>Nuevo Anticipo</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-orange-100 to-red-100">
              <tr>
                <th className="text-left p-3 text-gray-700 font-semibold">Folio</th>
                <th className="text-left p-3 text-gray-700 font-semibold">Cliente</th>
                <th className="text-left p-3 text-gray-700 font-semibold">Fecha</th>
                <th className="text-right p-3 text-gray-700 font-semibold">Monto</th>
                <th className="text-left p-3 text-gray-700 font-semibold">Descripción</th>
                <th className="text-center p-3 text-gray-700 font-semibold">Estado</th>
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
              ) : filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No se encontraron anticipos
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((advance, index) => (
                  <tr
                    key={advance.id}
                    className={`border-b border-gray-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-orange-50 transition`}
                  >
                    <td className="p-3 font-mono text-orange-600">
                      #{advance.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="p-3 text-gray-900 font-medium">
                      {advance.client_name}
                    </td>
                    <td className="p-3 text-gray-700">
                      {new Date(advance.date).toLocaleDateString('es-MX')}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-green-600">
                      ${advance.amount.toLocaleString('es-MX')}
                    </td>
                    <td className="p-3 text-gray-700">
                      {advance.description}
                      {advance.applied_to_sale && (
                        <div className="text-xs text-orange-600">
                          Aplicado a: {advance.applied_to_sale}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(advance.status)}`}>
                        {getStatusText(advance.status)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          className="p-1 text-orange-600 hover:text-orange-800"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </button>
                        {advance.status === 'active' && (
                          <button
                            onClick={() => handleCancelAdvance(advance.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Cancelar"
                          >
                            <Trash2 size={16} />
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

      {/* New Advance Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className=" bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">Nuevo Anticipo</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-white hover:bg-white hover:text-red-500 rounded-full p-1 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <select
                  value={newAdvance.client_id}
                  onChange={(e) => setNewAdvance(prev => ({ ...prev, client_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto del Anticipo
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newAdvance.amount}
                  onChange={(e) => setNewAdvance(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={newAdvance.description}
                  onChange={(e) => setNewAdvance(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Descripción del anticipo..."
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCreateAdvance}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90 transition"
                >
                  Registrar Anticipo
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
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