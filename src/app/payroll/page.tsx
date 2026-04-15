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
    onSearchChange: (s: string) => { setSearchQuery(s); setCurrentPage(1); },
    onFilterChange: (f: any) => { setActiveFilters(f); setCurrentPage(1); }
  }), [totalRecords, currentPage, pageSize]);

  const recordsForTable = useMemo(() => 
    records.map(r => ({ ...r, id: r._id })), 
  [records]);

  return (
    <div className="payroll-container animate-fade-in" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem' }}>
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: 'linear-gradient(135deg, var(--primary), #0d9488)', boxShadow: '0 4px 10px rgba(13, 148, 136, 0.3)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Financial Operations</span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>
              Salary & <span className="gradient-text">Payroll Registry</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.75rem', fontSize: '1rem' }}>
              Centralized hub for specialist compensation, attendance analytics, and disbursements.
            </p>
        </div>
        <button 
            onClick={handleExportCSV}
            className="glass-interactive"
            style={{ 
              padding: '1rem 2rem', 
              borderRadius: '1rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              fontWeight: 800, 
              color: 'var(--primary)', 
              fontSize: '0.9rem', 
              border: '2px solid rgba(15, 118, 110, 0.2)',
              background: 'white',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
            }}
        >
            <FileDown size={20} /> EXPORT DATA
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

        {loading ? (
          <Loading />
        ) : (
          <DataTable<any> 
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
        )}

      {/* 📅 Monthly Attendance Grid Modal */}
      {showAttendanceModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '2rem' }}>
              <div className="card-premium animate-scale-up" style={{ width: '100%', maxWidth: '900px', padding: '2.5rem', maxHeight: '90vh', overflow: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 950 }}>Attendance Ledger</h2>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{selectedStaff?.name} • {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowAttendanceModal(false)}
                        className="glass-interactive"
                        style={{ padding: '0.75rem', borderRadius: '50%', color: 'var(--text-muted)' }}
                      >
                        <X size={20} />
                      </button>
                  </div>

                  {detailLoading ? (
                      <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
                        <div className="w-6 h-6 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em' }}>ANALYZING LOGS...</p>
                      </div>
                  ) : (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
                            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                                <div key={day} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em', paddingBottom: '0.5rem' }}>{day}</div>
                            ))}
                            {Object.entries(attendanceDetail).map(([day, data]) => (
                                <div key={day} style={{ 
                                    aspectRatio: '1', 
                                    borderRadius: 'var(--radius-sm)', 
                                    border: '1.5px solid rgba(15, 118, 110, 0.1)', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    background: data.status === 'Present' ? 'rgba(16, 185, 129, 0.05)' : data.isSunday ? 'rgba(0,0,0,0.02)' : 'rgba(239, 68, 68, 0.02)',
                                    position: 'relative',
                                    transition: 'transform 0.2s',
                                    cursor: 'default'
                                }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 900, position: 'absolute', top: '5px', left: '7px', opacity: 0.3 }}>{day}</span>
                                    {data.status === 'Present' ? (
                                        <div style={{ color: '#10b981', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <Check size={20} strokeWidth={4} />
                                            <span style={{ fontSize: '0.5rem', fontWeight: 900, marginTop: '2px' }}>PRESENT</span>
                                        </div>
                                    ) : (
                                        <div style={{ color: data.isSunday ? 'var(--text-muted)' : '#ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: data.isSunday ? 0.3 : 1 }}>
                                            {data.isSunday ? <Clock size={16} /> : <X size={18} strokeWidth={3} />}
                                            <span style={{ fontSize: '0.5rem', fontWeight: 900, marginTop: '2px' }}>{data.isSunday ? 'OFF' : 'ABSENT'}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '2rem', background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px dashed #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#dcfce7', border: '1px solid #10b981' }}></div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{Object.values(attendanceDetail).filter(d => d.status === 'Present').length} Working Days</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#fef2f2', border: '1px solid #ef4444' }}></div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{Object.values(attendanceDetail).filter(d => d.status === 'Absent' && !d.isSunday).length} Missed Days</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f1f5f9' }}></div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{Object.values(attendanceDetail).filter(d => d.isSunday).length} Weekly Offs</span>
                            </div>
                        </div>
                      </>
                  )}
              </div>
          </div>
      )}


    </div>
  );
}
