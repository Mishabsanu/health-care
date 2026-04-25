'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, Stethoscope, Phone, Mail, Activity, MessageCircle, CheckCircle2, User } from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import LoadingSpinner from '@/components/LoadingSpinner';

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

export default function EditDoctorPage() {
  const router = useRouter();
  const { id } = useParams();
  const { setIsSyncing, showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);

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
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsSyncing(true);
      try {
        const payload: any = { ...values };
        if (!payload.email) delete payload.email;
        await api.put(`/doctors/${id}`, payload);
        showToast('Specialist registry updated successfully.', 'success');
        router.push('/doctors');
      } catch (err) {
        console.error('🚫 Registry Error | Failed to update specialist:', err);
        showToast('Update failed. Please check medical personnel data.', 'error');
      } finally {
        setIsSyncing(false);
      }
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsSyncing(true);
      try {
        const res = await api.get(`/doctors/${id}`);
        const doc = res.data;
        if (doc) {
          formik.setValues({
            name: doc.name || '',
            specialization: doc.specialization || '',
            phone: doc.phone || '',
            email: doc.email || '',
            status: doc.status || 'Available',
            remarks: doc.remarks || '',
          });
        }
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch specialist:', err);
        showToast('Failed to load specialist profile.', 'error');
      } finally {
        setLoading(false);
        setIsSyncing(false);
      }
    };
    fetchData();
  }, [id]);

  const isErr = (field: keyof typeof formik.values) =>
    formik.touched[field] && formik.errors[field];

  const ErrMsg = ({ name }: { name: keyof typeof formik.values }) =>
    formik.touched[name] && formik.errors[name] ? (
      <div style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {formik.errors[name] as string}
      </div>
    ) : null;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="edit-doctor-container animate-fade-in clinical-form-wide" style={{ padding: '2rem 2.5rem', paddingBottom: '7rem' }}>
      <div style={{ marginBottom: '3.5rem' }}>
        <button
          onClick={() => router.back()}
          className="glass-interactive"
          style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> Specialist Registry
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>IDENTITY & ACCESS</span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
          Modify Specialist <span className="gradient-text">Credentials</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
          Manage and update clinical personnel records for your practice.
        </p>
      </div>

      <form onSubmit={formik.handleSubmit} className="clinical-form-card">
        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', marginBottom: '2.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderLeft: '4px solid var(--primary)', fontWeight: 600 }}>
          Registry Reference: <strong style={{ color: 'var(--primary)' }}>{id}</strong> • Verified Clinical Personnel File
        </div>

        <div className="clinical-form-grid">
          {/* Section: Identity */}
          <div className="col-12" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)' }}>
            <Stethoscope size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Specialist <span className="gradient-text">Identity</span></h3>
          </div>

          <div className="col-8">
            <label className="label-premium">Specialist Full Name <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isErr('name') ? '#ef4444' : 'var(--text-muted)', opacity: 0.6 }} />
              <input
                name="name"
                type="text"
                className={`input-premium ${isErr('name') ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.75rem', borderColor: isErr('name') ? '#ef4444' : '' }}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Full clinical name..."
              />
            </div>
            <ErrMsg name="name" />
          </div>

          <div className="col-4">
            <label className="label-premium">Medical Specialization <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Stethoscope size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isErr('specialization') ? '#ef4444' : 'var(--text-muted)', opacity: 0.6 }} />
              <input
                name="specialization"
                type="text"
                className={`input-premium ${isErr('specialization') ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.75rem', borderColor: isErr('specialization') ? '#ef4444' : '' }}
                value={formik.values.specialization}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Physiotherapist"
              />
            </div>
            <ErrMsg name="specialization" />
          </div>

          <div className="col-4">
            <label className="label-premium">Contact Number <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isErr('phone') ? '#ef4444' : 'var(--text-muted)', opacity: 0.6 }} />
              <input
                name="phone"
                type="text"
                maxLength={10}
                className={`input-premium ${isErr('phone') ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.75rem', borderColor: isErr('phone') ? '#ef4444' : '' }}
                value={formik.values.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) formik.setFieldValue('phone', val);
                }}
                onBlur={formik.handleBlur}
                placeholder="9876543210"
              />
            </div>
            <ErrMsg name="phone" />
          </div>

          {/* Email OPTIONAL */}
          <div className="col-4">
            <label className="label-premium">
              Access Email <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>(Optional)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isErr('email') ? '#ef4444' : 'var(--text-muted)', opacity: 0.6 }} />
              <input
                name="email"
                type="email"
                className={`input-premium ${isErr('email') ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.75rem', borderColor: isErr('email') ? '#ef4444' : '' }}
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="specialist@clinic.com"
              />
            </div>
            <ErrMsg name="email" />
          </div>

          {/* Section: Parameters */}
          <div className="col-12" style={{ margin: '2rem 0 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)' }}>
            <Activity size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Operational <span className="gradient-text">Parameters</span></h3>
          </div>

          <div className="col-12">
            <label className="label-premium">Professional Availability <span style={{ color: '#ef4444' }}>*</span></label>
            <select
              name="status"
              className="input-premium"
              value={formik.values.status}
              onChange={formik.handleChange}
              style={{ fontWeight: 800, color: 'var(--primary)' }}
            >
              <option value="Available">Available for Consultations</option>
              <option value="On Leave">Currently On Leave</option>
              <option value="Busy">Shift Occupied</option>
            </select>
          </div>

          <div className="col-12">
            <label className="label-premium">
              <MessageCircle size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle', opacity: 0.5 }} />
              Clinical Profile Bio / Remarks <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>(Optional)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <MessageCircle size={16} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
              <textarea
                name="remarks"
                className="textarea-premium"
                style={{ paddingLeft: '2.75rem', minHeight: '120px' }}
                value={formik.values.remarks}
                onChange={formik.handleChange}
                placeholder="Add medical focus areas, certifications, or internal notes..."
              />
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'flex-end', marginTop: '4rem' }}>
          <button type="button" onClick={() => router.back()} style={{ padding: '0.85rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontWeight: 700, background: 'white', color: 'var(--text-muted)' }}>
            CANCEL
          </button>
          <button type="submit" disabled={formik.isSubmitting} style={{ padding: '0.85rem 3.5rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.4)' }}>
            {formik.isSubmitting ? 'SYNCHRONIZING...' : <><CheckCircle2 size={18} /> AUTHORIZE UPDATE</>}
          </button>
        </div>
      </form>
    </div>
  );
}
