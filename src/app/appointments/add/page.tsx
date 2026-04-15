'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Search,
  Stethoscope,
  MessageCircle,
} from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import ClinicalSearchSelect from '@/components/ClinicalSearchSelect';

const validationSchema = Yup.object().shape({
  patientId: Yup.string().required('Please select a patient'),
  doctorId: Yup.string().required('Please select a specialist'),
  date: Yup.date().required('Appointment date is required').min(
    new Date(new Date().setHours(0, 0, 0, 0)),
    'Cannot book appointments in the past'
  ),
});

export default function BookAppointmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const { showToast } = usePCMSStore();

  const formik = useFormik({
    initialValues: {
      patientId: '',
      doctorId: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      status: 'Scheduled',
      description: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const selectedPatient = patients.find(p => p._id === values.patientId);
        const selectedDoctor = doctors.find(d => d._id === values.doctorId);

        const payload = {
          ...values,
          patientName: selectedPatient?.name || 'Unknown Patient',
          doctorName: selectedDoctor?.name || 'Unknown Specialist'
        };

        await api.post('/appointments', payload);
        showToast('Clinical session successfully authorized.', 'success');
        router.push('/appointments');
      } catch (err) {
        console.error('🚫 Scheduling Error | Failed to authorize appointment:', err);
        showToast('Booking failed. Please check medical scheduling data.', 'error');
      } finally {
        setLoading(false);
      }
    },
  });

  // -------------------------------------------------------------------
  // SYNC | Fetch Clinical Registry Data for Dropdowns
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          api.get('/patients/dropdown'),
          api.get('/doctors/dropdown')
        ]);
        setPatients(Array.isArray(patientsRes.data) ? patientsRes.data : (patientsRes.data?.data || []));
        setDoctors(Array.isArray(doctorsRes.data) ? doctorsRes.data : (doctorsRes.data?.data || []));
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch scheduling options:', err);
      }
    };
    fetchData();
  }, []);

  const selectedPatient = patients.find(p => p._id === formik.values.patientId);

  const isError = (field: keyof typeof formik.values) => 
    formik.touched[field] && !!formik.errors[field];

  const ErrorMsg = ({ name }: { name: keyof typeof formik.values }) => (
    formik.touched[name] && formik.errors[name] ? (
      <div style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 700, marginTop: '0.4rem', marginLeft: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <span>⚠️ {formik.errors[name] as string}</span>
      </div>
    ) : null
  );

  return (
    <div className="book-appointment-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '9rem' }}>

      {/* 🏥 CLINICAL HEADER */}
      <div style={{ marginBottom: '3rem' }}>
        <button
          onClick={() => router.back()}
          style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
        >
          <ArrowLeft size={16} /> DashBoard
        </button>
        <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>New Clinical <span className="gradient-text">Booking</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Orchestrate a medical session between a specialist and patient.</p>
      </div>

      <form onSubmit={formik.handleSubmit} className="clinical-form-card" style={{ opacity: loading ? 0.7 : 1 }}>
        <div className="clinical-form-grid">

          {/* Section 1: Patient Identification */}
          <div className="col-12" style={{ 
              marginBottom: '1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '4px solid var(--primary)'
          }}>
            <User size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Patient <span className="gradient-text">Selection</span>
            </h3>
          </div>

          <div className="col-12" style={{ marginBottom: '2rem' }}>
            <ClinicalSearchSelect 
              label="Search Clinical Registry *"
              options={patients}
              value={formik.values.patientId}
              placeholder="Search File (Name / Phone / Patient ID)..."
              searchFields={['name', 'phone', 'patientId']}
              onSelect={(p) => formik.setFieldValue('patientId', p._id)}
              onClear={() => formik.setFieldValue('patientId', '')}
              icon={<Search size={18} />}
              error={isError('patientId')}
              renderOption={(p) => (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                      {p.name?.[0]}
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{p.name}</span>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>— {p.phone}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', padding: '0.25rem 0.5rem', background: 'rgba(15, 118, 110, 0.05)', borderRadius: '4px' }}>Sync File</span>
                </div>
              )}
            />
            <ErrorMsg name="patientId" />

            {formik.values.patientId && selectedPatient && (
              <div className="animate-fade-in" style={{
                marginTop: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'white',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem', boxShadow: '0 6px 12px rgba(15, 118, 110, 0.2)' }}>
                    {selectedPatient.name?.[0]}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.1rem' }}>
                       <p style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.25rem', letterSpacing: '-0.01em' }}>{selectedPatient.name}</p>
                       <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '2rem' }}>VERIFIED FILE</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Selected Record: {selectedPatient.phone} • [#{selectedPatient.patientId || 'N/A'}]</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Clinical Logistics */}
          <div className="col-12" style={{ 
              margin: '2rem 0 1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '4px solid var(--primary)'
          }}>
            <Calendar size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Booking <span className="gradient-text">Logistics</span>
            </h3>
          </div>

          <div className="col-12" style={{ marginBottom: '1.5rem' }}>
            <ClinicalSearchSelect 
              label="Medical Specialist *"
              options={doctors}
              value={formik.values.doctorId}
              placeholder="Search Specialist..."
              searchFields={['name', 'specialization']}
              onSelect={(d) => formik.setFieldValue('doctorId', d._id)}
              onClear={() => formik.setFieldValue('doctorId', '')}
              icon={<Stethoscope size={16} />}
              error={isError('doctorId')}
              renderOption={(d) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem' }}>
                    {d.name?.[0]}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>{d.name}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{d.specialization}</p>
                  </div>
                </div>
              )}
            />
            <ErrorMsg name="doctorId" />
          </div>

          <div className="col-6">
            <label className="label-premium">Scheduled Date <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isError('date') ? '#ef4444' : 'var(--text-muted)', opacity: 0.5 }} />
              <input 
                name="date"
                autoComplete="off"
                type="date" 
                className={`input-premium ${isError('date') ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.75rem' }} 
                value={formik.values.date} 
                onChange={formik.handleChange} 
                onBlur={formik.handleBlur}
              />
            </div>
            <ErrorMsg name="date" />
          </div>
          <div className="col-6">
            <label className="label-premium">Scheduled Time (Optional)</label>
            <div style={{ position: 'relative' }}>
              <Clock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isError('time') ? '#ef4444' : 'var(--text-muted)', opacity: 0.5 }} />
              <input 
                name="time"
                autoComplete="off"
                type="time" 
                className={`input-premium ${isError('time') ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.75rem' }} 
                value={formik.values.time} 
                onChange={formik.handleChange} 
                onBlur={formik.handleBlur}
              />
            </div>
            <ErrorMsg name="time" />
          </div>

          {/* Section 3: Conclusion / Remarks */}
          <div className="col-12" style={{ 
              margin: '3rem 0 1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '4px solid var(--primary)'
          }}>
            <MessageCircle size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Clinical <span className="gradient-text">Remarks</span>
            </h3>
          </div>

          <div className="col-12">
            <label className="label-premium">Conclusions / Clinical Notes</label>
            <textarea
              name="description"
              autoComplete="off"
              className="textarea-premium"
              placeholder="Add clinical notes..."
              value={formik.values.description}
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
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {loading ? 'AUTHORIZING...' : 'AUTHORIZE BOOKING'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
