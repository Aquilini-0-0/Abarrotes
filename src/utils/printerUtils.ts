// Utility functions for automatic ticket printing

/**
 * Main function to print a ticket.
 * It first attempts to send the content directly to a printer.
 * If automatic printing fails, it falls back to downloading the content as a text file.
 * @param {string} content - The text content to be printed/saved.
 * @param {string} filename - The name of the file if it needs to be downloaded.
 */
export const printTicketFile = async (content: string, filename:string) => {
  try {
    // We first try the modern, automatic methods.
    await sendToPrinter(content, filename);
  } catch (err) {
    // If any part of the automatic printing process fails, we log the error
    // and fall back to a reliable download.
    console.error('Automatic printing failed, falling back to download:', err);
    downloadTicketFile(content, filename);
  }
};

/**
 * Handles the fallback mechanism of downloading the ticket content as a file.
 * @param {string} content - The text content.
 * @param {string} filename - The filename for the download.
 */
const downloadTicketFile = (content: string, filename: string) => {
  try {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (downloadErr) {
    console.error('Could not even download the file:', downloadErr);
    // As a last resort, you could show the content in a modal for manual copy-paste.
  }
};


/**
 * Tries different methods to automatically print the ticket.
 * It prioritizes the Web Serial API for direct communication with USB thermal printers.
 * If that's not available or fails, it tries to open the standard browser print dialog.
 * @param {string} content - The text content to print.
 * @param {string} filename - A filename used for the print job title.
 */
const sendToPrinter = async (content: string, filename: string) => {
  // Method 1: Try Web Serial API for direct printer communication (modern browsers like Chrome/Edge)
  if ('serial' in navigator) {
    console.log("Attempting to print via Web Serial API...");
    await printViaSerial(content);
    return; // Success!
  }

  // Method 2: Try to use the standard print dialog with pre-formatted content
  console.log("Web Serial API not found, falling back to print dialog...");
  await printViaDialog(content, filename);
};

/**
 * Uses the Web Serial API to connect to and print on a USB thermal printer.
 * @param {string} content - The raw text to send to the printer.
 */
const printViaSerial = async (content: string) => {
  try {
    // Request access to a serial port. This opens a browser dialog for the user to select the device.
    const port = await (navigator as any).serial.requestPort({
      // ===================================================================
      // PASO DE DEPURACIÓN: Se han comentado los filtros.
      // Si tu impresora no aparecía en la lista, esta modificación hará
      // que el navegador muestre TODOS los dispositivos serie disponibles.
      //
      // QUÉ HACER:
      // 1. Ejecuta este código.
      // 2. Intenta imprimir. Deberías ver un pop-up con más dispositivos.
      // 3. Selecciona tu impresora. Si la impresión funciona, ¡genial!
      //
      // Si AÚN ASÍ no aparece ningún dispositivo, el problema probablemente
      // está en la conexión física del cable USB o en los drivers de
      // la impresora en tu sistema operativo.
      // ===================================================================
      // filters: [
      //   { usbVendorId: 0x04b8 }, // Epson
      //   { usbVendorId: 0x0519 }, // Star Micronics
      //   { usbVendorId: 0x154f }, // Bixolon
      // ]
    });

    // Open the selected port.
    await port.open({ baudRate: 9600 });
    
    const writer = port.writable.getWriter();
    const encoder = new TextEncoder();
    
    // Send ESC/POS commands to the thermal printer
    // 1. Initialize printer
    await writer.write(encoder.encode('\x1B\x40'));
    
    // 2. Set standard font and left alignment
    await writer.write(encoder.encode('\x1B\x21\x00')); // Font A
    await writer.write(encoder.encode('\x1B\x61\x00')); // Left align
    
    // 3. Print the actual ticket content
    await writer.write(encoder.encode(content));
    
    // 4. Feed a few lines and cut the paper
    await writer.write(encoder.encode('\n\n\n'));
    await writer.write(encoder.encode('\x1D\x56\x42\x00')); // Partial cut command
    
    // Clean up
    writer.releaseLock();
    await port.close();
    
    console.log('Ticket sent to thermal printer successfully');
    
  } catch (err: any) {
    // THIS IS THE CRITICAL PART FOR YOUR ERROR
    // If the user closes the port selection dialog, a "NotFoundError" is thrown.
    if (err.name === 'NotFoundError' || err.message.includes('No port selected')) {
      // We throw a more descriptive error to be caught by the main function.
      throw new Error('Printing canceled. You must select a printer from the pop-up dialog.');
    }
    // For any other errors, we pass them along.
    throw new Error('Serial printing failed: ' + err.message);
  }
};

/**
 * Creates a hidden iframe with formatted HTML to trigger the browser's print dialog.
 * @param {string} content - The content to be placed inside the printable area.
 * @param {string} filename - The title for the print document.
 */
const printViaDialog = (content: string, filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        document.body.removeChild(iframe);
        reject(new Error('Could not access iframe document for printing.'));
        return;
      }

      // Write HTML formatted for a standard 80mm thermal receipt.
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${filename}</title>
          <style>
            @page {
              size: 80mm auto; /* Standard receipt paper width */
              margin: 0;
            }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              margin: 5mm;
              width: 70mm; /* Content width inside the margins */
              line-height: 1.2;
            }
            pre {
              white-space: pre-wrap; /* Allows long lines to wrap */
              word-wrap: break-word;
            }
            .logo img { 
              max-width: 60px; 
              height: auto; 
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="logo">
            <img src="${window.location.origin}/logoduran2.png" alt="Logo" onerror="this.style.display='none'" />
          </div>
          <pre>${content}</pre>
        </body>
        </html>
      `);
      doc.close();

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus(); // Focus is important for some browsers
            iframe.contentWindow?.print();
            
            // Clean up after a delay
            setTimeout(() => {
              document.body.removeChild(iframe);
              resolve();
            }, 1000);
            
          } catch (printErr) {
            document.body.removeChild(iframe);
            reject(printErr);
          }
        }, 500); // 500ms delay to ensure content is fully rendered
      };
      
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Checks if any automatic printing method is likely supported by the browser.
 * @returns {boolean}
 */
export const isPrintingSupported = (): boolean => {
  return 'serial' in navigator || typeof window.print !== 'undefined';
};

/**
 * Shows an alert with instructions for setting up automatic printing.
 */
export const showPrinterSetup = () => {
  // Using alert is simple, but for a better UI, consider using a modal dialog component from your framework.
  const instructions = `
CONFIGURACIÓN DE IMPRESORA AUTOMÁTICA

Para que la impresión de tickets sea automática al conectar una impresora USB:

1. CONECTAR IMPRESORA:
   - Asegúrate de que tu impresora térmica esté conectada por USB y encendida.

2. USAR CHROME O EDGE:
   - Esta función es compatible principalmente con navegadores como Google Chrome o Microsoft Edge.

3. DAR PERMISOS:
   - La primera vez que intentes imprimir, el navegador mostrará un diálogo o pop-up.
   - **DEBES SELECCIONAR tu impresora en esa lista y hacer clic en "Conectar".**

4. FALLBACK:
   - Si cancelas el diálogo o algo falla, el ticket se descargará como un archivo de texto que puedes imprimir manualmente.
  `;
  
  alert(instructions);
};
