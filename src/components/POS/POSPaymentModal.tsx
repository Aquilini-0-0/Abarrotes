import React, { useState } from 'react';

import { X, CreditCard, DollarSign, Smartphone, Calculator, AlertTriangle, Lock, FileText } from 'lucide-react';

import { POSOrder, POSClient, PaymentBreakdown, Payment } from '../../types/pos';

import { supabase } from '../../lib/supabase';
import { useProducts } from '../../hooks/useProducts';



interface Vale {

  id: string;

  folio_vale: string;

  cliente: string;

  importe: number;

  disponible: number;

  estatus: 'HABILITADO' | 'USADO' | 'VENCIDO';

}



interface POSPaymentModalProps {

  order: POSOrder;

  client: POSClient | null;

  onClose: () => void;

  onConfirm: (paymentData: any) => void;

  onProcessPayment?: (orderId: string, paymentData: any) => Promise<any>;

}



export function POSPaymentModal({ order, client, onClose, onConfirm, onProcessPayment }: POSPaymentModalProps) {
  const { products } = useProducts();

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'credit' | 'mixed' | 'vales'>('cash');

  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown>({

    cash: order.total || 0,

    card: 0,

    transfer: 0,

    credit: 0

  });

  const [cashReceived, setCashReceived] = useState(order.total || 0);

  const [paymentAmount, setPaymentAmount] = useState(order.total || 0);

  const [isPartialPayment, setIsPartialPayment] = useState(false);

  const [printTicket, setPrintTicket] = useState(true);

  const [printA4, setPrintA4] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  const [showCreditAuthModal, setShowCreditAuthModal] = useState(false);

  const [adminPassword, setAdminPassword] = useState('');

  const [clientVales, setClientVales] = useState<Vale[]>([]);

  const [selectedVale, setSelectedVale] = useState<Vale | null>(null);

  const [loadingVales, setLoadingVales] = useState(false);
  const [showStockValidation, setShowStockValidation] = useState(false);
  const [stockIssues, setStockIssues] = useState<Array<{product_name: string, required: number, available: number}>>([]);
  const [pendingPaymentData, setPendingPaymentData] = useState<any>(null);
  const [stockOverride, setStockOverride] = useState(false);



  const orderTotal = order.total || 0;

  const change = cashReceived - paymentAmount;

  const totalPayment = paymentMethod === 'mixed'

    ? paymentBreakdown.cash + paymentBreakdown.card + paymentBreakdown.transfer + paymentBreakdown.credit

    : paymentAmount;

  const paymentComplete = Math.abs(totalPayment - paymentAmount) < 0.01;

  

  // Check if credit exceeds limit

  const creditExceeded = client && (paymentMethod === 'credit' || paymentBreakdown.credit > 0) &&

    (client.balance + paymentAmount) > client.credit_limit;



  // Show payment history if order has payments

  const hasPayments = order.payments && order.payments.length > 0;

  const totalPaid = order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  const remainingBalance = orderTotal - totalPaid;



  const validateAdminPassword = (password: string) => {

    return password === 'admin123'; // En producción, validar contra la base de datos

  };



  // Fetch client vales when payment method changes to vales

  React.useEffect(() => {

    if (paymentMethod === 'vales' && client) {

      fetchClientVales();

    }

  }, [paymentMethod, client]);



  const fetchClientVales = async () => {

    if (!client) return;

    

    setLoadingVales(true);

    try {

      const { data, error } = await supabase

        .from('vales_devolucion')

        .select('*')

        .eq('cliente', client.name)

        .eq('estatus', 'HABILITADO')

        .gt('disponible', 0)

        .order('fecha_expedicion', { ascending: false });



      if (error) throw error;



      const formattedVales: Vale[] = data.map(item => ({

        id: item.id,

        folio_vale: item.folio_vale,

        cliente: item.cliente,

        importe: item.importe,

        disponible: item.disponible,

        estatus: item.estatus

      }));

      

      setClientVales(formattedVales);

    } catch (err) {

      console.error('Error fetching client vales:', err);

      setClientVales([]);

    } finally {

      setLoadingVales(false);

    }

  };



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



  // --- MODIFICACIÓN: Lógica de confirmación ahora verifica primero la autorización ---

  const handleConfirm = () => {

    if (isProcessing) return; // Prevent double submission

    

    if (!paymentComplete && paymentMethod === 'mixed') {

      alert('El total de pagos debe coincidir con el importe del pedido');

      return;

    }



    // Validate stock before processing payment
    validateStockBeforePayment();
  };

  const validateStockBeforePayment = async () => {
    try {
      const issues: Array<{product_name: string, required: number, available: number}> = [];
      
      // Check stock for each item in the order
      for (const item of order.items) {
        const product = products.find(p => p.id === item.product_id);
        if (product && item.quantity > product.stock) {
          issues.push({
            product_name: item.product_name,
            required: item.quantity,
            available: product.stock
          });
        }
      }
      
      if (issues.length > 0) {
        setStockIssues(issues);
        setPendingPaymentData({
          method: paymentMethod,
          breakdown: paymentMethod === 'mixed' ? paymentBreakdown : undefined,
          cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
          change: paymentMethod === 'cash' ? change : 0,
          selectedVale: paymentMethod === 'vales' ? selectedVale : undefined,
          printTicket,
          printA4
        });
        setShowStockValidation(true);
        return;
      }
      
      // If no stock issues, proceed with payment
      proceedWithPayment();
    } catch (err) {
      console.error('Error validating stock:', err);
      // If validation fails, proceed anyway
      proceedWithPayment();
    }
  };

  const proceedWithPayment = () => {

    // NUEVA LÓGICA: Si excede el límite de crédito, muestra el modal de autorización

    const creditAmount = paymentMethod === 'credit' ? order.total : paymentMethod === 'mixed' ? paymentBreakdown.credit : 0;

    const creditExceededCondition = client && creditAmount > 0 && (client.balance + creditAmount) > client.credit_limit;



    if (creditExceededCondition) {

      setShowCreditAuthModal(true);

      return;

    }

    

    // Si no requiere autorización, procesa el pago directamente

    processPayment();

  };



  const handleStockValidationConfirm = (proceed: boolean) => {
    setShowStockValidation(false);
    if (proceed) {
      setStockOverride(true);
      // If user confirms to proceed despite stock issues, process the payment
      if (pendingPaymentData) {
        processPayment(true); // Pass true to override stock validation
      }
    } else {
      setStockOverride(false);
    }
    setStockIssues([]);
    setPendingPaymentData(null);
  };

  // --- NUEVA FUNCIÓN: Para manejar la autorización del administrador ---

  const handleCreditAuth = () => {

    if (!validateAdminPassword(adminPassword)) {

      alert('Contraseña de administrador incorrecta');

      setAdminPassword('');

      return;

    }



    // Si la contraseña es correcta, cierra el modal y procede con el pago
    setShowCreditAuthModal(false);
    setAdminPassword('');
    processPayment();
  };

  const processPayment = (overrideStock = false) => {
    setIsProcessing(true);
    
    const paymentData = {
      method: paymentMethod,
      breakdown: paymentMethod === 'mixed' ? paymentBreakdown : undefined,
      cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
      change: paymentMethod === 'cash' ? change : 0,
      selectedVale: paymentMethod === 'vales' ? selectedVale : undefined,
      stockOverride: overrideStock || stockOverride,
      printTicket,
      printA4
    };

    // Simulate processing delay
    setTimeout(() => {
      onConfirm(paymentData);
      setIsProcessing(false);
    }, 1000);
  };



  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-xs sm:max-w-lg lg:max-w-2xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto border border-gray-200">



        {/* Header */}

        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 sm:p-4 rounded-t-xl sm:rounded-t-2xl">

          <div className="flex items-center justify-between">

            <h2 className="text-white font-bold text-lg sm:text-xl">Procesar Pago</h2>

            <button onClick={onClose} className="text-white hover:opacity-80 transition">

              <X size={20} className="sm:w-6 sm:h-6" />

            </button>

          </div>

        </div>



        <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">

          {/* Order Summary */}

          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">

            <div className="flex justify-between mb-1 sm:mb-2 text-gray-600 text-sm">

              <span>Cliente:</span>

              <span className="font-semibold">{order.client_name}</span>

            </div>

            <div className="flex justify-between mb-1 sm:mb-2 text-gray-600 text-sm">

              <span>Artículos:</span>

              <span>{order.items.length} productos</span>

            </div>

            <div className="flex justify-between mb-1 sm:mb-2 text-gray-600 text-sm">

              <span>Subtotal:</span>

              <span className="font-mono font-semibold">${order.subtotal.toFixed(2)}</span>

            </div>

            {order.discount_total > 0 && (

              <div className="flex justify-between text-red-500 font-medium text-sm">

                <span>Descuento:</span>

                <span>-${order.discount_total.toFixed(2)}</span>

              </div>

            )}

            <div className="border-t border-gray-300 pt-2 sm:pt-3">

              <div className="flex justify-between items-center">

                <span className="text-orange-600 font-bold text-base sm:text-lg">TOTAL:</span>

                <span className="text-red-600 font-bold text-xl sm:text-2xl font-mono">${order.total.toFixed(2)}</span>

              </div>

            </div>

          </div>



          {/* Credit limit warning (now handled by the modal trigger logic) */}

          {creditExceeded && (

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">

              <div className="flex items-center">

                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />

                <div>

                  <p className="text-red-800 font-medium">Límite de crédito excedido</p>

                  <p className="text-red-600 text-sm">

                    Límite: ${client?.credit_limit.toLocaleString('es-MX')} | 

                    Usado: ${client?.balance.toLocaleString('es-MX')} | 

                    Este pedido: ${order.total.toLocaleString('es-MX')}

                  </p>

                </div>

              </div>

            </div>

          )}



          {/* Método de Pago */}

          <div>

            <h3 className="text-gray-800 font-bold mb-2 sm:mb-3 text-sm sm:text-base">Método de Pago</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">

              {[

                { method: 'cash', label: 'Efectivo', color: 'from-green-400 to-green-600', icon: <DollarSign size={20} /> },

                { method: 'card', label: 'Tarjeta', color: 'from-blue-400 to-blue-600', icon: <CreditCard size={20} /> },

                { method: 'transfer', label: 'Transferencia', color: 'from-purple-400 to-purple-600', icon: <Smartphone size={20} /> },

                { method: 'credit', label: 'Crédito', color: 'from-yellow-400 to-yellow-600', icon: <CreditCard size={20} /> },

                { method: 'mixed', label: 'Mixto', color: 'from-orange-400 to-red-500', icon: <Calculator size={20} /> },

                { method: 'vales', label: 'Vales', color: 'from-pink-400 to-pink-600', icon: <FileText size={20} /> }

              ].map((btn) => (

                <button

                  key={btn.method}

                  onClick={() => setPaymentMethod(btn.method as 'cash' | 'card' | 'transfer' | 'credit' | 'mixed' | 'vales')}

                  disabled={(btn.method === 'credit' || btn.method === 'vales') && !client}

                  className={`p-2 sm:p-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold border transition

                    ${paymentMethod === btn.method

                      ? `bg-gradient-to-br ${btn.color} text-white shadow-md`

                      : 'bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-700'}

                    ${(btn.method === 'credit' || btn.method === 'vales') && !client ? 'opacity-40 cursor-not-allowed' : ''}

                  `}

                >

                  <div className="flex flex-col items-center">

                    <div className="w-4 h-4 sm:w-5 sm:h-5 mb-1">{React.cloneElement(btn.icon, { size: window.innerWidth < 640 ? 16 : 20 })}</div>

                    {btn.label}

                  </div>

                </button>

              ))}

            </div>

          </div>



          {/* Pago en Efectivo */}

          {paymentMethod === 'cash' && (

            <div>

              <h4 className="text-gray-800 font-semibold mb-2 text-sm sm:text-base">Pago en Efectivo</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

                <div>

                  <label className="block text-gray-600 text-xs sm:text-sm mb-1">Efectivo Recibido</label>

                  <input

                    type="number"

                    step="0.01"

                    value={cashReceived}

                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}

                    className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"

                    placeholder="0.00"

                  />

                </div>

                <div>

                  <label className="block text-gray-600 text-xs sm:text-sm mb-1">Cambio</label>

                  <div className={`border rounded-lg px-2 sm:px-3 py-1 sm:py-2 font-mono text-sm ${

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

              <h4 className="text-gray-800 font-semibold mb-2 text-sm sm:text-base">Pago Mixto</h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">

                {['cash','card','transfer','credit'].map((type) => (

                  <div key={type}>

                    <label className="block text-gray-600 text-xs sm:text-sm mb-1">{type.charAt(0).toUpperCase() + type.slice(1)}</label>

                    <input

                      type="number"

                      step="0.01"

                      value={paymentBreakdown[type as keyof PaymentBreakdown]}

                      onChange={(e) => handlePaymentBreakdownChange(type as keyof PaymentBreakdown, parseFloat(e.target.value) || 0)}

                      className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"

                      placeholder="0.00"

                      disabled={type === 'credit' && !client}

                    />

                  </div>

                ))}

              </div>

              <div className="mt-2 sm:mt-3 bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3">

                <div className="flex justify-between text-sm text-gray-600">

                  <span>Total Pagos:</span>

                  <span className={`${paymentComplete ? 'text-green-600' : 'text-red-600'} font-mono`}>${totalPayment.toFixed(2)}</span>

                </div>

                <div className="flex justify-between text-sm">

                  <span className="text-gray-600">Total Pedido:</span>

                  <span className="font-semibold">${order.total.toFixed(2)}</span>

                </div>

                <div className="flex justify-between text-sm border-t border-gray-300 pt-1 sm:pt-2 mt-1 sm:mt-2">

                  <span className="font-semibold text-gray-800">Diferencia:</span>

                  <span className={`${Math.abs(totalPayment - order.total) < 0.01 ? 'text-green-600' : 'text-red-600'} font-bold`}>

                    {(totalPayment - order.total).toFixed(2)}

                  </span>

                </div>

              </div>

            </div>

          )}



          {/* Pago con Vales */}

          {paymentMethod === 'vales' && (

            <div>

              <h4 className="text-gray-800 font-semibold mb-2 text-sm sm:text-base">Pago con Vales por Devolución</h4>

              {loadingVales ? (

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">

                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>

                  <p className="text-gray-600">Cargando vales del cliente...</p>

                </div>

              ) : clientVales.length === 0 ? (

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">

                  <div className="flex items-center">

                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />

                    <div>

                      <p className="text-yellow-800 font-medium">

                        El cliente {client?.name} no tiene vales disponibles.

                      </p>

                      <p className="text-yellow-600 text-sm">

                        Seleccione otro método de pago para continuar.

                      </p>

                    </div>

                  </div>

                </div>

              ) : (

                <div className="space-y-3">

                  <div>

                    <label className="block text-gray-600 text-xs sm:text-sm mb-1">Seleccionar Vale</label>

                    <select

                      value={selectedVale?.id || ''}

                      onChange={(e) => {

                        const vale = clientVales.find(v => v.id === e.target.value);

                        setSelectedVale(vale || null);

                        if (vale) {

                          setPaymentAmount(Math.min(vale.disponible, order.total));

                        }

                      }}

                      className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"

                    >

                      <option value="">Seleccionar vale</option>

                      {clientVales.map(vale => (

                        <option key={vale.id} value={vale.id}>

                          {vale.folio_vale} - ${vale.disponible.toFixed(2)} disponible

                        </option>

                      ))}

                    </select>

                  </div>

                  

                  {selectedVale && (

                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">

                      <div className="space-y-2 text-sm">

                        <div className="flex justify-between">

                          <span className="text-gray-600">Folio Vale:</span>

                          <span className="font-mono text-pink-600">{selectedVale.folio_vale}</span>

                        </div>

                        <div className="flex justify-between">

                          <span className="text-gray-600">Disponible:</span>

                          <span className="font-mono text-green-600">${selectedVale.disponible.toFixed(2)}</span>

                        </div>

                        <div className="flex justify-between">

                          <span className="text-gray-600">Total Pedido:</span>

                          <span className="font-mono text-gray-900">${order.total.toFixed(2)}</span>

                        </div>

                        <div className="flex justify-between border-t pt-2">

                          <span className="font-semibold">Resultado:</span>

                          <span className={`font-bold ${selectedVale.disponible >= order.total ? 'text-green-600' : 'text-red-600'}`}>

                            {selectedVale.disponible >= order.total ? 'Vale cubre el total' : 'Vale insuficiente'}

                          </span>

                        </div>

                        {selectedVale.disponible < order.total && (

                          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">

                            <div className="flex items-center">

                              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />

                              <span className="text-red-800 text-sm font-medium">

                                El vale no cubre el total del pedido. Faltan ${(order.total - selectedVale.disponible).toFixed(2)}

                              </span>

                            </div>

                          </div>

                        )}

                      </div>

                    </div>

                  )}

                </div>

              )}

            </div>

          )}



          {/* Opciones de Impresión */}

          <div>

            <h4 className="text-gray-800 font-semibold mb-2 text-sm sm:text-base">Opciones de Impresión</h4>

            <div className="space-y-2">

              <label className="flex items-center space-x-2 text-gray-600 text-sm">

                <input type="checkbox" checked={printTicket} onChange={(e) => setPrintTicket(e.target.checked)} className="w-4 h-4" />

                <span>Imprimir Ticket</span>

              </label>

              <label className="flex items-center space-x-2 text-gray-600 text-sm">

                <input type="checkbox" checked={printA4} onChange={(e) => setPrintA4(e.target.checked)} className="w-4 h-4" />

                <span>Formato A4</span>

              </label>

            </div>

          </div>



          {/* Botones */}

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4 border-t border-gray-200">

            <button

              onClick={onClose}

              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-white text-orange-600 border border-orange-500 hover:bg-orange-50 rounded-lg font-semibold text-sm"

            >

              Cancelar

            </button>

            <button

              onClick={handleConfirm}

              // --- CAMBIO CLAVE AQUÍ: Hemos eliminado la condición de crédito ---

              disabled={

                isProcessing ||

                (paymentMethod === 'cash' && change < 0) ||

                (paymentMethod === 'mixed' && !paymentComplete) ||

                (paymentMethod === 'credit' && !client) || // El botón solo se deshabilita si no hay cliente para crédito

                (paymentMethod === 'vales' && (!selectedVale || selectedVale.disponible < order.total))

              }

              className={`w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg font-bold shadow disabled:opacity-50 text-sm transition-all ${

                isProcessing 

                  ? 'bg-gray-400 cursor-not-allowed' 

                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'

              } text-white`}

            >

              {isProcessing ? (

                <div className="flex items-center justify-center">

                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>

                  Procesando pago...

                </div>

              ) : (

                'Confirmar Pago'

              )}

            </button>

          </div>

        </div>

        {/* Stock Validation Modal */}
        {showStockValidation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="bg-red-600 p-4 border-b border-red-700 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-white" />
                    <h3 className="text-white font-bold">Stock Insuficiente</h3>
                  </div>
                  <button
                    onClick={() => handleStockValidationConfirm(false)}
                    className="text-red-100 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="text-center mb-6">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay stock suficiente para este pedido
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Los siguientes productos no tienen stock suficiente en el sistema:
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="space-y-2">
                      {stockIssues.map((issue, index) => (
                        <div key={index} className="text-sm text-red-800">
                          <div className="font-medium">{issue.product_name}</div>
                          <div className="text-xs">
                            Requerido: {issue.required} | Disponible: {issue.available}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm">
                    ¿Seguro que quieres pagar este pedido?
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleStockValidationConfirm(true)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Sí, Pagar de Todas Formas
                  </button>
                  <button
                    onClick={() => handleStockValidationConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    No, Cancelar Pago
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Credit Authorization Modal */}

        {showCreditAuthModal && (

          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">

            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">

              <div className="bg-red-600 p-4 border-b border-red-700 rounded-t-lg">

                <div className="flex items-center justify-between">

                  <div className="flex items-center space-x-2">

                    <Lock className="h-5 w-5 text-white" />

                    <h3 className="text-white font-bold">Autorización Requerida</h3>

                  </div>

                  <button

                    onClick={() => {

                      setShowCreditAuthModal(false);

                      setAdminPassword('');

                    }}

                    className="text-red-100 hover:text-white"

                  >

                    <X size={20} />

                  </button>

                </div>

              </div>

              <div className="p-6">

                <div className="text-center mb-6">

                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />

                  <h4 className="text-lg font-semibold text-gray-900 mb-2">

                    Límite de Crédito Excedido

                  </h4>

                  <p className="text-gray-600 text-sm">

                    El cliente {client?.name} excederá su límite de crédito con esta venta.

                    Se requiere autorización de administrador para continuar.

                  </p>

                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">

                    <div className="text-sm text-yellow-800">

                      <p>Límite: ${client?.credit_limit.toLocaleString('es-MX')}</p>

                      <p>Saldo actual: ${client?.balance.toLocaleString('es-MX')}</p>

                      <p>Este pedido: ${order.total.toLocaleString('es-MX')}</p>

                      <p className="font-bold">Nuevo saldo: ${((client?.balance || 0) + order.total).toLocaleString('es-MX')}</p>

                    </div>

                  </div>

                </div>

                <div className="space-y-4">

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">

                      Contraseña de Administrador

                    </label>

                    <input

                      type="password"

                      value={adminPassword}

                      onChange={(e) => setAdminPassword(e.target.value)}

                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"

                      placeholder="Ingrese contraseña..."

                      autoFocus

                      onKeyDown={(e) => {

                        if (e.key === 'Enter') {

                          handleCreditAuth();

                        }

                      }}

                    />

                  </div>

                  <div className="flex space-x-3">

                    <button

                      onClick={handleCreditAuth}

                      disabled={!adminPassword.trim()}

                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"

                    >

                      Autorizar Venta

                    </button>

                    <button

                      onClick={() => {

                        setShowCreditAuthModal(false);

                        setAdminPassword('');

                      }}

                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"

                    >

                      Cancelar

                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>

  );

}