'use client'
import DataTable from '@/components/DataTable';
import HasPermission from '@/components/HasPermission';
import LoadingSpinner from '@/components/LoadingSpinner';
import { usePermission } from '@/hooks/usePermission';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { Banknote, CheckCircle2, Printer, Wallet, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';

interface Invoice {
  _id: string;
  id: string; // Dynamic clinical ID e.g. INV-2024-0001
  patientId: {
    _id: string;
    patientId: string; // clinical ID
    name: string;
    phone?: string
  };
  date: string;
  items: any[];
  subtotal: number;
  discount: number;
  tax: number;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'Paid' | 'Unpaid' | 'Partially Paid';
  createdBy?: { name: string };
}

export default function BillingPage() {
  const router = useRouter();
  const { hasPermission, canOperate } = usePermission();
  const { showToast, showConfirm, setIsSyncing } = usePCMSStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Quick Pay State
  const [quickPayInvoice, setQuickPayInvoice] = useState<Invoice | null>(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'Cash',
    note: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Backend Pagination State
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const fetchInvoices = async (isInitial = false) => {
    if (isInitial && !hasLoaded) setLocalLoading(true);
    setIsSyncing(true);
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
      setHasLoaded(true);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchInvoices(!hasLoaded);
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
      paidAmount: i.paidAmount,
      balanceAmount: i.balanceAmount,
      clinicName: 'Physio 4',
      clinicAddress: 'Edavanna Central, Kerala',
      clinicPhone: '976441'
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

  const handleQuickPayment = async () => {
    if (!quickPayInvoice || !paymentData.amount || Number(paymentData.amount) <= 0) {
      return showToast('Please enter a valid payment amount.', 'error');
    }

    setSubmittingPayment(true);
    try {
      const res = await api.post(`/invoices/${quickPayInvoice._id}/payments`, {
        amount: Number(paymentData.amount),
        method: paymentData.method,
        note: paymentData.note || 'Quick Settlement',
        date: new Date().toISOString().split('T')[0]
      });

      // Update local state for immediate feedback
      setInvoices(prev => prev.map(inv => inv._id === quickPayInvoice._id ? res.data : inv));
      showToast(`✅ Payment of ₹${paymentData.amount} recorded for ${res.data.id}`, 'success');
      setQuickPayInvoice(null);
      setPaymentData({ amount: '', method: 'Cash', note: '' });
    } catch (err) {
      console.error('🚫 Ledger Error | Failed to record quick payment:', err);
      showToast('Settlement failed. Please try again.', 'error');
    } finally {
      setSubmittingPayment(false);
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

  const columnsData = useMemo(() => [
    {
      header: 'BILL NO',
      key: 'id' as keyof Invoice,
      style: { fontSize: '0.85rem' }
    },
    {
      header: 'PATIENT NAME',
      style: { minWidth: '150px' },
      key: (a: any) => (
        <div>
          <span onClick={() => a.patientId?._id && router.push(`/patients/${a.patientId._id}`)}
            style={{ fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}>
            {a.patientId?.name || a.patientName || 'Deleted'}
          </span>
          {a.patientId?.patientId && <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>ID: {a.patientId.patientId}</p>}
        </div>
      )
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
      header: 'BALANCE',
      key: (i: Invoice) => (
        <span style={{
          fontWeight: 800,
          fontSize: '0.95rem',
          color: (i.balanceAmount || 0) > 0 ? '#fb923c' : 'inherit'
        }}>
          ₹{(i.balanceAmount || 0).toLocaleString()}
        </span>
      )
    },
    {
      header: 'STATUS',
      key: (i: Invoice) => (
        <span style={{
          background: i.status === 'Paid' ? '#dcfce7' : i.status === 'Unpaid' ? '#fee2e2' : '#ffedd5',
          color: i.status === 'Paid' ? '#166534' : i.status === 'Unpaid' ? '#991b1b' : '#9a3412',
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
  ], []);

  const paginationConfig = useMemo(() => ({
    totalRecords,
    currentPage,
    pageSize,
    onPageChange: setCurrentPage,
    onSearchChange: (s: string) => { setSearchQuery(s); setCurrentPage(1); },
    onFilterChange: (f: any) => { setActiveFilters(f); setCurrentPage(1); }
  }), [totalRecords, currentPage, pageSize]);

  return (
    <div className="billing-container animate-fade-in" style={{ padding: '2rem 2.5rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>REVENUE & INVOICING</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Billing <span className="gradient-text">Registry</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
            Management of clinical invoices, partial payments, and financial settlements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <HasPermission permission="billing:create">
            <button
              onClick={() => router.push('/billing/generate')}
              className="glass-interactive"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'var(--primary)',
                color: 'white',
                padding: '0.8rem 1.75rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 10px 20px -5px rgba(15, 118, 110, 0.3)'
              }}
            >
              <Banknote size={18} /> Generate Bill
            </button>
          </HasPermission>
        </div>
      </div>

      <DataTable
        isLoading={localLoading}
        data={invoices}
        columns={columnsData}
        searchPlaceholder="Search by patient or invoice #..."
        onView={(i) => router.push(`/billing/${i._id}`)}
        onAddNew={() => router.push('/billing/generate')}
        addNewLabel="Generate Bill"
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
              {/* 🖨️ Print Bill */}
              <HasPermission permission="billing:view">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownloadPDF(inv); }}
                  title="Print Clinical Bill"
                  className="glass-interactive"
                  style={{
                    height: '40px',
                    padding: '0 1rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: '1.5px solid var(--primary)',
                    background: 'rgba(15, 118, 110, 0.05)',
                    color: 'var(--primary)',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Printer size={15} /> PRINT
                </button>
              </HasPermission>

              {/* 💬 WhatsApp Notification */}
              {inv.patientId?.phone && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const msg = `Hello ${inv.patientId.name}, your clinical bill (${inv.id}) for INR ${inv.amount.toLocaleString()} has been generated.`;
                    if (inv.patientId.phone) {
                      window.open(`https://wa.me/${inv.patientId.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                    }
                  }}
                  className="glass-interactive"
                  title="Send via WhatsApp"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid #25D366',
                    background: 'white',
                    color: '#25D366',
                    cursor: 'pointer'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.143c1.559.925 3.51 1.413 5.599 1.412 5.485 0 9.948-4.463 9.951-9.95.002-2.66-1.033-5.159-2.91-7.038-1.878-1.879-4.379-2.914-7.037-2.914-5.484 0-9.946 4.462-9.95 9.949-.001 2.052.502 4.053 1.455 5.86l-1.014 3.7 3.793-.993.104.064z" />
                  </svg>
                </button>
              )}

              {/* 💳 Quick Pay Shortcut */}
              {inv.status !== 'Paid' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuickPayInvoice(inv);
                    setPaymentData(prev => ({ ...prev, amount: inv.balanceAmount.toString() }));
                  }}
                  title="Quick Settlement"
                  className="glass-interactive"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid #fb923c',
                    background: 'white',
                    color: '#fb923c',
                    cursor: 'pointer'
                  }}
                >
                  <Wallet size={18} />
                </button>
              )}

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
        serverPagination={paginationConfig}
      />

      {/* 💳 PREMIUM QUICK PAYMENT MODAL */}
      {quickPayInvoice && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.30)', backdropFilter: 'blur(4px)', zIndex: 1000, overflowY: 'auto', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease-out' }}>
          <div className="card-premium animate-scale-up" style={{ width: '100%', maxWidth: '580px', margin: '4rem auto', padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.5)', borderRadius: '24px', background: '#ffffff', flexShrink: 0 }}>
            
            {/* Glossy Header */}
            <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '2rem 2.5rem', borderBottom: '1px solid var(--border-subtle)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(234, 88, 12, 0.25)' }}>
                    <Banknote size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0, color: 'var(--text-main)' }}>Express <span style={{ color: '#f97316' }}>Settlement</span></h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>REGISTRY: <span style={{ color: 'var(--primary)', fontWeight: 900 }}>{quickPayInvoice.id}</span></p>
                  </div>
                </div>
                <button onClick={() => setQuickPayInvoice(null)} style={{ background: 'white', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div style={{ padding: '2.5rem' }}>
              {/* 🏥 CLINICAL CONTEXT SUMMARY CARDS */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1, background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>PATIENT PROFILE</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{quickPayInvoice.patientId?.name || 'Unknown Patient'}</p>
                </div>
                <div style={{ background: '#fff7ed', padding: '1rem 1.25rem', borderRadius: '16px', border: '1px solid #fed7aa', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 900, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem', textAlign: 'right' }}>PENDING DUE</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ea580c', margin: 0, textAlign: 'right' }}>₹{quickPayInvoice.balanceAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* DYNAMIC PAYMENT INPUT */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <span>Settlement Amount</span>
                  <span style={{ color: 'var(--primary)' }}>Partial permitted</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', zIndex: 10 }}>
                    <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1rem' }}>₹</span>
                  </div>
                  <input
                    autoFocus
                    type="number"
                    style={{ width: '100%', padding: '1.25rem 1.25rem 1.25rem 4.5rem', borderRadius: '20px', border: '2px solid transparent', background: '#f0fdfa', fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', outline: 'none', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                    placeholder="0.00"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(13, 148, 136, 0.3)'; e.target.style.background = '#e6fbf9'; e.target.style.boxShadow = '0 0 0 4px rgba(13, 148, 136, 0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f0fdfa'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; }}
                  />
                </div>
              </div>

              {/* METHOD OF PAYMENT */}
              <div style={{ marginBottom: '2.5rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.8rem' }}>Tender Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {['Cash', 'UPI', 'Card'].map(m => {
                    const isActive = paymentData.method === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentData({ ...paymentData, method: m })}
                        style={{
                          padding: '1rem 0.5rem',
                          borderRadius: '16px',
                          border: isActive ? '2px solid var(--primary)' : '2px solid var(--border-subtle)',
                          background: isActive ? '#f0fdfa' : 'white',
                          color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                          fontSize: '0.8rem',
                          fontWeight: 900,
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: isActive ? '0 4px 12px rgba(13, 148, 136, 0.1)' : 'none',
                          transform: isActive ? 'scale(1.02)' : 'scale(1)'
                        }}
                      >
                        {m.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 📊 DYNAMIC BALANCE FORECASTING */}
              <div style={{ padding: '1.25rem', borderRadius: '16px', background: 'linear-gradient(90deg, #f8fafc 0%, white 100%)', border: '1px solid var(--border-subtle)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: (quickPayInvoice.balanceAmount - Number(paymentData.amount)) > 0 ? '#fb923c' : '#10b981' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>FORECAST BALANCE</span>
                </div>
                <span style={{
                  fontSize: '1.3rem',
                  fontWeight: 900,
                  transition: 'color 0.3s ease',
                  color: (quickPayInvoice.balanceAmount - Number(paymentData.amount)) > 0 ? '#ea580c' : '#059669'
                }}>
                  ₹{Math.max(0, quickPayInvoice.balanceAmount - Number(paymentData.amount)).toLocaleString()}
                </span>
              </div>

              {/* ACTIONS */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setQuickPayInvoice(null)}
                  style={{ flex: 1, padding: '1.25rem', borderRadius: '16px', background: 'white', border: '2px solid var(--border-subtle)', fontWeight: 900, color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = 'var(--text-main)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  ABORT
                </button>
                <button
                  onClick={handleQuickPayment}
                  disabled={submittingPayment}
                  style={{
                    flex: 2,
                    padding: '1.25rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #0f766e 100%)',
                    color: 'white',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    letterSpacing: '0.05em',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px -5px rgba(13, 148, 136, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'translateY(0)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(13, 148, 136, 0.6)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(13, 148, 136, 0.5)'; }}
                >
                  {submittingPayment ? 'AUTHORIZING...' : <><Wallet size={20} /> INITIATE SETTLEMENT</>}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
