'use client'
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { useFormik } from 'formik';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Mail, MapPin,
  Ruler,
  Scale,
  Smartphone,
  Stethoscope,
  User,
  UserCircle
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import * as Yup from 'yup';

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

export default function EditPatientPage() {
  const router = useRouter();
  const { id } = useParams();
  const { setIsSyncing, showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bmi, setBmi] = useState<string | number>(0);

  const formik = useFormik({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      age: '',
      gender: '',
      address: '',
      referredBy: '',
      occupation: '',
      habits: [] as string[],
      reasonForVisit: '',
      weight: '',
      height: '',
      remarks: ''
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setSaving(true);
      setIsSyncing(true);
      try {
        const payload = {
          ...values,
          bmi: Number(bmi)
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
    },
  });

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
          formik.setValues({
            name: patient.name || '',
            phone: patient.phone || '',
            email: patient.email || '',
            age: patient.age ? patient.age.toString() : '',
            gender: patient.gender || '',
            address: patient.address || '',
            referredBy: patient.referredBy || '',
            occupation: patient.occupation || '',
            habits: Array.isArray(patient.habits) ? patient.habits : [],
            reasonForVisit: patient.reasonForVisit || '',
            weight: patient.weight ? patient.weight.toString() : '',
            height: patient.height ? patient.height.toString() : '',
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

  useEffect(() => {
    if (formik.values.weight && formik.values.height) {
      const heightInMeters = Number(formik.values.height) / 100;
      const calcBmi = (Number(formik.values.weight) / (heightInMeters * heightInMeters)).toFixed(2);
      setBmi(calcBmi);
    } else {
      setBmi(0);
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="edit-patient-container animate-fade-in clinical-form-wide" style={{ padding: '2rem 2.5rem', paddingBottom: '7rem' }}>
      
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
          Modify Patient <span className="gradient-text">File</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
          Update medical identity, contact vectors, and clinical status profiles.
        </p>
      </div>

      <form onSubmit={formik.handleSubmit} className="clinical-form-card" style={{ opacity: saving ? 0.7 : 1 }}>
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
              <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isError('name') ? '#ef4444' : 'var(--text-muted)', opacity: isError('name') ? 0.8 : 0.5 }} />
              <input 
                name="name"
                disabled={saving} 
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
                disabled={saving} 
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

          <div className="col-6">
            <label className="label-premium">Email Address (Optional)</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isError('email') ? '#ef4444' : 'var(--text-muted)', opacity: 0.5 }} />
              <input 
                name="email"
                disabled={saving} 
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
          <div className="col-3">
            <label className="label-premium">Age <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              name="age"
              disabled={saving} 
              type="number" 
              className={`input-premium ${isError('age') ? 'input-error' : ''}`}
              style={{ borderColor: isError('age') ? '#ef4444' : '' }}
              value={formik.values.age} 
              onChange={formik.handleChange} 
              onBlur={formik.handleBlur}
              placeholder="0" 
            />
            <ErrorMsg name="age" />
          </div>
          <div className="col-3">
            <label className="label-premium">Gender</label>
            <select 
              name="gender"
              className="input-premium" 
              value={formik.values.gender} 
              onChange={formik.handleChange}
            >
              <option value="" disabled>Select Gender</option>
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
                disabled={saving} 
                type="text" 
                className={`input-premium ${isError('address') ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.75rem', borderColor: isError('address') ? '#ef4444' : '' }} 
                value={formik.values.address} 
                onChange={formik.handleChange} 
                onBlur={formik.handleBlur}
                placeholder="Complete physical address..." 
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
            <ClipboardList size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Clinical <span className="gradient-text">Profiling</span>
            </h3>
          </div>

          <div className="col-4">
            <label className="label-premium">Referred By</label>
            <div style={{ position: 'relative' }}>
              <Stethoscope size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input 
                name="referredBy"
                disabled={saving} 
                type="text" 
                className="input-premium" 
                style={{ paddingLeft: '2.75rem' }} 
                value={formik.values.referredBy} 
                onChange={formik.handleChange} 
                placeholder="Physician / Source" 
              />
            </div>
          </div>
          <div className="col-4">
            <label className="label-premium">Occupation</label>
            <div style={{ position: 'relative' }}>
              <Briefcase size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input 
                name="occupation"
                disabled={saving} 
                type="text" 
                className="input-premium" 
                style={{ paddingLeft: '2.75rem' }} 
                value={formik.values.occupation} 
                onChange={formik.handleChange} 
                placeholder="Profession" 
              />
            </div>
          </div>
          <div className="col-12" style={{ marginBottom: '1.5rem' }}>
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
            <label className="label-premium">Medical Complaint Summary</label>
            <textarea 
              name="reasonForVisit"
              disabled={saving} 
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
                    disabled={saving} 
                    type="number" 
                    className="input-premium" 
                    style={{ paddingLeft: '2.25rem' }} 
                    value={formik.values.weight} 
                    onChange={formik.handleChange} 
                    placeholder="0" 
                  />
                </div>
              </div>
              <div className="col-4">
                <label className="label-premium" style={{ fontSize: '0.65rem' }}>Height (CM)</label>
                <div style={{ position: 'relative' }}>
                  <Ruler size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
                  <input 
                    name="height"
                    disabled={saving} 
                    type="number" 
                    className="input-premium" 
                    style={{ paddingLeft: '2.25rem' }} 
                    value={formik.values.height} 
                    onChange={formik.handleChange} 
                    placeholder="0" 
                  />
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
              name="remarks"
              className="textarea-premium"
              style={{ height: '120px' }}
              placeholder="Add final clinical context, long-term goals, or administrative notes for this patient file..."
              value={formik.values.remarks}
              onChange={formik.handleChange}
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
