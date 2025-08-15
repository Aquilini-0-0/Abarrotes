import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { POSMenuBar } from './POSMenuBar';
import { POSOrderTabs } from './POSOrderTabs';
import { POSOrderPanel } from './POSOrderPanel';
import { POSProductPanel } from './POSProductPanel';
import { POSPaymentModal } from './POSPaymentModal';
import { POSOrdersModal } from './POSOrdersModal';
import { POSCashModal } from './POSCashModal';
import { POSTaraModal } from './POSTaraModal';
import { POSCreditPaymentsModal } from './POSCreditPaymentsModal';
import { POSAdvancesModal } from './POSAdvancesModal';
import { POSCashCutsModal } from './POSCashCutsModal';
import { POSCashMovementsModal } from './POSCashMovementsModal';
import { POSRemisionesModal } from './POSRemisionesModal';
import { POSValesModal } from './POSValesModal';
import { POSPrintPricesModal } from './POSPrintPricesModal';
import { POSCollectOrderModal } from './POSCollectOrderModal';
import { usePOS } from '../../hooks/usePOS';
import { usePOSTabs } from '../../hooks/usePOSTabs';
import { useOrderLocks } from '../../hooks/useOrderLocks';
import { useAutoSync } from '../../hooks/useAutoSync';
import { POSProduct, POSClient } from '../../types/pos';

