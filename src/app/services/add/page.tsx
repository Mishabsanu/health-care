'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { ArrowLeft, Tag, CreditCard, Building2, FlaskConical, CheckCircle2 } from 'lucide-react';

export default function AddServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user, showToast } = usePCMSStore();
  const [formData, setFormData] = useState({
    name: '',
    category: 'Therapy',
    price: '',
    description: ''
  });

  const categories = ['Consultation', 'Therapy', 'Assessment', 'Rehabilitation', 'Emergency'];

  // -------------------------------------------------------------------
  // SYNC | Fetch Clinical Branch Registry
  // -------------------------------------------------------------------


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/services', formData);
      router.push('/services');
    } catch (err) {
      console.error('🚫 Registry Error | Failed to onboard clinical service:', err);
      showToast('Failed to save service. Please check your inputs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-service-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <button
          onClick={() => router.back()}
          style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
        >
          <ArrowLeft size={16} /> Registry Dashboard
        </button>
        <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>New Clinical <span className="gradient-text">Modality</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Define a new treatment modality and configure session rates.</p>
      </div>

      <form onSubmit={handleSubmit} className="clinical-form-card" style={{ opacity: loading ? 0.7 : 1 }}>
        <div className="clinical-form-grid">
          <div className="col-12">
            <label className="label-premium">Modality Name <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <FlaskConical size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input required disabled={loading} type="text" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Ultrasound Therapy" />
            </div>
          </div>
          <div className="col-6">
            <label className="label-premium">Primary Category <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Tag size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <select disabled={loading} className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="col-6">
            <label className="label-premium">Standard Session Rate (₹) <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <CreditCard size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
              <input required disabled={loading} type="number" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="₹ 0.00" />
            </div>
          </div>

          <div className="col-12">
            <label className="label-premium">Modality Description</label>
            <textarea disabled={loading} rows={2} className="textarea-premium" style={{ minHeight: '100px', resize: 'vertical' }} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the clinical benefits, duration, and equipment requirements for this modality..." />
          </div>

        </div>

        {/* Action Row */}
        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'flex-end', marginTop: '4rem' }}>
          <button 
            type="button" 
            disabled={loading} 
            onClick={() => router.back()} 
            style={{ padding: '0.85rem 2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontWeight: 700, background: 'white', color: 'var(--text-muted)' }}
          >
            CANCEL REGISTRY
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
                padding: '0.85rem 3rem', 
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
            {loading ? 'INITIALIZING...' : <><CheckCircle2 size={18} /> AUTHORIZE MODALITY</>}
          </button>
        </div>
      </form>
    </div>
  );
}
