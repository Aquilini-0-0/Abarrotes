import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, UserPlus, ShoppingCart, Package, BarChart3, Users, Shield, Zap, TrendingUp, Database, Clock, Building2, Briefcase, Monitor } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type SystemType = 'ERS' | 'POS';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingUsers, setIsCreatingUsers] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<SystemType>('ERS');
  
  const { login, loginPOS } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    // Guarda el sistema seleccionado
    localStorage.setItem('loginSystem', selectedSystem); // 👈 Guardamos ERP o POS

    const success = selectedSystem === 'POS' 
      ? await loginPOS(email, password)
      : await login(email, password);

    console.log(selectedSystem);

    if (!success) {
      setError('Email o contraseña incorrectos');
    }
  } catch (err) {
    setError('Error al iniciar sesión');
  } finally {
    setIsLoading(false);
  }
};



  const createTestUsers = async () => {
    setIsCreatingUsers(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        const successCount = data.results.filter((r: any) => r.success).length;
        setSuccess(`✅ ${successCount} usuarios creados exitosamente. Ya puedes iniciar sesión.`);
      } else {
        setError('Error al crear usuarios: ' + (data.error || 'Error desconocido'));
      }
    } catch (err) {
      setError('Error de conexión al crear usuarios');
    } finally {
      setIsCreatingUsers(false);
    }
  };

  const testUsers = [
    {
      role: 'Administrador',
      email: 'admin@duran.com',
      password: 'admin123',
      icon: Shield,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      role: 'Gerente',
      email: 'gerente@duran.com',
      password: 'gerente123',
      icon: BarChart3,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
    {
      role: 'Empleado',
      email: 'empleado@duran.com',
      password: 'empleado123',
      icon: Users,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ];

  const isERS = selectedSystem === 'ERS';
  const isPOS = selectedSystem === 'POS';

  // Colores dinámicos basados en el sistema seleccionado
const primaryColor = isERS ? 'blue' : 'orange';
const gradientFrom = isERS ? 'from-blue-600' : 'from-orange-400';
const gradientVia = isERS ? 'via-blue-700' : 'via-red-500';
const gradientTo = isERS ? 'to-blue-800' : 'to-red-600';
const focusColor = isERS ? 'focus:border-blue-600' : 'focus:border-orange-500';
const focusRing = isERS ? 'focus:ring-blue-300' : 'focus:ring-orange-200';
const buttonGradient = isERS
  ? 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
  : 'from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600';


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex">
      {/* Left Side - Hero Section */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3Ccircle cx='53' cy='7' r='7'/%3E%3Ccircle cx='7' cy='53' r='7'/%3E%3Ccircle cx='53' cy='53' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        {/* Hero Content - Perfectly Centered */}
        <div className="relative z-10 flex flex-col items-center text-center px-12 w-full mt-[20px]">
          <div className="max-w-lg">
            {/* Logo and Title */}
            <div className="mb-12">
              <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
                DURAN {selectedSystem}
              </h1>
              <p className="text-xl text-blue-100 mb-3 font-medium">
                {isERS ? 'Sistema de Gestión Empresarial' : 'Punto de Venta'}
              </p>
              <p className="text-blue-200 text-lg -mb-4">
                {isERS ? 'Punto de Venta • Inventario • Reportes' : 'Ventas Rápidas • Control de Stock • Reportes'}
              </p>
            </div>

            {/* Creative Business Visualization */}
            <div className="w-full max-w-md mb-12 mx-auto">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
                {/* Dashboard Mockup */}
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        {isERS ? <Building2 className="w-4 h-4 text-white" /> : <Monitor className="w-4 h-4 text-white" />}
                      </div>
                      <div className="text-left">
                        <div className="w-20 h-2 bg-white/30 rounded mb-1"></div>
                        <div className="w-16 h-1.5 bg-white/20 rounded"></div>
                      </div>
                    </div>
                    <div className="w-6 h-6 bg-green-400/80 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        {isERS ? <BarChart3 className="w-4 h-4 text-blue-200" /> : <ShoppingCart className="w-4 h-4 text-orange-200" />}
                        <div className="text-xs text-green-300 font-semibold">+12%</div>
                      </div>
                      <div className="w-12 h-1.5 bg-white/40 rounded mb-1"></div>
                      <div className="w-8 h-1 bg-white/20 rounded"></div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <Package className="w-4 h-4 text-blue-200" />
                        <div className={`text-xs ${isERS ? 'text-blue-300' : 'text-orange-300'} font-semibold`}>847</div>
                      </div>
                      <div className="w-10 h-1.5 bg-white/40 rounded mb-1"></div>
                      <div className="w-6 h-1 bg-white/20 rounded"></div>
                    </div>
                  </div>

                  {/* Chart Area */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-end justify-between h-16 space-x-1">
                      <div className={`w-3 ${isERS ? 'bg-blue-300/60' : 'bg-orange-300/60'} rounded-t`} style={{ height: '40%' }}></div>
                      <div className={`w-3 ${isERS ? 'bg-blue-300/60' : 'bg-orange-300/60'} rounded-t`} style={{ height: '60%' }}></div>
                      <div className={`w-3 ${isERS ? 'bg-blue-300/60' : 'bg-orange-300/60'} rounded-t`} style={{ height: '80%' }}></div>
                      <div className={`w-3 ${isERS ? 'bg-blue-300/60' : 'bg-orange-300/60'} rounded-t`} style={{ height: '45%' }}></div>
                      <div className={`w-3 ${isERS ? 'bg-blue-300/60' : 'bg-orange-300/60'} rounded-t`} style={{ height: '90%' }}></div>
                      <div className={`w-3 ${isERS ? 'bg-blue-300/60' : 'bg-orange-300/60'} rounded-t`} style={{ height: '70%' }}></div>
                      <div className={`w-3 ${isERS ? 'bg-blue-300/60' : 'bg-orange-300/60'} rounded-t`} style={{ height: '85%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Floating Stats */}
                <div className="absolute -top-4 -right-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-white/50">
                  <div className="flex items-center space-x-2">
                    <Database className={`w-4 h-4 ${isERS ? 'text-blue-600' : 'text-orange-600'}`} />
                    <span className="text-xs font-bold text-gray-800">99.9% Uptime</span>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -left-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-white/50">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-bold text-gray-800">24/7 Disponible</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-6 w-full max-w-sm mx-auto -mt-[20px]">
              <div className="text-center group cursor-pointer">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-xl mb-3 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                  {isERS ? <BarChart3 className="w-7 h-7 text-white" /> : <ShoppingCart className="w-7 h-7 text-white" />}
                </div>
                <p className="text-white text-sm font-semibold mb-1">
                  {isERS ? 'Reportes' : 'Ventas'}
                </p>
                <p className="text-blue-200 text-xs">
                  {isERS ? 'En tiempo real' : 'Rápidas y seguras'}
                </p>
              </div>
              
              <div className="text-center group cursor-pointer">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-xl mb-3 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <p className="text-white text-sm font-semibold mb-1">
                  {isERS ? 'Inventario' : 'Stock'}
                </p>
                <p className="text-blue-200 text-xs">
                  {isERS ? 'Control total' : 'En tiempo real'}
                </p>
              </div>
              
              <div className="text-center group cursor-pointer">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-xl mb-3 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <p className="text-white text-sm font-semibold mb-1">
                  {isERS ? 'Multi-usuario' : 'Usuarios'}
                </p>
                <p className="text-blue-200 text-xs">
                  {isERS ? 'Roles definidos' : 'Control de acceso'}
                </p>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 flex items-center justify-center space-x-6 text-blue-200 mt-[10px]">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Seguro</span>
              </div>
              <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm">Rápido</span>
              </div>
              <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Eficiente</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl mb-4 shadow-lg`}>
              <div className="text-2xl font-bold text-white">DE</div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">DURAN ERP</h1>
            <p className="text-gray-600">Sistema de Gestión Empresarial</p>
          </div>

          {/* System Selector */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-2 border border-gray-100">
              <div className="flex w-full">
                <button
                  type="button"
                  onClick={() => setSelectedSystem('ERS')}
                  className={`flex-1 flex items-center justify-center py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isERS
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="w-5 h-5 mr-2" />
                  ERS - Sistema Completo
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSystem('POS')}
                  className={`flex-1 flex items-center justify-center py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isPOS
                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Monitor className="w-5 h-5 mr-2" />
                  POS - Punto de Venta
                </button>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden backdrop-blur-sm">
            {/* Header */}
            <div className={`bg-gradient-to-r ${isERS ? 'from-slate-50 to-blue-50' : 'from-slate-50 to-orange-50'} px-8 py-6 border-b border-gray-100`}>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Iniciar sesión en {selectedSystem}
                </h2>
                <p className="text-gray-600">
                  {isERS ? 'Accede a tu sistema de gestión completo' : 'Accede al punto de venta'}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="px-8 py-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                    Correo Electrónico
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Mail className={`h-5 w-5 text-gray-400 group-focus-within:${isERS ? 'text-blue-600' : 'text-orange-600'} transition-colors duration-200`} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 border-2 border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-0 ${focusColor} transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white`}
                      placeholder="admin@duran.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                    Contraseña
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Lock className={`h-5 w-5 text-gray-400 group-focus-within:${isERS ? 'text-blue-600' : 'text-orange-600'} transition-colors duration-200`} />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-12 pr-12 py-4 border-2 border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-0 ${focusColor} transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors duration-200 z-10"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-r-xl shadow-sm">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-6 py-4 rounded-r-xl shadow-sm">
                    <p className="text-sm font-medium">{success}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r ${buttonGradient} focus:outline-none focus:ring-4 ${focusRing} disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Iniciar Sesión en {selectedSystem}
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-6 bg-white text-gray-500 font-medium">o configura el sistema</span>
                  </div>
                </div>

                {/* Create Test Users Button */}
                <button
                  type="button"
                  onClick={createTestUsers}
                  disabled={isCreatingUsers}
                  className={`w-full flex justify-center items-center py-4 px-6 border-2 ${isERS ? 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 focus:ring-blue-200' : 'border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 hover:border-orange-300 focus:ring-orange-200'} text-base font-semibold rounded-2xl focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md`}
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  {isCreatingUsers ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creando usuarios...
                    </>
                  ) : (
                    'Crear Usuarios de Prueba'
                  )}
                </button>
              </form>
            </div>

            {/* Test Users Info Section */}
            <div className={`bg-gradient-to-r ${isERS ? 'from-blue-50 to-slate-50' : 'from-orange-50 to-slate-50'} px-8 py-8 border-t border-gray-100`}>
              <div className="text-center">
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-md border border-gray-100">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                    <Database className={`w-5 h-5 ${isERS ? 'text-blue-600' : 'text-orange-600'} mr-2`} />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-800">Sistema Conectado</p>
                      <p className="text-xs text-gray-600">Base de datos Supabase activa</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <p className="text-sm font-semibold text-gray-800 mb-6">
                    Usuarios de Prueba Disponibles para {selectedSystem}:
                  </p>
                  
                  <div className="space-y-4">
                    {testUsers.map((user, index) => {
                      const IconComponent = user.icon;
                      return (
                        <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 ${user.bgColor} rounded-xl flex items-center justify-center mr-4 shadow-sm`}>
                              <IconComponent className={`w-5 h-5 ${user.iconColor}`} />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-semibold text-gray-800">{user.role}</p>
                              <p className="text-xs text-gray-600">{user.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono bg-gray-200 px-3 py-1 rounded-md text-gray-700 font-semibold">
                              {user.password}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className={`mt-6 p-4 ${isERS ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'} rounded-xl border`}>
                    <p className={`text-xs ${isERS ? 'text-blue-700' : 'text-orange-700'} flex items-center justify-center font-medium`}>
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                      Los usuarios se crearán automáticamente y funcionan para ambos sistemas
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              © 2024 DURAN ERP - Sistema de Gestión Empresarial
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Desarrollado con tecnología moderna y segura
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}