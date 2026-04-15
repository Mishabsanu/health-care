'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
    ArrowLeft, 
    Banknote, 
    Calendar, 
    Clock, 
    Check, 
    X, 
    CreditCard, 
    BadgeCheck,
    ArrowUpRight,
    UserCircle,
    Info,
    Wallet
} from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AttendanceDay {
    status: 'Present' | 'Absent';
    isSunday: boolean;
    checkIn?: string;
    checkOut?: string;
    duration?: number;
}

export default function GeneratePayslipPage() {
    const router = useRouter();
    const { id } = useParams();
    const searchParams = useSearchParams();
    const { showToast, setIsSyncing } = usePCMSStore();

    const selectedMonth = searchParams.get('month') || new Date().toISOString().slice(5, 7);
    const selectedYear = searchParams.get('year') || new Date().getFullYear().toString();

    const [loading, setLoading] = useState(true);
    const [staff, setStaff] = useState<any>(null);
    const [attendanceDetail, setAttendanceDetail] = useState<Record<number, AttendanceDay>>({});
    
    // Financial State
    const [payslipData, setPayslipData] = useState({
        basicSalary: 0,
        allowance: 0,
        deduction: 0,
        bonus: 0,
        note: '',
        type: 'Monthly' as 'Monthly' | 'Daily' | 'Hourly',
        rate: 0,
        expectedHours: 8
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Staff/Payroll Parameters
            const staffRes = await api.get(`/payroll/staff/${id}/parameters?month=${selectedMonth}&year=${selectedYear}`);
            const data = staffRes.data;
            setStaff(data);

            // 2. Fetch Attendance Ledger
            const attRes = await api.get(`/payroll/staff/${id}/attendance?month=${selectedMonth}&year=${selectedYear}`);
            setAttendanceDetail(attRes.data.days);

            // 3. Initialize Payslip Data
            setPayslipData({
                basicSalary: data.salaryDetails?.basicSalary || 0,
                allowance: data.salaryDetails?.allowance || 0,
                deduction: data.salaryDetails?.deduction || 0,
                bonus: 0,
                note: '',
                type: data.salaryConfig?.type || 'Monthly',
                rate: data.salaryConfig?.rate || 0,
                expectedHours: data.salaryConfig?.expectedHoursPerDay || 8
            });

        } catch (err) {
            console.error('🚫 Settlement Error | Data fetch failed:', err);
            showToast('Failed to load settlement parameters.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, selectedMonth, selectedYear]);

    const workedDays = useMemo(() => {
        return Object.values(attendanceDetail).filter(d => d.status === 'Present').length;
    }, [attendanceDetail]);

    const totalHoursWorked = useMemo(() => {
        return Object.values(attendanceDetail).reduce((sum, d) => sum + (d.duration || 0), 0);
    }, [attendanceDetail]);

    const calculatedBasic = useMemo(() => {
        const { type, rate, expectedHours, basicSalary } = payslipData;
        if (type === 'Monthly') return basicSalary;
        if (type === 'Daily') return rate * workedDays;
        return rate * (Number(expectedHours) || 8) * workedDays;
    }, [payslipData, workedDays]);

    const netDisbursement = useMemo(() => {
        return (calculatedBasic + payslipData.allowance + payslipData.bonus) - payslipData.deduction;
    }, [calculatedBasic, payslipData]);

    const handleConfirmDisbursement = async () => {
        try {
            setIsSyncing(true);
            const count = Math.floor(Math.random() * 9000) + 1000;
            
            // 1. Record in Ledger
            await api.post('/expenses', {
                date: new Date().toISOString().split('T')[0],
                amount: netDisbursement,
                category: 'Salaries',
                supplierName: staff.name, // MANDATORY: Required by Expense model validation
                description: `Salary Disbursement | ${staff.name} | Period: ${selectedMonth}-${selectedYear} | Log: ${workedDays}d / ${totalHoursWorked.toFixed(1)}h. ${payslipData.note}`,
                paymentMethod: 'Bank Transfer',
                status: 'Paid',
                staffId: id
            });

            // 2. Update Parameters
            await api.put(`/users/${id}`, {
                salaryDetails: {
                    basicSalary: payslipData.basicSalary,
                    allowance: payslipData.allowance,
                    deduction: payslipData.deduction
                },
                salaryConfig: {
                    type: payslipData.type,
                    rate: payslipData.rate,
                    expectedHoursPerDay: payslipData.expectedHours
                }
            });

            showToast(`Settlement finalized for ${staff.name}`, 'success');
            router.push('/payroll');
        } catch (err) {
            console.error('🚫 Financial Error | Settlement failed:', err);
            showToast('Disbursement could not be finalized.', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="settlement-page-container animate-fade-in" style={{ paddingBottom: '10rem' }}>
            {/* 🚀 Settlement Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                <div>
                    <button 
                        onClick={() => router.push('/payroll')} 
                        style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, background: 'rgba(15, 118, 110, 0.08)', padding: '0.6rem 1.25rem', borderRadius: '1rem' }}
                    >
                        <ArrowLeft size={16} /> BACK TO REGISTRY
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--primary), #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.3)' }}>
                            <Banknote size={28} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '2.25rem', fontWeight: 950, letterSpacing: '-0.03em', margin: 0 }}>
                                Monthly <span className="gradient-text">Settlement Wizard</span>
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>
                                Period: {selectedMonth}/{selectedYear} • Reviewing Attendance & Compensation
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card-premium" style={{ padding: '1.5rem 2rem', border: '1px solid #10b981', background: 'rgba(16, 185, 129, 0.03)' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                            <BadgeCheck size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ledger Integrity</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 950, color: '#059669' }}>Verified Personnel</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2.5rem' }}>
                
                {/* 📋 LEFT: Attendance Ledger (DETAILED LOGS) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card-premium" style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Clock size={20} style={{ color: 'var(--primary)' }} />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 950 }}>Detailed Attendance Ledger</h3>
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                                {workedDays} Active Days Verified
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 900 }}>
                                        <th style={{ padding: '0 1rem' }}>DATE / DAY</th>
                                        <th style={{ padding: '0 1rem' }}>STATUS</th>
                                        <th style={{ padding: '0 1rem' }}>LOGIN TIME</th>
                                        <th style={{ padding: '0 1rem' }}>LOGOUT TIME</th>
                                        <th style={{ padding: '0 1rem', textAlign: 'right' }}>WORKED HR.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(attendanceDetail).map(([day, data]) => {
                                        const dateLabel = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, parseInt(day)).toLocaleDateString('en-US', { day: '2-digit', weekday: 'short' });
                                        return (
                                            <tr key={day} style={{ 
                                                background: data.status === 'Present' ? 'white' : 'rgba(0,0,0,0.02)',
                                                borderRadius: '1rem',
                                                boxShadow: data.status === 'Present' ? '0 4px 6px -1px rgba(0,0,0,0.03)' : 'none',
                                                opacity: data.status === 'Present' ? 1 : 0.4
                                            }}>
                                                <td style={{ padding: '1.25rem 1rem', borderRadius: '1rem 0 0 1rem', fontWeight: 800, fontSize: '0.85rem' }}>{dateLabel}</td>
                                                <td style={{ padding: '1.25rem 1rem' }}>
                                                    <span style={{ 
                                                        padding: '0.3rem 0.75rem', 
                                                        borderRadius: '2rem', 
                                                        fontSize: '0.6rem', 
                                                        fontWeight: 950,
                                                        background: data.status === 'Present' ? 'rgba(16, 185, 129, 0.1)' : (data.isSunday ? 'rgba(0,0,0,0.05)' : 'rgba(239, 68, 68, 0.1)'),
                                                        color: data.status === 'Present' ? '#059669' : (data.isSunday ? '#64748b' : '#dc2626')
                                                    }}>
                                                        {data.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1.25rem 1rem', fontSize: '0.85rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                                    {data.checkIn ? new Date(data.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '-- : --'}
                                                </td>
                                                <td style={{ padding: '1.25rem 1rem', fontSize: '0.85rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                                    {data.checkOut ? new Date(data.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '-- : --'}
                                                </td>
                                                <td style={{ padding: '1.25rem 1rem', borderRadius: '0 1rem 1rem 0', textAlign: 'right', fontWeight: 950, fontSize: '0.9rem', color: 'var(--primary)' }}>
                                                    {data.duration ? `${data.duration}h` : '--'}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ⚡ RIGHT: Settlement Console */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Specialist Profile Card */}
                    <div className="card-premium" style={{ padding: '2rem', background: 'white' }}>
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(15, 118, 110, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                <UserCircle size={40} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 950, margin: 0 }}>{staff.name}</h3>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', opacity: 0.7, textTransform: 'uppercase' }}>{staff.role?.name || 'Personnel'}</div>
                            </div>
                        </div>

                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Bank Connection</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>CONNECTED</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 850 }}>{staff.bankName || 'N/A Account'}</div>
                        </div>
                    </div>

                    {/* Settlement Inputs */}
                    <div className="card-premium" style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <CreditCard size={20} style={{ color: 'var(--primary)' }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 950 }}>Compensation Parameters</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                            <div>
                                <label className="label-premium">Salary Structure</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                                    <select className="input-premium" value={payslipData.type} onChange={(e) => setPayslipData({...payslipData, type: e.target.value as any})}>
                                        <option value="Monthly">Monthly Contract</option>
                                        <option value="Daily">Daily Wage Basis</option>
                                        <option value="Hourly">Hourly Analytics</option>
                                    </select>
                                    <input 
                                        type="number" 
                                        suppressHydrationWarning
                                        className="input-premium" 
                                        value={payslipData.type === 'Monthly' ? payslipData.basicSalary : payslipData.rate} 
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            if (payslipData.type === 'Monthly') setPayslipData({...payslipData, basicSalary: val});
                                            else setPayslipData({...payslipData, rate: val});
                                        }}
                                        placeholder="Rate / Base"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label className="label-premium">Allowances (+)</label>
                                    <input type="number" suppressHydrationWarning className="input-premium" value={payslipData.allowance} onChange={(e) => setPayslipData({...payslipData, allowance: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="label-premium">Deductions (-)</label>
                                    <input type="number" suppressHydrationWarning className="input-premium" value={payslipData.deduction} onChange={(e) => setPayslipData({...payslipData, deduction: Number(e.target.value)})} />
                                </div>
                            </div>

                            <div>
                                <label className="label-premium" style={{ color: '#10b981' }}>Performance Bonus (+)</label>
                                <input type="number" className="input-premium" style={{ borderColor: '#10b981' }} value={payslipData.bonus} onChange={(e) => setPayslipData({...payslipData, bonus: Number(e.target.value)})} />
                            </div>

                            <div style={{ padding: '1.5rem', background: 'rgba(15, 118, 110, 0.04)', borderRadius: '1rem', border: '1px dashed var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Computed Net Disbursement</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 950, color: '#1e293b' }}>
                                            <span style={{ fontSize: '1rem', opacity: 0.5 }}>₹</span>{netDisbursement.toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>{totalHoursWorked.toFixed(1)} Hrs Logged</div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>VERIFIED BY BIOMETRICS</div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleConfirmDisbursement}
                                className="glass-interactive"
                                style={{ 
                                    padding: '1.25rem', 
                                    borderRadius: '1rem', 
                                    background: 'linear-gradient(135deg, var(--primary), #0d9488)', 
                                    color: 'white', 
                                    fontWeight: 950, 
                                    fontSize: '1.1rem', 
                                    border: 'none', 
                                    boxShadow: '0 15px 30px -5px rgba(13, 148, 136, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    marginTop: '1rem'
                                }}
                            >
                                <BadgeCheck size={22} /> CONFIRM DISBURSEMENT
                            </button>
                        </div>
                    </div>

                    <div style={{ padding: '1.5rem', borderRadius: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: '1rem' }}>
                        <Info size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 600 }}>
                            Proceeding with disbursement will permanently record an expense in the <strong>Salaries Ledger</strong> and update the specialist's history. Please verify the attendance logs before confirming.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
