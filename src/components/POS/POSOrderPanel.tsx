import React, { useState } from 'react';
import { Plus, Edit, Trash2, User, CreditCard, AlertTriangle, X } from 'lucide-react';
import { POSOrder, POSOrderItem, POSClient } from '../../types/pos';
import { POSEditItemModal } from './POSEditItemModal';
import { PermissionModal } from '../Common/PermissionModal';
import { useAuth } from '../../context/AuthContext';

interface POSOrderPanelProps {
  order: POSOrder | null;
  client: POSClient | null;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onUpdateItemPrice: (itemId: string, priceLevel: 1 | 2 | 3 | 4 | 5, customPrice?: number) => void;
  onApplyDiscount: (discountAmount: number) => void;
  onSelectClient: (client: POSClient) => void;
  onPay: () => void;
  saveOrder: (order: POSOrder, stockOverride?: boolean) => Promise<any>;
  markTabAsSaved: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  activeTabId: string;
  onCancel: () => void;
  clients: POSClient[];
  onRefreshData?: () => void;
  products?: any[];
}

export function POSOrderPanel({
  order,
  client,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateItemPrice,
  onApplyDiscount,
  onSelectClient,
  onPay,
  saveOrder,
  markTabAsSaved,
  closeTab,
  activeTabId,
  onCancel,
  clients,
  onRefreshData,
  products
}: POSOrderPanelProps) {
  const { hasPermission } = useAuth();
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
  const [showObservations, setShowObservations] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<POSOrderItem | null>(null);
  const [showCreditAuthModal, setShowCreditAuthModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<'save' | 'pay' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState('');

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchClient.toLowerCase()) ||
    c.rfc.toLowerCase().includes(searchClient.toLowerCase())
  );

  const creditUsed = client?.balance || 0;
  const creditAvailable = client ? client.credit_limit - creditUsed : 0;
  const orderTotal = order?.total || 0;
  
  // Debug logging
  console.log('Client credit info:', {
    client: client?.name,
    credit_limit: client?.credit_limit,
    balance: client?.balance,
    creditUsed,
    creditAvailable,
    orderTotal
  });
  
  const creditExceeded = client && (isCredit || order?.is_credit) && (creditUsed + orderTotal) > client.credit_limit;

  const handleApplyDiscount = () => {
    // Check discount permission
    if (!hasPermission('permiso_ventas_especiales')) {
      setPermissionMessage('No tienes el permiso para aplicar descuentos. El administrador debe asignártelo desde el ERS.');
      setShowPermissionModal(true);
      return;
    }
    
    if (discountAmount > (order?.subtotal || 0)) {
      alert('El descuento no puede ser mayor al subtotal del pedido');
      return;
    }
    
    if (order) {
      onApplyDiscount(discountAmount);
    }
    // Trigger parent update for last order
    if (onRefreshData) {
      onRefreshData();
    }
  };

  const validateAdminPassword = (password: string) => {
    return password === 'admin123'; // En producción, validar contra la base de datos
  };

  const handleCreditAuth = async () => {
    if (!validateAdminPassword(adminPassword)) {
      alert('Contraseña de administrador incorrecta');
      setAdminPassword('');
      return;
    }

    setShowCreditAuthModal(false);
    setAdminPassword('');

    // Execute the pending action
    if (pendingAction === 'save') {
      handleSaveClick();
    } else if (pendingAction === 'pay') {
      onPay();
    }

    setPendingAction(null);
  };

  const handleCancelCreditAuth = () => {
    setShowCreditAuthModal(false);
    setAdminPassword('');
    setPendingAction(null);
  };

  const handleSaveClick = async () => {
    if (isSaving) return; // Prevent multiple saves
    
    setIsSaving(true);
    try {
      // Save with status 'saved' instead of 'pending'
      if (order) {
        const savedOrder = await saveOrder({ ...order, status: 'saved' }, false);
        markTabAsSaved(activeTabId);
        closeTab(activeTabId); // Close the tab after saving
        alert('Pedido guardado');
      }
    } catch (err) {
      console.error('Error saving order:', err);
      if (err instanceof Error && err.message.includes('stock')) {
        // Extract product names from error message or check order items
        const stockIssues = order?.items.filter(item => {
          const product = products?.find(p => p.id === item.product_id);
          return product && item.quantity > product.stock;
        }) || [];
        
        if (stockIssues.length > 0) {
          const productNames = stockIssues.map(item => item.product_name).join(', ');
          alert(`No se pudo guardar el pedido porque no hay stock suficiente para: ${productNames}`);
        } else {
          alert('No se pudo guardar el pedido por falta de stock');
        }
      } else {
        alert('Error al guardar el pedido');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePayClick = () => {
    // Check credit limit if it's a credit sale
    if (isCredit && client && order) {
      const totalAfterSale = client.balance + order.total;
      if (totalAfterSale > client.credit_limit) {
        setPendingAction('pay');
        setShowCreditAuthModal(true);
        return;
      }
    }
    onPay();
  };

  const handleSelectClient = (client: POSClient) => {
    onSelectClient(client);
    setShowClientModal(false);
    setSearchClient('');
    
    // Trigger refresh to update last order info
    if (onRefreshData) {
      onRefreshData();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-2 sm:p-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-semibold">Pedido Actual</h2>
          <div className="text-xs sm:text-sm opacity-90">
            {order?.items.length || 0} productos
          </div>
        </div>
      </div>

      {/* Client Selection */}
      <div className="bg-gray-50 p-2 sm:p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-700">Cliente</label>
          <button
            onClick={() => setShowClientModal(true)}
            className="text-orange-600 hover:text-orange-700 text-xs font-medium"
          >
            {client ? 'Cambiar' : 'Seleccionar'}
          </button>
        </div>
        
        {client ? (
          <div className="bg-white p-2 rounded-md border border-gray-200">
            <div className="flex items-center space-x-2">
              <User size={14} className="text-gray-400" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 truncate">{client.name}</div>
                <div className="text-xs text-gray-600">RFC: {client.rfc}</div>
                <div className="text-xs text-gray-600">Zona: {client.zone}</div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowClientModal(true)}
            className="w-full bg-white border-2 border-dashed border-gray-300 rounded-md p-3 text-center hover:border-orange-400 hover:bg-orange-50 transition-colors"
          >
            <User size={20} className="mx-auto text-gray-400 mb-1" />
            <div className="text-xs text-gray-600">Seleccionar Cliente</div>
          </button>
        )}
      </div>

      {/* Order Items */}
      <div className="flex-1 overflow-y-auto">
        {order?.items.length ? (
          <div className="divide-y divide-gray-200">
            {order.items.map((item) => (
              <div key={item.id} className="p-2 sm:p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {item.product_name}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Precio: ${(item.unit_price || 0).toFixed(2)} | Total: ${(item.total_price || 0).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    <div className="flex items-center bg-gray-100 rounded-md">
                      <button
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="p-1 hover:bg-gray-200 rounded-l-md"
                      >
                        <span className="text-xs font-bold">-</span>
                      </button>
                      <span className="px-2 py-1 text-xs font-medium min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded-r-md"
                      >
                        <span className="text-xs font-bold">+</span>
                      </button>
                    </div>
                    
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setShowEditItemModal(true);
                      }}
                      className="p-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded"
                    >
                      <Edit size={12} />
                    </button>
                    
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">🛒</div>
              <div className="text-sm">No hay productos en el pedido</div>
              <div className="text-xs mt-1">Agrega productos desde el catálogo</div>
            </div>
          </div>
        )}
      </div>

      {/* Order Options */}
      <div className="bg-gray-50 p-2 sm:p-3 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <label className="flex items-center space-x-2 text-xs">
            <input
              type="checkbox"
              checked={isCredit}
              onChange={(e) => setIsCredit(e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-gray-700">Venta a Crédito</span>
          </label>
          <label className="flex items-center space-x-2 text-xs">
            <input
              type="checkbox"
              checked={isInvoice}
              onChange={(e) => setIsInvoice(e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-gray-700">Facturar</span>
          </label>
          <label className="flex items-center space-x-2 text-xs">
            <input
              type="checkbox"
              checked={isQuote}
              onChange={(e) => setIsQuote(e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-gray-700">Cotización</span>
          </label>
          <label className="flex items-center space-x-2 text-xs">
            <input
              type="checkbox"
              checked={isExternal}
              onChange={(e) => setIsExternal(e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-gray-700">Externo</span>
          </label>
        </div>

        {/* Driver and Route */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Chofer</label>
            <input
              type="text"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              placeholder="Nombre del chofer..."
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ruta</label>
            <input
              type="text"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="Ruta de entrega..."
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Discount */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Descuento</label>
          <div className="flex space-x-2">
            <input
              type="number"
              step="0.01"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
            <button
              onClick={handleApplyDiscount}
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>

        {/* Observations */}
        <div className="mb-3">
          <button
            onClick={() => setShowObservations(!showObservations)}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium"
          >
            {showObservations ? 'Ocultar' : 'Mostrar'} Observaciones
          </button>
          {showObservations && (
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observaciones del pedido..."
              className="w-full mt-2 px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              rows={3}
            />
          )}
        </div>
      </div>

      {/* Order Summary */}
      {order && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-2 sm:p-3 border-t border-orange-200">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-mono font-semibold text-gray-900">${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Descuento:</span>
                <span className="font-mono font-semibold text-red-600">-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-orange-200 pt-1">
              <span className="font-semibold text-gray-700">Total:</span>
              <span className="font-mono font-bold text-orange-600 text-sm">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white p-2 sm:p-3 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleSaveClick}
            disabled={!order?.items.length || isSaving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
          </button>
          <button
            onClick={handlePayClick}
            disabled={!order?.items.length}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <CreditCard size={12} />
            <span>Cobrar</span>
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-xs font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Credit Information */}
      {client && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 py-1 sm:py-2 px-2 sm:px-3 border-t border-orange-200">
          <div className="grid grid-cols-3 gap-1 sm:gap-2 text-[10px] sm:text-xs">
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
            <div className="mt-1 sm:mt-2 bg-red-50 border border-red-200 rounded-lg p-2 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <div className="text-red-700 text-xs">
                <div className="font-semibold">Límite de crédito excedido</div>
                <div>
                  Este pedido excederá el límite de crédito del cliente por ${((creditUsed + orderTotal) - client.credit_limit).toLocaleString('es-MX')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Client Selection Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-96 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Seleccionar Cliente</h3>
              <button
                onClick={() => setShowClientModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <input
                type="text"
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
                placeholder="Buscar cliente por nombre o RFC..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                autoFocus
              />
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-2">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-orange-50 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-600">RFC: {client.rfc}</div>
                    <div className="text-sm text-gray-600">Zona: {client.zone}</div>
                  </button>
                ))}
                
                {filteredClients.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron clientes
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditItemModal && editingItem && (
        <POSEditItemModal
          item={editingItem}
          onSave={(updatedItem) => {
            onUpdateItemPrice(updatedItem.id, updatedItem.price_level, updatedItem.custom_price);
            setShowEditItemModal(false);
            setEditingItem(null);
          }}
          onClose={() => {
            setShowEditItemModal(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* Credit Authorization Modal */}
      {showCreditAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Autorización Requerida</h3>
              <button
                onClick={handleCancelCreditAuth}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <p className="text-center text-gray-700 mb-4">
                  Este pedido excede el límite de crédito del cliente. Se requiere autorización del administrador.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña de Administrador
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ingresa la contraseña"
                  autoFocus
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelCreditAuth}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreditAuth}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Autorizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      {showPermissionModal && (
        <PermissionModal
          message={permissionMessage}
          onClose={() => setShowPermissionModal(false)}
        />
      )}
    </div>
  );
}