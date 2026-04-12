'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, User, Mail, ShieldCheck, Building, Activity, CheckCircle2, Lock, Banknote } from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';

export default function EditUserPage() {
  const router = useRouter();
  const { id } = useParams();
  const { setIsSyncing, showToast, user: currentUser } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleId: '',
    status: '',
    // 💼 KYC & Compensation
    panCard: '',
    adharCard: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    joinDate: '',
    salaryDetails: {
      basicSalary: 0,
      allowance: 0,
      deduction: 0
    }
  });

  // -------------------------------------------------------------------
  // SYNC | Fetch Clinical Registry & User Profile
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      setIsSyncing(true);
      try {
        const [userRes, rolesRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get('/roles')
        ]);
        
        const user = userRes.data;
        setFormData({
          name: user.name,
          email: user.email,
          roleId: user.role?._id || user.role,
          status: user.status || 'Active',
          panCard: user.panCard || '',
          adharCard: user.adharCard || '',
          accountNumber: user.accountNumber || '',
          ifscCode: user.ifscCode || '',
          bankName: user.bankName || '',
          joinDate: user.joinDate ? new Date(user.joinDate).toISOString().split('T')[0] : '',
          salaryDetails: {
            basicSalary: user.salaryDetails?.basicSalary || 0,
            allowance: user.salaryDetails?.allowance || 0,
            deduction: user.salaryDetails?.deduction || 0
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
  }, [id, setIsSyncing, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setIsSyncing(true);
    try {
      await api.put(`/users/${id}`, {
        ...formData,
        roleId: formData.roleId
      });
      showToast('Personnel profile updated successfully.', 'success');
      router.push('/users');
    } catch (err) {
      console.error('🚫 Update Error:', err);
      showToast('Failed to update clinical personnel profile.', 'error');
    } finally {
      setSaving(false);
      setIsSyncing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin" />
      <p className="font-bold text-slate-400 animate-pulse text-xs tracking-widest">🛡️ SYNCHRONIZING PERSONNEL DATA...</p>
    </div>
  );

  return (
    <div className="edit-user-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>
      
      {/* 🏥 CLINICAL HEADER */}
      <div style={{ marginBottom: '3rem' }}>
        <button 
          onClick={() => router.back()} 
          style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
        >
          <ArrowLeft size={16} /> Personnel Dashboard
        </button>
        <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Modify Staff <span className="gradient-text">Account</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Adjust system access permissions and account status.</p>
      </div>

      <form onSubmit={handleSubmit} className="clinical-form-card" style={{ opacity: saving ? 0.7 : 1 }}>
        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', marginBottom: '2.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderLeft: '4px solid var(--primary)', fontWeight: 600 }}>
           Registry Reference: <strong style={{ color: 'var(--primary)' }}>{id}</strong> • Verified Personnel Record
        </div>

        <div className="clinical-form-grid">
           {/* Section 1: Staff Identity */}
           <div className="col-12" style={{ 
              marginBottom: '1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '4px solid var(--primary)'
          }}>
            <User size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Staff <span className="gradient-text">Identity</span>
            </h3>
          </div>

          <div className="col-12">
            <label className="label-premium">Personnel Full Name <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input required disabled={saving} type="text" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Dr. Jane Smith" />
            </div>
          </div>

          <div className="col-6">
            <label className="label-premium">Clinical Email (Username) <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input required disabled={saving} type="email" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="jane.smith@physio.com" />
            </div>
          </div>

          <div className="col-6">
             <label className="label-premium">Account Status <span style={{ color: '#ef4444' }}>*</span></label>
             <div style={{ position: 'relative' }}>
              <Activity size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <select required disabled={saving} className="input-premium" style={{ paddingLeft: '2.75rem', fontWeight: 800, color: 'var(--primary)' }} value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="Active">Operational / Active</option>
                <option value="Inactive">Access Suspended</option>
              </select>
             </div>
          </div>

          {/* Section 2: Authorization */}
          <div className="col-12" style={{ 
              margin: '2rem 0 1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '4px solid var(--primary)'
          }}>
            <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Access <span className="gradient-text">Authorization</span>
            </h3>
          </div>

          <div className="col-6">
            <label className="label-premium">Primary Clinical Role <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <select required disabled={saving} className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.roleId} onChange={(e) => setFormData({...formData, roleId: e.target.value})}>
                <option value="" disabled>Select Role Registry</option>
                {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div className="col-12" style={{ height: '2rem', borderBottom: '1px solid var(--border-subtle)', margin: '1rem 0' }} />

          {/* Section 3: Personnel KYC */}
          <div className="col-12">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.5rem', color: 'var(--primary)' }}>Personnel KYC & Identity</h3>
          </div>
          
          <div className="col-6">
            <label className="label-premium">PAN Card Number</label>
            <input disabled={saving} type="text" className="input-premium" value={formData.panCard} onChange={(e) => setFormData({ ...formData, panCard: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" />
          </div>
          <div className="col-6">
            <label className="label-premium">Aadhaar Card Number</label>
            <input disabled={saving} type="text" className="input-premium" value={formData.adharCard} onChange={(e) => setFormData({ ...formData, adharCard: e.target.value })} placeholder="1234 5678 9012" />
          </div>
          <div className="col-6">
            <label className="label-premium">Joining Date</label>
            <input required disabled={saving} type="date" className="input-premium" value={formData.joinDate} onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })} />
          </div>

          <div className="col-12" style={{ height: '1.5rem' }} />

          {/* Section 4: Banking & Compensation */}
          <div className="col-12">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.5rem', color: '#10b981' }}>Banking & Salary Structure</h3>
          </div>

          <div className="col-4">
            <label className="label-premium">Bank Name</label>
            <input disabled={saving} type="text" className="input-premium" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} placeholder="State Bank of India" />
          </div>
          <div className="col-4">
            <label className="label-premium">Account Number</label>
            <input disabled={saving} type="text" className="input-premium" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} placeholder="00000000000" />
          </div>
          <div className="col-4">
            <label className="label-premium">IFSC Code</label>
            <input disabled={saving} type="text" className="input-premium" value={formData.ifscCode} onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })} placeholder="SBIN0001234" />
          </div>

          <div className="col-4">
            <label className="label-premium">Basic Salary (₹)</label>
            <input required disabled={saving} type="number" className="input-premium" style={{ fontWeight: 800, color: 'var(--primary)' }} value={formData.salaryDetails.basicSalary} onChange={(e) => setFormData({ ...formData, salaryDetails: { ...formData.salaryDetails, basicSalary: parseFloat(e.target.value) || 0 } })} />
          </div>
          <div className="col-4">
            <label className="label-premium">Allowances (₹)</label>
            <input disabled={saving} type="number" className="input-premium" style={{ fontWeight: 800, color: '#10b981' }} value={formData.salaryDetails.allowance} onChange={(e) => setFormData({ ...formData, salaryDetails: { ...formData.salaryDetails, allowance: parseFloat(e.target.value) || 0 } })} />
          </div>
          <div className="col-4">
            <label className="label-premium">Deductions (₹)</label>
            <input disabled={saving} type="number" className="input-premium" style={{ fontWeight: 800, color: '#ef4444' }} value={formData.salaryDetails.deduction} onChange={(e) => setFormData({ ...formData, salaryDetails: { ...formData.salaryDetails, deduction: parseFloat(e.target.value) || 0 } })} />
          </div>

          <div className="col-12" style={{ marginTop: '1.5rem' }}>
             <div style={{ 
                 background: 'var(--primary)', 
                 padding: '1.5rem', 
                 borderRadius: 'var(--radius-md)', 
                 color: 'white',
                 display: 'flex',
                 justifyContent: 'space-between',
                 alignItems: 'center',
                 boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.4)'
             }}>
                <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calculated Monthly Take-Home</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 950 }}>₹{((formData.salaryDetails.basicSalary || 0) + (formData.salaryDetails.allowance || 0) - (formData.salaryDetails.deduction || 0)).toLocaleString()}</div>
                </div>
                <div style={{ opacity: 0.2 }}>
                    <Banknote size={48} />
                </div>
             </div>
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
