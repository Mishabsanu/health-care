'use client'
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import {
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    CircleDot,
    ClipboardList,
    Clock,
    CreditCard,
    Edit,
    FileText,
    LayoutGrid,
    MapPin,
    Plus,
    Printer,
    Ruler,
    Stethoscope,
    TrendingUp,
    Weight,
    Flame,
    ShieldAlert,
    Cigarette,
    GlassWater,
    Dumbbell,
    Leaf,
    Activity
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Treatment {
  date: string;
  complaint: string;
  notes: string;
  specialist?: { name: string };
}

interface MedicalDoc {
    name: string;
    url: string;
    date: string;
    type: string;
}

interface Patient {
  _id: string;
  patientId: string;
  name: string;
  phone: string;
  age: number;
  gender: string;
  address: string;
  reasonForVisit: string;
  bmi: number;
  weight: number;
  height: number;
  habits: string[];
  lastVisit: string;
  status: string;
  treatments: Treatment[];
  documents: MedicalDoc[];
}

export default function PatientDetailsPage() {
  const router = useRouter();
  const { user } = usePCMSStore();
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'billing' | 'docs'>('overview');
  const [invoices, setInvoices] = useState<any[]>([]);
  
  // Document State
  const [isUploading, setIsUploading] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Clinical');
  const [showDocModal, setShowDocModal] = useState(false);
  
  // Treatment Modal State
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [treatmentComplaint, setTreatmentComplaint] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPatient = async () => {
    try {
      const [ptRes, invRes] = await Promise.all([
          api.get(`/patients/${id}`),
          api.get(`/invoices?search=${id}`) // Search by patient ID or name
      ]);
      setPatient(ptRes.data);
      // Filter invoices locally if the backend search is generic
      let invoiceList = invRes.data?.data || invRes.data;
      if (!Array.isArray(invoiceList)) {
          invoiceList = [];
      }
      const ptInvoices = invoiceList.filter((inv: any) => 
        inv.patientId?._id === id || inv.patientId === id
      );
      setInvoices(ptInvoices);
    } catch (err) {
      console.error('🚫 Registry Error | Failed to fetch patient file:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const handleAddTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatmentNotes.trim()) return;

    setSubmitting(true);
    try {
      await api.post(`/patients/${id}/treatments`, {
        notes: treatmentNotes,
        complaint: treatmentComplaint || patient?.reasonForVisit
      });
      setTreatmentNotes('');
      setTreatmentComplaint('');
      setShowTreatmentModal(false);
      await fetchPatient();
    } catch (err) {
      console.error('🚫 Clinical Error | Failed to log treatment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', docName || file.name);
    formData.append('type', docType);

    setIsUploading(true);
    try {
        await api.post(`/patients/${id}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        setDocName('');
        setShowDocModal(false);
        await fetchPatient();
    } catch (err) {
        console.error('🚫 Document Error | Upload failed:', err);
    } finally {
        setIsUploading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!patient) return <div className="p-12 text-center font-bold text-slate-400">🚫 PATIENT REGISTRY NOT FOUND</div>;

  const getBMICategory = (val: number) => {
    if (val < 18.5) return { label: 'UNDERWEIGHT', color: '#3b82f6', percent: Math.min((val / 18.5) * 25, 25) };
    if (val <= 24.9) return { label: 'HEALTHY', color: '#10b981', percent: 25 + ((val - 18.5) / 6.4) * 25 };
    if (val <= 29.9) return { label: 'OVERWEIGHT', color: '#f59e0b', percent: 50 + ((val - 25) / 4.9) * 25 };
    return { label: 'OBESE', color: '#ef4444', percent: 75 + Math.min(((val - 30) / 10) * 25, 25) };
  };

  const bmiMeta = getBMICategory(patient.bmi || 0);

  // Latest Treatment first
  const sortedTreatments = [...(patient.treatments || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestTreatment = sortedTreatments[0];

  return (
    <div className="patient-pro-workspace animate-fade-in" style={{ paddingBottom: '5rem' }}>
      
      {/* 🧭 NAVIGATION BREADCRUMB */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button
          onClick={() => router.push('/patients')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> BACK TO PATIENT REGISTRY
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="glass-interactive" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'white', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Printer size={16} /> PRINT FILE
            </button>
        </div>
      </div>

      {/* 🆔 PATIENT IDENTITY CARD (HEADER) */}
      <div className="glass-premium" style={{ 
        padding: '1.75rem 2.5rem', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--border-subtle)', 
        background: 'white',
        boxShadow: '0 15px 30px -10px rgba(0,0,0,0.04)',
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Identity Glow */}
        <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '200px', height: '200px', background: 'var(--primary)', filter: 'blur(100px)', opacity: 0.1, pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ width: '96px', height: '96px', borderRadius: '1.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '2.5rem', fontWeight: 900, boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.4)' }}>
                    {patient.name.charAt(0)}
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0, color: 'var(--text-main)' }}>{patient.name}</h1>
                        <span style={{ 
                            padding: '0.3rem 1rem', 
                            borderRadius: '2rem', 
                            background: patient.status === 'Critical' ? '#fee2e2' : patient.status === 'Stable' ? '#dcfce7' : '#e0f2fe',
                            color: patient.status === 'Critical' ? '#ef4444' : patient.status === 'Stable' ? '#10b981' : '#0ea5e9',
                            fontSize: '0.7rem', 
                            fontWeight: 900,
                            letterSpacing: '0.05em',
                            border: '1px solid currentColor'
                        }}>
                            {patient.status?.toUpperCase() || 'STABLE'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', opacity: 0.7 }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary)' }}>#{patient.patientId}</span>
                        <span style={{ height: '4px', width: '4px', borderRadius: '50%', background: 'var(--border-subtle)' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{patient.age}Y • {patient.gender.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={() => router.push(`/patients/${id}/edit`)}
                    className="glass-interactive"
                    style={{ padding: '0.85rem 1.75rem', borderRadius: 'var(--radius-md)', border: '2.5px solid var(--border-subtle)', background: 'white', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
                >
                    <Edit size={18} /> EDIT PROFILE
                </button>
                <button
                    onClick={() => setShowTreatmentModal(true)}
                    className="glass-interactive"
                    style={{ background: 'var(--primary)', color: 'white', padding: '0.85rem 2rem', borderRadius: 'var(--radius-md)', fontWeight: 900, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.4)' }}
                >
                    <Plus size={20} /> NEW TREATMENT
                </button>
            </div>
        </div>

        {/* RECOVERY TRACKER STRIP */}
        <div style={{ marginTop: '2.5rem', paddingTop: '2.5rem', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>REGISTRATION DATE</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{new Date(patient.lastVisit).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TOTAL SESSIONS</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>{patient.treatments?.length || 0} TOTAL SESSIONS VISIT</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CONTACT VERIFIED</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                    <CheckCircle2 size={16} /> {patient.phone}
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>PRIMARY COMPLAINT</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{patient.reasonForVisit || 'Follow-up Care'}</span>
            </div>
        </div>
      </div>

      {/* 📑 TABBED WORKSPACE NAVIGATION */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid var(--border-subtle)' }}>
        {[
            { id: 'overview', label: 'DASHBOARD', icon: LayoutGrid, show: true },
            { id: 'timeline', label: 'CLINICAL HISTORY', icon: Clock, show: true },
            { id: 'billing', label: 'BILLING & INVOICES', icon: CreditCard, show: user?.allAccess || user?.roleName?.toLowerCase() === 'admin' },
            { id: 'docs', label: 'MEDICAL DOCUMENTS', icon: FileText, show: true }
        ].filter(t => t.show).map((tab) => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{ 
                    padding: '1rem 1.5rem', 
                    fontSize: '0.8rem', 
                    fontWeight: 900, 
                    color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    transition: 'var(--transition-smooth)'
                }}
            >
                <tab.icon size={18} />
                {tab.label}
                {activeTab === tab.id && (
                    <div style={{ position: 'absolute', bottom: '-2px', left: 0, width: '100%', height: '3px', background: 'var(--primary)', borderRadius: '3px' }} />
                )}
            </button>
        ))}
      </div>

      {/* 🚀 TAB CONTENT WORKSPACE */}
      <div className="tab-content-area">
        {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '1.5rem' }}>
                {/* 📊 LEFT: CLINICAL METRICS */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card-premium" style={{ padding: '1.75rem', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, letterSpacing: '0.02em' }}>CLINICAL <span className="gradient-text">VITALS</span></h3>
                            <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
                        </div>
                        
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>BODY MASS INDEX (BMI)</span>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 900, background: `${bmiMeta.color}15`, color: bmiMeta.color, padding: '0.25rem 0.75rem', borderRadius: '1rem', border: `1px solid ${bmiMeta.color}` }}>{bmiMeta.label}</span>
                                </div>
                                
                                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '-0.04em' }}>{patient.bmi || '0.0'}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>kg/m²</span>
                                </div>

                                {/* 🌡️ BMI HEALTH SCALE */}
                                <div style={{ position: 'relative', height: '8px', background: 'linear-gradient(to right, #3b82f6 0%, #3b82f6 25%, #10b981 25.1%, #10b981 50%, #f59e0b 50.1%, #f59e0b 75%, #ef4444 75.1%, #ef4444 100%)', borderRadius: '4px', marginBottom: '1rem' }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '-4px',
                                        left: `${bmiMeta.percent}%`,
                                        width: '16px',
                                        height: '16px',
                                        background: 'white',
                                        border: `3px solid ${bmiMeta.color}`,
                                        borderRadius: '50%',
                                        transform: 'translateX(-50%)',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                        zIndex: 2,
                                        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                    }} />
                                    <div style={{ position: 'absolute', top: '15px', width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', opacity: 0.8 }}>
                                        <span>15</span>
                                        <span>18.5</span>
                                        <span>25</span>
                                        <span>30</span>
                                        <span>40</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <Weight size={14} style={{ opacity: 0.4 }} />
                                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)' }}>WEIGHT</span>
                                    </div>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>{patient.weight} <small style={{ fontSize: '0.65rem', opacity: 0.5 }}>KG</small></span>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <Ruler size={14} style={{ opacity: 0.4 }} />
                                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)' }}>HEIGHT</span>
                                    </div>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>{patient.height} <small style={{ fontSize: '0.65rem', opacity: 0.5 }}>CM</small></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-premium" style={{ padding: '1.75rem', background: 'white' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '0.02em' }}>CLINICAL <span className="gradient-text">HABITS</span></h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {[
                                { name: 'Smoking', icon: Cigarette, color: '#ef4444' },
                                { name: 'Alcohol', icon: GlassWater, color: '#f59e0b' },
                                { name: 'Exercise', icon: Dumbbell, color: '#10b981' },
                                { name: 'Tobacco', icon: ShieldAlert, color: '#ef4444' },
                                { name: 'Vegetarian', icon: Leaf, color: '#10b981' },
                                { name: 'Non-Veg', icon: Flame, color: '#ef4444' }
                            ].map(habit => {
                                const hasHabit = patient.habits?.some(h => h.toLowerCase().includes(habit.name.toLowerCase()));
                                return (
                                    <div key={habit.name} style={{ 
                                        padding: '0.75rem', 
                                        borderRadius: 'var(--radius-md)', 
                                        border: '1px solid var(--border-subtle)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        background: hasHabit ? `${habit.color}08` : '#f8fafc',
                                        opacity: hasHabit ? 1 : 0.4
                                    }}>
                                        <habit.icon size={16} style={{ color: hasHabit ? habit.color : 'var(--text-muted)' }} />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: hasHabit ? 'var(--text-main)' : 'var(--text-muted)' }}>{habit.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                        {(!patient.habits || patient.habits.length === 0) && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>No habits recorded in clinical file.</p>
                        )}
                    </div>
                </aside>

                {/* 📋 RIGHT: CLINICAL NOTES & RECENT SESSIONS */}
                <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card-premium" style={{ padding: '2rem', background: 'white', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.03 }}>
                             <Stethoscope size={160} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <Flame size={24} style={{ color: '#ef4444' }} />
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 950, letterSpacing: '-0.02em' }}>PRIMARY CLINICAL <span className="gradient-text">COMPLAINT</span></h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <p style={{ background: 'rgba(15, 118, 110, 0.03)', borderLeft: '4px solid var(--primary)', padding: '1.5rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.8, borderRadius: '0 1rem 1rem 0' }}>
                                {patient.reasonForVisit}
                            </p>
                            {latestTreatment && (
                                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ padding: '0.5rem', background: 'var(--primary)', color: 'white', borderRadius: '0.5rem' }}>
                                        <Activity size={18} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>LATEST CLINICAL ASSESSMENT</p>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{latestTreatment.complaint}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card-premium" style={{ padding: '2rem', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                             <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <ClipboardList size={22} style={{ color: 'var(--primary)' }} />
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 950, letterSpacing: '-0.02em' }}>RECENT TREATMENT <span className="gradient-text">NOTES</span></h3>
                             </div>
                             <button onClick={() => setActiveTab('timeline')} style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                FULL HISTORY <ChevronRight size={16} />
                             </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {sortedTreatments.slice(0, 3).map((t, i) => (
                                <div key={i} style={{ 
                                    background: i === 0 ? 'rgba(15, 118, 110, 0.02)' : 'transparent',
                                    border: i === 0 ? '1px solid var(--border-subtle)' : 'none',
                                    borderRadius: '1rem',
                                    padding: i === 0 ? '1.5rem' : '0 0.5rem 1.25rem',
                                    borderBottom: i !== 0 ? '1.5px solid var(--border-subtle)' : '1px solid var(--border-subtle)',
                                    position: 'relative'
                                }}>
                                    {i === 0 && (
                                        <span style={{ position: 'absolute', top: '-10px', right: '20px', background: 'var(--primary)', color: 'white', fontSize: '0.6rem', fontWeight: 900, padding: '0.2rem 0.8rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(13, 148, 136, 0.2)' }}>LATEST SESSION</span>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-main)' }}>{new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.4 }}>REF SESSION #{sortedTreatments.length - i}</span>
                                    </div>
                                    <p style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 500, lineHeight: 1.7, margin: 0 }}>{t.notes}</p>
                                </div>
                            ))}
                            {(!sortedTreatments || sortedTreatments.length === 0) && (
                                <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.3 }}>
                                    <FileText size={48} style={{ margin: '0 auto 1rem' }} />
                                    <p style={{ fontWeight: 700 }}>NO SESSIONS JOURNALED YET</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        )}

        {activeTab === 'timeline' && (
            <div className="animate-fade-in">
                <div className="card-premium" style={{ padding: '3rem', background: 'white' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                            <div style={{ width: '48px', height: '48px', background: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <Clock size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '0.5rem' }}>Clinical Treatment Timeline</h2>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>The complete medical record and physiotherapeutic progress log.</p>
                        </div>

                        <div style={{ position: 'relative', paddingLeft: '3rem', borderLeft: '3px solid var(--border-subtle)' }}>
                            {patient.treatments?.map((t, i) => (
                                <div key={i} style={{ position: 'relative', marginBottom: '3.5rem' }}>
                                    <div style={{ position: 'absolute', left: '-3.75rem', top: '0', width: '24px', height: '24px', borderRadius: '50%', background: 'white', border: '5px solid var(--primary)', boxShadow: '0 0 0 4px white' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>{new Date(t.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.2rem' }}>SESSION LOGGED BY SPECIALIST</div>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '0.5rem 1.25rem', borderRadius: '1rem', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 900 }}>
                                            {t.complaint || 'FOLLOW-UP'}
                                        </div>
                                    </div>
                                    <div className="glass" style={{ padding: '2rem', borderRadius: '1.25rem', border: '1px solid var(--border-subtle)', background: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' }}>
                                        <p style={{ fontSize: '1.05rem', lineHeight: 1.8, fontWeight: 500, color: 'var(--text-main)' }}>{t.notes}</p>
                                    </div>
                                </div>
                            ))}
                            {(!patient.treatments || patient.treatments.length === 0) && (
                                <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                                    <p style={{ fontWeight: 800, color: 'var(--text-muted)' }}>THE CLINICAL TIMELINE IS CURRENTLY EMPTY</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

         {activeTab === 'billing' && (
              <div className="animate-fade-in">
                 <div className="card-premium" style={{ padding: '1.75rem', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 950, margin: 0 }}>Financial Ledger <span className="gradient-text">History</span></h3>
                        <button onClick={() => router.push(`/billing/generate?patientId=${patient._id}`)} style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: '0.8rem' }}>NEW INVOICE</button>
                    </div>

                    {invoices.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)' }}>INVOICE ID</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)' }}>DATE</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)' }}>AMOUNT</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)' }}>STATUS</th>
                                        <th style={{ padding: '1rem', width: '50px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map(inv => (
                                        <tr key={inv._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 700, fontSize: '0.9rem' }}>{inv.id}</td>
                                            <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(inv.date).toLocaleDateString()}</td>
                                            <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--primary)' }}>₹{inv.amount?.toLocaleString()}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ 
                                                    padding: '0.25rem 0.75rem', 
                                                    borderRadius: '1rem', 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: 900,
                                                    background: inv.status === 'Paid' ? '#dcfce7' : '#fee2e2',
                                                    color: inv.status === 'Paid' ? '#10b981' : '#ef4444'
                                                }}>
                                                    {inv.status?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <ChevronRight size={18} style={{ opacity: 0.3 }} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                            <CreditCard size={48} style={{ margin: '0 auto 1.5rem' }} />
                            <p style={{ fontWeight: 700 }}>NO FINANCIAL RECORDS FOUND</p>
                        </div>
                    )}
                 </div>
              </div>
         )}

          {activeTab === 'docs' && (
               <div className="animate-fade-in">
                  <div className="card-premium" style={{ padding: '1.75rem', background: 'white' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                         <h3 style={{ fontSize: '1.25rem', fontWeight: 950, margin: 0 }}>Medical <span className="gradient-text">Documentation</span></h3>
                         <button 
                            onClick={() => setShowDocModal(true)}
                            style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem' }}
                         >
                            UPLOAD DOCUMENT
                         </button>
                     </div>
 
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                         {patient.documents?.map((doc, idx) => (
                             <div 
                                key={idx} 
                                className="glass-interactive" 
                                style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'white', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer' }}
                                onClick={() => window.open(`http://localhost:2000${doc.url}`, '_blank')}
                             >
                                 <div style={{ width: '45px', height: '45px', borderRadius: 'var(--radius-sm)', background: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                     <FileText size={20} />
                                 </div>
                                 <div style={{ flex: 1 }}>
                                     <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>{doc.name}</h4>
                                     <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>{doc.type} • {new Date(doc.date).toLocaleDateString()}</p>
                                 </div>
                                 <ChevronRight size={16} style={{ opacity: 0.3 }} />
                             </div>
                         ))}
                         {(!patient.documents || patient.documents.length === 0) && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                                <FileText size={48} style={{ margin: '0 auto 1.5rem' }} />
                                <p style={{ fontWeight: 700 }}>NO MEDICAL DOCUMENTS ON FILE</p>
                            </div>
                         )}
                     </div>
                  </div>
               </div>
          )}
       </div>
 
       {/* 📂 DOCUMENT UPLOAD MODAL */}
       {showDocModal && (
         <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="card-premium animate-fade-in" style={{ width: '95%', maxWidth: '500px', padding: '3rem', background: 'white' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 950, marginBottom: '2rem' }}>Upload <span className="gradient-text">Document</span></h2>
                
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>DOCUMENT NAME</label>
                    <input 
                        type="text" 
                        value={docName} 
                        onChange={(e) => setDocName(e.target.value)} 
                        placeholder="e.g. X-Ray Report, Discharge Summary"
                        style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: '#f8fafc', fontWeight: 600 }}
                    />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>DOCUMENT CATEGORY</label>
                    <select 
                        value={docType} 
                        onChange={(e) => setDocType(e.target.value)}
                        style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: '#f8fafc', fontWeight: 600 }}
                    >
                        <option value="Clinical">Clinical</option>
                        <option value="Imaging">Imaging</option>
                        <option value="Lab Report">Lab Report</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div style={{ marginBottom: '2.5rem' }}>
                    <label 
                        className="glass-interactive"
                        style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '1rem',
                            padding: '3rem 2rem', 
                            border: '2px dashed var(--border-subtle)', 
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            background: '#f8fafc'
                        }}
                    >
                        <Plus size={32} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{isUploading ? 'UPLOADING...' : 'SELECT MEDICAL FILE'}</span>
                        <input type="file" hidden onChange={handleUploadDocument} disabled={isUploading} />
                    </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowDocModal(false)} style={{ fontWeight: 800, color: 'var(--text-muted)', padding: '0.5rem 1.5rem' }}>CANCEL</button>
                </div>
            </div>
         </div>
       )}

       {showTreatmentModal && (
         <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, animation: 'fadeIn 0.3s ease' }}>
           <div className="card-premium animate-fade-in" style={{ width: '95%', maxWidth: '700px', padding: '3.5rem', background: 'white', border: '1px solid var(--border-subtle)', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.3)' }}>
             <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2.5rem' }}>
                 <CircleDot size={20} className="text-teal-600 animate-pulse" />
                 <h2 style={{ fontSize: '2rem', fontWeight: 950, letterSpacing: '-0.02em', margin: 0 }}>Log Clinical Session</h2>
             </div>

             <form onSubmit={handleAddTreatment}>
               <div style={{ marginBottom: '2rem' }}>
                 <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Clinical Complaint</label>
                 <input
                   required
                   type="text"
                   value={treatmentComplaint}
                   onChange={(e) => setTreatmentComplaint(e.target.value)}
                   placeholder="e.g. Acute Lumbar Strain, Post-ACL Rehab Progress..."
                   style={{ width: '100%', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-subtle)', background: '#f8fafc', fontWeight: 700, fontSize: '1rem', outline: 'none' }}
                 />
               </div>

               <div style={{ marginBottom: '3rem' }}>
                 <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Clinical Progress Notes</label>
                 <textarea
                   required
                   value={treatmentNotes}
                   onChange={(e) => setTreatmentNotes(e.target.value)}
                   placeholder="Detail the clinical maneuvers, manual techniques applied, and home exercise compliance..."
                   style={{ width: '100%', height: '220px', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-subtle)', background: '#f8fafc', fontSize: '1rem', fontWeight: 500, lineHeight: 1.7, resize: 'none', outline: 'none' }}
                 />
               </div>

               <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-end' }}>
                 <button type="button" onClick={() => setShowTreatmentModal(false)} style={{ padding: '1rem 2.5rem', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '1rem', color: 'var(--text-muted)' }}>DISCARD</button>
                 <button type="submit" disabled={submitting} style={{ padding: '1rem 3rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 950, fontSize: '1rem', boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.4)' }}>
                   {submitting ? 'JOURNALING...' : 'AUTHORIZE SESSION'}
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}
    </div>
  );
}
