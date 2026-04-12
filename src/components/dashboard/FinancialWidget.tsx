'use client'
import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { usePCMSStore } from '@/store/useStore';

export default function FinancialWidget({ filterParams }: { filterParams: any }) {
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', width: '100%' }}>
                <div role="status" className="max-w-sm animate-pulse" style={{ height: '100px', background: '#f8fafc', borderRadius: 'var(--radius-lg)' }} />
                <div role="status" className="max-w-sm animate-pulse" style={{ height: '100px', background: '#f8fafc', borderRadius: 'var(--radius-lg)' }} />
                <div role="status" className="max-w-sm animate-pulse" style={{ height: '100px', background: '#f8fafc', borderRadius: 'var(--radius-lg)' }} />
            </div>
        );
    }

    const { summary, trends } = data || {};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>GROSS EARNINGS</p>
                    <h2 style={{ fontSize: '1.4rem', marginTop: '0.5rem', color: 'var(--primary)' }}>₹{summary?.totalRevenue?.toLocaleString() || '0'}</h2>
                    <p style={{ fontSize: '0.6rem', color: '#16a34a', fontWeight: 700, marginTop: '0.25rem' }}>Revenue Stream</p>
                </div>
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TOTAL EXPENSES</p>
                    <h2 style={{ fontSize: '1.4rem', marginTop: '0.5rem', color: '#ef4444' }}>₹{summary?.totalExpenses?.toLocaleString() || '0'}</h2>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.25rem' }}>Operational Cost</p>
                </div>
                <div className="card" style={{ 
                    padding: '1.25rem', 
                    borderLeft: `4px solid ${summary?.totalProfit >= 0 ? '#10b981' : '#f43f5e'}`,
                    background: summary?.totalProfit >= 0 ? 'rgba(16, 185, 129, 0.02)' : 'rgba(244, 63, 94, 0.02)'
                }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>NET PROFIT</p>
                    <h2 style={{ 
                        fontSize: '1.4rem', 
                        marginTop: '0.5rem', 
                        color: summary?.totalProfit >= 0 ? '#10b981' : '#f43f5e' 
                    }}>
                        ₹{summary?.totalProfit?.toLocaleString() || '0'}
                    </h2>
                    <p style={{ 
                        fontSize: '0.6rem', 
                        color: summary?.totalProfit >= 0 ? '#10b981' : '#f43f5e', 
                        fontWeight: 800, 
                        marginTop: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                    }}>
                        {summary?.totalProfit >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {summary?.totalProfit >= 0 ? 'Surplus Recorded' : 'Deficit Recorded'}
                    </p>
                </div>
            </div>

            {/* Sub Widgets (Graph) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                
                {/* Revenue Timeline Graph */}
                <div className="card" style={{ padding: '2rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2rem' }}>Financial <span className="gradient-text">Trends</span></h3>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '220px', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                     {!trends || trends.length === 0 ? (
                         <div style={{ width: '100%', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>No data available for this period.</div>
                     ) : trends.map((d: any) => (
                        <div key={d.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ 
                                width: '100%', 
                                background: 'var(--primary)', 
                                height: `${(d.value / Math.max(...trends.map((t: any) => t.value || 1))) * 100}%`,
                                borderRadius: '0.25rem 0.25rem 0 0',
                                minHeight: '4px',
                                transition: 'height 0.8s ease'
                            }} />
                            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', transform: 'rotate(-45deg)', marginTop: '0.5rem' }}>{d.name.slice(0, 5)}</span>
                        </div>
                     ))}
                  </div>
                </div>
            </div>
        </div>
    );
}
