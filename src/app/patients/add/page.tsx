'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { 
  ArrowLeft, User, Phone, Mail, MapPin, 
  Activity, Briefcase, Stethoscope, Scale, 
  Ruler, UserCircle, Smartphone, CheckCircle2,
  ChevronRight, ClipboardList, Building2
} from 'lucide-react';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Patient name is required'),
  phone: Yup.string()
    .required('Contact number is required')
    .matches(/^[0-9+\-\s()]*$/, 'Invalid phone format'),
  age: Yup.number()
    .required('Age is required')
    .positive('Age must be positive')
    .integer('Age must be a whole number'),
  address: Yup.string().required('Residential address is required'),
  email: Yup.string().email('Invalid email address'),
});

export default function RegisterPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { showToast } = usePCMSStore();
  const [bmi, setBmi] = useState<string | number>(0);

  const formik = useFormik({
    initialValues: {
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
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const payload = {
          ...values,
          bmi: Number(bmi),
          treatments: values.initialTreatment ? [{
            notes: values.initialTreatment,
            date: new Date()
          }] : []
        };
        await api.post('/patients', payload);
        showToast('Patient record initialized successfully.', 'success');
        router.push('/patients');
      } catch (err) {
        console.error('🚫 Registry Error | Failed to onboard clinical patient:', err);
        showToast('Patient registration failed. Please check medical data.', 'error');
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (formik.values.weight && formik.values.height) {
      const heightInMeters = Number(formik.values.height) / 100;
      const weight = Number(formik.values.weight);
      if (heightInMeters > 0) {
        setBmi((weight / (heightInMeters * heightInMeters)).toFixed(2));
      } else setBmi('');
    } else {
      setBmi('');
    }
  }, [formik.values.weight, formik.values.height]);

  const habitOptions = [
    'Smoking', 'Alcohol', 
    'Exercise', 'Poor Sleep', 'Caffeine', 'Healthy', 'Sedentary'
  ];

  const toggleHabit = (habit: string) => {
    const currentHabits = formik.values.habits;
    const nextHabits = currentHabits.includes(habit)
      ? currentHabits.filter(h => h !== habit)
      : [...currentHabits, habit];
    formik.setFieldValue('habits', nextHabits);
  };

  const isError = (field: keyof typeof formik.values) => 
    formik.touched[field] && formik.errors[field];

  const ErrorMsg = ({ name }: { name: keyof typeof formik.values }) => (
    formik.touched[name] && formik.errors[name] ? (
      <div style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 700, marginTop: '0.4rem', marginLeft: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <span>⚠️ {formik.errors[name] as string}</span>
      </div>
    ) : null
  );

  return (
    <div className="register-patient-container animate-fade-in clinical-form-wide" style={{ padding: '2rem 2.5rem', paddingBottom: '7rem' }}>
      <div style={{ marginBottom: '3.5rem' }}>
        <button
          onClick={() => router.back()}
          className="glass-interactive"
          style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> Registry Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>CLINICAL REGISTRY</span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
          New Clinical <span className="gradient-text">File</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
          Initialize a new medical record with standard clinical profiling and vitals.
        </p>
      </div>

      <form onSubmit={formik.handleSubmit} className="clinical-form-card" style={{ opacity: loading ? 0.7 : 1 }}>
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
              <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isError('name') ? '#ef4444' : 'var(--text-muted)', opacity: isError('name') ? 0.8 : 0.5 }} />
              <input 
                name="name"
                autoComplete="off"
                disabled={loading} 
                type="text" 
                className={`input-premium ${isError('name') ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.75rem', borderColor: isError('name') ? '#ef4444' : '' }} 
                value={formik.values.name} 
                onChange={formik.handleChange} 
                onBlur={formik.handleBlur}
                placeholder="Full legal name..." 
              />
            </div>
            <ErrorMsg name="name" />
          </div>
          <div className="col-4">
            <label className="label-premium">Primary Contact <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Smartphone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isError('phone') ? '#ef4444' : 'var(--text-muted)', opacity: isError('phone') ? 0.8 : 0.5 }} />
              <input 
                name="phone"
                autoComplete="off"
                disabled={loading} 
                type="text" 
                className={`input-premium ${isError('phone') ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.75rem', borderColor: isError('phone') ? '#ef4444' : '' }} 
                value={formik.values.phone} 
                onChange={formik.handleChange} 
                onBlur={formik.handleBlur}
                placeholder="9876543210" 
              />
            </div>
            <ErrorMsg name="phone" />
          </div>

          <div className="col-12" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
               <label className="label-premium">Email Address (Optional)</label>
               <div style={{ position: 'relative' }}>
                 <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isError('email') ? '#ef4444' : 'var(--text-muted)', opacity: 0.5 }} />
                 <input 
                   name="email"
                   autoComplete="off"
                   disabled={loading} 
                   type="email" 
                   className={`input-premium ${isError('email') ? 'input-error' : ''}`}
                   style={{ paddingLeft: '2.75rem' }} 
                   value={formik.values.email} 
                   onChange={formik.handleChange} 
                   onBlur={formik.handleBlur}
                   placeholder="patient@example.com" 
                 />
               </div>
               <ErrorMsg name="email" />
            </div>
            <div>
               <label className="label-premium">Occupation</label>
               <div style={{ position: 'relative' }}>
                 <Briefcase size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
                 <input 
                   name="occupation"
                   autoComplete="off"
                   disabled={loading} 
                   type="text" 
                   className="input-premium" 
                   style={{ paddingLeft: '2.75rem' }} 
                   value={formik.values.occupation} 
                   onChange={formik.handleChange} 
                   placeholder="e.g. Software Engineer, Teacher" 
                 />
               </div>
            </div>
          </div>

          <div className="col-4">
            <label className="label-premium">Age <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              name="age"
              autoComplete="off"
              disabled={loading} 
              type="number" 
              className={`input-premium ${isError('age') ? 'input-error' : ''}`}
              style={{ borderColor: isError('age') ? '#ef4444' : '' }}
              value={formik.values.age} 
              onChange={formik.handleChange} 
              onBlur={formik.handleBlur}
              placeholder="Enter age" 
            />
            <ErrorMsg name="age" />
          </div>
          <div className="col-4">
            <label className="label-premium">Gender</label>
            <select 
              name="gender"
              className="input-premium" 
              value={formik.values.gender} 
              onChange={formik.handleChange}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="col-12">
            <label className="label-premium">Residential Address <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isError('address') ? '#ef4444' : 'var(--text-muted)', opacity: isError('address') ? 0.8 : 0.5 }} />
              <input 
                name="address"
                autoComplete="off"
                disabled={loading} 
                type="text" 
                className={`input-premium ${isError('address') ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.75rem', borderColor: isError('address') ? '#ef4444' : '' }} 
                value={formik.values.address} 
                onChange={formik.handleChange} 
                onBlur={formik.handleBlur}
                placeholder="Full physical address..." 
              />
            </div>
            <ErrorMsg name="address" />
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
              <input 
                name="referredBy"
                autoComplete="off"
                disabled={loading} 
                type="text" 
                className="input-premium" 
                style={{ paddingLeft: '2.75rem' }} 
                value={formik.values.referredBy} 
                onChange={formik.handleChange} 
                placeholder="Physician / Source" 
              />
            </div>
          </div>
          <div className="col-12">
            <label className="label-premium">Lifestyle Habits & Assessment</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
              {habitOptions.map(h => {
                const isSelected = formik.values.habits.includes(h);
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
            <textarea 
              name="reasonForVisit"
              autoComplete="off"
              disabled={loading} 
              className="textarea-premium" 
              style={{ height: '80px' }} 
              value={formik.values.reasonForVisit} 
              onChange={formik.handleChange} 
              placeholder="Primary reason for seeking clinical help..." 
            />
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
                  <input 
                    name="weight"
                    autoComplete="off"
                    disabled={loading} 
                    type="number" 
                    className="input-premium" 
                    style={{ paddingLeft: '2.25rem' }} 
                    value={formik.values.weight} 
                    onChange={formik.handleChange} 
                    placeholder="Enter weight" 
                  />
                </div>
              </div>
              <div className="col-4">
                <label className="label-premium" style={{ fontSize: '0.65rem' }}>Height (CM)</label>
                <div style={{ position: 'relative' }}>
                  <Ruler size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
                  <input 
                    name="height"
                    autoComplete="off"
                    disabled={loading} 
                    type="number" 
                    className="input-premium" 
                    style={{ paddingLeft: '2.25rem' }} 
                    value={formik.values.height} 
                    onChange={formik.handleChange} 
                    placeholder="Enter height" 
                  />
                </div>
              </div>
              <div className="col-4">
                <label className="label-premium" style={{ fontSize: '0.65rem' }}>BMI (Calculated)</label>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: '#fff', fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                  {bmi || '--'}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <label className="label-premium">Initial Assessment Notes</label>
            <textarea 
              name="initialTreatment"
              autoComplete="off"
              disabled={loading} 
              className="textarea-premium" 
              style={{ height: '100px' }} 
              value={formik.values.initialTreatment} 
              onChange={formik.handleChange} 
              placeholder="Detailed clinical history and initial findings..." 
            />
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
              name="remarks"
              autoComplete="off"
              className="textarea-premium" 
              placeholder="Add final clinical context..."
              value={formik.values.remarks}
              onChange={formik.handleChange}
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

