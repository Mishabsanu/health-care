'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import Loading from '@/components/Loading';
import DataTable from '@/components/DataTable';
import { Plus, UserPlus, Filter, Download } from 'lucide-react';
import HasPermission from '@/components/HasPermission';
import { usePermission } from '@/hooks/usePermission';
import { usePCMSStore } from '@/store/useStore';

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
          params.append(key, values[0]);
        }
      });

      const res = await api.get(`/patients?${params.toString()}`);

      if (res.data && typeof res.data.total !== 'undefined') {
        setPatients(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        setTotalRecords(res.data.total);
      } else {
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

  const columnsData = useMemo(() => [
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
      header: 'CREATED BY',
      key: (p: Patient) => (
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', opacity: 0.8 }}>
          {p.createdBy?.name?.toUpperCase() || 'SYSTEM'}
        </span>
      )
    }
  ], []);

  const filterableFields = useMemo(() => [
    {
      label: 'Gender',
      key: 'gender' as keyof Patient,
      options: ['Male', 'Female', 'Other']
    }
  ], []);

  const paginationConfig = useMemo(() => ({
    totalRecords,
    currentPage,
    pageSize,
    onPageChange: setCurrentPage,
    onSearchChange: (s: string) => { setSearchQuery(s); setCurrentPage(1); },
    onFilterChange: (f: any) => { setActiveFilters(f); setCurrentPage(1); }
  }), [totalRecords, currentPage, pageSize]);

  const patientsForTable = useMemo(() => 
    patients.map(p => ({ ...p, id: p._id })), 
  [patients]);

  return (
    <div className="patients-container animate-fade-in" style={{ padding: '2rem' }}>
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
        isLoading={localLoading}
        data={patientsForTable}
        columns={columnsData}
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
        serverPagination={paginationConfig}
      />
    </div>
  );
}
