'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import PermissionMatrix from '@/components/PermissionMatrix';

/**
 * 🛡️ AddRolePage | Dynamic Role Architect
 * Modern UI for defining clinical authorization matrices.
 */
export default function AddRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    allAccess: false
  });

  // -------------------------------------------------------------------
  // SYNC | Fetch Master Permission Registry
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchPerms = async () => {
      try {
        const res = await api.get('/roles/permissions');
        // Handle both object (Registry) and array (Legacy) formats
        const data = res.data;
        setAvailablePermissions(data);
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch clinical permissions:', err);
      }
    };
    fetchPerms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.allAccess && formData.permissions.length === 0) {
      alert('⚠️ Security Warning | Please select at least one permission or enable Full Access.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/roles', formData);
      router.push('/roles');
    } catch (err) {
      console.error('🚫 Registry Error | Failed to register clinical role:', err);
      alert('Role registration failed. Please check medical data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-role-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button
            onClick={() => router.back()}
            style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Back to Registry
          </button>
          <h1 style={{ fontSize: '2.25rem', letterSpacing: '-0.03em', fontWeight: 800 }}>
            Architect <span className="gradient-text">Clinical Role</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>
            Define a custom authorization matrix for medical staff and administrators.
          </p>
        </div>

        <div style={{ background: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Super Admin Mode</div>
            <div style={{ fontSize: '0.85rem', color: formData.allAccess ? 'var(--primary)' : 'var(--text-muted)' }}>{formData.allAccess ? 'Absolute Access Enabled' : 'Modular Access Only'}</div>
          </div>
          <div
            onClick={() => setFormData({ ...formData, allAccess: !formData.allAccess })}
            style={{
              width: '50px',
              height: '26px',
              background: formData.allAccess ? 'var(--primary)' : '#cbd5e1',
              borderRadius: '20px',
              position: 'relative',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              background: 'white',
              borderRadius: '50%',
              position: 'absolute',
              top: '3px',
              left: formData.allAccess ? '27px' : '3px',
              transition: 'var(--transition-smooth)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}></div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ opacity: loading ? 0.7 : 1 }}>
        {/* Core Identity Card */}
        <div className="clinical-form-card" style={{ marginBottom: '2.5rem' }}>
          <div className="clinical-form-grid">
            <div className="col-4">
              <label className="label-premium">Role Identity Name</label>
              <input
                required
                disabled={loading}
                type="text"
                className="input-premium"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Senior Physiotherapist"
              />
            </div>
            <div className="col-8">
              <label className="label-premium">Clinical Scope / Description</label>
              <textarea
                disabled={loading}
                rows={1}
                className="input-premium"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Define the scope of clinical responsibilities..."
                style={{ height: '48px', resize: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Permission Matrix Section */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Authorization <span className="gradient-text">Matrix</span>
          </h2>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-main)' }}>{formData.permissions.length}</strong> Modules Active
            </span>
            <span style={{ color: formData.allAccess ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700 }}>
              {formData.allAccess ? '⚠️ FULL BYPASS ACTIVE' : '✓ CONTROLLED ACCESS'}
            </span>
          </div>
        </div>

        {availablePermissions ? (
          <PermissionMatrix
            availablePermissions={availablePermissions}
            selectedPermissions={formData.permissions}
            onChange={(perms) => setFormData({ ...formData, permissions: perms })}
            disabled={formData.allAccess}
          />
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)', background: 'white' }}>
            <div className="animate-pulse" style={{ fontSize: '2rem', marginBottom: '1rem' }}>🛡️</div>
            <div style={{ fontWeight: 600 }}>Synchronizing Master Permissions Registry...</div>
          </div>
        )}

        {/* Global Controls */}
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-end', marginTop: '3rem', marginBottom: '5rem' }}>
          <button
            type="button"
            disabled={loading}
            onClick={() => router.back()}
            style={{ padding: '0.85rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontWeight: 600, background: 'white' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '0.85rem 3.5rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 700, boxShadow: 'var(--shadow-sm)' }}
          >
            {loading ? 'Initializing Dynamic Role...' : 'SAVE CLINICAL ROLE'}
          </button>
        </div>
      </form>
    </div>
  );
}
