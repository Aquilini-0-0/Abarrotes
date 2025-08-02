import React, { useState, useEffect } from 'react';
import { X, Search, CreditCard, DollarSign, Calendar, User, AlertCircle, Eye, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CreditSale {
  id: string;
  client_id: string;
  client_name: string;
  date: string;
  total: number;
  balance: number;
  status: 'pending' | 'partial' | 'paid';
  days_overdue: number;
  items?: any[];
}

interface Payment {
  id: string;
  sale_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'transfer';
  date: string;
  reference: string;
}

interface POSCreditPaymentsModalProps {
  onClose: () => void;
  onPaymentProcessed?: () => void;
}

export function POSCreditPaymentsModal({ onClose, onPaymentProcessed }: POSCreditPaymentsModalProps) {
  const [creditSales, setCreditSales] = useState<CreditSale[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedSale, setSelectedSale] = useState<CreditSale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showSaleDetail, setShowSaleDetail] = useState(false);

  const [newPayment, setNewPayment] = useState({
    amount: 0,
    payment_method: 'cash' as const,
    reference: ''
  });

  useEffect(() => {
    fetchCreditSales();
    fetchClients();
    fetchPayments();
  }, []);

  const fetchCreditSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            product_id,
            product_name,
            quantity,
            price,
            total
          )
        `)
        .in('status', ['pending', 'overdue'])
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedSales: CreditSale[] = data.map(sale => {
        const saleDate = new Date(sale.date);
        const today = new Date();
        const diffTime = today.getTime() - saleDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: sale.id,
          client_id: sale.client_id,
          client_name: sale.client_name,
          date: sale.date,
          total: sale.total,
          balance: sale.total, // En un sistema real, calcularíamos restando pagos
          status: diffDays > 30 ? 'pending' : 'pending', // Mantener como pending por ahora
          days_overdue: Math.max(0, diffDays - 30), // Asumiendo 30 días de crédito
          items: sale.sale_items || []
        };
      });

      setCreditSales(formattedSales);
    } catch (err) {
      console.error('Error fetching credit sales:', err);
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

  const fetchPayments = async () => {
    try {
      // En un sistema real, tendríamos una tabla de pagos
      // Por ahora simulamos algunos pagos
      const mockPayments: Payment[] = [
        {
          id: '1',
          sale_id: 'sale-1',
          amount: 1500.00,
          payment_method: 'cash',
          date: '2025-01-15',
          reference: 'PAG-001'
        }
      ];
      setPayments(mockPayments);
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedSale || newPayment.amount <= 0) {
      alert('Por favor complete todos los campos');
      return;
    }

    if (newPayment.amount > selectedSale.balance) {
      alert('El monto no puede ser mayor al saldo pendiente');
      return;
    }

    try {
      // 1. Crear registro del pago
      const payment: Payment = {
        id: `pay-${Date.now()}`,
        sale_id: selectedSale.id,
        amount: newPayment.amount,
        payment_method: newPayment.payment_method,
        date: new Date().toISOString().split('T')[0],
        reference: newPayment.reference || `PAG-${Date.now().toString().slice(-6)}`
      };

      // 2. Guardar el pago en el estado local
      setPayments(prev => [payment, ...prev]);

      // 3. Calcular nuevo saldo y estado
      const newBalance = selectedSale.balance - newPayment.amount;
      const newStatus = newBalance <= 0.01 ? 'paid' : 'partial'; // Usar 0.01 para evitar problemas de precisión

      // 4. Actualizar la venta en el estado local
      setCreditSales(prev => prev.map(sale => 
        sale.id === selectedSale.id 
          ? { ...sale, balance: Math.max(0, newBalance), status: newStatus as any }
          : sale
      ));

      // 5. Actualizar en la base de datos
      if (newBalance <= 0.01) {
        // Marcar como pagada completamente
        const { error: saleError } = await supabase
          .from('sales')
          .update({ status: 'paid' })
          .eq('id', selectedSale.id);

        if (saleError) {
          console.error('Error updating sale status:', saleError);
        }
      }

      // 6. Actualizar saldo del cliente
      const client = clients.find(c => c.id === selectedSale.client_id);
      if (client) {
        const newClientBalance = Math.max(0, client.balance - newPayment.amount);
        const { error: clientError } = await supabase
          .from('clients')
          .update({ balance: newClientBalance })
          .eq('id', selectedSale.client_id);

        if (clientError) {
          console.error('Error updating client balance:', clientError);
        }

        // Actualizar clientes en el estado local
        setClients(prev => prev.map(c => 
          c.id === selectedSale.client_id 
            ? { ...c, balance: newClientBalance }
            : c
        ));
      }

      // 7. Crear movimiento de caja si es efectivo
      if (newPayment.payment_method === 'cash') {
        // En un sistema real, actualizaríamos el registro de caja
        console.log('Movimiento de efectivo registrado:', newPayment.amount);
      }

      setNewPayment({
        amount: 0,
        payment_method: 'cash',
        reference: ''
      });
      setShowPaymentForm(false);
      setSelectedSale(null);
      
      // Mensaje de confirmación más detallado
      const message = newBalance <= 0.01 
        ? `¡Pago procesado! La venta ha sido pagada completamente.`
        : `¡Abono procesado! Saldo restante: $${newBalance.toFixed(2)}`;
      alert(message);
      
      // Refrescar datos
      await fetchCreditSales();
      await fetchClients();
      
      // Notificar al componente padre para que actualice sus datos
      if (onPaymentProcessed) {
        onPaymentProcessed();
      }
      
    } catch (err) {
      console.error('Error processing payment:', err);
      alert('Error al procesar el pago: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleQuickPayment = (percentage: number) => {
    if (selectedSale) {
      const amount = selectedSale.balance * (percentage / 100);
      setNewPayment(prev => ({ ...prev, amount }));
    }
  };

  const filteredSales = creditSales.filter(sale => {
    const matchesSearch = sale.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPending = creditSales.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.balance, 0);
  const totalOverdue = creditSales.filter(s => s.days_overdue > 0).reduce((sum, s) => sum + s.balance, 0);
  const totalPartial = creditSales.filter(s => s.status === 'partial').reduce((sum, s) => sum + s.balance, 0);

  const getStatusColor = (status: string, daysOverdue: number) => {
    if (daysOverdue > 0) return 'bg-red-100 text-red-800';
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string, daysOverdue: number) => {
    if (daysOverdue > 0) return `Vencida (${daysOverdue}d)`;
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'partial': return 'Parcial';
      case 'paid': return 'Pagada';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
    
    {/* Header */}
    <div className=" bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4 border-b border-orange-600">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-xl">
          Abonar/Pagar Ventas a Crédito
        </h2>
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
        {/* Total por Cobrar */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-orange-600">
                ${totalPending.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-orange-700">Total por Cobrar</div>
            </div>
          </div>
        </div>

        {/* Ventas Vencidas */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-red-600">
                ${totalOverdue.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-red-700">Ventas Vencidas</div>
            </div>
          </div>
        </div>

        {/* Pagos Parciales */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                ${totalPartial.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-yellow-700">Pagos Parciales</div>
            </div>
          </div>
        </div>

        {/* Ventas a Crédito */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <User className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-600">
                {creditSales.length}
              </div>
              <div className="text-sm text-green-700">Ventas a Crédito</div>
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
              placeholder="Buscar cliente o folio..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="partial">Pagos Parciales</option>
            <option value="paid">Pagadas</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          Mostrando {filteredSales.length} de {creditSales.length} ventas
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-orange-100 to-red-100">
            <tr>
              <th className="text-left p-3 text-gray-700 font-semibold">Folio</th>
              <th className="text-left p-3 text-gray-700 font-semibold">Cliente</th>
              <th className="text-left p-3 text-gray-700 font-semibold">Fecha</th>
              <th className="text-right p-3 text-gray-700 font-semibold">Total</th>
              <th className="text-right p-3 text-gray-700 font-semibold">Saldo</th>
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
            ) : filteredSales.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No se encontraron ventas a crédito
                </td>
              </tr>
            ) : (
              filteredSales.map((sale, index) => (
                <tr
                  key={sale.id}
                  className={`border-b border-gray-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-orange-50 transition`}
                >
                  <td className="p-3 font-mono text-orange-600">
                    #{sale.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="p-3 text-gray-900 font-medium">{sale.client_name}</td>
                  <td className="p-3 text-gray-700">
                    {new Date(sale.date).toLocaleDateString('es-MX')}
                  </td>
                  <td className="p-3 text-right font-mono text-gray-900">
                    ${sale.total.toLocaleString('es-MX')}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-red-600">
                    ${sale.balance.toLocaleString('es-MX')}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        sale.status,
                        sale.days_overdue
                      )}`}
                    >
                      {getStatusText(sale.status, sale.days_overdue)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSale(sale);
                          setNewPayment((prev) => ({ ...prev, amount: sale.balance }));
                          setShowPaymentForm(true);
                        }}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Procesar pago"
                      >
                        <DollarSign size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSale(sale);
                          setShowSaleDetail(true);
                        }}
                        className="p-1 text-orange-600 hover:text-orange-800"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
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
{/* Payment Form Modal */}
{showPaymentForm && selectedSale && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
      
      {/* Header con degradado */}
      <div className=" bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Procesar Pago</h3>
          <button
            onClick={() => {
              setShowPaymentForm(false);
              setSelectedSale(null);
            }}
            className="text-white hover:text-gray-100 transition"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Contenido Scrollable */}
      <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-5">

        {/* Info de la Venta */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg shadow-inner">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Cliente:</span>
              <span className="font-semibold">{selectedSale.client_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Folio:</span>
              <span className="font-mono text-gray-800">
                #{selectedSale.id.slice(-6).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Total Venta:</span>
              <span className="font-mono font-bold text-gray-900">
                ${selectedSale.total.toLocaleString('es-MX')}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-2">
              <span className="text-gray-700 font-medium">Saldo Pendiente:</span>
              <span className="font-bold text-red-600">
                ${selectedSale.balance.toLocaleString('es-MX')}
              </span>
            </div>
          </div>
        </div>

        {/* Monto a Pagar */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Monto a Pagar</label>
          <input
            type="number"
            step="0.01"
            value={newPayment.amount}
            onChange={(e) => setNewPayment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-lg"
            placeholder="0.00"
            max={selectedSale.balance}
            min="0"
          />

          {/* Botones rápidos */}
          <div className="flex space-x-2 mt-3">
            <button
              onClick={() => handleQuickPayment(50)}
              className="flex-1 bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 text-orange-700 font-medium py-2 rounded-lg"
            >
              50%
            </button>
            <button
              onClick={() => handleQuickPayment(100)}
              className="flex-1 bg-gradient-to-r from-red-100 to-orange-100 hover:from-red-200 hover:to-orange-200 text-orange-700 font-medium py-2 rounded-lg"
            >
              Total
            </button>
          </div>
        </div>

        {/* Método de pago */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Método de Pago</label>
          <select
            value={newPayment.payment_method}
            onChange={(e) => setNewPayment(prev => ({ ...prev, payment_method: e.target.value as any }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
          >
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="transfer">Transferencia</option>
          </select>
        </div>

        {/* Referencia */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Referencia (Opcional)</label>
          <input
            type="text"
            value={newPayment.reference}
            onChange={(e) => setNewPayment(prev => ({ ...prev, reference: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
            placeholder="Ej: PAG-001"
          />
        </div>
      </div>

    {/* Footer compacto */}
<div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 py-2 px-3 border-t border-red-700">
  <div className="grid grid-cols-3 gap-2">
    
    {/* Botón Procesar */}
    <button
      onClick={handleProcessPayment}
      disabled={newPayment.amount <= 0 || newPayment.amount > selectedSale.balance}
      className="bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 disabled:from-gray-200 disabled:to-gray-300 text-green-700 disabled:text-gray-500 py-2 px-3 rounded-md font-semibold text-xs shadow-sm transition-all flex flex-col items-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      PAGAR
    </button>

    {/* Botón Guardar */}
    <button
      className="bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 text-orange-700 py-2 px-3 rounded-md font-semibold text-xs shadow-sm flex flex-col items-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      GUARDAR
    </button>

    {/* Botón Cancelar */}
    <button
      onClick={() => {
        setShowPaymentForm(false);
        setSelectedSale(null);
      }}
      className="bg-white text-orange-600 border border-orange-600 py-2 px-3 rounded-md font-semibold text-xs shadow-sm hover:bg-orange-50 flex flex-col items-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
      CANCELAR
    </button>
        </div>
      </div>
    </div>
  </div>
)}




        {/* Sale Detail Modal */}
        {showSaleDetail && selectedSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="bg-blue-600 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold">Detalle de Venta a Crédito</h3>
                  <button
                    onClick={() => {
                      setShowSaleDetail(false);
                      setSelectedSale(null);
                    }}
                    className="text-blue-100 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Sale Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Información de la Venta</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Folio:</span>
                        <span className="font-mono">#{selectedSale.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cliente:</span>
                        <span className="font-medium">{selectedSale.client_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fecha:</span>
                        <span>{new Date(selectedSale.date).toLocaleDateString('es-MX')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estado:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSale.status, selectedSale.days_overdue)}`}>
                          {getStatusText(selectedSale.status, selectedSale.days_overdue)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Información de Crédito</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Venta:</span>
                        <span className="font-mono">${selectedSale.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Saldo Pendiente:</span>
                        <span className="font-bold text-red-600">${selectedSale.balance.toFixed(2)}</span>
                      </div>
                      {selectedSale.days_overdue > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Días Vencidos:</span>
                          <span className="font-bold text-red-600">{selectedSale.days_overdue} días</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Products Table */}
                {selectedSale.items && selectedSale.items.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-900">Productos Vendidos</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 text-gray-700 font-semibold">Producto</th>
                            <th className="text-center p-3 text-gray-700 font-semibold">Cantidad</th>
                            <th className="text-right p-3 text-gray-700 font-semibold">Precio Unit.</th>
                            <th className="text-right p-3 text-gray-700 font-semibold">Importe</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSale.items.map((item: any, index: number) => (
                            <tr key={index} className={`border-b border-gray-200 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}>
                              <td className="p-3">
                                <div className="font-medium text-gray-900">{item.product_name}</div>
                                <div className="text-xs text-gray-500">ID: {item.product_id}</div>
                              </td>
                              <td className="p-3 text-center font-semibold text-blue-600">
                                {item.quantity}
                              </td>
                              <td className="p-3 text-right font-mono text-green-600">
                                ${item.price.toFixed(2)}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-gray-900">
                                ${item.total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100">
                          <tr>
                            <td colSpan={3} className="p-3 text-right font-semibold text-gray-900">
                              TOTAL:
                            </td>
                            <td className="p-3 text-right font-bold text-red-600 text-lg">
                              ${selectedSale.total.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowSaleDetail(false);
                      setNewPayment(prev => ({ ...prev, amount: selectedSale.balance }));
                      setShowPaymentForm(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <DollarSign size={16} />
                    <span>Procesar Pago</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowSaleDetail(false);
                      setSelectedSale(null);
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