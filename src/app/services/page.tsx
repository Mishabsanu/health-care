'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import { usePCMSStore } from '@/store/useStore';
import api from '@/services/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import HasPermission from '@/components/HasPermission';
import { usePermission } from '@/hooks/usePermission';
import { Plus } from 'lucide-react';

interface Service {
  _id: string; // Mongoose ID
  name: string;
  category: string;
  price: number;
  status: 'Available' | 'Archived';
  createdBy?: { name: string };
}

export default function ServicesPage() {
  const router = useRouter();
  const { hasPermission, canOperate } = usePermission();
  const { isLoading: storeLoading, setIsSyncing, showToast, showConfirm } = usePCMSStore();
  const [services, setServices] = useState<Service[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // -------------------------------------------------------------------
  // SYNC | Clinical Services Data from Backend
  // -------------------------------------------------------------------
  const handleDeleteService = (service: Service) => {
    if (!canOperate(service)) return showToast('🚫 Access Denied | You can only delete service definitions you personally registered.', 'error');

    showConfirm(
      'Remove Clinical Service',
      ` WARNING: You are about to purge treatment ${service.name} from the clinical registry. Continue?`,
      async () => {
        try {
          await api.delete(`/services/${service._id}`);
          showToast('Clinical service successfully removed.', 'success');
          // Refresh list
          const res = await api.get('/services');
          setServices(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        } catch (err) {
          console.error('🚫 Registry Error | Deletion failed:', err);
          showToast('Failed to remove service. Check for linked clinical records.', 'error');
        }
      },
      true
    );
  };

  // Backend Pagination State
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const fetchServices = async (isInitial = false) => {
    if (isInitial && !hasLoaded) setLocalLoading(true);
    setIsSyncing(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      });
      if (searchQuery) params.append('search', searchQuery);

      Object.entries(activeFilters).forEach(([key, values]) => {
        if (values && values.length > 0) {
          params.append(key, values[0]);
        }
      });

      const res = await api.get(`/services?${params.toString()}`);

      if (res.data && typeof res.data.total !== 'undefined') {
        setServices(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        setTotalRecords(res.data.total);
      } else {
        setServices(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        setTotalRecords(res.data.length);
      }
    } catch (err) {
      console.error('🚫 Registry Error | Failed to fetch clinical services:', err);
    } finally {
      setLocalLoading(false);
      setHasLoaded(true);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchServices(!hasLoaded);
  }, [currentPage, pageSize, searchQuery, activeFilters]);

  const columns = [
    { header: 'SERVICE NAME', key: 'name' as keyof Service, style: { fontWeight: 600, color: 'var(--primary)' } },
    { header: 'CATEGORY', key: 'category' as keyof Service, style: { fontSize: '0.85rem' } },
    {
      header: 'PRICE (₹)',
      key: (s: Service) => (
        <span style={{ fontWeight: 700 }}>₹{s.price.toLocaleString()}</span>
      )
    },
    {
      header: 'STATUS',
      key: (s: Service) => (
        <span style={{
          background: s.status === 'Available' ? '#dcfce7' : '#f1f5f9',
          color: s.status === 'Available' ? '#166534' : '#64748b',
          padding: '0.35rem 0.85rem',
          borderRadius: '1rem',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          {s.status}
        </span>
      )
    },
    {
      header: 'CREATED BY',
      key: (s: Service) => (
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
          {s.createdBy?.name?.toUpperCase() || 'SYSTEM'}
        </span>
      )
    }
  ];

  if (localLoading) return <LoadingSpinner />;

  return (
    <div className="services-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem', paddingTop: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>SERVICE CATALOG</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Clinical <span className="gradient-text">Services</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
            Manage treatment definitions, clinical procedures, and pricing.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <HasPermission permission="services:create">
            <button
              onClick={() => router.push('/services/add')}
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
              <Plus size={18} /> Add Service
            </button>
          </HasPermission>
        </div>
      </div>

      <DataTable
        data={services.map(s => ({ ...s, id: s._id }))} // Adapt Mongoose _id to DataTable id
        columns={columns}
        searchPlaceholder="Search by service name..."
        onView={(s) => router.push(`/services/${s._id}`)}
        onEdit={hasPermission('services:edit') ? ((s) => {
          if (canOperate(s)) {
            router.push(`/services/${s._id}/edit`);
          } else {
            showToast('🚫 Access Denied | You can only modify services you personally registered.', 'error');
          }
        }) : undefined}
        onDelete={hasPermission('services:delete') ? handleDeleteService : undefined}
        onAddNew={() => router.push('/services/add')}
        addNewLabel="Add Service"
        filterableFields={[
          { label: 'Status', key: 'status' as keyof Service, options: ['Available', 'Archived'] }
        ]}
        serverPagination={{
          totalRecords,
          currentPage,
          pageSize,
          onPageChange: setCurrentPage,
          onPageSizeChange: setPageSize,
          onSearchChange: (s) => { setSearchQuery(s); setCurrentPage(1); },
          onFilterChange: (f) => { setActiveFilters(f); setCurrentPage(1); }
        }}
      />
    </div>
  );
}
