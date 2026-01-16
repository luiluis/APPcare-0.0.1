
import React from 'react';
import { ReceivablesDashboard } from '../components/ReceivablesDashboard';
import { useData } from '../contexts/DataContext';

export const FinancePage: React.FC = () => {
  const { invoices, residents, setInvoices } = useData();

  return (
    <ReceivablesDashboard 
      invoices={invoices} 
      residents={residents} 
      onUpdateInvoices={setInvoices} 
      allInvoices={invoices} 
    />
  );
};
