import React, { useState } from 'react';
import { useInvoice } from '../context/InvoiceContext';
import { Plus, Check } from 'lucide-react';

const InvoiceEntry = () => {
  const { addInvoice, settings } = useInvoice();
  const [invoiceText, setInvoiceText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceText.trim()) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
    
    addInvoice(invoiceText);
    setInvoiceText('');
    setIsSubmitting(false);
    setShowSuccess(true);
    
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const renderLogo = () => {
    if (settings.logoType === 'image' && settings.logoImage) {
      return (
        <img 
          src={settings.logoImage} 
          alt="Company Logo" 
          className="h-16 object-contain"
        />
      );
    }
    return (
      <h2 className="text-2xl font-bold text-blue-600">
        {settings.logo}
      </h2>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Entry</h1>
        <p className="text-gray-600">Create new invoices quickly and efficiently</p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <Check className="h-5 w-5 mr-2" />
          Invoice created successfully!
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Invoice Preview Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-center">
            {renderLogo()}
          </div>
        </div>

        {/* Invoice Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="invoice-text" className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Details
            </label>
            <textarea
              id="invoice-text"
              value={invoiceText}
              onChange={(e) => setInvoiceText(e.target.value)}
              placeholder="Enter invoice details here..."
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !invoiceText.trim()}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Create Invoice
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Section */}
      {invoiceText && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Live Preview</h3>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="text-center mb-4">
              {renderLogo()}
            </div>
            <div className="whitespace-pre-wrap text-gray-700 text-sm">
              {invoiceText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceEntry;
