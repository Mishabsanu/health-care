'use client'
import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Package, AlertCircle } from 'lucide-react';
import { usePCMSStore } from '@/store/useStore';

export default function InventoryWidget() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // Inventory is a real-time snapshot, so no date filters needed
                const res = await api.get('/stats/inventory');
                setData(res.data);
            } catch (err) {
                console.error('Inventory Widget Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return <div role="status" className="animate-pulse" style={{ height: '300px', background: '#f8fafc', borderRadius: 'var(--radius-lg)' }} />;
    }

    const { summary, alerts } = data || {};

    return (
        <div className="card" style={{ padding: '2rem', borderLeft: '4px solid #f43f5e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={18} style={{ color: '#f43f5e' }} />
                    Inventory <span className="gradient-text">Alerts</span>
                </h3>
                <span style={{ 
                    padding: '0.3rem 0.8rem', 
                    borderRadius: '2rem', 
                    background: summary?.lowStockCount > 0 ? '#fee2e2' : '#f1f5f9',
                    color: summary?.lowStockCount > 0 ? '#ef4444' : 'var(--text-muted)',
                    fontSize: '0.7rem', 
                    fontWeight: 800 
                }}>
                    {summary?.lowStockCount > 0 ? `${summary.lowStockCount} LOW STOCK` : 'ALL STABLE'}
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '220px', overflowY: 'auto' }}>
                {!alerts || alerts.length === 0 ? (
                    <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.85rem', padding: '2rem 0' }}>
                        No inventory shortages detected.
                    </div>
                ) : alerts.map((item: any) => (
                    <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px dashed var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <AlertCircle size={16} style={{ color: '#ef4444' }} />
                            <div>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.name}</p>
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.category}</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: 900, color: '#ef4444' }}>{item.quantity} <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{item.unit}</span></p>
                            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>MIN: {item.minThreshold || 5}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
