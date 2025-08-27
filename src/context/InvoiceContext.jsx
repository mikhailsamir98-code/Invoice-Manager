import React, { createContext, useContext, useState, useEffect } from 'react';

const InvoiceContext = createContext();

export const useInvoice = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
};

export const InvoiceProvider = ({ children }) => {
  const [invoices, setInvoices] = useState([]);
  const [settings, setSettings] = useState({
    logo: 'Invoice Manager',
    logoType: 'text',
    logoImage: '',
    invoicesPerPage: 4
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedInvoices = localStorage.getItem('invoices');
    const savedSettings = localStorage.getItem('invoiceSettings');
    
    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    }
    
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save invoices to localStorage whenever invoices change
  useEffect(() => {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Save settings to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('invoiceSettings', JSON.stringify(settings));
  }, [settings]);

  const addInvoice = (invoiceText) => {
    const newInvoice = {
      id: Date.now().toString(),
      text: invoiceText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setInvoices(prev => [newInvoice, ...prev]);
    return newInvoice;
  };

  const updateInvoice = (id, newText) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === id 
        ? { ...invoice, text: newText, updatedAt: new Date().toISOString() }
        : invoice
    ));
  };

  const deleteInvoice = (id) => {
    setInvoices(prev => prev.filter(invoice => invoice.id !== id));
  };

  const searchInvoices = (query) => {
    if (!query.trim()) return invoices;
    return invoices.filter(invoice => 
      invoice.text.toLowerCase().includes(query.toLowerCase())
    );
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <InvoiceContext.Provider value={{
      invoices,
      settings,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      searchInvoices,
      updateSettings
    }}>
      {children}
    </InvoiceContext.Provider>
  );
};
