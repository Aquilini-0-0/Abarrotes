import React, { useState } from 'react';
import { X, CreditCard, DollarSign, Smartphone, Calculator, AlertTriangle } from 'lucide-react';
import { POSOrder, POSClient, PaymentBreakdown } from '../../types/pos';

interface POSPaymentModalProps {
  order: POSOrder;
  client: POSClient | null;
  onClose: () => void;
  onConfirm: (paymentData: any) => void;
}

export function POSPaymentModal({ order, client, onClose, onConfirm }: POSPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'credit' | 'mixed'>('cash');
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown>({
    cash: order.total,
    card: 0,
    transfer: 0,
    credit: 0
  });
  const [cashReceived, setCashReceived] = useState(order.total);
  const [printTicket, setPrintTicket] = useState(true);
  const [printA4, setPrintA4] = useState(false);

  const change = cashReceived - order.total;
  const totalPayment = paymentBreakdown.cash + paymentBreakdown.card + paymentBreakdown.transfer + paymentBreakdown.credit;
  const paymentComplete = Math.abs(totalPayment - order.total) < 0.01;

  const handlePaymentBreakdownChange = (method: keyof PaymentBreakdown, amount: number) => {
    setPaymentBreakdown(prev => ({
      ...prev,
      [method]: amount
    }));
  };

  const handleQuickCash = (amount: number) => {
    setCashReceived(amount);
    setPaymentBreakdown(prev => ({
      ...prev,
      cash: Math.min(amount, order.total)
    }));
  };

  const handleConfirm = () => {
    if (!paymentComplete && paymentMethod === 'mixed') {
      alert('El total de pagos debe coincidir con el importe del pedido');
      return;
    }

    const paymentData = {
      method: paymentMethod,
      breakdown: paymentMethod === 'mixed' ? paymentBreakdown : undefined,
      cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
      change: paymentMethod === 'cash' ? change : 0,
      printTicket,
      printA4
    };

    onConfirm(paymentData);
  };

  return (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 animate-fadeIn">

    {/* Header */}
    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-t-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-xl">Procesar Pago</h2>
        <button onClick={onClose} className="text-white hover:opacity-80 transition">
          <X size={24} />
        </button>
      </div>
    </div>

    <div className="p-6 space-y-6">
      {/* Order Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex justify-between mb-2 text-gray-600">
          <span>Cliente:</span>
          <span className="font-semibold">{order.client_name}</span>
        </div>
        <div className="flex justify-between mb-2 text-gray-600">
          <span>Artículos:</span>
          <span>{order.items.length} productos</span>
        </div>
        <div className="flex justify-between mb-2 text-gray-600">
          <span>Subtotal:</span>
          <span className="font-mono font-semibold">${order.subtotal.toFixed(2)}</span>
        </div>
        {order.discount_total > 0 && (
          <div className="flex justify-between text-red-500 font-medium">
            <span>Descuento:</span>
            <span>-${order.discount_total.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-gray-300 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-orange-600 font-bold text-lg">TOTAL:</span>
            <span className="text-red-600 font-bold text-2xl font-mono">${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Método de Pago */}
      <div>
        <h3 className="text-gray-800 font-bold mb-3">Método de Pago</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { method: 'cash', label: 'Efectivo', color: 'from-green-400 to-green-600', icon: <DollarSign size={20} /> },
            { method: 'card', label: 'Tarjeta', color: 'from-blue-400 to-blue-600', icon: <CreditCard size={20} /> },
            { method: 'transfer', label: 'Transferencia', color: 'from-purple-400 to-purple-600', icon: <Smartphone size={20} /> },
            { method: 'credit', label: 'Crédito', color: 'from-yellow-400 to-yellow-600', icon: <CreditCard size={20} /> },
            { method: 'mixed', label: 'Mixto', color: 'from-orange-400 to-red-500', icon: <Calculator size={20} /> }
          ].map((btn) => (
            <button
              key={btn.method}
              onClick={() => setPaymentMethod(btn.method)}
              disabled={btn.method === 'credit' && !client}
              className={`p-3 rounded-xl text-sm font-semibold border transition
                ${paymentMethod === btn.method
                  ? `bg-gradient-to-br ${btn.color} text-white shadow-md`
                  : 'bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-700'}
                ${btn.method === 'credit' && !client ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex flex-col items-center">{btn.icon}{btn.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Pago en Efectivo */}
      {paymentMethod === 'cash' && (
        <div>
          <h4 className="text-gray-800 font-semibold mb-2">Pago en Efectivo</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 text-sm mb-1">Efectivo Recibido</label>
              <input
                type="number"
                step="0.01"
                value={cashReceived}
                onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-1">Cambio</label>
              <div className={`border rounded-lg px-3 py-2 font-mono ${
                change >= 0 ? 'text-green-600 border-green-400' : 'text-red-600 border-red-400'
              }`}>
                ${change.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pago Mixto */}
      {paymentMethod === 'mixed' && (
        <div>
          <h4 className="text-gray-800 font-semibold mb-2">Pago Mixto</h4>
          <div className="grid grid-cols-2 gap-4">
            {['cash','card','transfer','credit'].map((type) => (
              <div key={type}>
                <label className="block text-gray-600 text-sm mb-1">{type.charAt(0).toUpperCase() + type.slice(1)}</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentBreakdown[type]}
                  onChange={(e) => handlePaymentBreakdownChange(type, parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="0.00"
                  disabled={type === 'credit' && !client}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total Pagos:</span>
              <span className={`${paymentComplete ? 'text-green-600' : 'text-red-600'} font-mono`}>${totalPayment.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Pedido:</span>
              <span className="font-semibold">${order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-300 pt-2 mt-2">
              <span className="font-semibold text-gray-800">Diferencia:</span>
              <span className={`${Math.abs(totalPayment - order.total) < 0.01 ? 'text-green-600' : 'text-red-600'} font-bold`}>
                ${(totalPayment - order.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Opciones de Impresión */}
      <div>
        <h4 className="text-gray-800 font-semibold mb-2">Opciones de Impresión</h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-gray-600">
            <input type="checkbox" checked={printTicket} onChange={(e) => setPrintTicket(e.target.checked)} />
            <span>Imprimir Ticket</span>
          </label>
          <label className="flex items-center space-x-2 text-gray-600">
            <input type="checkbox" checked={printA4} onChange={(e) => setPrintA4(e.target.checked)} />
            <span>Formato A4</span>
          </label>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-white text-orange-600 border border-orange-500 hover:bg-orange-50 rounded-lg font-semibold"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          disabled={
            (paymentMethod === 'cash' && change < 0) ||
            (paymentMethod === 'mixed' && !paymentComplete) ||
            (paymentMethod === 'credit' && (!client || (client.credit_limit - client.balance) < order.total))
          }
          className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-bold shadow disabled:opacity-50"
        >
          Confirmar Pago
        </button>
      </div>
    </div>
  </div>
</div>


    


  );
}