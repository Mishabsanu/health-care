'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { Wallet, Calendar, Tag, CreditCard, CheckCircle2, ChevronLeft, Building, FileText, Upload, X, FileCheck } from 'lucide-react';

const validationSchema = Yup.object().shape({
  date: Yup.string().required('Expense date is required'),
  amount: Yup.number()
    .typeError('Amount must be a number')
    .required('Amount is required')
    .positive('Amount must be greater than 0'),
  category: Yup.string().required('Category is required'),
  paymentMethod: Yup.string().required('Payment method is required'),
  status: Yup.string().required('Status is required'),
  supplierName: Yup.string().trim().required('Supplier/Company name is required'),
  invoiceNumber: Yup.string().trim(),
  documentUrl: Yup.string(),
});

const categories = ['Rent', 'Salaries', 'Supplies', 'Utilities', 'Maintenance', 'Marketing', 'Others'];
const paymentMethods = ['UPI', 'Cash', 'Card', 'Bank Transfer', 'CHEQUE'];

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
      supplierName: '',
      invoiceNumber: '',
      documentUrl: '',
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
    <div className="add-expense-container animate-fade-in clinical-form-wide" style={{ padding: '2rem 2.5rem', paddingBottom: '7rem' }}>
      <div style={{ marginBottom: '3.5rem' }}>
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
          Record <span className="gradient-text">New Expense</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
          Chronological audit of operational outflows and medical procurement.
        </p>
      </div>

      <div className="clinical-form-card" style={{ opacity: formik.isSubmitting ? 0.7 : 1 }}>
        <div className="clinical-form-grid">
          <div className="col-12" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)' }}>
            <Wallet size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Financial <span className="gradient-text">Details</span></h3>
          </div>
        </div>

        <form onSubmit={formik.handleSubmit}>
          {/* 🏢 Supplier & Reference System */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
              <div>
                <label className="label-premium">Supplier / Company Name <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Building size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                  <input
                    name="supplierName"
                    autoComplete="off"
                    type="text"
                    className={`input-premium ${isErr('supplierName') ? 'input-error' : ''}`}
                    style={{ paddingLeft: '3.5rem' }}
                    placeholder="e.g. MedSource Supplies Ltd"
                    value={formik.values.supplierName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </div>
                <ErrMsg name="supplierName" />
              </div>
              <div>
                <label className="label-premium">Invoice Number / ID <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>(Optional)</span></label>
                <div style={{ position: 'relative' }}>
                  <FileText size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                  <input
                    name="invoiceNumber"
                    autoComplete="off"
                    type="text"
                    className="input-premium"
                    style={{ paddingLeft: '3.5rem' }}
                    placeholder="e.g. INV/2024/089"
                    value={formik.values.invoiceNumber}
                    onChange={formik.handleChange}
                  />
                </div>
              </div>
          </div>
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
          </div>

          {/* ☁️ Cloudinary Receipt Upload */}
          <div style={{ marginBottom: '3rem' }}>
              <label className="label-premium">Receipt / Document Attachment</label>
              <div style={{ 
                  border: '2px dashed var(--border-subtle)', 
                  borderRadius: '16px', 
                  padding: '2rem', 
                  textAlign: 'center',
                  background: formik.values.documentUrl ? '#f0fdf4' : '#fafafa',
                  transition: 'all 0.3s ease'
              }}>
                  {formik.values.documentUrl ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                          <div style={{ width: '48px', height: '48px', background: '#22c55e', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FileCheck size={24} />
                          </div>
                          <div style={{ textAlign: 'left' }}>
                              <p style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: '#166534' }}>Document Attached</p>
                              <a href={formik.values.documentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline' }}>View Receipt</a>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => formik.setFieldValue('documentUrl', '')}
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
                                      const formData = new FormData();
                                      formData.append('file', file);
                                      formData.append('api_key', signData.apiKey);
                                      formData.append('timestamp', signData.timestamp);
                                      formData.append('signature', signData.signature);
                                      formData.append('folder', signData.folder);

                                      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`, {
                                          method: 'POST',
                                          body: formData
                                      });
                                      
                                      const resJson = await cloudRes.json();
                                      if (resJson.secure_url) {
                                          formik.setFieldValue('documentUrl', resJson.secure_url);
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
