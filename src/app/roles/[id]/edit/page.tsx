'use client'
import React, { useState, useEffect } from 'react';
import { Edit, Activity, Info } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import PermissionMatrix from '@/components/PermissionMatrix';
import { usePCMSStore } from '@/store/useStore';

/**
 * 🛡️ EditRolePage | Dynamic Role Re-Architect
 * Allows modification of existing clinical authorization matrices.
 */
export default function EditRolePage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    allAccess: false,
    isSystemRole: false
  });

  // -------------------------------------------------------------------
  // SYNC | Fetch Master Registry & Role Data
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const roleId = Array.isArray(id) ? id[0] : id;
        const [permsRes, roleRes] = await Promise.all([
          api.get('/roles/permissions'),
          api.get(`/roles/${roleId}`)
        ]);
        
        setAvailablePermissions(permsRes.data);
        setFormData({
            name: roleRes.data.name,
            description: roleRes.data.description || '',
            permissions: roleRes.data.permissions || [],
            allAccess: roleRes.data.allAccess || false,
            isSystemRole: roleRes.data.isSystemRole || false
        });
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch clinical role data:', err);
        showToast('Failed to load role parameters.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.allAccess && formData.permissions.length === 0) {
      showToast('⚠️ Security Warning | Please select at least one permission or enable Full Access.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const roleId = Array.isArray(id) ? id[0] : id;
      await api.put(`/roles/${roleId}`, formData);
      showToast('Clinical role updated successfully.', 'success');
      router.push('/roles');
    } catch (err) {
      console.error('🚫 Registry Error | Failed to update clinical role:', err);
      showToast('Role update failed. Please check medical data.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '10rem 2rem', color: 'var(--text-muted)' }}>
          <div className="animate-pulse font-bold tracking-widest text-xs">🛡️ ACCESSING DYNAMIC SECURITY VAULT...</div>
        </div>
      );
  }

  const isSuperAdmin = !!user?.allAccess;
  const canModifyProtected = isSuperAdmin || !formData.isSystemRole;

  return (
    <div className="edit-role-container animate-fade-in clinical-form-wide">
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
            <button 
              onClick={() => router.back()} 
              style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
            >
              ← Back to Registry
            </button>
            <h1 style={{ fontSize: '2.25rem', letterSpacing: '-0.03em', fontWeight: 800 }}>
              Re-Architect <span className="gradient-text">Clinical Role</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>
              Adjust authorization matrix for <strong>{formData.name}</strong>.
            </p>
        </div>

        <div style={{ background: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Super Admin Mode</div>
                <div style={{ fontSize: '0.85rem', color: formData.allAccess ? 'var(--primary)' : 'var(--text-muted)' }}>{formData.allAccess ? 'Absolute Access Enabled' : 'Modular Access Only'}</div>
            </div>
            <div 
                onClick={() => canModifyProtected && setFormData({ ...formData, allAccess: !formData.allAccess })}
                style={{ 
                    width: '50px', 
                    height: '26px', 
                    background: formData.allAccess ? 'var(--primary)' : '#cbd5e1', 
                    borderRadius: '20px', 
                    position: 'relative', 
                    cursor: canModifyProtected ? 'pointer' : 'not-allowed',
                    transition: 'var(--transition-smooth)',
                    opacity: canModifyProtected ? 1 : 0.6
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

      <form onSubmit={handleSubmit} style={{ opacity: submitting ? 0.7 : 1 }}>
        {/* Core Identity Card */}
        <div className="card glass" style={{ padding: '2.5rem', marginBottom: '2.5rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>Role Name</label>
                    <input 
                      required 
                      disabled={submitting || !canModifyProtected} 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: !canModifyProtected ? '#f8fafc' : 'white', fontWeight: 600, fontSize: '1rem', outline: 'none' }} 
                    />
                    {formData.isSystemRole && (
                      <p style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.5rem', fontWeight: 800 }}>
                        🛡️ SYSTEM ROLE {isSuperAdmin ? '(SUPER-ADMIN UNLOCKED)' : '(READ-ONLY)'}
                      </p>
                    )}
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>Clinical Scope / Description</label>
                    <textarea 
                      disabled={submitting} 
                      rows={1} 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'white', resize: 'none', fontSize: '1rem', outline: 'none' }} 
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

        {formData.allAccess && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(15, 118, 110, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Info size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
              Modular permissions are currently <strong>locked</strong> because Absolute Access (Full Bypass) is enabled for this role.
            </span>
          </div>
        )}

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
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '3rem', marginBottom: '5rem' }}>
          <button 
            type="button" 
            disabled={submitting} 
            onClick={() => router.back()} 
            style={{ padding: '1rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontWeight: 700, background: 'white', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={submitting} 
            className="btn-primary"
            style={{ padding: '1rem 3rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)' }}
          >
            {submitting ? 'Updating Dynamic Role...' : 'Update Clinical Role'}
          </button>
        </div>
      </form>
    </div>
  );
}
