'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { 
  ArrowLeft, User, Phone, Mail, MapPin, 
  Activity, Briefcase, Stethoscope, Scale, 
  Ruler, UserCircle, Smartphone, CheckCircle2,
  ChevronRight, ClipboardList, Building2
} from 'lucide-react';

export default function RegisterPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { showToast } = usePCMSStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: 'Male',
    address: '',
    referredBy: '',
    reasonForVisit: '',
    weight: '',
    height: '',
    occupation: '',
    habits: [] as string[],
    initialTreatment: '',
    remarks: ''
  });

  const [bmi, setBmi] = useState<string | number>(0);

  useEffect(() => {
    if (formData.weight && formData.height) {
      const heightInMeters = Number(formData.height) / 100;
      const weight = Number(formData.weight);
      if (heightInMeters > 0) {
        setBmi((weight / (heightInMeters * heightInMeters)).toFixed(2));
      } else setBmi(0);
    } else {
      setBmi(0);
    }
  }, [formData.weight, formData.height]);

  const habitOptions = [
    'Smoking', 'Alcohol Consumption', 'Tobacco Use', 
    'Regular Exercise', 'Poor Sleep', 'High Caffeine Intake', 
    'Drug Use', 'Healthy Lifestyle', 'Sedentary Lifestyle'
  ];

  const toggleHabit = (habit: string) => {
    setFormData(prev => ({
      ...prev,
      habits: prev.habits.includes(habit) 
        ? prev.habits.filter(h => h !== habit)
        : [...prev.habits, habit]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        bmi: Number(bmi),
        treatments: formData.initialTreatment ? [{
          notes: formData.initialTreatment,
          date: new Date()
        }] : []
      };
      await api.post('/patients', payload);
      router.push('/patients');
    } catch (err) {
      console.error('🚫 Registry Error | Failed to onboard clinical patient:', err);
      showToast('Patient registration failed. Please check medical data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-patient-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <button
          onClick={() => router.back()}
          style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
        >
          <ArrowLeft size={16} /> Registry Dashboard
        </button>
        <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>New Clinical <span className="gradient-text">File</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Initialize a new medical record with standard clinical profiling and vitals.</p>
      </div>

      <form onSubmit={handleSubmit} className="clinical-form-card" style={{ opacity: loading ? 0.7 : 1 }}>
        <div className="clinical-form-grid">
          {/* Section 1: Identity & Contact */}
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
              Identity & <span className="gradient-text">Contact</span>
            </h3>
          </div>

          <div className="col-8">
            <label className="label-premium">Patient Full Name <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input required disabled={loading} type="text" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full legal name..." />
            </div>
          </div>
          <div className="col-4">
            <label className="label-premium">Primary Contact <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Smartphone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input required disabled={loading} type="text" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="9876543210" />
            </div>
          </div>

          <div className="col-12" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
               <label className="label-premium">Email Address (Optional)</label>
               <div style={{ position: 'relative' }}>
                 <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
                 <input disabled={loading} type="email" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="patient@example.com" />
               </div>
            </div>
            <div>
               <label className="label-premium">Occupation</label>
               <div style={{ position: 'relative' }}>
                 <Briefcase size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
                 <input disabled={loading} type="text" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} placeholder="e.g. Software Engineer, Teacher" />
               </div>
            </div>
          </div>

          <div className="col-4">
            <label className="label-premium">Age <span style={{ color: '#ef4444' }}>*</span></label>
            <input required disabled={loading} type="number" className="input-premium" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder="Enter age" />
          </div>
          <div className="col-4">
            <label className="label-premium">Gender</label>
            <select className="input-premium" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="col-12">
            <label className="label-premium">Residential Address <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input required disabled={loading} type="text" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Full physical address..." />
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              🩺 Clinical <span className="gradient-text">Profiling</span>
            </h3>
          </div>

          <div className="col-4">
            <label className="label-premium">Referred By</label>
            <div style={{ position: 'relative' }}>
              <Stethoscope size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input disabled={loading} type="text" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.referredBy} onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })} placeholder="Physician / Source" />
            </div>
          </div>
          <div className="col-12">
            <label className="label-premium">Lifestyle Habits & Assessment</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
              {habitOptions.map(h => {
                const isSelected = formData.habits.includes(h);
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleHabit(h)}
                    style={{
                      padding: '0.6rem 1.25rem',
                      borderRadius: '2rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border-subtle)',
                      background: isSelected ? 'rgba(13, 148, 136, 0.1)' : 'white',
                      color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {isSelected && <CheckCircle2 size={14} />}
                    {h}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="col-12">
            <label className="label-premium">Medical Complaint</label>
            <textarea disabled={loading} className="textarea-premium" style={{ height: '80px' }} value={formData.reasonForVisit} onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })} placeholder="Primary reason for seeking clinical help..." />
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
                  <input disabled={loading} type="number" className="input-premium" style={{ paddingLeft: '2.25rem' }} value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="Enter weight" />
                </div>
              </div>
              <div className="col-4">
                <label className="label-premium" style={{ fontSize: '0.65rem' }}>Height (CM)</label>
                <div style={{ position: 'relative' }}>
                  <Ruler size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
                  <input disabled={loading} type="number" className="input-premium" style={{ paddingLeft: '2.25rem' }} value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} placeholder="Enter height" />
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

          <div className="col-12">
            <label className="label-premium">Initial Assessment Notes</label>
            <textarea disabled={loading} className="textarea-premium" style={{ height: '100px' }} value={formData.initialTreatment} onChange={(e) => setFormData({ ...formData, initialTreatment: e.target.value })} placeholder="Detailed clinical history and initial findings..." />
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

          <div className="col-12">
            <label className="label-premium">Final Registry Remarks</label>
            <textarea
              className="textarea-premium"
              placeholder="Add final clinical context..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
              disabled={loading}
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
              {loading ? 'INITIALIZING FILE...' : <><CheckCircle2 size={18} /> AUTHORIZED REGISTRATION</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
