'use client'
import React from 'react';
import { Shield, Eye, PlusCircle, Edit3, Trash2, CheckCircle2 } from 'lucide-react';

/**
 * 🛡️ Clinical Permission Matrix | Authorization Architect
 * Redesigned for modularity and ease of use. 
 * Features a card-based layout where each module's access can be managed independently.
 */
interface PermissionMatrixProps {
  availablePermissions: Record<string, Record<string, string>>;
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ 
  availablePermissions, 
  selectedPermissions, 
  onChange,
  disabled = false
}) => {
  const standardActions = [
    { label: 'View', key: 'VIEW', icon: <Eye size={14} /> },
    { label: 'Create', key: 'CREATE', icon: <PlusCircle size={14} /> },
    { label: 'Update', key: 'EDIT', icon: <Edit3 size={14} /> },
    { label: 'Delete', key: 'DELETE', icon: <Trash2 size={14} /> }
  ];

  const togglePermission = (perm: string) => {
    if (disabled) return;
    if (selectedPermissions.includes(perm)) {
      onChange(selectedPermissions.filter(p => p !== perm));
    } else {
      onChange([...selectedPermissions, perm]);
    }
  };

  const toggleModule = (moduleKey: string, checked: boolean) => {
    if (disabled) return;
    const modulePerms = Object.values(availablePermissions[moduleKey]);
    if (checked) {
      const newPerms = [...selectedPermissions];
      modulePerms.forEach(p => {
        if (!newPerms.includes(p)) newPerms.push(p);
      });
      onChange(newPerms);
    } else {
      onChange(selectedPermissions.filter(p => !modulePerms.includes(p)));
    }
  };

  const isModuleFull = (moduleKey: string) => {
    const modulePerms = Object.values(availablePermissions[moduleKey]);
    return modulePerms.length > 0 && modulePerms.every(p => selectedPermissions.includes(p));
  };

  const isModuleEmpty = (moduleKey: string) => {
    const modulePerms = Object.values(availablePermissions[moduleKey]);
    return !modulePerms.some(p => selectedPermissions.includes(p));
  };

  const getSpecialActions = (moduleKey: string) => {
    const moduleData = availablePermissions[moduleKey];
    const standardKeys = standardActions.map(a => a.key);
    return Object.entries(moduleData).filter(([key]) => !standardKeys.includes(key));
  };

  // Filter out Dashboard as per requirement (Everyone has access)
  const modules = Object.keys(availablePermissions).filter(m => m !== 'DASHBOARD');

  return (
    <div className="permission-matrix-grid" style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
      gap: '1.5rem',
      opacity: disabled ? 0.7 : 1,
      transition: 'all 0.3s ease'
    }}>
      {modules.map((moduleKey) => {
        const specialActions = getSpecialActions(moduleKey);
        const moduleFull = isModuleFull(moduleKey);
        const moduleEmpty = isModuleEmpty(moduleKey);

        return (
          <div 
            key={moduleKey} 
            className={`permission-card ${!moduleEmpty ? 'active' : ''}`}
            style={{ 
              background: 'white', 
              borderRadius: 'var(--radius-lg)', 
              border: `1px solid ${!moduleEmpty ? 'var(--primary)' : 'var(--border-subtle)'}`,
              boxShadow: !moduleEmpty ? '0 10px 15px -3px rgba(15, 118, 110, 0.1)' : 'var(--shadow-sm)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Card Header */}
            <div style={{ 
              padding: '1.25rem', 
              borderBottom: '1px solid var(--border-subtle)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: !moduleEmpty ? 'rgba(15, 118, 110, 0.02)' : 'transparent'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '8px', 
                  background: !moduleEmpty ? 'var(--primary)' : '#f1f5f9', 
                  color: !moduleEmpty ? 'white' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}>
                  <Shield size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {moduleKey.replace(/_/g, ' ')}
                  </h3>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>CLINICAL MODULE</p>
                </div>
              </div>
              
              <input 
                type="checkbox" 
                checked={moduleFull}
                disabled={disabled}
                onChange={(e) => toggleModule(moduleKey, e.target.checked)}
                style={{ 
                  width: '18px', 
                  height: '18px', 
                  accentColor: 'var(--primary)',
                  cursor: disabled ? 'not-allowed' : 'pointer'
                }}
              />
            </div>

            {/* Main Actions Grid */}
            <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {standardActions.map(action => {
                const permKey = availablePermissions[moduleKey][action.key];
                const isActive = permKey && selectedPermissions.includes(permKey);

                if (!permKey) return (
                  <div key={action.key} style={{ 
                    padding: '0.6rem', 
                    borderRadius: 'var(--radius-md)', 
                    background: '#f8fafc', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    opacity: 0.3,
                    border: '1px dashed #e2e8f0'
                  }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>{action.label} N/A</span>
                  </div>
                );

                return (
                  <button
                    key={action.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => togglePermission(permKey)}
                    style={{ 
                      padding: '0.6rem', 
                      borderRadius: 'var(--radius-md)', 
                      background: isActive ? 'var(--primary)' : '#f1f5f9', 
                      color: isActive ? 'white' : 'var(--text-main)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.6rem', 
                      border: `1px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ opacity: isActive ? 1 : 0.5 }}>{action.icon}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{action.label}</span>
                    {isActive && <CheckCircle2 size={12} style={{ marginLeft: 'auto' }} />}
                  </button>
                );
              })}
            </div>

            {/* Special Actions Footer */}
            {specialActions.length > 0 && (
              <div style={{ 
                padding: '1rem 1.25rem', 
                background: '#f8fafc', 
                borderTop: '1px solid var(--border-subtle)',
                marginTop: 'auto'
              }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Specialized Controls</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {specialActions.map(([label, permKey]) => {
                    const isActive = selectedPermissions.includes(permKey);
                    return (
                      <button
                        key={permKey}
                        type="button"
                        disabled={disabled}
                        onClick={() => togglePermission(permKey)}
                        style={{ 
                          padding: '0.35rem 0.75rem', 
                          borderRadius: '2rem', 
                          fontSize: '0.65rem', 
                          fontWeight: 800,
                          background: isActive ? 'rgba(15, 118, 110, 0.1)' : 'white',
                          color: isActive ? 'var(--primary)' : '#64748b',
                          border: `1px solid ${isActive ? 'var(--primary)' : '#e2e8f0'}`,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {label} {isActive && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PermissionMatrix;
