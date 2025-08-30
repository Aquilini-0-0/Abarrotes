import React, { useState, useEffect } from 'react';
import { X, Package, AlertTriangle, Warehouse, Calculator } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { POSProduct } from '../../types/pos';

interface Warehouse {
  id: string;
  nombre: string;
  ubicacion: string;
}

interface WarehouseStock {
  warehouse_id: string;
  warehouse_name: string;
  stock: number;
}

interface POSWarehouseModalProps {
  product: POSProduct;
  quantity: number;
  onClose: () => void;
  onConfirm: (product: POSProduct, quantity: number, warehouseDistribution: { warehouse_id: string; quantity: number }[]) => void;
}

export function POSWarehouseModal({ product, quantity, onClose, onConfirm }: POSWarehouseModalProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStock[]>([]);
  const [distribution, setDistribution] = useState<{ [warehouseId: string]: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouses();
    fetchWarehouseStock();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('almacenes')
        .select('*')
        .in('nombre', ['BODEGA', 'FRIJOL'])
        .eq('activo', true);

      if (error) throw error;
      setWarehouses(data || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  const fetchWarehouseStock = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_almacenes')
        .select(`
          almacen_id,
          stock,
          almacenes!stock_almacenes_almacen_id_fkey(nombre)
        `)
        .eq('product_id', product.id);

      if (error) throw error;

      const formattedStocks: WarehouseStock[] = data.map(item => ({
        warehouse_id: item.almacen_id,
        warehouse_name: item.almacenes?.nombre || 'Almacén',
        stock: item.stock
      }));

      setWarehouseStocks(formattedStocks);
    } catch (err) {
      console.error('Error fetching warehouse stock:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWarehouseStock = (warehouseId: string): number => {
    const stock = warehouseStocks.find(s => s.warehouse_id === warehouseId);
    return stock?.stock || 0;
  };

  const getWarehouseName = (warehouseId: string): string => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse?.nombre || 'Almacén';
  };

  const totalDistributed = Object.values(distribution).reduce((sum, qty) => sum + qty, 0);
  const remainingQuantity = quantity - totalDistributed;

  const handleDistributionChange = (warehouseId: string, qty: number) => {
    const maxForWarehouse = getWarehouseStock(warehouseId);
    const currentDistribution = { ...distribution };
    delete currentDistribution[warehouseId]; // Remove current warehouse from calculation
    const alreadyDistributed = Object.values(currentDistribution).reduce((sum, q) => sum + q, 0);
    const maxAllowed = Math.min(maxForWarehouse, quantity - alreadyDistributed);
    
    setDistribution(prev => ({
      ...prev,
      [warehouseId]: Math.min(Math.max(0, qty), maxAllowed)
    }));
  };

  const handleConfirm = async () => {
    if (totalDistributed !== quantity) {
      alert(`Debe distribuir exactamente ${quantity} unidades. Faltan ${remainingQuantity} unidades.`);
      return;
    }

    // Validate stock availability
    for (const [warehouseId, qty] of Object.entries(distribution)) {
      if (qty > 0) {
        const availableStock = getWarehouseStock(warehouseId);
        if (qty > availableStock) {
          alert(`No hay suficiente stock en ${getWarehouseName(warehouseId)}. Disponible: ${availableStock}, Solicitado: ${qty}`);
          return;
        }
      }
    }

    // Create distribution array
    const warehouseDistribution = Object.entries(distribution)
      .filter(([_, qty]) => qty > 0)
      .map(([warehouseId, qty]) => ({ warehouse_id: warehouseId, quantity: qty }));

    onConfirm(product, quantity, warehouseDistribution);
  };

  const handleAutoDistribute = () => {
    const bodegaWarehouse = warehouses.find(w => w.nombre === 'BODEGA');
    const frijolWarehouse = warehouses.find(w => w.nombre === 'FRIJOL');
    
    if (!bodegaWarehouse || !frijolWarehouse) return;

    const bodegaStock = getWarehouseStock(bodegaWarehouse.id);
    const frijolStock = getWarehouseStock(frijolWarehouse.id);

    let newDistribution: { [key: string]: number } = {};

    if (bodegaStock >= quantity) {
      // BODEGA can fulfill the entire order
      newDistribution[bodegaWarehouse.id] = quantity;
    } else if (frijolStock >= quantity) {
      // FRIJOL can fulfill the entire order
      newDistribution[frijolWarehouse.id] = quantity;
    } else {
      // Need to distribute between both warehouses
      const fromBodega = Math.min(bodegaStock, quantity);
      const fromFrijol = Math.min(frijolStock, quantity - fromBodega);
      
      if (fromBodega > 0) newDistribution[bodegaWarehouse.id] = fromBodega;
      if (fromFrijol > 0) newDistribution[frijolWarehouse.id] = fromFrijol;
    }

    setDistribution(newDistribution);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de almacenes...</p>
        </div>
      </div>
    );
  }

  const bodegaWarehouse = warehouses.find(w => w.nombre === 'BODEGA');
  const frijolWarehouse = warehouses.find(w => w.nombre === 'FRIJOL');
  const bodegaStock = bodegaWarehouse ? getWarehouseStock(bodegaWarehouse.id) : 0;
  const frijolStock = frijolWarehouse ? getWarehouseStock(frijolWarehouse.id) : 0;
  const totalAvailableStock = bodegaStock + frijolStock;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 rounded-t-xl flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Warehouse className="text-blue-500" size={24} />
            <h2 className="text-gray-800 font-bold text-xl">Selección de Almacén</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Product Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
            <div className="text-gray-800 font-semibold mb-2 text-lg">{product.name}</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Código:</span>
                <span className="ml-2 font-mono">{product.code}</span>
              </div>
              <div>
                <span className="text-gray-600">Cantidad del pedido:</span>
                <span className="ml-2 font-bold text-blue-600">{quantity} {product.unit}</span>
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Stock por Almacén</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-green-800">BODEGA</h4>
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">{bodegaStock}</div>
                  <div className="text-sm text-green-700">unidades disponibles</div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-yellow-800">FRIJOL</h4>
                    <Package className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">{frijolStock}</div>
                  <div className="text-sm text-yellow-700">unidades disponibles</div>
                </div>
              </div>

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-medium">Stock Total Disponible:</span>
                  <span className="text-blue-600 font-bold text-lg">{totalAvailableStock} unidades</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Validation */}
          {quantity > totalAvailableStock && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <div className="font-medium text-red-800">Stock Insuficiente</div>
                  <div className="text-red-600 text-sm">
                    Solicitado: {quantity} | Disponible: {totalAvailableStock}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Distribution Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Distribución del Pedido</h3>
              <button
                onClick={handleAutoDistribute}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
              >
                Auto-distribuir
              </button>
            </div>

            {warehouses.map(warehouse => {
              const warehouseStock = getWarehouseStock(warehouse.id);
              const currentDistribution = distribution[warehouse.id] || 0;
              
              return (
                <div key={warehouse.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Warehouse className={`h-5 w-5 ${warehouse.nombre === 'BODEGA' ? 'text-green-600' : 'text-yellow-600'}`} />
                      <span className="font-medium text-gray-900">{warehouse.nombre}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      Stock: {warehouseStock} unidades
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad a restar de {warehouse.nombre}
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={currentDistribution}
                      onChange={(e) => handleDistributionChange(warehouse.id, parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max={Math.min(warehouseStock, quantity)}
                      disabled={warehouseStock === 0}
                      placeholder="0.000"
                    />
                    {warehouseStock === 0 && (
                      <p className="text-red-500 text-xs mt-1">Sin stock en este almacén</p>
                    )}
                    {currentDistribution > warehouseStock && (
                      <p className="text-red-500 text-xs mt-1">
                        Cantidad excede el stock disponible ({warehouseStock})
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-4 mt-6 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              Resumen de Distribución
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-800">Cantidad del pedido:</span>
                <span className="font-bold text-blue-900">{quantity} unidades</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">Total distribuido:</span>
                <span className={`font-bold ${totalDistributed === quantity ? 'text-green-600' : 'text-red-600'}`}>
                  {totalDistributed} unidades
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">Restante por distribuir:</span>
                <span className={`font-bold ${remainingQuantity === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {remainingQuantity} unidades
                </span>
              </div>
            </div>

            {remainingQuantity !== 0 && (
              <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded">
                <p className="text-yellow-800 text-xs">
                  {remainingQuantity > 0 
                    ? `Faltan ${remainingQuantity} unidades por distribuir`
                    : `Exceso de ${Math.abs(remainingQuantity)} unidades distribuidas`
                  }
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={totalDistributed !== quantity || quantity > totalAvailableStock}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors shadow-lg"
            >
              Confirmar Distribución
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}