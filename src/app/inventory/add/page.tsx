'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import { Package, Tag, Hash, BarChart3, CheckCircle2, ChevronLeft, Info, Truck } from 'lucide-react';

const validationSchema = Yup.object().shape({
  name: Yup.string().trim().required('Item name is required'),
  sku: Yup.string(),
  category: Yup.string().required('Category is required'),
  quantity: Yup.number()
    .typeError('Must be a number')
    .required('Initial quantity is required')
    .min(0, 'Quantity cannot be negative')
    .integer('Must be a whole number'),
  unit: Yup.string().trim().required('Unit is required'),
  reorderLevel: Yup.number()
    .typeError('Must be a number')
    .required('Reorder level is required')
    .min(0, 'Cannot be negative'),
  purchasePrice: Yup.number()
    .typeError('Must be a number')
    .min(0, 'Cannot be negative'),
  salePrice: Yup.number()
    .typeError('Must be a number')
    .min(0, 'Cannot be negative'),
  supplier: Yup.string(),
});

const categories = ['Products','Equipment', 'Consumables', 'Medicines', 'Stationery', 'Others'];

export default function AddInventoryPage() {
  const router = useRouter();
  const { setIsSyncing, showToast } = usePCMSStore();
  const [uniqueSuppliers, setUniqueSuppliers] = React.useState<string[]>([]);

  React.useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await api.get('/inventory/suppliers/unique');
        setUniqueSuppliers(res.data || []);
      } catch (err) {
        console.error('Failed to fetch suppliers:', err);
      }
    };
    fetchSuppliers();
  }, []);

  const formik = useFormik({
    initialValues: {
      name: '',
      sku: '',
      category: 'Consumables',
      quantity: '',
      unit: 'pcs',
      reorderLevel: '',
      purchasePrice: '',
      salePrice: '',
      supplier: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSyncing(true);
      try {
        const payload = {
          ...values,
          quantity: Number(values.quantity) || 0,
          reorderLevel: Number(values.reorderLevel) || 0,
          purchasePrice: Number(values.purchasePrice) || 0,
          salePrice: Number(values.salePrice) || 0,
        };
        await api.post('/inventory', payload);
        showToast('Item registered successfully.', 'success');
        router.push('/inventory');
      } catch (err: any) {
        console.error('🚫 Operational Error | Failed to register inventory item:', err);
        showToast(err.response?.data?.message || 'Failed to register inventory item.', 'error');
      } finally {
        setIsSyncing(false);
      }
    },
  });

  const isErr = (field: keyof typeof formik.values) =>
    formik.touched[field] && formik.errors[field];

  const ErrMsg = ({ name }: { name: keyof typeof formik.values }) =>
    formik.touched[name] && formik.errors[name] ? (
      <div style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, marginTop: '0.35rem' }}>
        ⚠️ {formik.errors[name] as string}
      </div>
    ) : null;

  return (
    <div className="add-inventory-container animate-fade-in clinical-form-wide" style={{ padding: '2rem 2.5rem', paddingBottom: '7rem' }}>
      <div style={{ marginBottom: '3.5rem' }}>
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
          Initialize <span className="gradient-text">Stock Item</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
          Onboard new clinical supplies or medical equipment into the centralized inventory.
        </p>
      </div>

      <div className="clinical-form-card" style={{ opacity: formik.isSubmitting ? 0.7 : 1 }}>
        <div className="clinical-form-grid">
          <div className="col-12" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(90deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)' }}>
            <Package size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Stock <span className="gradient-text">Parameters</span></h3>
          </div>
        </div>

        <form onSubmit={formik.handleSubmit}>
          {/* Item Name */}
          <div style={{ marginBottom: '2rem' }}>
            <label className="label-premium">Item Name <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Package size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
              <input
                name="name"
                autoComplete="off"
                type="text"
                className={`input-premium ${isErr('name') ? 'input-error' : ''}`}
                style={{ paddingLeft: '3.5rem', borderColor: isErr('name') ? '#ef4444' : '' }}
                placeholder="e.g., Nitrile Examination Gloves - Medium"
                value={formik.values.name || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
            <ErrMsg name="name" />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Info size={12} /> Specific naming helps in clinical audits.</p>
          </div>

          {/* SKU, Category & Supplier */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <label className="label-premium">SKU / Catalog ID <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>(Optional)</span></label>
              <div style={{ position: 'relative' }}>
                <Hash size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                <input
                  name="sku"
                  autoComplete="off"
                  type="text"
                  className="input-premium"
                  style={{ paddingLeft: '3.5rem' }}
                  placeholder="REF-GLOV-001"
                  value={formik.values.sku || ''}
                  onChange={formik.handleChange}
                />
              </div>
            </div>
            <div>
              <label className="label-premium">Category <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Tag size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                <select
                  name="category"
                  className="input-premium"
                  style={{ paddingLeft: '3.5rem' }}
                  value={formik.values.category || ''}
                  onChange={formik.handleChange}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label-premium">Preferred Supplier</label>
              <div style={{ position: 'relative' }}>
                <Truck size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
                <input
                  name="supplier"
                  autoComplete="off"
                  list="suppliers-list"
                  type="text"
                  className="input-premium"
                  style={{ paddingLeft: '3.5rem' }}
                  placeholder="MedSource Health..."
                  value={formik.values.supplier || ''}
                  onChange={formik.handleChange}
                />
                <datalist id="suppliers-list">
                  {uniqueSuppliers.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
            </div>
          </div>

          {/* Quantity, Unit, Reorder */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label className="label-premium">Initial Quantity <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                name="quantity"
                autoComplete="off"
                type="number"
                className={`input-premium ${isErr('quantity') ? 'input-error' : ''}`}
                style={{ fontWeight: 800, textAlign: 'center', borderColor: isErr('quantity') ? '#ef4444' : '' }}
                placeholder="0"
                value={formik.values.quantity ?? ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                min="0"
              />
              <ErrMsg name="quantity" />
            </div>
            <div>
              <label className="label-premium">Unit <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                name="unit"
                autoComplete="off"
                type="text"
                className={`input-premium ${isErr('unit') ? 'input-error' : ''}`}
                placeholder="e.g., Boxes, pcs"
                value={formik.values.unit || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              <ErrMsg name="unit" />
            </div>
            <div>
              <label className="label-premium" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Reorder At <span style={{ color: '#ef4444' }}>*</span> <Info size={14} style={{ color: 'var(--primary)', cursor: 'help' }} />
              </label>
              <input
                name="reorderLevel"
                autoComplete="off"
                type="number"
                className={`input-premium ${isErr('reorderLevel') ? 'input-error' : ''}`}
                placeholder="5"
                value={formik.values.reorderLevel ?? ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                min="0"
              />
              <ErrMsg name="reorderLevel" />
            </div>
          </div>

          {/* Prices */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
            <div>
              <label className="label-premium">Purchase Price (₹) <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>(Optional)</span></label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--primary)', opacity: 0.5 }}>₹</span>
                <input
                  name="purchasePrice"
                  type="number"
                  className="input-premium"
                  style={{ paddingLeft: '3.5rem', fontWeight: 800 }}
                  placeholder="0.00"
                  value={formik.values.purchasePrice ?? ''}
                  onChange={formik.handleChange}
                  min="0"
                />
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Net cost per unit.</p>
            </div>
            <div>
              <label className="label-premium">Sale Price (₹) <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>(Optional)</span></label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#10b981', opacity: 0.5 }}>₹</span>
                <input
                  name="salePrice"
                  type="number"
                  className="input-premium"
                  style={{ paddingLeft: '3.5rem', fontWeight: 800, color: '#10b981' }}
                  placeholder="0.00"
                  value={formik.values.salePrice ?? ''}
                  onChange={formik.handleChange}
                  min="0"
                />
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Billing price for patients.</p>
            </div>
          </div>


          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '4rem' }}>
            <button type="button" onClick={() => router.back()} style={{ flex: 1, padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-subtle)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '1rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={formik.isSubmitting} style={{ flex: 2, padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.4)' }}>
              {formik.isSubmitting ? 'Processing...' : <><CheckCircle2 size={20} /> Register Item</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
