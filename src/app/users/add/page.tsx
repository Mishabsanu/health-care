'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { Banknote } from 'lucide-react';

export default function OnboardUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);

  const { showToast } = usePCMSStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    status: 'Active',
    // 💼 KYC & Compensation
    panCard: '',
    adharCard: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    joinDate: new Date().toISOString().split('T')[0],
    salaryDetails: {
      basicSalary: 0,
      allowance: 0,
      deduction: 0
    }
  });

  // -------------------------------------------------------------------
  // SYNC | Fetch Clinical Registry Data for Dropdowns
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const rolesRes = await api.get('/roles');
        setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data?.data || []));
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch clinical options:', err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      await api.post('/auth/register', formData);
      router.push('/users');
    } catch (err) {
      console.error('🚫 Registry Error | Failed to onboard clinical user:', err);
      showToast('User registration failed. Please check personnel data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboard-user-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <button
          onClick={() => router.back()}
          style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ← Back to Personnel
        </button>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Onboard <span className="gradient-text">Clinical Staff</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>Initialize a new clinical personnel account with role-based access.</p>
      </div>

      <form onSubmit={handleSubmit} className="clinical-form-card" style={{ opacity: loading ? 0.7 : 1 }} autoComplete="off">
        <div className="clinical-form-grid">
          {/* Section 1: Identity */}
          <div className="col-12">
            <label className="label-premium">Specialist Full Name</label>
            <input required disabled={loading} type="text" className="input-premium" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Dr. Jane Smith" />
          </div>

          <div className="col-6">
            <label className="label-premium">Clinical Email (Username)</label>
            <input required disabled={loading} type="email" className="input-premium" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jane.smith@physio.com" autoComplete="none" />
          </div>
          <div className="col-6">
            <label className="label-premium">Secure Vault Password</label>
            <input required disabled={loading} type="password" className="input-premium" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" autoComplete="new-password" />
          </div>

          <div className="col-12" style={{ height: '1rem' }} />

          {/* Section 2: Authorization */}
          <div className="col-12">
            <label className="label-premium">Primary Clinical Role</label>
            <select required disabled={loading} className="input-premium" value={formData.roleId} onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}>
              <option value="">Select Role Registry</option>
              {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </div>

          <div className="col-12" style={{ height: '2rem', borderBottom: '1px solid var(--border-subtle)', margin: '1rem 0' }} />

          {/* Section 3: KYC & Identity */}
          <div className="col-12">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.5rem', color: 'var(--primary)' }}>Personnel KYC & Identity</h3>
          </div>
          
          <div className="col-6">
            <label className="label-premium">PAN Card Number</label>
            <input disabled={loading} type="text" className="input-premium" value={formData.panCard} onChange={(e) => setFormData({ ...formData, panCard: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" />
          </div>
          <div className="col-6">
            <label className="label-premium">Aadhaar Card Number</label>
            <input disabled={loading} type="text" className="input-premium" value={formData.adharCard} onChange={(e) => setFormData({ ...formData, adharCard: e.target.value })} placeholder="1234 5678 9012" />
          </div>
          <div className="col-6">
            <label className="label-premium">Joining Date</label>
            <input required disabled={loading} type="date" className="input-premium" value={formData.joinDate} onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })} />
          </div>

          <div className="col-12" style={{ height: '1.5rem' }} />

          {/* Section 4: Banking & Compensation */}
          <div className="col-12">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.5rem', color: '#10b981' }}>Banking & Salary Structure</h3>
          </div>

          <div className="col-4">
            <label className="label-premium">Bank Name</label>
            <input disabled={loading} type="text" className="input-premium" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} placeholder="State Bank of India" />
          </div>
          <div className="col-4">
            <label className="label-premium">Account Number</label>
            <input disabled={loading} type="text" className="input-premium" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} placeholder="00000000000" />
          </div>
          <div className="col-4">
            <label className="label-premium">IFSC Code</label>
            <input disabled={loading} type="text" className="input-premium" value={formData.ifscCode} onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })} placeholder="SBIN0001234" />
          </div>

          <div className="col-4">
            <label className="label-premium">Basic Salary (₹)</label>
            <input required disabled={loading} type="number" className="input-premium" style={{ fontWeight: 800, color: 'var(--primary)' }} value={formData.salaryDetails.basicSalary} onChange={(e) => setFormData({ ...formData, salaryDetails: { ...formData.salaryDetails, basicSalary: parseFloat(e.target.value) || 0 } })} />
          </div>
          <div className="col-4">
            <label className="label-premium">Allowances (₹)</label>
            <input disabled={loading} type="number" className="input-premium" style={{ fontWeight: 800, color: '#10b981' }} value={formData.salaryDetails.allowance} onChange={(e) => setFormData({ ...formData, salaryDetails: { ...formData.salaryDetails, allowance: parseFloat(e.target.value) || 0 } })} />
          </div>
          <div className="col-4">
            <label className="label-premium">Deductions (₹)</label>
            <input disabled={loading} type="number" className="input-premium" style={{ fontWeight: 800, color: '#ef4444' }} value={formData.salaryDetails.deduction} onChange={(e) => setFormData({ ...formData, salaryDetails: { ...formData.salaryDetails, deduction: parseFloat(e.target.value) || 0 } })} />
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

        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'flex-end', marginTop: '3.5rem' }}>
          <button type="button" disabled={loading} onClick={() => router.back()} style={{ padding: '0.85rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '0.85rem 3.5rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 700, boxShadow: 'var(--shadow-sm)' }}>
            {loading ? 'Initializing Onboarding...' : 'AUTHORIZE STAFF ACCOUNT'}
          </button>
        </div>
      </form>
    </div>
  );
}
