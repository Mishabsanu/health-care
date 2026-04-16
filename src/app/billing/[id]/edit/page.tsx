'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import ClinicalSearchSelect from '@/components/ClinicalSearchSelect';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { ChevronRight, Printer, Save, Trash2, Plus, Info, Calendar, Search, UserCheck, User, MapPin, Phone, ShieldCheck, MessageSquare, Receipt } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function EditInvoicePage() {
  const router = useRouter();
  const { id } = useParams();
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [patients, setPatients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [activeSearchRow, setActiveSearchRow] = useState<number | null>(null);

  const { showToast } = usePCMSStore();
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentId: '',
    date: new Date().toISOString().split('T')[0],
    serviceItems: [{ name: '', price: '' as any, serviceId: '' }],
    inventoryItems: [] as { name: string, quantity: number, price: number, inventoryId: string, stock?: number }[],
    status: 'Unpaid',
    discount: '' as any,
    amount: 0,
    remarks: '',
    paidAmount: 0,
    payments: [] as any[],
    balanceAmount: 0,
    invoiceIdOriginal: '',
    createdByOriginal: ''
  });

  const fetchData = async () => {
    try {
      const [invRes, ptsRes, svcRes, invtRes] = await Promise.all([
        api.get(`/invoices/${id}`),
        api.get('/patients/dropdown'),
        api.get('/services'),
        api.get('/inventory')
      ]);

      const inv = invRes.data;
      if (inv) {
        // 🧪 Split core items back into Services vs Inventory for the console logic
        const svcItems = inv.items?.filter((i: any) => i.serviceId).map((i: any) => ({ 
          name: i.name, 
          price: i.price, 
          serviceId: i.serviceId 
        })) || [];
        
        const invtItems = inv.items?.filter((i: any) => !i.serviceId && i.inventoryId).map((i: any) => ({ 
          name: i.name, 
          price: i.price, 
          quantity: i.quantity, 
          inventoryId: i.inventoryId 
        })) || [];

        setFormData({
          patientId: inv.patientId?._id || inv.patientId || '',
          appointmentId: inv.appointmentId || '',
          date: inv.date ? new Date(inv.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          serviceItems: svcItems.length > 0 ? svcItems : [{ name: '', price: '' as any, serviceId: '' }],
          inventoryItems: invtItems,
          status: inv.status || 'Unpaid',
          discount: inv.discount || 0,
          amount: inv.amount || 0,
          remarks: inv.description || '',
          paidAmount: inv.paidAmount || 0,
          payments: inv.payments || [],
          balanceAmount: inv.balanceAmount || 0,
          invoiceIdOriginal: inv.id || '',
          createdByOriginal: inv.createdBy?.name || 'SYSTEM'
        });
      }

      setPatients(Array.isArray(ptsRes.data) ? ptsRes.data : (ptsRes.data?.data || []));
      setServices(Array.isArray(svcRes.data) ? svcRes.data : (svcRes.data?.data || []));
      setInventory(Array.isArray(invtRes.data) ? invtRes.data : (invtRes.data?.data || []));
    } catch (err) {
      console.error('🚫 Registry Error | Failed to hydrate financial record:', err);
      showToast('Hydration failed. Clinical record might be unavailable.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    const serviceTotal = formData.serviceItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const inventoryTotal = formData.inventoryItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0)), 0);
    const subtotal = serviceTotal + inventoryTotal;
    const amount = Math.max(0, subtotal - (Number(formData.discount) || 0));
    setFormData(prev => ({ ...prev, amount }));
  }, [formData.serviceItems, formData.inventoryItems, formData.discount]);

  const validateForm = () => {
    if (!formData.patientId) return showToast('Please select a patient.', 'error');
    const allItems = [...formData.serviceItems.filter(i => i.name), ...formData.inventoryItems];
    if (allItems.length === 0) return showToast('Registry requires at least one ledger item.', 'error');
    return true;
  };

  const handleAuthorizeUpdate = async () => {
    setSaving(true);
    try {
      const selectedPatient = patients.find(p => p._id === formData.patientId);
      const allItems = [
        ...formData.serviceItems.filter(i => i.name).map(i => ({ 
          name: i.name, 
          price: Number(i.price), 
          serviceId: i.serviceId || undefined,
          quantity: 1 
        })),
        ...formData.inventoryItems.map(i => ({ 
          name: i.name, 
          price: Number(i.price), 
          quantity: Number(i.quantity),
          inventoryId: i.inventoryId || undefined
        }))
      ];

      const payload = {
        ...formData,
        items: allItems,
        appointmentId: formData.appointmentId === '' ? undefined : formData.appointmentId,
        discount: Number(formData.discount) || 0,
        amount: Number(formData.amount) || 0,
        patientName: selectedPatient?.name || 'Unknown Patient',
        clinicName: 'Physio 4 (Edavanna)',
        description: formData.remarks
      };

      await api.put(`/invoices/${id}`, payload);
      showToast('✅ Bill successfully updated and authorized.', 'success');
      router.push('/billing');
    } catch (err: any) {
      console.error('🚫 Ledger Error | Update failed:', err);
      showToast(err.response?.data?.message || 'Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedPatient = patients.find(p => p._id === formData.patientId);
  const totalServices = formData.serviceItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const totalInventory = formData.inventoryItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0)), 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>
        <div>
          <button
            type="button"
            onClick={() => isPreview ? setIsPreview(false) : router.back()}
            style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← {isPreview ? 'Back to Form' : 'Back to Registry'}
          </button>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            Modify <span className="gradient-text">Clinical Bill</span>
          </h1>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', background: 'rgba(15, 118, 110, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>ORIGINAL ID: {formData.invoiceIdOriginal}</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>REGISTERED BY: {formData.createdByOriginal.toUpperCase()}</span>
          </div>
        </div>

        {!isPreview && (
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', justifyContent: 'flex-end' }}>
              <Calendar size={16} /> {new Date(formData.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
            </div>
            <p style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800, margin: 0 }}>CLINICAL AUDIT ACTIVE</p>
          </div>
        )}
      </div>

      {!isPreview ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: '3rem', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '24px', border: '2px dashed var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900 }}>
                        {selectedPatient?.name?.[0]}
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 850, margin: 0 }}>{selectedPatient?.name}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>ID: {selectedPatient?.patientId} • {selectedPatient?.phone}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, background: 'var(--primary)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '1rem', letterSpacing: '0.05em' }}>LOCKED REGISTRY</span>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 2rem', background: 'rgba(15, 118, 110, 0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.05em', margin: 0 }}>CLINICAL PROCEDURES</h3>
              </div>
              <div style={{ padding: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2.5px solid var(--text-main)' }}>
                      <th style={{ textAlign: 'left', padding: '0.8rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Procedure Name</th>
                      <th style={{ textAlign: 'right', padding: '0.8rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', width: '180px' }}>Fee (₹)</th>
                      <th style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.serviceItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem 0.8rem', position: 'relative' }}>
                          <input
                            required type="text" className="input-premium" placeholder="Type to search service..."
                            style={{ fontSize: '0.9rem', background: '#f8fafc' }}
                            value={item.name}
                            onFocus={() => { setActiveSearchRow(999 + idx); setItemSearch(''); }}
                            onChange={(e) => {
                              const newItems = [...formData.serviceItems];
                              newItems[idx].name = e.target.value;
                              setFormData({ ...formData, serviceItems: newItems });
                              setItemSearch(e.target.value);
                            }}
                          />
                          {activeSearchRow === (999 + idx) && (
                            <div className="glass-premium animate-fade-in" style={{
                              position: 'absolute', top: '100%', left: '0.8rem', right: '0.8rem', zIndex: 100,
                              borderRadius: '12px', maxHeight: '200px', overflowY: 'auto',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--border-subtle)', background: 'white', marginTop: '4px'
                            }}>
                              {services.filter(s => !itemSearch || s.name.toLowerCase().includes(itemSearch.toLowerCase())).map(s => (
                                <div key={s._id} onClick={() => {
                                  const newItems = [...formData.serviceItems];
                                  newItems[idx] = { name: s.name, price: s.price, serviceId: s._id };
                                  setFormData({ ...formData, serviceItems: newItems });
                                  setActiveSearchRow(null);
                                }} className="table-row-hover" style={{ padding: '0.8rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{s.name}</span>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)' }}>₹{s.price}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem 0.8rem' }}>
                          <input required type="number" className="input-premium" style={{ textAlign: 'right', fontWeight: 800 }} value={item.price} onChange={(e) => {
                            const newItems = [...formData.serviceItems];
                            newItems[idx].price = e.target.value;
                            setFormData({ ...formData, serviceItems: newItems });
                          }} />
                        </td>
                        <td style={{ padding: '1rem 0.8rem', textAlign: 'right' }}>
                          <button type="button" onClick={() => setFormData({ ...formData, serviceItems: formData.serviceItems.filter((_, i) => i !== idx) })} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                              <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" onClick={() => setFormData({ ...formData, serviceItems: [...formData.serviceItems, { name: '', price: 0, serviceId: '' }] })} style={{ marginTop: '1.25rem', color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Plus size={14} /> ADD ANOTHER PROCEDURE
                </button>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', border: '1px solid #fce7f3', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 2rem', background: 'rgba(236, 72, 153, 0.03)', borderBottom: '1px solid #fce7f3' }}>
                <Plus size={20} style={{ color: '#ec4899' }} />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#ec4899', letterSpacing: '0.05em', margin: 0 }}>MEDICAL ADD-ONS (INVENTORY)</h3>
              </div>
              <div style={{ padding: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2.5px solid #ec4899' }}>
                      <th style={{ textAlign: 'left', padding: '0.8rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Inventory Asset</th>
                      <th style={{ textAlign: 'center', padding: '0.8rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', width: '80px' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '0.8rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', width: '140px' }}>Price (₹)</th>
                      <th style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.inventoryItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem 0.8rem', position: 'relative' }}>
                          <input
                            required type="text" className="input-premium" placeholder="Type to search item..."
                            style={{ fontSize: '0.9rem', background: '#fdf2f8' }}
                            value={item.name}
                            onFocus={() => { setActiveSearchRow(800 + idx); setItemSearch(''); }}
                            onChange={(e) => {
                              const newItems = [...formData.inventoryItems];
                              newItems[idx].name = e.target.value;
                              setFormData({ ...formData, inventoryItems: newItems });
                              setItemSearch(e.target.value);
                            }}
                          />
                          {activeSearchRow === (800 + idx) && (
                            <div className="glass-premium animate-fade-in" style={{
                              position: 'absolute', top: '100%', left: '0.8rem', right: '0.8rem', zIndex: 100,
                              borderRadius: '12px', maxHeight: '200px', overflowY: 'auto',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #fce7f3', background: 'white', marginTop: '4px'
                            }}>
                              {inventory.filter(i => !itemSearch || i.name.toLowerCase().includes(itemSearch.toLowerCase())).map(i => (
                                <div key={i._id} onClick={() => {
                                  const newItems = [...formData.inventoryItems];
                                  newItems[idx] = { name: i.name, quantity: 1, price: i.salePrice || i.pricePerUnit || 0, inventoryId: i._id, stock: i.quantity };
                                  setFormData({ ...formData, inventoryItems: newItems });
                                  setActiveSearchRow(null);
                                }} className="table-row-hover" style={{ padding: '0.8rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <p style={{ fontWeight: 800, fontSize: '0.8rem', margin: 0 }}>{i.name}</p>
                                    <p style={{ fontSize: '0.65rem', color: i.quantity <= 5 ? '#ef4444' : 'var(--text-muted)', fontWeight: 800, margin: 0 }}>Stock: {i.quantity}</p>
                                  </div>
                                  <span style={{ fontWeight: 900, color: '#ec4899', fontSize: '0.75rem' }}>₹{i.salePrice || i.pricePerUnit}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem 0.8rem' }}>
                          <input required type="number" className="input-premium" style={{ textAlign: 'center', fontWeight: 800 }} value={item.quantity} onChange={(e) => {
                            const newItems = [...formData.inventoryItems];
                            newItems[idx].quantity = Number(e.target.value);
                            setFormData({ ...formData, inventoryItems: newItems });
                          }} />
                        </td>
                        <td style={{ padding: '1rem 0.8rem' }}>
                          <input required type="number" className="input-premium" style={{ textAlign: 'right', fontWeight: 800 }} value={item.price} onChange={(e) => {
                            const newItems = [...formData.inventoryItems];
                            newItems[idx].price = Number(e.target.value);
                            setFormData({ ...formData, inventoryItems: newItems });
                          }} />
                        </td>
                        <td style={{ padding: '1rem 0.8rem', textAlign: 'right' }}>
                          <button type="button" onClick={() => setFormData({ ...formData, inventoryItems: formData.inventoryItems.filter((_, i) => i !== idx) })} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" onClick={() => setFormData({ ...formData, inventoryItems: [...formData.inventoryItems, { name: '', quantity: 1, price: 0, inventoryId: '', stock: 0 }] })} style={{ marginTop: '1.25rem', color: '#ec4899', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Plus size={14} /> ADD ANOTHER ITEM
                </button>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.25rem' }}>
                <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
                <h4 style={{ fontWeight: 850, fontSize: '1.1rem', margin: 0 }}>Revision Remarks</h4>
              </div>
              <textarea
                className="textarea-premium"
                placeholder="Why are you modifying this bill? Enter details..."
                style={{ width: '100%', minHeight: '120px', borderRadius: '12px' }}
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>
          </div>

          <div style={{ position: 'sticky', top: '2rem' }}>
            <div style={{ background: '#0f172a', borderRadius: '24px', padding: '2rem', color: 'white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Receipt size={20} style={{ color: 'var(--primary-light)' }} />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 850, margin: 0 }}>Revised <span style={{ color: 'var(--primary-light)' }}>Summary</span></h3>
                  <p style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Live Ledger Update</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                  <span>Clinical Fees</span>
                  <span style={{ color: 'white' }}>₹{totalServices.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                  <span>Add-on Total</span>
                  <span style={{ color: 'white' }}>₹{totalInventory.toLocaleString()}</span>
                </div>
                <div style={{ marginBottom: '1.5rem', marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary-light)', display: 'block', marginBottom: '0.5rem' }}>Discount Adjustment (₹)</label>
                  <input
                    type="number" className="input-premium"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 800, fontSize: '0.9rem', borderRadius: '10px' }}
                    value={formData.discount} placeholder="0" onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ borderTop: '2px dashed rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.08)', borderRadius: '16px', border: '1.5px solid var(--primary)', marginBottom: '1.5rem', boxShadow: '0 0 15px rgba(13, 148, 136, 0.1)' }}>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary-light)', display: 'block', marginBottom: '0.5rem' }}>Amount Paid (₹)</label>
                      <input
                        type="number" className="input-premium"
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontWeight: 900, fontSize: '1.4rem', borderRadius: '10px', width: '100%' }}
                        value={formData.paidAmount} placeholder="0" onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <div>
                        <label style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>Method</label>
                        <select 
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, fontSize: '0.75rem', padding: '0.5rem', borderRadius: '8px' }}
                          value={formData.status === 'Paid' ? (formData.payments[0]?.method || 'Cash') : 'Cash'}
                          onChange={(e) => {
                            // Update first payment or add one if needed for the edit logic
                            const val = e.target.value;
                            setFormData(prev => ({ ...prev, method: val }));
                          }}
                        >
                          <option value="UPI" style={{ color: '#000000' }}>UPI</option>
                          <option value="Cash" style={{ color: '#000000' }}>Cash</option>
                          <option value="Card" style={{ color: '#000000' }}>Card</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>Status</label>
                        <select 
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, fontSize: '0.75rem', padding: '0.5rem', borderRadius: '8px' }}
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                        >
                          <option value="Unpaid" style={{ color: '#000000' }}>Unpaid</option>
                          <option value="Partially Paid" style={{ color: '#000000' }}>Partial</option>
                          <option value="Paid" style={{ color: '#000000' }}>Fully Paid</option>
                        </select>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.6rem', fontWeight: 900, color: (formData.amount - formData.paidAmount) > 0 ? '#fb923c' : '#2dd4bf', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                        {formData.amount - formData.paidAmount < 0 ? 'Projected Credit' : 'Final Balance Due'}
                    </p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 950, color: (formData.amount - formData.paidAmount) > 0 ? '#fb923c' : (formData.amount - formData.paidAmount < 0 ? '#2dd4bf' : 'white'), margin: 0 }}>
                        ₹{Math.abs(formData.amount - formData.paidAmount).toLocaleString()}
                    </p>
                </div>

                {formData.payments.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.55rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Payment Timeline</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {formData.payments.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ color: '#94a3b8' }}>{new Date(p.date).toLocaleDateString()}</span>
                          <span style={{ color: 'white', fontWeight: 700 }}>₹{p.amount.toLocaleString()} ({p.method})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { if (validateForm()) setIsPreview(true) }}
                  style={{
                    width: '100%', marginTop: '0.5rem', padding: '1.1rem', borderRadius: '14px',
                    background: 'var(--primary)', color: 'white', fontWeight: 900, fontSize: '0.95rem',
                    border: 'none', cursor: 'pointer', transition: 'all 0.3s ease',
                    boxShadow: '0 10px 20px -5px rgba(15, 118, 110, 0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                  }}
                >
                  Verify Revision <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-slide-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ background: 'white', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.15)', borderRadius: '32px', overflow: 'hidden' }}>
            <div style={{ padding: '3rem 4rem', borderBottom: '1.5px dashed #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <img src="/logo.jpeg" style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover' }} alt="Clinic Logo" />
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>PHYSIO 4</h3>
                    <p style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Clinic Bill Modification</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.6rem', fontWeight: 950, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Registry Date</p>
                  <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', margin: 0 }}>{new Date(formData.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <div style={{ padding: '3.5rem 4rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginBottom: '3.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.55rem', fontWeight: 950, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>Clinic Information</p>
                  <p style={{ fontWeight: 900, fontSize: '1.15rem', color: '#0f172a', marginBottom: '0.25rem' }}>PHYSIO 4</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 650 }}>Edavanna Central • 976441</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.55rem', fontWeight: 950, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>Patient Information</p>
                  <p style={{ fontWeight: 950, fontSize: '1.4rem', color: '#0f172a', marginBottom: '0.3rem', textTransform: 'capitalize' }}>{selectedPatient?.name}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 750 }}>ID: {selectedPatient?.patientId} • {selectedPatient?.phone}</p>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2.5px solid #0f172a' }}>
                    <th style={{ textAlign: 'left', padding: '1rem 0', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Clinical Specification</th>
                    <th style={{ textAlign: 'right', padding: '1rem 0', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', width: '120px' }}>Charge</th>
                  </tr>
                </thead>
                <tbody>
                  {[...formData.serviceItems.filter(i => i.name).map(i => ({ ...i, quantity: 1 })), ...formData.inventoryItems].map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1.25rem 0' }}>
                        <p style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', margin: 0 }}>{item.name}</p>
                        {item.quantity > 1 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Quantity: {item.quantity}</span>}
                      </td>
                      <td style={{ padding: '1.25rem 0', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>₹{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '300px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>Gross Total</span>
                    <span>₹{(formData.amount + Number(formData.discount || 0)).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>
                    <span>Adjustment</span>
                    <span>- ₹{Number(formData.discount || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ borderTop: '2px solid #0f172a', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Revised Payable</p>
                    <p style={{ fontWeight: 950, fontSize: '1.75rem', color: 'var(--primary)', margin: 0 }}>₹{formData.amount.toLocaleString()}</p>
                  </div>

                  {formData.paidAmount > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <span>Previously Paid</span>
                        <span style={{ color: '#0f172a' }}>₹{formData.paidAmount.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontWeight: 950, fontSize: '0.7rem', textTransform: 'uppercase', color: (formData.amount - formData.paidAmount) > 0 ? '#fb923c' : '#0d9488' }}>
                          {(formData.amount - formData.paidAmount) < 0 ? 'Projected Credit' : 'Revised Balance'}
                        </p>
                        <p style={{ fontWeight: 950, fontSize: '1.25rem', color: (formData.amount - formData.paidAmount) > 0 ? '#fb923c' : '#0d9488' }}>
                          ₹{Math.abs(formData.amount - formData.paidAmount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '2.5rem 4rem', display: 'flex', justifyContent: 'flex-end', gap: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setIsPreview(false)}
                style={{ padding: '0.9rem 2.5rem', borderRadius: '10px', background: 'white', border: '1.5px solid var(--border-subtle)', fontWeight: 800, color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  const allItems = [
                    ...formData.serviceItems.filter(i => i.name).map(i => ({ name: i.name, price: Number(i.price), quantity: 1 })),
                    ...formData.inventoryItems.map(i => ({ name: i.name, price: Number(i.price), quantity: Number(i.quantity) }))
                  ];
                  generateInvoicePDF({
                    id: id as string,
                    patientName: selectedPatient?.name || 'Unknown Patient',
                    patientPhone: selectedPatient?.phone,
                    date: formData.date,
                    items: allItems as any,
                    subtotal: formData.amount + Number(formData.discount || 0),
                    discount: Number(formData.discount || 0),
                    tax: 0,
                    amount: formData.amount,
                    clinicName: 'Physio 4',
                    clinicAddress: 'Edavanna Central, Kerala',
                    clinicPhone: '976441'
                  });
                }}
                style={{ padding: '0.9rem 2.5rem', borderRadius: '10px', background: '#f1f5f9', border: '1.5px solid #cbd5e1', fontWeight: 800, color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
              >
                <Printer size={18} /> Print Modification
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleAuthorizeUpdate}
                style={{ padding: '0.9rem 3.5rem', borderRadius: '10px', background: 'var(--bg-sidebar)', color: 'white', fontWeight: 900, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.2)' }}
              >
                {saving ? 'Processing...' : <><Save size={20} /> Authorize Update</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
