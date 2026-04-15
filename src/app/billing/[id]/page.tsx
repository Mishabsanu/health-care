'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar, 
  CreditCard, 
  Printer, 
  Download,
  Building,
  CheckCircle2,
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const { showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
      amount: '',
      method: 'Cash',
      date: new Date().toISOString().split('T')[0],
      note: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/invoices/${id}`);
        setInvoice(res.data);
      } catch (err) {
        console.error('🚫 Ledger Error | Failed to fetch invoice record:', err);
        showToast('Failed to load financial record.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, showToast]);

  const handleRecordPayment = async () => {
      if (!paymentData.amount || Number(paymentData.amount) <= 0) {
          return showToast('Please enter a valid amount.', 'error');
      }

      setSubmittingPayment(true);
      try {
          const res = await api.post(`/invoices/${id}/payments`, {
              ...paymentData,
              amount: Number(paymentData.amount)
          });
          setInvoice(res.data);
          setShowPaymentModal(false);
          setPaymentData({
              amount: '',
              method: 'Cash',
              date: new Date().toISOString().split('T')[0],
              note: ''
          });
          showToast('Payment recorded successfully.', 'success');
      } catch (err) {
          console.error('🚫 Ledger Error | Failed to record payment:', err);
          showToast('Failed to log payment.', 'error');
      } finally {
          setSubmittingPayment(false);
      }
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;
    generateInvoicePDF({
      id: invoice.id,
      patientName: invoice.patientId?.name || 'Unknown Patient',
      patientPhone: invoice.patientId?.phone,
      date: invoice.date,
      items: invoice.items || [],
      subtotal: invoice.subtotal || invoice.amount,
      discount: invoice.discount || 0,
      tax: invoice.tax || 0,
      amount: invoice.amount,
      paidAmount: invoice.paidAmount,
      balanceAmount: invoice.balanceAmount
    });
  };

  if (loading) return <LoadingSpinner />;

  if (!invoice) return (
    <div className="p-12 text-center font-bold text-slate-400">
      🚫 FINANCIAL RECORD NOT FOUND
    </div>
  );

  const statusColor = invoice.status === 'Paid' ? '#10b981' : invoice.status === 'Unpaid' ? '#ef4444' : '#f59e0b';
  const statusBg = invoice.status === 'Paid' ? '#dcfce7' : invoice.status === 'Unpaid' ? '#fee2e2' : '#fef3c7';

  return (
    <div className="invoice-details-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>
      
      {/* 🏥 CLINICAL HEADER */}
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <button 
            onClick={() => router.push('/billing')} 
            style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
          >
            <ArrowLeft size={16} /> Billing Dashboard
          </button>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Invoice <span className="gradient-text">Verification</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Comprehensive review of the clinical invoice, patient liability, and payment status.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleDownloadPDF}
            className="glass-interactive"
            style={{ padding: '0.85rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'white', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
          >
            <Download size={18} /> DOWNLOAD PDF
          </button>
          <button
            onClick={() => window.print()}
            className="glass-interactive"
            style={{ padding: '0.85rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'white', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
          >
            <Printer size={18} /> PRINT INVOICE
          </button>
        </div>
      </div>

      <div className="clinical-form-grid">
        
        {/* LEFT COLUMN: Main Invoice Body */}
        <div className="col-8">
          <div className="clinical-form-card" style={{ padding: '2.5rem' }}>
            
            {/* INVOICE ID & STATUS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
              <div>
                <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>OFFICIAL CLINICAL RECORD</div>
                <h2 style={{ fontSize: '2rem', fontWeight: 950, margin: 0, letterSpacing: '-0.02em' }}>#{invoice.id}</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                    padding: '0.5rem 1.5rem', 
                    borderRadius: '2rem', 
                    background: statusBg,
                    color: statusColor,
                    fontSize: '0.85rem', 
                    fontWeight: 900,
                    border: `1.5px solid ${statusColor}40`,
                    display: 'inline-block'
                }}>
                  {invoice.status?.toUpperCase() || 'UNPAID'}
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 600 }}>Invoice Date: {new Date(invoice.date).toLocaleDateString()}</p>
              </div>
            </div>

            {/* ENTITY BREADCRUMB */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', padding: '2rem', background: '#f8fafc', borderRadius: 'var(--radius-lg)', marginBottom: '3rem', border: '1.5px solid var(--border-subtle)' }}>
              <div>
                <label className="label-premium" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={14} /> PATIENT DETAILS</label>
                <div 
                  onClick={() => router.push(`/patients/${invoice.patientId?._id}`)}
                  style={{ display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer' }}
                >
                   <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800 }}>{invoice.patientId?.name?.[0]}</div>
                   <div>
                     <p style={{ margin: 0, fontWeight: 850, color: 'var(--primary)', fontSize: '1rem' }}>{invoice.patientId?.name}</p>
                     <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>{invoice.patientId?.phone || 'No Contact'}</p>
                   </div>
                </div>
              </div>
              
            </div>

            {/* LINE ITEMS */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <FileText size={20} style={{ color: 'var(--primary)' }} /> ITEMIZED TREATMENTS
            </h3>
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)' }}>SERVICE / MODALITY</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textAlign: 'center' }}>QTY</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textAlign: 'right' }}>RATE</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textAlign: 'right' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</td>
                      <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.9rem', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                      <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.9rem', textAlign: 'right', fontWeight: 600 }}>₹{item.price?.toLocaleString()}</td>
                      <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.9rem', textAlign: 'right', fontWeight: 900, color: 'var(--primary)' }}>₹{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTALS PANEL */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem' }}>
              <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  <span>Subtotal</span>
                  <span>₹{invoice.subtotal?.toLocaleString()}</span>
                </div>
                {invoice.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800, color: '#ef4444' }}>
                    <span>Clinical Discount</span>
                    <span>-₹{invoice.discount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '2.5px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 950, color: 'var(--text-main)' }}>PAYABLE AMOUNT</span>
                  <span style={{ fontSize: '1.75rem', fontWeight: 950, color: 'var(--primary)', letterSpacing: '-0.03em' }}>₹{invoice.amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Audit & Quick Actions */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="clinical-form-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <CreditCard size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 950, letterSpacing: '-0.01em' }}>LEDGER AUDIT</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Paid</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 950, color: '#10b981' }}>₹{invoice.paidAmount?.toLocaleString()}</div>
              </div>
              <div style={{ padding: '1.25rem', background: (invoice.balanceAmount || 0) > 0 ? 'rgba(245, 158, 11, 0.05)' : (invoice.balanceAmount < 0 ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc'), borderRadius: 'var(--radius-md)', border: (invoice.balanceAmount || 0) !== 0 ? '1px solid currentColor' : 'none', color: (invoice.balanceAmount || 0) > 0 ? '#d97706' : (invoice.balanceAmount < 0 ? '#059669' : 'var(--text-main)') }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.7, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{invoice.balanceAmount < 0 ? 'Advanced / Credit' : 'Balance Due'}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 950 }}>₹{Math.abs(invoice.balanceAmount || 0).toLocaleString()}</div>
              </div>
            </div>

            <button 
                onClick={() => setShowPaymentModal(true)}
                className="glass-interactive"
                style={{ 
                    marginTop: '2rem', 
                    width: '100%', 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-md)', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    fontWeight: 800, 
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.4)'
                }}
            >
                <CheckCircle2 size={18} /> RECORD PAYMENT
            </button>
          </div>

          <div className="clinical-form-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <Clock size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 950, letterSpacing: '-0.01em' }}>PAYMENT LOG</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(!invoice.payments || invoice.payments.length === 0) ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No payments recorded yet.</p>
                  ) : (
                      invoice.payments.map((p: any, idx: number) => (
                          <div key={idx} style={{ padding: '1rem', borderLeft: '3px solid var(--primary)', background: '#f8fafc', borderRadius: '0 8px 8px 0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 900 }}>₹{p.amount.toLocaleString()}</span>
                                  <span style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5 }}>{new Date(p.date).toLocaleDateString()}</span>
                              </div>
                              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{p.method} • {p.note || 'No note'}</div>
                          </div>
                      ))
                  )}
              </div>
          </div>

      </div>

      {/* 💳 RECORD PAYMENT MODAL */}
      {showPaymentModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '2rem' }}>
              <div className="card-premium animate-scale-up" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <CreditCard size={20} />
                          </div>
                          <div>
                              <h2 style={{ fontSize: '1.25rem', fontWeight: 950, margin: 0 }}>Record Settlement</h2>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Invoice #{invoice.id}</p>
                          </div>
                      </div>
                      <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          <Clock size={24} style={{ transform: 'rotate(45deg)' }} />
                      </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                          <label className="label-premium">PAYMENT AMOUNT (₹)</label>
                          <input 
                              type="number" 
                              className="input-premium" 
                              style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--primary)' }}
                              placeholder="0.00"
                              value={paymentData.amount}
                              onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                          />
                      </div>

                      <div>
                          <label className="label-premium">PAYMENT METHOD</label>
                          <select 
                            className="input-premium"
                            value={paymentData.method}
                            onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                          >
                              <option value="UPI">UPI / GPay</option>
                              <option value="Cash">Cash</option>
                              <option value="Card">Clinical Card Terminal</option>
                              <option value="Insurance">Insurance Settlement</option>
                          </select>
                      </div>

                      <div>
                          <label className="label-premium">VALORIZATION DATE</label>
                          <input 
                            type="date" 
                            className="input-premium" 
                            value={paymentData.date}
                            onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
                          />
                      </div>

                      <div>
                          <label className="label-premium">TRANSACTION NOTE</label>
                          <input 
                            type="text" 
                            className="input-premium" 
                            placeholder="e.g. Week 2 Treatment Partial"
                            value={paymentData.note}
                            onChange={(e) => setPaymentData({...paymentData, note: e.target.value})}
                          />
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                          <button 
                            onClick={() => setShowPaymentModal(false)}
                            style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-subtle)', fontWeight: 700, color: 'var(--text-muted)' }}
                          >
                              Discard
                          </button>
                          <button 
                            onClick={handleRecordPayment}
                            disabled={submittingPayment}
                            style={{ flex: 2, padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 800, border: 'none', boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.4)' }}
                          >
                              {submittingPayment ? 'Registering...' : 'Confirm Payment'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  </div>
  );
}
