'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';

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
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const { showConfirm, showToast } = usePCMSStore();

  // -------------------------------------------------------------------
  // SYNC | Fetch Dynamic Role Registry
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/roles');
        const data = res.data?.data || res.data;
        setRoles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch clinical roles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
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

  return (
    <div className="roles-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Role <span className="gradient-text">Management</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Define dynamic permission matrices for clinical and administrative staff.</p>
        </div>
        <button 
          onClick={() => router.push('/roles/add')}
          style={{ background: 'var(--primary)', color: 'white', padding: '0.8rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600, border: 'none', cursor: 'pointer' }}
        >
          Add Role
        </button>
      </div>

        <DataTable 
          data={roles.map(r => ({ ...r, id: r._id }))}
          columns={columns}
          searchPlaceholder="Search by name, description..."
          onView={(r) => router.push(`/roles/${r._id}`)}
          onEdit={(r) => router.push(`/roles/${r._id}/edit`)}
          onDelete={handleDelete}
          filterableFields={[
            { label: 'Type', key: 'isSystemRole' as keyof Role, options: ['true', 'false'] }
          ]}
        />
    </div>
  );
}
