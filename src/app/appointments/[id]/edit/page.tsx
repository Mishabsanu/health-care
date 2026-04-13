'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, User, Calendar, Clock, Stethoscope, CheckCircle2, MessageCircle, Activity } from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';

const validationSchema = Yup.object().shape({
  patientId: Yup.string().required('Patient must be selected'),
  doctorId: Yup.string().required('Specialist must be assigned'),
  date: Yup.date().required('Appointment date is required'),
  status: Yup.string().oneOf(['Scheduled', 'Confirmed', 'Completed', 'Cancelled']).required('Status is required'),
});

export default function EditAppointmentPage() {
  const router = useRouter();
  const { id } = useParams();
  const { setIsSyncing, showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  const formik = useFormik({
    initialValues: {
      patientId: '',
      doctorId: '',
      date: '',
      time: '',
      status: 'Scheduled',
      description: ''
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setSaving(true);
      setIsSyncing(true);
      try {
        const selectedPatient = patients.find(p => p._id === values.patientId);
        const selectedDoctor = doctors.find(d => d._id === values.doctorId);

        const payload = {
          ...values,
          patientName: selectedPatient?.name || 'Unknown Patient',
          doctorName: selectedDoctor?.name || 'Unknown Specialist'
        };

        await api.put(`/appointments/${id}`, payload);
        showToast('Clinical booking updated successfully.', 'success');
        router.push('/appointments');
      } catch (err) {
        console.error('🚫 Scheduling Error | Failed to update clinical booking:', err);
        showToast('Update failed. Please check medical scheduling data.', 'error');
      } finally {
        setSaving(false);
        setIsSyncing(false);
      }
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsSyncing(true);
      try {
        const [appRes, patientsRes, doctorsRes] = await Promise.all([
          api.get(`/appointments/${id}`),
          api.get('/patients/dropdown'),
          api.get('/doctors/dropdown'),
        ]);

        const appointment = appRes.data;
        if (appointment) {
          const resolvedPatientId =
            (typeof appointment.patientId === 'object' && appointment.patientId !== null)
              ? (appointment.patientId._id || appointment.patientId.id)
              : appointment.patientId;

          const resolvedDoctorId =
            (typeof appointment.doctorId === 'object' && appointment.doctorId !== null)
              ? (appointment.doctorId._id || appointment.doctorId.id)
              : appointment.doctorId;

          formik.setValues({
            patientId: resolvedPatientId || '',
            doctorId: resolvedDoctorId || '',
            date: appointment.date ? new Date(appointment.date).toISOString().split('T')[0] : '',
            time: appointment.time || '',
            status: appointment.status || 'Scheduled',
            description: appointment.description || ''
          });
        }

        setPatients(Array.isArray(patientsRes.data) ? patientsRes.data : (patientsRes.data?.data || []));
        setDoctors(Array.isArray(doctorsRes.data) ? doctorsRes.data : (doctorsRes.data?.data || []));

      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch scheduling record:', err);
        showToast('Failed to synchronize booking data.', 'error');
      } finally {
        setLoading(false);
        setIsSyncing(false);
      }
    };
    fetchData();
  }, [id, setIsSyncing, showToast]);

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

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin" />
      <p className="font-bold text-slate-400 animate-pulse text-xs tracking-widest">🛡️ SYNCING SCHEDULER VAULT...</p>
    </div>
  );

  return (
    <div className="edit-appointment-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <button
          onClick={() => router.back()}
          style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
        >
          <ArrowLeft size={16} /> Scheduler Dashboard
        </button>
        <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Modify Clinical <span className="gradient-text">Booking</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Update medical session details, specialist assignment, or clinical status.</p>
      </div>

      <form onSubmit={formik.handleSubmit} className="clinical-form-card" style={{ opacity: saving ? 0.7 : 1 }}>
        <div className="clinical-form-grid">
          {/* Section 1: Patient Linkage */}
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
              Patient <span className="gradient-text">Linkage</span>
            </h3>
          </div>

          <div className="col-12" style={{ marginBottom: '1rem' }}>
            <div className="animate-fade-in" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                  {selectedPatient?.name?.[0]}
                </div>
                <div>
                  <p style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem', margin: 0 }}>{selectedPatient?.name}</p>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>Verified Clinical File • {selectedPatient?.phone}</p>
                </div>
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary)', background: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                LOCKED RECORD
              </div>
            </div>
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

          <div className="col-6">
            <label className="label-premium">Medical Specialist <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Stethoscope size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isError('doctorId') ? '#ef4444' : 'var(--text-muted)', opacity: 0.5 }} />
              <select name="doctorId" className={`input-premium ${isError('doctorId') ? 'input-error' : ''}`} style={{ paddingLeft: '2.75rem' }} value={formik.values.doctorId} onChange={formik.handleChange}>
                <option value="" disabled>Select Specialist</option>
                {doctors.map(d => <option key={d._id} value={d._id}>{d.name} ({d.specialization})</option>)}
              </select>
            </div>
            <ErrorMsg name="doctorId" />
          </div>

          <div className="col-12" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div>
              <label className="label-premium">Scheduled Date <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isError('date') ? '#ef4444' : 'var(--text-muted)', opacity: 0.5 }} />
                <input name="date" type="date" className={`input-premium ${isError('date') ? 'input-error' : ''}`} style={{ paddingLeft: '2.75rem' }} value={formik.values.date} onChange={formik.handleChange} onBlur={formik.handleBlur} />
              </div>
              <ErrorMsg name="date" />
            </div>
            <div>
              <label className="label-premium">Scheduled Time (Optional)</label>
              <div style={{ position: 'relative' }}>
                <Clock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isError('time') ? '#ef4444' : 'var(--text-muted)', opacity: 0.5 }} />
                <input name="time" type="time" className={`input-premium ${isError('time') ? 'input-error' : ''}`} style={{ paddingLeft: '2.75rem' }} value={formik.values.time} onChange={formik.handleChange} onBlur={formik.handleBlur} />
              </div>
              <ErrorMsg name="time" />
            </div>
          </div>

          <div className="col-12" style={{ marginTop: '1.5rem' }}>
            <label className="label-premium">Booking Status</label>
            <div style={{ position: 'relative' }}>
              <Activity size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <select name="status" className="input-premium" style={{ paddingLeft: '2.75rem', fontWeight: 800, color: 'var(--primary)' }} value={formik.values.status} onChange={formik.handleChange}>
                <option value="Scheduled">Scheduled</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <ErrorMsg name="status" />
          </div>

          <div className="col-12" style={{ margin: '3rem 0 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)' }}>
            <MessageCircle size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Clinical <span className="gradient-text">Remarks</span>
            </h3>
          </div>

          <div className="col-12">
            <label className="label-premium">Conclusions / Session Notes</label>
            <textarea name="description" className="textarea-premium" style={{ height: '120px' }} placeholder="Add clinical notes..." value={formik.values.description} onChange={formik.handleChange} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'flex-end', marginTop: '4rem' }}>
          <button type="button" disabled={saving} onClick={() => router.back()} style={{ padding: '0.85rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontWeight: 700, background: 'white', color: 'var(--text-muted)' }}>
            CANCEL
          </button>
          <button type="submit" disabled={saving} style={{ padding: '0.85rem 3.5rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.4)' }}>
            {saving ? 'AUTHORIZING...' : <><CheckCircle2 size={18} /> AUTHORIZE UPDATE</>}
          </button>
        </div>
      </form>
    </div>
  );
}
