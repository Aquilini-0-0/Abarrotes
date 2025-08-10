import React, { useState } from 'react';
import { X, Search, Printer, Package } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';

interface POSPrintPricesModalProps {
  onClose: () => void;
}

export function POSPrintPricesModal({ onClose }: POSPrintPricesModalProps) {
  const { products } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintPrices = () => {
    const priceList = filteredProducts.map(product => 
      `$${product.price.toFixed(2)} - ${product.name.toUpperCase()}`
    ).join('\n');

    const ticketContent = `
LISTA DE PRECIOS
================
${priceList}
================
Total productos: ${filteredProducts.length}
Generado: ${new Date().toLocaleString('es-MX')}
    `;

    // Create a blob and download as text file for thermal printer
    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lista_precios_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    // Also show print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Lista de Precios</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; }
            .header { text-align: center; font-weight: bold; margin-bottom: 20px; }
            .price-line { margin: 2px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">LISTA DE PRECIOS</div>
          <div class="header">================</div>
          ${filteredProducts.map(product => 
            `<div class="price-line">$${product.price.toFixed(2)} - ${product.name.toUpperCase()}</div>`
          ).join('')}
          <div class="footer">================</div>
          <div class="footer">Total productos: ${filteredProducts.length}</div>
          <div class="footer">Generado: ${new Date().toLocaleString('es-MX')}</div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }

    alert('Lista de precios enviada a impresión');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4 border-b border-orange-600">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">Consulta de Precios</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:text-red-500 rounded-full p-1 transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Buscar producto por nombre o código..."
              />
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-orange-100 to-red-100">
                <tr>
                  <th className="text-left p-3 text-gray-700 font-semibold">Presentación</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Artículo</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Precio P1</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Precio P2</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Precio P3</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Precio P4</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Precio P5</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Existencia</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      <Package size={48} className="mx-auto mb-4 opacity-50" />
                      <div>No se encontraron productos</div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, index) => (
                    <tr
                      key={product.id}
                      className={`border-b border-gray-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-orange-50 transition`}
                    >
                      <td className="p-3 text-gray-700 font-medium">{product.unit}</td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.code}</div>
                      </td>
                      <td className="p-3 text-right font-mono text-green-600 font-bold">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono text-blue-600 font-bold">
                        ${(product.price * 1.1).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono text-purple-600 font-bold">
                        ${(product.price * 1.2).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono text-yellow-600 font-bold">
                        ${(product.price * 1.3).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono text-red-600 font-bold">
                        ${(product.price * 1.4).toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.stock > 50 ? 'bg-green-100 text-green-800' :
                          product.stock > 10 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Print Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={handlePrintPrices}
              disabled={filteredProducts.length === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold"
            >
              <Printer size={20} />
              <span>Imprimir Lista de Precios ({filteredProducts.length} productos)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}