import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UsuarioSistema {
  id: string;
  auth_id?: string;
  almacen: string;
  name: string; // Keep original name field
  nombre_completo: string;
  nombre_usuario: string;
  email: string; // Keep original email field
  correo: string;
  monto_autorizacion: number;
  role: 'Admin' | 'Gerente' | 'Empleado'; // Keep original role
  puesto: 'Admin' | 'Vendedor' | 'Chofer';
  rfc: string;
  curp: string;
  telefono: string;
  estatus: boolean;
  permisos: {
    agregar_clientes?: boolean;
    corte_normal?: boolean;
    deshabilitar_reimpresiones?: boolean;
    habilitar_cancelaciones?: boolean;
    habilitar_cobro_directo?: boolean;
    habilitar_precio_libre?: boolean;
    habilitar_venta_sin_existencia?: boolean;
    habilitar_ventas_credito?: boolean;
    habilitar_ventas_especiales?: boolean;
    mostrar_registro_anticipos?: boolean;
    ver_imprimir_cortes?: boolean;
  };
  fecha_registro: string;
  created_at: string;
  updated_at: string;
}

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedUsuarios: UsuarioSistema[] = data.map(item => ({
        id: item.id,
        auth_id: item.auth_id,
        almacen: '', // Default empty since column doesn't exist yet
        name: item.name,
        nombre_completo: item.name,
        nombre_usuario: '', // Default empty since column doesn't exist yet
        email: item.email,
        correo: item.email, // Map email to correo for compatibility
        monto_autorizacion: 0, // Default 0 since column doesn't exist yet
        role: item.role,
        puesto: item.role, // Map role to puesto for compatibility
        rfc: '', // Default empty since column doesn't exist yet
        curp: '', // Default empty since column doesn't exist yet
        telefono: '', // Default empty since column doesn't exist yet
        estatus: true, // Default to true
        permisos: {}, // Default empty permissions
        fecha_registro: item.created_at,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setUsuarios(formattedUsuarios);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching usuarios');
    } finally {
      setLoading(false);
    }
  };

  const createUsuario = async (usuarioData: Omit<UsuarioSistema, 'id' | 'created_at' | 'updated_at' | 'fecha_registro'>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          auth_id: null, // Will be set when user first logs in
          name: usuarioData.nombre_completo,
          email: usuarioData.correo,
          role: usuarioData.puesto === 'Admin' ? 'Admin' : usuarioData.puesto === 'Vendedor' ? 'Empleado' : 'Empleado',
        }])
        .select()
        .single();

      if (error) throw error;

      const newUsuario: UsuarioSistema = {
        id: data.id,
        auth_id: data.auth_id,
        almacen: usuarioData.almacen,
        name: data.name,
        nombre_completo: data.name,
        nombre_usuario: usuarioData.nombre_usuario,
        email: data.email,
        correo: data.email,
        monto_autorizacion: usuarioData.monto_autorizacion,
        role: data.role,
        puesto: usuarioData.puesto,
        rfc: usuarioData.rfc,
        curp: usuarioData.curp,
        telefono: usuarioData.telefono,
        estatus: usuarioData.estatus,
        permisos: usuarioData.permisos,
        fecha_registro: data.created_at,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setUsuarios(prev => [newUsuario, ...prev]);
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return newUsuario;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating usuario');
    }
  };

  const updateUsuario = async (id: string, usuarioData: Partial<UsuarioSistema>) => {
    try {
      // Prepare update data, mapping fields correctly
      const updateData: any = {};
      
      if (usuarioData.nombre_completo !== undefined) updateData.name = usuarioData.nombre_completo;
      if (usuarioData.correo !== undefined) updateData.email = usuarioData.correo;
      if (usuarioData.puesto !== undefined) {
        // Map puesto to role for compatibility
        updateData.role = usuarioData.puesto === 'Admin' ? 'Admin' : usuarioData.puesto === 'Vendedor' ? 'Empleado' : 'Empleado';
      }
      
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedUsuario: UsuarioSistema = {
        id: data.id,
        auth_id: data.auth_id,
        almacen: usuarioData.almacen || '',
        name: data.name,
        nombre_completo: data.name,
        nombre_usuario: usuarioData.nombre_usuario || '',
        email: data.email,
        correo: data.email,
        monto_autorizacion: usuarioData.monto_autorizacion || 0,
        role: data.role,
        puesto: usuarioData.puesto || data.role,
        rfc: usuarioData.rfc || '',
        curp: usuarioData.curp || '',
        telefono: usuarioData.telefono || '',
        estatus: usuarioData.estatus !== false,
        permisos: usuarioData.permisos || {},
        fecha_registro: data.created_at,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setUsuarios(prev => prev.map(u => u.id === id ? updatedUsuario : u));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return updatedUsuario;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating usuario');
    }
  };

  const deleteUsuario = async (id: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUsuarios(prev => prev.filter(u => u.id !== id));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error deleting usuario');
    }
  };

  useEffect(() => {
    fetchUsuarios();
    
    // Listen for manual sync events
    const handleRefresh = () => {
      fetchUsuarios();
    };
    
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, []);

  return {
    usuarios,
    loading,
    error,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    refetch: fetchUsuarios
  };
}