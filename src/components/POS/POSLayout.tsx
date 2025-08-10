import React, { useState, useEffect } from 'react';
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
    applyDiscount,
    saveOrder,
    openCashRegister,
    closeCashRegister,
    refetch
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

  const currentOrder = getActiveOrder();
  const selectedClient = getActiveClient();

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
        const updatedOrder = addItemToOrder(currentOrder!, product, quantity, selectedPriceLevel);
        updateActiveOrder(updatedOrder);
        setQuantity(1);
        setSearchTerm('');
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
        const updatedOrder = updateItemQuantity(currentOrder, itemId, newQuantity);
        updateActiveOrder(updatedOrder);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al actualizar cantidad');
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
      const orderToSave = {
        ...currentOrder,
        payment_method: paymentData.method,
        is_credit: paymentData.method === 'credit',
        status: paymentData.method === 'credit' ? 'pending' : 'paid'
      } as any;

      const savedOrder = await saveOrder(orderToSave);
      
      // Update last order immediately
      setLastOrder({
        id: savedOrder.id,
        client_name: orderToSave.client_name,
        total: orderToSave.total,
        items_count: orderToSave.items.length,
        date: new Date().toISOString(),
        status: orderToSave.status
      });
      
      // Mark tab as saved and create new tab
      markTabAsSaved(activeTabId);
      createNewTab();
      setShowPaymentModal(false);
      alert('Pedido procesado exitosamente');
    } catch (err) {
      console.error('Error processing payment:', err);
      alert('Error al procesar el pago');
    }
  };

  const handleEditOrder = async (order: POSOrder) => {
    const success = await openOrderInTab(order);
    if (success) {
      setShowOrdersModal(false);
    }
  };

  const handleSaveOrder = async () => {
    if (currentOrder) {
      try {
        const savedOrder = await saveOrder({ ...currentOrder, status: 'draft' });
        markTabAsSaved(activeTabId);
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
            onApplyDiscount={handleApplyDiscount}
            onSelectClient={handleSelectClient}
            onPay={() => setShowPaymentModal(true)}
            onSave={handleSaveOrder}
            onCancel={handleCancelOrder}
            clients={clients}
            onRefreshData={refetch}
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
              if (product.has_tara) {
                setSelectedProduct(product);
                setShowTaraModal(true);
              } else {
                handleAddProduct(product);
              }
            }}
          />
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && currentOrder && (
        <POSPaymentModal
          order={currentOrder}
          client={selectedClient}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handlePayOrder}
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
          onConfirm={(product, qty, priceLevel) => {
            addItemToOrder(product, qty, priceLevel);
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
    </div>
  );
}