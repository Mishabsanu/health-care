'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { ArrowLeft, User, Phone, Mail, Stethoscope, MessageCircle, CheckCircle2 } from 'lucide-react';

const validationSchema = Yup.object().shape({
  name: Yup.string().trim().required('Specialist name is required'),
  specialization: Yup.string().trim().required('Clinical category is required'),
  phone: Yup.string()
    .trim()
    .required('Contact number is required')
    .matches(/^[0-9+\-\s()]*$/, 'Invalid phone format'),
  email: Yup.string().email('Invalid email address'), // optional
  status: Yup.string().required('Status is required'),
  remarks: Yup.string(),
});

export default function AddDoctorPage() {
  const router = useRouter();
  const { showToast } = usePCMSStore();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      specialization: '',
      phone: '',
      email: '',
      status: 'Available',
      remarks: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      const payload: any = { ...values };
      if (!payload.email) delete payload.email;
      if (!payload.remarks) delete payload.remarks;
      try {
        await api.post('/doctors', payload);
        showToast('Specialist registered successfully.', 'success');
        router.push('/doctors');
      } catch (err) {
        console.error('🚫 Registry Error | Failed to register specialist:', err);
        showToast('Specialist registration failed. Please check the data.', 'error');
      } finally {
        setLoading(false);
      }
    },
  });

  const isErr = (field: keyof typeof formik.values) =>
    formik.touched[field] && formik.errors[field];

  const ErrMsg = ({ name }: { name: keyof typeof formik.values }) =>
    formik.touched[name] && formik.errors[name] ? (
      <div style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        ⚠️ {formik.errors[name] as string}
      </div>
    ) : null;

  return (
    <div className="add-doctor-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <button
          onClick={() => router.back()}
          style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
        >
          <ArrowLeft size={16} /> Back to Registry
        </button>
        <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Initialize <span className="gradient-text">Specialist</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Register a new medical specialist profile. Fields marked <span style={{ color: '#ef4444' }}>*</span> are required.</p>
      </div>

      <form onSubmit={formik.handleSubmit} className="clinical-form-card" style={{ opacity: loading ? 0.7 : 1 }} autoComplete="off">
        <div className="clinical-form-grid">

          {/* Name */}
          <div className="col-8">
            <label className="label-premium">
              Specialist Full Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isErr('name') ? '#ef4444' : 'var(--text-muted)', opacity: 0.6 }} />
              <input
                name="name"
                disabled={loading}
                type="text"
                className={`input-premium ${isErr('name') ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.75rem', borderColor: isErr('name') ? '#ef4444' : '' }}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Dr. Robert Lee"
              />
            </div>
            <ErrMsg name="name" />
          </div>

          {/* Specialization */}
          <div className="col-4">
            <label className="label-premium">
              Clinical Category <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Stethoscope size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isErr('specialization') ? '#ef4444' : 'var(--text-muted)', opacity: 0.6 }} />
              <input
                name="specialization"
                disabled={loading}
                type="text"
                className={`input-premium ${isErr('specialization') ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.75rem', borderColor: isErr('specialization') ? '#ef4444' : '' }}
                value={formik.values.specialization}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Sports Therapist"
              />
            </div>
            <ErrMsg name="specialization" />
          </div>

          {/* Phone */}
          <div className="col-4">
            <label className="label-premium">
              Primary Contact <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isErr('phone') ? '#ef4444' : 'var(--text-muted)', opacity: 0.6 }} />
              <input
                name="phone"
                disabled={loading}
                type="text"
                className={`input-premium ${isErr('phone') ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.75rem', borderColor: isErr('phone') ? '#ef4444' : '' }}
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <ErrMsg name="phone" />
          </div>

          {/* Email - OPTIONAL */}
          <div className="col-4">
            <label className="label-premium">Personnel Email <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>(Optional)</span></label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isErr('email') ? '#ef4444' : 'var(--text-muted)', opacity: 0.6 }} />
              <input
                name="email"
                disabled={loading}
                type="email"
                className={`input-premium ${isErr('email') ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.75rem', borderColor: isErr('email') ? '#ef4444' : '' }}
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="specialist@clinic.com"
                autoComplete="none"
              />
            </div>
            <ErrMsg name="email" />
          </div>

          {/* Status */}
          <div className="col-4">
            <label className="label-premium">Availability Status <span style={{ color: '#ef4444' }}>*</span></label>
            <select
              name="status"
              disabled={loading}
              className="input-premium"
              value={formik.values.status}
              onChange={formik.handleChange}
              style={{ fontWeight: 700, color: 'var(--primary)' }}
            >
              <option value="Available">Available</option>
              <option value="On Leave">On Leave</option>
              <option value="Busy">Busy</option>
            </select>
          </div>

          {/* Remarks */}
          <div className="col-12 remarks-section">
            <label className="label-premium">
              <MessageCircle size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle', opacity: 0.5 }} />
              Conclusions / Administrative Remarks <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>(Optional)</span>
            </label>
            <textarea
              name="remarks"
              className="textarea-premium"
              placeholder="Add specialist notes, availability patterns, certifications..."
              value={formik.values.remarks}
              onChange={formik.handleChange}
            />
          </div>

          {/* Action Row */}
          <div className="col-12" style={{ display: 'flex', gap: '1.25rem', justifyContent: 'flex-end', marginTop: '3rem' }}>
            <button
              type="button"
              disabled={loading}
              onClick={() => router.back()}
              style={{ padding: '0.85rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontWeight: 600, background: 'white' }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.85rem 3.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary)',
                color: 'white',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {loading ? 'INITIALIZING...' : <><CheckCircle2 size={18} /> AUTHORIZE SPECIALIST</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
