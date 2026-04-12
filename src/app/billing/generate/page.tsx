'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import ClinicalSearchSelect from '@/components/ClinicalSearchSelect';
import { ChevronRight, Printer, Save, Trash2, Plus, Info, Calendar, Search, UserCheck, User, MapPin, Phone, ShieldCheck } from 'lucide-react';

export default function GenerateInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [activeSearchRow, setActiveSearchRow] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { user, showToast } = usePCMSStore();
  const [formData, setFormData] = useState({
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ name: '', quantity: '' as any, price: '' as any, serviceId: '', inventoryId: '' }],
    status: 'Unpaid',
    discount: '' as any,
    amount: 0,
    remarks: ''
  });

  const fetchData = async () => {
    try {
      const getPatients = api.get('/patients/dropdown').then(res => setPatients(Array.isArray(res.data) ? res.data : (res.data?.data || []))).catch(e => console.error('Pt Error', e));
      const getServices = api.get('/services').then(res => setServices(Array.isArray(res.data) ? res.data : (res.data?.data || []))).catch(e => console.error('Svc Error', e));
      const getInventory = api.get('/inventory').then(res => setInventory(Array.isArray(res.data) ? res.data : (res.data?.data || []))).catch(e => console.error('Inv Error', e));

      await Promise.all([getPatients, getServices, getInventory]);
    } catch (err) {
      console.error('🚫 Registry Error | Failed to fetch financial options:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('patientId');
    const aId = params.get('appointmentId');

    if (pId) {
      setFormData(prev => ({
        ...prev,
        patientId: pId,
        remarks: aId ? `Session Bill based on Appointment #${aId}` : prev.remarks
      }));
    }
  }, [patients]);

  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0)), 0);
    const amount = Math.max(0, subtotal - (Number(formData.discount) || 0));
    setFormData(prev => ({ ...prev, amount }));
  }, [formData.items, formData.discount]);

  const handleItemSelect = (idx: number, item: any, type: 'service' | 'product') => {
    const newItems = [...formData.items];
    newItems[idx].name = item.name;

    if (type === 'service') {
      newItems[idx].price = item.price;
      newItems[idx].serviceId = item._id;
      newItems[idx].inventoryId = '';
    } else {
      newItems[idx].price = item.salePrice || item.pricePerUnit || 0;
      newItems[idx].inventoryId = item._id;
      newItems[idx].serviceId = '';
    }

    setFormData({ ...formData, items: newItems });
    setActiveSearchRow(null);
    setItemSearch('');
  };

  const validateForm = () => {
    if (!formData.patientId) {
      showToast('Please select a patient.', 'error');
      return false;
    }
    if (formData.items.length === 0) {
      showToast('Please add at least one ledger item.', 'error');
      return false;
    }
    for (const item of formData.items) {
      if (!item.name || item.name.trim() === '') {
        showToast('All ledger items must have a description.', 'error');
        return false;
      }
      if (item.price < 0) {
        showToast('Item price cannot be negative.', 'error');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!showPreview) {
      setShowPreview(true);
      return;
    }

    setLoading(true);
    try {
      const selectedPatient = patients.find(p => p._id === formData.patientId);

      const payload = {
        ...formData,
        patientName: selectedPatient?.name || 'Unknown Patient',
        clinicName: 'Main Clinic',
        description: formData.remarks
      };

      await api.post('/invoices', payload);
      router.push('/billing');
    } catch (err: any) {
      console.error('🚫 Financial Error | Failed to authorize invoice:', err);
      const errorMsg = err.response?.data?.message || 'Invoice generation failed.';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p._id === formData.patientId);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
          >
            ← Back to Billing
          </button>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Generate <span style={{ color: 'var(--primary)' }}>Clinical Invoice</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>
            Create a new invoice for patient services and treatments.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
            <Calendar size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ opacity: loading ? 0.7 : 1 }}>
        {!showPreview ? (
          <div className="clinical-form-grid">
            <div className="col-8">
              <div className="clinical-form-card" style={{ padding: '2.5rem', marginBottom: '2.5rem' }}>
                <div style={{
                  marginBottom: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '4px solid var(--primary)'
                }}>
                  <User size={20} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    Patient <span className="gradient-text">Information</span>
                  </h3>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <ClinicalSearchSelect
                    label="Search Clinical Registry *"
                    options={patients}
                    value={formData.patientId}
                    placeholder="Search clinical files (Name, Phone or Patient ID)..."
                    searchFields={['name', 'phone', 'patientId']}
                    onSelect={(p) => setFormData({ ...formData, patientId: p._id })}
                    onClear={() => setFormData({ ...formData, patientId: '' })}
                    icon={<Search size={18} />}
                    renderOption={(p) => (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {p.name?.[0]}
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{p.name}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{p.phone} • [#{p.patientId || 'N/A'}]</p>
                          </div>
                        </div>
                        <ChevronRight size={18} style={{ color: 'var(--primary-light)', opacity: 0.5 }} />
                      </div>
                    )}
                  />
                </div>

                {formData.patientId && (
                  <div className="animate-fade-in" style={{
                    background: 'white',
                    padding: '1.75rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '2rem',
                    alignItems: 'center',
                    marginTop: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.5rem', boxShadow: '0 8px 16px rgba(15, 118, 110, 0.2)' }}>
                        {selectedPatient?.name?.[0]}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.35rem', letterSpacing: '-0.02em' }}>{selectedPatient?.name}</h4>
                          <span style={{ background: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Clinical Active</span>
                        </div>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span>📞 {selectedPatient?.phone}</span>
                          <span style={{ opacity: 0.3 }}>|</span>
                          <span>🆔 {selectedPatient?.patientId || 'N/A'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="clinical-form-card" style={{ padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '4px solid var(--primary)'
                  }}>
                    <Plus size={20} style={{ color: 'var(--primary)' }} />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Clinical <span className="gradient-text">Ledger</span></h3>
                  </div>
                  <button type="button" onClick={() => setFormData({ ...formData, items: [...formData.items, { name: '', quantity: 1, price: 0, serviceId: '', inventoryId: '' }] })} style={{ color: 'var(--primary)', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', border: '2px solid var(--primary)', transition: 'var(--transition-smooth)', background: 'white' }}>
                    <Plus size={16} /> ADD LINE ITEM
                  </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', width: '50%' }}>Description</th>
                      <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', width: '15%' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', width: '25%' }}>Price (₹)</th>
                      <th style={{ width: '10%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '1rem 0.5rem', position: 'relative' }}>
                          <div style={{ position: 'relative' }}>
                            <input
                              required
                              type="text"
                              className="input-premium"
                              placeholder="Search service or product..."
                              style={{ fontSize: '0.9rem' }}
                              value={activeSearchRow === idx ? itemSearch : (item.name || '')}
                              onFocus={() => {
                                setActiveSearchRow(idx);
                                setItemSearch(item.name || '');
                              }}
                              onChange={(e) => {
                                setItemSearch(e.target.value);
                                const newItems = [...formData.items];
                                newItems[idx].name = e.target.value;
                                setFormData({ ...formData, items: newItems });
                              }}
                            />

                            {activeSearchRow === idx && (
                              <div className="glass-premium animate-fade-in" style={{
                                position: 'absolute',
                                top: '110%',
                                left: 0,
                                right: 0,
                                zIndex: 100,
                                borderRadius: 'var(--radius-md)',
                                maxHeight: '250px',
                                overflowY: 'auto',
                                boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                                border: '1px solid var(--border-subtle)',
                                background: 'white'
                              }}>
                                {services.filter(s => !itemSearch || s.name.toLowerCase().includes(itemSearch.toLowerCase())).map(s => (
                                  <div key={s._id} onClick={() => handleItemSelect(idx, s, 'service')} className="table-row-hover" style={{ padding: '0.8rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                      <ShieldCheck size={14} style={{ color: 'var(--primary)' }} />
                                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.name}</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>₹{s.price}</span>
                                  </div>
                                ))}
                                {inventory.filter(i => !itemSearch || i.name.toLowerCase().includes(itemSearch.toLowerCase())).map(i => (
                                  <div key={i._id} onClick={() => i.quantity > 0 && handleItemSelect(idx, i, 'product')} className="table-row-hover" style={{ padding: '0.8rem 1rem', cursor: i.quantity > 0 ? 'pointer' : 'not-allowed', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: i.quantity <= 0 ? 0.5 : 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                      <Plus size={14} style={{ color: '#ec4899' }} />
                                      <div>
                                        <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>{i.name}</p>
                                        <p style={{ fontSize: '0.65rem', color: i.quantity <= i.reorderLevel ? '#ef4444' : 'var(--text-muted)', margin: 0 }}>{i.quantity > 0 ? `Stock: ${i.quantity} ${i.unit}` : 'OUT OF STOCK'}</p>
                                      </div>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>₹{i.salePrice || i.pricePerUnit}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                            <input required type="number" className="input-premium" style={{ textAlign: 'center', fontSize: '0.9rem' }} value={item.quantity} placeholder="Qty" onChange={(e) => {
                             const newItems = [...formData.items];
                             newItems[idx].quantity = e.target.value;
                             setFormData({ ...formData, items: newItems });
                           }} />
                         </td>
                         <td style={{ padding: '1rem 0.5rem' }}>
                           <div style={{ position: 'relative' }}>
                             <span style={{ position: 'absolute', left: '0.75rem', top: '0.65rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>₹</span>
                             <input required type="number" className="input-premium" style={{ paddingLeft: '1.75rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 600 }} value={item.price} placeholder="0.00" onChange={(e) => {
                               const newItems = [...formData.items];
                               newItems[idx].price = e.target.value;
                               setFormData({ ...formData, items: newItems });
                             }} />
                           </div>
                        </td>
                        <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                          {formData.items.length > 1 && (
                            <button type="button" onClick={() => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) })} style={{ color: '#94a3b8' }}>
                              <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: '2rem' }}>
                  <label className="label-premium">Remarks / Notes</label>
                  <textarea className="textarea-premium" style={{ minHeight: '80px', fontSize: '0.9rem' }} placeholder="Add internal notes or payment terms..." value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="col-4">
              <div style={{ position: 'sticky', top: '2rem' }}>
                <div className="card-premium" style={{ padding: '2rem', background: 'var(--bg-sidebar)', color: 'white' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>Order Summary</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.7 }}>
                    <span>Subtotal</span>
                    <span>₹{(formData.amount + formData.discount).toLocaleString()}</span>
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem', opacity: 0.7 }}>Adjustment / Discount</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '0.75rem', top: '0.6rem', color: 'var(--text-muted)' }}>-₹</span>
                      <input type="number" className="input-premium" style={{ paddingLeft: '2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 'var(--radius-sm)' }} value={formData.discount} placeholder="0" onChange={(e) => setFormData({ ...formData, discount: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.6, marginBottom: '0.25rem' }}>Total Amount</p>
                        <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-light)' }}>₹{formData.amount.toLocaleString()}</p>
                      </div>
                      <div style={{ padding: '0.5rem', background: 'rgba(20, 184, 166, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                        <Save size={24} style={{ color: 'var(--primary-light)' }} />
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={loading || !formData.patientId} style={{ width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1rem', opacity: !formData.patientId ? 0.3 : 1, cursor: !formData.patientId ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Processing...' : <><ChevronRight size={18} /> Continue to Review</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in" style={{ background: '#f1f5f9', padding: '4rem 2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <div>
                <h3 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Review <span className="gradient-text">Invoice</span></h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Confirm the details below for patient authorization.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'white', padding: '0.6rem 1.25rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                <ShieldCheck size={16} /> INTERNAL DRAFT
              </div>
            </div>

            <div style={{
              maxWidth: '800px',
              minHeight: '1122px',
              margin: '0 auto',
              background: 'white',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)',
              borderRadius: '2px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ padding: '3rem 4rem', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ width: '42px', height: '42px', border: '2px solid var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.01em' }}>
                          Main Clinic
                        </h4>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Clinical Care Registry</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      background: '#fef9c3', color: '#854d0e',
                      padding: '0.3rem 0.75rem', borderRadius: '1rem',
                      fontSize: '0.65rem', fontWeight: 900,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      marginBottom: '1.25rem'
                    }}>
                      AUTO-ASSIGNED ON SAVE
                    </div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Date of Issue</p>
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{new Date(formData.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              <div style={{ padding: '3rem 4rem' }}>
                <div style={{ marginBottom: '3.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.1em' }}>Bill To</p>
                    <p style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{selectedPatient?.name}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>{selectedPatient?.phone}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>File ID: <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{selectedPatient?.patientId || 'N/A'}</span></p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.1em' }}>Authorization</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                      <ShieldCheck size={16} /> Clinical Clearance Verified
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: 1.4 }}>Digital authorization generated from secure clinical records.</p>
                  </div>
                </div>

                <div style={{ marginBottom: '3.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--text-main)' }}>
                        <th style={{ textAlign: 'left', padding: '1.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Service Description</th>
                        <th style={{ textAlign: 'center', padding: '1.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '1.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unit Price</th>
                        <th style={{ textAlign: 'right', padding: '1.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1.5rem 0.5rem', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</td>
                          <td style={{ padding: '1.5rem 0.5rem', textAlign: 'center', fontWeight: 500 }}>{item.quantity}</td>
                          <td style={{ padding: '1.5rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>₹{item.price.toLocaleString()}</td>
                          <td style={{ padding: '1.5rem 0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>₹{(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '4rem', marginTop: '1.5rem' }}>
                  <div>
                    {formData.remarks && (
                      <div style={{ borderLeft: '3px solid #e2e8f0', padding: '0.5rem 0 0.5rem 1.5rem', marginBottom: '3rem' }}>
                        <p style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>Notes</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.6, margin: 0 }}>{formData.remarks}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                      <span style={{ fontWeight: 600 }}>₹{(formData.amount + formData.discount).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '0.9rem', color: '#64748b' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Adjustments</span>
                      <span>- ₹{formData.discount.toLocaleString()}</span>
                    </div>
                    <div style={{ borderTop: '2px solid var(--text-main)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Total Payable</p>
                      <p style={{ fontWeight: 800, fontSize: '1.75rem', margin: 0, color: 'var(--primary)' }}>₹{formData.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ maxWidth: '800px', margin: '3.5rem auto 0', display: 'flex', gap: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowPreview(false)}
                style={{ padding: '1rem 2.5rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-subtle)', fontWeight: 700, background: 'white', fontSize: '0.95rem', transition: 'var(--transition-smooth)', color: 'var(--text-muted)' }}
              >
                Return to Editor
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '1rem 4rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-sidebar)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {loading ? 'Authorizing...' : <><Printer size={20} /> Authorize & Print</>}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
