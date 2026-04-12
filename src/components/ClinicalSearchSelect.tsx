'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, User } from 'lucide-react';

interface ClinicalSearchSelectProps {
    options: any[];
    onSelect: (option: any) => void;
    placeholder?: string;
    label?: string;
    icon?: React.ReactNode;
    searchFields?: string[];
    value?: string;
    displayValue?: string;
    onClear?: () => void;
    renderOption?: (option: any) => React.ReactNode;
}

/**
 *  ClinicalSearchSelect
 * A high-end, searchable dropdown component for clinical registry selections.
 */
export default function ClinicalSearchSelect({
    options,
    onSelect,
    placeholder = "Search registry...",
    label,
    icon,
    searchFields = ['name'],
    value,
    displayValue,
    onClear,
    renderOption
}: ClinicalSearchSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter Logic
    const filteredOptions = options.filter(opt =>
        searchFields.some(field =>
            opt[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // Handle Clicks Outside to Close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm(''); // Reset search on close
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt._id === value);

    return (
        <div className="clinical-select-root" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            {label && (
                <label className="label-premium" style={{ marginBottom: '0.75rem', display: 'block' }}>
                    {label}
                </label>
            )}

            {/* Selection Trigger */}
            <div
                className={`input-premium ${isOpen ? 'focused' : ''}`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    padding: '0.75rem 1rem',
                    height: '52px',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: 'white'
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                {/* Prefix Icon */}
                <div style={{ color: isOpen || value ? 'var(--primary)' : 'var(--text-muted)', transition: 'color 0.3s' }}>
                    {icon || <Search size={18} />}
                </div>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                    {selectedOption || displayValue ? (
                        <p style={{
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            fontSize: '0.95rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {displayValue || selectedOption?.name}
                        </p>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', opacity: 0.6 }}>
                            {placeholder}
                        </p>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {value && onClear && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                            }}
                            style={{
                                color: '#ef4444',
                                background: 'rgba(239, 68, 68, 0.05)',
                                padding: '4px',
                                borderRadius: '4px'
                            }}
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown
                        size={18}
                        style={{
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease',
                            color: 'var(--text-muted)',
                            opacity: 0.5
                        }}
                    />
                </div>
            </div>

            {/* Search Dropdown Panel */}
            {isOpen && (
                <div
                    className="glass-premium animate-fade-in"
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                        border: '1px solid var(--border-subtle)',
                        overflow: 'hidden',
                        background: 'white'
                    }}
                >
                    {/* Search Input Filter */}
                    <div style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Filter registry..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                    background: 'white'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt._id}
                                    className="table-row-hover"
                                    style={{
                                        padding: '0.85rem 1rem',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #f8fafc',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: value === opt._id ? 'rgba(15, 118, 110, 0.04)' : 'transparent'
                                    }}
                                    onClick={() => {
                                        onSelect(opt);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                >
                                    {renderOption ? renderOption(opt) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: 'rgba(15, 118, 110, 0.1)',
                                                color: 'var(--primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 800,
                                                fontSize: '0.75rem'
                                            }}>
                                                {opt.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0, color: '#0f172a' }}>{opt.name}</p>
                                                {opt.phone && (
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{opt.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {value === opt._id && (
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                No matching records found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
