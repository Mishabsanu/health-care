'use client'
import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { UserCheck, Clock, Fingerprint } from 'lucide-react';
import { usePCMSStore } from '@/store/useStore';

export default function AttendanceWidget({ filterParams }: { filterParams: any }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // We use global filter, but Attendance widget usually focuses on Today. 
                // The backend controller for attendance stats already defaults to 'today' active logs.
                const res = await api.get('/stats/attendance', { params: filterParams });
                setData(res.data);
            } catch (err) {
                console.error('Attendance Widget Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [filterParams]);

    if (loading) {
        return <div role="status" className="animate-pulse" style={{ height: '300px', background: '#f8fafc', borderRadius: 'var(--radius-lg)' }} />;
    }

    const { summary, activeLogs } = data || {};

    return (
        <div className="card" style={{ padding: '2rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Fingerprint size={18} style={{ color: '#10b981' }} />
                    Staff <span className="gradient-text">Attendance</span>
                </h3>
                <span style={{ 
                    padding: '0.3rem 0.8rem', 
                    borderRadius: '2rem', 
                    background: '#ecfdf5',
                    color: '#10b981',
                    fontSize: '0.7rem', 
                    fontWeight: 800 
                }}>
                    {summary?.totalPresent || 0} PRESENT TODAY
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '220px', overflowY: 'auto' }}>
                {!activeLogs || activeLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.85rem', padding: '2rem 0' }}>
                        No staff clocked in today.
                    </div>
                ) : activeLogs.map((log: any) => (
                    <div key={log._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px dashed var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800, fontSize: '0.7rem' }}>
                                {log.staffId?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{log.staffId?.name || 'Unknown'}</p>
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{log.staffId?.role?.name || 'Staff'}</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                            <span style={{ 
                                padding: '0.2rem 0.5rem', 
                                borderRadius: '1rem', 
                                background: log.status === 'Present' ? '#dcfce7' : log.status === 'Open' ? '#e0f2fe' : '#fef9c3',
                                color: log.status === 'Present' ? '#166534' : log.status === 'Open' ? '#0ea5e9' : '#854d0e',
                                fontSize: '0.6rem',
                                fontWeight: 800
                            }}>
                                {log.status.toUpperCase()}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Clock size={10} /> {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
