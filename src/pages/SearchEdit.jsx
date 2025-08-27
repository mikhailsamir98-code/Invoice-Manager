import React, { useState } from 'react';
import { useInvoice } from '../context/InvoiceContext';
import { Search, Edit2, Trash2, Download, Eye, Save, X } from 'lucide-react';
import PDFExporter from '../components/PDFExporter';

const SearchEdit = () => {
  const { invoices, updateInvoice, deleteInvoice, searchInvoices, settings } = useInvoice();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showPDFExporter, setShowPDFExporter] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const filteredInvoices = searchInvoices(searchQuery);

  const handleEdit = (invoice) => {
    setEditingId(invoice.id);
    setEditText(invoice.text);
  };

  const handleSave = () => {
    if (editText.trim()) {
      updateInvoice(editingId, editText);
      setEditingId(null);
      setEditText('');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(id);
      setSelectedInvoices(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedInvoices.length === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    selectedInvoices.forEach(id => {
      deleteInvoice(id);
    });
    setSelectedInvoices([]);
    setShowDeleteConfirm(false);
  };

  const toggleSelectInvoice = (id) => {
    setSelectedInvoices(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const selectAllInvoices = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(invoice => invoice.id));
    }
  };

  const renderLogo = () => {
    if (settings.logoType === 'image' && settings.logoImage) {
      return (
        <img 
          src={settings.logoImage} 
          alt="Company Logo" 
          className="h-8 object-contain mx-auto"
        />
      );
    }
    return (
      <div className="text-sm font-bold text-blue-600 text-center">
        {settings.logo}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search & Edit Invoices</h1>
        <p className="text-gray-600">Manage your invoices with search, edit, delete, and export functionality</p>
      </div>

      {/* Search and Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                onChange={selectAllInvoices}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Select All ({selectedInvoices.length})
            </label>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDelete}
                disabled={selectedInvoices.length === 0}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedInvoices.length})
              </button>
              
              <button
                onClick={() => setShowPDFExporter(true)}
                disabled={selectedInvoices.length === 0}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF ({selectedInvoices.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredInvoices.length} of {invoices.length} invoices
      </div>

      {/* Invoices Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredInvoices.map((invoice) => (
          <div key={invoice.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Invoice Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.includes(invoice.id)}
                    onChange={() => toggleSelectInvoice(invoice.id)}
                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    {renderLogo()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(invoice)}
                    disabled={editingId === invoice.id}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(invoice.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Invoice Content */}
            <div className="p-4">
              {editingId === invoice.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center px-3 py-1 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">
                  {invoice.text}
                </div>
              )}
            </div>

            {/* Invoice Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              <div>Created: {new Date(invoice.createdAt).toLocaleDateString()}</div>
              {invoice.updatedAt !== invoice.createdAt && (
                <div>Updated: {new Date(invoice.updatedAt).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No invoices found' : 'No invoices yet'}
          </h3>
          <p className="text-gray-600">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Start by creating your first invoice'
            }
          </p>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Delete Selected Invoices
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete <strong>{selectedInvoices.length}</strong> selected invoice{selectedInvoices.length !== 1 ? 's' : ''}? 
                This action cannot be undone.
              </p>
              
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Delete {selectedInvoices.length} Invoice{selectedInvoices.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Exporter Modal */}
      {showPDFExporter && (
        <PDFExporter
          selectedInvoices={selectedInvoices.map(id => 
            invoices.find(invoice => invoice.id === id)
          )}
          onClose={() => setShowPDFExporter(false)}
        />
      )}
    </div>
  );
};

export default SearchEdit;
