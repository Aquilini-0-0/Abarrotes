import React, { useState } from 'react';
import { Plus, Edit, Trash2, User, CreditCard, AlertTriangle } from 'lucide-react';
import { POSOrder, POSOrderItem, POSClient } from '../../types/pos';

interface POSOrderPanelProps {
  order: POSOrder | null;
  client: POSClient | null;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onApplyDiscount: (discountAmount: number) => void;
  onSelectClient: (client: POSClient) => void;
  onPay: () => void;
  onSave: () => void;
  onCancel: () => void;
  clients: POSClient[];
  onRefreshData?: () => void;
}

export function POSOrderPanel({
  order,
  client,
  onRemoveItem,
  onUpdateQuantity,
  onApplyDiscount,
  onSelectClient,
  onPay,
  onSave,
  onCancel,
  clients,
  onRefreshData
}: POSOrderPanelProps) {
  const [showClientModal, setShowClientModal] = useState(false);
  const [searchClient, setSearchClient] = useState('');
  const [observations, setObservations] = useState('');
  const [driver, setDriver] = useState('');
  const [route, setRoute] = useState('');
  const [isCredit, setIsCredit] = useState(false);
  const [isInvoice, setIsInvoice] = useState(false);
  const [isQuote, setIsQuote] = useState(false);
  const [isExternal, setIsExternal] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchClient.toLowerCase()) ||
    c.rfc.toLowerCase().includes(searchClient.toLowerCase())
  );

  const creditUsed = client?.balance || 0;
  const creditAvailable = client ? client.credit_limit - creditUsed : 0;
  const orderTotal = order?.total || 0;
  const creditExceeded = client && isCredit && (creditUsed + orderTotal) > client.credit_limit;

  const handleApplyDiscount = () => {
      // Trigger parent update for last order
      if (onRefreshData) {
        onRefreshData();
      }
    onApplyDiscount(discountAmount);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
<div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 py-2 px-2 lg:px-4">
  <div className="flex items-center justify-between">
    {/* Left: Title + Button */}
    <div className="flex items-center space-x-2 lg:space-x-3">
      <h2 className="text-white font-bold text-sm lg:text-base">Detalle del Pedido</h2>
      <button
        onClick={() => setShowClientModal(true)}
        className="flex items-center space-x-1 lg:space-x-2 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 border border-orange-200 px-2 lg:px-3 py-1 rounded-lg text-orange-700 text-xs font-medium transition-all duration-200 shadow-sm"
      >
        <User size={14} />
        <span className="hidden lg:inline">{client?.name || 'Seleccionar Cliente'}</span>
        <span className="lg:hidden">{client?.name ? client.name.substring(0, 10) + '...' : 'Cliente'}</span>
      </button>
    </div>

    {/* Right: Pedido info */}
    <div className="text-orange-50 text-xs hidden lg:block">
      Pedido: {order?.id.slice(-6) || 'NUEVO'}
      {client && (
        <span className="ml-2">| RFC: {client.rfc} | Zona: {client.zone}</span>
      )}
    </div>
  </div>
</div>


      {/* Items Table */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-700 sticky top-0">
              <tr>
                <th className="text-left p-2 lg:p-3 text-gray-700 w-12 lg:w-16 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-xs lg:text-sm">Cant.</th>
                <th className="text-left p-2 lg:p-3 text-gray-700 w-16 lg:w-20 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-xs lg:text-sm">Pres.</th>
                <th className="text-left p-2 lg:p-3 text-gray-700 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-xs lg:text-sm">Artículo</th>
                <th className="text-right p-2 lg:p-3 text-gray-700 w-16 lg:w-20 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-xs lg:text-sm">Precio</th>
                <th className="text-right p-2 lg:p-3 text-gray-700 w-20 lg:w-24 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-xs lg:text-sm">Importe</th>
                <th className="text-center p-2 lg:p-3 text-gray-700 w-16 lg:w-20 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-xs lg:text-sm">Acc.</th>
              </tr>
            </thead>
            <tbody>
              {order?.items.map((item, index) => (
                <tr key={item.id} className={`border-b border-gray-200 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="p-2 lg:p-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-orange-200 text-gray-900 px-1 lg:px-2 py-1 rounded text-center text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      min="1"
                    />
                  </td>
                  <td className="p-2 lg:p-3 text-orange-600 font-semibold text-xs lg:text-sm">P{item.price_level}</td>
                  <td className="p-2 lg:p-3 text-gray-900">
                    <div className="font-medium text-xs lg:text-sm">
                      {item.product_name.length > 20 ? `${item.product_name.substring(0, 20)}...` : item.product_name}
                    </div>
                    <div className="text-xs text-gray-500 hidden lg:block">{item.product_code}</div>
                  </td>
                  <td className="p-2 lg:p-3 text-right text-green-600 font-mono font-semibold text-xs lg:text-sm">
                    ${item.unit_price.toFixed(2)}
                  </td>
                  <td className="p-2 lg:p-3 text-right text-orange-600 font-mono font-bold text-xs lg:text-sm">
                    ${item.total.toFixed(2)}
                  </td>
                  <td className="p-2 lg:p-3">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="bg-green-600 hover:bg-green-700 text-white p-1 rounded shadow-sm transition-colors"
                        title="Añadir"
                      >
                        <Plus size={10} className="lg:w-3 lg:h-3" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="bg-red-600 hover:bg-red-700 text-white p-1 rounded shadow-sm transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={10} className="lg:w-3 lg:h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {(!order?.items || order.items.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-4 lg:p-8 text-center text-gray-500 bg-gradient-to-r from-orange-25 to-red-25 text-xs lg:text-sm">
                    No hay artículos en el pedido
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

{/* Credit Information */}
{client && (
  <div className="bg-gradient-to-r from-orange-50 to-red-50 py-2 px-2 lg:px-3 border-t border-orange-200">
    <div className="grid grid-cols-3 gap-1 lg:gap-2 text-xs">
      <div>
        <div className="text-gray-600 font-medium">Límite de Crédito</div>
        <div className="text-orange-600 font-mono font-semibold">
          ${client.credit_limit.toLocaleString('es-MX')}
        </div>
      </div>
      <div>
        <div className="text-gray-600 font-medium">Crédito Usado</div>
        <div className="text-amber-600 font-mono font-semibold">
          ${creditUsed.toLocaleString('es-MX')}
        </div>
      </div>
      <div>
        <div className="text-gray-600 font-medium">Crédito Disponible</div>
        <div
          className={`font-mono font-semibold ${
            creditAvailable > 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          ${creditAvailable.toLocaleString('es-MX')}
        </div>
      </div>
    </div>

    {creditExceeded && (
      <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-2 flex items-center space-x-1">
        <AlertTriangle size={14} className="text-red-600" />
        <span className="text-red-700 font-bold text-xs">
          ¡LÍMITE DE CRÉDITO EXCEDIDO!
        </span>
      </div>
    )}
  </div>
)}


<div className="bg-gradient-to-r from-orange-25 to-red-25 py-2 px-2 lg:px-3 border-t border-orange-100">
  {/* Observaciones + Chofer/Ruta */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
    <div>
      <label className="block text-gray-600 text-[10px] mb-1 font-medium">Observaciones</label>
      <input
        type="text"
        value={observations}
        onChange={(e) => setObservations(e.target.value)}
        className="w-full bg-white border border-orange-200 text-gray-900 px-2 py-1 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
        placeholder="Observaciones del pedido..."
      />
    </div>
    <div className="grid grid-cols-2 gap-1 lg:gap-2">
      <div>
        <label className="block text-gray-600 text-[10px] mb-1 font-medium">Chofer</label>
        <select
          value={driver}
          onChange={(e) => setDriver(e.target.value)}
          className="w-full bg-white border border-orange-200 text-gray-900 px-1 lg:px-2 py-1 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Sin chofer</option>
          <option value="Juan Pérez">Juan Pérez</option>
          <option value="María García">María García</option>
          <option value="Carlos López">Carlos López</option>
        </select>
      </div>
      <div>
        <label className="block text-gray-600 text-[10px] mb-1 font-medium">Ruta</label>
        <select
          value={route}
          onChange={(e) => setRoute(e.target.value)}
          className="w-full bg-white border border-orange-200 text-gray-900 px-1 lg:px-2 py-1 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Sin ruta</option>
          <option value="Centro">Centro</option>
          <option value="Norte">Norte</option>
          <option value="Sur">Sur</option>
          <option value="Foránea">Foránea</option>
        </select>
      </div>
    </div>
  </div>

  {/* Opciones de Venta */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 mb-2">
    {[
      { label: 'Crédito', checked: isCredit, set: setIsCredit },
      { label: 'Factura', checked: isInvoice, set: setIsInvoice },
      { label: 'Cotización', checked: isQuote, set: setIsQuote },
      { label: 'Vender en Ext.', checked: isExternal, set: setIsExternal },
    ].map((opt, idx) => (
      <label key={idx} className="flex items-center space-x-1 text-xs">
        <input
          type="checkbox"
          checked={opt.checked}
          onChange={(e) => opt.set(e.target.checked)}
          className="rounded text-orange-600 focus:ring-orange-500 border-orange-300 w-3 h-3"
        />
        <span className="text-gray-700 text-xs lg:text-sm">{opt.label}</span>
      </label>
    ))}
  </div>

  {/* Descuento */}
  <div className="flex items-center space-x-2 mb-2">
    <label className="text-gray-600 text-xs font-medium">Desc:</label>
    <input
      type="number"
      step="0.01"
      value={discountAmount}
      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
      className="bg-white border border-orange-200 text-gray-900 px-1 lg:px-2 py-1 rounded-md text-xs w-16 lg:w-20 focus:outline-none focus:ring-1 focus:ring-orange-500"
      placeholder="0.00"
    />
    <button
      onClick={handleApplyDiscount}
      className="bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 text-orange-700 px-2 py-1 rounded-md text-xs font-medium border border-orange-300 shadow-sm"
    >
      Aplicar
    </button>
  </div>
</div>

<div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 py-2 px-2 lg:px-4">
  {/* Total */}
  <div className="flex items-center justify-between mb-2">
    <span className="text-orange-50 text-sm lg:text-base font-semibold">TOTAL:</span>
    <span className="text-white font-bold text-lg lg:text-xl font-mono">
      ${orderTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
    </span>
  </div>

  {/* Botones */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 lg:gap-2">
    <button
      onClick={onPay}
      disabled={!order?.items.length}
      className="bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 disabled:from-gray-200 disabled:to-gray-300 disabled:cursor-not-allowed text-green-700 disabled:text-gray-500 py-2 px-1 lg:px-3 rounded-md font-semibold text-xs shadow-sm transition-all duration-200 border border-green-300 disabled:border-gray-300 flex flex-col items-center justify-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-9 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      PAGAR
      <div className="text-[10px] opacity-80 hidden lg:block">F12</div>
    </button>

    <button
      onClick={onSave}
      disabled={!order?.items.length}
      className="bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 disabled:from-gray-200 disabled:to-gray-300 disabled:cursor-not-allowed text-orange-700 disabled:text-gray-500 py-2 px-1 lg:px-3 rounded-md font-semibold text-xs shadow-sm transition-all duration-200 border border-orange-300 disabled:border-gray-300 flex flex-col items-center justify-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      GUARDAR
    </button>

    <button
      onClick={onCancel}
      className="bg-white text-orange-600 border border-orange-600 py-2 px-1 lg:px-3 rounded-md font-semibold text-xs shadow-sm transition-all duration-200 flex flex-col items-center justify-center hover:bg-orange-50"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      CANCELAR
    </button>

    <button
      onClick={onCancel}
      className="bg-black text-white py-2 px-1 lg:px-3 rounded-md font-semibold text-xs shadow-sm transition-all duration-200 border border-gray-800 flex flex-col items-center justify-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22m-5-4h-8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
      </svg>
      ELIMINAR
    </button>
  </div>
</div>


      {/* Client Selection Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 border-b border-red-700">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">Seleccionar Cliente</h3>
                <button
                  onClick={() => setShowClientModal(false)}
                  className="text-orange-50 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gradient-to-r hover:from-orange-700 hover:to-red-700 transition-all duration-200"
                >
                  ×
                </button>
              </div>
              <div className="mt-3">
                <input
                  type="text"
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                  className="w-full bg-white border border-orange-200 text-gray-900 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Buscar cliente por nombre o RFC..."
                  autoFocus
                />
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-orange-50 to-red-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-gray-700 font-semibold">Cliente</th>
                    <th className="text-left p-3 text-gray-700 font-semibold">RFC</th>
                    <th className="text-right p-3 text-gray-700 font-semibold">Crédito</th>
                    <th className="text-center p-3 text-gray-700 font-semibold">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(clientOption => (
                    <tr
                      key={clientOption.id}
                      onClick={() => {
                        onSelectClient(clientOption);
                        setShowClientModal(false);
                        setSearchClient('');
                        if (onRefreshData) {
                          onRefreshData();
                        }
                      }}
                      className="border-b border-orange-100 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 cursor-pointer transition-all duration-200"
                    >
                      <td className="p-3 text-gray-900 font-medium">{clientOption.name}</td>
                      <td className="p-3 text-gray-600">{clientOption.rfc}</td>
                      <td className="p-3 text-right text-green-600 font-mono font-semibold">
                        ${clientOption.credit_limit.toLocaleString('es-MX')}
                      </td>
                      <td className="p-3 text-center text-orange-600 font-semibold">
                        Nivel {clientOption.default_price_level}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}