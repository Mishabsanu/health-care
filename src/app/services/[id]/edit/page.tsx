'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { ArrowLeft, Tag, CreditCard, Activity, Building2, CheckCircle2, FlaskConical } from 'lucide-react';

import { usePCMSStore } from '@/store/useStore';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function EditServicePage() {
  const router = useRouter();
  const { id } = useParams();
  const { setIsSyncing, showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    status: ''
  });

  const categories = ['Consultation', 'Therapy', 'Assessment', 'Rehabilitation', 'Emergency'];

  // -------------------------------------------------------------------
  // SYNC | Fetch Clinical Registry & Service Data
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      setIsSyncing(true);
      try {
        const serviceRes = await api.get(`/services/${id}`);
        
        const service = serviceRes.data;
        
        if (service) {
          setFormData({
            name: service.name,
            category: service.category,
            price: service.price.toString(),
            status: service.status
          });
        }
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch clinical service:', err);
      } finally {
        setLoading(false);
        setIsSyncing(false);
      }
    };
    fetchData();
  }, [id, setIsSyncing]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setIsSyncing(true);
    try {
      await api.put(`/services/${id}`, formData);
      showToast('Clinical modality updated successfully.', 'success');
      router.push('/services');
    } catch (err) {
      console.error('🚫 Registry Error | Failed to update clinical modality:', err);
      showToast('Update failed. Please check medical data.', 'error');
    } finally {
      setSaving(false);
      setIsSyncing(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="edit-service-container animate-fade-in clinical-form-wide" style={{ padding: '2rem 2.5rem', paddingBottom: '7rem' }}>
      <div style={{ marginBottom: '3.5rem' }}>
        <button 
          onClick={() => router.back()} 
          className="glass-interactive"
          style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> Registry Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>SERVICE CATALOG</span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
          Modify Clinical <span className="gradient-text">Modality</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
          Adjust modality profiling and session rates for your service catalog.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="clinical-form-card" style={{ opacity: saving ? 0.7 : 1 }}>
        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', marginBottom: '2.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderLeft: '4px solid var(--primary)', fontWeight: 600 }}>
           Modality Code: <strong style={{ color: 'var(--primary)' }}>{id}</strong> • Last Updated: Persistently Synchronized
        </div>

        <div className="clinical-form-grid">
          <div className="col-12">
            <label className="label-premium">Modality Name <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <FlaskConical size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input required disabled={saving} type="text" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Ultrasound Therapy" />
            </div>
          </div>

          <div className="col-4">
            <label className="label-premium">Update Session Rate (₹) <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <CreditCard size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input required disabled={saving} type="number" min="0" onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="0" />
            </div>
          </div>

          <div className="col-4">
            <label className="label-premium">Primary Category <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Tag size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <select required disabled={saving} className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                <option value="" disabled>Select Category</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div className="col-4">
            <label className="label-premium">Modality Status <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Activity size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <select required disabled={saving} className="input-premium" style={{ paddingLeft: '2.75rem', fontWeight: 800, color: 'var(--primary)' }} value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="Available">Available</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'flex-end', marginTop: '4rem' }}>
          <button 
            type="button" 
            disabled={saving} 
            onClick={() => router.back()} 
            style={{ padding: '0.85rem 2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontWeight: 700, background: 'white', color: 'var(--text-muted)' }}
          >
            CANCEL UPDATES
          </button>
          <button 
            type="submit" 
            disabled={saving} 
            style={{ 
                padding: '0.85rem 2.5rem', 
                borderRadius: 'var(--radius-md)', 
                background: 'var(--primary)', 
                color: 'white', 
                fontWeight: 900, 
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.4)' 
            }}
          >
            {saving ? 'SYNCHRONIZING...' : <><CheckCircle2 size={18} /> SAVE MODIFICATIONS</>}
          </button>
        </div>
      </form>
    </div>
  );
}
