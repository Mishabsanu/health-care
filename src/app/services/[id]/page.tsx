'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Stethoscope, 
  Tag, 
  CreditCard, 
  Building2, 
  ShieldCheck, 
  Edit,
  Activity,
  Info,
  CalendarDays
} from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';

export default function ServiceDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const { showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<any>(null);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await api.get(`/services/${id}`);
        setService(res.data);
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch clinical service:', err);
        showToast('Failed to load treatment profile.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id, showToast]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin" />
      <p className="font-bold text-slate-400 animate-pulse text-xs tracking-widest">🛡️ ACCESSING CLINICAL REGISTRY...</p>
    </div>
  );

  if (!service) return (
    <div className="p-12 text-center font-bold text-slate-400">
      🚫 CLINICAL SERVICE NOT FOUND
    </div>
  );

  return (
    <div className="service-details-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>
      
      {/* 🏥 CLINICAL HEADER */}
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <button 
            onClick={() => router.push('/services')} 
            style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
          >
            <ArrowLeft size={16} /> Treatment Registry
          </button>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Service <span className="gradient-text">Profile</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Detailed clinical specifications, pricing, and treatment guidelines for this modality.</p>
        </div>
        <button
          onClick={() => router.push(`/services/${id}/edit`)}
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
          <Edit size={18} /> EDIT PROFILE
        </button>
      </div>

      <div className="clinical-form-grid">
        
        {/* LEFT COLUMN: Service Identity */}
        <div className="col-7">
          <div className="clinical-form-card" style={{ height: '100%' }}>
            
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '3rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '1.25rem', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2rem', boxShadow: '0 8px 16px rgba(13, 148, 136, 0.2)' }}>
                {service.name?.[0]}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>{service.name}</h2>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(15, 118, 110, 0.05)', padding: '0.3rem 0.75rem', borderRadius: '4px', border: '1px solid currentColor' }}>
                    {service.category?.toUpperCase() || 'MODALITY'}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: service.status === 'Available' ? '#10b981' : '#64748b', background: service.status === 'Available' ? '#dcfce7' : '#f1f5f9', padding: '0.3rem 0.75rem', borderRadius: '4px' }}>
                    {service.status?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginTop: '2rem' }}>
              <div className="spec-item">
                <label className="label-premium" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={14} style={{ color: 'var(--primary)' }} /> RATE PER SESSION
                </label>
                <div style={{ fontSize: '1.4rem', fontWeight: 950, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                  ₹{service.price?.toLocaleString()}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.25rem' }}>Fixed Clinical Standard Rate</p>
              </div>
              
              <div className="spec-item">
                <label className="label-premium" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Tag size={14} style={{ color: 'var(--primary)' }} /> DEPARTMENT
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {service.category || 'General Physiotherapy'}
                </div>
              </div>

              <div className="spec-item" style={{ gridColumn: 'span 2' }}>
                <label className="label-premium" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--primary)' }} /> CLINICAL ACCESS
                </label>
                <div style={{ padding: '1rem', background: '#f8fafc', border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                  This modality is authorized for Global Clinical Access across the unified clinical platform.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Metadata & Help */}
        <div className="col-5" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="clinical-form-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Activity size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 950, letterSpacing: '-0.01em' }}>TREATMENT SNAPSHOT</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <CalendarDays size={18} style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>REGISTRATION</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{service.createdAt ? new Date(service.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              
               <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <ShieldCheck size={18} style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>CLINICAL AUTHOR</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{service.createdBy?.name?.toUpperCase() || 'SYSTEM'}</span>
              </div>
            </div>

            <div style={{ marginTop: '2.5rem', padding: '1.25rem', background: 'rgba(15, 118, 110, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Info size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  This modality profile is <strong>Authoritative</strong>. Prices and clinical protocols are synchronized across the financial and scheduling modules. Use edits sparingly to maintain billing consistency.
                </p>
              </div>
            </div>
          </div>

          <div className="clinical-form-card" style={{ padding: '2rem', background: 'white' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1rem' }}>System Tags</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ padding: '0.4rem 0.8rem', background: '#f1f5f9', fontSize: '0.7rem', fontWeight: 800, borderRadius: '4px' }}>#PHYSIO</span>
              <span style={{ padding: '0.4rem 0.8rem', background: '#f1f5f9', fontSize: '0.7rem', fontWeight: 800, borderRadius: '4px' }}>#CLINICAL_MODALITY</span>
              <span style={{ padding: '0.4rem 0.8rem', background: '#f1f5f9', fontSize: '0.7rem', fontWeight: 800, borderRadius: '4px' }}>#REHABILITATION</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
