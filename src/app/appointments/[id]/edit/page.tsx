'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, User, Calendar, Clock, Stethoscope, CheckCircle2, Building, MessageCircle, ClipboardList, Activity } from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';

export default function EditAppointmentPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, setIsSyncing, showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    type: '',
    status: '',
    description: ''
  });

  // -------------------------------------------------------------------
  // SYNC | Fetch Clinical Record & Registry Data
  // -------------------------------------------------------------------
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
          // Robust ID Resolution for selectors
          const resolvedPatientId =
            (typeof appointment.patientId === 'object' && appointment.patientId !== null)
              ? (appointment.patientId._id || appointment.patientId.id)
              : appointment.patientId;

          const resolvedDoctorId =
            (typeof appointment.doctorId === 'object' && appointment.doctorId !== null)
              ? (appointment.doctorId._id || appointment.doctorId.id)
              : appointment.doctorId;



          setFormData({
            patientId: resolvedPatientId || '',
            doctorId: resolvedDoctorId || '',
            date: appointment.date ? new Date(appointment.date).toISOString().split('T')[0] : '',
            time: appointment.time || '',
            type: appointment.type || 'Consultation',

            status: appointment.status || 'Booked',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setIsSyncing(true);
    try {
      const selectedPatient = patients.find(p => p._id === formData.patientId);
      const selectedDoctor = doctors.find(d => d._id === formData.doctorId);

      const payload = {
        ...formData,
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
  };

  const selectedPatient = patients.find(p => p._id === formData.patientId);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin" />
      <p className="font-bold text-slate-400 animate-pulse text-xs tracking-widest">🛡️ SYNCING SCHEDULER VAULT...</p>
    </div>
  );

  return (
    <div className="edit-appointment-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>

      {/* 🏥 CLINICAL HEADER */}
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

      <form onSubmit={handleSubmit} className="clinical-form-card" style={{ opacity: saving ? 0.7 : 1 }}>
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

          <div className="col-4">
            <label className="label-premium">Clinical Category</label>
            <div style={{ position: 'relative' }}>
              <ClipboardList size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <select className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                <option value="Consultation">Clinical Consultation</option>
                <option value="Therapy Session">Manual Therapy Session</option>
                <option value="Follow-up">Diagnostic Follow-up</option>
                <option value="Rehabilitation">Post-Op Rehabilitation</option>
              </select>
            </div>
          </div>
          <div className="col-4">
            <label className="label-premium">Medical Specialist <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Stethoscope size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <select required className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.doctorId} onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}>
                <option value="" disabled>Select Specialist</option>
                {doctors.map(d => <option key={d._id} value={d._id}>{d.name} ({d.specialization})</option>)}
              </select>
            </div>
          </div>

          <div className="col-6">
            <label className="label-premium">Scheduled Date <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input required type="date" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>
          </div>
          <div className="col-6">
            <label className="label-premium">Scheduled Time (Optional)</label>
            <div style={{ position: 'relative' }}>
              <Clock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5, pointerEvents: 'none' }} />
              <input type="time" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
            </div>
          </div>

          <div className="col-12">
            <label className="label-premium">Booking Status</label>
            <div style={{ position: 'relative' }}>
              <Activity size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <select className="input-premium" style={{ paddingLeft: '2.75rem', fontWeight: 800, color: 'var(--primary)' }} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="Booked">Booked</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Section 3: Clinical Remarks */}
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
            <label className="label-premium">Conclusions / Session Notes</label>
            <textarea
              className="textarea-premium"
              style={{ height: '120px' }}
              placeholder="Add clinical trajectory summaries or file-specific directives for this session..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        {/* Action Row */}
        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'flex-end', marginTop: '4rem' }}>
          <button
            type="button"
            disabled={saving}
            onClick={() => router.back()}
            style={{ padding: '0.85rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontWeight: 700, background: 'white', color: 'var(--text-muted)' }}
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.85rem 3.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary)',
              color: 'white',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.4)'
            }}
          >
            {saving ? 'AUTHORIZING...' : <><CheckCircle2 size={18} /> AUTHORIZE UPDATE</>}
          </button>
        </div>
      </form>
    </div>
  );
}
