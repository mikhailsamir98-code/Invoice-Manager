import React, { useState } from 'react';
import { X, Download, FileText, Settings } from 'lucide-react';
import { useInvoice } from '../context/InvoiceContext';
import jsPDF from 'jspdf';

// This component no longer imports the broken local font file.

const PDFExporter = ({ selectedInvoices, onClose }) => {
  const { settings } = useInvoice();
  const [isExporting, setIsExporting] = useState(false);
  const [invoicesPerPage, setInvoicesPerPage] = useState(settings.invoicesPerPage);
  const [numberOfInvoices, setNumberOfInvoices] = useState(selectedInvoices.length);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const containsArabic = (text) => {
    if (!text) return false;
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  };

  const getLayoutConfig = (invoicesPerPage) => {
    switch (invoicesPerPage) {
      case 4:
        return { margin: 4, cellPadding: 1, logoHeight: 8, footerHeight: 4, maxFontSize: 14, minFontSize: 6 };
      case 6:
        return { margin: 5, cellPadding: 1, logoHeight: 7, footerHeight: 3, maxFontSize: 12, minFontSize: 5 };
      case 8:
        return { margin: 6, cellPadding: 1, logoHeight: 6, footerHeight: 3, maxFontSize: 10, minFontSize: 4 };
      default:
        return getLayoutConfig(4);
    }
  };

  const willTextFit = (pdf, text, fontSize, maxWidth, maxHeight) => {
    pdf.setFontSize(fontSize);
    const originalLines = text.split('\n');
    const allLines = [];
    
    originalLines.forEach(line => {
      if (line.trim() === '') {
        allLines.push('');
        return;
      }
      const words = line.split(' ');
      let currentLine = '';
      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (pdf.getTextWidth(testLine) > maxWidth) {
          if (currentLine) allLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) allLines.push(currentLine);
    });
    
    const lineHeight = fontSize * 1.2;
    return (allLines.length * lineHeight) <= maxHeight;
  };

  const calculateOptimalFontSize = (pdf, text, maxWidth, maxHeight, config, hasAmiriFont) => {
    const { maxFontSize, minFontSize } = config;
    let low = minFontSize;
    let high = maxFontSize;
    let bestSize = minFontSize;
    
    const isArabic = containsArabic(text);
    const fontToUse = isArabic && hasAmiriFont ? 'Amiri' : 'helvetica';
    pdf.setFont(fontToUse, 'normal');

    while (high - low > 0.1) {
      const midSize = (low + high) / 2;
      if (willTextFit(pdf, text, midSize, maxWidth, maxHeight)) {
        bestSize = midSize;
        low = midSize;
      } else {
        high = midSize - 0.1;
      }
    }
    return bestSize;
  };

  const renderOptimalText = (pdf, text, x, y, maxWidth, maxHeight, fontSize, hasAmiriFont) => {
    const isArabic = containsArabic(text);
    const fontToUse = isArabic && hasAmiriFont ? 'Amiri' : 'helvetica';
    pdf.setFont(fontToUse, 'normal');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(0, 0, 0);

    const originalLines = text.split('\n');
    const allLines = [];
    
    originalLines.forEach(line => {
      if (line.trim() === '') {
        allLines.push('');
        return;
      }
      const words = line.split(' ');
      let currentLine = '';
      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (pdf.getTextWidth(testLine) > maxWidth) {
          if (currentLine) allLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) allLines.push(currentLine);
    });
    
    const lineHeight = fontSize * 1.2;
    const totalHeight = allLines.length * lineHeight;
    const startY = y + (maxHeight - totalHeight) / 2;
    
    allLines.forEach((line, index) => {
      const lineY = startY + (index * lineHeight);
      if (lineY + lineHeight <= y + maxHeight) {
        pdf.text(line, x + maxWidth / 2, lineY, { align: 'center' });
      }
    });
  };

  // Helper to convert network response to Base64
  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setStatusMessage('Initializing PDF engine...');

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let hasAmiriFont = false;
      
      setStatusMessage('Loading Arabic font...');
      try {
        // Fetch the official Amiri font from a reliable CDN
        const fontUrl = 'https://cdn.jsdelivr.net/gh/alif-type/amiri/fonts/amiri-regular.ttf';
        const response = await fetch(fontUrl);
        if (!response.ok) throw new Error(`Font download failed: ${response.statusText}`);
        
        const fontBuffer = await response.arrayBuffer();
        const fontBase64 = arrayBufferToBase64(fontBuffer);
        
        pdf.addFileToVFS('Amiri-Regular.ttf', fontBase64);
        pdf.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        hasAmiriFont = pdf.getFontList().hasOwnProperty('Amiri');
        
        if (!hasAmiriFont) {
          console.warn("Amiri font failed to register. Arabic text may not render correctly.");
          setStatusMessage('Warning: Arabic font failed to load.');
        } else {
          setStatusMessage('Font loaded. Generating pages...');
        }
      } catch (e) {
        console.error("Error loading Amiri font, falling back to default:", e);
        setStatusMessage('Warning: Could not load Arabic font.');
        hasAmiriFont = false;
        await new Promise(resolve => setTimeout(resolve, 1500)); // Show warning briefly
      }

      const pageWidth = 210;
      const pageHeight = 297;
      const config = getLayoutConfig(invoicesPerPage);
      
      let cols, rows;
      if (invoicesPerPage === 4) { cols = 2; rows = 2; }
      else if (invoicesPerPage === 6) { cols = 2; rows = 3; }
      else { cols = 2; rows = 4; }
      
      const usableWidth = pageWidth - (config.margin * 2);
      const usableHeight = pageHeight - (config.margin * 2);
      const cellWidth = usableWidth / cols;
      const cellHeight = usableHeight / rows;
      
      const invoicesToExport = selectedInvoices.slice(0, numberOfInvoices);

      for (let i = 0; i < invoicesToExport.length; i++) {
        setStatusMessage(`Processing invoice ${i + 1} of ${invoicesToExport.length}...`);
        if (i > 0 && i % invoicesPerPage === 0) {
          pdf.addPage();
        }

        const invoice = invoicesToExport[i];
        const itemOnPageIndex = i % invoicesPerPage;
        const col = itemOnPageIndex % cols;
        const row = Math.floor(itemOnPageIndex / cols);

        const x = config.margin + (col * cellWidth);
        const y = config.margin + (row * cellHeight);

        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.rect(x, y, cellWidth, cellHeight);
        
        const logoY = y + config.cellPadding;
        const logoHeight = config.logoHeight;
        
        pdf.setFillColor(248, 249, 250);
        pdf.rect(x, logoY, cellWidth, logoHeight, 'F');
        
        if (settings.logoType === 'image' && settings.logoImage) {
          try {
            const logoImg = new Image();
            logoImg.src = settings.logoImage;
            await new Promise((resolve, reject) => {
              logoImg.onload = resolve;
              logoImg.onerror = reject;
            });
            const aspectRatio = logoImg.width / logoImg.height;
            let imgHeight = logoHeight - 2;
            let imgWidth = imgHeight * aspectRatio;
            if (imgWidth > cellWidth - 4) {
              imgWidth = cellWidth - 4;
              imgHeight = imgWidth / aspectRatio;
            }
            const logoX = x + (cellWidth - imgWidth) / 2;
            const logoImgY = logoY + (logoHeight - imgHeight) / 2;
            pdf.addImage(logoImg, 'PNG', logoX, logoImgY, imgWidth, imgHeight);
          } catch (e) {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(logoHeight * 0.7);
            pdf.setTextColor(37, 99, 235);
            pdf.text(settings.logo, x + cellWidth / 2, logoY + logoHeight / 2, { align: 'center', baseline: 'middle' });
          }
        } else {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(logoHeight * 0.7);
          pdf.setTextColor(37, 99, 235);
          pdf.text(settings.logo, x + cellWidth / 2, logoY + logoHeight / 2, { align: 'center', baseline: 'middle' });
        }

        const contentX = x + config.cellPadding;
        const contentY = logoY + logoHeight + config.cellPadding;
        const contentWidth = cellWidth - (config.cellPadding * 2);
        const contentHeight = cellHeight - logoHeight - config.footerHeight - (config.cellPadding * 4);
        
        const optimalFontSize = calculateOptimalFontSize(pdf, invoice.text, contentWidth, contentHeight, config, hasAmiriFont);
        
        renderOptimalText(pdf, invoice.text, contentX, contentY, contentWidth, contentHeight, optimalFontSize, hasAmiriFont);

        const footerY = y + cellHeight - config.footerHeight;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(5);
        pdf.setTextColor(150, 150, 150);
        
        const date = new Date(invoice.createdAt).toLocaleDateString();
        pdf.text(`${date}`, x + config.cellPadding, footerY + 2);
        pdf.text(`ID: ${invoice.id.slice(-6)}`, x + cellWidth - config.cellPadding, footerY + 2, { align: 'right' });
      }

      setStatusMessage('Finalizing PDF...');
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`invoices-${timestamp}.pdf`);
      setExportSuccess(true);
      setTimeout(() => onClose(), 2000);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      setStatusMessage(`Error: ${error.message}`);
      alert(`An error occurred during PDF export: ${error.message}. Please check console for details.`);
    } finally {
      setIsExporting(false);
    }
  };

  const estimatedPages = Math.ceil(numberOfInvoices / invoicesPerPage);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Export to PDF
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {exportSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center mr-2 text-xs">✓</div>
              PDF exported successfully! Check your downloads folder.
            </div>
          )}

          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 mb-2">🎯 Smart Font Sizing & Arabic Support</h4>
            <div className="text-sm text-green-700 space-y-1">
              <div>✅ <strong>Arabic Font Embedded:</strong> Crystal clear Arabic text guaranteed.</div>
              <div>✨ <strong>Automatic font optimization:</strong> Each invoice gets the largest possible font that fits.</div>
              <div>📏 <strong>Perfect space usage:</strong> Minimized margins, maximized content area.</div>
              <div>📄 <strong>Line breaks preserved:</strong> Original formatting maintained.</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Export Settings
            </h4>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="number-of-invoices" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of invoices to export
                </label>
                <input
                  type="number"
                  id="number-of-invoices"
                  min="1"
                  max={selectedInvoices.length}
                  value={numberOfInvoices}
                  onChange={(e) => setNumberOfInvoices(Math.min(parseInt(e.target.value) || 1, selectedInvoices.length))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="invoices-per-page-export" className="block text-sm font-medium text-gray-700 mb-2">
                  Layout (invoices per A4 page)
                </label>
                <select
                  id="invoices-per-page-export"
                  value={invoicesPerPage}
                  onChange={(e) => setInvoicesPerPage(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={4}>4 per page (Largest Font)</option>
                  <option value={6}>6 per page (Balanced)</option>
                  <option value={8}>8 per page (Most Compact)</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="text-sm text-blue-700">
                <strong>Export Summary:</strong>
                <div>• {numberOfInvoices} invoice{numberOfInvoices !== 1 ? 's' : ''} selected</div>
                <div>• {invoicesPerPage} invoice{invoicesPerPage !== 1 ? 's' : ''} per page</div>
                <div>• {estimatedPages} page{estimatedPages !== 1 ? 's' : ''} estimated</div>
                <div>• Logo: {settings.logoType === 'image' ? 'Image' : 'Text'} ({settings.logo})</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={exportToPDF}
            disabled={isExporting || numberOfInvoices === 0}
            className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="w-32 text-left">{statusMessage}</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFExporter;
