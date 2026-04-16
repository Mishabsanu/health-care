'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { Package, Tag, Hash, BarChart3, CheckCircle2, ChevronLeft, Trash2, Info, MapPin, Truck } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function EditInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { setIsSyncing, showToast } = usePCMSStore();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    unit: '',
    reorderLevel: 0,
    purchasePrice: 0,
    salePrice: 0,
    supplier: ''
  });
  const [uniqueSuppliers, setUniqueSuppliers] = useState<string[]>([]);

  const categories = ['Equipment', 'Consumables', 'Medicines', 'Stationery', 'Others'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemRes, suppliersRes] = await Promise.all([
            api.get(`/inventory/${id}`),
            api.get('/inventory/suppliers/unique')
        ]);
        const item = itemRes.data;
        setUniqueSuppliers(suppliersRes.data || []);
        
        if (item) {
          setFormData({
            name: item.name,
            sku: item.sku || '',
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            reorderLevel: item.reorderLevel,
            purchasePrice: item.purchasePrice || item.pricePerUnit || 0,
            salePrice: item.salePrice || 0,
            supplier: item.supplier || ''
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        const msg = err.response?.data?.message || 'Access denied or record missing.';
        showToast(msg, 'error');
        router.push('/inventory');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id, router, showToast]);

  // Update categories to include Products
  const categoriesList = ['Products', 'Equipment', 'Consumables', 'Medicines', 'Stationery', 'Others'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsSyncing(true);
    try {
      await api.put(`/inventory/${id}`, formData);
      router.push('/inventory');
    } catch (err: any) {
      console.error('🚫 Operational Error | Failed to update stock item:', err);
      const msg = err.response?.data?.message || 'Update failed.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to permanently clear this stock record?')) {
        setLoading(true);
        setIsSyncing(true);
        try {
            await api.delete(`/inventory/${id}`);
            router.push('/inventory');
        } catch (err) {
            showToast('Deletion failed.', 'error');
            setLoading(false);
        } finally {
            setIsSyncing(false);
        }
    }
  };

  if (fetching) return <LoadingSpinner />;

  return (
    <div className="edit-inventory-container animate-fade-in clinical-form-wide" style={{ padding: '2rem 2.5rem', paddingBottom: '7rem' }}>
      <div style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <button
            onClick={() => router.back()}
            className="glass-interactive"
            style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
          >
            <ChevronLeft size={16} /> Registry Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>STOCK REGISTRY</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Modify <span className="gradient-text">Stock Record</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
            Update the registry data for this clinical item and sync with central supply.
          </p>
        </div>
        <button 
          type="button" 
          onClick={handleDelete}
          className="glass-interactive"
          style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.8rem', border: 'none', background: 'rgba(239, 68, 68, 0.08)', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
        >
          <Trash2 size={16} /> DELETE RECORD
        </button>
      </div>

      <div className="clinical-form-card" style={{ opacity: loading ? 0.7 : 1 }}>
        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', marginBottom: '2.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderLeft: '4px solid var(--primary)', fontWeight: 600 }}>
           Registry Reference: <strong style={{ color: 'var(--primary)' }}>{id}</strong> • Verified Clinical Supply File
        </div>

        <div className="clinical-form-grid">
          <div className="col-12" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)' }}>
            <Package size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Stock <span className="gradient-text">Modification</span></h3>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '2rem' }}>
            <label className="label-premium">Item Name</label>
            <div style={{ position: 'relative' }}>
              <Package size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
              <input required type="text" className="input-premium" style={{ paddingLeft: '3.5rem' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <label className="label-premium">SKU / Catalog ID</label>
              <div style={{ position: 'relative' }}>
                <Hash size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                <input type="text" className="input-premium" style={{ paddingLeft: '3.5rem' }} value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="label-premium">Category</label>
              <div style={{ position: 'relative' }}>
                <Tag size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                <select required className="input-premium" style={{ paddingLeft: '3.5rem' }} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="" disabled>Select Category</option>
                  {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label-premium">Supplier</label>
              <div style={{ position: 'relative' }}>
                <Truck size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                <input 
                    type="text" 
                    list="suppliers-list"
                    className="input-premium" 
                    style={{ paddingLeft: '3.5rem' }} 
                    value={formData.supplier} 
                    onChange={e => setFormData({...formData, supplier: e.target.value})} 
                />
                <datalist id="suppliers-list">
                    {uniqueSuppliers.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label className="label-premium">Stock Quantity</label>
              <input required type="number" className="input-premium" style={{ fontWeight: 800, textAlign: 'center' }} value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} />
            </div>
            <div>
              <label className="label-premium">Unit</label>
              <input required type="text" className="input-premium" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
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
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Net clinical cost.</p>
            </div>
            <div>
              <label className="label-premium">Sale Price (₹)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#10b981', opacity: 0.5 }}>₹</span>
                <input type="number" className="input-premium" style={{ paddingLeft: '3.5rem', fontWeight: 800, color: '#10b981' }} value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: parseFloat(e.target.value) || 0})} />
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Patient billing price.</p>
            </div>
          </div>


          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '4rem' }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{ flex: 1, padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-subtle)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '1rem' }}
            >
              Cancel Updates
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
              {loading ? 'Processing...' : <><CheckCircle2 size={20} /> Update Stock Record</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
