'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePCMSStore } from '@/store/useStore';
import FinancialWidget from '@/components/dashboard/FinancialWidget';
import AppointmentsWidget from '@/components/dashboard/AppointmentsWidget';
import InventoryWidget from '@/components/dashboard/InventoryWidget';
import AttendanceWidget from '@/components/dashboard/AttendanceWidget';
import { Users, Calendar, IndianRupee, Activity as ActivityIcon } from 'lucide-react';
import api from '@/services/api';

export default function Dashboard() {
  const { isLoading } = usePCMSStore();
  const router = useRouter();
  const [filter, setFilter] = useState('Today'); // 'Today', 'Tomorrow', 'Week', 'Month', 'Year', 'All', 'Custom'
  const [statsData, setStatsData] = useState<any>(null);
  const [customDates, setCustomDates] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Calculate Date Parameters to pass down to Components
  const getFilterParams = () => {
    let params: any = {};
    const now = new Date();

    if (filter === 'Today') {
      const start = new Date(now.setHours(0, 0, 0, 0));
      params.startDate = start.toISOString();
      params.endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    } else if (filter === 'Tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      params.startDate = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
      params.endDate = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();
    } else if (filter === 'Week') {
      const start = new Date(now.setDate(now.getDate() - 7));
      params.startDate = start.toISOString();
    } else if (filter === 'Month') {
      const start = new Date(now.setMonth(now.getMonth() - 1));
      params.startDate = start.toISOString();
    } else if (filter === 'Year') {
      const start = new Date(now.setFullYear(now.getFullYear() - 1));
      params.startDate = start.toISOString();
    } else if (filter === 'Custom') {
      params.startDate = new Date(customDates.start).toISOString();
      params.endDate = new Date(customDates.end).toISOString();
    } else if (filter === 'All') {
      // No dates passed = All Time
    }
    return params;
  };

  const filterParams = getFilterParams();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/stats/dashboard', { params: filterParams });
        setStatsData(res.data?.summary || null);
      } catch (err) {
        console.error('Stats Error:', err);
      }
    };
    fetchSummary();
  }, [filter, customDates]);

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        🛡️ Initializing Clinical Desktop...
      </div>
    );
  }

  const SummaryCard = ({ title, value, icon: Icon, color, onClick }: any) => (
    <div
      onClick={onClick}
      className="card-premium"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        padding: '1.5rem',
        background: 'white',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
    >
      <div style={{ padding: '1rem', background: `${color}15`, color: color, borderRadius: 'var(--radius-md)' }}>
        <Icon size={24} />
      </div>
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.25rem' }}>{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container animate-fade-in" style={{ paddingBottom: '5rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Clinical <span className="gradient-text">Overview</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time operational intelligence for your clinical practice.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {filter === 'Custom' && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <input type="date" value={customDates.start} onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })} style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', fontWeight: 600 }} />
              <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>→</span>
              <input type="date" value={customDates.end} onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })} style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', fontWeight: 600 }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>REPORT PERIOD:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'white', fontWeight: 700, fontSize: '0.85rem' }}
            >
              <option value="Today">Today</option>
              <option value="Tomorrow">Tomorrow</option>
              <option value="Week">Last 7 Days</option>
              <option value="Month">Last 30 Days</option>
              <option value="Year">Past Year</option>
              <option value="Custom">Custom Range</option>
              <option value="All">All Time</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {/* ⚡ Operational Quick-Stats (Click Stats) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          <SummaryCard title="Total Patients" value={statsData?.totalPatients ?? '—'} icon={Users} color="#0d9488" onClick={() => router.push('/patients')} />
          <SummaryCard title="Period Bookings" value={statsData?.totalAppointments ?? '—'} icon={Calendar} color="#6366f1" onClick={() => router.push('/appointments')} />
          <SummaryCard title="Revenue (Paid)" value={`₹${(statsData?.totalRevenue || 0).toLocaleString()}`} icon={IndianRupee} color="#10b981" onClick={() => router.push('/billing')} />
          <SummaryCard title="Pending Amount" value={`₹${(statsData?.totalPending || 0).toLocaleString()}`} icon={ActivityIcon} color="#f59e0b" onClick={() => router.push('/billing')} />
        </div>
        {/* Module 3: Clinical Traffic / Appointments */}
        <AppointmentsWidget filterParams={filterParams} />


        {/* Module 2: Staff & Inventory Operations */}
        <div className="visualization-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <AttendanceWidget filterParams={filterParams} />
          <InventoryWidget />
        </div>

        <div style={{ marginTop: '1rem' }}>
          {/* Module 1: Financial & Network Intelligence */}
          <FinancialWidget filterParams={filterParams} />
        </div>
      </div>

    </div>
  );
}
