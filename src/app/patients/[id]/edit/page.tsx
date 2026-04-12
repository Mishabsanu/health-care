'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, User, Phone, Mail, MapPin, 
  Activity, Briefcase, Stethoscope, Scale, 
  Ruler, UserCircle, Smartphone, CheckCircle2,
  ChevronRight, ClipboardList, Building2
} from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';

export default function EditPatientPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, setIsSyncing, showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: '',
    address: '',
    status: '',
    referredBy: '',
    occupation: '',
    habits: '',
    reasonForVisit: '',
    weight: '',
    height: '',
    bmi: 0,
    remarks: ''
  });

  const [bmi, setBmi] = useState<string | number>(0);

  useEffect(() => {
    if (formData.weight && formData.height) {
      const heightInMeters = Number(formData.height) / 100;
      const calcBmi = (Number(formData.weight) / (heightInMeters * heightInMeters)).toFixed(2);
      setBmi(calcBmi);
    } else {
      setBmi(0);
    }
  }, [formData.weight, formData.height]);

  // -------------------------------------------------------------------
  // SYNC | Fetch Clinical Patient Data & Options
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      setIsSyncing(true);
      try {
        const patientRes = await api.get(`/patients/${id}`);
        
        const patient = patientRes.data;
        if (patient) {
          setFormData({
            name: patient.name || '',
            phone: patient.phone || '',
            email: patient.email || '',
            age: patient.age ? patient.age.toString() : '',
            gender: patient.gender || '',
            address: patient.address || '',
            status: patient.status || '',
            referredBy: patient.referredBy || '',
            occupation: patient.occupation || '',
            habits: Array.isArray(patient.habits) ? patient.habits.join(', ') : (patient.habits || ''),
            reasonForVisit: patient.reasonForVisit || '',
            weight: patient.weight ? patient.weight.toString() : '',
            height: patient.height ? patient.height.toString() : '',
            bmi: patient.bmi || 0,
            remarks: patient.remarks || ''
          });
          if (patient.bmi) setBmi(patient.bmi);
        }
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch medical file:', err);
        showToast('Failed to synchronize medical record.', 'error');
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
      const payload = {
        ...formData,
        bmi: Number(bmi),
        habits: formData.habits.split(',').map(s => s.trim()).filter(s => s)
      };
      await api.put(`/patients/${id}`, payload);
      showToast('Medical record updated successfully.', 'success');
      router.push('/patients');
    } catch (err) {
      console.error('🚫 Registry Error | Failed to update clinical record:', err);
      showToast('Update failed. Please check medical data consistency.', 'error');
    } finally {
      setSaving(false);
      setIsSyncing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin" />
      <p className="font-bold text-slate-400 animate-pulse text-xs tracking-widest">🛡️ SECURING CLINICAL VAULT...</p>
    </div>
  );

  return (
    <div className="edit-patient-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>
      
      {/* 🏥 CLINICAL HEADER */}
      <div style={{ marginBottom: '3rem' }}>
        <button 
          onClick={() => router.back()} 
          style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
        >
          <ArrowLeft size={16} /> Registry Dashboard
        </button>
        <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Modify Patient <span className="gradient-text">File</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Update medical identity, contact vectors, and clinical status profiles.</p>
      </div>

      <form onSubmit={handleSubmit} className="clinical-form-card" style={{ opacity: saving ? 0.7 : 1 }}>
        <div className="clinical-form-grid">
          
          {/* Section 1: Clinical Identity */}
          <div className="col-12" style={{ 
              marginBottom: '1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '4px solid var(--primary)'
          }}>
            <UserCircle size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Identity & <span className="gradient-text">Profiling</span>
            </h3>
          </div>

          <div className="col-8">
            <label className="label-premium">Patient Full Name <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input required disabled={saving} type="text" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Full legal name..." />
            </div>
          </div>
          <div className="col-4">
            <label className="label-premium">Primary Contact <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Smartphone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input required disabled={saving} type="text" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="9876543210" />
            </div>
          </div>

          <div className="col-6">
            <label className="label-premium">Email Address (Optional)</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input disabled={saving} type="email" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="patient@example.com" />
            </div>
          </div>
          <div className="col-3">
            <label className="label-premium">Age <span style={{ color: '#ef4444' }}>*</span></label>
            <input required disabled={saving} type="number" className="input-premium" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} placeholder="0" />
          </div>
          <div className="col-3">
            <label className="label-premium">Gender</label>
            <select className="input-premium" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
              <option value="" disabled>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="col-12" style={{ marginBottom: '1.5rem' }}>
            <label className="label-premium">Current Clinical Condition</label>
            <div style={{ position: 'relative' }}>
              <Activity size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <select className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="New Case">New Case</option>
                <option value="Stable">Stable</option>
                <option value="Recovering">Recovering</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="col-12">
            <label className="label-premium">Residential Address <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input required disabled={saving} type="text" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Complete physical address..." />
            </div>
          </div>
          {/* Section 2: Clinical Profiling */}
          <div className="col-12" style={{ 
              margin: '2.5rem 0 1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '4px solid var(--primary)'
          }}>
            <ClipboardList size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Clinical <span className="gradient-text">Profiling</span>
            </h3>
          </div>

          <div className="col-4">
            <label className="label-premium">Referred By</label>
            <div style={{ position: 'relative' }}>
              <Stethoscope size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input disabled={saving} type="text" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.referredBy} onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })} placeholder="Physician / Source" />
            </div>
          </div>
          <div className="col-4">
            <label className="label-premium">Occupation</label>
            <div style={{ position: 'relative' }}>
              <Briefcase size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input disabled={saving} type="text" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} placeholder="Profession" />
            </div>
          </div>
          <div className="col-4">
            <label className="label-premium">Lifestyle Habits</label>
            <div style={{ position: 'relative' }}>
              <Activity size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input disabled={saving} type="text" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.habits} onChange={(e) => setFormData({ ...formData, habits: e.target.value })} placeholder="Smoking, Alcohol, etc." />
            </div>
          </div>

          <div className="col-12">
            <label className="label-premium">Medical Complaint Summary</label>
            <textarea disabled={saving} className="textarea-premium" style={{ height: '80px' }} value={formData.reasonForVisit} onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })} placeholder="Primary reason for seeking clinical help..." />
          </div>

          {/* Clinical Vitals Section */}
          <div className="col-12" style={{ 
              marginTop: '3rem', 
              padding: '2rem', 
              background: '#f8fafc', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--border-subtle)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{ 
                marginBottom: '2rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                borderBottom: '1px solid rgba(15, 118, 110, 0.1)',
                paddingBottom: '1rem'
            }}>
               <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                 📊 Anthropometry & Vitals
               </h3>
            </div>
            <div className="clinical-form-grid">
              <div className="col-4">
                <label className="label-premium" style={{ fontSize: '0.65rem' }}>Weight (KG)</label>
                <div style={{ position: 'relative' }}>
                  <Scale size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
                  <input disabled={saving} type="number" className="input-premium" style={{ paddingLeft: '2.25rem' }} value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div className="col-4">
                <label className="label-premium" style={{ fontSize: '0.65rem' }}>Height (CM)</label>
                <div style={{ position: 'relative' }}>
                  <Ruler size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
                  <input disabled={saving} type="number" className="input-premium" style={{ paddingLeft: '2.25rem' }} value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div className="col-4">
                <label className="label-premium" style={{ fontSize: '0.65rem' }}>BMI (Calculated)</label>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: '#fff', fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                  {bmi || '0.00'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Conclusion / Remarks */}
          <div className="col-12" style={{ 
              margin: '3rem 0 1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '4px solid var(--primary)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              📝 Conclusions & <span className="gradient-text">Remarks</span>
            </h3>
          </div>

          <div className="col-12" style={{ marginBottom: '2rem' }}>
            <label className="label-premium">Clinical Trajectory & Assessment</label>
            <textarea
              className="textarea-premium"
              style={{ height: '120px' }}
              placeholder="Add final clinical context, long-term goals, or administrative notes for this patient file..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
            {saving ? 'SYNCHRONIZING...' : <><CheckCircle2 size={18} /> AUTHORIZE UPDATE</>}
          </button>
        </div>
      </form>
    </div>
  );
}
