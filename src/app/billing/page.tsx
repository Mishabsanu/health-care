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
      style: { fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.02em', fontFamily: 'monospace', fontSize: '0.85rem' }
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
    <div className="billing-container animate-fade-in" style={{ padding: '2rem' }}>
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

      {/* 💳 QUICK PAYMENT MODAL */}
      {quickPayInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="card-premium animate-scale-up" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(234, 88, 12, 0.3)' }}>
                  <Banknote size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 950, margin: 0 }}>Quick <span style={{ color: '#fb923c' }}>Settlement</span></h3>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>Invoice: <span style={{ color: 'var(--primary)' }}>{quickPayInvoice.id}</span></p>
                </div>
              </div>
              <button onClick={() => setQuickPayInvoice(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#64748b', cursor: 'pointer', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            {/* 🏥 CLINICAL CONTEXT SUMMARY */}
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>PATIENT NAME</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{quickPayInvoice.patientId?.name || 'Unknown Patient'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>BILL DATE</p>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{new Date(quickPayInvoice.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.75rem' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>ITEMIZED SUMMARY</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {quickPayInvoice.items?.slice(0, 3).map((item, idx) => (
                    <span key={idx} style={{ background: 'white', border: '1px solid var(--border-subtle)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {item.name}
                    </span>
                  ))}
                  {quickPayInvoice.items?.length > 3 && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', padding: '0.25rem' }}>
                      + {quickPayInvoice.items.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 950, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Amount</label>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fb923c' }}>Due: ₹{quickPayInvoice.balanceAmount.toLocaleString()}</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: 'var(--primary)', fontSize: '1.25rem' }}>₹</span>
                  <input
                    autoFocus
                    type="number"
                    style={{ width: '100%', padding: '1rem 1rem 1rem 2.2rem', borderRadius: '14px', border: '2px solid var(--primary)', background: '#f0fdfa', fontSize: '1.5rem', fontWeight: 950, color: 'var(--text-main)', outline: 'none' }}
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 950, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.6rem' }}>Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {['Cash', 'UPI', 'Card'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentData({ ...paymentData, method: m })}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: '2px solid',
                        borderColor: paymentData.method === m ? 'var(--primary)' : 'var(--border-subtle)',
                        background: paymentData.method === m ? '#f0fdfa' : 'white',
                        color: paymentData.method === m ? 'var(--primary)' : 'var(--text-muted)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* 📊 BALANCE FORECASTING */}
              <div style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: '#f8fafc', border: '1.5px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>BALANCE AFTER PAYMENT</span>
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: 950,
                    color: (quickPayInvoice.balanceAmount - Number(paymentData.amount)) > 0 ? '#fb923c' : '#10b981'
                  }}>
                    ₹{Math.max(0, quickPayInvoice.balanceAmount - Number(paymentData.amount)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={() => setQuickPayInvoice(null)}
                  style={{ flex: 1, padding: '1.1rem', borderRadius: '14px', background: '#f8fafc', border: '1px solid var(--border-subtle)', fontWeight: 800, color: '#64748b', cursor: 'pointer' }}
                >
                  CANCEL
                </button>
                <button
                  onClick={handleQuickPayment}
                  disabled={submittingPayment}
                  style={{
                    flex: 2,
                    padding: '1.1rem',
                    borderRadius: '14px',
                    background: 'var(--primary)',
                    color: 'white',
                    fontWeight: 950,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem'
                  }}
                >
                  {submittingPayment ? 'SAVING...' : <><CheckCircle2 size={18} /> CONFIRM</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
