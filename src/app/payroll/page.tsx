'use client'
import React, { useState, useEffect } from 'react';
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
import LoadingSpinner from '@/components/LoadingSpinner';

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

  const handleProcessPayment = async (staff: PayrollRecord) => {
    if (isFuturePeriod()) {
        showToast('Cannot process payments for future months.', 'error');
        return;
    }

    const { netSalary } = staff.salaryDetails;
    const { totalHours, overtimeHours, salaryConfig } = staff;

    if (netSalary <= 0) {
      showToast('Calculated salary is zero. Verify attendance logs.', 'warning');
    }

    const breakdown = `
      Period: ${selectedMonth}/${selectedYear}
      Calculated Net: ₹${netSalary.toLocaleString()}
      (${staff.workedDays} Days | ${totalHours}h Normal | ${overtimeHours}h OT)
    `;

    showConfirm(
      'Initialize Salary Disbursement',
      `Process salary disbursement for ${staff.name}?\n\n${breakdown}`,
      async () => {
        try {
          const count = Math.floor(Math.random() * 9000) + 1000;
          await api.post('/expenses', {
            id: `EXP-SAL-${count}`,
            date: new Date().toISOString().split('T')[0], // Use current date for payout
            amount: netSalary,
            category: 'Salaries',
            description: `Salary Disbursement | ${staff.name} | Period: ${selectedMonth}-${selectedYear} | ${staff.workedDays} Days`,
            paymentMethod: 'Bank Transfer',
            status: 'Paid',
            staffId: staff._id
          });
          showToast(`Salary processed for ${staff.name}`, 'success');
          fetchPayroll();
        } catch (err: any) {
          console.error('🚫 Financial Error | Payment failed:', err);
          const detail = err.response?.data?.message || 'Salary disbursement failed.';
          showToast(detail, 'error');
        }
      },
      false
    );
  };

  const columns = [
    { 
      header: 'SPECIALIST', 
      key: (r: PayrollRecord) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(15, 118, 110, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <UserCircle size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{r.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{r.role}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'WORK HISTORY', 
      key: (r: PayrollRecord) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{r.workedDays} Days</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>T: {r.tenureDays}d</div>
          </div>
          <button 
            onClick={() => fetchStaffAttendance(r)}
            className="glass-interactive"
            style={{ padding: '0.4rem', borderRadius: '50%', color: 'var(--primary)', border: '1px solid rgba(15, 118, 110, 0.2)' }}
          >
            <Calendar size={13} />
          </button>
        </div>
      )
    },
    {
      header: 'HOURS & OT',
      key: (r: PayrollRecord) => (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{r.totalHours}h <span style={{ opacity: 0.5 }}>reg.</span></div>
          {r.overtimeHours > 0 && (
            <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 900 }}>+{r.overtimeHours}h OT</div>
          )}
        </div>
      )
    },
    { 
        header: 'MONTHLY NET', 
        key: (r: PayrollRecord) => (
          <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
            ₹{r.salaryDetails.netSalary.toLocaleString()}
          </div>
        )
    },
    { 
        header: 'BANKING', 
        key: (r: PayrollRecord) => (
          <div style={{ fontSize: '0.75rem' }}>
            <div style={{ fontWeight: 700 }}>{r.bankDetails.bankName || 'N/A'}</div>
            <div style={{ opacity: 0.6 }}>{r.bankDetails.accountNumber}</div>
          </div>
        )
    },
    { 
      header: 'STATUS', 
      key: (r: PayrollRecord) => (
        <span style={{ 
          padding: '0.4rem 0.85rem', 
          borderRadius: '2rem', 
          fontSize: '0.65rem', 
          fontWeight: 900,
          background: r.paymentStatus === 'Paid' ? '#dcfce7' : '#fff7ed',
          color: r.paymentStatus === 'Paid' ? '#166534' : '#c2410c',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem'
        }}>
          {r.paymentStatus === 'Paid' ? <BadgeCheck size={12} /> : <Clock size={12} />}
          {r.paymentStatus.toUpperCase()}
        </span>
      ) 
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="payroll-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 950, letterSpacing: '-0.02em' }}>Salary & <span className="gradient-text">Payroll Registry</span></h1>
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Monitor specialist compensation, tenure, and monthly disbursement status.</p>
        </div>
        <button 
            onClick={handleExportCSV}
            className="glass-interactive"
            style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem', border: '1.5px solid var(--primary)' }}
        >
            <FileDown size={18} /> EXPORT REPORT
        </button>
      </div>

      <div className="card-premium" style={{ display: 'flex', gap: '2rem', padding: '1.5rem', marginBottom: '3rem', alignItems: 'center', background: 'rgba(15, 118, 110, 0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Filter size={20} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 900, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Report Period:</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-premium"
                style={{ width: '180px', padding: '0.6rem 1rem' }}
            >
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="input-premium"
                style={{ width: '120px', padding: '0.6rem 1rem' }}
            >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="card-premium" style={{ borderLeft: '4px solid var(--primary)', padding: '1.5rem' }}>
            <div style={{ opacity: 0.5, marginBottom: '0.5rem' }}><Banknote size={20} /></div>
            <div style={{ fontSize: '1.5rem', fontWeight: 950 }}>₹{records.reduce((sum, r) => sum + r.salaryDetails.netSalary, 0).toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {isFuturePeriod() ? 'PROJECTED' : `${selectedMonth}/${selectedYear}`} Total Liability
            </div>
        </div>
        <div className="card-premium" style={{ borderLeft: '4px solid #10b981', padding: '1.5rem' }}>
            <div style={{ opacity: 0.5, marginBottom: '0.5rem' }}><BadgeCheck size={20} /></div>
            <div style={{ fontSize: '1.5rem', fontWeight: 950 }}>
              {isFuturePeriod() ? '-- / --' : `${records.filter(r => r.paymentStatus === 'Paid').length} / ${records.length}`}
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {isFuturePeriod() ? 'PAYROLL NOT OPEN' : 'Disbursements Cleared'}
            </div>
        </div>
      </div>

        <DataTable<any> 
          data={records.map(r => ({ ...r, id: r._id }))}
          columns={columns}
          searchPlaceholder="Search specialists by name..."
          onView={(r) => router.push(`/payroll/${r._id}`)}
          filterableFields={[
            { label: 'Payment Status', key: 'paymentStatus' as keyof PayrollRecord, options: ['Paid', 'Pending'] }
          ]}
          serverPagination={{
            totalRecords,
            currentPage,
            pageSize,
            onPageChange: setCurrentPage,
            onSearchChange: (s) => { setSearchQuery(s); setCurrentPage(1); },
            onFilterChange: (f) => { setActiveFilters(f); setCurrentPage(1); }
          }}
          customActions={(staff: PayrollRecord) => (
            <button 
                onClick={() => handleProcessPayment(staff)}
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
                {isFuturePeriod() ? 'NOT OPEN' : (staff.paymentStatus === 'Paid' ? 'DISBURSED' : 'PAY SALARY')}
            </button>
          )}
        />

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
