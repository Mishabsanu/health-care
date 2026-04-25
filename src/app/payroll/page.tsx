'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ArrowUpRight,
  Banknote,
  Building,
  UserCircle,
  BadgeCheck,
  FileDown,
  Filter,
  X,
  Check
} from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import DataTable from '@/components/DataTable';
import Loading from '@/components/Loading';

interface PayrollRecord {
  _id: string;
  name: string;
  role: string;
  joinDate: string;
  tenureDays: number;
  workedDays: number;
  totalHours: number;
  overtimeHours: number;
  salaryDetails: {
    basicSalary: number;
    allowance: number;
    deduction: number;
    netSalary: number;
  };
  salaryConfig: {
    type: 'Monthly' | 'Daily' | 'Hourly';
    rate: number;
    overtimeRate: number;
    expectedHoursPerDay?: number;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
  };
  paymentStatus: 'Paid' | 'Pending';
  lastPaymentDate: string;
  period: string;
}

interface AttendanceDay {
  status: 'Present' | 'Absent';
  isSunday: boolean;
}

export default function PayrollPage() {
  const router = useRouter();
  const { showToast, setIsSyncing, user, showConfirm } = usePCMSStore();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Period State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(5, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Attendance Detail State
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<PayrollRecord | null>(null);
  const [attendanceDetail, setAttendanceDetail] = useState<Record<number, AttendanceDay>>({});
  const [detailLoading, setDetailLoading] = useState(false);

  const months = [
    { label: 'January', value: '01' }, { label: 'February', value: '02' }, { label: 'March', value: '03' },
    { label: 'April', value: '04' }, { label: 'May', value: '05' }, { label: 'June', value: '06' },
    { label: 'July', value: '07' }, { label: 'August', value: '08' }, { label: 'September', value: '09' },
    { label: 'October', value: '10' }, { label: 'November', value: '11' }, { label: 'December', value: '12' }
  ];

  const years = [
    (new Date().getFullYear() - 1).toString(),
    new Date().getFullYear().toString()
  ];

  // 🕵️ Period Utility: Check if the selected time is in the future
  const isFuturePeriod = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const selYear = parseInt(selectedYear);
    const selMonth = parseInt(selectedMonth);

    if (selYear > currentYear) return true;
    if (selYear === currentYear && selMonth > currentMonth) return true;
    return false;
  };

  // Backend Pagination State
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const fetchPayroll = async (isInitial = false) => {
    setIsSyncing(true);
    if (isInitial && !hasLoaded) setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        month: selectedMonth,
        year: selectedYear
      });
      if (searchQuery) params.append('search', searchQuery);

      Object.entries(activeFilters).forEach(([key, values]) => {
        if (values && values.length > 0) {
          params.append(key, values[0]);
        }
      });

      const res = await api.get(`/payroll/registry?${params.toString()}`);

      if (res.data && typeof res.data.total !== 'undefined') {
        setRecords(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        setTotalRecords(res.data.total);
      } else {
        setRecords(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        setTotalRecords(res.data.length);
      }
    } catch (err) {
      console.error('🚫 Registry Error | Failed to fetch payroll data:', err);
      showToast('Could not synchronize payroll ledger.', 'error');
    } finally {
      setLoading(false);
      setHasLoaded(true);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchPayroll(!hasLoaded);
  }, [selectedMonth, selectedYear, currentPage, pageSize, searchQuery, activeFilters]);

  const fetchStaffAttendance = async (staff: PayrollRecord) => {
    setSelectedStaff(staff);
    setShowAttendanceModal(true);
    setDetailLoading(true);
    try {
      const res = await api.get(`/payroll/staff/${staff._id}/attendance?month=${selectedMonth}&year=${selectedYear}`);
      setAttendanceDetail(res.data.days);
    } catch (err) {
      console.error('🚫 Analytics Error | Failed to fetch detailed attendance:', err);
      showToast('Could not load detailed attendance.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;

    const headers = ['Staff Name', 'Role', 'Joining Date', 'Worked Days', 'Net Salary', 'Bank Name', 'Account #', 'Status', 'Record Period'];
    const rows = records.map(r => [
      r.name,
      r.role,
      new Date(r.joinDate).toLocaleDateString(),
      r.workedDays,
      r.salaryDetails.netSalary,
      r.bankDetails.bankName,
      r.bankDetails.accountNumber,
      r.paymentStatus,
      r.period
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Payroll_Report_${selectedMonth}_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columnsData = useMemo(() => [
    {
      header: 'CLINICAL SPECIALIST',
      key: (r: PayrollRecord) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(15, 118, 110, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1.5px solid rgba(15, 118, 110, 0.1)' }}>
              <UserCircle size={24} />
            </div>
            <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', border: '2px solid white' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{r.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.role}</div>
          </div>
        </div>
      )
    },
    {
      header: 'WORK VELOCITY',
      key: (r: PayrollRecord) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 950, color: 'var(--text-main)' }}>{r.workedDays} <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>DAYS</span></div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>Tenure: {r.tenureDays}d</div>
          </div>
          <button
            onClick={() => fetchStaffAttendance(r)}
            className="glass-interactive"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              border: '1.5px solid rgba(15, 118, 110, 0.15)',
              background: 'white'
            }}
          >
            <Calendar size={14} />
          </button>
        </div>
      )
    },
    {
      header: 'UTILIZATION',
      key: (r: PayrollRecord) => (
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{r.totalHours}h <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>BASE</span></div>
          {r.overtimeHours > 0 && (
            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '2px' }}>
              <ArrowUpRight size={10} /> {r.overtimeHours}h OT
            </div>
          )}
        </div>
      )
    },
    {
      header: 'NET DISBURSEMENT',
      key: (r: PayrollRecord) => (
        <div style={{ fontWeight: 950, color: 'var(--primary)', fontSize: '1rem', letterSpacing: '-0.03em' }}>
          ₹{r.salaryDetails.netSalary.toLocaleString()}
        </div>
      )
    },
    {
      header: 'LEDGER STATUS',
      key: (r: PayrollRecord) => (
        <span style={{
          padding: '0.5rem 1rem',
          borderRadius: '0.75rem',
          fontSize: '0.7rem',
          fontWeight: 900,
          background: r.paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          color: r.paymentStatus === 'Paid' ? '#059669' : '#d97706',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          border: r.paymentStatus === 'Paid' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
        }}>
          {r.paymentStatus === 'Paid' ? <BadgeCheck size={14} /> : <Clock size={14} />}
          {r.paymentStatus.toUpperCase()}
        </span>
      )
    },
  ], []);

  const paginationConfig = useMemo(() => ({
    totalRecords,
    currentPage,
    pageSize,
    onPageChange: setCurrentPage,
    onPageSizeChange: setPageSize,
    onSearchChange: (s: string) => { setSearchQuery(s); setCurrentPage(1); },
    onFilterChange: (f: any) => { setActiveFilters(f); setCurrentPage(1); }
  }), [totalRecords, currentPage, pageSize]);

  const recordsForTable = useMemo(() =>
    records.map(r => ({ ...r, id: r._id })),
    [records]);

  return (
    <div className="payroll-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem', paddingTop: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>STAFF LEDGER</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Salary & <span className="gradient-text">Payroll Registry</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
            Centralized hub for specialist compensation, attendance analytics, and disbursements.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="glass-interactive"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'white',
            color: 'var(--primary)',
            padding: '0.8rem 1.75rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.85rem',
            border: '1.5px solid rgba(15, 118, 110, 0.2)',
            boxShadow: '0 10px 20px -5px rgba(0,0,0,0.05)'
          }}
        >
          <FileDown size={18} /> EXPORT DATA
        </button>
      </div>

      {/* 📅 Control Center (Filters & Analysis) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1.5rem', marginBottom: '3.5rem' }}>

        {/* Period Control */}
        <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(15, 118, 110, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '0.75rem', background: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary)' }}>
              <Filter size={18} />
            </div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registry Period</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-premium"
              style={{ flex: 2, padding: '0.75rem 1rem', fontSize: '0.95rem', fontWeight: 700 }}
            >
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="input-premium"
              style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '0.95rem', fontWeight: 700 }}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* LIABILITY CARD */}
        <div className="card-premium" style={{
          background: 'linear-gradient(135deg, var(--primary), #0d9488)',
          color: 'white',
          padding: '1.75rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -10px rgba(13, 148, 136, 0.3)',
          border: 'none'
        }}>
          <Banknote size={80} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1, transform: 'rotate(-15deg)' }} />
          <div style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
            {isFuturePeriod() ? 'PROJECTED' : 'TOTAL'} LIABILITY
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 950, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            ₹{records.reduce((sum, r) => sum + r.salaryDetails.netSalary, 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.9 }}>
            Computed for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </div>
        </div>

        {/* STATUS CARD */}
        <div className="card-premium" style={{
          background: '#1e293b',
          color: 'white',
          padding: '1.75rem',
          position: 'relative',
          overflow: 'hidden',
          border: 'none'
        }}>
          <BadgeCheck size={80} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1, transform: 'rotate(-15deg)' }} />
          <div style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
            DISBURSEMENT STATUS
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 950, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            {isFuturePeriod() ? '-- / --' : `${records.filter(r => r.paymentStatus === 'Paid').length} / ${records.length}`}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isFuturePeriod() ? 'var(--text-muted)' : '#10b981' }} />
            {isFuturePeriod() ? 'Payroll Cycle Not Yet Open' : `${records.filter(r => r.paymentStatus === 'Paid').length} Specialists Paid Successfully`}
          </div>
        </div>
      </div>

      <DataTable<any>
        isLoading={loading}
        data={recordsForTable}
        columns={columnsData}
        searchPlaceholder="Search specialists by name..."
        onView={(r) => router.push(`/payroll/${r._id}`)}
        filterableFields={[
          { label: 'Payment Status', key: 'paymentStatus' as keyof PayrollRecord, options: ['Paid', 'Pending'] }
        ]}
        serverPagination={paginationConfig}
        customActions={(staff: PayrollRecord) => (
          <button
            onClick={() => router.push(`/payroll/generate/${staff._id}?month=${selectedMonth}&year=${selectedYear}`)}
            disabled={staff.paymentStatus === 'Paid' || isFuturePeriod()}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: (staff.paymentStatus === 'Paid' || isFuturePeriod()) ? '#f1f5f9' : 'var(--primary)',
              color: (staff.paymentStatus === 'Paid' || isFuturePeriod()) ? '#94a3b8' : 'white',
              fontWeight: 800,
              fontSize: '0.75rem',
              border: 'none',
              cursor: (staff.paymentStatus === 'Paid' || isFuturePeriod()) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <ArrowUpRight size={14} />
            {isFuturePeriod() ? 'NOT OPEN' : (staff.paymentStatus === 'Paid' ? 'DISBURSED' : (staff.salaryDetails.basicSalary === 0 ? 'SET SALARY & PAY' : 'GENERATE PAYSLIP'))}
          </button>
        )}
      />

      {/* 📅 Compact Clean Attendance Ledger Modal */}
      {showAttendanceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.30)', backdropFilter: 'blur(4px)', zIndex: 1000, overflowY: 'auto', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease-out' }}>
          <div className="card-premium animate-scale-up" style={{ width: '100%', maxWidth: '580px', margin: '4rem auto', padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.5)', borderRadius: '24px', background: '#ffffff', flexShrink: 0 }}>


            {/* White Header Block */}
            <div style={{ padding: '2rem 2.5rem', background: 'white', color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(15, 118, 110, 0.08)', color: 'var(--primary)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Attendance Ledger</h2>
                  <p style={{ color: '#64748b', fontWeight: 700, margin: '0.1rem 0 0', fontSize: '0.75rem' }}>{selectedStaff?.name} • Monthly Report</p>
                </div>
              </div>
              <button
                onClick={() => setShowAttendanceModal(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '2.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {detailLoading ? (
                <div style={{ padding: '4rem 0', textAlign: 'center' }}>
                  <div style={{ width: '32px', height: '32px', border: '3px solid #f1f5f9', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.25rem' }} />
                  <p style={{ fontWeight: 800, color: '#94a3b8', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Analysing logs...</p>
                </div>
              ) : (
                <>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <p style={{ fontSize: '0.6rem', fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>Registry Period</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                    </div>
                    <div style={{ width: '1px', background: '#e2e8f0', margin: '0 1rem' }} />
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <p style={{ fontSize: '0.6rem', fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>Staff Category</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{selectedStaff?.role}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '2.5rem' }}>
                    {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                      <div key={day} style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 950, color: '#94a3b8', letterSpacing: '0.05em', paddingBottom: '0.75rem' }}>{day}</div>
                    ))}

                    {Object.entries(attendanceDetail).map(([day, data]) => (
                      <div key={day} style={{
                        aspectRatio: '1',
                        borderRadius: '12px',
                        border: '1px solid #f1f5f9',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: data.status === 'Present' ? 'rgba(16, 185, 129, 0.03)' : (data.isSunday ? '#f8fafc' : 'rgba(239, 68, 68, 0.03)'),
                        position: 'relative'
                      }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 950, position: 'absolute', top: '5px', left: '7px', color: '#cbd5e1' }}>{day}</span>
                        {data.status === 'Present' ? (
                          <div style={{ color: '#10b981', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <CheckCircle2 size={16} strokeWidth={2.5} />
                          </div>
                        ) : (
                          <div style={{ color: data.isSunday ? '#cbd5e1' : '#ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {data.isSunday ? <Clock size={14} /> : <X size={16} strokeWidth={3} />}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ background: '#f0fdf4', padding: '1rem 1.5rem', borderRadius: '14px', border: '1px solid #dcfce7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Days Present</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 950, color: '#166534' }}>{Object.values(attendanceDetail).filter(d => d.status === 'Present').length}</span>
                    </div>
                    <div style={{ background: '#fef2f2', padding: '1rem 1.5rem', borderRadius: '14px', border: '1px solid #fee2e2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Missed Days</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 950, color: '#991b1b' }}>{Object.values(attendanceDetail).filter(d => d.status === 'Absent' && !d.isSunday).length}</span>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weekly Offs</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 950, color: '#1e293b' }}>{Object.values(attendanceDetail).filter(d => d.isSunday).length}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ padding: '1.5rem 2.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAttendanceModal(false)}
                style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', background: '#0f172a', color: 'white', fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '0.02em' }}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
