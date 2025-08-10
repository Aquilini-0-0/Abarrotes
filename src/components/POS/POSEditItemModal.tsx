// POSPage.tsx
import React, { useMemo, useState } from 'react';
import {
  Edit,
  Package,
  DollarSign,
  TrendingUp,
  Info,
  Scale,
  X,
  AlertTriangle,
  Calculator,
  Lock
} from 'lucide-react';

/* ----------------------
   Tipos (ajusta a tu proyecto)
   ---------------------- */
export type POSProduct = {
  id: string;
  code?: string;
  name: string;
  line?: string;
  unit?: string;
  stock: number; // unidades o kg dependiendo del unit
  prices: {
    price1: number;
    price2: number;
    price3: number;
    price4: number;
    price5: number;
  };
};

export type POSOrderItem = {
  id: string;
  product_id: string;
  quantity: number; // puede ser kg si el producto es por peso
  unit_price: number;
  price_level: 1 | 2 | 3 | 4 | 5;
  total: number;
  tara_option?: { id: string; name: string; weight: number };
};

/* ----------------------
   Componente padre: POSPage
   ---------------------- */
export default function POSPage() {
  // productos de ejemplo
  const [products, setProducts] = useState<POSProduct[]>(() => [
    {
      id: 'p1',
      code: '0001',
      name: 'Tomate Bola',
      line: 'Verduras',
      unit: 'kg',
      stock: 50,
      prices: { price1: 20.0, price2: 18.0, price3: 16.0, price4: 15.0, price5: 12.0 }
    },
    {
      id: 'p2',
      code: '0002',
      name: 'Lechuga',
      line: 'Verduras',
      unit: 'pieza',
      stock: 30,
      prices: { price1: 10.0, price2: 9.0, price3: 8.0, price4: 7.5, price5: 6.0 }
    }
  ]);

  // items del pedido (ejemplo)
  const [orderItems, setOrderItems] = useState<POSOrderItem[]>(() => [
    {
      id: 'i1',
      product_id: 'p1',
      quantity: 2,
      unit_price: 20.0,
      price_level: 1,
      total: 40.0
    },
    {
      id: 'i2',
      product_id: 'p2',
      quantity: 1,
      unit_price: 10.0,
      price_level: 1,
      total: 10.0
    }
  ]);

  // modal state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const editingItem = useMemo(
    () => orderItems.find((it) => it.id === editingItemId) ?? null,
    [orderItems, editingItemId]
  );

  const editingProduct = useMemo(
    () => (editingItem ? products.find((p) => p.id === editingItem.product_id) ?? null : null),
    [products, editingItem]
  );

  // Actualiza un item en orderItems (aquí es clave)
  const handleUpdateItem = (updatedItem: POSOrderItem) => {
    setOrderItems((prev) =>
      prev.map((it) => (it.id === updatedItem.id ? { ...it, ...updatedItem } : it))
    );
    // Opcional: si quieres actualizar stock en products (ejemplo, reducir stock)
    // no lo hago automáticamente para no asumir reglas de negocio; si lo quieres, puedo agregarlo.
  };

  // Borra item (opcional)
  const handleRemoveItem = (id: string) => {
    setOrderItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Abre modal
  const openEditModal = (id: string) => setEditingItemId(id);
  const closeModal = () => setEditingItemId(null);

  // Cálculo total del pedido
  const totalOrder = orderItems.reduce((s, it) => s + (it.total ?? it.quantity * it.unit_price), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 flex items-center">
        <Package className="mr-2" /> Punto de Venta — Pedido
      </h1>

      <div className="bg-white shadow rounded-lg mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Producto</th>
              <th className="p-3 text-right">Cantidad</th>
              <th className="p-3 text-right">Precio unitario</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map((it) => {
              const prod = products.find((p) => p.id === it.product_id);
              return (
                <tr key={it.id} className="border-b">
                  <td className="p-3">
                    <div className="font-medium">{prod?.name ?? '—'}</div>
                    <div className="text-xs text-gray-500">{prod?.code ?? ''} {prod ? `· ${prod.line}` : ''}</div>
                  </td>
                  <td className="p-3 text-right">{it.quantity}</td>

                  {/* IMPORTANTE: aquí uso item.unit_price (no product.prices) */}
                  <td className="p-3 text-right font-mono">${it.unit_price.toFixed(2)}</td>

                  {/* total debe venir del item.total para que refleje cambios */}
                  <td className="p-3 text-right font-bold text-orange-600">${(it.total ?? (it.quantity * it.unit_price)).toFixed(2)}</td>

                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => openEditModal(it.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 mr-1" /> Editar
                      </button>
                      <button
                        onClick={() => handleRemoveItem(it.id)}
                        className="px-3 py-1 bg-gray-200 rounded text-sm"
                        title="Eliminar"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {orderItems.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">No hay productos en el pedido.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">Total del pedido</div>
          <div className="text-2xl font-bold text-orange-600">${totalOrder.toFixed(2)}</div>
        </div>
      </div>

      {/* Modal */}
      {editingItem && editingProduct && (
        <POSEditItemModal
          key={editingItem.id}
          item={editingItem}
          product={editingProduct}
          onClose={closeModal}
          onSave={(updated) => {
            // Aseguramos que updatedItem tenga total y unit_price correctos
            const updatedWithTotal: POSOrderItem = {
              ...updated,
              total: updated.total ?? updated.quantity * updated.unit_price
            };
            handleUpdateItem(updatedWithTotal);
            closeModal();
          }}
        />
      )}
    </div>
  );
}

/* ----------------------
   POSEditItemModal (adaptada)
   ---------------------- */
type TaraOptionLocal = {
  id: string;
  name: string;
  weight: number; // KG
};

interface POSEditItemModalProps {
  item: POSOrderItem;
  product: POSProduct;
  onClose: () => void;
  onSave: (updatedItem: POSOrderItem) => void;
}

export function POSEditItemModal({ item, product, onClose, onSave }: POSEditItemModalProps) {
  // --- States (original / new)
  const [quantity, setQuantity] = useState<number>(item.quantity);
  const [priceLevel, setPriceLevel] = useState<1 | 2 | 3 | 4 | 5>(item.price_level);
  const [customPrice, setCustomPrice] = useState<number>(item.unit_price);
  const [useCustomPrice, setUseCustomPrice] = useState<boolean>(false);

  // We'll use a local tara type so we are 100% compatible even if your global type doesn't include weight.
  const [selectedTara, setSelectedTara] = useState<TaraOptionLocal | null>(item.tara_option ? {
    id: item.tara_option.id,
    name: item.tara_option.name,
    weight: item.tara_option.weight
  } : null);

  // Peso flow states
  const [pesoBruto, setPesoBruto] = useState<number>(0); // KG
  const [cantidadCajas, setCantidadCajas] = useState<number>(1);

  // Password modal for authorization when price < cost
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');

  // --- Tara options (las que indicaste)
  const taraOptions: TaraOptionLocal[] = [
    { id: '1', name: 'SIN TARA', weight: 0.0 },
    { id: '2', name: 'MADERA', weight: 2.5 },
    { id: '3', name: 'PLÁSTICO GRANDE', weight: 2.0 },
    { id: '4', name: 'PLÁSTICO CHICO', weight: 1.5 },
    { id: '5', name: 'PLÁSTICO CHICO', weight: 1.6 }
  ];

  // --- Derived values
  const currentPrice = useCustomPrice ? customPrice : product.prices[`price${priceLevel}` as keyof typeof product.prices];

  // peso flow calculations
  const pesoTaraTotal = selectedTara ? selectedTara.weight * cantidadCajas : 0;
  const pesoNeto = Math.max(pesoBruto - pesoTaraTotal, 0); // kg
  const precioFinal = pesoNeto * currentPrice; // total when using peso flow

  // product cost estimation (same heuristics you had)
  const productCost = product.prices?.price1 ? product.prices.price1 * 0.7 : 0;

  // Decide which flow is active: if user provided a pesoBruto > 0, we use peso flow
  const usingWeightFlow = pesoBruto > 0;

  // totals depending on flow
  const totalAmount = usingWeightFlow ? precioFinal : (quantity * currentPrice);

  // original values for comparison
  const originalTotal = (item.quantity ?? 0) * (item.unit_price ?? 0);
  const quantityChange = (usingWeightFlow ? pesoNeto : quantity) - (item.quantity ?? 0);
  const priceChange = currentPrice - (item.unit_price ?? 0);
  const totalChange = totalAmount - originalTotal;

  // --- Helpers
  const validateAdminPassword = (password: string) => password === 'admin123';

  // Save flow (unificado)
  const handleSave = () => {
    // validations depending on flow
    if (usingWeightFlow) {
      if (!selectedTara) {
        alert('Selecciona una tara.');
        return;
      }
      if (pesoNeto <= 0) {
        alert('El peso neto debe ser mayor a 0.');
        return;
      }
      if (pesoNeto > product.stock) {
        alert(`Stock insuficiente. Disponible: ${product.stock} kg`);
        return;
      }
    } else {
      if (quantity <= 0) {
        alert('La cantidad debe ser mayor a 0.');
        return;
      }
      if (quantity > product.stock) {
        alert(`Stock insuficiente. Disponible: ${product.stock} unidades`);
        return;
      }
    }

    // price below cost authorization
    if (useCustomPrice && customPrice < productCost) {
      setShowPasswordModal(true);
      return;
    }

    processSave();
  };

  const processSave = () => {
    const finalQuantity = usingWeightFlow ? pesoNeto : quantity;
    const finalUnitPrice = currentPrice;
    const finalTotal = totalAmount;

    // Build updated item — adapt to your POSOrderItem shape (we keep fields you already use)
    const updatedItem: POSOrderItem = {
      ...item,
      quantity: finalQuantity,
      price_level: priceLevel,
      unit_price: finalUnitPrice,
      total: finalTotal,
      tara_option: selectedTara ? { id: selectedTara.id, name: selectedTara.name, weight: selectedTara.weight } : undefined
    };

    onSave(updatedItem);
    // Nota: el cierre del modal lo controla el padre en este ejemplo.
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

  // compute button enabled state (legible)
  const canSave = usingWeightFlow
    ? selectedTara !== null && pesoNeto > 0 && pesoNeto <= product.stock
    : quantity > 0 && quantity <= product.stock;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 rounded-t-xl flex items-center justify-between sticky top-0 z-10 p-4">
          <div className="flex items-center space-x-2">
            <Edit className="text-white" size={24} />
            <h2 className="text-white font-bold text-lg">Editar Producto</h2>
          </div>
          <button onClick={onClose} className="text-blue-100 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Package className="h-6 w-6 text-blue-600" />
              <div>
                <div className="text-gray-800 font-semibold text-lg">{product.name}</div>
                <div className="text-gray-500 text-sm">Código: {product.code} | Línea: {product.line}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm mt-2">
              <div className="text-center">
                <div className="text-gray-600">Stock Disponible</div>
                <div className={`font-bold text-lg ${product.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                  {product.stock}
                </div>
                <div className="text-xs text-gray-500">{product.unit}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Precio Actual</div>
                {/* IMPORTANTE: mostramos el precio que viene en el item original para contexto */}
                <div className="font-bold text-lg text-blue-600">${item.unit_price.toFixed(2)}</div>
                <div className="text-xs text-gray-500">Nivel {item.price_level}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Cantidad Actual</div>
                <div className="font-bold text-lg text-purple-600">{item.quantity}</div>
                <div className="text-xs text-gray-500">unidades</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column: controls + tara table */}
            <div className="space-y-6">
              {/* Quantity (legacy) */}
              <div>
                <label className="block text-gray-700 font-medium mb-2 flex items-center">
                  <Package className="h-4 w-4 mr-2 text-blue-600" />
                  Cantidad
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="1"
                />
                {quantity > product.stock && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Cantidad excede el stock disponible ({product.stock} unidades)
                    </p>
                  </div>
                )}
              </div>

              {/* Tara Selection - tabla */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center">
                  <Scale className="w-5 h-5 mr-2 text-orange-500" /> Selección de Tara
                </h3>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-gray-700 font-semibold">Nombre de Tara</th>
                        <th className="text-right p-3 text-gray-700 font-semibold">Peso (KG)</th>
                        <th className="text-center p-3 text-gray-700 font-semibold">Seleccionar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taraOptions.map((tara) => (
                        <tr
                          key={tara.id}
                          className={`border-b border-gray-200 cursor-pointer ${selectedTara?.id === tara.id ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                          onClick={() => setSelectedTara(tara)}
                        >
                          <td className="p-3 font-medium text-gray-900">{tara.name}</td>
                          <td className="p-3 text-right font-mono text-gray-700">{tara.weight.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <input
                              type="radio"
                              name="tara"
                              checked={selectedTara?.id === tara.id}
                              onChange={() => setSelectedTara(tara)}
                              className="w-4 h-4 text-orange-600"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Peso bruto / cantidad de taras */}
                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso Bruto (KG)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pesoBruto}
                      onChange={(e) => setPesoBruto(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center font-bold"
                      placeholder="0.00"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de Taras</label>
                    <input
                      type="number"
                      value={cantidadCajas}
                      onChange={(e) => setCantidadCajas(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center font-bold"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Price selection */}
              <div>
                <label className="block text-gray-700 font-medium mb-2 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                  Nivel de Precio
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <label key={level} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="priceLevel"
                        value={level}
                        checked={priceLevel === level && !useCustomPrice}
                        onChange={() => {
                          setPriceLevel(level as 1 | 2 | 3 | 4 | 5);
                          setUseCustomPrice(false);
                          setCustomPrice(product.prices[`price${level}` as keyof typeof product.prices]);
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Precio {level}</div>
                        <div className="text-sm text-gray-600">${product.prices[`price${level}` as keyof typeof product.prices].toFixed(2)}</div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${level === 1 ? 'bg-blue-100 text-blue-800' : level === 2 ? 'bg-green-100 text-green-800' : level === 3 ? 'bg-yellow-100 text-yellow-800' : level === 4 ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'}`}>
                        {level === 1 ? 'General' : level === 2 ? 'Mayoreo' : level === 3 ? 'Distribuidor' : level === 4 ? 'VIP' : 'Especial'}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom price */}
              <div>
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="useCustomPrice"
                    checked={useCustomPrice}
                    onChange={(e) => {
                      setUseCustomPrice(e.target.checked);
                      if (!e.target.checked) {
                        setCustomPrice(product.prices[`price${priceLevel}` as keyof typeof product.prices]);
                      } else {
                        // si activan precio libre y customPrice está vacío, init con item.unit_price
                        if (!customPrice) setCustomPrice(item.unit_price);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                  />
                  <label htmlFor="useCustomPrice" className="text-gray-700 font-medium flex items-center">
                    <Calculator className="h-4 w-4 mr-2 text-orange-600" />
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
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center text-red-600 text-sm">
                      <Lock className="w-4 h-4 mr-2" />
                      <span className="font-medium">Precio menor al costo. Requiere autorización de administrador.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right column: comparison + summary */}
            <div className="space-y-6">
              {/* Comparison */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-semibold flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-600" /> Comparación de Cambios
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cantidad / Peso neto:</span>
                    <span className="font-bold">{usingWeightFlow ? `${pesoNeto.toFixed(2)} kg` : `${quantity}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio Unitario:</span>
                    <span className="font-bold">${currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-orange-600">${totalAmount.toFixed(2)}</span>
                  </div>
                  {totalChange !== 0 && (
                    <div className={`p-2 rounded-lg text-sm font-medium ${totalChange > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {totalChange > 0 ? 'Incremento' : 'Reducción'} de ${Math.abs(totalChange).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-orange-600" /> Resumen Final
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{usingWeightFlow ? 'Peso Neto:' : 'Cantidad:'}</span>
                    <span className="font-bold text-gray-900">{usingWeightFlow ? `${pesoNeto.toFixed(2)} kg` : `${quantity}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precio unitario:</span>
                    <span className="font-mono font-bold text-blue-600 text-lg">${currentPrice.toFixed(2)}</span>
                  </div>
                  {selectedTara && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tara:</span>
                      <span className="font-medium text-gray-900">{selectedTara.name} ({selectedTara.weight} kg)</span>
                    </div>
                  )}
                  <div className="border-t border-orange-300 pt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-900 text-lg">Total:</span>
                    <span className="font-mono font-bold text-orange-600 text-2xl">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {usingWeightFlow && pesoNeto <= 0 && pesoBruto > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <X className="w-4 h-4 text-red-600 mr-2" />
                    <span className="text-red-800 font-medium text-sm">El peso neto no puede ser negativo. Verifica peso bruto y tara.</span>
                  </div>
                </div>
              )}

              {usingWeightFlow && pesoNeto > product.stock && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 text-yellow-600 mr-2" />
                    <span className="text-yellow-800 font-medium text-sm">Stock insuficiente. Disponible: {product.stock} kg</span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button onClick={onClose} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || (useCustomPrice && customPrice < 0)}
              className={`px-6 py-3 rounded-lg font-bold transition-colors shadow-lg text-white ${canSave ? 'bg-gradient-to-br from-orange-400 via-red-500 to-red-600 hover:opacity-95' : 'bg-gray-300 cursor-not-allowed'}`}
            >
              Guardar Cambios
            </button>
          </div>
        </div>

        {/* Password modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="bg-red-600 p-4 border-b border-red-700 rounded-t-lg flex justify-between items-center">
                <h3 className="text-white font-bold">Autorización Requerida</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-red-100 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Precio Menor al Costo</h4>
                  <p className="text-gray-600 text-sm">
                    El precio ingresado (${customPrice.toFixed(2)}) es menor al costo estimado (${productCost.toFixed(2)}).
                    Se requiere autorización de administrador.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña de Administrador</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Ingrese contraseña..."
                    onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                    autoFocus
                  />
                </div>
                <div className="flex space-x-3">
                  <button onClick={handlePasswordSubmit} disabled={!adminPassword.trim()} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">Autorizar</button>
                  <button onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
