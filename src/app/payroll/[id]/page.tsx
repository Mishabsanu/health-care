'use client'
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Calendar,
  Clock,
  CreditCard,
  Info,
  ShieldCheck,
  UserCircle,
  Wallet
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PayrollDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const { showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<any>(null);

  useEffect(() => {
    const fetchPayrollRecord = async () => {
      try {
        const res = await api.get(`/payroll/staff/${id}`);
        setRecord(res.data);
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch payroll record:', err);
        showToast('Failed to load payroll details.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPayrollRecord();
  }, [id, showToast]);

  if (loading) return <LoadingSpinner />;

  if (!record) return (
    <LoadingSpinner />
  );

  return (
    <div className="payroll-details-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>

      {/* 🏥 CLINICAL HEADER */}
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <button
            onClick={() => router.push('/payroll')}
            style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
          >
            <ArrowLeft size={16} /> Payroll Dashboard
          </button>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Compensation <span className="gradient-text">Parameters</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Detailed breakdown of specialist salary structure, tenure, and disbursements.</p>
        </div>
        <button
          onClick={() => router.push(`/payroll`)}
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
          <ArrowUpRight size={18} /> MANAGE REGISTRY
        </button>
      </div>

      <div className="clinical-form-grid">

        {/* LEFT COLUMN: Identity & Tenure */}
        <div className="col-8">
          <div className="clinical-form-card" style={{ height: '100%' }}>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '3.5rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2rem', fontWeight: 800 }}>
                <UserCircle size={48} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 950, margin: 0, letterSpacing: '-0.03em' }}>{record?.name}</h2>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {(typeof record?.role === 'string' ? record.role : record?.role?.name || 'SPECIALIST')?.toUpperCase()}
                  </span>
                  <span style={{ height: '4px', width: '4px', borderRadius: '50%', background: 'var(--border-subtle)', alignSelf: 'center' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>JOINED: {new Date(record?.joinDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginTop: '1rem' }}>
              <div className="spec-block">
                <label className="label-premium" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} style={{ color: 'var(--primary)' }} /> TENURE SCORE
                </label>
                <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--text-main)' }}>
                  {record.tenureDays} <small style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DAYS</small>
                </div>
              </div>

              <div className="spec-block">
                <label className="label-premium" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={14} style={{ color: 'var(--primary)' }} /> WORKED THIS PERIOD
                </label>
                <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--text-main)' }}>
                  {record.workedDays || '--'} <small style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DAYS</small>
                </div>
              </div>

              <div className="spec-block">
                <label className="label-premium" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--primary)' }} /> CLINICAL COMPLIANCE
                </label>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
                  ACTIVE PERSONNEL
                </div>
              </div>
            </div>

            <div style={{ marginTop: '4rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 950, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CreditCard size={20} style={{ color: 'var(--primary)' }} /> DISBURSEMENT BREAKDOWN
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-subtle)' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>BASIC SALARY</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>₹{record.salaryDetails?.basicSalary?.toLocaleString()}</span>
                </div>
                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-subtle)' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ALLOWANCES</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>+₹{record.salaryDetails?.allowance?.toLocaleString()}</span>
                </div>
                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-subtle)' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DEDUCTIONS</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ef4444' }}>-₹{record.salaryDetails?.deduction?.toLocaleString()}</span>
                </div>
                <div style={{ padding: '1.5rem', background: 'rgba(15, 118, 110, 0.05)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--primary)' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem' }}>NET PAYABLE</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)' }}>₹{record.salaryDetails?.netSalary?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Bank & Compliance */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div className="clinical-form-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
              <Wallet size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 950, letterSpacing: '-0.01em' }}>BANKING REGISTRY</h3>
            </div>

            <div style={{ padding: '1.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: '-10px', top: '-10px', color: 'var(--primary)', opacity: 0.05 }}>
                <Banknote size={80} />
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>OFFICIAL ACCOUNT DETAILS</span>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5 }}>BANK NAME</label>
                  <p style={{ margin: 0, fontWeight: 850, fontSize: '1.1rem' }}>{record.bankDetails?.bankName}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5 }}>ACCOUNT NUMBER</label>
                  <p style={{ margin: 0, fontWeight: 950, fontSize: '1.1rem', letterSpacing: '0.05em', color: 'var(--primary)' }}>{record.bankDetails?.accountNumber}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-premium" style={{ borderLeft: '4px solid #10b981', padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <BadgeCheck size={24} style={{ color: '#10b981' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900 }}>TAX VERIFIED</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PAN & KYC Compliance Active</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(15, 118, 110, 0.05)', border: '1px dashed var(--primary)' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Info size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                This record is the <strong>Primary Settlement Document</strong>. Salary disbursements are calculated based on the worked days verified in the Attendance module.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
