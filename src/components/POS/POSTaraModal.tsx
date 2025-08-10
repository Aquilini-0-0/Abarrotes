import React, { useState } from 'react';
import { X, Package, Scale, Calculator } from 'lucide-react';
import { POSProduct } from '../../types/pos';

interface TaraOption {
  id: string;
  name: string;
  weight: number; // Peso en KG
}

interface POSTaraModalProps {
  product: POSProduct;
  quantity: number;
  priceLevel: 1 | 2 | 3 | 4 | 5;
  onClose: () => void;
  onConfirm: (product: POSProduct, quantity: number, priceLevel: 1 | 2 | 3 | 4 | 5, finalWeight: number) => void;
}

export function POSTaraModal({ product, quantity, priceLevel, onClose, onConfirm }: POSTaraModalProps) {
  const [selectedTara, setSelectedTara] = useState<TaraOption | null>(null);
  const [pesoBruto, setPesoBruto] = useState(0);
  const [cantidadCajas, setCantidadCajas] = useState(1);

  const taraOptions: TaraOption[] = [
    { id: '1', name: 'SIN TARA', weight: 0.0 },
    { id: '2', name: 'MADERA', weight: 2.5 },
    { id: '3', name: 'PLÁSTICO GRANDE', weight: 2.0 },
    { id: '4', name: 'PLÁSTICO CHICO', weight: 1.5 },
    { id: '5', name: 'PLÁSTICO CHICO', weight: 1.6 }
  ];

  const pesoTaraTotal = selectedTara ? selectedTara.weight * cantidadCajas : 0;
  const pesoNeto = pesoBruto - pesoTaraTotal;
  const precioKilo = product.prices[`price${priceLevel}`];
  const precioFinal = pesoNeto * precioKilo;

  const handleConfirm = () => {
    if (!selectedTara) {
      alert('Selecciona un tipo de tara');
      return;
    }

    if (pesoBruto <= 0) {
      alert('El peso bruto debe ser mayor a 0');
      return;
    }

    if (pesoNeto <= 0) {
      alert('El peso neto no puede ser negativo. Verifica el peso bruto y la tara.');
      return;
    }

    // Validación de stock
    if (pesoNeto > product.stock) {
      alert(`Stock insuficiente. Disponible: ${product.stock} kg, Solicitado: ${pesoNeto.toFixed(2)} kg`);
      return;
    }

    onConfirm(product, quantity, priceLevel, pesoNeto);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 rounded-t-xl flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Scale className="text-orange-500" size={24} />
            <h2 className="text-gray-800 font-bold text-xl">Configuración de Tara</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Product Info */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-6 border border-orange-200">
            <div className="text-gray-800 font-semibold mb-2 text-lg">{product.name}</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Código:</span>
                <span className="ml-2 font-mono">{product.code}</span>
              </div>
              <div>
                <span className="text-gray-600">Stock disponible:</span>
                <span className="ml-2 font-bold text-green-600">{product.stock} kg</span>
              </div>
              <div>
                <span className="text-gray-600">Precio por kilo:</span>
                <span className="ml-2 font-bold text-blue-600">${precioKilo.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Nivel de precio:</span>
                <span className="ml-2 font-bold text-orange-600">P{priceLevel}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Tara Selection */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">Selección de Tara</h3>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-gray-700 font-semibold">Nombre de Tara</th>
                      <th className="text-right p-3 text-gray-700 font-semibold">Peso Tara (KG)</th>
                      <th className="text-center p-3 text-gray-700 font-semibold">Seleccionar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taraOptions.map(tara => (
                      <tr
                        key={tara.id}
                        className={`border-b border-gray-200 cursor-pointer transition-colors ${
                          selectedTara?.id === tara.id
                            ? 'bg-orange-50 border-orange-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedTara(tara)}
                      >
                        <td className="p-3 font-medium text-gray-900">{tara.name}</td>
                        <td className="p-3 text-right font-mono text-gray-700">{tara.weight.toFixed(1)}</td>
                        <td className="p-3 text-center">
                          <input
                            type="radio"
                            name="tara"
                            checked={selectedTara?.id === tara.id}
                            onChange={() => setSelectedTara(tara)}
                            className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column - Weight Input */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">Configuración de Peso</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso Bruto (KG) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pesoBruto}
                    onChange={(e) => setPesoBruto(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-mono text-center"
                    placeholder="0.00"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad de Cajas
                  </label>
                  <input
                    type="number"
                    value={cantidadCajas}
                    onChange={(e) => setCantidadCajas(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-mono text-center"
                    min="1"
                  />
                </div>

                {/* Real-time Calculations */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calculator className="w-4 h-4 mr-2 text-blue-600" />
                    Cálculos Automáticos
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peso Bruto:</span>
                      <span className="font-mono font-bold text-gray-900">{pesoBruto.toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peso Tara Total:</span>
                      <span className="font-mono font-bold text-red-600">-{pesoTaraTotal.toFixed(2)} kg</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Peso Neto:</span>
                      <span className={`font-mono font-bold text-lg ${
                        pesoNeto > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {pesoNeto.toFixed(2)} kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Precio por kilo:</span>
                      <span className="font-mono font-bold text-blue-600">${precioKilo.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 flex justify-between">
                      <span className="font-bold text-gray-900 text-lg">Precio Final:</span>
                      <span className="font-mono font-bold text-orange-600 text-xl">
                        ${precioFinal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Validation Messages */}
                {pesoNeto <= 0 && pesoBruto > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <X className="w-4 h-4 text-red-600 mr-2" />
                      <span className="text-red-800 font-medium text-sm">
                        El peso neto no puede ser negativo. Verifica el peso bruto y la tara.
                      </span>
                    </div>
                  </div>
                )}

                {pesoNeto > product.stock && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 text-yellow-600 mr-2" />
                      <span className="text-yellow-800 font-medium text-sm">
                        Stock insuficiente. Disponible: {product.stock} kg
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
              disabled={!selectedTara || pesoBruto <= 0 || pesoNeto <= 0 || pesoNeto > product.stock}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold"
            >
              Agregar al Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}