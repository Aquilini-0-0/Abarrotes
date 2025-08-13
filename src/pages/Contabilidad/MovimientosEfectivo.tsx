import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { supabase } from '../../lib/supabase';
import { useAutoSync } from '../../hooks/useAutoSync';
import { Plus, DollarSign, TrendingUp, TrendingDown, Calculator, Building2 } from 'lucide-react';

interface MovimientoEfectivo {
  id: string;
  fecha: string;
  tipo: 'caja_mayor' | 'deposito_bancario' | 'gasto' | 'pago_proveedor' | 'prestamo' | 'traspaso_caja' | 'otros';
  monto: number;
  cargo: string;
  numero_caja: string;
  descripcion: string;
  usuario: string;
  created_at: string;
}

export function MovimientosEfectivo() {
  const [movimientos, setMovimientos] = useState<MovimientoEfectivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovimientos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cash_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMovimientos: MovimientoEfectivo[] = data.map(item => ({
        id: item.id,
        fecha: item.fecha,
        tipo: item.tipo,
        monto: item.monto,
        cargo: item.cargo,
        numero_caja: item.numero_caja,
        descripcion: item.descripcion,
        usuario: item.usuario,
        created_at: item.created_at
      }));

      setMovimientos(formattedMovimientos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching cash movements');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-sync for real-time updates
  useAutoSync({
    onDataUpdate: fetchMovimientos,
    interval: 5000, // Update every 5 seconds
    tables: [{ name: 'cash_movements', timestampColumn: 'created_at' }]
  });

  useEffect(() => {
    fetchMovimientos();
  }, [fetchMovimientos]);

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'caja_mayor': return 'Caja Mayor';
      case 'deposito_bancario': return 'Depósito Bancario';
      case 'gasto': return 'Gasto';
      case 'pago_proveedor': return 'Pago Proveedor';
      case 'prestamo': return 'Préstamo';
      case 'traspaso_caja': return 'Traspaso Caja';
      case 'otros': return 'Otros';
      default: return tipo;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'caja_mayor': return 'bg-blue-100 text-blue-800';
      case 'deposito_bancario': return 'bg-green-100 text-green-800';
      case 'gasto': return 'bg-red-100 text-red-800';
      case 'pago_proveedor': return 'bg-orange-100 text-orange-800';
      case 'prestamo': return 'bg-purple-100 text-purple-800';
      case 'traspaso_caja': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    { 
      key: 'fecha', 
      label: 'Fecha', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(value)}`}>
          {getTipoLabel(value)}
        </span>
      )
    },
    { 
      key: 'monto', 
      label: 'Monto', 
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-green-600">
          ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { key: 'cargo', label: 'Cargo', sortable: true },
    { key: 'numero_caja', label: 'Caja', sortable: true },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'usuario', label: 'Usuario', sortable: true },
    { 
      key: 'created_at', 
      label: 'Hora', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  ];

  const totalMovimientos = movimientos.reduce((sum, m) => sum + m.monto, 0);
  const gastos = movimientos.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.monto, 0);
  const depositos = movimientos.filter(m => m.tipo === 'deposito_bancario').reduce((sum, m) => sum + m.monto, 0);
  const traspasos = movimientos.filter(m => m.tipo === 'traspaso_caja').reduce((sum, m) => sum + m.monto, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => fetchMovimientos()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Movimientos de Efectivo</h1>
        <div className="text-sm text-gray-500">
          Actualización automática cada 5 segundos
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Movimientos">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Calculator className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                ${totalMovimientos.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </Card>

        <Card title="Gastos">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                ${gastos.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Egresos</div>
            </div>
          </div>
        </Card>

        <Card title="Depósitos">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${depositos.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Ingresos</div>
            </div>
          </div>
        </Card>

        <Card title="Traspasos">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <Building2 className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                ${traspasos.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Entre cajas</div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Historial de Movimientos de Efectivo">
        <DataTable
          data={movimientos}
          columns={columns}
          title="Movimientos de Efectivo"
        />
      </Card>
    </div>
  );
}