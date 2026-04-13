'use client'
import DataTable from '@/components/DataTable';
import HasPermission from '@/components/HasPermission';
import { usePermission } from '@/hooks/usePermission';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { Clock, MessageSquare, Receipt } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  const [activeTimeframe, setActiveTimeframe] = useState<'today' | 'upcoming' | 'history'>('today');

  const fetchAppointments = async () => {
    setLocalLoading(true);
    try {
      const localDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        timeframe: activeTimeframe,
        localDate: localDate
      });
      if (searchQuery) params.append('search', searchQuery);

      Object.entries(activeFilters).forEach(([key, values]) => {
        if (values && values.length > 0) {
          let value = values[0];
          // 🔄 Clinical Mapping | Match Friendly UI Labels to Backend Enum Values
          if (key === 'status') {
            const statusMap: Record<string, string> = {
              'Queued': 'Scheduled',
              'Patient In': 'Confirmed',
              'Session Done': 'Completed',
              'Cancelled': 'Cancelled'
            };
            value = statusMap[value] || value;
          }
          params.append(key, value);
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
  }, [currentPage, pageSize, searchQuery, activeFilters, activeTimeframe]);

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
      showToast(`Appointment status synchronized to ${newStatus}.`, 'success');
    } catch (err) {
      console.error('🚫 Registry Error | Failed to update clinical status:', err);
      showToast('Status update failed.', 'error');
    }
  };

  const handleSetTodayFilter = () => {
    setActiveTimeframe('today');
    showToast('📅 Switched to Today\'s Schedule.', 'success');
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
      header: 'CREATED DATE',
      style: { minWidth: '140px' },
      key: (a: any) => (
        <div>
          <p style={{ fontWeight: 600 }}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
          <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>{a.createdAt ? new Date(a.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
        </div>
      )
    },
    {
      header: 'PATIENT NAME',
      style: { minWidth: '150px' },
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
      style: { minWidth: '140px' },
      key: (a: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{a.patientId?.phone || 'N/A'}</span>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {/* 💬 Direct WhatsApp Chat */}
            {a.patientId?.phone && (
              <a
                href={`https://wa.me/${a.patientId.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title={`WhatsApp Chat: ${a.patientId.name}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(37, 211, 102, 0.1)',
                  color: '#25D366',
                  transition: 'all 0.2s ease'
                }}
              >
                <MessageSquare size={14} fill="#25D366" />
              </a>
            )}

            {/* 🔔 Automated Clinical Reminder */}
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
                  title="Trigger Automated Reminder"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(15, 118, 110, 0.1)',
                    color: 'var(--primary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Clock size={14} />
                </button>
              </HasPermission>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'SPECIALIST',
      style: { minWidth: '150px' },
      key: (a: Appointment) => (
        <div>
          <p style={{ fontWeight: 600 }}>{a.doctorId?.name || a.doctorName || 'Deleted'}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{a.doctorId?.specialization?.toUpperCase()}</p>
        </div>
      )
    },

    {
      header: 'SCHEDULE DATE',
      style: { minWidth: '140px' },
      key: (a: Appointment) => (
        <div>
          <p style={{ fontWeight: 700 }}>{new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>{a.time}</p>
        </div>
      )
    },
    {
      header: 'STATUS',
      style: { minWidth: '140px' },
      key: (a: Appointment) => {
        const getStatusTheme = (status: string) => {
          switch (status) {
            case 'Confirmed': return { color: '#059669', glow: '#34d399', label: 'Patient In' };
            case 'Completed': return { color: '#4f46e5', glow: '#818cf8', label: 'Session Done' };
            case 'Cancelled': return { color: '#dc2626', glow: '#f87171', label: 'Cancelled' };
            default: return { color: '#64748b', glow: '#94a3b8', label: 'Queued' };
          }
        };
        const { color, glow, label } = getStatusTheme(a.status);

        return (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 1.25rem',
            borderRadius: '2rem',
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(10px)',
            border: `1.5px solid ${color}20`,
            color: color,
            fontSize: '0.65rem',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            boxShadow: `0 4px 15px -5px ${color}30`
          }}>
            <div className={a.status === 'Confirmed' ? 'pulse-site' : ''} style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: glow,
              boxShadow: `0 0 12px ${glow}`
            }} />
            <span>{label}</span>
          </div>
        );
      }
    },
    {
      header: 'CREATED BY',
      style: { minWidth: '140px' },
      key: (a: any) => (
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', opacity: 0.8 }}>
          {(a as any).createdBy?.name?.toUpperCase() || 'SYSTEM'}
        </span>
      )
    },
    {
      header: 'ACTIONS',
      style: { minWidth: '220px' },
      key: (a: any) => (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* 📍 Mark Confirmed (Arrival) — for Scheduled only */}
          {a.status === 'Scheduled' && (
            <HasPermission permission="appointments:edit">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (canOperate(a)) {
                    handleStatusUpdate(a._id, 'Confirmed');
                  } else {
                    showToast('🚫 Access Denied | You can only confirm your own appointments.', 'error');
                  }
                }}
                title="Mark Patient as Arrived (Confirm)"
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: '1.5px solid var(--primary)',
                  color: 'var(--primary)',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  background: 'rgba(15, 118, 110, 0.05)'
                }}
              >Confirm
              </button>
            </HasPermission>
          )}

          {/* ✅ Mark Completed — for Confirmed (and Scheduled for flexibility) */}
          {(a.status === 'Scheduled' || a.status === 'Confirmed') && (
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
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: '1.5px solid #10b981',
                  color: '#10b981',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  background: 'rgba(16, 185, 129, 0.05)'
                }}
              >
                Completed
              </button>
            </HasPermission>
          )}

          {/* ❌ Cancel — for Scheduled/Confirmed */}
          {(a.status === 'Scheduled' || a.status === 'Confirmed') && (
            <HasPermission permission="appointments:edit">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (canOperate(a)) {
                    handleStatusUpdate(a._id, 'Cancelled');
                  } else {
                    showToast('🚫 Access Denied | You can only cancel your own appointments.', 'error');
                  }
                }}
                title="Cancel Appointment"
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: '1.5px solid #ef4444',
                  color: '#ef4444',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  background: 'rgba(239, 68, 68, 0.05)'
                }}
              >
                Cancel
              </button>
            </HasPermission>
          )}

          {/* 🧾 Pay Bill / View Bill — ONLY available for Completed status */}
          {a.status === 'Completed' && (
            <HasPermission permission="billing:create">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (a.isBilled && a.billId) {
                    router.push(`/billing/${a.billId}`);
                  } else {
                    router.push(`/billing/generate?appointmentId=${a._id}&patientId=${a.patientId?._id || ''}`);
                  }
                }}
                title={a.isBilled ? "View Existing Bill" : "Create Bill for this Appointment"}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: a.isBilled 
                    ? 'linear-gradient(135deg, #10b981, #059669)' // Green for already billed
                    : 'linear-gradient(135deg, #f59e0b, #d97706)', // Amber for needs billing
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: 950,
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: a.isBilled
                    ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                    : '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}
              >
                <Receipt size={11} /> {a.isBilled ? 'View Bill' : 'Pay Bill'}
              </button>
            </HasPermission>
          )}

          {a.status === 'Cancelled' && (
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase' }}>
              Cleared
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
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* 📑 Clinical Tab Bar */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(10px)',
            padding: '0.3rem',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {[
              { id: 'today', label: 'TODAY' },
              { id: 'upcoming', label: 'UPCOMING' },
              { id: 'history', label: 'HISTORY' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTimeframe(tab.id as any);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: 'calc(var(--radius-md) - 2px)',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTimeframe === tab.id ? 'var(--primary)' : 'transparent',
                  color: activeTimeframe === tab.id ? 'white' : 'var(--text-muted)',
                  boxShadow: activeTimeframe === tab.id ? '0 4px 12px rgba(15, 118, 110, 0.2)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
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
          { label: 'Status', key: 'status' as keyof Appointment, options: ['Queued', 'Patient In', 'Session Done', 'Cancelled'] },
          { label: 'Date', key: 'date' as keyof Appointment, options: [] }
        ]}
        serverPagination={{
          totalRecords,
          currentPage,
          pageSize,
          onPageChange: setCurrentPage,
          onSearchChange: (s) => { setSearchQuery(s); setCurrentPage(1); },
          onFilterChange: (f) => { setActiveFilters(f); setCurrentPage(1); },
          externalFilters: activeFilters,
          externalSearch: searchQuery
        }}
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
