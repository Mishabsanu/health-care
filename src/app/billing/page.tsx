'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import { usePCMSStore } from '@/store/useStore';
import api from '@/services/api';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { Download, CheckCircle2 } from 'lucide-react';
import HasPermission from '@/components/HasPermission';
import { usePermission } from '@/hooks/usePermission';

interface Invoice {
  _id: string;
  id: string; // Dynamic clinical ID e.g. INV-2024-0001
  patientId: { name: string; phone?: string };
  date: string;
  items: any[];
  subtotal: number;
  discount: number;
  tax: number;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Partially Paid';
  createdBy?: { name: string };
}

export default function BillingPage() {
  const router = useRouter();
  const { hasPermission, canOperate } = usePermission();
  const { showToast, showConfirm } = usePCMSStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  // Backend Pagination State
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const fetchInvoices = async () => {
    setLocalLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      });
      if (searchQuery) params.append('search', searchQuery);
      
      Object.entries(activeFilters).forEach(([key, values]) => {
        if (values && values.length > 0) {
            params.append(key, values[0]);
        }
      });

      const res = await api.get(`/invoices?${params.toString()}`);
      
      if (res.data && typeof res.data.total !== 'undefined') {
          setInvoices(Array.isArray(res.data) ? res.data : (res.data?.data || []));
          setTotalRecords(res.data.total);
      } else {
          setInvoices(Array.isArray(res.data) ? res.data : (res.data?.data || []));
          setTotalRecords(res.data.length);
      }
    } catch (err) {
      console.error('🚫 Registry Error | Failed to fetch invoices:', err);
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, pageSize, searchQuery, activeFilters]);

  const handleDownloadPDF = (i: Invoice) => {
    generateInvoicePDF({
        id: i.id,
        patientName: i.patientId?.name || 'Unknown Patient',
        patientPhone: i.patientId?.phone,
        date: i.date,
        items: i.items || [],
        subtotal: i.subtotal || i.amount,
        discount: i.discount || 0,
        tax: i.tax || 0,
        amount: i.amount,
        clinicName: 'Main Clinic',
        clinicAddress: '123 Health St, Clinical City',
        clinicPhone: '+1 (555) 123-4567'
    });
  };

  const handleMarkPaid = async (inv: Invoice) => {
    try {
      await api.put(`/invoices/${inv._id}`, { status: 'Paid' });
      setInvoices(prev => prev.map(i => i._id === inv._id ? { ...i, status: 'Paid' } : i));
      showToast(`✅ Invoice ${inv.id} marked as Paid.`, 'success');
    } catch (err) {
      console.error('🚫 Financial Error | Failed to update invoice status:', err);
      showToast('Status update failed.', 'error');
    }
  };

  const handleDeleteInvoice = (i: Invoice) => {
    if (!canOperate(i)) return showToast('🚫 Access Denied | You can only delete your own registered invoices.', 'error');
    
    showConfirm(
      'Erase Financial Record',
      `⚠️ WARNING: Permanent erasure of invoice ${i.id}. This cannot be undone. Continue?`,
      async () => {
        try {
          await api.delete(`/invoices/${i._id}`);
          showToast('Invoice deleted successfully.', 'success');
          fetchInvoices();
        } catch (err) {
          console.error('🚫 Ledger Error | Deletion failed:', err);
          showToast('Failed to delete invoice.', 'error');
        }
      },
      true
    );
  };

  const columns = [
    { 
      header: 'INVOICE #', 
      key: 'id' as keyof Invoice,
      style: { fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.02em', fontFamily: 'monospace', fontSize: '0.85rem' } 
    },
    { 
      header: 'PATIENT', 
      key: (i: Invoice) => i.patientId?.name || 'Unknown',
      style: { fontWeight: 600 } 
    },
    { 
      header: 'DATE', 
      key: (i: Invoice) => new Date(i.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }),
      style: { fontSize: '0.85rem' } 
    },
    { 
      header: 'AMOUNT', 
      key: (i: Invoice) => (
        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>₹{i.amount?.toLocaleString()}</span>
      ) 
    },
    { 
      header: 'STATUS', 
      key: (i: Invoice) => (
        <span style={{ 
          background: i.status === 'Paid' ? '#dcfce7' : i.status === 'Unpaid' ? '#fee2e2' : '#fef9c3',
          color: i.status === 'Paid' ? '#166534' : i.status === 'Unpaid' ? '#991b1b' : '#854d0e',
          padding: '0.3rem 0.8rem', 
          borderRadius: '1rem', 
          fontSize: '0.7rem', 
          fontWeight: 800,
          letterSpacing: '0.04em'
        }}>
          {i.status?.toUpperCase()}
        </span>
      ) 
    },
    {
      header: 'CREATED BY',
      key: (i: Invoice) => (
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', opacity: 0.8 }}>
          {i.createdBy?.name?.toUpperCase() || 'SYSTEM'}
        </span>
      )
    },
  ];

  return (
    <div className="billing-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Financial <span className="gradient-text">Ledger</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage clinical invoicing, medical billing, and revenue tracking.</p>
        </div>
        <HasPermission permission="billing:create">
          <button 
            onClick={() => router.push('/billing/generate')}
            style={{ background: 'var(--primary)', color: 'white', padding: '0.8rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600 }}
          >
            Generate Invoice
          </button>
        </HasPermission>
      </div>

        <DataTable 
          data={invoices.map(i => ({ ...i, id: i._id }))}
          columns={columns}
          searchPlaceholder="Search by patient or invoice #..."
          onView={(i) => router.push(`/billing/${i._id}`)}
          onEdit={hasPermission('billing:edit') ? ((i) => {
            if (canOperate(i)) {
              router.push(`/billing/${i._id}/edit`);
            } else {
              showToast('🚫 Access Denied | You can only modify your own registered invoices.', 'error');
            }
          }) : undefined}
          onDelete={hasPermission('billing:delete') ? handleDeleteInvoice : undefined}
          // 🎯 Custom OPERATIONS actions: Download PDF + Mark Paid
          customActions={(item: any) => {
            const inv = invoices.find(i => i._id === item._id) || item as Invoice;
            return (
              <>
                {/* 📥 Download PDF */}
                <HasPermission permission="billing:view">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownloadPDF(inv); }}
                    className="glass-interactive"
                    title="Download Invoice PDF"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1.5px solid var(--border-subtle)',
                      background: 'white',
                      color: '#6366f1',
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={17} />
                  </button>
                </HasPermission>

                {/* ✅ Mark Paid — only for unpaid/partial invoices */}
                {inv.status !== 'Paid' && (
                  <HasPermission permission="billing:edit">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (canOperate(inv)) {
                          handleMarkPaid(inv); 
                        } else {
                          showToast('🚫 Access Denied | You can only manage payments for your own registered invoices.', 'error');
                        }
                      }}
                      className="glass-interactive"
                      title="Mark as Paid"
                      style={{
                        height: '40px',
                        padding: '0 0.85rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        border: '1.5px solid #16a34a',
                        background: '#f0fdf4',
                        color: '#16a34a',
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        letterSpacing: '0.04em',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <CheckCircle2 size={14} /> MARK PAID
                    </button>
                  </HasPermission>
                )}
              </>
            );
          }}
          filterableFields={[
            { label: 'Payment Status', key: 'status' as keyof Invoice, options: ['Paid', 'Unpaid', 'Partially Paid'] }
          ]}
          serverPagination={{
            totalRecords,
            currentPage,
            pageSize,
            onPageChange: setCurrentPage,
            onSearchChange: (s) => { setSearchQuery(s); setCurrentPage(1); },
            onFilterChange: (f) => { setActiveFilters(f); setCurrentPage(1); }
          }}
        />
    </div>
  );
}
