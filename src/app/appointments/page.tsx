'use client'
import DataTable from '@/components/DataTable';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { MessageSquare, Receipt, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import HasPermission from '@/components/HasPermission';
import { usePermission } from '@/hooks/usePermission';

interface Appointment {
  _id: string;
  patientId: { _id: string; name: string; phone: string; patientId: string };
  doctorId: { name: string; specialization: string };
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
}

export default function AppointmentsPage() {
  const router = useRouter();
  const { hasPermission, canOperate } = usePermission();
  const { isLoading: storeLoading, showToast, showConfirm, setIsSyncing } = usePCMSStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  // -------------------------------------------------------------------
  // SYNC | Fetch Clinical Appointment Registry
  // -------------------------------------------------------------------
  // Backend Pagination State
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const fetchAppointments = async () => {
    setLocalLoading(true);
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

      const res = await api.get(`/appointments?${params.toString()}`);
      
      if (res.data && typeof res.data.total !== 'undefined') {
          setAppointments(Array.isArray(res.data) ? res.data : (res.data?.data || []));
          setTotalRecords(res.data.total);
      } else {
          setAppointments(Array.isArray(res.data) ? res.data : (res.data?.data || []));
          setTotalRecords(res.data.length);
      }
    } catch (err) {
      console.error('🚫 Registry Error | Failed to fetch appointments:', err);
      showToast('Failed to load clinical scheduler.', 'error');
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [currentPage, pageSize, searchQuery, activeFilters]);

  const handleDeleteAppointment = (appointment: Appointment) => {
    showConfirm(
      'Cancel & Purge Appointment',
      `⚠️ WARNING: You are about to cancel and purge the clinical booking for ${appointment.patientId?.name || appointment.patientName}. Proceed?`,
      async () => {
        setIsSyncing(true);
        try {
          await api.delete(`/appointments/${appointment._id}`);
          showToast('Appointment successfully cancelled.', 'success');
          fetchAppointments();
        } catch (err) {
          console.error('🚫 Registry Error | Cancellation failed:', err);
          showToast('Failed to cancel appointment.', 'error');
        } finally {
          setIsSyncing(false);
        }
      },
      true
    );
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await api.put(`/appointments/${id}`, { status: newStatus });
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: newStatus as any } : a));
      showToast(`Booking marked as ${newStatus}.`, 'success');
    } catch (err) {
      console.error('🚫 Registry Error | Failed to update clinical status:', err);
      showToast('Status update failed.', 'error');
    }
  };

  const handleSendReminder = async (id: string) => {
    try {
      await api.post(`/appointments/${id}/reminder`);
      showToast('🔔 WhatsApp reminder dispatched successfully.', 'success');
    } catch (err) {
      console.error('🚫 Gateway Error | Failed to dispatch reminder:', err);
      showToast('Failed to send reminder. Check patient contact details.', 'error');
    }
  };

  const columns = [
    { 
      header: 'PATIENT NAME', 
      key: (a: any) => (
        <div>
          {/* 🔗 Clickable patient name → redirects to patient detail view */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (a.patientId?._id) router.push(`/patients/${a.patientId._id}`);
            }}
            title="View Patient Profile"
            style={{
              fontWeight: 700,
              color: 'var(--primary)',
              cursor: a.patientId?._id ? 'pointer' : 'default',
              textDecoration: a.patientId?._id ? 'underline' : 'none',
              textDecorationColor: 'rgba(15,118,110,0.3)',
              textUnderlineOffset: '3px'
            }}
          >
            {a.patientId?.name || a.patientName || 'Deleted'}
          </span>
          {a.patientId?.patientId && (
            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>ID: {a.patientId.patientId}</p>
          )}
        </div>
      )
    },
    { 
      header: 'CONTACT', 
      key: (a: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{a.patientId?.phone || 'N/A'}</span>
          {/* 💬 WhatsApp direct message button */}
          {a.patientId?.phone && (
            <a 
              href={`https://wa.me/${a.patientId.phone.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={`WhatsApp ${a.patientId.name}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(37, 211, 102, 0.1)',
                color: '#25D366',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}
            >
              <MessageSquare size={14} fill="#25D366" />
            </a>
          )}
        </div>
      )
    },
    { 
      header: 'SPECIALIST', 
      key: (a: Appointment) => (
        <div>
          <p style={{ fontWeight: 600 }}>{a.doctorId?.name || a.doctorName || 'Deleted'}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{a.doctorId?.specialization?.toUpperCase()}</p>
        </div>
      )
    },
    { 
      header: 'SCHEDULE', 
      key: (a: Appointment) => (
        <div>
          <p style={{ fontWeight: 700 }}>{new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>{a.time}</p>
        </div>
      )
    },
    { 
      header: 'STATUS', 
      key: (a: Appointment) => (
        <span style={{ 
          background: a.status === 'Confirmed' ? '#dcfce7' : a.status === 'Scheduled' ? '#f1f5f9' : a.status === 'Completed' ? '#dbeafe' : '#fee2e2',
          color: a.status === 'Confirmed' ? '#166534' : a.status === 'Scheduled' ? '#64748b' : a.status === 'Completed' ? '#1d4ed8' : '#b91c1c',
          padding: '0.35rem 0.85rem', 
          borderRadius: '1rem', 
          fontSize: '0.7rem', 
          fontWeight: 800 
        }}>
          {a.status?.toUpperCase()}
        </span>
      ) 
    },
    {
      header: 'REGISTRY BY',
      key: (a: any) => (
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', opacity: 0.8 }}>
          {(a as any).createdBy?.name?.toUpperCase() || 'SYSTEM'}
        </span>
      )
    },
    {
      header: 'CLINICAL ACTIONS',
      key: (a: any) => (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* 🔔 WhatsApp Reminder (for Scheduled appointments) */}
          {a.status === 'Scheduled' && (
            <HasPermission anyOf={['appointments:edit', 'appointments:remind']}>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (canOperate(a)) {
                    handleSendReminder(a._id);
                  } else {
                    showToast('🚫 Access Denied | You can only send reminders for your own appointments.', 'error');
                  }
                }}
                title="Send WhatsApp Reminder"
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid #25D366',
                  color: '#25D366',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'rgba(37, 211, 102, 0.05)'
                }}
              >
                <MessageSquare size={11} /> Remind
              </button>
            </HasPermission>
          )}

          {/* ✅ Mark Completed — for Scheduled/Confirmed */}
          {(a.status === 'Booked' || a.status === 'Confirmed') && (
            <HasPermission permission="appointments:edit">
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (canOperate(a)) {
                    handleStatusUpdate(a._id, 'Completed');
                  } else {
                    showToast('🚫 Access Denied | You can only complete your own appointments.', 'error');
                  }
                }}
                title="Mark Treatment as Completed"
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid #10b981',
                  color: '#10b981',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'rgba(16, 185, 129, 0.05)'
                }}
              >
                <CheckCircle2 size={11} /> Mark Done
              </button>
            </HasPermission>
          )}

          {/* 🧾 Pay Bill — ONLY available for Completed status */}
          {a.status === 'Completed' && (
            <HasPermission permission="billing:create">
              <button 
                onClick={(e) => { 
                  e.stopPropagation();
                  router.push(`/billing/generate?appointmentId=${a._id}&patientId=${a.patientId?._id || ''}`);
                }}
                title="Create Invoice for this Appointment"
                style={{ 
                  padding: '0.35rem 0.75rem', 
                  borderRadius: 'var(--radius-sm)', 
                  background: a.status === 'Completed' 
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: 'white', 
                  fontSize: '0.65rem', 
                  fontWeight: 950, 
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: a.status === 'Completed'
                    ? '0 4px 12px rgba(245, 158, 11, 0.3)'
                    : '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
              >
                <Receipt size={11} /> {a.status === 'Completed' ? 'Pay Bill' : 'Bill Now'}
              </button>
            </HasPermission>
          )}

          {a.status === 'Cancelled' && (
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase' }}>
              Purged
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="appointments-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Clinical <span className="gradient-text">Scheduler</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Coordinate medical sessions and specialist availability.</p>
        </div>
        <HasPermission permission="appointments:create">
          <button 
            onClick={() => router.push('/appointments/add')}
            style={{ background: 'var(--primary)', color: 'white', padding: '0.8rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600 }}
          >
            Book Appointment
          </button>
        </HasPermission>
      </div>

        <DataTable 
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
          filterableFields={[
            { label: 'Status', key: 'status' as keyof Appointment, options: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled'] }
          ]}
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
