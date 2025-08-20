// Utility functions for automatic printing
export const printTicketFile = async (content: string, filename: string) => {
  try {
    // Create blob and download file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Try to send to printer automatically
    await sendToPrinter(content, filename);
    
  } catch (err) {
    console.error('Error printing ticket:', err);
    // Fallback: just download the file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
};

const sendToPrinter = async (content: string, filename: string) => {
  try {
    // Method 1: Try Web Serial API for direct printer communication (modern browsers)
    if ('serial' in navigator) {
      await printViaSerial(content);
      return;
    }

    // Method 2: Try to use print dialog with pre-formatted content
    await printViaDialog(content, filename);

  } catch (err) {
    console.warn('Automatic printing failed, file downloaded instead:', err);
  }
};

const printViaSerial = async (content: string) => {
  try {
    // Request access to serial port (thermal printer)
    const port = await (navigator as any).serial.requestPort({
      filters: [
        { usbVendorId: 0x04b8 }, // Epson
        { usbVendorId: 0x0519 }, // Star Micronics
        { usbVendorId: 0x154f }, // Bixolon
      ]
    });

    await port.open({ baudRate: 9600 });
    
    const writer = port.writable.getWriter();
    
    // ESC/POS commands for thermal printer
    const encoder = new TextEncoder();
    
    // Initialize printer
    await writer.write(encoder.encode('\x1B\x40')); // ESC @ (initialize)
    
    // Set font to small and left align
    await writer.write(encoder.encode('\x1B\x21\x00')); // ESC ! (font A)
    await writer.write(encoder.encode('\x1B\x61\x00')); // ESC a (left align)
    
    // Print content
    await writer.write(encoder.encode(content));
    
    // Cut paper
    await writer.write(encoder.encode('\x1D\x56\x42\x00')); // GS V (cut)
    
    writer.releaseLock();
    await port.close();
    
    console.log('Ticket sent to thermal printer successfully');
    
  } catch (err) {
    throw new Error('Serial printing failed: ' + err.message);
  }
};

const printViaDialog = async (content: string, filename: string) => {
  return new Promise<void>((resolve, reject) => {
    try {
      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      
      document.body.appendChild(iframe);
      
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        reject(new Error('Could not access iframe document'));
        return;
      }

      // Write thermal printer compatible HTML
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${filename}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              margin: 5mm;
              width: 70mm;
              line-height: 1.2;
            }
            .logo { 
              text-align: left; 
              margin-bottom: 5px; 
            }
            .logo img { 
              max-width: 60px; 
              height: auto; 
            }
            .header { 
              font-weight: bold; 
              margin-bottom: 3px; 
            }
            .separator { 
              margin: 3px 0; 
            }
            .footer { 
              text-align: center; 
              margin-top: 10px; 
              font-size: 10px; 
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="logo">
            <img src="${window.location.origin}/logoduran2.png" alt="DURAN" onerror="this.style.display='none'" />
          </div>
          <pre>${content}</pre>
        </body>
        </html>
      `);
      doc.close();

      // Wait for content to load, then print
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.print();
            
            // Clean up after printing
            setTimeout(() => {
              document.body.removeChild(iframe);
              resolve();
            }, 1000);
            
          } catch (printErr) {
            document.body.removeChild(iframe);
            reject(printErr);
          }
        }, 500);
      };
      
    } catch (err) {
      reject(err);
    }
  });
};

// Function to check if automatic printing is supported
export const isPrintingSupported = (): boolean => {
  return 'serial' in navigator || window.print !== undefined;
};

// Function to show printer setup instructions
export const showPrinterSetup = () => {
  const instructions = `
CONFIGURACIÓN DE IMPRESORA AUTOMÁTICA

Para habilitar la impresión automática de tickets:

1. IMPRESORA TÉRMICA USB:
   - Conecta tu impresora térmica por USB
   - En Chrome/Edge: Habilita "Experimental Web Platform features"
   - Ve a chrome://flags y busca "Serial API"
   - Reinicia el navegador

2. IMPRESORA DE RED:
   - Configura tu impresora como predeterminada del sistema
   - Asegúrate de que esté conectada y encendida
   - El navegador usará la impresora predeterminada

3. PERMISOS:
   - El navegador pedirá permisos para acceder a la impresora
   - Acepta los permisos cuando aparezca el diálogo

NOTA: Si la impresión automática falla, el archivo se descargará normalmente.
  `;
  
  alert(instructions);
};