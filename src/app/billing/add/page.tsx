'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';

interface BillingItem {
  serviceId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const { showToast } = usePCMSStore();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    date: new Date().toISOString().split('T')[0],
    discount: 0,
    tax: 0,
    method: 'UPI',
    status: 'Unpaid',
    description: '',
    paidAmount: 0,
    paymentNote: '',
  });

  const [items, setItems] = useState<BillingItem[]>([]);

  // -------------------------------------------------------------------
  // SYNC | Fetch Clinical Registry Data
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, servicesRes] = await Promise.all([
          api.get('/patients/dropdown'),
          api.get('/services')
        ]);
        setPatients(Array.isArray(patientsRes.data) ? patientsRes.data : (patientsRes.data?.data || []));
        setServices(Array.isArray(servicesRes.data) ? servicesRes.data : (servicesRes.data?.data || []));
      } catch (err) {
        console.error('🚫 Ledger Error | Failed to fetch clinical options:', err);
      }
    };
    fetchData();
  }, []);

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
    
    setLoading(true);
    try {
      const selectedPatient = patients.find(p => p._id === formData.patientId);
      const payload = {
        ...formData,
        patientName: selectedPatient?.name || 'Unknown Patient',
        items,
        subtotal,
        amount: totalAmount
      };
      await api.post('/invoices', payload);
      showToast('Invoice generated successfully.', 'success');
      router.push('/billing');
    } catch (err) {
      console.error('🚫 Ledger Error | Failed to register medical invoice:', err);
      showToast('Financial registry failed. Please check ledger data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-invoice-container animate-fade-in" style={{ maxWidth: '900px', paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => router.back()} 
          style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ← Back to Ledger
        </button>
        <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Clinical <span className="gradient-text">Invoicing</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Generate professional medical invoices for patients within the unified clinical platform.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-muted)' }}>PATIENT & CLINICAL DATA</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Patient Registry File</label>
                        <select required value={formData.patientId} onChange={(e) => setFormData({...formData, patientId: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'white' }}>
                            <option value="">Select Patient...</option>
                            {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Invoice Date</label>
                        <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'white' }} />
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-muted)' }}>SERVICE CALCULATOR</h3>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <select id="service-select" style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'white' }}>
                       <option value="">Search Clinical Services...</option>
                       {services.map(s => <option key={s._id} value={s._id}>{s.name} - ₹{s.price}</option>)}
                    </select>
                    <button type="button" onClick={() => {
                       const el = document.getElementById('service-select') as HTMLSelectElement;
                       if (el.value) addItem(el.value);
                    }} style={{ padding: '0.75rem 1.5rem', background: 'var(--primary)', color: 'white', fontWeight: 700, borderRadius: 'var(--radius-sm)' }}>Add Item</button>
                </div>

                <div className="billing-table">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <th style={{ textAlign: 'left', padding: '1rem 0' }}>DESCRIPTION</th>
                                <th style={{ textAlign: 'right', padding: '1rem 0' }}>RATE</th>
                                <th style={{ textAlign: 'right', padding: '1rem' }}>QTY</th>
                                <th style={{ textAlign: 'right', padding: '1rem 0' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', fontSize: '0.85rem', opacity: 0.5 }}>No services added yet.</td></tr>
                            )}
                            {items.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px dotted var(--border-subtle)', fontSize: '0.85rem' }}>
                                    <td style={{ padding: '1rem 0', fontWeight: 600 }}>{item.name}</td>
                                    <td style={{ textAlign: 'right', padding: '1rem 0' }}>₹{item.price}</td>
                                    <td style={{ textAlign: 'right', padding: '1rem' }}>x {item.quantity}</td>
                                    <td style={{ textAlign: 'right', padding: '1rem 0' }}>
                                        <button onClick={() => removeItem(idx)} style={{ color: '#ef4444', fontWeight: 700, background: 'none', border: 'none' }}>×</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'var(--primary)', color: 'white' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '1.5rem', opacity: 0.8, textTransform: 'uppercase' }}>Financial Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>Subtotal</span>
                        <span style={{ fontWeight: 700 }}>₹{subtotal}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem' }}>Discount (₹)</span>
                        <input type="number" value={formData.discount} onChange={(e) => setFormData({...formData, discount: Number(e.target.value)})} style={{ padding: '0.35rem', borderRadius: '4px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, textAlign: 'right' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem' }}>Tax (₹)</span>
                        <input type="number" value={formData.tax} onChange={(e) => setFormData({...formData, tax: Number(e.target.value)})} style={{ padding: '0.35rem', borderRadius: '4px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, textAlign: 'right' }} />
                    </div>
                    <hr style={{ border: 'none', height: '1px', background: 'rgba(255,255,255,0.2)', margin: '0.5rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800 }}>
                        <span>TOTAL</span>
                        <span>₹{totalAmount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>
                        <span>Paid Amount</span>
                        <span>₹{Number(formData.paidAmount) || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: (totalAmount - (Number(formData.paidAmount) || 0)) > 0 ? '#fb923c' : (totalAmount - (Number(formData.paidAmount) || 0)) < 0 ? '#10b981' : 'white', marginTop: '0.5rem' }}>
                        <span>{(totalAmount - (Number(formData.paidAmount) || 0)) < 0 ? 'CREDIT / ADVANCE' : 'BALANCE'}</span>
                        <span>₹{Math.abs(totalAmount - (Number(formData.paidAmount) || 0)).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
                 <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>PAYMENT HANDLER</label>
                    <select value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>
                        <option value="UPI">UPI / GPay</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Clinical Card Terminal</option>
                    </select>
                 </div>
                 <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>AMOUNT PAID NOW (₹)</label>
                    <input type="number" value={formData.paidAmount} onChange={(e) => setFormData({...formData, paidAmount: Number(e.target.value)})} style={{ width: '100%', padding: '0.75rem', border: '1.5px solid var(--primary)', borderRadius: 'var(--radius-sm)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }} placeholder="0.00" />
                 </div>
                 <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>PAYMENT NOTE</label>
                    <input type="text" value={formData.paymentNote} onChange={(e) => setFormData({...formData, paymentNote: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }} placeholder="e.g. Partial for surgery / Monthly Advance" />
                 </div>
                 <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>INITIAL STATUS</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Paid">Mark as Paid</option>
                    </select>
                 </div>
                 <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', background: 'black', color: 'white', fontWeight: 600, borderRadius: 'var(--radius-md)' }}>
                    {loading ? 'Authorizing...' : 'Register Invoice'}
                 </button>
            </div>
        </div>
      </form>
    </div>
  );
}
