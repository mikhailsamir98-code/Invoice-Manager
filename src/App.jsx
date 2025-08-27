import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import InvoiceEntry from './pages/InvoiceEntry';
import SearchEdit from './pages/SearchEdit';
import Settings from './pages/Settings';
import { InvoiceProvider } from './context/InvoiceContext';

function App() {
  return (
    <InvoiceProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<InvoiceEntry />} />
            <Route path="/search" element={<SearchEdit />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </InvoiceProvider>
  );
}

export default App;
