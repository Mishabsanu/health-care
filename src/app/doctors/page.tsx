'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import { usePCMSStore } from '@/store/useStore';
import api from '@/services/api';

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
  const { isLoading: storeLoading, showToast } = usePCMSStore();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  const handleDeleteDoctor = async (doctor: Doctor) => {
    if (!confirm(`⚠️ WARNING: You are about to purge specialist ${doctor.name} from the clinical registry. Continue?`)) return;
    
    try {
      await api.delete(`/doctors/${doctor._id}`);
      showToast('Specialist successfully removed from registry.', 'success');
      // Refresh list
      const res = await api.get('/doctors');
      const data = res.data?.data || res.data;
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('🚫 Registry Error | Deletion failed:', err);
      showToast('Failed to remove specialist. Ensure no active dependencies exist.', 'error');
    }
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      setLocalLoading(true);
      try {
        const res = await api.get('/doctors');
        const data = res.data?.data || res.data;
        setDoctors(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch specialists:', err);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const columns = [
    { header: 'SPECIALIST NAME', key: 'name' as keyof Doctor, style: { fontWeight: 600, color: 'var(--primary)' } },
    { 
      header: 'CLINICAL CATEGORY', 
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
      key: (d: Doctor) => (
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
          {d.createdBy?.name?.toUpperCase() || 'SYSTEM'}
        </span>
      )
    },
  ];

  return (
    <div className="doctors-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Specialist <span className="gradient-text">Registry</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage clinical personnel, certifications, and operational status.</p>
        </div>
        <button 
          onClick={() => router.push('/doctors/add')}
          style={{ background: 'var(--primary)', color: 'white', padding: '0.8rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600 }}
        >
          Add Specialist
        </button>
      </div>

      {(localLoading || storeLoading) ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
           🛡️ Synchronizing Specialist Records...
        </div>
      ) : (
        <DataTable 
          data={doctors.map(d => ({ ...d, id: d._id }))}
          columns={columns}
          searchPlaceholder="Search specialists by name or category..."
          onView={(d) => router.push(`/doctors/${d._id}`)}
          onEdit={(d) => router.push(`/doctors/${d._id}/edit`)}
          onDelete={handleDeleteDoctor}
        />
      )}
    </div>
  );
}
