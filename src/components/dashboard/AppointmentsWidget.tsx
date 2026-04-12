'use client'
import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Calendar, Users } from 'lucide-react';
import { usePCMSStore } from '@/store/useStore';

export default function AppointmentsWidget({ filterParams }: { filterParams: any }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await api.get('/stats/appointments', { params: filterParams });
                setData(res.data);
            } catch (err) {
                console.error('Appointments Widget Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [filterParams]);

    if (loading) {
        return <div role="status" className="animate-pulse" style={{ height: '300px', background: '#f8fafc', borderRadius: 'var(--radius-lg)' }} />;
    }

    const { summary, distribution } = data || {};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #6366f1' }}>
                    <div style={{ opacity: 0.5, marginBottom: '0.5rem' }}><Calendar size={18} /></div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>PERIOD APPOINTMENTS</p>
                    <h2 style={{ fontSize: '1.4rem', marginTop: '0.5rem' }}>{summary?.totalAppointments || '0'}</h2>
                    <p style={{ fontSize: '0.6rem', color: '#6366f1', fontWeight: 700, marginTop: '0.25rem' }}>Scheduled Slots</p>
                </div>
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ opacity: 0.5, marginBottom: '0.5rem' }}><Users size={18} /></div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TODAY'S TURNOUT</p>
                    <h2 style={{ fontSize: '1.4rem', marginTop: '0.5rem' }}>{summary?.todayAppointments || '0'}</h2>
                    <p style={{ fontSize: '0.6rem', color: '#f59e0b', fontWeight: 700, marginTop: '0.25rem' }}>Clinical Footfall</p>
                </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2rem' }}>Status <span className="gradient-text">Distribution</span></h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {!distribution || distribution.length === 0 ? (
                        <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>No records found.</div>
                    ) : distribution.sort((a: any, b: any) => b.count - a.count).map((s: any) => (
                        <div key={s.status}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                <span>{s.status}</span>
                                <span style={{ color: 'var(--primary)' }}>
                                    {summary?.totalAppointments ? Math.round((s.count / summary.totalAppointments) * 100) : 0}% 
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginLeft: '0.4rem', fontWeight: 400 }}>({s.count})</span>
                                </span>
                            </div>
                            <div style={{ height: '0.5rem', background: '#f1f5f9', borderRadius: '1rem', overflow: 'hidden' }}>
                                <div style={{ 
                                    width: `${summary?.totalAppointments ? (s.count / summary.totalAppointments) * 100 : 0}%`, 
                                    height: '100%', 
                                    background: s.status === 'Completed' ? '#10b981' : s.status === 'Cancelled' ? '#ef4444' : 'var(--primary)',
                                    transition: 'width 0.8s ease'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
