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
      onSave();
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
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
<div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 py-1 sm:py-2 px-2 sm:px-3 lg:px-4">
  <div className="flex items-center justify-between">
    {/* Left: Title + Button */}
    <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
      <h2 className="text-white font-bold text-xs sm:text-sm lg:text-base">Detalle del Pedido</h2>
      <button
        onClick={() => setShowClientModal(true)}
        className="flex items-center space-x-1 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 border border-orange-200 px-1 sm:px-2 lg:px-3 py-0.5 sm:py-1 rounded-lg text-orange-700 text-[10px] sm:text-xs font-medium transition-all duration-200 shadow-sm"
      >
        <User size={12} className="sm:w-3.5 sm:h-3.5" />
        <span className="hidden md:inline">{client?.name || 'Seleccionar Cliente'}</span>
        <span className="md:hidden">{client?.name ? client.name.substring(0, 8) + '...' : 'Cliente'}</span>
      </button>
    </div>

    {/* Right: Pedido info */}
    <div className="text-orange-50 text-[10px] sm:text-xs hidden md:block">
      Pedido: {order?.id.slice(-6) || 'NUEVO'}
      {client && (
        <span className="ml-1 sm:ml-2">| RFC: {client.rfc} | Zona: {client.zone}</span>
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
                <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 w-10 sm:w-12 lg:w-16 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-[10px] sm:text-xs lg:text-sm">Cant.</th>
                <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 w-12 sm:w-16 lg:w-20 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-[10px] sm:text-xs lg:text-sm">Pres.</th>
                <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-[10px] sm:text-xs lg:text-sm">Artículo</th>
                <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 w-14 sm:w-16 lg:w-20 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-[10px] sm:text-xs lg:text-sm">Precio</th>
                <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 w-16 sm:w-20 lg:w-24 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-[10px] sm:text-xs lg:text-sm">Importe</th>
                <th className="text-center p-1 sm:p-2 lg:p-3 text-gray-700 w-12 sm:w-16 lg:w-20 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-[10px] sm:text-xs lg:text-sm">Acc.</th>
              </tr>
            </thead>
            <tbody>
              {order?.items.map((item, index) => (
                <tr key={item.id} className={`border-b border-gray-200 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="p-1 sm:p-2 lg:p-3">
                    <input
                      type="number"
                      step="0.001"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, parseFloat(e.target.value) || 1)}
                      className="w-full bg-white border border-orange-200 text-gray-900 px-1 py-0.5 sm:py-1 rounded text-center text-[10px] sm:text-xs lg:text-sm focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      min="0.001"
                    />
                  </td>
                  <td className="p-1 sm:p-2 lg:p-3 text-orange-600 font-semibold text-[10px] sm:text-xs lg:text-sm">P{item.price_level}</td>
                  <td className="p-1 sm:p-2 lg:p-3 text-gray-900">
                    <div className="font-medium text-[10px] sm:text-xs lg:text-sm">
                      {item.product_name.length > 15 ? `${item.product_name.substring(0, 15)}...` : item.product_name}
                    </div>
                    <div className="text-[8px] sm:text-xs text-gray-500 hidden md:block">{item.product_code}</div>
                  </td>
                  <td className="p-1 sm:p-2 lg:p-3 text-right text-green-600 font-mono font-semibold text-[10px] sm:text-xs lg:text-sm">
                    ${item.unit_price.toFixed(2)}
                  </td>
                  <td className="p-1 sm:p-2 lg:p-3 text-right text-orange-600 font-mono font-bold text-[10px] sm:text-xs lg:text-sm">
                    ${item.total.toFixed(2)}
                  </td>
                  <td className="p-1 sm:p-2 lg:p-3">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onUpdateQuantity(item.id, parseFloat((item.quantity + 1).toFixed(3)))}
                        className="bg-green-600 hover:bg-green-700 text-white p-0.5 sm:p-1 rounded shadow-sm transition-colors"
                        title="Añadir"
                      >
                        <Plus size={8} className="sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setShowEditItemModal(true);
                        }}
                        className="bg-gradient-to-br from-orange-400 via-red-500 to-red-600 hover:bg-yellow-500 text-white p-0.5 sm:p-1 rounded shadow-sm transition-colors"
                        title="Editar"
                      >
                        <Edit size={8} className="sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="bg-red-600 hover:bg-red-700 text-white p-0.5 sm:p-1 rounded shadow-sm transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={8} className="sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {(!order?.items || order.items.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-2 sm:p-4 lg:p-8 text-center text-gray-500 bg-gradient-to-r from-orange-25 to-red-25 text-[10px] sm:text-xs lg:text-sm">
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
);