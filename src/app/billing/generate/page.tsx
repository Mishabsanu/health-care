'use client'
import ClinicalSearchSelect from '@/components/ClinicalSearchSelect';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { Calendar, ChevronRight, MessageSquare, Plus, Printer, Receipt, Save, ShieldCheck, Trash2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function GenerateInvoicePage() {
  const router = useRouter();
  const [isPreview, setIsPreview] = useState(false); // Toggle between Form and Receipt Preview
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [activeSearchRow, setActiveSearchRow] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const { user, showToast } = usePCMSStore();
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentId: '',
    date: new Date().toISOString().split('T')[0],
    serviceItems: [{ name: '', price: '' as any, serviceId: '', description: '' }],
    inventoryItems: [] as { name: string, quantity: number, price: number, inventoryId: string, stock?: number, description?: string }[],
    status: 'Unpaid',
    discount: '' as any,
    amount: 0,
    remarks: '',
    paidAmount: 0,
    paymentNote: '',
    method: 'UPI'
  });
  const [previousDebt, setPreviousDebt] = useState(0);

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
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('patientId');
    const aId = params.get('appointmentId');

    if (pId) {
      setFormData(prev => ({
        ...prev,
        patientId: pId,
        appointmentId: aId || '',
        remarks: aId ? `Clinical Session Bill based on Appointment #${aId}` : prev.remarks
      }));
    }
  }, [patients]);

  useEffect(() => {
    if (formData.patientId) {
      const syncAppointment = async () => {
        try {
          const res = await api.get(`/appointments?patientId=${formData.patientId}&status=Completed&isBilled=false`);
          const unbilled = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          if (unbilled.length > 0) {
            const latest = unbilled[0];
            setFormData(prev => ({ ...prev, appointmentId: latest._id }));
            showToast(`🔗 Auto-Sync | Linked to session on ${new Date(latest.date).toLocaleDateString()}`, 'success');
          }
        } catch (err) {
          console.error('🚫 Registry Sync Error:', err);
        }
      };

      const fetchPreviousDebt = async () => {
        try {
          const res = await api.get(`/invoices?search=${formData.patientId}`);
          const allInvoices = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
          const totalDebt = allInvoices
            .filter((inv: any) => (inv.patientId?._id === formData.patientId || inv.patientId === formData.patientId) && inv.status !== 'Paid')
            .reduce((sum: number, inv: any) => sum + (Number(inv.balanceAmount) || 0), 0);
          setPreviousDebt(totalDebt);
        } catch (err) {
          console.error('🚫 Debt Fetch Error:', err);
        }
      };

      syncAppointment();
      fetchPreviousDebt();
    } else {
        setPreviousDebt(0);
    }
  }, [formData.patientId, showToast]);

  useEffect(() => {
    const serviceTotal = formData.serviceItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const inventoryTotal = formData.inventoryItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0)), 0);
    const subtotal = serviceTotal + inventoryTotal;
    const amount = Math.max(0, subtotal - (Number(formData.discount) || 0));
    setFormData(prev => ({ ...prev, amount }));
  }, [formData.serviceItems, formData.inventoryItems, formData.discount]);

  const validateForm = () => {
    if (!formData.patientId) {
      showToast('Please select a patient.', 'error');
      return false;
    }
    const allItems = [
      ...formData.serviceItems.map(i => ({ ...i, quantity: 1 })),
      ...formData.inventoryItems
    ];
    if (allItems.length === 0 || (!formData.serviceItems[0]?.name && formData.inventoryItems.length === 0)) {
      showToast('Please add at least one clinical service or add-on.', 'error');
      return false;
    }
    return true;
  };

  const handleAuthorize = async () => {
    setLoading(true);
    try {
      const selectedPatient = patients.find(p => p._id === formData.patientId);
      const allItems = [
        ...formData.serviceItems.filter(i => i.name).map(i => ({
          ...i,
          price: Number(i.price) || 0,
          quantity: 1
        })),
        ...formData.inventoryItems.map(i => ({
          ...i,
          price: Number(i.price) || 0,
          quantity: Number(i.quantity) || 1
        }))
      ];

      const payload = {
        ...formData,
        items: allItems,
        appointmentId: formData.appointmentId === '' ? undefined : formData.appointmentId,
        discount: Number(formData.discount) || 0,
        amount: Number(formData.amount) || 0,
        paidAmount: Number(formData.paidAmount) || 0,
        paymentNote: formData.paymentNote,
        method: formData.method,
        patientName: selectedPatient?.name || 'Unknown Patient',
        clinicName: 'Physio 4 (Edavanna)',
        description: formData.remarks
      };

      await api.post('/invoices', payload);
      showToast('✅ Bill successfully saved and authorized.', 'success');
      router.push('/billing');
    } catch (err: any) {
      console.error('🚫 Financial Error | Failed to authorize bill:', err);
      const errorMsg = err.response?.data?.message || 'Bill generation failed.';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p._id === formData.patientId);
  const totalServices = formData.serviceItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const totalInventory = formData.inventoryItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0)), 0);

  if (loading && !isPreview) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '5rem', width: '100%', maxWidth: '100%', padding: '0 2rem' }}>
      {/* 🚀 Simple Header */}
      <div className="no-print" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>
        <div>
          <button
            type="button"
            onClick={() => isPreview ? setIsPreview(false) : router.back()}
            style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← {isPreview ? 'Back to Form' : 'Back to Registry'}
          </button>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {isPreview ? 'Verify' : 'Create'} <span className="gradient-text">Clinical Bill</span>
          </h1>
        </div>

        {!isPreview && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Calendar size={16} /> {isMounted ? new Date().toLocaleDateString(undefined, { dateStyle: 'long' }) : '...'}
          </div>
        )}
      </div>

      {!isPreview ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 450px', gap: '3rem', alignItems: 'flex-start' }}>

          {/* 🛠️ Main Entry Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

            {/* 1. Patient Selection Card */}
            <div className="luxury-card" style={{ padding: '2.5rem', background: 'white', borderRadius: '24px', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: '42px', height: '42px', background: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 850, letterSpacing: '-0.02em', margin: 0 }}>Patient Information</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Select patient from registry to initiate bill</p>
                </div>
              </div>

              <ClinicalSearchSelect
                options={patients}
                value={formData.patientId}
                placeholder="Search patient by name, phone or ID..."
                searchFields={['name', 'phone', 'patientId']}
                onSelect={(p) => setFormData({ ...formData, patientId: p._id })}
                onClear={() => setFormData({ ...formData, patientId: '' })}
                renderOption={(p) => (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0.2rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-sidebar)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                        {p.name?.[0]}
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>{p.name}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{p.phone} • #{p.patientId}</p>
                      </div>
                    </div>
                  </div>
                )}
              />

              {selectedPatient && (
                <div className="animate-fade-in" style={{
                  marginTop: '2rem', padding: '2rem', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                  color: 'white', position: 'relative', overflow: 'hidden',
                  boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.3)'
                }}>
                  <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.1, transform: 'rotate(15deg)' }}>
                    <ShieldCheck size={160} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'white', color: 'var(--primary)', border: '4px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 900 }}>
                        {selectedPatient.name[0]}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>{selectedPatient.name}</h4>
                        <p style={{ fontSize: '0.85rem', color: '#ccfbf1', margin: '0.2rem 0 0', fontWeight: 600 }}>Clinical ID: <span style={{ color: 'white', fontWeight: 800 }}>{selectedPatient.patientId}</span></p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 900, color: '#99f6e4', textTransform: 'uppercase', marginBottom: '0.3rem', letterSpacing: '0.05em' }}>Contact Number</p>
                      <p style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{selectedPatient.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Ledger - Inline Clinical Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

              {/* Clinical Procedures Section */}
              <div style={{ background: 'white', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 2rem', background: 'rgba(15, 118, 110, 0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.05em', margin: 0 }}>CLINICAL PROCEDURES</h3>
                </div>

                <div style={{ padding: '2rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2.5px solid var(--text-main)' }}>
                        <th style={{ textAlign: 'left', padding: '0.8rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Procedure Name</th>
                        <th style={{ textAlign: 'left', padding: '0.8rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Specification</th>
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
                              value={item.name || ''}
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
                                position: 'absolute', top: '100%', left: '0.8rem', right: '0.8rem', zIndex: 1000,
                                borderRadius: '16px', maxHeight: '300px', overflowY: 'auto',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)',
                                background: 'white', marginTop: '8px', padding: '0.5rem'
                              }}>
                                {services.filter(s => !itemSearch || s.name.toLowerCase().includes(itemSearch.toLowerCase())).map(s => (
                                  <div key={s._id} onClick={() => {
                                    const newItems = [...formData.serviceItems];
                                    newItems[idx] = { name: s.name, price: s.price, serviceId: s._id, description: '' };
                                    setFormData({ ...formData, serviceItems: newItems });
                                    setActiveSearchRow(null);
                                  }} className="table-row-hover" style={{ padding: '1rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{s.name}</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--primary)', background: 'rgba(15, 118, 110, 0.05)', padding: '4px 10px', borderRadius: '6px' }}>₹{s.price}</span>
                                  </div>
                                ))}
                                {services.filter(s => !itemSearch || s.name.toLowerCase().includes(itemSearch.toLowerCase())).length === 0 && (
                                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No matching procedures found</div>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '1rem 0.8rem' }}>
                            <input type="text" className="input-premium" placeholder="e.g. Left Knee..."
                              style={{ fontSize: '0.85rem' }} value={item.description || ''} onChange={(e) => {
                                const newItems = [...formData.serviceItems];
                                newItems[idx].description = e.target.value;
                                setFormData({ ...formData, serviceItems: newItems });
                              }} />
                          </td>
                          <td style={{ padding: '1rem 0.8rem' }}>
                            <input required type="number" className="input-premium" style={{ textAlign: 'right', fontWeight: 800 }} value={item.price ?? 0} onChange={(e) => {
                              const newItems = [...formData.serviceItems];
                              newItems[idx].price = e.target.value;
                              setFormData({ ...formData, serviceItems: newItems });
                            }} />
                          </td>
                          <td style={{ padding: '1rem 0.8rem', textAlign: 'right' }}>
                            {formData.serviceItems.length > 1 && (
                              <button type="button" onClick={() => setFormData({ ...formData, serviceItems: formData.serviceItems.filter((_, i) => i !== idx) })} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <Trash2 size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button type="button" onClick={() => setFormData({ ...formData, serviceItems: [...formData.serviceItems, { name: '', price: 0, serviceId: '', description: '' }] })} style={{ marginTop: '1.25rem', color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Plus size={14} /> ADD ANOTHER PROCEDURE
                  </button>
                </div>
              </div>

              {/* Medical Add-ons Section */}
              <div style={{ background: 'white', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', border: '1px solid #fce7f3' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 2rem', background: 'rgba(236, 72, 153, 0.03)', borderBottom: '1px solid #fce7f3' }}>
                  <Plus size={20} style={{ color: '#ec4899' }} />
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#ec4899', letterSpacing: '0.05em', margin: 0 }}>MEDICAL ADD-ONS (INVENTORY)</h3>
                </div>

                <div style={{ padding: '2rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2.5px solid #ec4899' }}>
                        <th style={{ textAlign: 'left', padding: '0.8rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Inventory Asset</th>
                        <th style={{ textAlign: 'left', padding: '0.8rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Specification</th>
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
                              value={item.name || ''}
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
                                position: 'absolute', top: '100%', left: '0.8rem', right: '0.8rem', zIndex: 1000,
                                borderRadius: '16px', maxHeight: '300px', overflowY: 'auto',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid #fce7f3',
                                background: 'white', marginTop: '8px', padding: '0.5rem'
                              }}>
                                {inventory.filter(i => !itemSearch || i.name.toLowerCase().includes(itemSearch.toLowerCase())).map(i => (
                                  <div key={i._id} onClick={() => {
                                    if (i.quantity <= 0) return;
                                    const newItems = [...formData.inventoryItems];
                                    newItems[idx] = { name: i.name, quantity: 1, price: i.salePrice || i.pricePerUnit || 0, inventoryId: i._id, stock: i.quantity };
                                    setFormData({ ...formData, inventoryItems: newItems });
                                    setActiveSearchRow(null);
                                  }} className="table-row-hover" style={{ padding: '1rem', borderRadius: '10px', cursor: i.quantity > 0 ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <div>
                                      <p style={{ fontWeight: 800, fontSize: '0.95rem', margin: 0 }}>{i.name}</p>
                                      <p style={{ fontSize: '0.75rem', color: i.quantity <= 5 ? '#ef4444' : 'var(--text-muted)', fontWeight: 800, margin: 0 }}>Stock: {i.quantity}</p>
                                    </div>
                                    <span style={{ fontWeight: 900, color: '#ec4899', fontSize: '0.85rem', background: 'rgba(236, 72, 153, 0.05)', padding: '4px 10px', borderRadius: '6px' }}>₹{i.salePrice || i.pricePerUnit}</span>
                                  </div>
                                ))}
                                {inventory.filter(i => !itemSearch || i.name.toLowerCase().includes(itemSearch.toLowerCase())).length === 0 && (
                                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No matching inventory items found</div>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '1rem 0.8rem' }}>
                            <input type="text" className="input-premium" placeholder="Batch/Exp..."
                              style={{ fontSize: '0.85rem' }} value={item.description || ''} onChange={(e) => {
                                const newItems = [...formData.inventoryItems];
                                newItems[idx].description = e.target.value;
                                setFormData({ ...formData, inventoryItems: newItems });
                              }} />
                          </td>
                          <td style={{ padding: '1rem 0.8rem' }}>
                            <input required type="number" className="input-premium" style={{ textAlign: 'center', fontWeight: 800 }} value={item.quantity ?? 1} onChange={(e) => {
                              const newItems = [...formData.inventoryItems];
                              newItems[idx].quantity = Number(e.target.value);
                              setFormData({ ...formData, inventoryItems: newItems });
                            }} />
                          </td>
                          <td style={{ padding: '1rem 0.8rem' }}>
                            <input required type="number" className="input-premium" style={{ textAlign: 'right', fontWeight: 800 }} value={item.price ?? 0} onChange={(e) => {
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
                  <button type="button" onClick={() => setFormData({ ...formData, inventoryItems: [...formData.inventoryItems, { name: '', quantity: 1, price: 0, inventoryId: '', stock: 0, description: '' }] })} style={{ marginTop: '1.25rem', color: '#ec4899', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Plus size={14} /> ADD ANOTHER ITEM
                  </button>
                </div>
              </div>

            </div>

            {/* 3. Remarks Card */}
            <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.25rem' }}>
                <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
                <h4 style={{ fontWeight: 850, fontSize: '1.1rem', margin: 0 }}>Case Remarks</h4>
              </div>
              <textarea
                className="textarea-premium"
                placeholder="Enter clinical notes or specialized instructions..."
                style={{ width: '100%', minHeight: '120px', borderRadius: '12px' }}
                value={formData.remarks || ''}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>
          </div>

          {/* 🧾 Live Preview Sidebar */}
          <div style={{ position: 'sticky', top: '2rem' }}>
            <div style={{ background: '#0f172a', borderRadius: '24px', padding: '2rem', color: 'white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Receipt size={20} style={{ color: 'var(--primary-light)' }} />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 850, margin: 0 }}>Draft <span style={{ color: 'var(--primary-light)' }}>Summary</span></h3>
                  <p style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Live Ledger</p>
                </div>
              </div>

              {previousDebt > 0 && (
                <div style={{ padding: '1rem', background: 'rgba(251, 146, 60, 0.1)', borderRadius: '16px', border: '1px solid rgba(251, 146, 60, 0.2)', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontSize: '0.6rem', fontWeight: 900, color: '#fb923c', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Previous Outstanding</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 950, color: '#fb923c', margin: 0 }}>₹{previousDebt.toLocaleString()}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94a3b8', lineHeight: 1.4 }}>Unpaid dues from<br/>prior sessions</p>
                        </div>
                    </div>
                </div>
              )}

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
                  <label style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary-light)', display: 'block', marginBottom: '0.5rem' }}>Discount (₹)</label>
                  <input
                    type="number" className="input-premium"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 800, fontSize: '0.9rem', borderRadius: '10px' }}
                    value={formData.discount ?? 0} placeholder="0" onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  />
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary-light)', display: 'block', marginBottom: '0.5rem' }}>Amount Paid Now (₹)</label>
                    <input
                      type="number" className="input-premium"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid var(--primary)', color: 'white', fontWeight: 800, fontSize: '1.1rem', borderRadius: '10px', boxShadow: '0 0 15px rgba(13, 148, 136, 0.2)' }}
                      value={formData.paidAmount} placeholder="0" onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>Method</label>
                      <select 
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, fontSize: '0.75rem', padding: '0.5rem', borderRadius: '8px' }}
                        value={formData.method}
                        onChange={(e) => setFormData({...formData, method: e.target.value})}
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

                  <div>
                    <label style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>Payment Note</label>
                    <input
                      type="text" className="input-premium"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 600, fontSize: '0.7rem', borderRadius: '8px' }}
                      value={formData.paymentNote} placeholder="e.g. Partial / Advance" onChange={(e) => setFormData({ ...formData, paymentNote: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '2px dashed rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '0.6rem', fontWeight: 950, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>Gross Total</p>
                      <p style={{ fontSize: '1.75rem', fontWeight: 950, color: 'white', margin: 0 }}>₹{(formData.amount + Number(formData.discount || 0)).toLocaleString()}</p>
                    </div>
                    {formData.discount > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.6rem', fontWeight: 950, color: '#ef4444', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>Savings Applied</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 950, color: '#ef4444', margin: 0 }}>- ₹{Number(formData.discount).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px', border: '1.5px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary-light)', textTransform: 'uppercase' }}>Net Payable</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 950, color: 'white' }}>₹{formData.amount.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(15, 148, 136, 0.15)', borderRadius: '10px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary-light)' }}>AMOUNT COLLECTED</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 950, color: 'white' }}>₹{formData.paidAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 950, color: (formData.amount - formData.paidAmount) > 0 ? '#fb923c' : '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {(formData.amount - formData.paidAmount) < 0 ? 'Advanced / Credit' : 'Final Balance Due'}
                    </p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 950, color: (formData.amount - formData.paidAmount) > 0 ? '#fb923c' : '#2dd4bf', margin: 0 }}>
                      ₹{Math.abs(formData.amount - formData.paidAmount).toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!formData.patientId || (totalServices === 0 && totalInventory === 0)}
                  onClick={() => { if (validateForm()) setIsPreview(true) }}
                  style={{
                    width: '100%', marginTop: '2rem', padding: '1.1rem', borderRadius: '14px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #0d9488 100%)', color: 'white', fontWeight: 950, fontSize: '1rem',
                    border: 'none', cursor: 'pointer', transition: 'all 0.3s ease',
                    boxShadow: '0 15px 30px -5px rgba(13, 148, 136, 0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                    letterSpacing: '0.02em'
                  }}
                >
                  <ShieldCheck size={20} /> Authorize Clinical Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-slide-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <style jsx global>{`
            @media print {
              #printable-bill {
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                width: 100% !important;
                position: absolute;
                left: 0;
                top: 0;
              }
              .no-print {
                display: none !important;
              }
              .main-wrapper, .content-area, .page-content {
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
              }
            }
          `}</style>
          <div id="printable-bill" style={{ background: 'white', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.15)', borderRadius: '32px', overflow: 'hidden' }}>

            <div style={{ padding: '3rem 4rem', borderBottom: '1.5px dashed #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.55rem', fontWeight: 950, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>Clinic Information</p>
                  <p style={{ fontWeight: 900, fontSize: '1.15rem', color: '#0f172a', marginBottom: '0.25rem' }}>PHYSIO 4</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 650 }}>Edavanna Central • Kerala - 676541</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 650 }}>Phone: 7298448844</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', textAlign: 'right' }}>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>PHYSIO 4</h3>
                    <p style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Clinic Bill Preview</p>
                  </div>
                  <img src="/logo.jpeg" style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover' }} alt="Clinic Logo" />
                </div>
              </div>
            </div>

            <div style={{ padding: '3.5rem 4rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginBottom: '3.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.55rem', fontWeight: 950, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>Bill To</p>
                  <p style={{ fontWeight: 900, fontSize: '1.15rem', color: '#0f172a', marginBottom: '0.25rem' }}></p>


                  <p style={{ fontWeight: 950, fontSize: '1.4rem', color: '#0f172a', marginBottom: '0.3rem', textTransform: 'capitalize' }}>{selectedPatient?.name}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 750 }}>{selectedPatient?.phone}</p><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 650 }}></p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 750 }}>ID: {selectedPatient?.patientId}</p><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 650 }}></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.55rem', fontWeight: 950, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>Invoice Details</p>
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 950, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Invoice # : </span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 950, color: 'var(--primary)', fontFamily: 'monospace' }}>INV-1001</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 950, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Issue Date : </span>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{new Date(formData.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2.5px solid #0f172a' }}>
                    <th style={{ textAlign: 'left', padding: '1rem 0', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>S.NO</th>
                    <th style={{ textAlign: 'left', padding: '1rem 0', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '1rem 0', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', width: '120px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {[...formData.serviceItems.filter(i => i.name).map(i => ({ ...i, quantity: 1 })), ...formData.inventoryItems].map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1.25rem 0', width: '50px', verticalAlign: 'top', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{(idx + 1).toString().padStart(2, '0')}</td>
                      <td style={{ padding: '1.25rem 0' }}>
                        <p style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', margin: 0 }}>{item.name}</p>
                        {item.description && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>Spec: {item.description}</p>}
                       
                        {item.quantity > 1 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Qty: {item.quantity}</span>}
                      </td>
                      <td style={{ padding: '1.25rem 0', textAlign: 'right', fontWeight: 900, color: '#0f172a', verticalAlign: 'top' }}>₹{(item.price * item.quantity).toLocaleString()}</td>
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
                    <span>Discount</span>
                    <span>- ₹{Number(formData.discount || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ borderTop: '2px solid #0f172a', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Net Payable</p>
                    <p style={{ fontWeight: 950, fontSize: '1.75rem', color: 'var(--primary)', margin: 0 }}>₹{formData.amount.toLocaleString()}</p>
                  </div>

                  {formData.paidAmount > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <span>Amount Paid Now</span>
                        <span style={{ color: '#0f172a' }}>₹{formData.paidAmount.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontWeight: 950, fontSize: '0.7rem', textTransform: 'uppercase', color: (formData.amount - formData.paidAmount) > 0 ? '#fb923c' : '#0d9488' }}>
                          {(formData.amount - formData.paidAmount) < 0 ? 'Credit / Advanced' : 'Balance Due'}
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

            <div className="no-print" style={{ background: '#f8fafc', padding: '2.5rem 4rem', display: 'flex', justifyContent: 'flex-end', gap: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setIsPreview(false)}
                style={{ padding: '0.9rem 2.5rem', borderRadius: '10px', background: 'white', border: '1.5px solid var(--border-subtle)', fontWeight: 800, color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Modify Records
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ padding: '0.9rem 2.5rem', borderRadius: '10px', background: '#f1f5f9', border: '1.5px solid #cbd5e1', fontWeight: 800, color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
              >
                <Printer size={18} /> Print Bill
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleAuthorize}
                style={{ padding: '0.9rem 3.5rem', borderRadius: '10px', background: 'var(--bg-sidebar)', color: 'white', fontWeight: 900, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.2)' }}
              >
                {loading ? 'Processing...' : <><Save size={20} />Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
