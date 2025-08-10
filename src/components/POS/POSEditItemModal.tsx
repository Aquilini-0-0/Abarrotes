import React, { useState } from 'react';
import { X, Edit, Lock, AlertTriangle } from 'lucide-react';
import { POSProduct, POSOrderItem, TaraOption } from '../../types/pos';

interface POSEditItemModalProps {
  item: POSOrderItem;
  product: POSProduct;
  onClose: () => void;
  onSave: (updatedItem: POSOrderItem) => void;
}

export function POSEditItemModal({ item, product, onClose, onSave }: POSEditItemModalProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [priceLevel, setPriceLevel] = useState<1 | 2 | 3 | 4 | 5>(item.price_level);
  const [customPrice, setCustomPrice] = useState(item.unit_price);
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [selectedTara, setSelectedTara] = useState<TaraOption | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const taraOptions: TaraOption[] = [
    { id: '1', name: 'SIN TARA', factor: 1, price_adjustment: 0 },
    { id: '2', name: 'CAJA (12 piezas)', factor: 12, price_adjustment: -0.50 },
    { id: '3', name: 'BULTO (24 piezas)', factor: 24, price_adjustment: -1.00 },
    { id: '4', name: 'COSTAL (50 piezas)', factor: 50, price_adjustment: -2.00 }
  ];

  const currentPrice = useCustomPrice ? customPrice : product.prices[`price${priceLevel}`];
  const totalAmount = quantity * currentPrice;
  const productCost = product.stock > 0 ? (product.prices.price1 * 0.7) : 0; // Estimado del costo

  const validateAdminPassword = (password: string) => {
    return password === 'admin123'; // En producción, validar contra la base de datos
  };

  const handleSave = () => {
    // Validación de stock
    if (quantity > product.stock) {
      alert(`Stock insuficiente. Disponible: ${product.stock} unidades`);
      return;
    }

    // Validación de precio menor al costo
    if (useCustomPrice && customPrice < productCost) {
      setShowPasswordModal(true);
      return;
    }

    processSave();
  };

  const processSave = () => {
    const updatedItem: POSOrderItem = {
      ...item,
      quantity,
      price_level: priceLevel,
      unit_price: currentPrice,
      total: totalAmount,
      tara_option: selectedTara || undefined
    };

    onSave(updatedItem);
    onClose();
  };

  const handlePasswordSubmit = () => {
    if (!validateAdminPassword(adminPassword)) {
      alert('Contraseña de administrador incorrecta');
      setAdminPassword('');
      return;
    }

    setShowPasswordModal(false);
    setAdminPassword('');
    processSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 rounded-t-xl flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Edit className="text-blue-500" size={20} />
            <h2 className="text-gray-800 font-bold text-lg">Editar Cantidad/Precio</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Product Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-gray-800 font-semibold mb-1">{product.name}</div>
            <div className="text-gray-500 text-sm">Código: {product.code}</div>
            <div className="text-gray-500 text-sm">Stock disponible: {product.stock} unidades</div>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Cantidad</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max={product.stock}
            />
            {quantity > product.stock && (
              <p className="text-red-600 text-sm mt-1">
                ⚠️ Cantidad excede el stock disponible ({product.stock} unidades)
              </p>
            )}
          </div>

          {/* Tara Selection */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Selección de Tara</label>
            <select
              value={selectedTara?.id || ''}
              onChange={(e) => {
                const tara = taraOptions.find(t => t.id === e.target.value);
                setSelectedTara(tara || null);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin tara especial</option>
              {taraOptions.map(tara => (
                <option key={tara.id} value={tara.id}>
                  {tara.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Selection */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Nivel de Precio</label>
            <select
              value={priceLevel}
              onChange={(e) => {
                setPriceLevel(parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5);
                setUseCustomPrice(false);
              }}
              disabled={useCustomPrice}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value={1}>Precio 1 - ${product.prices.price1.toFixed(2)}</option>
              <option value={2}>Precio 2 - ${product.prices.price2.toFixed(2)}</option>
              <option value={3}>Precio 3 - ${product.prices.price3.toFixed(2)}</option>
              <option value={4}>Precio 4 - ${product.prices.price4.toFixed(2)}</option>
              <option value={5}>Precio 5 - ${product.prices.price5.toFixed(2)}</option>
            </select>
          </div>

          {/* Custom Price */}
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="useCustomPrice"
                checked={useCustomPrice}
                onChange={(e) => {
                  setUseCustomPrice(e.target.checked);
                  if (!e.target.checked) {
                    setCustomPrice(product.prices[`price${priceLevel}`]);
                  }
                }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
              />
              <label htmlFor="useCustomPrice" className="text-gray-700 font-medium">
                Usar precio libre
              </label>
            </div>
            <input
              type="number"
              step="0.01"
              value={customPrice}
              onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
              disabled={!useCustomPrice}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 font-mono text-lg text-center"
              placeholder="0.00"
              min="0"
            />
            {useCustomPrice && customPrice < productCost && (
              <div className="mt-2 flex items-center text-red-600 text-sm">
                <Lock className="w-4 h-4 mr-1" />
                <span>Precio menor al costo. Requiere autorización de administrador.</span>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-3">Resumen</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cantidad:</span>
                <span className="font-bold text-gray-900">{quantity} unidades</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Precio unitario:</span>
                <span className="font-mono font-bold text-blue-600">${currentPrice.toFixed(2)}</span>
              </div>
              {selectedTara && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tara:</span>
                  <span className="font-medium text-gray-900">{selectedTara.name}</span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-2 flex justify-between">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-mono font-bold text-orange-600 text-lg">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={quantity <= 0 || quantity > product.stock}
              className="px-6 py-2 bg-gradient-to-r from-orange-50 to-red-50 border-t border-orange-200  disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold"
            >
              Aceptar
            </button>
          </div>
        </div>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="bg-red-600 p-4 border-b border-red-700 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-5 w-5 text-white" />
                    <h3 className="text-white font-bold">Autorización Requerida</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setAdminPassword('');
                    }}
                    className="text-red-100 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="text-center mb-6">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Precio Menor al Costo
                  </h4>
                  <p className="text-gray-600 text-sm">
                    El precio ingresado (${customPrice.toFixed(2)}) es menor al costo estimado (${productCost.toFixed(2)}).
                    Se requiere autorización de administrador.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña de Administrador
                    </label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Ingrese contraseña..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handlePasswordSubmit();
                        }
                      }}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePasswordSubmit}
                      disabled={!adminPassword.trim()}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Autorizar
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordModal(false);
                        setAdminPassword('');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}