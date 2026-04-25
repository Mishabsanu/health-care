'use client'
import DataTable from '@/components/DataTable';
import HasPermission from '@/components/HasPermission';
import { usePermission } from '@/hooks/usePermission';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { CheckCircle2, ChevronDown, ClipboardCheck, Clock, MessageSquare, Plus, Receipt, Trash2, Users, Wallet, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Appointment {
  _id: string;
  patientId: { _id: string; name: string; phone: string; patientId: string };
  doctorId: { name: string; specialization: string };
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  type?: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
  isBilled?: boolean;
  billId?: string;
  billStatus?: string;
}

// The AppointmentActions portal-based dropdown has been deprecated in favor of native inline UI interactions 
// embedded directly in the structural columns mapping.

export default function AppointmentsPage() {
  const router = useRouter();
  const { hasPermission, canOperate } = usePermission();
  const { user, isLoading: storeLoading, showToast, showConfirm, setIsSyncing } = usePCMSStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [activeTimeframe, setActiveTimeframe] = useState<'today' | 'upcoming' | 'history'>('today');
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  const fetchAppointments = useCallback(async (isInitial = false) => {
    if (isInitial && !hasLoaded) setLocalLoading(true);
    setIsSyncing(true);
    try {
      const localDate = new Date().toLocaleDateString('en-CA');
      const params = new URLSearchParams({ page: currentPage.toString(), limit: pageSize.toString(), timeframe: activeTimeframe, localDate });
      if (searchQuery) params.append('search', searchQuery);
      if (showOnlyMine && user?.id) params.append('createdBy', user.id);

      Object.entries(activeFilters).forEach(([key, values]) => {
        if (values && values.length > 0) {
          let value = values[0];
          if (key === 'status') {
            const statusMap: Record<string, string> = { 'Queued': 'Scheduled', 'Patient In': 'Confirmed', 'Session Done': 'Completed', 'Cancelled': 'Cancelled' };
            value = statusMap[value] || value;
          }
          params.append(key, value);
        }
      });
      const res = await api.get(`/appointments?${params.toString()}`);
      setAppointments(res.data?.data || []);
      setTotalRecords(res.data?.total || 0);
    } catch (err) {
      showToast('Failed to load clinical scheduler.', 'error');
    } finally {
      setLocalLoading(false);
      setHasLoaded(true);
      setIsSyncing(false);
    }
  }, [currentPage, pageSize, searchQuery, activeFilters, activeTimeframe, hasLoaded, setIsSyncing, showToast, showOnlyMine, user]);

  useEffect(() => {
    fetchAppointments(!hasLoaded);
  }, [fetchAppointments, hasLoaded]);

  const handleDeleteAppointment = useCallback((appointment: Appointment) => {
    if (!canOperate(appointment)) return showToast('🚫 Access Denied', 'error');
    showConfirm('Cancel & Purge Appointment', `Proceed with purging ${appointment.patientName}?`, async () => {
      setIsSyncing(true);
      try {
        await api.delete(`/appointments/${appointment._id}`);
        showToast('Appointment successfully cancelled.', 'success');
        fetchAppointments();
      } finally { setIsSyncing(false); }
    }, true);
  }, [canOperate, showConfirm, showToast, setIsSyncing, fetchAppointments]);

  const handleStatusUpdate = useCallback(async (id: string, newStatus: string) => {
    try {
      await api.put(`/appointments/${id}`, { status: newStatus });
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: newStatus as any } : a));
      showToast(`Status updated to ${newStatus}.`, 'success');
    } catch (err) { showToast('Status update failed.', 'error'); }
  }, [showToast]);

  const handleTimeframeChange = useCallback((timeframe: any) => {
    setActiveTimeframe(timeframe);
    setCurrentPage(1);
  }, []);

  const handleSendReminder = useCallback(async (id: string) => {
    try {
      await api.post(`/appointments/${id}/reminder`);
      showToast('🔔 Reminder dispatched.', 'success');
    } catch (err) { showToast('Reminder failed.', 'error'); }
  }, [showToast]);

  const columns = useMemo(() => [
    {
      header: 'CREATED DATE',
      style: { minWidth: '140px' },
      key: (a: any) => (
        <div>
          <p style={{ fontWeight: 600 }}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'N/A'}</p>
          <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>{a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : 'N/A'}</p>
        </div>
      )
    },
    {
      header: 'PATIENT NAME',
      style: { minWidth: '150px' },
      key: (a: any) => (
        <div>
          <span onClick={() => a.patientId?._id && router.push(`/patients/${a.patientId._id}`)}
            style={{ fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}>
            {a.patientId?.name || a.patientName || 'Deleted'}
          </span>
          {a.patientId?.patientId && <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>ID: {a.patientId.patientId}</p>}
        </div>
      )
    },
    {
      header: 'CONTACT',
      style: { minWidth: '140px' },
      key: (a: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{a.patientId?.phone || 'N/A'}</span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {a.patientId?.phone && (
              <a href={`https://wa.me/${a.patientId.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366' }}>
                <MessageSquare size={14} fill="#25D366" />
              </a>
            )}
            {a.status === 'Scheduled' && (
              <button onClick={() => canOperate(a) ? handleSendReminder(a._id) : showToast('🚫 Access Denied', 'error')}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary)', border: 'none' }}>
                <Clock size={14} />
              </button>
            )}
          </div>
        </div>
      )
    },
    { header: 'SPECIALIST', style: { minWidth: '150px' }, key: (a: Appointment) => (<div><p style={{ fontWeight: 600 }}>{a.doctorId?.name || a.doctorName}</p><p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{a.doctorId?.specialization?.toUpperCase()}</p></div>) },
    { 
      header: 'CREATED BY', 
      style: { minWidth: '130px' }, 
      key: (a: any) => (
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>{(a.createdBy?.name || 'ADMIN').toUpperCase()}</p>
          <p style={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: 800 }}>CLINICAL STAFF</p>
        </div>
      ) 
    },
    {
      header: 'BILLING',
      style: { minWidth: '130px' },
      key: (a: Appointment) => {
        if (!a.isBilled) {
          if (a.status !== 'Completed') {
            return <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 800, padding: '0.4rem 0' }}>PENDING COMPLETION</span>;
          }
          return (
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/billing/generate?patientId=${a.patientId?._id}&appointmentId=${a._id}`); }}
              style={{ fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none', background: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary)', padding: '0.4rem 0.8rem', borderRadius: '2rem', cursor: 'pointer', textTransform: 'uppercase' }}
            >
              <Plus size={12} /> GENERATE BILL
            </button>
          );
        }
        const status = a.billStatus || 'Unpaid';
        const colors = {
          'Paid': { bg: '#dcfce7', text: '#166534', label: 'PAID' },
          'Partially Paid': { bg: '#ffedd5', text: '#9a3412', label: 'PARTIAL' },
          'Unpaid': { bg: '#fee2e2', text: '#991b1b', label: 'UNPAID' }
        }[status] || { bg: '#f1f5f9', text: '#475569', label: status.toUpperCase() };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
            <span style={{
              background: colors.bg,
              color: colors.text,
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.6rem',
              fontWeight: 900,
              width: 'fit-content'
            }}>
              {colors.label}
            </span>
            <span
              style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', borderBottom: '1px dashed var(--primary)' }}
              onClick={(e) => { e.stopPropagation(); router.push(`/billing/${a.billId}${status === 'Partially Paid' ? '/edit' : ''}`); }}
            >
              {status === 'Partially Paid' ? 'COLLECT BALANCE' : 'VIEW BILL'}
            </span>
          </div>
        );
      }
    },
    { header: 'SCHEDULE', style: { minWidth: '140px' }, key: (a: Appointment) => (<div><p style={{ fontWeight: 700 }}>{new Date(a.date).toLocaleDateString()}</p><p style={{ fontSize: '0.75rem', opacity: 0.6 }}>{a.time}</p></div>) },
    {
      header: 'STATUS',
      style: { minWidth: '150px' },
      key: (a: Appointment) => {
        const statusColors: any = {
          'Scheduled': { bg: '#e2e8f0', text: '#334155' },
          'Queued': { bg: '#fef3c7', text: '#d97706' },
          'Confirmed': { bg: '#dcfce7', text: '#059669' },
          'Completed': { bg: '#e0e7ff', text: '#4f46e5' },
          'Cancelled': { bg: '#fee2e2', text: '#dc2626' }
        };
        const { bg, text } = statusColors[a.status] || statusColors['Scheduled'];

        return (
          <select
            value={a.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const newStatus = e.target.value;
              if (!canOperate(a)) {
                showToast('🚫 Access Denied', 'error');
                return;
              }
              handleStatusUpdate(a._id, newStatus);
            }}
            style={{
              width: '100%',
              padding: '0.45rem 1rem',
              borderRadius: '2rem',
              border: `1.5px solid ${text}30`,
              background: bg,
              color: text,
              fontSize: '0.7rem',
              fontWeight: 900,
              cursor: 'pointer',
              outline: 'none',
              textTransform: 'uppercase',
              transition: 'var(--transition-smooth)'
            }}
          >
            <option value="Scheduled">SCHEDULED</option>
            <option value="Queued">QUEUED</option>
            <option value="Confirmed">PATIENT IN</option>
            <option value="Completed">SESSION DONE</option>
            <option value="Cancelled">CANCELLED</option>
          </select>
        );
      }
    }
  ], [router, handleStatusUpdate, canOperate, showToast, handleSendReminder]);
  const paginationConfig = useMemo(() => ({
    totalRecords,
    currentPage,
    pageSize,
    onPageChange: setCurrentPage,
    onPageSizeChange: setPageSize,
    onSearchChange: (s: string) => { setSearchQuery(s); setCurrentPage(1); },
    onFilterChange: (f: any) => { setActiveFilters(f); setCurrentPage(1); },
    externalFilters: activeFilters,
    externalSearch: searchQuery
  }), [totalRecords, currentPage, pageSize, activeFilters, searchQuery]);

  return (
    <div className="appointments-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem', paddingTop: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>CLINICAL SCHEDULER</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Appointment <span className="gradient-text">Registry</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
            Real-time management of clinical bookings and patient traffic.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {/* 📅 TIMEFRAME SELECTOR TABS */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '0.4rem',
            borderRadius: '1.25rem',
            border: '1px solid rgba(15, 118, 110, 0.1)',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)'
          }}>
            {['today', 'upcoming', 'history'].map((t) => (
              <button
                key={t}
                onClick={() => handleTimeframeChange(t as any)}
                suppressHydrationWarning={true}
                className="glass-interactive"
                style={{
                  padding: '0.7rem 2rem',
                  borderRadius: '1rem',
                  border: 'none',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: activeTimeframe === t ? 'var(--primary)' : 'transparent',
                  color: activeTimeframe === t ? 'white' : '#64748b',
                  boxShadow: activeTimeframe === t ? '0 12px 20px -8px rgba(15, 118, 110, 0.5)' : 'none',
                  transform: activeTimeframe === t ? 'translateY(-1px) scale(1.02)' : 'scale(1)'
                }}
              >
                {t}
              </button>
            ))}
          </div>


          <HasPermission permission="appointments:create">
            <button
              onClick={() => router.push('/appointments/add')}
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
              <Plus size={18} /> Book Appointment
            </button>
          </HasPermission>
        </div>
      </div>

      <DataTable
        isLoading={localLoading}
        data={appointments.map(a => ({ ...a, id: a._id }))}
        columns={columns}
        searchPlaceholder="Search scheduler names..."
        onView={(a) => router.push(`/appointments/${a._id}`)}
        onEdit={hasPermission('appointments:edit') ? ((a) => {
          if (canOperate(a)) {
            router.push(`/appointments/${a._id}/edit`);
          } else {
            showToast('🚫 Access Denied | You can only modify your own appointments.', 'error');
          }
        }) : undefined}
        onDelete={hasPermission('appointments:delete') ? ((a) => {
          if (canOperate(a)) {
            handleDeleteAppointment(a);
          } else {
            showToast('🚫 Access Denied | You can only cancel your own appointments.', 'error');
          }
        }) : undefined}
        onAddNew={() => router.push('/appointments/add')}
        addNewLabel="Book Appointment"
        filterableFields={[
          { label: 'Status', key: 'status' as keyof Appointment, options: ['Queued', 'Patient In', 'Session Done', 'Cancelled'] },
          { label: 'Date', key: 'date' as keyof Appointment, options: [] }
        ]}
        serverPagination={paginationConfig}
        getRowStyle={(a: any) => {
          const today = new Date().toISOString().split('T')[0];
          const isToday = a.date === today;
          if (isToday && activeTimeframe !== 'today') {
            return {
              background: 'rgba(15, 118, 110, 0.03)',
              boxShadow: 'inset 4px 0 0 var(--primary)'
            };
          }
          return {};
        }}
      />
    </div>
  );
}
