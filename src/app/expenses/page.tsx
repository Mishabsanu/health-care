'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import { usePCMSStore } from '@/store/useStore';
import api from '@/services/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Plus, FileText, Wallet } from 'lucide-react';
import HasPermission from '@/components/HasPermission';
import { usePermission } from '@/hooks/usePermission';

interface Expense {
  _id: string;
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  paymentMethod: string;
  status: 'Paid' | 'Pending';
  supplierName: string;
  invoiceNumber?: string;
  documentUrl?: string;
  createdBy?: { _id: string; name: string };
}

export default function ExpensesPage() {
  const router = useRouter();
  const { hasPermission, canOperate } = usePermission();
  const { isLoading: storeLoading, setIsSyncing, showToast, showConfirm } = usePCMSStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Backend Pagination State
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const categories = ['Rent', 'Salaries', 'Supplies', 'Utilities', 'Maintenance', 'Marketing', 'Others'];

  const fetchExpenses = async (isInitial = false) => {
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

      const res = await api.get(`/expenses?${params.toString()}`);
      
      if (res.data && typeof res.data.total !== 'undefined') {
          setExpenses(Array.isArray(res.data) ? res.data : (res.data?.data || []));
          setTotalRecords(res.data.total);
          setTotalAmount(res.data.totalAmount || 0);
      } else {
          setExpenses(Array.isArray(res.data) ? res.data : (res.data?.data || []));
          setTotalRecords(res.data.length);
          setTotalAmount(res.data.reduce((sum: number, e: Expense) => sum + e.amount, 0));
      }
    } catch (err) {
      console.error('🚫 Registry Error | Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
      setHasLoaded(true);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchExpenses(!hasLoaded);
  }, [currentPage, pageSize, searchQuery, activeFilters]);

  const handleDelete = (expense: Expense) => {
    showConfirm(
      'Delete Expense Record',
      `Are you sure you want to permanently clear this expense record? This action cannot be undone.`,
      async () => {
        setIsSyncing(true);
        try {
          await api.delete(`/expenses/${expense._id}`);
          showToast('Expense deleted successfully.', 'success');
          fetchExpenses();
        } catch (err) {
          showToast('Failed to delete expense.', 'error');
        } finally {
          setIsSyncing(false);
        }
      },
      true
    );
  };

  const columnsData = useMemo(() => [
    { header: 'EXPENSE #', key: 'id' as keyof Expense, style: { fontWeight: 700, color: 'var(--primary)' } },
    { header: 'DATE', key: (e: Expense) => new Date(e.date).toLocaleDateString(), sortKey: 'date' as keyof Expense },
    { header: 'SUPPLIER', key: 'supplierName' as keyof Expense, style: { fontWeight: 600 } },
    { header: 'CATEGORY', key: 'category' as keyof Expense, style: { fontWeight: 500, fontSize: '0.85rem' } },
    { 
      header: 'AMOUNT', 
      key: (e: Expense) => (
        <span style={{ fontWeight: 800, color: '#ef4444' }}>₹{e.amount.toLocaleString()}</span>
      ),
      sortKey: 'amount' as keyof Expense
    },
    { 
      header: 'METHOD', 
      key: 'paymentMethod' as keyof Expense,
      style: { fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }
    },
    { 
      header: 'STATUS', 
      key: (e: Expense) => (
        <span style={{ 
          background: e.status === 'Paid' ? '#dcfce7' : '#fee2e2',
          color: e.status === 'Paid' ? '#166534' : '#991b1b',
          padding: '0.35rem 0.85rem', 
          borderRadius: '1rem', 
          fontSize: '0.75rem', 
          fontWeight: 700 
        }}>
          {e.status.toUpperCase()}
        </span>
      ) 
    },
    {
      header: 'CREATED BY',
      key: (e: Expense) => (
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
          {e.createdBy?.name?.toUpperCase() || 'SYSTEM'}
        </span>
      )
    },
  ], []);

  const paginationConfig = useMemo(() => ({
    totalRecords,
    currentPage,
    pageSize,
    onPageChange: setCurrentPage,
    onPageSizeChange: setPageSize,
    onSearchChange: (s: string) => { setSearchQuery(s); setCurrentPage(1); },
    onFilterChange: (f: any) => { setActiveFilters(f); setCurrentPage(1); }
  }), [totalRecords, currentPage, pageSize]);

  return (
    <div className="expenses-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem', paddingTop: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>FINANCIAL AUDIT</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Expense <span className="gradient-text">Ledger</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
            Audit-ready tracking of clinical overheads and operational costs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right', background: 'white', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-subtle)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Total Filtered Expense</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 950, color: '#ef4444', margin: 0 }}>₹{totalAmount.toLocaleString()}</p>
          </div>
          <HasPermission permission="expenses:create">
            <button
              onClick={() => router.push('/expenses/add')}
              className="glass-interactive"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'var(--primary)',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 10px 20px -5px rgba(15, 118, 110, 0.3)'
              }}
            >
              <Plus size={18} /> Log Expense
            </button>
          </HasPermission>
        </div>
      </div>

      <DataTable
        isLoading={loading}
        data={expenses}
        columns={columnsData}
        searchPlaceholder="Search by description or ID..."
        onView={(e) => router.push(`/expenses/${e._id}`)}
        onEdit={hasPermission('expenses:edit') ? ((e) => {
          if (canOperate(e)) {
            router.push(`/expenses/${e._id}/edit`);
          } else {
            showToast('🚫 Access Denied | You can only modify your own expense records.', 'error');
          }
        }) : undefined}
        onDelete={hasPermission('expenses:void') ? ((e) => {
          if (canOperate(e)) {
            handleDelete(e);
          } else {
            showToast('🚫 Access Denied | You can only delete your own expense records.', 'error');
          }
        }) : undefined}
        onAddNew={() => router.push('/expenses/add')}
        addNewLabel="Log Expense"
        filterableFields={[
          { label: 'Category', key: 'category' as keyof Expense, options: categories },
          { label: 'Status', key: 'status' as keyof Expense, options: ['Paid', 'Pending'] }
        ]}
        serverPagination={paginationConfig}
      />
    </div>
  );
}
