'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Receipt, 
  Tag, 
  CreditCard, 
  Building2, 
  ShieldCheck, 
  Edit,
  Activity,
  Info,
  Calendar,
  FileText,
  User,
  ExternalLink
} from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';

export default function ExpenseDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const { showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [expense, setExpense] = useState<any>(null);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const res = await api.get(`/expenses/${id}`);
        setExpense(res.data);
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch expense:', err);
        showToast('Failed to load expenditure record.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchExpense();
  }, [id, showToast]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin" />
      <p className="font-bold text-slate-400 animate-pulse text-xs tracking-widest">🛡️ ACCESSING LEDGER VAULT...</p>
    </div>
  );

  if (!expense) return (
    <div className="p-12 text-center font-bold text-slate-400">
      🚫 EXPENSE RECORD NOT FOUND
    </div>
  );

  const statusColor = expense.status === 'Paid' ? '#10b981' : '#f59e0b';
  const statusBg = expense.status === 'Paid' ? '#dcfce7' : '#fef3c7';

  return (
    <div className="expense-details-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>
      
      {/* 🏥 CLINICAL HEADER */}
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <button 
            onClick={() => router.push('/expenses')} 
            style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
          >
            <ArrowLeft size={16} /> Expense Dashboard
          </button>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Expense <span className="gradient-text">Parameters</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Detailed breakdown of operational clinical expenditures and payment verification.</p>
        </div>
        <button
          onClick={() => router.push(`/expenses/${id}/edit`)}
          className="glass-interactive"
          style={{ 
            padding: '0.85rem 2rem', 
            borderRadius: 'var(--radius-md)', 
            background: 'var(--primary)', 
            color: 'white', 
            fontWeight: 800, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.4)'
          }}
        >
          <Edit size={18} /> EDIT PARAMETERS
        </button>
      </div>

      <div className="clinical-form-grid">
        
        {/* LEFT COLUMN: Expenditure Identity */}
        <div className="col-8">
          <div className="clinical-form-card" style={{ height: '100%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Receipt size={32} />
                </div>
                <div>
                   <h2 style={{ fontSize: '1.5rem', fontWeight: 950, margin: 0, letterSpacing: '-0.02em' }}>{expense.category} Expenditure</h2>
                   <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ledger Ref: {expense.id || String(id).slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <span style={{ 
                padding: '0.5rem 1.5rem', 
                borderRadius: '2rem', 
                background: statusBg,
                color: statusColor,
                fontSize: '0.8rem', 
                fontWeight: 900,
                border: `1.5px solid ${statusColor}40`
              }}>
                {expense.status?.toUpperCase() || 'AUTHORIZED'}
              </span>
            </div>

            <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-subtle)', marginBottom: '3rem' }}>
               <label className="label-premium" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <FileText size={14} style={{ color: 'var(--primary)' }} /> EXPENDITURE DESCRIPTION
               </label>
               <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.6, margin: 0 }}>
                 {expense.description}
               </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
              <div className="spec-block">
                <label className="label-premium" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} style={{ color: 'var(--primary)' }} /> FISCAL DATE
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  {new Date(expense.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              <div className="spec-block">
                <label className="label-premium" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={14} style={{ color: 'var(--primary)' }} /> PAYMENT MODE
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  {expense.paymentMethod || 'System Check'}
                </div>
              </div>

              <div className="spec-block">
                <label className="label-premium" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={14} style={{ color: 'var(--primary)' }} /> ALLOCATED BRANCH
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  {expense.branch?.name || 'Central Admin'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Financial Overview */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="clinical-form-card" style={{ padding: '2rem', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
               <Activity size={20} style={{ color: '#ef4444' }} />
               <h3 style={{ fontSize: '1.1rem', fontWeight: 950, letterSpacing: '-0.01em' }}>DEBIT SUMMARY</h3>
            </div>
            
            <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)', borderRadius: 'var(--radius-lg)', border: '2px solid #fee2e2' }}>
               <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#ef4444', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>LEDGER AMOUNT</span>
               <span style={{ fontSize: '2.5rem', fontWeight: 950, color: '#ef4444', letterSpacing: '-0.03em' }}>₹{expense.amount?.toLocaleString()}</span>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>GST COMPLIANT</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#10b981' }}>YES</span>
               </div>
               <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>AUTHORIZED BY</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)' }}>ADMIN</span>
               </div>
            </div>
          </div>

          <div style={{ padding: '2rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
               <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0 }}>Audit Trail</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
               This expenditure has been recorded in the branch ledger. It is synchronized with the quarterly financial reconciliation report.
            </p>
            <button className="glass-interactive" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
               <ExternalLink size={14} /> VIEW FULL LEDGER
            </button>
          </div>

          <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(15, 118, 110, 0.05)', border: '1px dashed var(--primary)' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Info size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                This record remains <strong>Archived</strong> for fiscal auditing. To change the allocation or amount, use the edit option above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
