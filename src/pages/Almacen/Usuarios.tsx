import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useUsuarios, UsuarioSistema } from '../../hooks/useUsuarios';
import { useWarehouseTransfers } from '../../hooks/useWarehouseTransfers';
import { Plus, Edit, Trash2, Eye, Search, User, Shield, Settings, X } from 'lucide-react';

export function Usuarios() {
  const { usuarios, loading, error, createUsuario, updateUsuario, deleteUsuario } = useUsuarios();
  const { warehouses, loading: warehousesLoading } = useWarehouseTransfers();
  const [showForm, setShowForm] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioSistema | null>(null);
  const [viewingUsuario, setViewingUsuario] = useState<UsuarioSistema | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUsuario, setNewUsuario] = useState({
    almacen: '',
    nombre_completo: '',
    nombre_usuario: '',
    password: '',
    correo: '',
    monto_autorizacion: 0,
    puesto: 'Vendedor' as 'Admin' | 'Vendedor' | 'Chofer',
    rfc: '',
    curp: '',
    telefono: '',
    estatus: true,
    permisos: {
      agregar_clientes: false,
      corte_normal: false,
      deshabilitar_reimpresiones: false,
      habilitar_cancelaciones: false,
      habilitar_cobro_directo: false,
      habilitar_precio_libre: false,
      habilitar_venta_sin_existencia: false,
      habilitar_ventas_credito: false,
      habilitar_ventas_especiales: false,
      mostrar_registro_anticipos: false,
      ver_imprimir_cortes: false
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUsuario.nombre_completo.trim()) {
      alert('El nombre completo es requerido');
      return;
    }
    
    if (!newUsuario.nombre_usuario.trim()) {
      alert('El nombre de usuario es requerido');
      return;
    }
    
    if (!newUsuario.correo.trim()) {
      alert('El correo es requerido');
      return;
    }

    if (!editingUsuario && !newUsuario.password.trim()) {
      alert('La contraseña es requerida');
      return;
    }

    try {
      if (editingUsuario) {
        // For updates, only include password if it's provided
        const updateData = { ...newUsuario };
        if (!newUsuario.password.trim()) {
          delete updateData.password;
        }
        await updateUsuario(editingUsuario.id, updateData);
        alert('Usuario actualizado exitosamente');
        setEditingUsuario(null);
      } else {
        await createUsuario(newUsuario);
        alert('Usuario creado exitosamente');
      }
      
      setNewUsuario({
        almacen: '',
        nombre_completo: '',
        nombre_usuario: '',
        password: '',
        correo: '',
        monto_autorizacion: 0,
        puesto: 'Vendedor',
        rfc: '',
        curp: '',
        telefono: '',
        estatus: true,
        permisos: {
          agregar_clientes: false,
          corte_normal: false,
          deshabilitar_reimpresiones: false,
          habilitar_cancelaciones: false,
          habilitar_cobro_directo: false,
          habilitar_precio_libre: false,
          habilitar_venta_sin_existencia: false,
          habilitar_ventas_credito: false,
          habilitar_ventas_especiales: false,
          mostrar_registro_anticipos: false,
          ver_imprimir_cortes: false
        }
      });
      setShowForm(false);
    } catch (err) {
      console.error('Error saving usuario:', err);
      alert('Error al guardar el usuario: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleEdit = (usuario: UsuarioSistema) => {
    setEditingUsuario(usuario);
    setNewUsuario({
      almacen: usuario.almacen,
      nombre_completo: usuario.nombre_completo,
      nombre_usuario: usuario.nombre_usuario,
      password: '', // Don't pre-fill password for security
      correo: usuario.correo,
      monto_autorizacion: usuario.monto_autorizacion,
      puesto: usuario.puesto,
      rfc: usuario.rfc,
      curp: usuario.curp,
      telefono: usuario.telefono,
      estatus: usuario.estatus,
      permisos: usuario.permisos
    });
    setShowForm(true);
  };

  const handleView = (usuario: UsuarioSistema) => {
    setViewingUsuario(usuario);
    setShowViewModal(true);
  };

  const handlePermissions = (usuario: UsuarioSistema) => {
    setEditingUsuario(usuario);
    setNewUsuario({
      almacen: usuario.almacen,
      nombre_completo: usuario.nombre_completo,
      nombre_usuario: usuario.nombre_usuario,
      password: '',
      correo: usuario.correo,
      monto_autorizacion: usuario.monto_autorizacion,
      puesto: usuario.puesto,
      rfc: usuario.rfc,
      curp: usuario.curp,
      telefono: usuario.telefono,
      estatus: usuario.estatus,
      permisos: usuario.permisos
    });
    setShowPermissionsModal(true);
  };

  const handleDelete = async (usuarioId: string) => {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      try {
        await deleteUsuario(usuarioId);
        alert('Usuario eliminado exitosamente');
      } catch (err) {
        console.error('Error deleting usuario:', err);
        alert('Error al eliminar el usuario');
      }
    }
  };

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.nombre_usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.almacen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.puesto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'almacen', label: 'Almacén', sortable: true },
    { key: 'nombre_completo', label: 'Nombre', sortable: true },
    { 
      key: 'puesto', 
      label: 'Cargo', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Admin' ? 'bg-red-100 text-red-800' :
          value === 'Vendedor' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'estatus',
      label: 'Estatus',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Habilitado' : 'Deshabilitado'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, usuario: UsuarioSistema) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleView(usuario)}
            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
            title="Ver usuario"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleEdit(usuario)}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
            title="Editar usuario"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handlePermissions(usuario)}
            className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded"
            title="Asignar permisos"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => handleDelete(usuario.id)}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
            title="Eliminar usuario"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const totalUsuarios = usuarios.length;
  const usuariosActivos = usuarios.filter(u => u.estatus).length;
  const administradores = usuarios.filter(u => u.puesto === 'Admin').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Agregar Usuario</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total Usuarios">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalUsuarios}</div>
              <div className="text-sm text-gray-500">Registrados</div>
            </div>
          </div>
        </Card>

        <Card title="Usuarios Activos">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{usuariosActivos}</div>
              <div className="text-sm text-gray-500">Habilitados</div>
            </div>
          </div>
        </Card>

        <Card title="Administradores">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <Settings className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{administradores}</div>
              <div className="text-sm text-gray-500">Con acceso total</div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Lista de Usuarios">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Buscar por nombre, usuario, correo, almacén o cargo..."
            />
          </div>
        </div>
        
        <DataTable
          data={filteredUsuarios}
          columns={columns}
          title="Usuarios del Sistema"
        />
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingUsuario(null);
                    setNewUsuario({
                      almacen: '',
                      nombre_completo: '',
                      nombre_usuario: '',
                      password: '',
                      correo: '',
                      monto_autorizacion: 0,
                      puesto: 'Vendedor',
                      rfc: '',
                      curp: '',
                      telefono: '',
                      estatus: true,
                      permisos: {
                        agregar_clientes: false,
                        corte_normal: false,
                        deshabilitar_reimpresiones: false,
                        habilitar_cancelaciones: false,
                        habilitar_cobro_directo: false,
                        habilitar_precio_libre: false,
                        habilitar_venta_sin_existencia: false,
                        habilitar_ventas_credito: false,
                        habilitar_ventas_especiales: false,
                        mostrar_registro_anticipos: false,
                        ver_imprimir_cortes: false
                      }
                    });
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Almacén
                  </label>
                  <select
                    value={newUsuario.almacen}
                    onChange={(e) => setNewUsuario(prev => ({ ...prev, almacen: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={warehousesLoading}
                  >
                    <option value="">
                      {warehousesLoading ? 'Cargando almacenes...' : 'Seleccionar almacén'}
                    </option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.name}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={newUsuario.nombre_completo}
                    onChange={(e) => setNewUsuario(prev => ({ ...prev, nombre_completo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Juan Pérez García"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de Usuario *
                  </label>
                  <input
                    type="text"
                    value={newUsuario.nombre_usuario}
                    onChange={(e) => setNewUsuario(prev => ({ ...prev, nombre_usuario: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: jperez"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña {editingUsuario ? '(dejar vacío para mantener actual)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={newUsuario.password}
                    onChange={(e) => setNewUsuario(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={editingUsuario ? "Nueva contraseña..." : "Contraseña..."}
                    required={!editingUsuario}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo *
                  </label>
                  <input
                    type="email"
                    value={newUsuario.correo}
                    onChange={(e) => setNewUsuario(prev => ({ ...prev, correo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: juan@duran.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Autorización
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newUsuario.monto_autorizacion}
                    onChange={(e) => setNewUsuario(prev => ({ ...prev, monto_autorizacion: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Puesto *
                  </label>
                  <select
                    value={newUsuario.puesto}
                    onChange={(e) => setNewUsuario(prev => ({ ...prev, puesto: e.target.value as 'Admin' | 'Vendedor' | 'Chofer' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Admin">Admin</option>
                    <option value="Vendedor">Vendedor</option>
                    <option value="Chofer">Chofer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RFC
                  </label>
                  <input
                    type="text"
                    value={newUsuario.rfc}
                    onChange={(e) => setNewUsuario(prev => ({ ...prev, rfc: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: PEGJ800101ABC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CURP
                  </label>
                  <input
                    type="text"
                    value={newUsuario.curp}
                    onChange={(e) => setNewUsuario(prev => ({ ...prev, curp: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: PEGJ800101HDFRRN09"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={newUsuario.telefono}
                    onChange={(e) => setNewUsuario(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 555-123-4567"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="estatus"
                    checked={newUsuario.estatus}
                    onChange={(e) => setNewUsuario(prev => ({ ...prev, estatus: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="estatus" className="ml-2 block text-sm text-gray-900">
                    Usuario Habilitado
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUsuario(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingUsuario ? 'Actualizar' : 'Crear'} Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && editingUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-purple-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Asignar Permisos - {editingUsuario.nombre_completo}
                </h2>
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries({
                  agregar_clientes: 'Agregar Clientes',
                  corte_normal: 'Corte Normal',
                  deshabilitar_reimpresiones: 'Deshabilitar Reimpresiones de Remisiones',
                  habilitar_cancelaciones: 'Habilitar Cancelaciones',
                  habilitar_cobro_directo: 'Habilitar Cobro Directo',
                  habilitar_precio_libre: 'Habilitar Precio Libre',
                  habilitar_venta_sin_existencia: 'Habilitar Venta sin Existencia',
                  habilitar_ventas_credito: 'Habilitar Ventas a Crédito',
                  habilitar_ventas_especiales: 'Habilitar Ventas Especiales',
                  mostrar_registro_anticipos: 'Mostrar Registro/Cancelación Anticipos',
                  ver_imprimir_cortes: 'Ver Imprimir/Cortes'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={key}
                      checked={newUsuario.permisos[key as keyof typeof newUsuario.permisos] || false}
                      onChange={(e) => setNewUsuario(prev => ({
                        ...prev,
                        permisos: {
                          ...prev.permisos,
                          [key]: e.target.checked
                        }
                      }))}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor={key} className="ml-2 block text-sm text-gray-900">
                      {label}
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    try {
                      await updateUsuario(editingUsuario.id, { permisos: newUsuario.permisos });
                      setShowPermissionsModal(false);
                      setEditingUsuario(null);
                      alert('Permisos actualizados exitosamente');
                    } catch (err) {
                      console.error('Error updating permissions:', err);
                      alert('Error al actualizar los permisos');
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Guardar Permisos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Ver Usuario - {viewingUsuario.nombre_completo}
                </h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingUsuario(null);
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Información Personal</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Nombre Completo</label>
                      <p className="text-gray-900 font-medium">{viewingUsuario.nombre_completo}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Usuario</label>
                      <p className="text-gray-900 font-mono">{viewingUsuario.nombre_usuario}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Correo</label>
                      <p className="text-gray-900">{viewingUsuario.correo}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Teléfono</label>
                      <p className="text-gray-900">{viewingUsuario.telefono || 'No especificado'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Información Laboral</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Almacén</label>
                      <p className="text-gray-900">{viewingUsuario.almacen || 'No asignado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Puesto</label>
                      <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        viewingUsuario.puesto === 'Admin' ? 'bg-red-100 text-red-800' :
                        viewingUsuario.puesto === 'Vendedor' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {viewingUsuario.puesto}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Monto Autorización</label>
                      <p className="text-gray-900 font-mono">${viewingUsuario.monto_autorizacion.toLocaleString('es-MX')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Fecha de Registro</label>
                      <p className="text-gray-900">{new Date(viewingUsuario.fecha_registro).toLocaleDateString('es-MX')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Permisos Asignados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries({
                    agregar_clientes: 'Agregar Clientes',
                    corte_normal: 'Corte Normal',
                    deshabilitar_reimpresiones: 'Deshabilitar Reimpresiones',
                    habilitar_cancelaciones: 'Habilitar Cancelaciones',
                    habilitar_cobro_directo: 'Habilitar Cobro Directo',
                    habilitar_precio_libre: 'Habilitar Precio Libre',
                    habilitar_venta_sin_existencia: 'Habilitar Venta sin Existencia',
                    habilitar_ventas_credito: 'Habilitar Ventas a Crédito',
                    habilitar_ventas_especiales: 'Habilitar Ventas Especiales',
                    mostrar_registro_anticipos: 'Mostrar Registro Anticipos',
                    ver_imprimir_cortes: 'Ver Imprimir/Cortes'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        viewingUsuario.permisos[key as keyof typeof viewingUsuario.permisos] 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      }`}></div>
                      <span className={`text-sm ${
                        viewingUsuario.permisos[key as keyof typeof viewingUsuario.permisos] 
                          ? 'text-green-700' 
                          : 'text-red-700'
                      }`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingUsuario(null);
                    handleEdit(viewingUsuario);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit size={16} />
                  <span>Editar Usuario</span>
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingUsuario(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}