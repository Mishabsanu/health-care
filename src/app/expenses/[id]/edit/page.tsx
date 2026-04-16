'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { Wallet, Calendar, Tag, CreditCard, CheckCircle2, ChevronLeft, Trash2, MapPin, Building, FileText, Upload, X, FileCheck, ExternalLink } from 'lucide-react';
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
    status: '',
    supplierName: '',
    invoiceNumber: '',
    documentUrl: ''
  });

  const categories = ['Rent', 'Salaries', 'Supplies', 'Utilities', 'Maintenance', 'Marketing', 'Others'];
  const paymentMethods = ['UPI', 'Cash', 'Card', 'Bank Transfer', 'CHEQUE'];

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
            status: expense.status,
            supplierName: expense.supplierName || '',
            invoiceNumber: expense.invoiceNumber || '',
            documentUrl: expense.documentUrl || ''
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
    <div className="edit-expense-container animate-fade-in clinical-form-wide" style={{ padding: '2rem 2.5rem', paddingBottom: '7rem' }}>
      <div style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <button
            onClick={() => router.back()}
            className="glass-interactive"
            style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
          >
            <ChevronLeft size={16} /> Registry Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>FINANCIAL LEDGER</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Modify <span className="gradient-text">Expense Record</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
            Update the registry data for this clinical expenditure and sync with central financial vault.
          </p>
        </div>
        <button 
          type="button" 
          onClick={handleDelete}
          className="glass-interactive"
          style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.8rem', border: 'none', background: 'rgba(239, 68, 68, 0.08)', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
        >
          <Trash2 size={16} /> DELETE RECORD
        </button>
      </div>

      <div className="clinical-form-card" style={{ opacity: loading ? 0.7 : 1 }}>
        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', marginBottom: '2.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderLeft: '4px solid var(--primary)', fontWeight: 600 }}>
           Registry Reference: <strong style={{ color: 'var(--primary)' }}>{id}</strong> • Verified Clinical Financial File
        </div>

        <div className="clinical-form-grid">
          <div className="col-12" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)' }}>
            <Wallet size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Financial <span className="gradient-text">Modification</span></h3>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 🏢 Supplier & Reference System */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
              <div>
                <label className="label-premium">Supplier / Company Name <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Building size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                  <input
                    required
                    autoComplete="off"
                    type="text"
                    className="input-premium"
                    style={{ paddingLeft: '3.5rem' }}
                    placeholder="e.g. MedSource Supplies Ltd"
                    value={formData.supplierName}
                    onChange={e => setFormData({...formData, supplierName: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="label-premium">Invoice Number / ID <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>(Optional)</span></label>
                <div style={{ position: 'relative' }}>
                  <FileText size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                  <input
                    autoComplete="off"
                    type="text"
                    className="input-premium"
                    style={{ paddingLeft: '3.5rem' }}
                    placeholder="e.g. INV/2024/089"
                    value={formData.invoiceNumber}
                    onChange={e => setFormData({...formData, invoiceNumber: e.target.value})}
                  />
                </div>
              </div>
          </div>
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

          {/* ☁️ Cloudinary Receipt Upload */}
          <div style={{ marginBottom: '3rem' }}>
              <label className="label-premium">Receipt / Document Attachment</label>
              <div style={{ 
                  border: '2px dashed var(--border-subtle)', 
                  borderRadius: '16px', 
                  padding: '2rem', 
                  textAlign: 'center',
                  background: formData.documentUrl ? '#f0fdf4' : '#fafafa',
                  transition: 'all 0.3s ease'
              }}>
                  {formData.documentUrl ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                          <div style={{ width: '48px', height: '48px', background: '#22c55e', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FileCheck size={24} />
                          </div>
                          <div style={{ textAlign: 'left' }}>
                              <p style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: '#166534' }}>Document Attached</p>
                              <a href={formData.documentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline' }}>View Receipt</a>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setFormData({...formData, documentUrl: ''})}
                            style={{ marginLeft: '1rem', color: '#ef4444', padding: '0.5rem', borderRadius: '50%', background: '#fee2e2' }}
                          >
                            <X size={16} />
                          </button>
                      </div>
                  ) : (
                      <div style={{ position: 'relative' }}>
                          <Upload size={32} style={{ color: 'var(--primary)', opacity: 0.3, marginBottom: '0.75rem' }} />
                          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0 }}>Upload digital receipt or clinical invoice</p>
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.7, marginTop: '0.25rem' }}>PNG, JPG or PDF up to 5MB</p>
                          <input 
                              type="file" 
                              accept="image/*,.pdf"
                              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                              onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  try {
                                      setIsSyncing(true);
                                      // 1. Get Signature
                                      const { data: signData } = await api.get('/upload/sign');
                                      
                                      // 2. Upload to Cloudinary
                                      const formDataUpload = new FormData();
                                      formDataUpload.append('file', file);
                                      formDataUpload.append('api_key', signData.apiKey);
                                      formDataUpload.append('timestamp', signData.timestamp);
                                      formDataUpload.append('signature', signData.signature);
                                      formDataUpload.append('folder', signData.folder);

                                      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`, {
                                          method: 'POST',
                                          body: formDataUpload
                                      });
                                      
                                      const resJson = await cloudRes.json();
                                      if (resJson.secure_url) {
                                          setFormData(prev => ({ ...prev, documentUrl: resJson.secure_url }));
                                          showToast('✅ Document uploaded successfully.', 'success');
                                      } else {
                                          throw new Error('Upload failed');
                                      }
                                  } catch (err) {
                                      console.error('Cloudinary Error:', err);
                                      showToast('🚫 Upload Failed | Verify Cloudinary credentials.', 'error');
                                  } finally {
                                      setIsSyncing(false);
                                  }
                              }}
                          />
                      </div>
                  )}
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
