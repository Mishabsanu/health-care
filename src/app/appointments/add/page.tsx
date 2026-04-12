'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Building,
  Search,
  UserCheck,
  AlertCircle,
  ChevronRight,
  MessageCircle,
  Stethoscope,
  Info,
  ClipboardList
} from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import ClinicalSearchSelect from '@/components/ClinicalSearchSelect';

export default function BookAppointmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  const { showToast } = usePCMSStore();
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    type: 'Consultation',
    status: 'Booked',
    description: ''
  });

  const selectedPatient = patients.find(p => p._id === formData.patientId);
  const selectedDoctor = doctors.find(d => d._id === formData.doctorId);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
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
  };

  const isFormValid = formData.patientId && formData.date;

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

      <form onSubmit={handleSubmit} className="clinical-form-card" style={{ opacity: loading ? 0.7 : 1 }}>
        <div className="clinical-form-grid">

          {/* Section 1: Patient Identification (Simplified UX) */}
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
                   <div className="col-12" style={{ marginBottom: '2rem' }}>
            <ClinicalSearchSelect 
              label="Search Clinical Registry *"
              options={patients}
              value={formData.patientId}
              placeholder="Search File (Name / Phone / Patient ID)..."
              searchFields={['name', 'phone', 'patientId']}
              onSelect={(p) => setFormData({ ...formData, patientId: p._id })}
              onClear={() => setFormData({ ...formData, patientId: '' })}
              icon={<Search size={18} />}
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

            {formData.patientId && (
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
                    {selectedPatient?.name?.[0]}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.1rem' }}>
                       <p style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.25rem', letterSpacing: '-0.01em' }}>{selectedPatient?.name}</p>
                       <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '2rem' }}>VERIFIED FILE</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Selected Record: {selectedPatient?.phone} • [#{selectedPatient?.patientId || 'N/A'}]</p>
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>

          {/* Section 2: Clinical Details */}
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
          <div className="col-6">
            <ClinicalSearchSelect 
              label="Medical Specialist"
              options={doctors}
              value={formData.doctorId}
              placeholder="Search Specialist..."
              searchFields={['name', 'specialization']}
              onSelect={(d) => setFormData({ ...formData, doctorId: d._id })}
              onClear={() => setFormData({ ...formData, doctorId: '' })}
              icon={<Stethoscope size={16} />}
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
              <Clock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input type="time" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
            </div>
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
              className="textarea-premium"
              placeholder="Add final clinical notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              disabled={!isFormValid || loading}
              style={{
                padding: '0.85rem 3.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary)',
                color: 'white',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)',
                opacity: !isFormValid ? 0.5 : 1
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
