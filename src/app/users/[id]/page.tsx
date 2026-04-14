'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Building2,
  ShieldCheck,
  Edit,
  Activity,
  Info,
  Key,
  Smartphone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function UserDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const { showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        setUserData(res.data);
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch user profile:', err);
        showToast('Failed to load system user profile.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, showToast]);

  if (loading) return <LoadingSpinner />;

  if (!userData) return (
    <div className="p-12 text-center font-bold text-slate-400">
      🚫 SYSTEM USER NOT FOUND
    </div>
  );

  return (
    <div className="user-details-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>

      {/* 🏥 CLINICAL HEADER */}
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <button
            onClick={() => router.push('/users')}
            style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
          >
            <ArrowLeft size={16} /> Staff Registry
          </button>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Identity & <span className="gradient-text">Authorization</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Detailed breakdown of system user credentials, clinical roles, and authorization profiles.</p>
        </div>
        <button
          onClick={() => router.push(`/users/${id}/edit`)}
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
          <Edit size={18} /> EDIT AUTHORIZATION
        </button>
      </div>

      <div className="clinical-form-grid">

        {/* LEFT COLUMN: Identity & Role */}
        <div className="col-8">
          <div className="clinical-form-card" style={{ height: '100%' }}>

            <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', marginBottom: '3.5rem' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '2.5rem', background: '#f8fafc', border: '3px solid var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', boxShadow: '0 10px 25px -10px rgba(13, 148, 136, 0.3)' }}>
                {userData.name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 950, margin: 0, letterSpacing: '-0.03em' }}>{userData.name}</h2>
                  <span style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '2rem',
                    background: userData.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                    color: userData.status === 'Active' ? '#10b981' : '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    border: '1px solid currentColor'
                  }}>
                    {userData.status?.toUpperCase() || 'ACTIVE'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontWeight: 800, fontSize: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}><Shield size={18} /> {userData.role?.name || 'Authorized Staff'}</span>
                  <span style={{ height: '4px', width: '4px', borderRadius: '50%', background: 'var(--border-subtle)' }} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><Mail size={16} /> {userData.email}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '3rem' }}>
              <div className="spec-block" style={{ gridColumn: 'span 2' }}>
                <label className="label-premium" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Smartphone size={14} style={{ color: 'var(--primary)' }} /> SECURE COMMUNICATION
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', background: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-subtle)' }}>
                  {userData.phone || 'Phone registry unverified'}
                </div>
              </div>



              <div className="spec-block">
                <label className="label-premium" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Key size={14} style={{ color: 'var(--primary)' }} /> CLINIC EMPLOYEE ID
                </label>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', background: 'rgba(15, 118, 110, 0.05)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)', display: 'inline-block' }}>
                  {userData.employeeId || 'AKOD-PENDING'}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.5rem' }}>Internal clinical reference</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Operational Context */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div className="clinical-form-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 950, letterSpacing: '-0.01em' }}>AUTHORIZATION FEED</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>PATIENT REGISTRY</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#10b981' }}>AUTHORIZED</span>
              </div>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>CLINICAL BILLING</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: userData.role?.name === 'Admin' ? '#10b981' : '#64748b' }}>
                  {userData.role?.name === 'Admin' ? 'AUTHORIZED' : 'RESTRICTED'}
                </span>
              </div>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>AUDIT LOGS</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: userData.role?.name === 'Admin' ? '#10b981' : '#64748b' }}>
                  {userData.role?.name === 'Admin' ? 'AUTHORIZED' : 'RESTRICTED'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ padding: '2rem', background: userData.status === 'Active' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-lg)', border: `1.5px dashed ${userData.status === 'Active' ? '#10b981' : '#ef4444'}` }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {userData.status === 'Active' ? <CheckCircle2 size={24} style={{ color: '#10b981' }} /> : <AlertCircle size={24} style={{ color: '#ef4444' }} />}
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: userData.status === 'Active' ? '#10b981' : '#ef4444' }}>
                  {userData.status === 'Active' ? 'SECURITY VERIFIED' : 'ACCESS SUSPENDED'}
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
                  {userData.status === 'Active' ? 'This user has active authentication tokens.' : 'This user cannot authenticate with clinical services.'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(15, 118, 110, 0.05)', border: '1px dashed var(--primary)' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Info size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                This is a <strong>Security-Primary</strong> view. Role changes will affect system-wide navigation and clinical data isolation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
