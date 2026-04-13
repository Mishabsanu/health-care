'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { Wallet, Calendar, Tag, CreditCard, CheckCircle2, ChevronLeft } from 'lucide-react';

const validationSchema = Yup.object().shape({
  date: Yup.string().required('Expense date is required'),
  amount: Yup.number()
    .typeError('Amount must be a number')
    .required('Amount is required')
    .positive('Amount must be greater than 0'),
  category: Yup.string().required('Category is required'),
  description: Yup.string().trim().required('Description is required'),
  paymentMethod: Yup.string().required('Payment method is required'),
  status: Yup.string().required('Status is required'),
});

const categories = ['Rent', 'Salaries', 'Supplies', 'Utilities', 'Maintenance', 'Marketing', 'Others'];
const paymentMethods = ['UPI', 'Cash', 'Card', 'Bank Transfer'];

export default function AddExpensePage() {
  const router = useRouter();
  const { setIsSyncing, showToast } = usePCMSStore();

  const formik = useFormik({
    initialValues: {
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: 'Supplies',
      description: '',
      paymentMethod: 'Cash',
      status: 'Paid',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSyncing(true);
      try {
        await api.post('/expenses', { ...values, amount: Number(values.amount) });
        showToast('Expense recorded successfully.', 'success');
        router.push('/expenses');
      } catch (err: any) {
        console.error('🚫 Operational Error | Failed to save expense:', err);
        showToast(err.response?.data?.message || 'Failed to save expense record.', 'error');
      } finally {
        setIsSyncing(false);
      }
    },
  });

  const isErr = (field: keyof typeof formik.values) =>
    formik.touched[field] && formik.errors[field];

  const ErrMsg = ({ name }: { name: keyof typeof formik.values }) =>
    formik.touched[name] && formik.errors[name] ? (
      <div style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, marginTop: '0.35rem' }}>
        ⚠️ {formik.errors[name] as string}
      </div>
    ) : null;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '2rem' }}>
        <button onClick={() => router.back()} style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <ChevronLeft size={16} /> Back to Expenses
        </button>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Record <span className="gradient-text">New Expense</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>
          Fields marked <span style={{ color: '#ef4444' }}>*</span> are required.
        </p>
      </div>

      <div className="clinical-form-card" style={{ margin: '0 auto', padding: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', background: 'rgba(15, 118, 110, 0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)' }}>
          <Wallet size={24} style={{ color: 'var(--primary)' }} />
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Expense Details</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Clinical Financial Registry</p>
          </div>
        </div>

        <form onSubmit={formik.handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <label className="label-premium">Expense Date <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                <input
                  name="date"
                  type="date"
                  className={`input-premium ${isErr('date') ? 'input-error' : ''}`}
                  style={{ paddingLeft: '3.5rem' }}
                  value={formik.values.date}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>
              <ErrMsg name="date" />
            </div>
            <div>
              <label className="label-premium">Amount (₹) <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--primary)', opacity: 0.5 }}>₹</span>
                <input
                  name="amount"
                  type="number"
                  className={`input-premium ${isErr('amount') ? 'input-error' : ''}`}
                  style={{ paddingLeft: '3.5rem', fontWeight: 800, fontSize: '1.1rem', borderColor: isErr('amount') ? '#ef4444' : '' }}
                  placeholder="Enter amount"
                  value={formik.values.amount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  min="0"
                />
              </div>
              <ErrMsg name="amount" />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label className="label-premium">Expense Category <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Tag size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
              <select
                name="category"
                className="input-premium"
                style={{ paddingLeft: '3.5rem' }}
                value={formik.values.category}
                onChange={formik.handleChange}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <label className="label-premium">Description <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea
              name="description"
              className={`textarea-premium ${isErr('description') ? 'input-error' : ''}`}
              style={{ minHeight: '120px', fontSize: '1rem', borderColor: isErr('description') ? '#ef4444' : '' }}
              placeholder="Specify the purpose of this clinical expenditure..."
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <ErrMsg name="description" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
            <div>
              <label className="label-premium">Payment Method <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <CreditCard size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                <select
                  name="paymentMethod"
                  className="input-premium"
                  style={{ paddingLeft: '3.5rem' }}
                  value={formik.values.paymentMethod}
                  onChange={formik.handleChange}
                >
                  {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label-premium">Status <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <CheckCircle2 size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                <select
                  name="status"
                  className="input-premium"
                  style={{ paddingLeft: '3.5rem' }}
                  value={formik.values.status}
                  onChange={formik.handleChange}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '4rem' }}>
            <button type="button" onClick={() => router.back()} style={{ flex: 1, padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-subtle)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '1rem' }}>
              Discard
            </button>
            <button type="submit" disabled={formik.isSubmitting} style={{ flex: 2, padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.4)' }}>
              {formik.isSubmitting ? 'Authorizing...' : <><CheckCircle2 size={20} /> Authorize & Record Expense</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
