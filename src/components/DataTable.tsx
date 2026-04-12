'use client'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  FileText,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    key: keyof T | ((item: T) => React.ReactNode);
    sortKey?: keyof T;
    style?: React.CSSProperties;
    searchable?: boolean;
  }[];
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  searchPlaceholder?: string;
  defaultPageSize?: number;
  filterableFields?: {
    label: string;
    key: keyof T;
    options: string[];
  }[];
  customActions?: (item: T) => React.ReactNode;
  
  // Backend Pagination Support
  serverPagination?: {
    totalRecords: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onSearchChange: (search: string) => void;
    onFilterChange: (filters: Record<string, string[]>) => void;
  };
}

export default function DataTable<T extends { id: string }>({ 
  data, 
  columns, 
  onView, 
  onEdit, 
  onDelete, 
  customActions,
  searchPlaceholder = "Search clinical records...",
  defaultPageSize = 10,
  filterableFields = [],
  serverPagination
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(serverPagination?.currentPage || 1);
  const [pageSize, setPageSize] = useState(serverPagination?.pageSize || defaultPageSize);
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Advanced State Management | Multi-select Ready
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [pendingFilters, setPendingFilters] = useState<Record<string, string[]>>({});

  // Specialized Field Resolution (Handles dot.notation)
  const resolveValue = (item: any, path: string | Function | any): any => {
    if (typeof path === 'function') return path(item);
    if (!path || typeof path !== 'string') return item[path as any];
    return path.split('.').reduce((acc, part) => acc && acc[part], item);
  };

  // Sync pending filters when panel opens
  useEffect(() => {
    if (isFilterOpen) {
      setPendingFilters(activeFilters);
    }
  }, [isFilterOpen, activeFilters]);

  // Sync to Backend if requested
  useEffect(() => {
    if (serverPagination) {
      serverPagination.onSearchChange(searchTerm);
    }
  }, [searchTerm, serverPagination]);

  useEffect(() => {
    if (serverPagination) {
      serverPagination.onFilterChange(activeFilters);
    }
  }, [activeFilters, serverPagination]);

  useEffect(() => {
    if (serverPagination) {
      serverPagination.onPageChange(currentPage);
    }
  }, [currentPage, serverPagination]);

  // -------------------------------------------------------------------
  // LOGIC | Data Processing Center
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  // LOGIC | Data Processing Center
  // -------------------------------------------------------------------
  const processedData = useMemo(() => {
    let result = [...data];

    // Recursive search helper
    const searchInObject = (obj: any, term: string): boolean => {
      if (!obj) return false;
      if (typeof obj === 'string' || typeof obj === 'number') {
        return String(obj).toLowerCase().includes(term.toLowerCase());
      }
      if (Array.isArray(obj)) {
        return obj.some(item => searchInObject(item, term));
      }
      if (typeof obj === 'object') {
        return Object.values(obj).some(val => searchInObject(val, term));
      }
      return false;
    };

    // 1. Search Logic
    if (searchTerm) {
      result = result.filter(item => {
        const inColumns = columns.some(col => {
            if (col.searchable === false) return false;
            const val = resolveValue(item, col.key);
            return String(val || '').toLowerCase().includes(searchTerm.toLowerCase());
        });
        return inColumns || searchInObject(item, searchTerm);
      });
    }

    // 2. Applied Filter Logic (Multi-select Support)
    Object.entries(activeFilters).forEach(([key, values]) => {
      if (values && values.length > 0) {
        result = result.filter(item => {
          const itemVal = String(resolveValue(item, key) || '');
          return values.includes(itemVal);
        });
      }
    });

    // 3. Sorting Logic
    if (sortField) {
      result.sort((a, b) => {
        const valA = resolveValue(a, sortField as string);
        const valB = resolveValue(b, sortField as string);
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortField, sortDirection, activeFilters, columns, serverPagination]);

  // -------------------------------------------------------------------
  // HANDLERS | Filtering & Pagination
  // -------------------------------------------------------------------
  const totalItems = serverPagination ? serverPagination.totalRecords : processedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentData = serverPagination ? data : processedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (key: any) => {
    if (sortField === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setActiveFilters(pendingFilters);
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const clearAll = () => {
    setSearchTerm('');
    setActiveFilters({});
    setPendingFilters({});
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const togglePendingFilter = (key: string, value: string) => {
    setPendingFilters(prev => {
        const current = (prev[key] as any) || [];
        const next = current.includes(value) 
            ? current.filter((v: string) => v !== value)
            : [...current, value];
        return { ...prev, [key]: next };
    });
  };

  const removeChip = (key: string, value?: string) => {
    setActiveFilters(prev => {
        const next = { ...prev };
        if (value) {
            next[key] = (next[key] as any).filter((v: string) => v !== value);
            if ((next[key] as any).length === 0) delete next[key];
        } else {
            delete next[key];
        }
        return next;
    });
    setCurrentPage(1);
  };

  const highlightSearch = (text: string) => {
    if (!searchTerm) return text;
    const parts = String(text).split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <span>
        {parts.map((p, i) => p.toLowerCase() === searchTerm.toLowerCase() 
          ? <mark key={i} style={{ background: '#fef08a', color: '#854d0e', padding: '0 2px', borderRadius: '2px' }}>{p}</mark>
          : p
        )}
      </span>
    );
  };

  return (
    <div className="data-table-pro-advanced animate-fade-in">
      {/* 🧭 NAVIGATION BAR | Search (Left) & Filter (Right) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '2rem', position: 'relative' }}>
        <div style={{ position: 'relative', width: '450px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.6 }} />
          <input 
            type="text" 
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ 
              width: '100%', 
              padding: '0.9rem 1rem 0.9rem 3.5rem', 
              borderRadius: '2rem', 
              border: '2px solid var(--border-subtle)', 
              background: 'white', 
              fontSize: '1rem',
              fontWeight: 500,
              outline: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              transition: 'var(--transition-smooth)'
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(13, 148, 136, 0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'; }}
          />
        </div>

        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="glass-interactive"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            padding: '0.9rem 1.5rem', 
            borderRadius: '2rem', 
            border: isFilterOpen ? '2px solid var(--primary)' : '2px solid var(--border-subtle)',
            background: isFilterOpen ? 'rgba(15, 118, 110, 0.05)' : 'white',
            color: isFilterOpen ? 'var(--primary)' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.85rem',
            letterSpacing: '0.05em',
            transition: 'var(--transition-smooth)'
          }}
        >
          <SlidersHorizontal size={18} />
          FILTERS
          {Object.keys(activeFilters).length > 0 && (
            <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '1rem', fontSize: '0.7rem' }}>{Object.keys(activeFilters).length}</span>
          )}
          <ChevronDown size={16} style={{ transition: 'transform 0.3s', transform: isFilterOpen ? 'rotate(180deg)' : 'none' }} />
        </button>
      </div>

      {/* 🔍 FILTER PANEL | Inline Compact Style */}
      {isFilterOpen && (
        <div className="glass-premium animate-fade-in" style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '1.5rem' }}>
              {filterableFields.map((field) => (
                <div key={String(field.key)}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>{field.label}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {field.options.map(opt => {
                          const isChecked = ((pendingFilters[String(field.key)] as any) || []).includes(opt);
                          return (
                              <button 
                                key={opt}
                                onClick={() => togglePendingFilter(String(field.key), opt)}
                                style={{ 
                                  padding: '0.5rem 1rem', 
                                  borderRadius: '2rem', 
                                  fontSize: '0.75rem', 
                                  fontWeight: isChecked ? 800 : 600, 
                                  background: isChecked ? 'var(--primary)' : '#f1f5f9', 
                                  color: isChecked ? 'white' : 'var(--text-main)', 
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: '0.2s' 
                                }}
                              >
                                  {opt}
                              </button>
                          );
                      })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button 
                onClick={() => { setPendingFilters({}); setActiveFilters({}); setIsFilterOpen(false); }}
                style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 800, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <RotateCcw size={14} /> RESET
            </button>
              <button 
                onClick={applyFilters}
                style={{ 
                  background: 'var(--primary)', 
                  color: 'white', 
                  padding: '0.75rem 1.5rem', 
                  borderRadius: '2rem', 
                  fontSize: '0.8rem', 
                  fontWeight: 950, 
                  letterSpacing: '0.05em', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.4)',
                  marginLeft: '1rem'
                }}
              >
                <CheckCircle2 size={16} /> APPLY
              </button>
            </div>
          </div>
      )}

      {/* 🏷️ MULTI-FILTER CHIPS | Pro Dynamics */}
      {(Object.entries(activeFilters).some(([_, v]) => (v as any)?.length > 0)) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.5rem', minHeight: '32px' }}>
             <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', opacity: 0.5, letterSpacing: '0.1em', alignSelf: 'center', marginRight: '0.5rem' }}>FILTERED BY:</span>
             {Object.entries(activeFilters).map(([key, values]) => {
                const label = filterableFields.find(f => String(f.key) === key)?.label;
                return (values as any).map((val: string) => (
                    <div key={`${key}-${val}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(13, 148, 136, 0.05)', border: '1.5px solid var(--primary)', color: 'var(--primary)', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 800 }}>
                       <span style={{ opacity: 0.6, fontWeight: 600 }}>{label}:</span> {val} <X size={14} onClick={() => removeChip(key, val)} style={{ cursor: 'pointer', opacity: 0.6 }} />
                    </div>
                ));
             })}
             <button onClick={clearAll} style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: '0.5rem' }}>✕ CLEAR ALL</button>
        </div>
      )}

      {/* 📋 THE REGISTRY TABLE */}
      <div className="card-premium" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'white' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid var(--border-subtle)' }}>
                {columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    onClick={() => col.sortKey && handleSort(col.sortKey)}
                    style={{ 
                      padding: '1.5rem 1.25rem', 
                      color: 'var(--text-muted)', 
                      fontWeight: 900, 
                      fontSize: '0.65rem', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      cursor: col.sortKey ? 'pointer' : 'default',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      ...col.style 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {col.header}
                      {col.sortKey && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <ArrowUp size={11} style={{ marginBottom: '-5px', color: (sortField === col.sortKey && sortDirection === 'asc') ? 'var(--primary)' : 'rgba(0,0,0,0.1)' }} />
                          <ArrowDown size={11} style={{ color: (sortField === col.sortKey && sortDirection === 'desc') ? 'var(--primary)' : 'rgba(0,0,0,0.1)' }} />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                {(onView || onEdit || onDelete || customActions) && (
                  <th style={{ padding: '1.5rem 1.25rem', color: 'var(--text-muted)', fontWeight: 900, fontSize: '0.65rem', textAlign: 'right', letterSpacing: '0.12em' }}>OPERATIONS</th>
                )}
              </tr>
            </thead>
            <tbody>
              {currentData.map((item) => (
                <tr key={item.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'var(--transition-smooth)' }}>
                  {columns.map((col, idx) => {
                    const value = typeof col.key === 'function' ? col.key(item) : String(pathResolve(item, col.key as string) || '');
                    
                    function pathResolve(obj: any, path: string) {
                        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
                    }

                    return (
                        <td key={idx} style={{ padding: '1.25rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', ...col.style }}>
                            {typeof value === 'string' ? highlightSearch(value) : value}
                        </td>
                    )
                  })}
                  {(onView || onEdit || onDelete || customActions) && (
                    <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {customActions && customActions(item)}
                        {onView && (
                          <button 
                            onClick={() => onView(item)} 
                            className="glass-interactive"
                            style={{ width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--border-subtle)', background: 'white', color: 'var(--primary)' }}
                            title="View Clinical Dashboard"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        {onEdit && (
                          <button 
                            onClick={() => onEdit(item)} 
                            className="glass-interactive"
                            style={{ width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--border-subtle)', background: 'white', color: 'var(--primary)' }}
                            title="Edit Profile"
                          >
                            <Edit3 size={18} />
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            onClick={() => onDelete(item)} 
                            className="glass-interactive"
                            style={{ width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fee2e2', background: '#fff1f1', color: '#ef4444' }}
                            title="Delete Record"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} style={{ padding: '8rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ opacity: 0.1, marginBottom: '2rem' }}><SlidersHorizontal size={80} style={{ margin: '0 auto' }} /></div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--text-main)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>No Registry Hits</h3>
                    <p style={{ fontSize: '1rem', fontWeight: 500, maxWidth: '400px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>The specified advanced filters did not yield any clinical records from the synchronization vault.</p>
                    <button onClick={clearAll} style={{ padding: '1rem 2.5rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', fontSize: '0.9rem', fontWeight: 950, letterSpacing: '0.05em', boxShadow: '0 10px 20px -5px rgba(15, 118, 110, 0.4)' }}>CLEAR ALL FILTERS</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 🔢 PAGINATION | Pro Dynamics (Integrated Footer) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.75rem', background: '#f8fafc', borderTop: '2px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>ROWS DISPLAYED</span>
            <select value={pageSize} onChange={(e) => { 
                const newSize = Number(e.target.value);
                setPageSize(newSize); 
                setCurrentPage(1); 
                // Refresh if server paginated
                if (serverPagination) {
                    // Update limit state on parent if possible, but currently we just trigger reload
                    // In a perfect world, parent controls pageSize state too. We'll leave it as is.
                }
            }} style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '2px solid var(--border-subtle)', background: 'white', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', outline: 'none' }}>
              {[10, 15, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Catalog results <span style={{ color: 'var(--primary)', fontWeight: 950 }}>{totalItems > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + pageSize, totalItems)}</span> of <span style={{ color: 'var(--primary)', fontWeight: 950 }}>{totalItems}</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="glass-interactive" style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'white', color: 'var(--text-main)', opacity: currentPage === 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={18} />
          </button>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
              .map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i-1] !== p - 1 && <span style={{ alignSelf: 'center', opacity: 0.3, fontWeight: 900 }}>···</span>}
                  <button onClick={() => setCurrentPage(p)} style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', background: currentPage === p ? 'var(--primary)' : 'rgba(0,0,0,0.03)', color: currentPage === p ? 'white' : 'var(--text-main)', fontSize: '0.85rem', fontWeight: 900, transition: 'var(--transition-smooth)', boxShadow: currentPage === p ? '0 10px 20px -5px rgba(15, 118, 110, 0.4)' : 'none' }}>{p}</button>
                </React.Fragment>
              ))
            }
          </div>

          <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="glass-interactive" style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'white', color: 'var(--text-main)', opacity: (currentPage === totalPages || totalPages === 0) ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
