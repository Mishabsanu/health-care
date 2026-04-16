'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import api from '@/services/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { usePCMSStore } from '@/store/useStore';
import { Plus } from 'lucide-react';

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  createdBy?: { name: string };
}

export default function RolesPage() {
  const router = useRouter();
  const { showConfirm, showToast, setIsSyncing } = usePCMSStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // -------------------------------------------------------------------
  // SYNC | Fetch Dynamic Role Registry
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchRoles = async (isInitial = false) => {
      if (isInitial && !hasLoaded) setLoading(true);
      setIsSyncing(true);
      try {
        const res = await api.get('/roles');
        const data = res.data?.data || res.data;
        setRoles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch clinical roles:', err);
      } finally {
        setLoading(false);
        setHasLoaded(true);
        setIsSyncing(false);
      }
    };
    fetchRoles(!hasLoaded);
  }, []);

  const columns = [
    { header: 'ROLE NAME', key: 'name' as keyof Role, style: { fontWeight: 600, color: 'var(--primary)' } },
    { header: 'DESCRIPTION', key: 'description' as keyof Role, style: { fontSize: '0.85rem', color: 'var(--text-muted)' } },
    { 
      header: 'PERMISSIONS', 
      key: (r: Role) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
          {r.permissions.length} Dynamic Authorizations
        </span>
      ) 
    },
    { 
      header: 'TYPE', 
      key: (r: Role) => (
        <span style={{ 
          background: r.isSystemRole ? 'rgba(15, 118, 110, 0.1)' : '#f1f5f9',
          color: r.isSystemRole ? 'var(--primary)' : '#64748b',
          padding: '0.35rem 0.85rem', 
          borderRadius: '1rem', 
          fontSize: '0.7rem', 
          fontWeight: 700 
        }}>
          {r.isSystemRole ? 'SYSTEM PROTECTED' : 'CUSTOM ROLE'}
        </span>
      ) 
    },
    {
      header: 'CREATED BY',
      key: (r: Role) => (
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', opacity: 0.8 }}>
          {r.createdBy?.name?.toUpperCase() || 'SYSTEM'}
        </span>
      )
    },
  ];

  const handleDelete = (role: Role) => {
    if (role.isSystemRole) {
      showToast('System roles cannot be deleted.', 'error');
      return;
    }
    showConfirm(
      'Clear Role Registry',
      `⚠️ Security Alert | Are you sure you want to permanently clear the ${role.name} role registry?`,
      async () => {
        try {
          await api.delete(`/roles/${role._id}`);
          setRoles(roles.filter(r => r._id !== role._id));
          showToast('Role deleted successfully.', 'success');
        } catch (err) {
          console.error('🚫 Registry Error | Failed to clear clinical role:', err);
          showToast('Clearance failed. Please check medical authorization.', 'error');
        }
      },
      true
    );
  };

  if (loading) return <LoadingSpinner />;
  if (roles.length === 0 && !hasLoaded) return <LoadingSpinner />;

  return (
    <div className="roles-container animate-fade-in" style={{ padding: '2rem 2.5rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>PERMISSIONS MATRIX</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            System Access <span className="gradient-text">& Roles</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
            Define global permission matrices for clinical and administrative staff.
          </p>
        </div>
        <button 
          onClick={() => router.push('/roles/add')}
          className="glass-interactive"
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'var(--primary)', 
            color: 'white', 
            padding: '0.8rem 1.75rem', 
            borderRadius: 'var(--radius-md)', 
            fontWeight: 700,
            fontSize: '0.85rem',
            boxShadow: '0 10px 20px -5px rgba(15, 118, 110, 0.3)'
          }}
        >
          <Plus size={18} /> Add Role
        </button>
      </div>

        <DataTable 
          data={roles.map(r => ({ ...r, id: r._id }))}
          columns={columns}
          searchPlaceholder="Search by name, description..."
          onView={(r) => router.push(`/roles/${r._id}`)}
          onEdit={(r) => router.push(`/roles/${r._id}/edit`)}
          onDelete={handleDelete}
          onAddNew={() => router.push('/roles/add')}
          addNewLabel="Add Role"
          filterableFields={[
            { label: 'Type', key: 'isSystemRole' as keyof Role, options: ['true', 'false'] }
          ]}
        />
    </div>
  );
}
