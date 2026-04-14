'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import { usePCMSStore } from '@/store/useStore';
import api from '@/services/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Plus, UserPlus, Filter, Download } from 'lucide-react';
import HasPermission from '@/components/HasPermission';
import { usePermission } from '@/hooks/usePermission';

interface Patient {
  _id: string;
  patientId: string;
  name: string;
  phone: string;
  age: number;
  gender: string;
  occupation: string;
  createdAt: string;
  lastVisit: string;
  createdBy?: { name: string };
}

export default function PatientsPage() {
  const router = useRouter();
  const { hasPermission, canOperate } = usePermission();
  const { isLoading: storeLoading, showToast, setIsSyncing, showConfirm } = usePCMSStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Backend Pagination State
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  // -------------------------------------------------------------------
  // SYNC | Fetch Clinical Patient Registry (Server-Paginated)
  // -------------------------------------------------------------------
  const fetchPatients = async (isInitial = false) => {
    if (isInitial && !hasLoaded) setLocalLoading(true);
    setIsSyncing(true);
    try {
      // Build query string
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      });
      if (searchQuery) params.append('search', searchQuery);
      
      // Append filters dynamically
      Object.entries(activeFilters).forEach(([key, values]) => {
        if (values && values.length > 0) {
            params.append(key, values[0]); // Using single value for simplicity as backend only expects string, not array
        }
      });

      const res = await api.get(`/patients?${params.toString()}`);
      
      if (res.data && typeof res.data.total !== 'undefined') {
          // New Paginated Backend
          setPatients(Array.isArray(res.data) ? res.data : (res.data?.data || []));
          setTotalRecords(res.data.total);
      } else {
          // Fallback to legacy parsing if backend hasn't been updated yet
          setPatients(Array.isArray(res.data) ? res.data : (res.data?.data || []));
          setTotalRecords(res.data.length);
      }
    } catch (err) {
      console.error('🚫 Registry Error | Failed to fetch clinic patients:', err);
      showToast('Failed to load clinical registry', 'error');
    } finally {
      setLocalLoading(false);
      setHasLoaded(true);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchPatients(!hasLoaded);
  }, [currentPage, pageSize, searchQuery, activeFilters]);

  const handleDeletePatient = (patient: Patient) => {
    if (!canOperate(patient)) return showToast('🚫 Access Denied | You can only delete clinical records you personally created.', 'error');

    showConfirm(
      'Purge Patient Record',
      `⚠️ WARNING: You are about to permanently purge the clinical record for ${patient.name}. This action cannot be undone. Continue?`,
      async () => {
        setIsSyncing(true);
        try {
          await api.delete(`/patients/${patient._id}`);
          showToast('Patient record successfully purged from registry.', 'success');
          fetchPatients();
        } catch (err) {
          console.error('🚫 Registry Error | Deletion failed:', err);
          showToast('Failed to delete patient record. Ensure you have proper authorization.', 'error');
        } finally {
          setIsSyncing(false);
        }
      },
      true
    );
  };

  const columns = [
    { 
      header: 'ID', 
      sortKey: 'patientId' as keyof Patient,
      key: (p: Patient) => (
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{p.patientId}</span>
      )
    },
    { 
      header: 'PATIENT NAME', 
      sortKey: 'name' as keyof Patient,
      key: (p: Patient) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.01em', fontSize: '0.9rem' }}>{p.name.toUpperCase()}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>VERIFIED CLINICAL RECORD</span>
        </div>
      )
    },
    { 
      header: 'CONTACT', 
      key: (p: Patient) => (
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{p.phone}</span>
      )
    },
    {
      header: 'AGE/GENDER',
      sortKey: 'age' as keyof Patient,
      key: (p: Patient) => (
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>{p.age}Y / {p.gender.toUpperCase()}</span>
      )
    },
    {
      header: 'LAST VISIT',
      sortKey: 'lastVisit' as keyof Patient,
      key: (p: Patient) => (
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          {new Date(p.lastVisit).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      )
    },
    {
      header: 'CREATED DATE',
      sortKey: 'createdAt' as keyof Patient,
      key: (p: Patient) => (
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      )
    },
    {
      header: 'CREATED BY',
      key: (p: Patient) => (
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', opacity: 0.8 }}>
          {p.createdBy?.name?.toUpperCase() || 'SYSTEM'}
        </span>
      )
    }
  ];

  const filterableFields = [
    {
      label: 'Gender',
      key: 'gender' as keyof Patient,
      options: ['Male', 'Female', 'Other']
    }
  ];

  if (localLoading) return <LoadingSpinner />;

  return (
    <div className="patients-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>CLINICAL REGISTRY</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Patient <span className="gradient-text">Database</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
            Real-time management of clinical records for your practice.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.6rem', 
              background: 'white', 
              color: 'var(--text-main)', 
              padding: '0.8rem 1.25rem', 
              borderRadius: 'var(--radius-md)', 
              fontWeight: 700, 
              fontSize: '0.85rem',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <Download size={18} /> Export
          </button>
          
          <HasPermission permission="patients:create">
            <button
              onClick={() => router.push('/patients/add')}
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
              <UserPlus size={18} /> Register Patient
            </button>
          </HasPermission>
        </div>
      </div>

        <DataTable
          data={patients.map(p => ({ ...p, id: p._id }))}
          columns={columns}
          filterableFields={filterableFields}
          searchPlaceholder="Search by name, ID or contact..."
          onView={(p) => router.push(`/patients/${p._id}`)}
          onEdit={hasPermission('patients:edit') ? ((p) => {
            if (canOperate(p)) {
              router.push(`/patients/${p._id}/edit`);
            } else {
              showToast('🚫 Access Denied | You can only modify clinical records you personally created.', 'error');
            }
          }) : undefined}
          onDelete={hasPermission('patients:delete') ? handleDeletePatient : undefined}
          onAddNew={() => router.push('/patients/add')}
          addNewLabel="Register Patient"
          serverPagination={{
            totalRecords,
            currentPage,
            pageSize,
            onPageChange: setCurrentPage,
            onSearchChange: (s) => { setSearchQuery(s); setCurrentPage(1); },
            onFilterChange: (f) => { setActiveFilters(f); setCurrentPage(1); }
          }}
        />
    </div>
  );
}
