'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Plus, Calendar, User, Building, CreditCard, ChevronRight, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';

interface BillingItem {
  serviceId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function EditInvoicePage() {
  const router = useRouter();
  const { id } = useParams();
  const { showToast, setIsSyncing, user } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    discount: 0,
    tax: 0,
    method: 'UPI',
    status: 'Unpaid',
    description: ''
  });

  const [items, setItems] = useState<BillingItem[]>([]);

  // -------------------------------------------------------------------
  // SYNC | Fetch Clinical Record & Financial Options
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      setIsSyncing(true);
      try {
        const [invRes, patientsRes, servicesRes] = await Promise.all([
          api.get(`/invoices`), 
          api.get('/patients/dropdown'),
          api.get('/services'),
        ]);
        
        const invoice = invRes.data.find((i: any) => i._id === id);
        if (invoice) {
          setFormData({
            patientId: invoice.patientId?._id || invoice.patientId || '',
            date: invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : '',
            discount: invoice.discount || 0,
            tax: invoice.tax || 0,
            method: invoice.method || 'UPI',
            status: invoice.status || 'Unpaid',
            description: invoice.description || ''
          });
          setItems(invoice.items || []);
        }
        
        setPatients(Array.isArray(patientsRes.data) ? patientsRes.data : (patientsRes.data?.data || []));
        setServices(Array.isArray(servicesRes.data) ? servicesRes.data : (servicesRes.data?.data || []));
      
      } catch (err) {
        console.error('🚫 Ledger Error | Failed to fetch clinical record:', err);
        showToast('Failed to load financial record.', 'error');
      } finally {
        setLoading(false);
        setIsSyncing(false);
      }
    };
    fetchData();
  }, [id, setIsSyncing, showToast]);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = (subtotal - Number(formData.discount)) + Number(formData.tax);

  const addItem = (serviceId: string) => {
    const service = services.find(s => s._id === serviceId);
    if (service) {
        setItems([...items, { serviceId: service._id, name: service.name, price: service.price, quantity: 1 }]);
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return showToast('Please add at least one clinical service.', 'error');
    
    setSaving(true);
    setIsSyncing(true);
    try {
      const selectedPatient = patients.find(p => p._id === formData.patientId);
      const payload = {
        ...formData,
        patientName: selectedPatient?.name || 'Unknown Patient',
        items,
        subtotal,
        amount: totalAmount
      };
      await api.put(`/invoices/${id}`, payload);
      showToast('Financial registry updated successfully.', 'success');
      router.push('/billing');
    } catch (err) {
      console.error('🚫 Ledger Error | Failed to update clinical invoice:', err);
      showToast('Financial update failed. Please check ledger data.', 'error');
    } finally {
      setSaving(false);
      setIsSyncing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin" />
      <p className="font-bold text-slate-400 animate-pulse text-xs tracking-widest">🛡️ SECURING FINANCIAL LEDGER...</p>
    </div>
  );

  return (
    <div className="edit-invoice-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>
      
      {/* 🏥 CLINICAL HEADER */}
      <div style={{ marginBottom: '3rem' }}>
        <button 
          onClick={() => router.back()} 
          style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
        >
          <ArrowLeft size={16} /> Ledger Dashboard
        </button>
        <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Modify Clinical <span className="gradient-text">Invoice</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Update medical invoicing records for patients across all clinical sites.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2.5rem', opacity: saving ? 0.7 : 1 }}>
        
        {/* LEFT COLUMN: Main Data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Section 1: Clinical Site & Patient */}
            <div className="clinical-form-card">
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary)', paddingLeft: '1rem' }}>
                  <User size={20} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Patient & <span className="gradient-text">Clinical Site</span></h3>
                </div>

                <div className="clinical-form-grid">
                    <div className="col-12">
                        <label className="label-premium">Patient Registry File</label>
                        <select required value={formData.patientId} onChange={(e) => setFormData({...formData, patientId: e.target.value})} className="input-premium">
                            <option value="" disabled>Select Patient...</option>
                            {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </div>
                    
                    <div className="col-6">
                        <label className="label-premium">Invoice Date</label>
                        <div style={{ position: 'relative' }}>
                          <Calendar size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5, pointerEvents: 'none' }} />
                          <input required type="date" className="input-premium" style={{ paddingLeft: '2.75rem' }} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: Clinical Services */}
            <div className="clinical-form-card">
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary)', paddingLeft: '1rem' }}>
                  <Plus size={20} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Service <span className="gradient-text">Calculator</span></h3>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
                    <select id="service-select" className="input-premium" style={{ flex: 1 }}>
                       <option value="">Search Clinical Services...</option>
                       {services.map(s => <option key={s._id} value={s._id}>{s.name} - ₹{s.price}</option>)}
                    </select>
                    <button 
                      type="button" 
                      onClick={() => {
                         const el = document.getElementById('service-select') as HTMLSelectElement;
                         if (el.value) addItem(el.value);
                      }} 
                      style={{ padding: '0 2rem', background: 'var(--primary)', color: 'white', fontWeight: 800, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Plus size={18} /> ADD
                    </button>
                </div>

                <div className="ledger-table-wrapper" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>DESCRIPTION</th>
                                <th style={{ textAlign: 'right', padding: '1rem' }}>RATE</th>
                                <th style={{ textAlign: 'center', padding: '1rem' }}>QTY</th>
                                <th style={{ textAlign: 'right', padding: '1rem' }}>SUBTOTAL</th>
                                <th style={{ textAlign: 'center', padding: '1rem' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>No clinical services added to this ledger record.</td></tr>
                            )}
                            {items.map((item, idx) => (
                                <tr key={idx} className="table-row-hover" style={{ borderBottom: '1px solid #f8fafc', transition: 'all 0.2s' }}>
                                    <td style={{ padding: '1.25rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>{item.name}</td>
                                    <td style={{ textAlign: 'right', padding: '1rem', fontWeight: 600 }}>₹{item.price.toLocaleString()}</td>
                                    <td style={{ textAlign: 'center', padding: '1rem' }}>
                                        <input type="number" value={item.quantity} onChange={(e) => {
                                          const newItems = [...items];
                                          newItems[idx].quantity = parseInt(e.target.value) || 1;
                                          setItems(newItems);
                                        }} style={{ width: '60px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700 }} />
                                    </td>
                                    <td style={{ textAlign: 'right', padding: '1rem', fontWeight: 800, color: 'var(--primary)' }}>₹{(item.price * item.quantity).toLocaleString()}</td>
                                    <td style={{ textAlign: 'center', padding: '1rem' }}>
                                        <button onClick={() => removeItem(idx)} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.4rem', borderRadius: '4px' }}>
                                          <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Summary & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div className="clinical-form-card" style={{ background: 'var(--bg-sidebar)', color: 'white', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '3px solid var(--primary-light)', paddingLeft: '0.75rem' }}>
                  <CreditCard size={18} style={{ color: 'var(--primary-light)' }} />
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Financial Summary</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', opacity: 0.8 }}>
                        <span>Service Subtotal</span>
                        <span style={{ fontWeight: 700 }}>₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>DISCOUNT / SCHOLARSHIP (₹)</label>
                        <input type="number" value={formData.discount} onChange={(e) => setFormData({...formData, discount: Number(e.target.value)})} style={{ width: '100%', padding: '0.65rem', borderRadius: '4px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 800, textAlign: 'right' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>TAXATION ADJUSTMENT (₹)</label>
                        <input type="number" value={formData.tax} onChange={(e) => setFormData({...formData, tax: Number(e.target.value)})} style={{ width: '100%', padding: '0.65rem', borderRadius: '4px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 800, textAlign: 'right' }} />
                    </div>
                    
                    <hr style={{ border: 'none', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-light)', letterSpacing: '0.05em' }}>TOTAL PAYABLE</span>
                        <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>₹{totalAmount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="clinical-form-card">
                 <div style={{ marginBottom: '1.5rem' }}>
                    <label className="label-premium">Settlement Handler</label>
                    <select value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value})} className="input-premium">
                        <option value="UPI">UPI / Digital Gateway</option>
                        <option value="Cash">Cash Settlement</option>
                        <option value="Card">Clinical Card Terminal</option>
                    </select>
                 </div>
                 <div style={{ marginBottom: '2rem' }}>
                    <label className="label-premium">Ledger Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="input-premium" style={{ fontWeight: 800, color: 'var(--primary)' }}>
                        <option value="Unpaid">Unpaid / Pending</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Paid">Mark as Authorized</option>
                    </select>
                 </div>

                 <button 
                  type="submit" 
                  disabled={saving} 
                  style={{ 
                    width: '100%', 
                    padding: '1.25rem', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    fontWeight: 900, 
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 10px 15px -3px rgba(15, 118, 110, 0.2)' 
                  }}
                 >
                    {saving ? 'SYNCHRONIZING...' : <><CheckCircle2 size={20} /> AUTHORIZE UPDATE</>}
                 </button>
                 
                 <button 
                   type="button" 
                   onClick={() => router.back()} 
                   style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}
                 >
                   Discard Changes
                 </button>
            </div>
        </div>
      </form>
    </div>
  );
}
