'use client'
import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { 
  CreditCard, TrendingUp, TrendingDown, DollarSign, 
  BarChart3, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { usePCMSStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { RevenueExpenseChart, ExpenseCategoryChart } from './FinancialCharts';
import { motion, AnimatePresence } from 'framer-motion';

export default function FinancialWidget({ filterParams }: { filterParams: any }) {
    const router = useRouter();
    const { user } = usePCMSStore();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await api.get('/stats/financial', { params: filterParams });
                setData(res.data);
            } catch (err) {
                console.error('Financial Widget Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [filterParams]);

    if (loading) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', width: '100%' }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse" style={{ height: '120px', background: '#f1f5f9', borderRadius: 'var(--radius-lg)' }} />
                ))}
            </div>
        );
    }

    const { summary, trends, categoryBreakdown } = data || {};

    const StatCard = ({ title, value, sub, icon: Icon, color, trend }: any) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium" 
            style={{ padding: '1.5rem', flex: 1, minWidth: '220px' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', background: `${color}10`, color: color, borderRadius: 'var(--radius-md)' }}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: trend > 0 ? '#10b981' : '#ef4444', fontSize: '0.75rem', fontWeight: 800 }}>
                        {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '0.5rem', color: 'var(--text-main)' }}>{value}</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 500 }}>{sub}</p>
        </motion.div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Advanced Stats Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                <StatCard 
                    title="Revenue Efficiency" 
                    value={`${summary?.profitMargin || 0}%`} 
                    sub="Net Profit Margin"
                    icon={TrendingUp} 
                    color="var(--primary)" 
                    trend={summary?.profitMargin > 20 ? 12 : -5}
                />
                <StatCard 
                    title="Daily Velocity" 
                    value={`₹${Math.round(summary?.avgRevenuePerDay || 0).toLocaleString()}`} 
                    sub="Average Daily Revenue"
                    icon={DollarSign} 
                    color="var(--secondary)" 
                />
                <StatCard 
                    title="Pending Ratio" 
                    value={`${summary?.totalRevenue > 0 ? Math.round((summary?.totalPending / summary?.totalRevenue) * 100) : 0}%`} 
                    sub="Uncollected vs Realized"
                    icon={BarChart3} 
                    color="var(--accent)" 
                />
                <StatCard 
                    title="Cash Position" 
                    value={`₹${(summary?.totalProfit || 0).toLocaleString()}`} 
                    sub="Liquidity After Expenses"
                    icon={CreditCard} 
                    color={summary?.totalProfit >= 0 ? '#10b981' : '#ef4444'} 
                />
            </div>

            {/* Main intelligence Visualization */}
            <div className="finance-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }}>
                
                {/* Trends Chart */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card-premium" 
                    style={{ padding: '2rem', overflow: 'hidden' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Financial <span className="gradient-text">Trends</span></h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Revenue vs Expenses over selected period</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '3px' }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>REVENUE</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '3px' }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>EXPENSES</span>
                            </div>
                        </div>
                    </div>
                    {trends && trends.length > 0 ? (
                        <RevenueExpenseChart data={trends} />
                    ) : (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                            No trend data available for this range.
                        </div>
                    )}
                </motion.div>

                {/* Expense Breakdown */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card-premium" 
                    style={{ padding: '2rem' }}
                >
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Expense <span className="gradient-text">Breakdown</span></h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>Expenditure by category</p>
                    
                    {categoryBreakdown && categoryBreakdown.length > 0 ? (
                        <ExpenseCategoryChart data={categoryBreakdown} />
                    ) : (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                            No expense data available.
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

