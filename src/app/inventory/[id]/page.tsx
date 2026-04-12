'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  AlertCircle, 
  ShoppingCart, 
  ArrowUpRight, 
  Edit,
  Activity,
  Info,
  Truck,
  Layers,
  BarChart3
} from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';

export default function InventoryDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const { showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await api.get(`/inventory/${id}`);
        setItem(res.data);
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch inventory item:', err);
        showToast('Failed to load item profile.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, showToast]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin" />
      <p className="font-bold text-slate-400 animate-pulse text-xs tracking-widest">🛡️ AUDITING STOCK VAULT...</p>
    </div>
  );

  if (!item) return (
    <div className="p-12 text-center font-bold text-slate-400">
      🚫 INVENTORY ITEM NOT FOUND
    </div>
  );

  const isLowStock = item.quantity <= item.reorderLevel;

  return (
    <div className="inventory-details-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>
      
      {/* 🏥 CLINICAL HEADER */}
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <button 
            onClick={() => router.push('/inventory')} 
            style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
          >
            <ArrowLeft size={16} /> Stock Registry
          </button>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Item <span className="gradient-text">Specifications</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Detailed breakdown of stock levels, procurement pricing, and sales performance.</p>
        </div>
        <button
          onClick={() => router.push(`/inventory/${id}/edit`)}
          className="glass-interactive"
          style={{ 
            padding: '0.85rem 2rem', 
            borderRadius: 'var(--radius-md)', 
            background: 'var(--primary)', 
            color: 'white', 
            fontWeight: 800, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.4)'
          }}
        >
          <Edit size={18} /> EDIT SPECIFICATIONS
        </button>
      </div>

      <div className="clinical-form-grid">
        
        {/* LEFT COLUMN: Main Specs */}
        <div className="col-8">
          <div className="clinical-form-card" style={{ height: '100%' }}>
            
            <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', marginBottom: '3.5rem' }}>
              <div style={{ width: '90px', height: '90px', borderRadius: '1.5rem', background: isLowStock ? '#fee2e2' : '#f8fafc', border: `3px solid ${isLowStock ? '#ef4444' : 'var(--primary)'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem', fontWeight: 900, color: isLowStock ? '#ef4444' : 'var(--primary)', boxShadow: '0 10px 25px -10px rgba(0,0,0,0.05)' }}>
                <Package size={44} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 950, margin: 0, letterSpacing: '-0.03em' }}>{item.name}</h2>
                  {isLowStock && (
                    <span style={{ padding: '0.4rem 1rem', borderRadius: '2rem', background: '#fee2e2', color: '#ef4444', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.05em', border: '1px solid #ef4444' }}>
                      LOW STOCK ALERT
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Tag size={16} /> SKU: {item.sku}</span>
                  <span style={{ height: '4px', width: '4px', borderRadius: '50%', background: 'var(--border-subtle)' }} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Layers size={16} /> {item.category}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '3rem' }}>
              <div className="spec-block">
                <label className="label-premium" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={14} style={{ color: 'var(--primary)' }} /> CURRENT STOCK LEVEL
                </label>
                <div style={{ fontSize: '2rem', fontWeight: 950, color: isLowStock ? '#ef4444' : 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  {item.quantity} <small style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{item.unit}</small>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.5rem' }}>Reorder Threshold: {item.reorderLevel} {item.unit}</p>
              </div>

              <div className="spec-block">
                <label className="label-premium" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <Truck size={14} style={{ color: 'var(--primary)' }} /> SUPPLIER SOURCE
                </label>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-subtle)' }}>
                  {item.supplier || 'Registry Unknown'}
                </div>
              </div>

              <div className="spec-block" style={{ gridColumn: 'span 2' }}>
                <label className="label-premium" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingCart size={14} style={{ color: 'var(--primary)' }} /> FINANCIAL MARGINS
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                   <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-subtle)' }}>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>PURCHASE PRICE</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>₹{item.purchasePrice?.toLocaleString() || '0'}</span>
                   </div>
                   <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-subtle)' }}>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>SALES PRICE</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>₹{item.salePrice?.toLocaleString() || '0'}</span>
                   </div>
                   <div style={{ padding: '1.5rem', background: 'rgba(15, 118, 110, 0.05)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--primary)' }}>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem' }}>EST. PROFIT</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>₹{(item.salePrice - item.purchasePrice).toLocaleString()}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sales Performance */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="clinical-form-card" style={{ padding: '2rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
               <Activity size={20} style={{ color: 'var(--primary)' }} />
               <h3 style={{ fontSize: '1.1rem', fontWeight: 950, letterSpacing: '-0.01em' }}>SALES PERFORMANCE</h3>
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center', padding: '2rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-subtle)' }}>
                   <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TOTAL QUANTITY SOLD</span>
                   <span style={{ fontSize: '3rem', fontWeight: 950, color: 'var(--primary)', letterSpacing: '-0.05em' }}>{item.totalSold || 0}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-subtle)' }}>
                   <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <ArrowUpRight size={20} style={{ color: '#10b981' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>REVENUE</span>
                   </div>
                   <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10b981' }}>₹{(item.totalSold * item.salePrice).toLocaleString()}</span>
                </div>
             </div>
          </div>

          <div style={{ padding: '2rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Info size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0 }}>Fulfillment Trace</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
               This item record is synced with the Clinical Inventory Ledger. Changes to unit cost or sales price will affect financial reporting for the current fiscal quarter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
