'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, User, Mail, ShieldCheck, Activity, CheckCircle2, Lock, Banknote, Calendar } from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import LoadingSpinner from '@/components/LoadingSpinner';

const validationSchema = Yup.object().shape({
  name: Yup.string().trim().required('Full name is required'),
  phone: Yup.string().required('Mobile number is required').length(10, 'Must be exactly 10 digits'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  roleId: Yup.string().required('Role is required'),
  status: Yup.string().required('Status is required'),
  joinDate: Yup.string().required('Joining date is required'),
  panCard: Yup.string(),
  adharCard: Yup.string(),
  bankName: Yup.string(),
  accountNumber: Yup.string(),
  ifscCode: Yup.string(),
  basicSalary: Yup.number().typeError('Must be a number').min(0),
  allowance: Yup.number().typeError('Must be a number').min(0),
  deduction: Yup.number().typeError('Must be a number').min(0),
});

export default function EditUserPage() {
  const router = useRouter();
  const { id } = useParams();
  const { setIsSyncing, showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);

  const formik = useFormik({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      roleId: '',
      status: 'Active',
      joinDate: '',
      panCard: '',
      adharCard: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      salaryDetails: {
        basicSalary: 0,
        allowance: 0,
        deduction: 0,
      },
      salaryConfig: {
        type: 'Monthly',
        rate: 0,
        expectedHoursPerDay: 8,
        overtimeRate: 0
      }
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSyncing(true);
      try {
        await api.put(`/users/${id}`, values);
        showToast('Personnel profile updated successfully.', 'success');
        router.push('/users');
      } catch (err) {
        console.error('🚫 Update Error:', err);
        showToast('Failed to update clinical personnel profile.', 'error');
      } finally {
        setIsSyncing(false);
      }
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsSyncing(true);
      try {
        const [userRes, rolesRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get('/roles')
        ]);
        const u = userRes.data;
        formik.setValues({
          name: u.name || '',
          phone: u.phone || '',
          email: u.email || '',
          roleId: u.role?._id || u.role || '',
          status: u.status || 'Active',
          joinDate: u.joinDate ? new Date(u.joinDate).toISOString().split('T')[0] : '',
          panCard: u.panCard || '',
          adharCard: u.adharCard || '',
          bankName: u.bankName || '',
          accountNumber: u.accountNumber || '',
          ifscCode: u.ifscCode || '',
          salaryDetails: {
            basicSalary: u.salaryDetails?.basicSalary || 0,
            allowance: u.salaryDetails?.allowance || 0,
            deduction: u.salaryDetails?.deduction || 0,
          },
          salaryConfig: {
            type: u.salaryConfig?.type || 'Monthly',
            rate: u.salaryConfig?.rate || 0,
            expectedHoursPerDay: u.salaryConfig?.expectedHoursPerDay || 8,
            overtimeRate: u.salaryConfig?.overtimeRate || 0
          }
        });
        setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data?.data || []));
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch user data:', err);
        showToast('Failed to load personnel profile.', 'error');
      } finally {
        setLoading(false);
        setIsSyncing(false);
      }
    };
    fetchData();
  }, [id]);

  const isErr = (field: keyof typeof formik.values) =>
    formik.touched[field] && formik.errors[field];

  const ErrMsg = ({ name }: { name: keyof typeof formik.values }) =>
    formik.touched[name] && formik.errors[name] ? (
      <div style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, marginTop: '0.35rem' }}>
        {formik.errors[name] as string}
      </div>
    ) : null;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="edit-user-container animate-fade-in clinical-form-wide" style={{ padding: '2rem 2.5rem', paddingBottom: '7rem' }}>
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
          Modify <span className="gradient-text">Specialist Profile</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
          Update administrative credentials and clinical authorization for this specialist.
        </p>
      </div>

      <form onSubmit={formik.handleSubmit} className="clinical-form-card" style={{ opacity: formik.isSubmitting ? 0.7 : 1 }}>
        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', marginBottom: '2.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderLeft: '4px solid var(--primary)', fontWeight: 600 }}>
          Registry Reference: <strong style={{ color: 'var(--primary)' }}>{id}</strong> • Verified Personnel Record
        </div>

        <div className="clinical-form-grid">
          <div className="col-12" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'linear-gradient(90deg,rgba(15,118,110,0.05) 0%,transparent 100%)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <User size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Staff <span className="gradient-text">Identity</span></h3>
          </div>

          <div className="col-6">
            <label className="label-premium">Personnel Full Name <span style={{ color: '#ef4444' }}>*</span></label>
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
              <input name="email" type="email" className={`input-premium ${isErr('email') ? 'input-error' : ''}`} style={{ paddingLeft: '2.75rem', borderColor: isErr('email') ? '#ef4444' : '' }} value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            </div>
            <ErrMsg name="email" />
          </div>

          <div className="col-6">
            <label className="label-premium">Account Status <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Activity size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.6 }} />
              <select name="status" className="input-premium" style={{ paddingLeft: '2.75rem', fontWeight: 800, color: 'var(--primary)' }} value={formik.values.status} onChange={formik.handleChange}>
                <option value="Active">Operational / Active</option>
                <option value="Inactive">Access Suspended</option>
              </select>
            </div>
          </div>

          <div className="col-6">
            <label className="label-premium">Primary Clinical Role <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: isErr('roleId') ? '#ef4444' : 'var(--text-muted)', opacity: 0.6 }} />
              <select name="roleId" className={`input-premium ${isErr('roleId') ? 'input-error' : ''}`} style={{ paddingLeft: '2.75rem', borderColor: isErr('roleId') ? '#ef4444' : '' }} value={formik.values.roleId} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                <option value="" disabled>— Select Role —</option>
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

          {/* KYC */}
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

          {/* Banking */}
          <div className="col-12" style={{ margin: '1.5rem 0 1rem', padding: '0.75rem 1rem', background: 'linear-gradient(90deg,rgba(16,185,129,0.05) 0%,transparent 100%)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Banknote size={18} style={{ color: '#10b981' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Banking &amp; <span style={{ color: '#10b981' }}>Salary</span></h3>
          </div>
          <div className="col-4">
            <label className="label-premium">Bank Name</label>
            <input name="bankName" type="text" className="input-premium" value={formik.values.bankName} onChange={formik.handleChange} placeholder="State Bank of India" />
          </div>
          <div className="col-4">
            <label className="label-premium">Account Number</label>
            <input name="accountNumber" type="text" className="input-premium" value={formik.values.accountNumber} onChange={formik.handleChange} placeholder="00000000000" />
          </div>
          <div className="col-4">
            <label className="label-premium">IFSC Code</label>
            <input name="ifscCode" type="text" className="input-premium" value={formik.values.ifscCode} onChange={(e) => formik.setFieldValue('ifscCode', e.target.value.toUpperCase())} placeholder="SBIN0001234" />
          </div>

          <div className="col-4">
            <label className="label-premium">Salary Type</label>
            <select name="salaryConfig.type" className="input-premium" value={formik.values.salaryConfig.type} onChange={formik.handleChange}>
              <option value="Monthly">Fixed Monthly</option>
              <option value="Daily">Daily Rate</option>
              <option value="Hourly">Hourly Rate</option>
            </select>
          </div>

          <div className="col-4">
            <label className="label-premium">Pay Rate (₹ {formik.values.salaryConfig.type !== 'Monthly' ? '/ unit' : ''})</label>
            <input name="salaryConfig.rate" type="number" className="input-premium" value={formik.values.salaryConfig.rate} onChange={formik.handleChange} placeholder="0" />
          </div>

          <div className="col-4">
            <label className="label-premium">Expt. Hours / Day</label>
            <input name="salaryConfig.expectedHoursPerDay" type="number" className="input-premium" value={formik.values.salaryConfig.expectedHoursPerDay} onChange={formik.handleChange} placeholder="8" />
          </div>

          <div className="col-4">
            <label className="label-premium">Overtime Rate (₹/hr)</label>
            <input name="salaryConfig.overtimeRate" type="number" className="input-premium" value={formik.values.salaryConfig.overtimeRate} onChange={formik.handleChange} placeholder="0" />
          </div>

          {formik.values.salaryConfig.type === 'Monthly' && (
            <>
              <div className="col-4">
                <label className="label-premium">Basic Salary (₹)</label>
                <input name="salaryDetails.basicSalary" type="number" className="input-premium" value={formik.values.salaryDetails.basicSalary} onChange={formik.handleChange} />
              </div>
              <div className="col-4">
                <label className="label-premium">Allowances (₹)</label>
                <input name="salaryDetails.allowance" type="number" className="input-premium" value={formik.values.salaryDetails.allowance} onChange={formik.handleChange} />
              </div>
              <div className="col-4">
                <label className="label-premium">Deductions (₹)</label>
                <input name="salaryDetails.deduction" type="number" className="input-premium" value={formik.values.salaryDetails.deduction} onChange={formik.handleChange} />
              </div>
            </>
          )}

          <div className="col-12" style={{ marginTop: '1.5rem' }}>
            <div style={{ background: 'var(--primary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>Configured Payment Model</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                  {formik.values.salaryConfig.type === 'Monthly'
                    ? `₹${((Number(formik.values.salaryDetails.basicSalary) || 0) + (Number(formik.values.salaryDetails.allowance) || 0) - (Number(formik.values.salaryDetails.deduction) || 0)).toLocaleString()} / month`
                    : `₹${formik.values.salaryConfig.rate} / ${formik.values.salaryConfig.type === 'Daily' ? 'day' : 'hour'}`
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'flex-end', marginTop: '4rem' }}>
          <button type="button" onClick={() => router.back()} style={{ padding: '0.85rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontWeight: 700, background: 'white', color: 'var(--text-muted)' }}>CANCEL</button>
          <button type="submit" disabled={formik.isSubmitting} style={{ padding: '0.85rem 3.5rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 20px -5px rgba(13,148,136,0.4)' }}>
            {formik.isSubmitting ? 'SYNCHRONIZING...' : <><CheckCircle2 size={18} /> AUTHORIZE UPDATE</>}
          </button>
        </div>
      </form>
    </div>
  );
}
