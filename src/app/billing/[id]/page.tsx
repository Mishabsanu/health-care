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
      amount: invoice.amount
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
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Clock size={16} style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>TRANSACTION AGE</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Current</span>
              </div>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>TAX COMPLIANCE</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#10b981' }}>VERIFIED</span>
              </div>
            </div>
          </div>

          <div 
            onClick={() => router.push(`/billing/${id}/edit`)}
            className="glass-interactive"
            style={{ 
              padding: '2rem', 
              borderRadius: 'var(--radius-lg)', 
              background: 'white', 
              border: '2px solid var(--border-subtle)', 
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CreditCard size={24} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>Modify Ledger</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6, fontWeight: 700 }}>Update items or status</p>
              </div>
            </div>
            <ArrowRight size={20} style={{ opacity: 0.3 }} />
          </div>

        </div>
      </div>
    </div>
  );
}
