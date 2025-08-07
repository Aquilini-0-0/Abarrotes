import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useClients } from '../../hooks/useClients';
import { Client } from '../../types';
import { Plus, MapPin, Phone, Mail, CreditCard } from 'lucide-react';

export function Clientes() {
  const { clients, loading, error, createClient, updateClient, deleteClient } = useClients();
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({
    name: '',
    rfc: '',
    address: '',
    phone: '',
    email: '',
    zone: '',
    credit_limit: 0,
    balance: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await updateClient(editingClient.id, newClient);
        alert('Cliente actualizado exitosamente');
      } else {
        await createClient(newClient);
        alert('Cliente creado exitosamente');
      }
      setNewClient({
        name: '',
        rfc: '',
        address: '',
        phone: '',
        email: '',
        zone: '',
        credit_limit: 0,
        balance: 0
      });
      setShowForm(false);
      setEditingClient(null);
    } catch (err) {
      console.error('Error saving client:', err);
      alert('Error al guardar el cliente');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setNewClient({
      name: client.name,
      rfc: client.rfc,
      address: client.address,
      phone: client.phone,
      email: client.email,
      zone: client.zone,
      credit_limit: client.credit_limit,
      balance: client.balance
    });
    setShowForm(true);
  };

  const handleDelete = async (clientId: string) => {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      try {
        await deleteClient(clientId);
        alert('Cliente eliminado exitosamente');
      } catch (err) {
        console.error('Error deleting client:', err);
        alert('Error al eliminar el cliente');
      }
    }
  };

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
            onClick={() => handleEdit(client)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const columns = [
    { key: 'name', label: 'Cliente', sortable: true },
    { key: 'rfc', label: 'RFC', sortable: true },
    { key: 'zone', label: 'Zona', sortable: true },
    { 
      key: 'phone', 
      label: 'Teléfono',
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Phone size={14} className="text-gray-400" />
          <span>{value}</span>
        </div>
      )
    },
    { 
      key: 'email', 
      label: 'Email',
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Mail size={14} className="text-gray-400" />
          <span className="text-blue-600">{value}</span>
        </div>
      )
    },
    { 
      key: 'credit_limit', 
      label: 'Límite de Crédito',
      render: (value: number) => `$${value.toLocaleString('es-MX')}`
    },
    { 
      key: 'balance', 
      label: 'Saldo',
      render: (value: number) => (
        <span className={value > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
          ${value.toLocaleString('es-MX')}
        </span>
      )
    }
  ];

  const totalClientes = clients.length;
  const totalCredito = clients.reduce((sum, client) => sum + client.credit_limit, 0);
  const totalSaldo = clients.reduce((sum, client) => sum + client.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Clientes">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalClientes}</div>
              <div className="text-sm text-gray-500">Registrados</div>
            </div>
          </div>
        </Card>

        <Card title="Límite de Crédito">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                ${totalCredito.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Total autorizado</div>
            </div>
          </div>
        </Card>

        <Card title="Saldo Pendiente">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <CreditCard className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-red-600">
                ${totalSaldo.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Por cobrar</div>
            </div>
          </div>
        </Card>

        <Card title="Disponible">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <CreditCard className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-yellow-600">
                ${(totalCredito - totalSaldo).toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Para ventas</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Lista de Clientes">
            <DataTable
              data={clients}
              columns={columns}
              title="Clientes Registrados"
            />
          </Card>
        </div>

        <div className="space-y-6">
          {showForm && (
            <Card title={editingClient ? "Editar Cliente" : "Nuevo Cliente"}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Supermercado El Águila"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RFC *
                  </label>
                  <input
                    type="text"
                    value={newClient.rfc}
                    onChange={(e) => setNewClient(prev => ({ ...prev, rfc: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: SEA456789123"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    value={newClient.address}
                    onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dirección completa"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={newClient.phone}
                      onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="555-123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="contacto@cliente.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Localidad *
                  </label>
                  <input
                    type="text"
                    value={newClient.zone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, zone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Localidad del cliente"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Límite de Crédito
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newClient.credit_limit}
                      onChange={(e) => setNewClient(prev => ({ ...prev, credit_limit: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Saldo Inicial
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newClient.balance}
                      onChange={(e) => setNewClient(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio por Defecto *
                  </label>
                  <select
                    value={newClient.default_price_level || 1}
                    onChange={(e) => setNewClient(prev => ({ ...prev, default_price_level: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={1}>Precio 1 - General</option>
                    <option value={2}>Precio 2 - Mayoreo</option>
                    <option value={3}>Precio 3 - Distribuidor</option>
                    <option value={4}>Precio 4 - VIP</option>
                    <option value={5}>Precio 5 - Especial</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingClient ? 'Actualizar' : 'Crear'} Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingClient(null);
                      setNewClient({
                        name: '',
                        rfc: '',
                        address: '',
                        phone: '',
                        email: '',
                        zone: '',
                        credit_limit: 0,
                        balance: 0
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </Card>
          )}

          <Card title="Distribución por Localidad">
            <div className="space-y-3">
              {Array.from(new Set(clients.map(c => c.zone).filter(Boolean))).map((localidad) => {
                const clientesLocalidad = clients.filter(c => c.zone === localidad).length;
                const porcentaje = totalClientes > 0 ? (clientesZona / totalClientes) * 100 : 0;
                
                return (
                  <div key={localidad} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{localidad}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${porcentaje}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{clientesLocalidad}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Acciones Rápidas">
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Estado de Cuenta</div>
                <div className="text-sm text-gray-500">Ver deudas pendientes</div>
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Reporte de Ventas</div>
                <div className="text-sm text-gray-500">Por cliente</div>
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Precios Especiales</div>
                <div className="text-sm text-gray-500">Configurar descuentos</div>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}