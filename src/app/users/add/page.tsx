'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { ArrowLeft, User, Mail, Lock, Calendar, CreditCard, Banknote, ShieldCheck, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const validationSchema = Yup.object().shape({
  name: Yup.string().trim().required('Full name is required'),
  phone: Yup.string().required('Mobile number is required').length(10, 'Must be exactly 10 digits'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required').min(6, 'Minimum 6 characters'),
  roleId: Yup.string().required('Role is required'),
  joinDate: Yup.string().required('Joining date is required'),
  panCard: Yup.string(),
  adharCard: Yup.string(),
  bankName: Yup.string(),
  accountNumber: Yup.string(),
  ifscCode: Yup.string(),
  basicSalary: Yup.number().typeError('Must be a number').min(0, 'Cannot be negative'),
  allowance: Yup.number().typeError('Must be a number').min(0, 'Cannot be negative'),
  deduction: Yup.number().typeError('Must be a number').min(0, 'Cannot be negative'),
  salaryType: Yup.string().oneOf(['Monthly', 'Daily', 'Hourly'], 'Invalid type'),
  salaryRate: Yup.number().typeError('Must be a number').min(0, 'Cannot be negative'),
});

export default function OnboardUserPage() {
  const router = useRouter();
  const { showToast } = usePCMSStore();
  const [roles, setRoles] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    api.get('/roles')
      .then(res => setRoles(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
      .catch(err => console.error('🚫 Failed to fetch roles:', err));
  }, []);

  const formik = useFormik({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
      roleId: '',
      status: 'Active',
      joinDate: new Date().toISOString().split('T')[0],
      panCard: '',
      adharCard: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      basicSalary: '',
      allowance: '',
      deduction: '',
      salaryType: 'Monthly',
      salaryRate: '',
      expectedHoursPerDay: 8,
      overtimeRate: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const payload = {
          name: values.name,
          phone: values.phone,
          email: values.email,
          password: values.password,
          roleId: values.roleId,
          status: values.status,
          panCard: values.panCard,
          adharCard: values.adharCard,
          bankName: values.bankName,
          accountNumber: values.accountNumber,
          ifscCode: values.ifscCode,
          joinDate: values.joinDate,
          salaryDetails: {
            basicSalary: Number(values.basicSalary) || 0,
            allowance: Number(values.allowance) || 0,
            deduction: Number(values.deduction) || 0,
          },
          salaryConfig: {
            type: values.salaryType,
            rate: Number(values.salaryRate) || 0,
            expectedHoursPerDay: Number(values.expectedHoursPerDay) || 8,
            overtimeRate: Number(values.overtimeRate) || 0,
          }
        };
        await api.post('/auth/register', payload);
        showToast('Staff account created successfully.', 'success');
        router.push('/users');
      } catch (err) {
        console.error('🚫 Registry Error | Failed to onboard staff:', err);
        showToast('User registration failed. Please check personnel data.', 'error');
      }
    },
  });

  const isErr = (field: keyof typeof formik.values) =>
    formik.touched[field] && formik.errors[field];

  const ErrMsg = ({ name }: { name: keyof typeof formik.values }) =>
    formik.touched[name] && formik.errors[name] ? (
      <div style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, marginTop: '0.35rem' }}>
        {formik.errors[name] as string}
      </div>
    ) : null;

  const basic = Number(formik.values.basicSalary) || 0;
  const allowance = Number(formik.values.allowance) || 0;
  const deduction = Number(formik.values.deduction) || 0;

  // Calculate projected take-home
  let takeHome = 0;
  if (formik.values.salaryType === 'Monthly') {
    takeHome = basic + allowance - deduction;
  } else if (formik.values.salaryType === 'Daily') {
    takeHome = (Number(formik.values.salaryRate) * 22) + allowance - deduction; // Approx 22 working days
  } else {
    takeHome = (Number(formik.values.salaryRate) * 8 * 22) + allowance - deduction; // Approx 8h/day, 22 days
  }

  return (
    <div className="onboard-user-container animate-fade-in clinical-form-wide" style={{ padding: '2rem 2.5rem', paddingBottom: '7rem' }}>
      <div style={{ marginBottom: '3.5rem' }}>
        <button
          onClick={() => router.back()}
          className="glass-interactive"
          style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> Personnel Registry
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>IDENTITY & ACCESS</span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
          Onboard <span className="gradient-text">Clinical Specialist</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
          Initialize a new administrative and clinical profile within the central directory.
        </p>
      </div>

      <form onSubmit={formik.handleSubmit} className="clinical-form-card" style={{ opacity: formik.isSubmitting ? 0.7 : 1 }} autoComplete="off">
        <div className="clinical-form-grid">

          {/* ── Section 1: Identity ── */}
          <div className="col-12" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'linear-gradient(90deg,rgba(15,118,110,0.05) 0%,transparent 100%)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <User size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Staff <span className="gradient-text">Identity</span></h3>
          </div>

          <div className="col-6">
            <label className="label-premium">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isErr('name') ? '#ef4444' : 'var(--text-muted)', opacity: 0.6 }} />
              <input name="name" type="text" className={`input-premium ${isErr('name') ? 'input-error' : ''}`} style={{ paddingLeft: '2.75rem', borderColor: isErr('name') ? '#ef4444' : '' }} value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="e.g. Dr. Jane Smith" />
            </div>
            <ErrMsg name="name" />
          </div>

          <div className="col-6">
            <label className="label-premium">Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isErr('phone') ? '#ef4444' : 'var(--text-muted)', opacity: 0.6 }} />
              <input 
                name="phone" 
                type="text" 
                maxLength={10} 
                className={`input-premium ${isErr('phone') ? 'input-error' : ''}`} 
                style={{ paddingLeft: '2.75rem', borderColor: isErr('phone') ? '#ef4444' : '' }} 
                value={formik.values.phone} 
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) formik.setFieldValue('phone', val);
                }} 
                onBlur={formik.handleBlur} 
                placeholder="9876543210" 
              />
            </div>
            <ErrMsg name="phone" />
          </div>

          <div className="col-6">
            <label className="label-premium">Clinical Email <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isErr('email') ? '#ef4444' : 'var(--text-muted)', opacity: 0.6 }} />
              <input name="email" type="email" className={`input-premium ${isErr('email') ? 'input-error' : ''}`} style={{ paddingLeft: '2.75rem', borderColor: isErr('email') ? '#ef4444' : '' }} value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="jane.smith@physio.com" autoComplete="none" />
            </div>
            <ErrMsg name="email" />
          </div>

          <div className="col-6">
            <label className="label-premium">Password <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isErr('password') ? '#ef4444' : 'var(--text-muted)', opacity: 0.6 }} />
              <input name="password" type={showPassword ? "text" : "password"} className={`input-premium ${isErr('password') ? 'input-error' : ''}`} style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem', borderColor: isErr('password') ? '#ef4444' : '' }} value={formik.values.password} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="••••••••" autoComplete="new-password" />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.6, display: 'flex' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <ErrMsg name="password" />
          </div>

          <div className="col-6">
            <label className="label-premium">Primary Clinical Role <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <ShieldCheck size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isErr('roleId') ? '#ef4444' : 'var(--text-muted)', opacity: 0.6 }} />
              <select name="roleId" className={`input-premium ${isErr('roleId') ? 'input-error' : ''}`} style={{ paddingLeft: '2.75rem', borderColor: isErr('roleId') ? '#ef4444' : '' }} value={formik.values.roleId} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                <option value="">— Select Role —</option>
                {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </div>
            <ErrMsg name="roleId" />
          </div>

          <div className="col-6">
            <label className="label-premium">Joining Date <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.6 }} />
              <input name="joinDate" type="date" className={`input-premium ${isErr('joinDate') ? 'input-error' : ''}`} style={{ paddingLeft: '2.75rem' }} value={formik.values.joinDate} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            </div>
            <ErrMsg name="joinDate" />
          </div>

          {/* ── Section 2: KYC ── */}
          <div className="col-12" style={{ margin: '1.5rem 0 1rem', padding: '0.75rem 1rem', background: 'linear-gradient(90deg,rgba(15,118,110,0.05) 0%,transparent 100%)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>KYC <span className="gradient-text">&amp; Identity</span> <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>(Optional)</span></h3>
          </div>

          <div className="col-6">
            <label className="label-premium">PAN Card</label>
            <input name="panCard" type="text" className="input-premium" value={formik.values.panCard} onChange={(e) => formik.setFieldValue('panCard', e.target.value.toUpperCase())} placeholder="ABCDE1234F" />
          </div>
          <div className="col-6">
            <label className="label-premium">Aadhaar Card</label>
            <input name="adharCard" type="text" className="input-premium" value={formik.values.adharCard} onChange={formik.handleChange} placeholder="1234 5678 9012" />
          </div>

          {/* ── Section 3: Banking & Salary ── */}
          <div className="col-12" style={{ margin: '1.5rem 0 1rem', padding: '0.75rem 1rem', background: 'linear-gradient(90deg,rgba(16,185,129,0.05) 0%,transparent 100%)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Banknote size={18} style={{ color: '#10b981' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Banking &amp; <span style={{ color: '#10b981' }}>Salary</span> <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>(Optional)</span></h3>
          </div>

          <div className="col-4">
            <label className="label-premium">Bank Name</label>
            <input name="bankName" type="text" className="input-premium" value={formik.values.bankName} onChange={formik.handleChange} placeholder="State Bank of India" />
          </div>
          <div className="col-4">
            <label className="label-premium">Account Number</label>
            <input name="accountNumber" type="text" className="input-premium" value={formik.values.accountNumber} onChange={formik.handleChange} placeholder="00000000000" />
          </div>
          <div className="col-3">
            <label className="label-premium">IFSC Code</label>
            <input name="ifscCode" type="text" className="input-premium" value={formik.values.ifscCode} onChange={(e) => formik.setFieldValue('ifscCode', e.target.value.toUpperCase())} placeholder="SBIN0001234" />
          </div>
          <div className="col-3">
            <label className="label-premium">Salary Basis</label>
            <select name="salaryType" className="input-premium" value={formik.values.salaryType} onChange={formik.handleChange}>
              <option value="Monthly">Monthly Fixed</option>
              <option value="Daily">Daily Wage</option>
              <option value="Hourly">Hourly Rate</option>
            </select>
          </div>

          {formik.values.salaryType !== 'Monthly' && (
            <div className="col-3">
              <label className="label-premium">{formik.values.salaryType} Rate (₹)</label>
              <input 
                name="salaryRate" 
                type="number" 
                className="input-premium" 
                value={formik.values.salaryRate} 
                onChange={formik.handleChange} 
                placeholder="0.00" 
                min="0"
                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
              />
            </div>
          )}

          {formik.values.salaryType === 'Hourly' && (
            <>
              <div className="col-3">
                <label className="label-premium">Expected Hrs/Day</label>
                <input 
                  name="expectedHoursPerDay" 
                  type="number" 
                  className="input-premium" 
                  value={formik.values.expectedHoursPerDay} 
                  onChange={formik.handleChange} 
                  placeholder="8" 
                  min="0"
                  onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                />
              </div>
              <div className="col-3">
                <label className="label-premium">OT Rate (Extra/Hr)</label>
                <input 
                  name="overtimeRate" 
                  type="number" 
                  className="input-premium" 
                  value={formik.values.overtimeRate} 
                  onChange={formik.handleChange} 
                  placeholder="0.00" 
                  min="0"
                  onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                />
              </div>
            </>
          )}

          <div className="col-4">
            <label className="label-premium">Basic Salary (₹)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--primary)', opacity: 0.6 }}>₹</span>
              <input 
                name="basicSalary" 
                type="number" 
                className="input-premium" 
                style={{ paddingLeft: '2.25rem', fontWeight: 800, color: 'var(--primary)' }} 
                value={formik.values.basicSalary} 
                onChange={formik.handleChange} 
                placeholder="Enter basic salary" 
                min="0" 
                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
              />
            </div>
            <ErrMsg name="basicSalary" />
          </div>
          <div className="col-4">
            <label className="label-premium">Allowances (₹)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#10b981', opacity: 0.6 }}>₹</span>
              <input 
                name="allowance" 
                type="number" 
                className="input-premium" 
                style={{ paddingLeft: '2.25rem', fontWeight: 800, color: '#10b981' }} 
                value={formik.values.allowance} 
                onChange={formik.handleChange} 
                placeholder="0" 
                min="0" 
                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
              />
            </div>
            <ErrMsg name="allowance" />
          </div>
          <div className="col-4">
            <label className="label-premium">Deductions (₹)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#ef4444', opacity: 0.6 }}>₹</span>
              <input 
                name="deduction" 
                type="number" 
                className="input-premium" 
                style={{ paddingLeft: '2.25rem', fontWeight: 800, color: '#ef4444' }} 
                value={formik.values.deduction} 
                onChange={formik.handleChange} 
                placeholder="0" 
                min="0" 
                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
              />
            </div>
            <ErrMsg name="deduction" />
          </div>

          {/* Take-home calculator */}
          <div className="col-12" style={{ marginTop: '1.5rem' }}>
            <div style={{ background: 'var(--primary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 20px -5px rgba(13,148,136,0.4)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calculated Monthly Take-Home</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>₹{takeHome.toLocaleString()}</div>
              </div>
              <div style={{ opacity: 0.2 }}><Banknote size={48} /></div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'flex-end', marginTop: '3.5rem' }}>
          <button type="button" onClick={() => router.back()} style={{ padding: '0.85rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>Cancel</button>
          <button type="submit" disabled={formik.isSubmitting} style={{ padding: '0.85rem 3.5rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: 'var(--shadow-sm)' }}>
            {formik.isSubmitting ? 'Initializing...' : <><CheckCircle2 size={18} /> AUTHORIZE STAFF ACCOUNT</>}
          </button>
        </div>
      </form>
    </div>
  );
}
