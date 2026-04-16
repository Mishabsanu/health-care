'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePCMSStore } from '@/store/useStore';
import FinancialWidget from '@/components/dashboard/FinancialWidget';
import AppointmentsWidget from '@/components/dashboard/AppointmentsWidget';
import InventoryWidget from '@/components/dashboard/InventoryWidget';
import AttendanceWidget from '@/components/dashboard/AttendanceWidget';
import {
  Users, Calendar, IndianRupee,
  Activity as ActivityIcon,
  Award
} from 'lucide-react';
import api from '@/services/api';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';

export default function Dashboard() {
  const { isLoading } = usePCMSStore();
  const [isMounted, setIsMounted] = useState(false);
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
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/stats/dashboard', { params: filterParams });
        setStatsData(res.data || null);
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
    <div className="dashboard-container animate-fade-in" style={{ padding: '2rem 2.5rem', paddingBottom: '5rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>CLINICAL DESKTOP</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Clinical <span className="gradient-text">Overview</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
            Real-time operational intelligence and clinical practice analytics.
          </p>
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
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>REPORT PERIOD:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '0.7rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-subtle)', background: 'white', fontWeight: 800, fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          <SummaryCard title="Total Patients" value={statsData?.summary?.totalPatients ?? '—'} icon={Users} color="#0d9488" onClick={() => router.push('/patients')} />
          {/* <SummaryCard title="Period Bookings" value={statsData?.summary?.totalAppointments ?? '—'} icon={Calendar} color="#6366f1" onClick={() => router.push('/appointments')} /> */}
          <SummaryCard title="Revenue (Paid)" value={`₹${(statsData?.summary?.totalRevenue || 0).toLocaleString()}`} icon={IndianRupee} color="#10b981" onClick={() => router.push('/billing')} />
          <SummaryCard title="Pending Amount" value={`₹${(statsData?.summary?.totalPending || 0).toLocaleString()}`} icon={ActivityIcon} color="#f59e0b" onClick={() => router.push('/billing')} />
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

        {/* 👨‍⚕️ Module 4: Specialist Distribution Hub */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium"
          style={{ padding: '2.5rem', background: 'white' }}
        >
          <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 950, letterSpacing: '-0.02em' }}>Specialist <span className="gradient-text">Workload Distribution</span></h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Visual distribution of clinical sessions across specialists.</p>
            </div>
            <div style={{ background: '#f1f5f9', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} /> {statsData?.doctorWorkload?.length || 0} ACTIVE SPECIALISTS
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '4rem', alignItems: 'center' }}>
            {/* 🎨 Section A: Modern Doughnut Distribution */}
            <div style={{ height: '320px', position: 'relative' }}>
              {isMounted && (
                <ResponsiveContainer width="100%" height={320} minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={statsData?.doctorWorkload || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={8}
                      dataKey="count"
                      animationDuration={1800}
                      animationBegin={200}
                      stroke="none"
                    >
                      {(statsData?.doctorWorkload || []).map((entry: any, index: number) => {
                        const COLORS = ['#0f766e', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
                        return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                      })}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length && payload[0]) {
                          const data = payload[0].payload || {};
                          const total = Number(statsData?.summary?.totalAppointments) || 1;
                          const value = Number(payload[0].value) || 0;
                          const percent = Math.round((value / total) * 100);
                          return (
                            <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: 'none' }}>
                              <div style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{data.name}</div>
                              <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem' }}>{payload[0].value} Appointments</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{percent}% Total Capacity</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--text-main)', lineHeight: 1 }}>{statsData?.summary?.totalAppointments || 0}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Total Sessions</div>
              </div>
            </div>

            {/* 📋 Section B: Interactive Roster / Legend */}
            <div>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ActivityIcon size={14} /> Performance Breakdown
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {(statsData?.doctorWorkload || []).map((doc: any, idx: number) => {
                  const COLORS = ['#0f766e', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
                  const color = COLORS[idx % COLORS.length];
                  const total = Number(statsData?.summary?.totalAppointments) || 1;
                  const count = Number(doc?.count) || 0;
                  const percent = Math.round((count / total) * 100);

                  return (
                    <motion.div
                      key={doc.name}
                      whileHover={{ x: 5 }}
                      style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: `1.5px solid ${color}15`, background: `${color}05` }}
                    >
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }}></div>
                        <span style={{ fontWeight: 850, fontSize: '0.9rem' }}>{doc.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 950, color }}>{doc.count}</div>
                          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Appointments</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-main)' }}>{percent}%</div>
                          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Load</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