export function POSLayout() {
  const {
    products,
    clients,
    orders,
    cashRegister,
    loading,
    addItemToOrder,
    removeItemFromOrder,
    updateItemQuantity,
    updateItemPrice,
    applyDiscount,
    saveOrder,
    openCashRegister,
    closeCashRegister,
    updateProductPrices,
    getEffectivePrice,
    refetch,
    processPayment
  } = usePOS();

  const {
    tabs,
    activeTabId,
    createNewTab,
    openOrderInTab,
    switchTab,
    closeTab,
    updateActiveOrder,
    markTabAsSaved,
    getActiveOrder,
    getActiveClient
  } = usePOSTabs();

  const { isOrderLocked } = useOrderLocks();
  
  // Get the actual client data based on the active order
  const getActiveClientData = (): POSClient | null => {
    const activeOrder = getActiveOrder();
    if (!activeOrder?.client_id) return null;
    
    const clientData = clients.find(c => c.id === activeOrder.client_id);
    console.log('Active client data:', clientData);
    return clientData || null;
  };

  const currentOrder = getActiveOrder();
  const selectedClient = getActiveClientData();

  const [selectedPriceLevel, setSelectedPriceLevel] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showTaraModal, setShowTaraModal] = useState(false);
  const [showCreditPaymentsModal, setShowCreditPaymentsModal] = useState(false);
  const [showAdvancesModal, setShowAdvancesModal] = useState(false);
  const [showCashCutsModal, setShowCashCutsModal] = useState(false);
  const [showCashMovementsModal, setShowCashMovementsModal] = useState(false);
  const [showRemisionesModal, setShowRemisionesModal] = useState(false);
  const [showValesModal, setShowValesModal] = useState(false);
  const [showPrintPricesModal, setShowPrintPricesModal] = useState(false);
  const [showCollectOrderModal, setShowCollectOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<POSProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [showCreditAuthModal, setShowCreditAuthModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<'save' | 'pay' | null>(null);
  const [pendingPaymentData, setPendingPaymentData] = useState<any>(null);

  // Handle browser back button for POS
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Prevent default back navigation
      event.preventDefault();
      
      // Redirect to login
      window.location.href = '/login';
    };

    // Add event listener for browser back button
    window.addEventListener('popstate', handlePopState);
    
    // Push a state to handle back button
    window.history.pushState(null, '', window.location.pathname);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Auto-sync for real-time updates
  useAutoSync({
    onDataUpdate: refetch,
    interval: 5000, // 5 seconds for real-time feel
    tables: ['sales', 'products', 'clients']
  });

  // Update last order when orders change
  useEffect(() => {
    if (orders.length > 0) {
      const latest = orders[0];
      
      // Get products from the latest order
      const products = latest.items.map(item => ({
        name: item.product_name,
        quantity: item.quantity
      }));
      
      setLastOrder({
        id: latest.id,
        client_name: latest.client_name,
        total: latest.total,
        items_count: latest.items.length,
        products: products,
        date: latest.created_at,
        status: latest.status
      });
    }
  }, [orders]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        document.getElementById('product-search')?.focus();
      } else if (e.key === 'F12') {
        e.preventDefault();
        if (currentOrder && currentOrder.items.length > 0) {
          setShowPaymentModal(true);
        }
      } else if (e.key === 'Escape') {
        setShowPaymentModal(false);
        setShowOrdersModal(false);
        setShowCashModal(false);
        setShowTaraModal(false);
        setShowCreditPaymentsModal(false);
        setShowAdvancesModal(false);
        setShowCashCutsModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentOrder]);

  const handleAddProduct = (product: POSProduct) => {
    try {
      if (quantity > 0) {
        // Always show tara modal for all products
        setSelectedProduct(product);
        setShowTaraModal(true);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al agregar producto');
    }
  };

  const handleSelectClient = (client: POSClient) => {
    setSelectedPriceLevel(client.default_price_level);
    if (currentOrder) {
      const updatedOrder = { ...currentOrder, client_id: client.id, client_name: client.name };
      updateActiveOrder(updatedOrder);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    if (currentOrder) {
      const updatedOrder = removeItemFromOrder(currentOrder, itemId);
      updateActiveOrder(updatedOrder);
    }
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (currentOrder) {
      try {
        // Ensure quantity is properly formatted for decimal support
        const updatedOrder = updateItemQuantity(currentOrder, itemId, newQuantity);
        updateActiveOrder(updatedOrder);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al actualizar cantidad');
      }
    }
  };

  const handleUpdateItemPrice = (itemId: string, priceLevel: 1 | 2 | 3 | 4 | 5, customPrice?: number) => {
    if (currentOrder) {
      try {
        const updatedOrder = updateItemPrice(currentOrder, itemId, priceLevel, customPrice);
        updateActiveOrder(updatedOrder);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al actualizar precio');
      }
    }
  };
  const handleApplyDiscount = (discountAmount: number) => {
    if (currentOrder) {
      const updatedOrder = applyDiscount(currentOrder, discountAmount);
      updateActiveOrder(updatedOrder);
    }
  };

  const handlePayOrder = async (paymentData: any) => {
    if (!currentOrder) return;

    try {
      // Clear any pending auth state when starting payment process
      setPendingAction(null);
      setPendingPaymentData(null);
      
      // Determine if this is an existing order being paid
      const isExistingOrder = !currentOrder.id.startsWith('temp-');
      
      if (isExistingOrder) {
        // For existing orders, use processPayment
        const paymentAmount = paymentData.method === 'mixed' 
          ? paymentData.breakdown.cash + paymentData.breakdown.card + paymentData.breakdown.transfer + paymentData.breakdown.credit
          : currentOrder.total;
          
        const result = await processPayment(currentOrder.id, {
          amount: paymentAmount,
          method: paymentData.method,
          reference: paymentData.reference
        });
        
        setLastOrder({
          id: currentOrder.id,
          client_name: currentOrder.client_name,
          total: currentOrder.total,
          items_count: currentOrder.items.length,
          date: new Date().toISOString(),
          status: result.newStatus
        });
        
        markTabAsSaved(activeTabId);
        closeTab(activeTabId); // Close the tab after payment
        setShowPaymentModal(false);
        
        if (result.newStatus === 'paid') {
          alert('✅ Pago procesado exitosamente - Pedido marcado como PAGADO');
        } else {
          alert(`✅ Abono procesado exitosamente - Saldo restante: $${result.newRemainingBalance.toFixed(2)}`);
        }
      } else {
        // For new orders, save first then process payment
        const savedOrder = await saveOrder(currentOrder);
        
        // Process the payment using the hook
        const paymentAmount = paymentData.method === 'mixed' 
          ? paymentData.breakdown.cash + paymentData.breakdown.card + paymentData.breakdown.transfer + paymentData.breakdown.credit
          : currentOrder.total;
          
        const result = await processPayment(savedOrder.id, {
          amount: paymentAmount,
          method: paymentData.method,
          reference: paymentData.reference,
          selectedVale: paymentData.selectedVale
        });
        
        setLastOrder({
          id: savedOrder.id,
          client_name: currentOrder.client_name,
          total: currentOrder.total,
          items_count: currentOrder.items.length,
          date: new Date().toISOString(),
          status: result.newStatus
        });
        
        markTabAsSaved(activeTabId);
        closeTab(activeTabId);
        setShowPaymentModal(false);
        
        if (paymentData.method === 'credit') {
          alert('✅ Pedido guardado como CRÉDITO - Estado: PENDIENTE');
        } else if (result.newStatus === 'paid') {
          alert('✅ Pago procesado exitosamente - Pedido marcado como PAGADO');
        } else {
          alert(`✅ Abono procesado exitosamente - Saldo restante: $${result.newRemainingBalance.toFixed(2)}`);
        }
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      alert('Error al procesar el pago');
    }
  };

  const handleEditOrder = async (order: POSOrder) => {
    // Check if order is already paid
    if (order.status === 'paid') {
      const confirmed = confirm('Este pedido ya ha sido pagado. ¿Seguro que quieres editarlo?');
      if (!confirmed) {
        return;
      }
    }

    const success = await openOrderInTab(order);
    if (success) {
      setShowOrdersModal(false);
    }
  };

  const handleSaveOrder = async () => {
    if (currentOrder) {
      try {
        const savedOrder = await saveOrder({ ...currentOrder, status: 'pending' });
        markTabAsSaved(activeTabId);
        closeTab(activeTabId); // Close the tab after saving
        alert('Pedido guardado');
      } catch (err) {
        console.error('Error saving order:', err);
        alert('Error al guardar el pedido');
      }
    }
  };

  const handleCancelOrder = () => {
    if (confirm('¿Cancelar pedido actual?')) {
      closeTab(activeTabId);
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
      try {
        const savedOrder = await saveOrder({ ...currentOrder!, status: 'pending' });
        markTabAsSaved(activeTabId);
        alert('Pedido guardado con autorización de administrador');
      } catch (err) {
        console.error('Error saving order:', err);
        alert('Error al guardar el pedido');
      }
    } else if (pendingAction === 'pay' && pendingPaymentData) {
      try {
        const orderToSave = {
          ...currentOrder!,
          payment_method: pendingPaymentData.method,
          is_credit: pendingPaymentData.method === 'credit',
          status: pendingPaymentData.method === 'credit' ? 'pending' : 'paid'
        } as any;

        const savedOrder = await saveOrder(orderToSave);
        
        setLastOrder({
          id: savedOrder.id,
          client_name: orderToSave.client_name,
          total: orderToSave.total,
          items_count: orderToSave.items.length,
          date: new Date().toISOString(),
          status: orderToSave.status
        });
        
        markTabAsSaved(activeTabId);
        closeTab(activeTabId); // Close the tab after payment
        setShowPaymentModal(false);
        alert('Pedido procesado con autorización de administrador');
      } catch (err) {
        console.error('Error processing payment:', err);
        alert('Error al procesar el pago');
      }
    }

    setPendingAction(null);
    setPendingPaymentData(null);
  };

  const handleCancelCreditAuth = () => {
    setShowCreditAuthModal(false);
    setAdminPassword('');
    setPendingAction(null);
    setPendingPaymentData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando DURAN-Desk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Menu Bar */}
      <POSMenuBar
        onOpenOrders={() => setShowOrdersModal(true)}
        onOpenCash={() => setShowCashModal(true)}
        onOpenCreditPayments={() => setShowCreditPaymentsModal(true)}
        onOpenAdvances={() => setShowAdvancesModal(true)}
        onOpenCashCuts={() => setShowCashCutsModal(true)}
        onOpenCashMovements={() => setShowCashMovementsModal(true)}
        onOpenRemisiones={() => setShowRemisionesModal(true)}
        onOpenVales={() => setShowValesModal(true)}
        onOpenPrintPrices={() => setShowPrintPricesModal(true)}
        onOpenCollectOrder={() => setShowCollectOrderModal(true)}
        cashRegister={cashRegister}
        lastOrder={lastOrder}
      />

      {/* Order Tabs */}
      <POSOrderTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={switchTab}
        onTabClose={closeTab}
        onNewTab={createNewTab}
      />

      {/* Main Content - Responsive Layout */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] bg-white shadow-sm">
        {/* Left Panel - Order Details */}
        <div className="w-full md:w-2/5 lg:w-1/2 border-b md:border-b-0 md:border-r border-gray-200 bg-white h-1/2 md:h-full">
          <POSOrderPanel
            order={currentOrder}
            client={selectedClient}
            onRemoveItem={handleRemoveItem}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdateItemPrice={handleUpdateItemPrice}
            onApplyDiscount={handleApplyDiscount}
            onSelectClient={handleSelectClient}
            onPay={() => setShowPaymentModal(true)}
            onSave={handleSaveOrder}
            onCancel={handleCancelOrder}
            clients={clients}
            onRefreshData={refetch}
            products={products}
          />
        </div>

        {/* Right Panel - Product Catalog */}
        <div className="w-full md:w-3/5 lg:w-1/2 bg-gray-50 h-1/2 md:h-full">
          <POSProductPanel
            products={products}
            searchTerm={searchTerm}
            quantity={quantity}
            selectedPriceLevel={selectedPriceLevel}
            onSearchChange={setSearchTerm}
            onQuantityChange={setQuantity}
            onPriceLevelChange={setSelectedPriceLevel}
            onAddProduct={handleAddProduct}
            onProductSelect={(product) => {
              // Always show tara modal for all products
              setSelectedProduct(product);
              setShowTaraModal(true);
            }}
            onGetEffectivePrice={getEffectivePrice}
          />
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && currentOrder && (
        <POSPaymentModal
          order={currentOrder}
          client={selectedClient}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={(paymentData) => {
            // Check credit limit for credit sales
            if (paymentData.method === 'credit' && selectedClient) {
              const totalAfterSale = selectedClient.balance + currentOrder.total;
              if (totalAfterSale > selectedClient.credit_limit) {
                setPendingAction('pay');
                setPendingPaymentData(paymentData);
                setShowCreditAuthModal(true);
                setShowPaymentModal(false);
                return;
              }
            }
            
            // Add selectedVale to payment data if using vales method
            if (paymentData.method === 'vales' && paymentData.selectedVale) {
              paymentData.selectedVale = paymentData.selectedVale;
            }
            
            handlePayOrder(paymentData);
          }}
        />
      )}

      {showOrdersModal && (
        <POSOrdersModal
          orders={orders}
          onClose={() => setShowOrdersModal(false)}
          onSelectOrder={(order) => {
            setShowOrdersModal(false);
            // Just view the order details, don't edit
          }}
          onEditOrder={handleEditOrder}
        />
      )}

      {showCashModal && (
        <POSCashModal
          cashRegister={cashRegister}
          onClose={() => setShowCashModal(false)}
          onOpenRegister={openCashRegister}
          onCloseRegister={closeCashRegister}
        />
      )}

      {showTaraModal && selectedProduct && (
        <POSTaraModal
          product={selectedProduct}
          quantity={quantity}
          priceLevel={selectedPriceLevel}
          onClose={() => {
            setShowTaraModal(false);
            setSelectedProduct(null);
          }}
          onConfirm={(product, finalQuantity, priceLevelFromModal, finalUnitPrice) => {
            const updatedOrder = addItemToOrder(currentOrder!, product, finalQuantity, priceLevelFromModal, finalUnitPrice);
            updateActiveOrder(updatedOrder);
            setShowTaraModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {showCreditPaymentsModal && (
        <POSCreditPaymentsModal
          onClose={() => setShowCreditPaymentsModal(false)}
          onPaymentProcessed={refetch}
        />
      )}

      {showAdvancesModal && (
        <POSAdvancesModal
          onClose={() => setShowAdvancesModal(false)}
        />
      )}

      {showCashCutsModal && (
        <POSCashCutsModal
          onClose={() => setShowCashCutsModal(false)}
        />
      )}

      {showCashMovementsModal && (
        <POSCashMovementsModal
          onClose={() => setShowCashMovementsModal(false)}
        />
      )}

      {showRemisionesModal && (
        <POSRemisionesModal
          onClose={() => setShowRemisionesModal(false)}
        />
      )}

      {showValesModal && (
        <POSValesModal
          onClose={() => setShowValesModal(false)}
        />
      )}

      {showPrintPricesModal && (
        <POSPrintPricesModal
          onClose={() => setShowPrintPricesModal(false)}
        />
      )}

      {showCollectOrderModal && (
        <POSCollectOrderModal
          onClose={() => setShowCollectOrderModal(false)}
        />
      )}

      {/* Credit Authorization Modal */}
      {showCreditAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="bg-red-600 p-4 border-b border-red-700 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">Autorización Requerida</h3>
                <button
                  onClick={handleCancelCreditAuth}
                  className="text-red-100 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-yellow-600 text-2xl">⚠️</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Límite de Crédito Excedido
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  El cliente {selectedClient?.name} excederá su límite de crédito con esta operación.
                  Se requiere autorización de administrador para continuar.
                </p>
                {selectedClient && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    <div className="text-yellow-800">
                      <p>Límite: ${selectedClient.credit_limit.toLocaleString('es-MX')}</p>
                      <p>Saldo actual: ${selectedClient.balance.toLocaleString('es-MX')}</p>
                      <p>Este pedido: ${currentOrder?.total.toLocaleString('es-MX')}</p>
                      <p className="font-bold">Nuevo saldo: ${((selectedClient.balance || 0) + (currentOrder?.total || 0)).toLocaleString('es-MX')}</p>
                    </div>
                  </div>
                )}
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
                    Autorizar Operación
                  </button>
                  <button
                    onClick={handleCancelCreditAuth}
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
  );
}