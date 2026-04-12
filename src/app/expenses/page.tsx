'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import { usePCMSStore } from '@/store/useStore';
import api from '@/services/api';
import { Plus } from 'lucide-react';
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
  createdBy?: { _id: string; name: string };
}

export default function ExpensesPage() {
  const router = useRouter();
  const { hasPermission, canOperate } = usePermission();
  const { isLoading: storeLoading, setIsSyncing, showToast, showConfirm } = usePCMSStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Backend Pagination State
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const categories = ['Rent', 'Salaries', 'Supplies', 'Utilities', 'Maintenance', 'Marketing', 'Others'];

  const fetchExpenses = async () => {
    setLoading(true);
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
      } else {
          setExpenses(Array.isArray(res.data) ? res.data : (res.data?.data || []));
          setTotalRecords(res.data.length);
      }
    } catch (err) {
      console.error('🚫 Registry Error | Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
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

  const columns = [
    { header: 'EXPENSE #', key: 'id' as keyof Expense, style: { fontWeight: 700, color: 'var(--primary)' } },
    { header: 'DATE', key: (e: Expense) => new Date(e.date).toLocaleDateString(), sortKey: 'date' as keyof Expense },
    { header: 'CATEGORY', key: 'category' as keyof Expense, style: { fontWeight: 600 } },
    { header: 'DESCRIPTION', key: 'description' as keyof Expense },
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
    }
  ];

  return (
    <div className="expenses-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Expense <span className="gradient-text">Management</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Track clinical overheads, salaries, and operational expenditures.</p>
        </div>
        <HasPermission permission="expenses:create">
            <button 
                onClick={() => router.push('/expenses/add')}
                style={{ background: 'var(--primary)', color: 'white', padding: '0.8rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <Plus size={18} /> Record Expense
            </button>
        </HasPermission>
      </div>

        <DataTable 
          data={expenses.map(e => ({ ...e, id: e._id }))}
          columns={columns}
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
          filterableFields={[
            { label: 'Category', key: 'category' as keyof Expense, options: categories },
            { label: 'Status', key: 'status' as keyof Expense, options: ['Paid', 'Pending'] }
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
