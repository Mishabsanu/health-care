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
  BarChart3,
  Plus,
  History,
  User,
  X
} from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function InventoryDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const { showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [uniqueSuppliers, setUniqueSuppliers] = useState<string[]>([]);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockForm, setRestockForm] = useState({
    quantityAdded: '',
    supplierName: '',
    purchasePrice: '',
    salePrice: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [itemRes, logsRes, suppliersRes] = await Promise.all([
        api.get(`/inventory/${id}`),
        api.get(`/inventory/${id}/logs`),
        api.get('/inventory/suppliers/unique')
      ]);
      setItem(itemRes.data);
      setLogs(logsRes.data);
      setUniqueSuppliers(suppliersRes.data);
      
      // Initialize form with current prices
      setRestockForm({
        quantityAdded: '',
        supplierName: itemRes.data.supplier || '',
        purchasePrice: itemRes.data.purchasePrice || '',
        salePrice: itemRes.data.salePrice || ''
      });
    } catch (err) {
      console.error('🚫 Registry Error | Failed to fetch record:', err);
      showToast('Failed to load item profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, showToast]);

  if (loading) return <LoadingSpinner />;

  if (!item) return (
    <div className="p-12 text-center font-bold text-slate-400">
      🚫 INVENTORY ITEM NOT FOUND
    </div>
  );

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockForm.quantityAdded || !restockForm.supplierName) return;

    setSubmitting(true);
    try {
      await api.post(`/inventory/${id}/restock`, restockForm);
      showToast('✅ Stock replenishment successful.', 'success');
      setShowRestockModal(false);
      fetchData(); // Refresh all data
    } catch (err) {
      console.error('🚫 Operational Error | Restock failed:', err);
      showToast('Restock failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setShowRestockModal(true)}
            className="glass-interactive"
            style={{ 
              padding: '0.85rem 2rem', 
              borderRadius: 'var(--radius-md)', 
              background: 'white', 
              border: '2.5px solid var(--primary)',
              color: 'var(--primary)', 
              fontWeight: 800, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem'
            }}
          >
            <Plus size={18} /> ADD STOCK
          </button>
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
            <Edit size={18} /> EDIT
          </button>
        </div>
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

      {/* 📜 STOCK HISTORY LEDGER */}
      <div className="clinical-form-card animate-fade-in" style={{ marginTop: '2.5rem', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <History size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 950, margin: 0 }}>Stock Admission <span className="gradient-text">Log</span></h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>Historical procurement and inventory adjustment history.</p>
          </div>
        </div>

        {logs.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>DATE</th>
                  <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>SUPPLIER</th>
                  <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>QTY ADDED</th>
                  <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>COST PRICE</th>
                  <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>AUTHOR</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--border-subtle)' }} className="table-row-hover">
                    <td style={{ padding: '1.25rem 1rem', fontSize: '0.85rem', fontWeight: 700 }}>
                      {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '1.25rem 1rem', fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {log.supplierName}
                    </td>
                    <td style={{ padding: '1.25rem 1rem', fontSize: '0.9rem', fontWeight: 900 }}>
                      +{log.quantityAdded} <small style={{ fontWeight: 600, opacity: 0.5 }}>{item.unit}</small>
                    </td>
                    <td style={{ padding: '1.25rem 1rem', fontSize: '0.9rem', fontWeight: 800 }}>
                      ₹{log.purchasePrice?.toLocaleString()}
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--primary)' }}>
                          <User size={14} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.7 }}>{log.createdBy?.name || 'SYSTEM'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.3 }}>
            <History size={60} style={{ margin: '0 auto 1.5rem' }} />
            <p style={{ fontWeight: 800 }}>NO RECENT STOCK ADMISSIONS FOUND</p>
          </div>
        )}
      </div>

      {/* 📦 RESTOCK MODAL */}
      {showRestockModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '95%', maxWidth: '600px', padding: '3.5rem', background: 'white', position: 'relative' }}>
            <button 
                onClick={() => setShowRestockModal(false)}
                style={{ position: 'absolute', right: '2rem', top: '2rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
                <X size={24} />
            </button>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2.5rem' }}>
                <Plus size={24} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '1.8rem', fontWeight: 950, margin: 0 }}>Stock <span className="gradient-text">Replenishment</span></h2>
            </div>
            
            <form onSubmit={handleRestock}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div>
                    <label className="label-premium">QUANTITY TO ADD <span style={{ color: '#ef4444' }}>*</span></label>
                    <input 
                        required 
                        type="number" 
                        placeholder="0"
                        className="input-premium"
                        value={restockForm.quantityAdded}
                        onChange={(e) => setRestockForm({ ...restockForm, quantityAdded: e.target.value })}
                        style={{ fontWeight: 900, textAlign: 'center' }}
                    />
                  </div>
                  <div>
                    <label className="label-premium">SUPPLIER NAME <span style={{ color: '#ef4444' }}>*</span></label>
                    <input 
                        required 
                        list="suppliers-list"
                        placeholder="Type or select supplier..."
                        className="input-premium"
                        value={restockForm.supplierName}
                        onChange={(e) => setRestockForm({ ...restockForm, supplierName: e.target.value })}
                        style={{ fontWeight: 700 }}
                    />
                    <datalist id="suppliers-list">
                        {uniqueSuppliers.map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                  <div>
                    <label className="label-premium">PURCHASE PRICE (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input 
                        required 
                        type="number" 
                        className="input-premium"
                        value={restockForm.purchasePrice}
                        onChange={(e) => setRestockForm({ ...restockForm, purchasePrice: e.target.value })}
                        style={{ fontWeight: 800, color: 'var(--primary)' }}
                    />
                  </div>
                  <div>
                    <label className="label-premium">SALE PRICE (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input 
                        required 
                        type="number" 
                        className="input-premium"
                        value={restockForm.salePrice}
                        onChange={(e) => setRestockForm({ ...restockForm, salePrice: e.target.value })}
                        style={{ fontWeight: 800, color: '#10b981' }}
                    />
                  </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <button type="button" onClick={() => setShowRestockModal(false)} style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)', fontWeight: 800, color: 'var(--text-muted)' }}>CANCEL</button>
                  <button type="submit" disabled={submitting} style={{ flex: 2, padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 950, fontSize: '1rem', boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.4)' }}>
                      {submitting ? 'PROCESSING...' : 'AUTHORIZE ADMISSION'}
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
