'use client'
import PermissionMatrix from '@/components/PermissionMatrix';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { useFormik } from 'formik';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  name: Yup.string().trim().required('Role name is required'),
  description: Yup.string(),
});

export default function AddRolePage() {
  const router = useRouter();
  const { showToast } = usePCMSStore();
  const [availablePermissions, setAvailablePermissions] = useState<any>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [allAccess, setAllAccess] = useState(false);

  useEffect(() => {
    api.get('/roles/permissions')
      .then(res => setAvailablePermissions(res.data))
      .catch(err => console.error('🚫 Failed to fetch permissions:', err));
  }, []);

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!allAccess && permissions.length === 0) {
        showToast('⚠️ Please select at least one permission or enable Full Access.', 'error');
        return;
      }
      try {
        await api.post('/roles', {
          name: values.name,
          description: values.description,
          permissions,
          allAccess,
        });
        showToast('Role created successfully.', 'success');
        router.push('/roles');
      } catch (err) {
        console.error('🚫 Registry Error | Failed to register clinical role:', err);
        showToast('Role registration failed. Please check data.', 'error');
      }
    },
  });

  const isErr = (field: keyof typeof formik.values) =>
    formik.touched[field] && formik.errors[field];

  return (
    <div className="add-role-container animate-fade-in clinical-form-wide" style={{ padding: '2rem 2.5rem', paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button
            onClick={() => router.back()}
            className="glass-interactive"
            style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, background: 'rgba(15,118,110,0.08)', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Back to Registry
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>PERMISSIONS MATRIX</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Architect <span className="gradient-text">Clinical Role</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
            Define a custom authorization matrix for clinical systems.
          </p>
        </div>

        {/* Super Admin Toggle */}
        <div style={{ background: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Super Admin Mode</div>
            <div style={{ fontSize: '0.85rem', color: allAccess ? 'var(--primary)' : 'var(--text-muted)' }}>
              {allAccess ? 'Absolute Access Enabled' : 'Modular Access Only'}
            </div>
          </div>
          <div
            onClick={() => setAllAccess(v => !v)}
            style={{ width: '50px', height: '26px', background: allAccess ? 'var(--primary)' : '#cbd5e1', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'var(--transition-smooth)' }}
          >
            <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: allAccess ? '27px' : '3px', transition: 'var(--transition-smooth)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
          </div>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} style={{ opacity: formik.isSubmitting ? 0.7 : 1 }}>
        {/* Core Identity Card */}
        <div className="clinical-form-card" style={{ marginBottom: '2.5rem' }}>
          <div className="clinical-form-grid">
            <div className="col-4">
              <label className="label-premium">
                Role Identity Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                name="name"
                type="text"
                className={`input-premium ${isErr('name') ? 'input-error' : ''}`}
                style={{ borderColor: isErr('name') ? '#ef4444' : '' }}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Senior Physiotherapist"
                disabled={formik.isSubmitting}
              />
              {formik.touched.name && formik.errors.name && (
                <div style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, marginTop: '0.35rem' }}>
                  ⚠️ {formik.errors.name}
                </div>
              )}
            </div>

            <div className="col-8">
              <label className="label-premium">
                Clinical Scope / Description <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>(Optional)</span>
              </label>
              <textarea
                name="description"
                rows={1}
                className="input-premium"
                value={formik.values.description}
                onChange={formik.handleChange}
                placeholder="Define the scope of clinical responsibilities..."
                style={{ height: '48px', resize: 'none' }}
                disabled={formik.isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Permission Matrix */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Authorization <span className="gradient-text">Matrix</span>
          </h2>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-main)' }}>{permissions.length}</strong> Modules Active
            </span>
            <span style={{ color: allAccess ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700 }}>
              {allAccess ? '⚠️ FULL BYPASS ACTIVE' : '✓ CONTROLLED ACCESS'}
            </span>
          </div>
        </div>

        {availablePermissions ? (
          <PermissionMatrix
            availablePermissions={availablePermissions}
            selectedPermissions={permissions}
            onChange={setPermissions}
            disabled={allAccess}
          />
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)', background: 'white' }}>
            <div className="animate-pulse" style={{ fontSize: '2rem', marginBottom: '1rem' }}>🛡️</div>
            <div style={{ fontWeight: 600 }}>Synchronizing Master Permissions Registry...</div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-end', marginTop: '3rem', marginBottom: '5rem' }}>
          <button
            type="button"
            disabled={formik.isSubmitting}
            onClick={() => router.back()}
            style={{ padding: '0.85rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontWeight: 600, background: 'white' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="glass-interactive"
            style={{ padding: '0.85rem 3.5rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 700, boxShadow: '0 10px 20px -5px rgba(15, 118, 110, 0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            {formik.isSubmitting ? 'Initializing...' : <><CheckCircle2 size={18} /> SAVE CLINICAL ROLE</>}
          </button>
        </div>
      </form>
    </div>
  );
}
