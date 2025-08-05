import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';
import { LoginForm } from './components/Auth/LoginForm';

// Pages
import { Dashboard } from './pages/Ejecutivo/Dashboard';
import { Inventario } from './pages/Almacen/Inventario';
import { ListadoProductos } from './pages/Almacen/ListadoProductos';
import { AjustesInventario } from './pages/Almacen/Ajustes';
import { Compras } from './pages/Almacen/Compras';
import { ReporteCompras } from './pages/Almacen/ReporteCompras';
import { ReporteAjustes } from './pages/Almacen/ReporteAjustes';
import { ReporteInventario } from './pages/Almacen/ReporteInventario';
import { ReporteCostos } from './pages/Almacen/ReporteCostos';
import { Proveedores } from './pages/Almacen/Proveedores';
import { Kardex } from './pages/Almacen/Kardex';
import { Catalogos } from './pages/Contabilidad/Catalogos';
import { MovimientosBancarios } from './pages/Contabilidad/Bancarios';
import { ReporteGastos } from './pages/Contabilidad/ReporteGastos';
import { Gastos } from './pages/Contabilidad/Gastos';
import { CFDI } from './pages/Ventas/CFDI';
import { PreciosVentas } from './pages/Ventas/Precios';
import { Clientes } from './pages/Ventas/Clientes';
import { ReportesVentas } from './pages/Ventas/Reportes';
import { AnalisisResultados } from './pages/Ejecutivo/Analisis';
import { CorteCaja } from './pages/Ejecutivo/CorteCaja';
import { POSLayout } from './components/POS/POSLayout';
import { HeaderOnly } from './components/POS/HeaderOnly';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function POSRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <div className="min-h-screen">{children}</div> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const loginSystem = localStorage.getItem('loginSystem'); // POS o ERP

  if (!isAuthenticated) return <>{children}</>;

  // Redirige según el sistema guardado
  if (loginSystem === 'POS') {
    return <Navigate to="/pos" replace />;
  }

  return <Navigate to="/ejecutivo/dashboard" replace />;
}


function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <LoginForm />
        </PublicRoute>
      } />
      
      {/* POS Route */}
      <Route path="/pos" element={
        <POSRoute>
          <POSLayout />
        </POSRoute>
      } />
      
      {/* Header Only Route for TV Display */}
      <Route path="/header-only" element={
        <POSRoute>
          <HeaderOnly />
        </POSRoute>
      } />
      
      {/* Executive Routes */}
      <Route path="/ejecutivo/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      
      {/* Warehouse Routes */}
      <Route path="/almacen/inventario" element={
        <PrivateRoute>
          <Inventario />
        </PrivateRoute>
      } />
      <Route path="/almacen/listado-productos" element={
        <PrivateRoute>
          <ListadoProductos />
        </PrivateRoute>
      } />
      <Route path="/almacen/ajustes" element={
        <PrivateRoute>
          <AjustesInventario />
        </PrivateRoute>
      } />
      <Route path="/almacen/compras" element={
        <PrivateRoute>
          <Compras />
        </PrivateRoute>
      } />
      <Route path="/almacen/reporte-compras" element={
        <PrivateRoute>
          <ReporteCompras />
        </PrivateRoute>
      } />
      <Route path="/almacen/reporte-ajustes" element={
        <PrivateRoute>
          <ReporteAjustes />
        </PrivateRoute>
      } />
      <Route path="/almacen/reporte-inventario" element={
        <PrivateRoute>
          <ReporteInventario />
        </PrivateRoute>
      } />
      <Route path="/almacen/reporte-costos" element={
        <PrivateRoute>
          <ReporteCostos />
        </PrivateRoute>
      } />
      <Route path="/almacen/proveedores" element={
        <PrivateRoute>
          <Proveedores />
        </PrivateRoute>
      } />
      <Route path="/almacen/kardex" element={
        <PrivateRoute>
          <Kardex />
        </PrivateRoute>
      } />
      
      {/* Accounting Routes */}
      <Route path="/contabilidad/catalogos" element={
        <PrivateRoute>
          <Catalogos />
        </PrivateRoute>
      } />
      <Route path="/contabilidad/bancarios" element={
        <PrivateRoute>
          <MovimientosBancarios />
        </PrivateRoute>
      } />
      <Route path="/contabilidad/reporte-gastos" element={
        <PrivateRoute>
          <ReporteGastos />
        </PrivateRoute>
      } />
      <Route path="/contabilidad/gastos" element={
        <PrivateRoute>
          <Gastos />
        </PrivateRoute>
      } />
      
      {/* Sales Routes */}
      <Route path="/ventas/cfdi" element={
        <PrivateRoute>
          <CFDI />
        </PrivateRoute>
      } />
      <Route path="/ventas/precios" element={
        <PrivateRoute>
          <PreciosVentas />
        </PrivateRoute>
      } />
      <Route path="/ventas/clientes" element={
        <PrivateRoute>
          <Clientes />
        </PrivateRoute>
      } />
      <Route path="/ventas/reportes" element={
        <PrivateRoute>
          <ReportesVentas />
        </PrivateRoute>
      } />
      
      {/* Executive Routes */}
      <Route path="/ejecutivo/analisis" element={
        <PrivateRoute>
          <AnalisisResultados />
        </PrivateRoute>
      } />
      <Route path="/ejecutivo/corte-caja" element={
        <PrivateRoute>
          <CorteCaja />
        </PrivateRoute>
      } />
      
      {/* Placeholder routes for remaining modules */}
      
      <Route path="/" element={<Navigate to="/ejecutivo/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;