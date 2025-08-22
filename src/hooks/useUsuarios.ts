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
        .order('nombre_completo', { ascending: true });

      if (error) throw error;

      const formattedUsuarios: UsuarioSistema[] = data.map(item => ({
        id: item.id,
        auth_id: item.auth_id,
        almacen: item.almacen || '',
        name: item.name,
        nombre_completo: item.nombre_completo || item.name,
        nombre_usuario: item.nombre_usuario || '',
        email: item.email,
        correo: item.email, // Map email to correo for compatibility
        monto_autorizacion: Number(item.monto_autorizacion) || 0,
        role: item.role,
        puesto: item.puesto || item.role,
        rfc: item.rfc || '',
        curp: item.curp || '',
        telefono: item.telefono || '',
        estatus: item.estatus !== false, // Default to true if null
        permisos: item.permisos || {},
        fecha_registro: item.fecha_registro || item.created_at,
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
      // Create auth user first if password is provided
      let auth_id = null;
      if (usuarioData.password) {
        try {
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: usuarioData.correo,
            password: usuarioData.password,
            email_confirm: true
          });

          if (authError) {
            console.warn('Could not create auth user:', authError);
            // Continue without auth_id - user can be created manually later
          } else {
            auth_id = authUser.user.id;
          }
        } catch (authErr) {
          console.warn('Auth creation failed, continuing without auth:', authErr);
        }
      }

      const { data, error } = await supabase
        .from('users')
        .insert([{
          auth_id,
          almacen: usuarioData.almacen,
          name: usuarioData.nombre_completo,
          nombre_completo: usuarioData.nombre_completo,
          nombre_usuario: usuarioData.nombre_usuario,
          email: usuarioData.correo,
          monto_autorizacion: usuarioData.monto_autorizacion,
          role: usuarioData.puesto === 'Admin' ? 'Admin' : usuarioData.puesto === 'Vendedor' ? 'Empleado' : 'Empleado',
          puesto: usuarioData.puesto,
          rfc: usuarioData.rfc,
          curp: usuarioData.curp,
          telefono: usuarioData.telefono,
          estatus: usuarioData.estatus,
          permisos: usuarioData.permisos,
          fecha_registro: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      const newUsuario: UsuarioSistema = {
        id: data.id,
        auth_id: data.auth_id,
        almacen: data.almacen || '',
        name: data.name,
        nombre_completo: data.nombre_completo || data.name,
        nombre_usuario: data.nombre_usuario || '',
        email: data.email,
        correo: data.email,
        monto_autorizacion: Number(data.monto_autorizacion) || 0,
        role: data.role,
        puesto: data.puesto || data.role,
        rfc: data.rfc || '',
        curp: data.curp || '',
        telefono: data.telefono || '',
        estatus: data.estatus !== false,
        permisos: data.permisos || {},
        fecha_registro: data.fecha_registro || data.created_at,
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
      // Handle password update if provided
      if (usuarioData.password) {
        try {
          // Get current user data to find auth_id
          const currentUser = usuarios.find(u => u.id === id);
          if (currentUser?.auth_id) {
            await supabase.auth.admin.updateUserById(currentUser.auth_id, {
              password: usuarioData.password
            });
          }
        } catch (authErr) {
          console.warn('Could not update auth password:', authErr);
        }
      }

      // Prepare update data, mapping fields correctly
      const updateData: any = {};
      
      if (usuarioData.almacen !== undefined) updateData.almacen = usuarioData.almacen;
      if (usuarioData.nombre_completo !== undefined) {
        updateData.name = usuarioData.nombre_completo;
        updateData.nombre_completo = usuarioData.nombre_completo;
      }
      if (usuarioData.nombre_usuario !== undefined) updateData.nombre_usuario = usuarioData.nombre_usuario;
      if (usuarioData.correo !== undefined) updateData.email = usuarioData.correo;
      if (usuarioData.monto_autorizacion !== undefined) updateData.monto_autorizacion = usuarioData.monto_autorizacion;
      if (usuarioData.puesto !== undefined) {
        updateData.puesto = usuarioData.puesto;
        // Map puesto to role for compatibility
        updateData.role = usuarioData.puesto === 'Admin' ? 'Admin' : usuarioData.puesto === 'Vendedor' ? 'Empleado' : 'Empleado';
      }
      if (usuarioData.rfc !== undefined) updateData.rfc = usuarioData.rfc;
      if (usuarioData.curp !== undefined) updateData.curp = usuarioData.curp;
      if (usuarioData.telefono !== undefined) updateData.telefono = usuarioData.telefono;
      if (usuarioData.estatus !== undefined) updateData.estatus = usuarioData.estatus;
      if (usuarioData.permisos !== undefined) updateData.permisos = usuarioData.permisos;
      
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
        almacen: data.almacen || '',
        name: data.name,
        nombre_completo: data.nombre_completo || data.name,
        nombre_usuario: data.nombre_usuario || '',
        email: data.email,
        correo: data.email,
        monto_autorizacion: Number(data.monto_autorizacion) || 0,
        role: data.role,
        puesto: data.puesto || data.role,
        rfc: data.rfc || '',
        curp: data.curp || '',
        telefono: data.telefono || '',
        estatus: data.estatus !== false,
        permisos: data.permisos || {},
        fecha_registro: data.fecha_registro || data.created_at,
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