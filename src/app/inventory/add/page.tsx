'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { Package, Tag, Hash, BarChart3, CheckCircle2, ChevronLeft, Info, MapPin } from 'lucide-react';

export default function AddInventoryPage() {
  const router = useRouter();
  const { user, setIsSyncing, showToast } = usePCMSStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Consumables',
    quantity: 0,
    unit: 'pcs',
    reorderLevel: 5,
    purchasePrice: 0,
    salePrice: 0,
    supplier: ''
  });

  const categories = ['Equipment', 'Consumables', 'Medicines', 'Stationery', 'Others'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setIsSyncing(true);
    try {
      await api.post('/inventory', formData);
      router.push('/inventory');
    } catch (err: any) {
      console.error('🚫 Operational Error | Failed to register inventory item:', err);
      const msg = err.response?.data?.message || 'Failed to register inventory item.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '2rem' }}>
        <button
          onClick={() => router.back()}
          style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
        >
          <ChevronLeft size={16} /> Back to Inventory
        </button>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Register <span className="gradient-text">New Stock Item</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>
          Add new medical equipment or clinical consumables to the stock registry.
        </p>
      </div>

      <div className="clinical-form-card" style={{ margin: '0 auto', padding: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', background: 'rgba(15, 118, 110, 0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)' }}>
          <Package size={24} style={{ color: 'var(--primary)' }} />
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Stock Information</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Clinical Supply Chain Management v1.0</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '2rem' }}>
            <label className="label-premium">Item Name</label>
            <div style={{ position: 'relative' }}>
              <Package size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
              <input required type="text" className="input-premium" style={{ paddingLeft: '3.5rem' }} placeholder="e.g., Nitrile Examination Gloves - Medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Info size={12} /> Specific naming helps in clinical audits.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <label className="label-premium">SKU / Catalog ID</label>
              <div style={{ position: 'relative' }}>
                <Hash size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                <input type="text" className="input-premium" style={{ paddingLeft: '3.5rem' }} placeholder="REF-GLOV-001" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="label-premium">Category</label>
              <div style={{ position: 'relative' }}>
                <Tag size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                <select required className="input-premium" style={{ paddingLeft: '3.5rem' }} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label className="label-premium">Initial Quantity</label>
              <input required type="number" className="input-premium" style={{ fontWeight: 800, textAlign: 'center' }} value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} />
            </div>
            <div>
              <label className="label-premium">Unit</label>
              <input required type="text" className="input-premium" placeholder="e.g., Boxes" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
            </div>
            <div>
              <label className="label-premium" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Reorder At <Info size={14} style={{ color: 'var(--primary)', cursor: 'help' }} />
              </label>
              <input required type="number" className="input-premium" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: parseInt(e.target.value) || 0})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
            <div>
              <label className="label-premium">Purchase Price (₹)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--primary)', opacity: 0.5 }}>₹</span>
                <input type="number" className="input-premium" style={{ paddingLeft: '3.5rem', fontWeight: 800 }} value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})} />
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Net cost per unit.</p>
            </div>
            <div>
              <label className="label-premium">Sale Price (₹)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#10b981', opacity: 0.5 }}>₹</span>
                <input type="number" className="input-premium" style={{ paddingLeft: '3.5rem', fontWeight: 800, color: '#10b981' }} value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: parseFloat(e.target.value) || 0})} />
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Billing price for patients.</p>
            </div>
          </div>

          <div style={{ marginBottom: '3rem' }}>
            <label className="label-premium">Preferred Supplier</label>
            <div style={{ position: 'relative' }}>
              <BarChart3 size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
              <input type="text" className="input-premium" style={{ paddingLeft: '3.5rem' }} placeholder="MedSource Health Solutions" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '4rem' }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{ flex: 1, padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-subtle)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '1rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary)',
                color: 'white',
                fontWeight: 800,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.4)'
              }}
            >
              {loading ? 'Processing...' : <><CheckCircle2 size={20} /> Register Item</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
