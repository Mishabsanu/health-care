'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { ArrowLeft, Tag, CreditCard, FlaskConical, CheckCircle2 } from 'lucide-react';

const validationSchema = Yup.object().shape({
  name: Yup.string().trim().required('Modality name is required'),
  category: Yup.string().required('Category is required'),
  price: Yup.number()
    .typeError('Price must be a number')
    .required('Session rate is required')
    .positive('Price must be greater than 0'),
  description: Yup.string(),
});

const categories = ['Products','Consultation', 'Therapy', 'Assessment', 'Rehabilitation', 'Emergency'];

export default function AddServicePage() {
  const router = useRouter();
  const { showToast } = usePCMSStore();

  const formik = useFormik({
    initialValues: {
      name: '',
      category: 'Therapy',
      price: '',
      description: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await api.post('/services', values);
        showToast('Service registered successfully.', 'success');
        router.push('/services');
      } catch (err) {
        console.error('🚫 Registry Error | Failed to save service:', err);
        showToast('Failed to save service. Please check your inputs.', 'error');
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
    <div className="add-service-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <button
          onClick={() => router.back()}
          style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
        >
          <ArrowLeft size={16} /> Registry Dashboard
        </button>
        <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>New Clinical <span className="gradient-text">Modality</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Define a new treatment modality. Fields marked <span style={{ color: '#ef4444' }}>*</span> are required.</p>
      </div>

      <form onSubmit={formik.handleSubmit} className="clinical-form-card" style={{ opacity: formik.isSubmitting ? 0.7 : 1 }}>
        <div className="clinical-form-grid">

          <div className="col-12">
            <label className="label-premium">Modality Name <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <FlaskConical size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isErr('name') ? '#ef4444' : 'var(--text-muted)', opacity: 0.6 }} />
              <input
                name="name"
                type="text"
                className={`input-premium ${isErr('name') ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.75rem', borderColor: isErr('name') ? '#ef4444' : '' }}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Ultrasound Therapy"
              />
            </div>
            <ErrMsg name="name" />
          </div>

          <div className="col-6">
            <label className="label-premium">Primary Category <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Tag size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.6 }} />
              <select
                name="category"
                className="input-premium"
                style={{ paddingLeft: '2.75rem' }}
                value={formik.values.category}
                onChange={formik.handleChange}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="col-6">
            <label className="label-premium">Standard Session Rate (₹) <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <CreditCard size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isErr('price') ? '#ef4444' : 'var(--text-muted)', opacity: 0.6 }} />
              <input
                name="price"
                type="number"
                className={`input-premium ${isErr('price') ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.75rem', borderColor: isErr('price') ? '#ef4444' : '' }}
                value={formik.values.price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter session rate"
                min="0"
              />
            </div>
            <ErrMsg name="price" />
          </div>

          <div className="col-12">
            <label className="label-premium">Modality Description <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>(Optional)</span></label>
            <textarea
              name="description"
              rows={3}
              className="textarea-premium"
              style={{ minHeight: '100px', resize: 'vertical' }}
              value={formik.values.description}
              onChange={formik.handleChange}
              placeholder="Describe the clinical benefits, duration, and equipment requirements..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'flex-end', marginTop: '4rem' }}>
          <button type="button" onClick={() => router.back()} style={{ padding: '0.85rem 2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontWeight: 700, background: 'white', color: 'var(--text-muted)' }}>
            CANCEL
          </button>
          <button type="submit" disabled={formik.isSubmitting} style={{ padding: '0.85rem 3rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.4)' }}>
            {formik.isSubmitting ? 'INITIALIZING...' : <><CheckCircle2 size={18} /> AUTHORIZE MODALITY</>}
          </button>
        </div>
      </form>
    </div>
  );
}
