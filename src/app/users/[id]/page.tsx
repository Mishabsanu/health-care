'use client'
import React, { useState, useEffect, Activity } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Building2,
  ShieldCheck,
  Edit,
  Banknote,
  Download,
  FileText,
  Check,
  CalendarDays,
  Activity as ActivityIcon,
  ChevronRight,
  CheckCircle2,
  BadgeCheck,
  Info,
  Smartphone,
  Key,
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

  // Attendance Filtering State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(5, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Payroll Ledger State
  const [selectedSalYear, setSelectedSalYear] = useState(new Date().getFullYear().toString());
  const [selectedSalMonth, setSelectedSalMonth] = useState(new Date().toISOString().slice(5, 7));

  const fetchSalaries = async () => {
    try {
      // Use the new staffId parameter for precise filtering & increase limit for historical records
      const salariesRes = await api.get(`/expenses?category=Salaries&staffId=${id}&limit=100`);
      setSalaries(Array.isArray(salariesRes.data) ? salariesRes.data : salariesRes.data?.data || []);
    } catch (err) {
      console.error('🚫 Registry Error | Failed to fetch salaries:', err);
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userRes = await api.get(`/users/${id}`);
        setUserData(userRes.data);
        fetchSalaries();
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch user profile:', err);
        showToast('Failed to load system user profile.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [id, showToast]);

  useEffect(() => {
    if (activeTab === 'salaries') {
        fetchSalaries();
    }
  }, [activeTab]);

  // Optimized Attendance Fetcher
  useEffect(() => {
    if (activeTab !== 'attendance') return;

    const fetchAttendance = async () => {
      setAttendanceLoading(true);
      try {
        const res = await api.get(`/payroll/staff/${id}/attendance?month=${selectedMonth}&year=${selectedYear}`);
        setAttendanceSummary(res.data);
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch attendance:', err);
        showToast('Failed to load attendance logs for this period.', 'error');
      } finally {
        setAttendanceLoading(false);
      }
    };
    fetchAttendance();
  }, [id, activeTab, selectedMonth, selectedYear, showToast]);

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
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('info')}
            className="glass-interactive"
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'info' ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
              color: activeTab === 'info' ? 'white' : 'var(--text-main)',
              fontWeight: 800,
              fontSize: '0.75rem',
              border: activeTab === 'info' ? 'none' : '1px solid var(--border-subtle)',
              boxShadow: activeTab === 'info' ? '0 4px 12px rgba(13,148,136,0.3)' : 'none'
            }}
          >
            CREDENTIALS
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className="glass-interactive"
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'attendance' ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
              color: activeTab === 'attendance' ? 'white' : 'var(--text-main)',
              fontWeight: 800,
              fontSize: '0.75rem',
              border: activeTab === 'attendance' ? 'none' : '1px solid var(--border-subtle)',
              boxShadow: activeTab === 'attendance' ? '0 4px 12px rgba(13,148,136,0.3)' : 'none'
            }}
          >
            ATTENDANCE REPORT
          </button>
          <button
            onClick={() => setActiveTab('salaries')}
            className="glass-interactive"
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'salaries' ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
              color: activeTab === 'salaries' ? 'white' : 'var(--text-main)',
              fontWeight: 800,
              fontSize: '0.75rem',
              border: activeTab === 'salaries' ? 'none' : '1px solid var(--border-subtle)',
              boxShadow: activeTab === 'salaries' ? '0 4px 12px rgba(13,148,136,0.3)' : 'none'
            }}
          >
            PAYROLL LEDGER
          </button>
          <div style={{ width: '1px', background: 'var(--border-subtle)', margin: '0 0.5rem' }} />
          <button
            onClick={() => router.push(`/users/${id}/edit`)}
            className="glass-interactive"
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'white',
              color: 'var(--primary)',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              border: '1.5px solid var(--primary)'
            }}
          >
            <Edit size={14} /> MODIFY
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

                <div className="spec-block">
                  <label className="label-premium" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Banknote size={14} style={{ color: '#10b981' }} /> SALARY CONFIGURATION
                  </label>
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontWeight: 900, color: '#10b981', fontSize: '0.85rem' }}>{userData.salaryConfig?.type?.toUpperCase() || 'MONTHLY'} BASIS</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {userData.salaryConfig?.type === 'Monthly'
                        ? `Monthly: ₹${userData.salaryDetails?.basicSalary?.toLocaleString()}`
                        : `${userData.salaryConfig?.type} Rate: ₹${userData.salaryConfig?.rate?.toLocaleString()}`}
                    </div>
                  </div>
                </div>

                {/* 🛡️ NEW: KYC & BANKING SECTION */}
                <div className="spec-block" style={{ gridColumn: 'span 2', marginTop: '1rem', paddingTop: '2rem', borderTop: '1.5px solid #f1f5f9' }}>
                  <label className="label-premium" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                    <ShieldCheck size={16} /> PERSONNEL KYC & BANKING METRICS
                  </label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                      <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 950, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>AADHAAR CARD</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{userData.adharCard || 'NOT VERIFIED'}</div>
                      </div>
                      <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 950, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>PAN CARD</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{userData.panCard || 'NOT VERIFIED'}</div>
                      </div>
                      <div style={{ padding: '1rem', background: 'rgba(15, 118, 110, 0.04)', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 950, color: 'var(--primary)', marginBottom: '0.4rem' }}>OFFICIAL JOIN DATE</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>{userData.joinDate ? new Date(userData.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'NOT RECORDED'}</div>
                      </div>

                      <div style={{ gridColumn: 'span 3', padding: '1.25rem', background: 'white', borderRadius: '16px', border: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                              <div style={{ fontSize: '0.6rem', fontWeight: 950, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Disbursement Account</div>
                              <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '0.2rem' }}>{userData.bankName || 'Personal Bank Proxy'}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.6rem', fontWeight: 950, color: 'var(--text-muted)', textTransform: 'uppercase' }}>AC: {userData.accountNumber || 'PENDING'}</div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', marginTop: '0.2rem' }}>IFSC: {userData.ifscCode || 'PENDING'}</div>
                          </div>
                      </div>
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
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Attendance <span className="gradient-text">Transcript</span></h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>Operational persistence for {new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'white', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', outline: 'none' }}
                  >
                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => (
                      <option key={m} value={m}>{new Date(2000, parseInt(m) - 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'white', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', outline: 'none' }}
                  >
                    {[...Array(5)].map((_, i) => {
                      const y = (new Date().getFullYear() - i).toString();
                      return <option key={y} value={y}>{y}</option>;
                    })}
                  </select>
                </div>
                <div style={{ width: '1px', height: '30px', background: 'var(--border-subtle)' }} />
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
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem', marginBottom: '2rem' }}>
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                <div key={day} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em', paddingBottom: '0.4rem' }}>{day}</div>
              ))}
              {attendanceSummary?.days && Object.entries(attendanceSummary.days).map(([day, data]: [string, any]) => {
                const checkInTime = data.checkIn ? new Date(data.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : null;
                const checkOutTime = data.checkOut ? new Date(data.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : null;
                const hoverTitle = data.status === 'Present'
                  ? `Login: ${checkInTime} | Logout: ${checkOutTime || 'Active Session'}`
                  : data.isSunday ? 'Clinical Holiday (Sunday)' : 'No Record for this date';

                return (
                  <div key={day}
                    title={hoverTitle}
                    style={{
                      padding: '2.10rem 0',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: data.status === 'Present' ? 'rgba(16, 185, 129, 0.05)' : data.isSunday ? 'rgba(0,0,0,0.02)' : 'rgba(239, 68, 68, 0.02)',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      cursor: 'help'
                    }}
                    onMouseEnter={(e) => {
                      if (data.status === 'Present') {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (data.status === 'Present') {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    <span style={{ fontSize: '0.55rem', fontWeight: 900, position: 'absolute', top: '5px', left: '7px', opacity: 0.3 }}>{day}</span>
                    {data.status === 'Present' ? (
                      <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                    ) : (
                      <Activity size={14} style={{ color: data.isSunday ? 'var(--text-muted)' : '#ef4444', opacity: 0.3 }} />
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '12px', height: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '2px' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Clinical Presence Established</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '12px', height: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid #ef4444', borderRadius: '2px' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Absenteeism Recorded</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '12px', height: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Scheduled Off / Sunday</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'salaries' && (
        <div className="salaries-report animate-scale-up">
          <div className="clinical-form-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                   <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Payroll <span className="gradient-text">Ledger</span></h3>
                   <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>Management & Disbursement Analysis Archive</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                   <label style={{ fontSize: '0.75rem', fontWeight: 950, color: 'var(--text-muted)' }}>MAPPING YEAR:</label>
                   <select 
                      value={selectedSalYear}
                      onChange={(e) => setSelectedSalYear(e.target.value)}
                      style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1.5px solid var(--border-subtle)', background: 'white', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}
                   >
                       {[...Array(5)].map((_, i) => {
                          const y = (new Date().getFullYear() - i).toString();
                          return <option key={y} value={y}>{y}</option>;
                       })}
                   </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2.5rem', minHeight: '500px' }}>
                
                {/* 📅 LEFT: Month Explorer */}
                <div style={{ borderRight: '1.5px solid #f1f5f9', paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => {
                            const monthName = new Date(2000, parseInt(m)-1).toLocaleString('default', { month: 'long' });
                            const isPaid = salaries.some(s => s.description?.includes(`Period: ${m}-${selectedSalYear}`));
                            const isActive = selectedSalMonth === m;

                            // Join Date Validation logic
                            const joinDate = userData.joinDate ? new Date(userData.joinDate) : new Date(0);
                            const currentLoopDate = new Date(parseInt(selectedSalYear), parseInt(m) - 1, 1);
                            const isLocked = currentLoopDate < new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);

                            return (
                                <div 
                                    key={m}
                                    onClick={() => !isLocked && setSelectedSalMonth(m)}
                                    className={!isLocked ? "glass-interactive" : ""}
                                    style={{ 
                                        padding: '1rem 1.25rem', 
                                        borderRadius: '12px', 
                                        cursor: isLocked ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: isActive ? 'rgba(15, 118, 110, 0.06)' : 'transparent',
                                        border: isActive ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                                        opacity: isLocked ? 0.35 : 1,
                                        transition: 'all 0.2s ease',
                                        pointerEvents: isLocked ? 'none' : 'auto'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isPaid ? '#10b981' : (isLocked ? '#94a3b8' : '#e2e8f0') }} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 950 : 700, color: isActive ? 'var(--primary)' : 'var(--text-main)' }}>{monthName}</span>
                                    </div>
                                    {isPaid && <BadgeCheck size={16} style={{ color: '#10b981' }} />}
                                    {!isPaid && isLocked && <Key size={14} style={{ opacity: 0.5 }} />}
                                    {isActive && !isLocked && <ChevronRight size={14} style={{ color: 'var(--primary)' }} />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 📋 RIGHT: Payslip Detail Browser */}
                <div style={{ background: '#f8fafc', borderRadius: '24px', padding: '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1.5px dashed #e2e8f0' }}>
                    {(() => {
                        // More robust search (handle both leading zero and non-leading zero months if they exist)
                        const searchPatternFull = `Period: ${selectedSalMonth}-${selectedSalYear}`;
                        const searchPatternShort = `Period: ${parseInt(selectedSalMonth)}-${selectedSalYear}`;
                        
                        const payslip = salaries.find(s => 
                            s.description?.includes(searchPatternFull) || 
                            s.description?.includes(searchPatternShort)
                        );
                        
                        if (!payslip) {
                            return (
                                <div style={{ textAlign: 'center', maxWidth: '300px' }}>
                                    <div style={{ padding: '2rem', background: 'white', borderRadius: '50%', width: 'fit-content', margin: '0 auto 2rem', boxShadow: '0 10px 25px -10px rgba(0,0,0,0.05)' }}>
                                        <FileText size={48} style={{ opacity: 0.1 }} />
                                    </div>
                                    <h4 style={{ fontWeight: 950, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Payslip not yet released</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.6 }}>The clinical disbursement ledgers do not show a record for {new Date(2000, parseInt(selectedSalMonth)-1).toLocaleString('default', { month: 'long' })} {selectedSalYear} yet.</p>
                                </div>
                            );
                        }

                        // Detailed Breakdown Parsing
                        const desc = payslip.description || '';
                        const hoursLogged = desc.match(/Log: .* \/ (.*)h/)?.[1] || '0.0';

                        return (
                            <div className="payslip-preview-card" style={{ width: '100%', maxWidth: '600px', background: 'white', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1.5px solid #f1f5f9' }}>
                                {/* Payslip Header */}
                                <div style={{ padding: '2.5rem', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: 'white' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 950, letterSpacing: '0.1em', opacity: 0.6, marginBottom: '0.5rem' }}>OFFICIAL PAYSLIP</div>
                                            <h2 style={{ fontSize: '1.8rem', fontWeight: 950, margin: 0, letterSpacing: '-0.02em' }}>{new Date(2000, parseInt(selectedSalMonth)-1).toLocaleString('default', { month: 'long' }).toUpperCase()} {selectedSalYear}</h2>
                                        </div>
                                        <button 
                                            onClick={() => window.print()}
                                            className="glass-interactive"
                                            style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 800, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <Download size={14} /> DOWNLOAD
                                        </button>
                                    </div>
                                    <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.2rem' }}>SPECIALIST</div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 900 }}>{userData.name}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.2rem' }}>EMPLOYEE ID</div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 900 }}>{userData.employeeId || 'AKOD-PER'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.2rem' }}>LOGGED HRS</div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#10b981' }}>{hoursLogged}h Verified</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payslip Body */}
                                <div style={{ padding: '2.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1.5px solid #f1f5f9' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Net Disbursement Amout</span>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--text-main)' }}>₹ {payslip.amount?.toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                            <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>Payment Reference</span>
                                            <span style={{ fontWeight: 900, color: 'var(--primary)' }}>{payslip.id}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                            <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>Status</span>
                                            <span style={{ fontWeight: 900, color: '#10b981' }}>SUCCESSFULLY DISBURSED</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                            <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>Payment Method</span>
                                            <span style={{ fontWeight: 900 }}>{payslip.paymentMethod || 'Bank Transfer'}</span>
                                        </div>
                                        
                                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(15, 118, 110, 0.04)', borderRadius: '16px', border: '1px solid rgba(15, 118, 110, 0.1)' }}>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <Info size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 600 }}>
                                                    {payslip.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
