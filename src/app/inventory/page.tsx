'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import { usePCMSStore } from '@/store/useStore';
import api from '@/services/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Plus, AlertCircle, Package } from 'lucide-react';
import HasPermission from '@/components/HasPermission';
import { usePermission } from '@/hooks/usePermission';

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  purchasePrice: number;
  salePrice: number;
  totalSold: number;
  supplier: string;
  createdBy?: { name: string };
}

export default function InventoryPage() {
  const router = useRouter();
  const { hasPermission, canOperate } = usePermission();
  const { isLoading: storeLoading, setIsSyncing, showToast, showConfirm } = usePCMSStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [topSellers, setTopSellers] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Backend Pagination State
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const categories = ['Products', 'Equipment', 'Consumables', 'Medicines', 'Stationery', 'Others'];

  const fetchInventory = async (isInitial = false) => {
    if (isInitial && !hasLoaded) setLoading(true);
    setIsSyncing(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      });
      if (searchQuery) params.append('search', searchQuery);
      
      Object.entries(activeFilters).forEach(([key, values]) => {
        if (values && values.length > 0) {
            params.append(key, values[0]);
        }
      });

      const [itemsRes, topRes] = await Promise.all([
          api.get(`/inventory?${params.toString()}`),
          api.get('/inventory/top-selling')
      ]);

      if (itemsRes.data && typeof itemsRes.data.total !== 'undefined') {
          setItems(itemsRes.data.data);
          setTotalRecords(itemsRes.data.total);
      } else {
          setItems(itemsRes.data);
          setTotalRecords(itemsRes.data.length);
      }
      setTopSellers(topRes.data);
    } catch (err) {
      console.error('🚫 Registry Error | Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
      setHasLoaded(true);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchInventory(!hasLoaded);
  }, [currentPage, pageSize, searchQuery, activeFilters]);

  const handleDelete = (item: InventoryItem) => {
    if (!canOperate(item)) return showToast('🚫 Access Denied | You can only delete inventory items you personally registered.', 'error');

    showConfirm(
      'Delete Inventory Item',
      `Are you sure you want to permanently delete "${item.name}" from the inventory registry? This action cannot be undone.`,
      async () => {
        setIsSyncing(true);
        try {
          await api.delete(`/inventory/${item._id}`);
          showToast('Item deleted successfully.', 'success');
          fetchInventory();
        } catch (err) {
          showToast('Failed to delete item.', 'error');
        } finally {
          setIsSyncing(false);
        }
      },
      true
    );
  };

  const columns = [
    { header: 'ITEM NAME', key: 'name' as keyof InventoryItem, style: { fontWeight: 700, color: 'var(--primary)' } },
    { header: 'SKU', key: 'sku' as keyof InventoryItem, style: { fontSize: '0.8rem', opacity: 0.6 } },
    { header: 'CATEGORY', key: 'category' as keyof InventoryItem, style: { fontWeight: 600 } },
    { 
      header: 'STOCK LEVEL', 
      key: (i: InventoryItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ 
            fontWeight: 800, 
            color: i.quantity <= i.reorderLevel ? '#ef4444' : 'var(--text-main)' 
          }}>
            {i.quantity} {i.unit}
          </span>
          {i.quantity <= i.reorderLevel && (
            <div title="Low Stock Alert" style={{ color: '#ef4444' }}>
              <AlertCircle size={14} />
            </div>
          )}
        </div>
      ),
      sortKey: 'quantity' as keyof InventoryItem
    },
    { header: 'REORDER AT', key: (i: InventoryItem) => `${i.reorderLevel} ${i.unit}`, style: { fontSize: '0.8rem', opacity: 0.6 } },
    { 
      header: 'SALE PRICE', 
      key: (i: InventoryItem) => (
        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{i.salePrice?.toLocaleString() || '0'}</span>
      ),
      sortKey: 'salePrice' as keyof InventoryItem
    },
    { header: 'P. PRICE', key: (i: InventoryItem) => `₹${i.purchasePrice?.toLocaleString() || '0'}`, style: { fontSize: '0.8rem', opacity: 0.6 } },
    { 
        header: 'PERFORMANCE', 
        key: (i: InventoryItem) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 800 }}>{i.totalSold || 0}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SOLD</span>
            </div>
        ),
        sortKey: 'totalSold' as keyof InventoryItem
    },
    { header: 'SUPPLIER', key: 'supplier' as keyof InventoryItem, style: { fontSize: '0.85rem' } },
    {
      header: 'CREATED BY',
      key: (i: InventoryItem) => (
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
          {i.createdBy?.name?.toUpperCase() || 'SYSTEM'}
        </span>
      )
    }
  ];

  return (
    <div className="inventory-container animate-fade-in" style={{ padding: '2rem 2.5rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>STOCK CONTROL</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Inventory <span className="gradient-text">Registry</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
            Real-time management of clinical supplies, equipment, and consumables.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <HasPermission permission="inventory:create">
            <button
              onClick={() => router.push('/inventory/add')}
              className="glass-interactive"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'var(--primary)',
                color: 'white',
                padding: '0.8rem 1.75rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 10px 20px -5px rgba(15, 118, 110, 0.3)'
              }}
            >
              <Plus size={18} /> Add Item
            </button>
          </HasPermission>
        </div>
      </div>

      <DataTable
        isLoading={loading}
        data={items.map(i => ({ ...i, id: i._id }))}
        columns={columns}
        searchPlaceholder="Search by name, SKU or supplier..."
        onView={(i) => router.push(`/inventory/${i._id}`)}
        onEdit={hasPermission('inventory:edit') ? ((i) => {
          if (canOperate(i)) {
            router.push(`/inventory/${i._id}/edit`);
          } else {
            showToast('🚫 Access Denied | You can only modify items you personally registered.', 'error');
          }
        }) : undefined}
        onDelete={hasPermission('inventory:delete') ? handleDelete : undefined}
        onAddNew={() => router.push('/inventory/add')}
        addNewLabel="Add Item"
        filterableFields={[
          { label: 'Category', key: 'category' as keyof InventoryItem, options: categories }
        ]}
        serverPagination={{
          totalRecords,
          currentPage,
          pageSize,
          onPageChange: setCurrentPage,
          onSearchChange: (s) => { setSearchQuery(s); setCurrentPage(1); },
          onFilterChange: (f) => { setActiveFilters(f); setCurrentPage(1); }
        }}
      />
    </div>
  );

}
