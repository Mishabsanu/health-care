'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Stethoscope, Phone, Mail, Building, Activity, MessageCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';

export default function EditDoctorPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, setIsSyncing, showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    phone: '',
    email: '',
    status: '',
    remarks: ''
  });

  // -------------------------------------------------------------------
  // SYNC | Fetch Clinical Specialist Profile & Sites
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      setIsSyncing(true);
      try {
        const docRes = await api.get(`/doctors/${id}`);
        
        const doctor = docRes.data;
        if (doctor) {
          setFormData({
            name: doctor.name,
            specialization: doctor.specialization,
            phone: doctor.phone,
            email: doctor.email || '',
            status: doctor.status,
            remarks: doctor.remarks || ''
          });
        }
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch specialist profile:', err);
        showToast('Failed to load specialist profile.', 'error');
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
      const payload: any = { ...formData };
      
      await api.put(`/doctors/${id}`, payload);
      showToast('Specialist registry updated successfully.', 'success');
      router.push('/doctors');
    } catch (err) {
      console.error('🚫 Registry Error | Failed to update clinical specialist:', err);
      showToast('Update failed. Please check medical personnel data.', 'error');
    } finally {
      setSaving(false);
      setIsSyncing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin" />
      <p className="font-bold text-slate-400 animate-pulse text-xs tracking-widest">🛡️ ACCESSING SPECIALIST REGISTRY...</p>
    </div>
  );

  return (
    <div className="edit-doctor-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>
      
      {/* 🏥 CLINICAL HEADER */}
      <div style={{ marginBottom: '3rem' }}>
        <button 
          onClick={() => router.back()} 
          style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
        >
          <ArrowLeft size={16} /> Specialist Registry
        </button>
        <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Modify Specialist <span className="gradient-text">Credentials</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Update medical specialist profile and operational status.</p>
      </div>

      <form onSubmit={handleSubmit} className="clinical-form-card" style={{ opacity: saving ? 0.7 : 1 }}>
        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', marginBottom: '2.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderLeft: '4px solid var(--primary)', fontWeight: 600 }}>
           Registry Reference: <strong style={{ color: 'var(--primary)' }}>{id}</strong> • Verified Clinical Personnel File
        </div>

        <div className="clinical-form-grid">
           {/* Section 1: Specialist Identity */}
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
            <Stethoscope size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Specialist <span className="gradient-text">Identity</span>
            </h3>
          </div>

          <div className="col-8">
            <label className="label-premium">Specialist Full Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input required disabled={saving} type="text" className="input-premium" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Full clinical name..." />
          </div>
          <div className="col-4">
            <label className="label-premium">Medical Specialization <span style={{ color: '#ef4444' }}>*</span></label>
            <input required disabled={saving} type="text" className="input-premium" value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})} placeholder="e.g. Physiotherapist" />
          </div>

          <div className="col-4">
            <label className="label-premium">Access Email <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input required disabled={saving} type="email" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="specialist@clinic.com" />
            </div>
          </div>
          <div className="col-4">
            <label className="label-premium">Contact Vector <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input required disabled={saving} type="text" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="9876543210" />
            </div>
          </div>
          <div className="col-8">
            <label className="label-premium">Professional Credential Hash</label>
            <div style={{ position: 'relative' }}>
              <ShieldCheck size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
              <div className="input-premium" style={{ paddingLeft: '2.75rem', background: '#f8fafc', color: 'var(--primary)', fontWeight: 800 }}>
                {String(id).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Parameters */}
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
            <Activity size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Operational <span className="gradient-text">Parameters</span>
            </h3>
          </div>

          <div className="col-12">
            <label className="label-premium">Professional Availability</label>
            <select className="input-premium" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} style={{ fontWeight: 800, color: 'var(--primary)' }}>
              <option value="Available">Available for Consultations</option>
              <option value="On Leave">Currently On Leave</option>
              <option value="Busy">Shift Occupied</option>
            </select>
          </div>

          <div className="col-12">
            <label className="label-premium">Clinical Profile Bio / Remarks</label>
            <div style={{ position: 'relative' }}>
              <MessageCircle size={16} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
              <textarea
                className="textarea-premium"
                style={{ paddingLeft: '2.75rem', minHeight: '120px' }}
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                placeholder="Add medical focus areas, certifications, or internal notes..."
              />
            </div>
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
            {saving ? 'SYNCHRONIZING...' : <><CheckCircle2 size={18} /> AUTHORIZE UPDATE</>}
          </button>
        </div>
      </form>
    </div>
  );
}
