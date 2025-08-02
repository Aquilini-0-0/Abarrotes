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
  Printer
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
}

export function POSMenuBar({ onOpenOrders, onOpenCash, cashRegister, onOpenCreditPayments, onOpenAdvances, onOpenCashCuts }: POSMenuBarProps) {
  const { user, logout } = useAuth();

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left - Menu Items */}
        <div className="flex items-center space-x-6">
          {/* Logo */}
          <div className="flex items-center space-x-2">
             
            <span className="text-black font-bold text-lg">DURAN-PUNTO DE VENTA</span>
          </div>

          {/* Menu Items */}
          <div className="flex items-center space-x-1">


            {/* Pedidos */}
            <div className="relative group">
              <button className="px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors">
                Pedidos
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded-lg">
                  <ShoppingCart size={16} />
                  <span>Realizar Pedido</span>
                </button>
                <button 
                  onClick={onOpenOrders}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded-lg"
                >
                  <FileText size={16} />
                  <span>Consultar Mis Pedidos</span>
                </button>
              </div>
            </div>

            {/* Caja */}
            <div className="relative group">
              <button className="px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors">
                Caja
              </button>
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button 
                  onClick={onOpenCash}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded-lg"
                >
                  <DollarSign size={16} />
                  <span>Apertura de Caja</span>
                </button>
                <button 
                  onClick={onOpenCash}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded-lg"
                >
                  <Calculator size={16} />
                  <span>Corte de Caja</span>
                </button>
                <hr className="border-gray-200 my-1" />
                <button 
                  onClick={onOpenCreditPayments}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded-lg"
                >
                  <DollarSign size={16} />
                  <span>Abonar/Pagar Ventas a Crédito</span>
                </button>
                <button className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded-lg">
                  <Calculator size={16} />
                  <span>Movimientos de Efectivo</span>
                </button>
                <hr className="border-gray-200 my-1" />
                <button className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded-lg">
                  <Printer size={16} />
                  <span>Imprimir Precios</span>
                </button>
              </div>
            </div>

            {/* Historial */}
            <div className="relative group">
              <button className="px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors">
                Historial
              </button>
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded-lg">
                  <FileText size={16} />
                  <span>Remisiones</span>
                </button>
                <button className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded-lg">
                  <FileText size={16} />
                  <span>Comprobantes Fiscales</span>
                </button>
                <button 
                  onClick={onOpenCashCuts}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded-lg"
                >
                  <Calculator size={16} />
                  <span>Mis Cortes de Caja</span>
                </button>
                <button className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded-lg">
                  <FileText size={16} />
                  <span>Vales por Devolución</span>
                </button>
                <button 
                  onClick={onOpenAdvances}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded-lg"
                >
                  <DollarSign size={16} />
                  <span>Anticipos</span>
                </button>
              </div>
            </div>
           {/* Cerrrar sesión */}
            <div className="relative group">
 <button 
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center space-x-2 rounded-lg"
                >
                  <LogOut size={16} />
                  <span>Cerrar sesión</span>
                </button>
            </div>
          </div>
        </div>

        {/* Right - Status Info */}
        <div className="flex items-center space-x-4">
          {/* Cash Register Status */}
          {cashRegister && (
            <div className="flex items-center space-x-2 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 text-sm font-medium">
                Caja Abierta: ${cashRegister.opening_amount.toLocaleString('es-MX')}
              </span>
            </div>
          )}

          {/* User Info */}
          <div className="text-right">
            <div className="text-gray-500 text-sm font-medium">{user?.name}</div>
            <div className="text-gray-600 text-xs">{user?.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}