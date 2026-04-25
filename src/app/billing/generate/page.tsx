'use client'
import ClinicalSearchSelect from '@/components/ClinicalSearchSelect';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { Calendar, ChevronRight, MessageSquare, Package, Plus, Printer, Receipt, Save, Search, ShieldCheck, Stethoscope, Trash2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function GenerateInvoicePage() {
  const router = useRouter();
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [eligibleAppointments, setEligibleAppointments] = useState<any[]>([]);
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
      const getPatients = api.get('/patients/dropdown?billingEligible=true').then(res => setPatients(Array.isArray(res.data) ? res.data : (res.data?.data || []))).catch(e => console.error('Pt Error', e));
      const getEligibleAppointments = api.get('/appointments?status=Completed&isBilled=false&limit=500').then(res => setEligibleAppointments(Array.isArray(res.data) ? res.data : (res.data?.data || []))).catch(e => console.error('Appt Error', e));
      const getServices = api.get('/services/dropdown').then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        // Remove 'Products' from services as they belong to Inventory
        setServices(data.filter((s: any) => s.category !== 'Products'));
      }).catch(e => console.error('Svc Error', e));
      const getInventory = api.get('/inventory/dropdown').then(res => setInventory(Array.isArray(res.data) ? res.data : (res.data?.data || []))).catch(e => console.error('Inv Error', e));

      await Promise.all([getPatients, getEligibleAppointments, getServices, getInventory]);
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
          } else {
            setFormData(prev => ({ ...prev, appointmentId: '' }));
            showToast('Bill can be generated only after appointment session is completed.', 'error');
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
    if (!formData.appointmentId) {
      showToast('Bill can be generated only after appointment session is completed.', 'error');
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

  // 📡 Emit Changes to Parent
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.input-premium') && !target.closest('.glass-premium')) {
        setActiveSearchRow(null);
      }
    };
    if (activeSearchRow !== null) {
      window.addEventListener('mousedown', handleGlobalClick);
    }
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, [activeSearchRow]);

  const selectedPatient = patients.find(p => p._id === formData.patientId);
  const totalServices = formData.serviceItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const totalInventory = formData.inventoryItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0)), 0);

  if (loading && !isPreview) return <LoadingSpinner />;

  return (
    <div className="generate-invoice-container animate-fade-in clinical-form-wide" style={{ padding: '2rem 2.5rem', paddingBottom: '7rem' }}>
      <div style={{ marginBottom: '3.5rem' }}>
        <button
          onClick={() => router.back()}
          className="glass-interactive"
          style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
        >
          <Receipt size={16} /> Revenue Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>REVENUE & BILLING</span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
          Generate <span className="gradient-text">Clinical Invoice</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
          Initialize a new financial transaction for clinical services and procurement.
        </p>
      </div>

      {!isPreview ? (
        <div className="animate-slide-up" style={{ background: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', marginBottom: '4rem' }}>

          {/* 1. 🏥 Patient & Record Selection */}
          <div style={{ padding: '3.5rem', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(15, 118, 110, 0.08)', color: 'var(--primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#0f172a' }}>Patient Selection</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: '0.2rem' }}>Assign clinical profile to this revenue record</p>
              </div>
            </div>

            <div style={{ maxWidth: '700px' }}>
              <ClinicalSearchSelect
                options={patients}
                value={formData.patientId}
                placeholder="Search patient by name, phone or ID..."
                searchFields={['name', 'phone', 'patientId']}
                onSelect={(p) => {
                  const appointment = eligibleAppointments.find(a => a.patientId?._id === p._id || a.patientId === p._id);
                  setFormData({ ...formData, patientId: p._id, appointmentId: appointment?._id || '' });
                }}
                onClear={() => setFormData({ ...formData, patientId: '', appointmentId: '' })}
                renderOption={(p) => (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0.2rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-sidebar)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{p.name?.[0]}</div>
                      <div>
                        <p style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{p.name}</p>
                        <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{p.phone} • #{p.patientId}</p>
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>

            {selectedPatient && (
              <div className="animate-fade-in" style={{
                marginTop: '1.5rem', padding: '1.5rem 2rem', borderRadius: '16px',
                background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'white', color: 'var(--primary)', border: '3px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900 }}>
                    {selectedPatient.name[0]}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>{selectedPatient.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0', fontWeight: 700 }}>Profile ID: <span style={{ color: 'var(--primary)', fontWeight: 900 }}>#{selectedPatient.patientId}</span></p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem', letterSpacing: '0.05em' }}>Contact</p>
                  <p style={{ fontWeight: 900, fontSize: '1rem', color: '#0f172a', margin: 0 }}>{selectedPatient.phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* 2. 🧾 Clinical Ledger Items */}
          <div style={{ padding: '3.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
              <div style={{ width: '48px', height: '48px', background: 'white', color: '#0f172a', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#0f172a' }}>Clinical Ledger</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: '0.2rem' }}>Log clinical procedures and required medical inventory</p>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              {/* 💉 CLINICAL PROCEDURES SECTION */}
              <div style={{ padding: '1.25rem 2rem', background: '#f0fdfa', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ccfbf1', borderRadius: '16px 16px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <Stethoscope size={18} />
                  <p style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.05em', margin: 0, textTransform: 'uppercase' }}>Clinical Procedures & Services</p>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(13, 148, 136, 0.15)', padding: '4px 10px', borderRadius: '6px' }}>{formData.serviceItems.length} SERVICES</span>
              </div>

              <div style={{ paddingBottom: '30px', position: 'relative', zIndex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ textAlign: 'left', padding: '1rem 2rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Procedure / Service Name</th>
                          <th style={{ textAlign: 'left', padding: '1rem 2rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Clinical Details</th>
                          <th style={{ textAlign: 'right', padding: '1rem 2rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', width: '200px' }}>Fee (₹)</th>
                          <th style={{ width: '60px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.serviceItems.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 1rem', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ position: 'relative' }}>
                                <input required type="text" className="input-premium" placeholder="Select procedure..."
                                  style={{ fontSize: '0.9rem', background: '#f8fafc', borderColor: '#e2e8f0', fontWeight: 600 }}
                                  value={item.name || ''} onFocus={() => { setActiveSearchRow(999 + idx); setItemSearch(''); }}
                                  onChange={(e) => {
                                    const newItems = [...formData.serviceItems]; newItems[idx].name = e.target.value;
                                    setFormData({ ...formData, serviceItems: newItems }); setItemSearch(e.target.value);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') setActiveSearchRow(null);
                                  }}
                                />
                                {activeSearchRow === (999 + idx) && (
                                  <div style={{
                                    position: 'absolute', top: 'calc(100% + 5px)', left: '0', minWidth: '450px', zIndex: 10000,
                                    borderRadius: '12px', maxHeight: '280px', overflowY: 'auto',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0',
                                    background: 'white', padding: '0.5rem'
                                  }}>
                                    <div style={{ padding: '0.4rem 0.75rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <Search size={12} style={{ color: '#0d9488' }} />
                                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Service Catalog</span>
                                    </div>
                                    {services.filter(s => !itemSearch || s.name.toLowerCase().includes(itemSearch.toLowerCase())).map(s => (
                                      <div key={s._id} onMouseDown={() => {
                                        const newItems = [...formData.serviceItems]; newItems[idx] = { name: s.name, price: s.price, serviceId: s._id, description: '' };
                                        setFormData({ ...formData, serviceItems: newItems }); setActiveSearchRow(null);
                                      }} style={{
                                        padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        marginBottom: '2px', transition: 'all 0.2s ease'
                                      }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdfa'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                      >
                                        <div>
                                          <p style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0, color: '#1e293b' }}>{s.name}</p>
                                          <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0 }}>{s.category || 'General'}</p>
                                        </div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0d9488' }}>₹{s.price?.toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <input type="text" className="input-premium" placeholder="Notes..." style={{ fontSize: '0.9rem', background: '#f8fafc', borderColor: '#e2e8f0' }} value={item.description || ''} onChange={(e) => {
                                const newItems = [...formData.serviceItems]; newItems[idx].description = e.target.value; setFormData({ ...formData, serviceItems: newItems });
                              }} />
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#0d9488', fontSize: '0.8rem' }}>₹</span>
                                <input required type="number" className="input-premium" style={{ textAlign: 'right', fontWeight: 800, background: '#f0fdfa', borderColor: '#ccfbf1', color: '#0d9488', paddingLeft: '1.5rem' }} min="0" onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} value={item.price ?? 0} onChange={(e) => {
                                  const newItems = [...formData.serviceItems]; newItems[idx].price = e.target.value; setFormData({ ...formData, serviceItems: newItems });
                                }} />
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                              {formData.serviceItems.length > 1 && (
                                <button type="button" onClick={() => setFormData({ ...formData, serviceItems: formData.serviceItems.filter((_, i) => i !== idx) })} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: '1.25rem 2rem' }}>
                      <button type="button" onClick={() => setFormData({ ...formData, serviceItems: [...formData.serviceItems, { name: '', price: 0, serviceId: '', description: '' }] })} style={{ color: '#0d9488', fontWeight: 800, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdfa', padding: '0.6rem 1.25rem', borderRadius: '10px', border: '1px dashed #5eead4', cursor: 'pointer', textTransform: 'uppercase' }}>
                        <Plus size={14} /> Add Service
                      </button>
                    </div>
                  </div>

                  {/* 💊 MEDICAL INVENTORY ADD-ONS SECTION */}
                  <div style={{ padding: '1.25rem 2rem', background: '#fdf2f8', color: '#be185d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #fce7f3', borderBottom: '1px solid #fce7f3' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <Package size={18} />
                      <p style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.05em', margin: 0, textTransform: 'uppercase' }}>Medical Inventory Add-ons</p>
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(190, 24, 93, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>{formData.inventoryItems.length} ITEMS</span>
                  </div>

              {formData.inventoryItems.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#fdf2f8', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                  <button type="button" onClick={() => setFormData({ ...formData, inventoryItems: [{ name: '', quantity: 1, price: 0, inventoryId: '', stock: 0, description: '' }] })} style={{ color: '#be185d', fontWeight: 800, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.8rem 1.5rem', borderRadius: '10px', border: '1.5px dashed #fbcfe8', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 4px 6px -1px rgba(190, 24, 93, 0.1)' }}>
                    <Plus size={16} /> Add Medical Inventory
                  </button>
                </div>
              ) : (
                <div style={{ paddingBottom: '30px', position: 'relative', zIndex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ textAlign: 'left', padding: '1rem 2rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Inventory Item</th>
                          <th style={{ textAlign: 'left', padding: '1rem 2rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Batch / Detail</th>
                          <th style={{ textAlign: 'center', padding: '1rem 2rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', width: '120px' }}>Qty</th>
                          <th style={{ textAlign: 'right', padding: '1rem 2rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', width: '180px' }}>Sub-Total (₹)</th>
                          <th style={{ width: '60px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.inventoryItems.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 1rem', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ position: 'relative' }}>
                                <input required type="text" className="input-premium" placeholder="Search item..."
                                  style={{ fontSize: '0.9rem', background: '#f8fafc', borderColor: '#e2e8f0', fontWeight: 600 }}
                                  value={item.name || ''} onFocus={() => { setActiveSearchRow(800 + idx); setItemSearch(''); }}
                                  onChange={(e) => {
                                    const newItems = [...formData.inventoryItems]; newItems[idx].name = e.target.value;
                                    setFormData({ ...formData, inventoryItems: newItems }); setItemSearch(e.target.value);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') setActiveSearchRow(null);
                                  }}
                                />
                                {activeSearchRow === (800 + idx) && (
                                  <div style={{
                                    position: 'absolute', top: 'calc(100% + 5px)', left: '0', minWidth: '450px', zIndex: 10000,
                                    borderRadius: '12px', maxHeight: '280px', overflowY: 'auto',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid #fce7f3',
                                    background: 'white', padding: '0.5rem'
                                  }}>
                                    <div style={{ padding: '0.4rem 0.75rem', borderBottom: '1px solid #fce7f3', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <Package size={12} style={{ color: '#be185d' }} />
                                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Inventory Catalog</span>
                                    </div>
                                    {inventory.filter(i => !itemSearch || i.name.toLowerCase().includes(itemSearch.toLowerCase())).map(i => (
                                      <div key={i._id} onMouseDown={() => {
                                        if (i.quantity <= 0) return;
                                        const existingIdx = formData.inventoryItems.findIndex((it, index) => it.inventoryId === i._id && index !== idx);
                                        if (existingIdx !== -1) {
                                          const newItems = [...formData.inventoryItems];
                                          newItems[existingIdx].quantity += 1;
                                          const finalItems = newItems.filter((_, index) => index !== idx);
                                          setFormData({ ...formData, inventoryItems: finalItems });
                                        } else {
                                          const newItems = [...formData.inventoryItems];
                                          newItems[idx] = { name: i.name, quantity: 1, price: i.salePrice || i.pricePerUnit || 0, inventoryId: i._id, stock: i.quantity };
                                          setFormData({ ...formData, inventoryItems: newItems });
                                        }
                                        setActiveSearchRow(null);
                                      }} style={{
                                        padding: '0.75rem 1rem', borderRadius: '8px',
                                        cursor: i.quantity > 0 ? 'pointer' : 'not-allowed',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        marginBottom: '2px', transition: 'all 0.2s ease',
                                        opacity: i.quantity > 0 ? 1 : 0.6
                                      }}
                                        onMouseEnter={(e) => { if (i.quantity > 0) e.currentTarget.style.background = '#fdf2f8'; }}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                      >
                                        <div>
                                          <p style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0, color: '#1e293b' }}>{i.name}</p>
                                          <p style={{ fontSize: '0.65rem', color: i.quantity <= 5 ? '#ef4444' : '#94a3b8', fontWeight: 700 }}>Stock: {i.quantity}</p>
                                        </div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#be185d' }}>₹{(i.salePrice || i.pricePerUnit || 0).toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <input type="text" className="input-premium" placeholder="Detail..." style={{ fontSize: '0.9rem', background: '#f8fafc', borderColor: '#e2e8f0' }} value={item.description || ''} onChange={(e) => {
                                const newItems = [...formData.inventoryItems]; newItems[idx].description = e.target.value; setFormData({ ...formData, inventoryItems: newItems });
                              }} />
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <input required type="number" className="input-premium" style={{ textAlign: 'center', fontWeight: 800, background: '#f8fafc', borderColor: '#e2e8f0' }} min="1" value={item.quantity ?? 1} onChange={(e) => {
                                const newItems = [...formData.inventoryItems]; newItems[idx].quantity = Number(e.target.value); setFormData({ ...formData, inventoryItems: newItems });
                              }} />
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#be185d', fontSize: '0.8rem' }}>₹</span>
                                <input required type="number" className="input-premium" style={{ textAlign: 'right', fontWeight: 800, background: '#fdf2f8', borderColor: '#fce7f3', color: '#be185d', paddingLeft: '1.5rem' }} min="0" value={item.price ?? 0} onChange={(e) => {
                                  const newItems = [...formData.inventoryItems]; newItems[idx].price = Number(e.target.value); setFormData({ ...formData, inventoryItems: newItems });
                                }} />
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                              <button type="button" onClick={() => setFormData({ ...formData, inventoryItems: formData.inventoryItems.filter((_, i) => i !== idx) })} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: '1.25rem 2rem' }}>
                      <button type="button" onClick={() => setFormData({ ...formData, inventoryItems: [...formData.inventoryItems, { name: '', quantity: 1, price: 0, inventoryId: '', stock: 0, description: '' }] })} style={{ color: '#be185d', fontWeight: 800, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fdf2f8', padding: '0.6rem 1.25rem', borderRadius: '10px', border: '1px dashed #fbcfe8', cursor: 'pointer', textTransform: 'uppercase' }}>
                        <Plus size={14} /> Add Medical Add-on
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>


            {/* 3. 💳 Payment Details & Generation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(380px, 420px)' }}>
              {/* Left Inputs block */}
              <div style={{ padding: '3.5rem', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                  <Receipt size={20} style={{ color: '#0f172a' }} />
                  <h4 style={{ fontWeight: 900, fontSize: '1.15rem', color: '#0f172a', margin: 0 }}>Settlement Terms</h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Method of Tx</label>
                    <select className="input-premium" style={{ background: '#f8fafc', borderColor: '#e2e8f0', fontWeight: 800 }} value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value })}>
                      <option value="UPI">UPI Payment</option>
                      <option value="Cash">Cash Transaction</option>
                      <option value="Card">Bank Card</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Current Status</label>
                    <select className="input-premium" style={{ background: '#f8fafc', borderColor: '#e2e8f0', fontWeight: 800, color: formData.status === 'Paid' ? '#059669' : (formData.status === 'Unpaid' ? '#e11d48' : '#ea580c') }} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                      <option value="Unpaid">Unpaid / Due</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Paid">Fully Paid (Settled)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Prescription Description / Remarks</label>
                  <textarea
                    className="input-premium"
                    placeholder="Enter clinical notes or specialized instructions to attach to this invoice body..."
                    style={{ width: '100%', minHeight: '100px', resize: 'vertical', background: '#f8fafc', borderColor: '#e2e8f0', lineHeight: 1.6 }}
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Short Payment Note</label>
                  <input
                    type="text" className="input-premium" placeholder="e.g. Partial advance received by Bank Transfer"
                    style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
                    value={formData.paymentNote} onChange={(e) => setFormData({ ...formData, paymentNote: e.target.value })}
                  />
                </div>
              </div>

              {/* Right Summary Block */}
              <div style={{ background: '#f8fafc', padding: '3.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 950, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>Dynamic Ledger Summary</p>

                {previousDebt > 0 && (
                  <div style={{ borderLeft: '4px solid #f97316', padding: '1rem', background: 'white', borderRadius: '8px', borderRight: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 900, color: '#f97316', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Previous Unpaid Balance</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 950, color: '#c2410c', margin: 0 }}>₹{previousDebt.toLocaleString()}</p>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>
                  <span>Gross Session Total</span>
                  <span style={{ color: '#0f172a', fontWeight: 900 }}>₹{(formData.amount + Number(formData.discount || 0)).toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b' }}>Custom Discount</label>
                  <div style={{ position: 'relative', width: '120px' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: '#ef4444' }}>-₹</span>
                    <input type="number" className="input-premium" style={{ background: 'white', borderColor: '#e2e8f0', color: '#ef4444', fontWeight: 900, textAlign: 'right', paddingLeft: '2.5rem' }} min="0" onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} value={formData.discount ?? 0} placeholder="0" onChange={(e) => setFormData({ ...formData, discount: e.target.value })} />
                  </div>
                </div>

                <div style={{ borderTop: '2px dashed #cbd5e1', margin: '0 0 2rem 0' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Payable</span>
                  <span style={{ fontSize: '2rem', fontWeight: 950, color: 'var(--primary)', letterSpacing: '-0.02em' }}>₹{formData.amount.toLocaleString()}</span>
                </div>

                <div style={{ padding: '1.5rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Amount Collected Now</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>₹</span>
                    <input type="number" className="input-premium" style={{ fontSize: '1.5rem', fontWeight: 950, height: '64px', paddingLeft: '2.5rem', color: '#0f172a', border: '2px solid #0f172a', background: '#f8fafc' }} min="0" onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} value={formData.paidAmount} placeholder="0" onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: (formData.amount - formData.paidAmount) > 0 ? '#ea580c' : '#059669', textTransform: 'uppercase' }}>
                      {(formData.amount - formData.paidAmount) <= 0 ? 'Balance Clear' : 'Session Dues'}
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 950, color: (formData.amount - formData.paidAmount) > 0 ? '#ea580c' : '#059669' }}>
                      ₹{Math.max(0, formData.amount - formData.paidAmount).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!formData.patientId || !formData.appointmentId || (totalServices === 0 && totalInventory === 0)}
                  onClick={() => { if (validateForm()) setIsPreview(true) }}
                  style={{
                    width: '100%', marginTop: '3rem', padding: '1.25rem', borderRadius: '14px',
                    background: '#0f172a', color: 'white', fontWeight: 900, fontSize: '1rem',
                    border: 'none', cursor: 'pointer', transition: 'all 0.3s ease',
                    boxShadow: '0 15px 35px -5px rgba(15, 23, 42, 0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                    letterSpacing: '0.05em', textTransform: 'uppercase'
                  }}
                >
                  <ShieldCheck size={20} /> Preview Clinical Bill
                </button>
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
