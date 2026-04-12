'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Stethoscope, 
  Smartphone, 
  Building2, 
  ShieldCheck, 
  Edit,
  Activity,
  Info,
  Calendar,
  Award,
  Hash
} from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';

export default function DoctorDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const { showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<any>(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await api.get(`/doctors/${id}`);
        setDoctor(res.data);
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch specialist record:', err);
        showToast('Failed to load specialist profile.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id, showToast]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin" />
      <p className="font-bold text-slate-400 animate-pulse text-xs tracking-widest">🛡️ SYNCHRONIZING PERSONNEL DATA...</p>
    </div>
  );

  if (!doctor) return (
    <div className="p-12 text-center font-bold text-slate-400">
      🚫 SPECIALIST RECORD NOT FOUND
    </div>
  );

  return (
    <div className="doctor-details-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>
      
      {/* 🏥 CLINICAL HEADER */}
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <button 
            onClick={() => router.push('/doctors')} 
            style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
          >
            <ArrowLeft size={16} /> Specialist Registry
          </button>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Specialist <span className="gradient-text">Profile</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Detailed medical credentials, operational status, and clinical background.</p>
        </div>
        <button
          onClick={() => router.push(`/doctors/${id}/edit`)}
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
          <Edit size={18} /> MODIFY PROFILE
        </button>
      </div>

      <div className="clinical-form-grid">
        
        {/* LEFT COLUMN: Identity & Credentials */}
        <div className="col-8">
          <div className="clinical-form-card" style={{ height: '100%' }}>
            
            <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', marginBottom: '3.5rem' }}>
              <div style={{ width: '110px', height: '110px', borderRadius: '2rem', background: '#f8fafc', border: '3px solid var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', boxShadow: '0 10px 25px -10px rgba(13, 148, 136, 0.3)' }}>
                {doctor.name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 950, margin: 0, letterSpacing: '-0.03em' }}>{doctor.name}</h2>
                  <span style={{ 
                    padding: '0.4rem 1rem', 
                    borderRadius: '2rem', 
                    background: doctor.status === 'Available' ? '#dcfce7' : '#f1f5f9',
                    color: doctor.status === 'Available' ? '#10b981' : '#64748b',
                    fontSize: '0.75rem', 
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    border: '1px solid currentColor'
                  }}>
                    {doctor.status?.toUpperCase() || 'ACTIVE'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', color: 'var(--primary)', fontWeight: 800, fontSize: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={18} /> {doctor.specialization}</span>
                  <span style={{ height: '4px', width: '4px', borderRadius: '50%', background: 'var(--border-subtle)' }} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><Hash size={16} /> REG-ID: {String(id).slice(-6).toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '3rem' }}>
              <div className="spec-block">
                <label className="label-premium" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Smartphone size={14} style={{ color: 'var(--primary)' }} /> SECURE CONTACT
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-subtle)' }}>
                  {doctor.phone || 'Contact not verified'}
                </div>
              </div>

              <div className="spec-block">
                <label className="label-premium" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} style={{ color: 'var(--primary)' }} /> CLINICAL ONBOARDING
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-subtle)' }}>
                  {new Date(doctor.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              <div className="spec-block">
                <label className="label-premium" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--primary)' }} /> CLINICAL AUTHOR
                </label>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(15, 118, 110, 0.05)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--primary)' }}>
                  {doctor.createdBy?.name?.toUpperCase() || 'SYSTEM REGISTRY'}
                </div>
              </div>

              <div className="spec-block" style={{ gridColumn: 'span 2' }}>
                <label className="label-premium" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--primary)' }} /> CLINICAL AUTHORIZATION
                </label>
                <div style={{ padding: '1.5rem', background: 'white', border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary)' }}>
                  This specialist is authorized for Global Clinical Access across the unified clinical platform.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Operational Context */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="clinical-form-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 950, letterSpacing: '-0.01em' }}>ACCESS PERMISSIONS</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>SCHEDULER ACCESS</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#10b981' }}>AUTHORIZED</span>
              </div>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>PATIENT RECORDS</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#10b981' }}>AUTHORIZED</span>
              </div>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>BILLING AUTHORITY</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b' }}>RESTRICTED</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '2rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', borderRadius: 'var(--radius-lg)', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <Activity size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1 }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Info size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>System Note</h3>
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.6, fontWeight: 600, opacity: 0.9 }}>
                Specialist assignments affect patient scheduling availability. Maintain accurate status updates to prevent clinical scheduling conflicts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
