import React from 'react';
import { 
  FileText, 
  ShoppingCart, 
  Calculator, 
  History, 
  Settings, 
  RotateCcw,
  LogOut,
  DollarSign,
  Printer,
  Clock,
  User
} from 'lucide-react';
import { CashRegister } from '../../types/pos';
import { useAuth } from '../../context/AuthContext';

interface POSMenuBarProps {
  onOpenOrders: () => void;
  onOpenCash: () => void;
  cashRegister: CashRegister | null;
  onOpenCreditPayments: () => void;
  onOpenAdvances: () => void;
  onOpenCashCuts: () => void;
  lastOrder?: {
    id: string;
    client_name: string;
    total: number;
    items_count: number;
    products?: Array<{
      name: string;
      quantity: number;
    }>;
    date: string;
    status: string;
  } | null;
}

export function POSMenuBar({ 
  onOpenOrders, 
  onOpenCash, 
  cashRegister, 
  onOpenCreditPayments, 
  onOpenAdvances, 
  onOpenCashCuts,
  lastOrder 
}: POSMenuBarProps) {
  const { user, logout } = useAuth();

  return (
  <div className="bg-white border-b border-gray-200 shadow-sm">
    {/* Main Menu Bar */}
    <div className="px-4 py-1"> {/* Antes era py-3 */}
      <div className="flex items-center justify-between">
        
        {/* Left - Menu Items */}
        <div className="flex items-center space-x-4"> {/* Menos espacio entre elementos */}
          
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <span className="text-black font-bold text-base">
              DURAN-PUNTO DE VENTA
            </span>
          </div>

          {/* Menu Items */}
          <div className="flex items-center space-x-1">
            
            {/* Pedidos */}
            <div className="relative group">
              <button className="px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded text-sm font-medium transition-colors">
                Pedidos
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded">
                  <ShoppingCart size={14} />
                  <span>Realizar Pedido</span>
                </button>
                <button 
                  onClick={onOpenOrders}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <FileText size={14} />
                  <span>Consultar Mis Pedidos</span>
                </button>
              </div>
            </div>

            {/* Caja */}
            <div className="relative group">
              <button className="px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded text-sm font-medium transition-colors">
                Caja
              </button>
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button 
                  onClick={onOpenCash}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <DollarSign size={14} />
                  <span>Apertura de Caja</span>
                </button>
                <button 
                  onClick={onOpenCash}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <Calculator size={14} />
                  <span>Corte de Caja</span>
                </button>
                <hr className="border-gray-200 my-1" />
                <button 
                  onClick={onOpenCreditPayments}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <DollarSign size={14} />
                  <span>Abonar/Pagar Ventas a Crédito</span>
                </button>
                <button className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded">
                  <Calculator size={14} />
                  <span>Movimientos de Efectivo</span>
                </button>
                <hr className="border-gray-200 my-1" />
                <button className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded">
                  <Printer size={14} />
                  <span>Imprimir Precios</span>
                </button>
              </div>
            </div>

            {/* Historial */}
            <div className="relative group">
              <button className="px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded text-sm font-medium transition-colors">
                Historial
              </button>
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded">
                  <FileText size={14} />
                  <span>Remisiones</span>
                </button>
                <button className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded">
                  <FileText size={14} />
                  <span>Comprobantes Fiscales</span>
                </button>
                <button 
                  onClick={onOpenCashCuts}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <Calculator size={14} />
                  <span>Mis Cortes de Caja</span>
                </button>
                <button className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded">
                  <FileText size={14} />
                  <span>Vales por Devolución</span>
                </button>
                <button 
                  onClick={onOpenAdvances}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <DollarSign size={14} />
                  <span>Anticipos</span>
                </button>
              </div>
            </div>

            {/* Cerrar sesión */}
            <div className="relative group">
              <button 
                onClick={logout}
                className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center space-x-2 rounded text-sm"
              >
                <LogOut size={14} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right - Status Info */}
        <div className="flex items-center space-x-3">
          {/* Cash Register Status */}
          {cashRegister && (
            <div className="flex items-center space-x-2 bg-green-50 border border-green-200 px-2 py-1 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 text-xs font-medium">
                Caja Abierta: ${cashRegister.opening_amount.toLocaleString('es-MX')}
              </span>
            </div>
          )}

          {/* User Info */}
          <div className="text-right">
            <div className="text-gray-500 text-xs font-medium">{user?.name}</div>
            <div className="text-gray-600 text-[10px]">{user?.role}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

      {/* Last Order Information Bar */}
      {lastOrder && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-t border-orange-200 px-4 py-2 overflow-x-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-orange-700 font-semibold text-sm">Último Pedido:</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <FileText size={14} className="text-orange-600" />
                <span className="text-gray-700 font-mono text-sm">
                  #{lastOrder.id.slice(-6).toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <User size={14} className="text-orange-600" />
                <span className="text-gray-700 text-sm font-medium">
                  {lastOrder.client_name}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <ShoppingCart size={14} className="text-orange-600" />
                <span className="text-gray-700 text-sm">
                  {lastOrder.items_count} productos
                </span>
              </div>
              
              {/* Products List */}
              <div className="flex items-center space-x-1">
                <span className="text-orange-600 text-sm font-medium">Productos:</span>
                <div className="flex items-center space-x-2 max-w-md overflow-x-auto">
                  {lastOrder.products && lastOrder.products.slice(0, 3).map((product, index) => (
                    <span
                      key={index}
                      className="bg-white px-2 py-1 rounded border border-orange-200 text-xs text-gray-700 whitespace-nowrap"
                      title={`${product.name} - Cant: ${product.quantity}`}
                    >
                      {product.name.length > 15 ? `${product.name.substring(0, 15)}...` : product.name}
                      <span className="text-orange-600 font-semibold ml-1">({product.quantity})</span>
                    </span>
                  ))}
                  {lastOrder.products && lastOrder.products.length > 3 && (
                    <span className="bg-gray-100 px-2 py-1 rounded border border-gray-300 text-xs text-gray-600">
                      +{lastOrder.products.length - 3} más
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <DollarSign size={14} className="text-orange-600" />
                <span className="text-green-600 font-bold text-sm">
                  ${lastOrder.total.toLocaleString('es-MX')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="flex items-center space-x-1">
                <Clock size={14} className="text-gray-500" />
                <span className="text-gray-500 text-xs">
                  {new Date(lastOrder.date).toLocaleTimeString('es-MX', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                lastOrder.status === 'paid' ? 'bg-green-100 text-green-700' :
                lastOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {lastOrder.status === 'paid' ? 'Pagado' : 
                 lastOrder.status === 'pending' ? 'Pendiente' : 'Guardado'}
              </span>
             
             <button
               onClick={() => window.open('/header-only', '_blank')}
               className="flex items-center space-x-1 bg-white hover:bg-gray-50 text-orange-600 border border-orange-300 px-3 py-1 rounded-lg text-xs font-medium transition-colors shadow-sm"
               title="Abrir vista para proyectar en TV"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V4a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
               </svg>
               <span>Proyectar en TV</span>
             </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}