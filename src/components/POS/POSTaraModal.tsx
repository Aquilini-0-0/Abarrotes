import React, { useState } from 'react';
import { X, Package } from 'lucide-react';
import { POSProduct, TaraOption } from '../../types/pos';

interface POSTaraModalProps {
  product: POSProduct;
  quantity: number;
  priceLevel: 1 | 2 | 3 | 4 | 5;
  onClose: () => void;
  onConfirm: (product: POSProduct, quantity: number, priceLevel: 1 | 2 | 3 | 4 | 5) => void;
}

export function POSTaraModal({ product, quantity, priceLevel, onClose, onConfirm }: POSTaraModalProps) {
  const [selectedTara, setSelectedTara] = useState<TaraOption | null>(null);
  const [finalQuantity, setFinalQuantity] = useState(quantity);

  const taraOptions: TaraOption[] = [
    { id: '1', name: 'PIEZA', factor: 1, price_adjustment: 0 },
    { id: '2', name: 'CAJA (12 piezas)', factor: 12, price_adjustment: -0.50 },
    { id: '3', name: 'BULTO (24 piezas)', factor: 24, price_adjustment: -1.00 },
    { id: '4', name: 'COSTAL (50 piezas)', factor: 50, price_adjustment: -2.00 }
  ];

  const handleConfirm = () => {
    if (!selectedTara) {
      alert('Selecciona una presentación');
      return;
    }

    const adjustedProduct = {
      ...product,
      prices: {
        ...product.prices,
        [`price${priceLevel}`]: product.prices[`price${priceLevel}`] + (selectedTara.price_adjustment || 0)
      }
    };

    const totalQuantity = finalQuantity * selectedTara.factor;
    onConfirm(adjustedProduct, totalQuantity, priceLevel);
  };

  const currentPrice = product.prices[`price${priceLevel}`];
  const adjustedPrice = selectedTara ? currentPrice + (selectedTara.price_adjustment || 0) : currentPrice;
  const totalUnits = selectedTara ? finalQuantity * selectedTara.factor : finalQuantity;
  const totalAmount = finalQuantity * adjustedPrice;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 rounded-t-xl flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Package className="text-orange-500" size={20} />
            <h2 className="text-gray-800 font-bold text-lg">Seleccionar Presentación</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Product Info */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <div className="text-gray-800 font-semibold mb-1">{product.name}</div>
            <div className="text-gray-500 text-sm">Código: {product.code}</div>
            <div className="text-gray-500 text-sm">Stock disponible: {product.stock} unidades</div>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <label className="block text-gray-600 text-sm mb-1">Cantidad</label>
            <input
              type="number"
              value={finalQuantity}
              onChange={(e) => setFinalQuantity(parseInt(e.target.value) || 1)}
              className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded-lg text-center font-bold"
              min="1"
            />
          </div>

          {/* Tara Options */}
          <div className="mb-6">
            <label className="block text-gray-600 text-sm mb-2">Presentación</label>
            <div className="space-y-2">
              {taraOptions.map(tara => {
                const taraPrice = currentPrice + (tara.price_adjustment || 0);
                const isSelected = selectedTara?.id === tara.id;

                return (
                  <button
                    key={tara.id}
                    onClick={() => setSelectedTara(tara)}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-300 bg-white hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{tara.name}</div>
                        <div className="text-xs text-gray-500">
                          Factor: {tara.factor} {tara.factor > 1 ? 'unidades' : 'unidad'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-gray-800">
                          ${taraPrice.toFixed(2)}
                        </div>
                        {tara.price_adjustment !== 0 && (
                          <div
                            className={`text-xs ${
                              tara.price_adjustment > 0 ? 'text-red-500' : 'text-green-600'
                            }`}
                          >
                            {tara.price_adjustment > 0 ? '+' : ''}
                            ${tara.price_adjustment.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          {selectedTara && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <h4 className="text-gray-800 font-semibold mb-3">Resumen</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Cantidad seleccionada:</span>
                  <span className="text-gray-800 font-medium">
                    {finalQuantity} {selectedTara.name.toLowerCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Unidades totales:</span>
                  <span className="text-gray-800 font-medium">{totalUnits} unidades</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Precio unitario:</span>
                  <span className="text-green-600 font-mono font-bold">${adjustedPrice.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between">
                    <span className="text-orange-600 font-bold">Total:</span>
                    <span className="text-orange-600 font-bold font-mono">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pb-2">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedTara}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold"
            >
              Agregar al Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
