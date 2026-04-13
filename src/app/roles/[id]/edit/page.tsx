'use client'
import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, CheckCircle2, Info } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import PermissionMatrix from '@/components/PermissionMatrix';
import { usePCMSStore } from '@/store/useStore';

const validationSchema = Yup.object().shape({
  name: Yup.string().trim().required('Role name is required'),
  description: Yup.string(),
});

export default function EditRolePage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [availablePermissions, setAvailablePermissions] = useState<any>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [allAccess, setAllAccess] = useState(false);
  const [isSystemRole, setIsSystemRole] = useState(false);

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
        const roleId = Array.isArray(id) ? id[0] : id;
        await api.put(`/roles/${roleId}`, {
          name: values.name,
          description: values.description,
          permissions,
          allAccess,
        });
        showToast('Clinical role updated successfully.', 'success');
        router.push('/roles');
      } catch (err) {
        console.error('🚫 Registry Error | Failed to update clinical role:', err);
        showToast('Role update failed. Please check data.', 'error');
      }
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roleId = Array.isArray(id) ? id[0] : id;
        const [permsRes, roleRes] = await Promise.all([
          api.get('/roles/permissions'),
          api.get(`/roles/${roleId}`)
        ]);
        setAvailablePermissions(permsRes.data);
        const role = roleRes.data;
        formik.setValues({
          name: role.name || '',
          description: role.description || '',
        });
        setPermissions(role.permissions || []);
        setAllAccess(role.allAccess || false);
        setIsSystemRole(role.isSystemRole || false);
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch clinical role data:', err);
        showToast('Failed to load role parameters.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '10rem 2rem', color: 'var(--text-muted)' }}>
        <div className="animate-pulse" style={{ fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.1em' }}>🛡️ ACCESSING DYNAMIC SECURITY VAULT...</div>
      </div>
    );
  }

  const isSuperAdmin = !!user?.allAccess;
  const canModifyProtected = isSuperAdmin || !isSystemRole;

  return (
    <div className="edit-role-container animate-fade-in clinical-form-wide">
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button
            onClick={() => router.back()}
            style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15,118,110,0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Back to Registry
          </button>
          <h1 style={{ fontSize: '2.25rem', letterSpacing: '-0.03em', fontWeight: 800 }}>
            Re-Architect <span className="gradient-text">Clinical Role</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>
            Adjust authorization matrix for <strong>{formik.values.name}</strong>. Fields marked <span style={{ color: '#ef4444' }}>*</span> are required.
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
            onClick={() => canModifyProtected && setAllAccess(v => !v)}
            style={{ width: '50px', height: '26px', background: allAccess ? 'var(--primary)' : '#cbd5e1', borderRadius: '20px', position: 'relative', cursor: canModifyProtected ? 'pointer' : 'not-allowed', transition: 'var(--transition-smooth)', opacity: canModifyProtected ? 1 : 0.6 }}
          >
            <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: allAccess ? '27px' : '3px', transition: 'var(--transition-smooth)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
          </div>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} style={{ opacity: formik.isSubmitting ? 0.7 : 1 }}>
        {/* Core Identity Card */}
        <div className="card glass" style={{ padding: '2.5rem', marginBottom: '2.5rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem' }}>
            <div>
              <label className="label-premium">
                Role Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                name="name"
                type="text"
                className={`input-premium ${formik.touched.name && formik.errors.name ? 'input-error' : ''}`}
                style={{ borderColor: formik.touched.name && formik.errors.name ? '#ef4444' : '' }}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={formik.isSubmitting || !canModifyProtected}
              />
              {formik.touched.name && formik.errors.name && (
                <div style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, marginTop: '0.35rem' }}>
                  ⚠️ {formik.errors.name}
                </div>
              )}
              {isSystemRole && (
                <p style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.5rem', fontWeight: 800 }}>
                  🛡️ SYSTEM ROLE {isSuperAdmin ? '(SUPER-ADMIN UNLOCKED)' : '(READ-ONLY)'}
                </p>
              )}
            </div>

            <div>
              <label className="label-premium">
                Clinical Scope / Description <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>(Optional)</span>
              </label>
              <textarea
                name="description"
                rows={1}
                className="input-premium"
                value={formik.values.description}
                onChange={formik.handleChange}
                disabled={formik.isSubmitting}
                style={{ resize: 'none', height: '48px' }}
                placeholder="Define the scope of clinical responsibilities..."
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

        {allAccess && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(15,118,110,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Info size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
              Modular permissions are currently <strong>locked</strong> because Absolute Access (Full Bypass) is enabled for this role.
            </span>
          </div>
        )}

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
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '3rem', marginBottom: '5rem' }}>
          <button
            type="button"
            disabled={formik.isSubmitting}
            onClick={() => router.back()}
            style={{ padding: '1rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontWeight: 700, background: 'white', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formik.isSubmitting}
            style={{ padding: '1rem 3rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,118,110,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            {formik.isSubmitting ? 'Updating...' : <><CheckCircle2 size={18} /> Update Clinical Role</>}
          </button>
        </div>
      </form>
    </div>
  );
}
