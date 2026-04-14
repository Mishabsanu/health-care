'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { Wallet, Calendar, Tag, CreditCard, CheckCircle2, ChevronLeft, Trash2, MapPin } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { setIsSyncing, showToast } = usePCMSStore();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    date: '',
    amount: 0,
    category: '',
    description: '',
    paymentMethod: '',
    status: ''
  });

  const categories = ['Rent', 'Salaries', 'Supplies', 'Utilities', 'Maintenance', 'Marketing', 'Others'];
  const paymentMethods = ['UPI', 'Cash', 'Card', 'Bank Transfer'];

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const res = await api.get(`/expenses/${id}`);
        const expense = res.data;
        if (expense) {
          setFormData({
            date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
            amount: expense.amount,
            category: expense.category,
            description: expense.description,
            paymentMethod: expense.paymentMethod,
            status: expense.status
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch expense:', err);
        const msg = err.response?.data?.message || 'Access denied or record missing.';
        showToast(msg, 'error');
        router.push('/expenses');
      } finally {
        setFetching(false);
      }
    };
    fetchExpense();
  }, [id, router, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsSyncing(true);
    try {
      await api.put(`/expenses/${id}`, formData);
      router.push('/expenses');
    } catch (err: any) {
      console.error('🚫 Operational Error | Failed to update expense:', err);
      const msg = err.response?.data?.message || 'Update failed.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to permanently clear this clinical financial record?')) {
        setLoading(true);
        setIsSyncing(true);
        try {
            await api.delete(`/expenses/${id}`);
            router.push('/expenses');
        } catch (err) {
            showToast('Deletion failed.', 'error');
            setLoading(false);
        } finally {
            setIsSyncing(false);
        }
    }
  };

  if (fetching) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
            <button
            onClick={() => router.back()}
            style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
            >
            <ChevronLeft size={16} /> Back to Expenses
            </button>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Modify <span className="gradient-text">Expense Record</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>
            Update the registry data for this clinical expenditure.
            </p>
        </div>
        <button 
            type="button" 
            onClick={handleDelete}
            style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', paddingBottom: '0.5rem' }}
        >
            <Trash2 size={18} /> Delete Record
        </button>
      </div>

      <div className="clinical-form-card" style={{ margin: '0 auto', padding: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', background: 'rgba(15, 118, 110, 0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)' }}>
          <Wallet size={24} style={{ color: 'var(--primary)' }} />
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Clinical Record Modification</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Syncing changes with central clinical vault.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <label className="label-premium">Expense Date</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                <input required type="date" className="input-premium" style={{ paddingLeft: '3.5rem' }} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="label-premium">Amount (₹)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--primary)', opacity: 0.5 }}>₹</span>
                <input required type="number" className="input-premium" style={{ paddingLeft: '3.5rem', fontWeight: 800, fontSize: '1.1rem' }} value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label className="label-premium">Expense Category</label>
            <div style={{ position: 'relative' }}>
              <Tag size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
              <select required className="input-premium" style={{ paddingLeft: '3.5rem' }} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="" disabled>Select Category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <label className="label-premium">Description</label>
            <textarea required className="textarea-premium" style={{ minHeight: '120px', fontSize: '1rem' }} placeholder="Specify the purpose..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
            <div>
              <label className="label-premium">Payment Method</label>
              <div style={{ position: 'relative' }}>
                <CreditCard size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                <select required className="input-premium" style={{ paddingLeft: '3.5rem' }} value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                  <option value="" disabled>Select Payment Method</option>
                  {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label-premium">Status</label>
              <div style={{ position: 'relative' }}>
                <CheckCircle2 size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                <select required className="input-premium" style={{ paddingLeft: '3.5rem' }} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="" disabled>Select Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '4rem' }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{ flex: 1, padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-subtle)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '1rem' }}
            >
              Cancel Updates
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary)',
                color: 'white',
                fontWeight: 800,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.4)'
              }}
            >
              {loading ? 'Processing...' : <><CheckCircle2 size={20} /> Update Record</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
