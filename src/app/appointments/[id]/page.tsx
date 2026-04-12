'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  Stethoscope, 
  CheckCircle2, 
  Building, 
  MessageCircle, 
  ClipboardList, 
  Activity, 
  Edit,
  Smartphone,
  Info
} from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';

export default function AppointmentDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const res = await api.get(`/appointments/${id}`);
        setAppointment(res.data);
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch appointment:', err);
        showToast('Failed to load clinical booking.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [id, showToast]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin" />
      <p className="font-bold text-slate-400 animate-pulse text-xs tracking-widest">🛡️ ACCESSING SCHEDULER VAULT...</p>
    </div>
  );

  if (!appointment) return (
    <div className="p-12 text-center font-bold text-slate-400">
      🚫 CLINICAL BOOKING NOT FOUND
    </div>
  );

  const patient = appointment.patientId;
  const doctor = appointment.doctorId;
  const branch = appointment.branch;

  return (
    <div className="appointment-details-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>
      
      {/* 🏥 CLINICAL HEADER */}
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <button 
            onClick={() => router.push('/appointments')} 
            style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
          >
            <ArrowLeft size={16} /> Scheduler Dashboard
          </button>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Booking <span className="gradient-text">Verification</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Comprehensive breakdown of the scheduled clinical session and specialist assignment.</p>
        </div>
        <button
          onClick={() => router.push(`/appointments/${id}/edit`)}
          className="glass-interactive"
          style={{ 
            padding: '0.85rem 2rem', 
            borderRadius: 'var(--radius-md)', 
            background: 'var(--primary)', 
            color: 'white', 
            fontWeight: 800, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.4)'
          }}
        >
          <Edit size={18} /> MODIFY BOOKING
        </button>
      </div>

      <div className="clinical-form-grid">
        
        {/* LEFT COLUMN: Main Logistics */}
        <div className="col-8">
          <div className="clinical-form-card" style={{ height: '100%' }}>
            
            {/* STATUS RIBBON */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '1rem 1.5rem', 
              background: '#f8fafc', 
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid var(--primary)',
              marginBottom: '2.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Activity size={20} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 850, fontSize: '0.9rem', color: 'var(--primary)' }}>BOOKING STATUS:</span>
              </div>
              <span style={{ 
                padding: '0.5rem 1.25rem', 
                borderRadius: '2rem', 
                background: appointment.status === 'Completed' ? '#dcfce7' : appointment.status === 'Cancelled' ? '#fee2e2' : '#fef9c3',
                color: appointment.status === 'Completed' ? '#10b981' : appointment.status === 'Cancelled' ? '#ef4444' : '#854d0e',
                fontWeight: 900,
                fontSize: '0.75rem',
                border: '1px solid currentColor'
              }}>
                {appointment.status?.toUpperCase() || 'BOOKED'}
              </span>
            </div>

            {/* LOGISTICS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="logistics-item">
                <label className="label-premium" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ClipboardList size={14} style={{ color: 'var(--primary)' }} /> SESSION CATEGORY
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', background: '#f1f5f9', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  {appointment.type || 'Clinical Consultation'}
                </div>
              </div>
              <div className="logistics-item">
                <label className="label-premium" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building size={14} style={{ color: 'var(--primary)' }} /> CLINICAL SITE
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', background: '#f1f5f9', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  {branch?.name || 'Global Access'}
                </div>
              </div>
              <div className="logistics-item">
                <label className="label-premium" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} style={{ color: 'var(--primary)' }} /> SCHEDULED DATE
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', background: '#f1f5f9', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  {new Date(appointment.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div className="logistics-item">
                <label className="label-premium" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={14} style={{ color: 'var(--primary)' }} /> SESSION TIME
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', background: '#f1f5f9', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  {appointment.time || 'NOT SCHEDULED'}
                </div>
              </div>
            </div>

            {/* REMARKS */}
            <div style={{ marginTop: '3rem' }}>
              <label className="label-premium" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageCircle size={14} style={{ color: 'var(--primary)' }} /> CLINICAL REMARKS
              </label>
              <p style={{ 
                padding: '1.5rem', 
                background: 'rgba(15, 118, 110, 0.03)', 
                borderRadius: 'var(--radius-md)', 
                fontSize: '1rem', 
                color: 'var(--text-main)', 
                lineHeight: 1.7,
                fontWeight: 500,
                border: '1.5px solid var(--border-subtle)'
              }}>
                {appointment.description || 'No clinical remarks recorded for this session.'}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Entity Cards */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* PATIENT CARD */}
          <div className="clinical-form-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <User size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '-0.01em' }}>PATIENT LINKAGE</h3>
            </div>
            <div 
              onClick={() => router.push(`/patients/${patient?._id}`)}
              className="glass-interactive"
              style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: '#f8fafc', border: '1.5px solid var(--border-subtle)', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                  {patient?.name?.[0] || 'P'}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 850, color: 'var(--primary)' }}>{patient?.name || appointment.patientName}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.6, fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    <Smartphone size={12} /> {patient?.phone || 'NO CONTACT'}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                VERIFIED CLINICAL FILE
              </div>
            </div>
          </div>

          {/* DOCTOR CARD */}
          <div className="clinical-form-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Stethoscope size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '-0.01em' }}>ASSIGNED SPECIALIST</h3>
            </div>
            <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: '#f8fafc', border: '1.5px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800, fontSize: '1.1rem', border: '2px solid var(--primary)' }}>
                  {doctor?.name?.[0] || 'D'}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 850 }}>{doctor?.name || appointment.doctorName}</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800 }}>{doctor?.specialization || 'Clinical Specialist'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* HELP INFO */}
          <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)', border: '1px dashed var(--primary)' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Info size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                This is a <strong>read-only security view</strong> of the appointment. To change dates or assign a different specialist, please use the <em>Modify Booking</em> option above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
