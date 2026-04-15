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
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'attendance' | 'salaries'>('info');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [userRes, attendanceRes, salariesRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/payroll/staff/${id}/attendance`),
          api.get(`/expenses?category=Salaries&search=${id}`) // Searching by ID in description or staffId
        ]);
        setUserData(userRes.data);
        setAttendanceSummary(attendanceRes.data);
        setSalaries(Array.isArray(salariesRes.data) ? salariesRes.data : salariesRes.data?.data || []);
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch user profile:', err);
        showToast('Failed to load system user profile.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
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
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Specialist <span className="gradient-text">Intelligence Hub</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Comprehensive breakdown of clinical credentials, attendance logs, and financial records.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setActiveTab('info')}
            className={`glass-interactive ${activeTab === 'info' ? 'active-tab' : ''}`}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              background: activeTab === 'info' ? 'var(--primary)' : 'white',
              color: activeTab === 'info' ? 'white' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.8rem',
              border: '1.5px solid var(--border-subtle)'
            }}
          >
            IDENTITY
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`glass-interactive ${activeTab === 'attendance' ? 'active-tab' : ''}`}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              background: activeTab === 'attendance' ? 'var(--primary)' : 'white',
              color: activeTab === 'attendance' ? 'white' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.8rem',
              border: '1.5px solid var(--border-subtle)'
            }}
          >
            ATTENDANCE
          </button>
          <button
            onClick={() => setActiveTab('salaries')}
            className={`glass-interactive ${activeTab === 'salaries' ? 'active-tab' : ''}`}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              background: activeTab === 'salaries' ? 'var(--primary)' : 'white',
              color: activeTab === 'salaries' ? 'white' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.8rem',
              border: '1.5px solid var(--border-subtle)'
            }}
          >
            PAYSLIPS
          </button>
          <button
            onClick={() => router.push(`/users/${id}/edit`)}
            className="glass-interactive"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary)',
              color: 'white',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.8rem'
            }}
          >
            <Edit size={16} /> EDIT
          </button>
        </div>
      </div>

      {activeTab === 'info' && (
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
      )}

      {activeTab === 'attendance' && (
        <div className="attendance-report animate-scale-up">
           <div className="clinical-form-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                   <h3 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Attendance <span className="gradient-text">Transcript</span></h3>
                   <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Monthly operational persistence and clinical presence.</p>
                </div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                   <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 950, color: '#10b981' }}>{attendanceSummary?.summary?.totalPresent || 0}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>DAYS PRESENT</div>
                   </div>
                   <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--primary)' }}>{attendanceSummary?.summary?.totalDays || 0}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>MAPPING PERIOD</div>
                   </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                    <div key={day} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em', paddingBottom: '0.5rem' }}>{day}</div>
                ))}
                {attendanceSummary?.days && Object.entries(attendanceSummary.days).map(([day, data]: [string, any]) => (
                    <div key={day} style={{ 
                        aspectRatio: '1', 
                        borderRadius: 'var(--radius-sm)', 
                        border: '1px solid var(--border-subtle)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        background: data.status === 'Present' ? 'rgba(16, 185, 129, 0.05)' : data.isSunday ? 'rgba(0,0,0,0.02)' : 'rgba(239, 68, 68, 0.02)',
                        position: 'relative'
                    }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, position: 'absolute', top: '5px', left: '7px', opacity: 0.3 }}>{day}</span>
                        {data.status === 'Present' ? (
                            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                        ) : (
                            <Activity size={16} style={{ color: data.isSunday ? 'var(--text-muted)' : '#ef4444', opacity: 0.3 }} />
                        )}
                    </div>
                ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'salaries' && (
        <div className="salaries-report animate-scale-up">
           <div className="clinical-form-card">
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '2rem' }}>Salary <span className="gradient-text">Disbursement Ledger</span></h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {salaries.length === 0 ? (
                  <div style={{ padding: '4rem', textAlign: 'center', border: '2px dashed var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)', fontWeight: 700 }}>
                     No salary disbursement records found for this specialist.
                  </div>
                ) : (
                  salaries.map((s, idx) => (
                    <div key={idx} style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', background: '#f8fafc', border: '1.5px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <div style={{ width: '45px', height: '45px', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <Banknote size={24} />
                          </div>
                          <div>
                             <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>₹{s.amount?.toLocaleString()}</div>
                             <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{s.description}</div>
                          </div>
                       </div>
                       <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary)' }}>{new Date(s.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#10b981', mt: '0.2rem' }}>SUCCESSFULLY DISBURSED</div>
                       </div>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
