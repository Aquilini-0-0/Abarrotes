import React, { useState, useEffect, useRef } from 'react';
import { Search, Package } from 'lucide-react';
import { POSProduct } from '../../types/pos';

interface POSProductPanelProps {
  products: POSProduct[];
  searchTerm: string;
  quantity: number;
  selectedPriceLevel: 1 | 2 | 3 | 4 | 5;
  onSearchChange: (term: string) => void;
  onQuantityChange: (quantity: number) => void;
  onPriceLevelChange: (level: 1 | 2 | 3 | 4 | 5) => void;
  onAddProduct: (product: POSProduct) => void;
  onProductSelect: (product: POSProduct) => void;
}

export function POSProductPanel({
  products,
  searchTerm,
  quantity,
  selectedPriceLevel,
  onSearchChange,
  onQuantityChange,
  onPriceLevelChange,
  onAddProduct,
  onProductSelect
}: POSProductPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.line.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredProducts[selectedIndex]) {
        e.preventDefault();
        onAddProduct(filteredProducts[selectedIndex]);
      } else if (e.key === '+') {
        e.preventDefault();
        onQuantityChange(quantity + 1);
      } else if (e.key === '-') {
        e.preventDefault();
        onQuantityChange(Math.max(1, quantity - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredProducts, selectedIndex, quantity, onQuantityChange, onAddProduct]);

  // Auto-scroll to selected item
  useEffect(() => {
    if (tableRef.current) {
      const selectedRow = tableRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  const getPriceForLevel = (product: POSProduct, level: 1 | 2 | 3 | 4 | 5) => {
    return product.prices[`price${level}`];
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-1 sm:p-2 lg:p-4">
        <h2 className="text-white font-bold text-sm sm:text-base lg:text-lg mb-1 sm:mb-2 lg:mb-3">Catálogo de Productos</h2>
        
        {/* Controls */}
        <div className="grid grid-cols-12 gap-1 sm:gap-2 lg:gap-3">
          {/* Quantity */}
          <div className="col-span-2 sm:col-span-2">
            <label className="block text-orange-50 text-[10px] sm:text-xs mb-0.5 sm:mb-1 font-medium">Cant.</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
              className="w-full bg-white border border-orange-300 text-gray-900 px-0.5 sm:px-1 lg:px-2 py-0.5 sm:py-1 lg:py-2 rounded-lg text-center font-bold text-[10px] sm:text-xs lg:text-sm focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              min="1"
            />
          </div>

          {/* Search */}
          <div className="col-span-7 sm:col-span-7 lg:col-span-7">
            <label className="block text-orange-50 text-[10px] sm:text-xs mb-0.5 sm:mb-1 font-medium">
              <span className="hidden md:inline">Búsqueda (F5)</span>
              <span className="md:hidden">Buscar</span>
            </label>
            <div className="relative">
              <Search className="absolute left-1 sm:left-2 lg:left-3 top-1 sm:top-1.5 lg:top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                id="product-search"
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-white border border-orange-300 text-gray-900 pl-5 sm:pl-7 lg:pl-10 pr-1 sm:pr-2 lg:pr-3 py-0.5 sm:py-1 lg:py-2 rounded-lg text-[10px] sm:text-xs lg:text-sm focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Buscar producto..."
              />
            </div>
          </div>

          {/* Price Level */}
          <div className="col-span-3 sm:col-span-3">
            <label className="block text-orange-50 text-[10px] sm:text-xs mb-0.5 sm:mb-1 font-medium">
              <span className="hidden md:inline">Nivel de Precio</span>
              <span className="md:hidden">Precio</span>
            </label>
            <select
              value={selectedPriceLevel}
              onChange={(e) => onPriceLevelChange(parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5)}
              className="w-full bg-white border border-orange-300 text-gray-900 px-0.5 sm:px-1 lg:px-2 py-0.5 sm:py-1 lg:py-2 rounded-lg text-[10px] sm:text-xs lg:text-sm focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value={1}>Precio 1</option>
              <option value={2}>Precio 2</option>
              <option value={3}>Precio 3</option>
              <option value={4}>Precio 4</option>
              <option value={5}>Precio 5</option>
            </select>
          </div>
        </div>

        {/* Price Level Display */}
        <div className="mt-1 sm:mt-2 lg:mt-3 grid grid-cols-5 gap-0.5 sm:gap-1 lg:gap-2">
          {[1, 2, 3, 4, 5].map(level => (
            <button
              key={level}
              onClick={() => onPriceLevelChange(level as 1 | 2 | 3 | 4 | 5)}
              className={`py-0.5 sm:py-1 px-0.5 sm:px-1 lg:px-2 rounded text-[10px] sm:text-xs font-bold transition-all duration-200 ${
                selectedPriceLevel === level
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-orange-50 hover:from-orange-400 hover:to-red-400'
              }`}
            >
              P{level}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="flex-1 overflow-hidden">
        <div ref={tableRef} className="h-full overflow-y-auto">
          <table className="w-full text-[10px] sm:text-xs lg:text-sm">
            <thead className="bg-gray-700 sticky top-0">
              <tr>
                <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 w-12 sm:w-16 lg:w-20 font-semibold bg-gradient-to-r from-orange-50 to-red-50">Código</th>
                <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 w-14 sm:w-16 lg:w-24 font-semibold bg-gradient-to-r from-orange-50 to-red-50 hidden md:table-cell">Pres.</th>
                <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold bg-gradient-to-r from-orange-50 to-red-50">Artículo</th>
                <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 w-12 sm:w-16 lg:w-20 font-semibold bg-gradient-to-r from-orange-50 to-red-50">Stock</th>
                <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 w-16 sm:w-20 lg:w-24 font-semibold bg-gradient-to-r from-orange-50 to-red-50">Precio</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => {
                const currentPrice = getPriceForLevel(product, selectedPriceLevel);
                const isSelected = index === selectedIndex;
                const isLowStock = product.stock < 10;
                
                return (
                  <tr
                    key={product.id}
                    data-index={index}
                    onClick={() => onProductSelect(product)}
                    onDoubleClick={() => onAddProduct(product)}
                    className={`border-b border-orange-100 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? ' bg-gradient-to-br from-orange-400 via-red-500 to-red-400 text-white shadow-sm' 
                        : index % 2 === 0 
                          ? 'bg-white hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50' 
                          : 'bg-gray-50 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50'
                    }`}
                  >
                    <td className="p-1 sm:p-2 lg:p-3 font-mono text-[10px] sm:text-xs text-black">
                      {product.code}
                    </td>
                    <td className="p-1 sm:p-2 lg:p-3 text-black hidden md:table-cell">
                      {product.unit}
                    </td>
                    <td className="p-1 sm:p-2 lg:p-3">
                      <div className={`font-medium ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        <span className="md:hidden">
                          {product.name.length > 15 ? `${product.name.substring(0, 15)}...` : product.name}
                        </span>
                        <span className="hidden md:inline">{product.name}</span>
                      </div>
                      <div className={`text-[8px] sm:text-xs hidden lg:block ${isSelected ? 'text-orange-100' : 'text-gray-500'}`}>
                        {product.line} - {product.subline}
                      </div>
                      <div className={`text-[8px] sm:text-xs md:hidden ${isSelected ? 'text-orange-100' : 'text-gray-500'}`}>
                        {product.unit}
                      </div>
                    </td>
                    <td className="p-1 sm:p-2 lg:p-3 text-right">
<span
  className={`w-8 sm:w-12 lg:w-20 inline-block text-center rounded-xl sm:rounded-2xl font-bold text-[8px] sm:text-xs lg:text-sm shadow-sm transition-all duration-200
    ${
      isLowStock
        ? 'bg-red-600 text-white'
        : product.stock > 50
          ? 'bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-700'
          : 'bg-gradient-to-r from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300 text-yellow-700'
    }
    px-0.5 sm:px-1 lg:px-3 py-0.5 sm:py-1 lg:py-2 min-h-[20px] sm:min-h-[28px] lg:min-h-[36px]
  `}
>
  {product.stock}
</span>





                    </td>
                    <td className="p-1 sm:p-2 lg:p-3 text-right">
                      <span className={`font-mono font-bold ${
                        isSelected ? 'text-yellow-200' : 'text-green-600'
                      }`}>
                        ${currentPrice.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-2 sm:p-4 lg:p-8 text-center text-gray-500 bg-gradient-to-r from-orange-25 to-red-25">
                    <Package size={24} className="sm:w-8 sm:h-8 lg:w-12 lg:h-12 mx-auto mb-1 sm:mb-2 opacity-50" />
                    <div>No se encontraron productos</div>
                    <div className="text-[10px] sm:text-xs">Intenta con otro término de búsqueda</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
<div className="bg-white p-1 sm:p-2 lg:p-4 rounded-xl shadow flex items-center justify-between space-x-1 sm:space-x-2 lg:space-x-4 max-w-full overflow-x-auto">
  {[
    { name: "Aceite", src: "https://www.superaki.mx/cdn/shop/files/7501039121993_060623_fe4dc03c-f3c8-4982-b5c8-b88a5a5704f6_300x300.png?v=1686252385g" },
    { name: "Arroz", src: "https://i5.walmartimages.com.mx/gr/images/product-images/img_large/00750107130145L.jpg" },
    { name: "Azúcar", src: "https://i5.walmartimages.com.mx/gr/images/product-images/img_large/00066144000001L.jpg" },
    { name: "Frijol", src: "https://convy.mx/cdn/shop/files/FrijolNegro1200.png?v=1692036307" },
    { name: "Leche", src: "https://i5.walmartimages.com.mx/gr/images/product-images/img_large/00750102052606L.jpg" },
  ].map((item) => (
    <div key={item.name} className="flex flex-col items-center w-12 sm:w-16 lg:w-20">
      <img
        src={item.src}
        alt={item.name}
        className="w-8 sm:w-12 lg:w-16 h-8 sm:h-12 lg:h-16 object-contain rounded-lg shadow"
      />
      <span className="text-[8px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1 text-center">{item.name}</span>
    </div>
  ))}
</div>

      {/* Footer Info */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-1 sm:p-2 lg:p-3 border-t border-orange-200">
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-600">
          <div>
            Productos: {filteredProducts.length} de {products.length}
          </div>
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <span className="bg-white px-1 sm:px-2 py-0.5 sm:py-1 rounded border border-orange-200 text-[8px] sm:text-xs">↑↓ Navegar</span>
            <span className="bg-white px-1 sm:px-2 py-0.5 sm:py-1 rounded border border-orange-200 text-[8px] sm:text-xs">Enter: Agregar</span>
            <span className="bg-white px-1 sm:px-2 py-0.5 sm:py-1 rounded border border-orange-200 text-[8px] sm:text-xs">+/- Cantidad</span>
            <span className="bg-white px-1 sm:px-2 py-0.5 sm:py-1 rounded border border-orange-200 text-[8px] sm:text-xs">F5: Buscar</span>
          </div>
        </div>
      </div>
    </div>
  );
}