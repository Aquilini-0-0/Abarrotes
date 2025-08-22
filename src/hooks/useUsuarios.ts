import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UsuarioSistema {
  id: string;
  auth_id?: string;
  almacen: string;
  nombre_completo: string;
  nombre_usuario: string;
  correo: string;
  monto_autorizacion: number;
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
        .from('usuarios_sistema')
        .select('*')
        .order('nombre_completo', { ascending: true });

      if (error) throw error;

      const formattedUsuarios: UsuarioSistema[] = data.map(item => ({
        id: item.id,
        auth_id: item.auth_id,
        almacen: item.almacen,
        nombre_completo: item.nombre_completo,
        nombre_usuario: item.nombre_usuario,
        correo: item.correo,
        monto_autorizacion: Number(item.monto_autorizacion) || 0,
        puesto: item.puesto,
        rfc: item.rfc,
        curp: item.curp,
        telefono: item.telefono,
        estatus: item.estatus,
        permisos: item.permisos || {},
        fecha_registro: item.fecha_registro,
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
        .from('usuarios_sistema')
        .insert([usuarioData])
        .select()
        .single();

      if (error) throw error;

      const newUsuario: UsuarioSistema = {
        id: data.id,
        auth_id: data.auth_id,
        almacen: data.almacen,
        nombre_completo: data.nombre_completo,
        nombre_usuario: data.nombre_usuario,
        correo: data.correo,
        monto_autorizacion: Number(data.monto_autorizacion) || 0,
        puesto: data.puesto,
        rfc: data.rfc,
        curp: data.curp,
        telefono: data.telefono,
        estatus: data.estatus,
        permisos: data.permisos || {},
        fecha_registro: data.fecha_registro,
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
      const { data, error } = await supabase
        .from('usuarios_sistema')
        .update(usuarioData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedUsuario: UsuarioSistema = {
        id: data.id,
        auth_id: data.auth_id,
        almacen: data.almacen,
        nombre_completo: data.nombre_completo,
        nombre_usuario: data.nombre_usuario,
        correo: data.correo,
        monto_autorizacion: Number(data.monto_autorizacion) || 0,
        puesto: data.puesto,
        rfc: data.rfc,
        curp: data.curp,
        telefono: data.telefono,
        estatus: data.estatus,
        permisos: data.permisos || {},
        fecha_registro: data.fecha_registro,
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
        .from('usuarios_sistema')
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