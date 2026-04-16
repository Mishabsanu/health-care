'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import { usePCMSStore } from '@/store/useStore';
import api from '@/services/api';
import Loading from '@/components/Loading';
import { Plus } from 'lucide-react';

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  phone: string;
  status: 'Available' | 'On Leave' | 'Busy';
  createdBy?: { name: string };
}

export default function DoctorsPage() {
  const router = useRouter();
  const { isLoading: storeLoading, setIsSyncing, showToast } = usePCMSStore();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleDeleteDoctor = async (doctor: Doctor) => {
    if (!confirm(`⚠️ WARNING: You are about to purge specialist ${doctor.name} from the clinical registry. Continue?`)) return;
    
    try {
      await api.delete(`/doctors/${doctor._id}`);
      showToast('Specialist successfully removed from registry.', 'success');
      await fetchDoctors();
    } catch (err) {
      console.error('🚫 Registry Error | Deletion failed:', err);
      showToast('Failed to remove specialist. Ensure no active dependencies exist.', 'error');
    }
  };

  const fetchDoctors = async (isInitial = false) => {
    if (isInitial && !hasLoaded) setLocalLoading(true);
    setIsSyncing(true);
    try {
      const res = await api.get('/doctors');
      const data = res.data?.data || res.data;
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('🚫 Registry Error | Failed to fetch specialists:', err);
    } finally {
      setLocalLoading(false);
      setHasLoaded(true);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchDoctors(!hasLoaded);
  }, []);

  const doctorsForTable = useMemo(() => 
    doctors.map(d => ({ ...d, id: d._id })), 
  [doctors]);

  const columns = useMemo(() => [
    { header: 'SPECIALIST NAME', key: 'name' as keyof Doctor, style: { fontWeight: 600, color: 'var(--primary)' } },
    { 
      header: 'CLINICAL CATEGORY', 
      searchable: false,
      key: (d: Doctor) => (
        <span style={{ 
          background: 'rgba(15, 118, 110, 0.1)', 
          color: 'var(--primary)', 
          padding: '0.3rem 0.75rem', 
          borderRadius: '0.5rem', 
          fontSize: '0.75rem', 
          fontWeight: 700 
        }}>
          {d.specialization}
        </span>
      ) 
    },
    { header: 'CONTACT', key: 'phone' as keyof Doctor, style: { fontSize: '0.9rem' } },
    { 
      header: 'STATUS', 
      searchable: false,
      key: (d: Doctor) => (
        <span style={{ 
          background: d.status === 'Available' ? '#dcfce7' : '#f1f5f9',
          color: d.status === 'Available' ? '#166534' : '#64748b',
          padding: '0.35rem 0.85rem', 
          borderRadius: '1rem', 
          fontSize: '0.75rem', 
          fontWeight: 600 
        }}>
          {d.status}
        </span>
      ) 
    },
    {
      header: 'CREATED BY',
      searchable: false,
      key: (d: Doctor) => (
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
          {d.createdBy?.name?.toUpperCase() || 'SYSTEM'}
        </span>
      )
    },
  ], []);

  return (
    <div className="doctors-container animate-fade-in" style={{ padding: '2rem 2.5rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>SPECIALIST REGISTRY</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Specialist <span className="gradient-text">Registry</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
            Manage clinical personnel, certifications, and operational status.
          </p>
        </div>
        <button 
          onClick={() => router.push('/doctors/add')}
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
            boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.3)'
          }}
        >
          <Plus size={18} /> Add Specialist
        </button>
      </div>

      <DataTable 
        isLoading={localLoading}
        data={doctorsForTable}
        columns={columns}
        searchPlaceholder="Search specialists by name or category..."
        onView={(d) => router.push(`/doctors/${d._id}`)}
        onEdit={(d) => router.push(`/doctors/${d._id}/edit`)}
        onDelete={handleDeleteDoctor}
        onAddNew={() => router.push('/doctors/add')}
        addNewLabel="Add Specialist"
      />
    </div>
  );
}
