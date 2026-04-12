'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Shield, 
  ShieldCheck, 
  Edit,
  Activity,
  Info,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';

export default function RoleDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const { showToast } = usePCMSStore();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<any>(null);
  const [availablePermissions, setAvailablePermissions] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [permsRes, roleRes] = await Promise.all([
          api.get('/roles/permissions'),
          api.get(`/roles/${id}`)
        ]);
        setAvailablePermissions(Array.isArray(permsRes.data) ? permsRes.data : (permsRes.data?.data || []));
        setRole(roleRes.data);
      } catch (err) {
        console.error('🚫 Registry Error | Failed to fetch role details:', err);
        showToast('Failed to load clinical role parameters.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, showToast]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin" />
      <p className="font-bold text-slate-400 animate-pulse text-xs tracking-widest">🛡️ AUDITING AUTHORIZATION MATRIX...</p>
    </div>
  );

  if (!role) return (
    <div className="p-12 text-center font-bold text-slate-400">
      🚫 CLINICAL ROLE NOT FOUND
    </div>
  );

  return (
    <div className="role-details-container animate-fade-in clinical-form-wide" style={{ paddingBottom: '7rem' }}>
      
      {/* 🏥 CLINICAL HEADER */}
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <button 
            onClick={() => router.push('/roles')} 
            style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'rgba(15, 118, 110, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}
          >
            <ArrowLeft size={16} /> Role Registry
          </button>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>Authorization <span className="gradient-text">Matrix</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Detailed breakdown of dynamic permissions, medical role scope, and system protection status.</p>
        </div>
        <button
          onClick={() => router.push(`/roles/${id}/edit`)}
          className="glass-interactive"
          style={{ 
            padding: '0.85rem 2rem', 
            borderRadius: 'var(--radius-md)', 
            background: 'var(--primary)', 
            color: 'white', 
            fontWeight: 800, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.4)'
          }}
        >
          <Edit size={18} /> ARCHITECT ROLE
        </button>
      </div>

      <div className="clinical-form-grid">
        
        {/* LEFT COLUMN: Role Identity & Scope */}
        <div className="col-8">
          <div className="clinical-form-card" style={{ height: '100%' }}>
            
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '3.5rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '1.5rem', background: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2rem', fontWeight: 950 }}>
                <Shield size={40} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '2.4rem', fontWeight: 950, margin: 0, letterSpacing: '-0.04em' }}>{role.name}</h2>
                  {role.isSystemRole && (
                    <span style={{ padding: '0.4rem 1rem', borderRadius: '2rem', background: 'rgba(15, 118, 110, 0.1)', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.05em', border: '1.5px solid var(--primary)' }}>
                      SYSTEM PROTECTED
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 600 }}>{role.description || 'Global clinical and administrative scope.'}</p>
              </div>
            </div>

            {/* PERMISSION MATRIX VISUALIZER */}
            <div style={{ marginTop: '2rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 950, letterSpacing: '-0.02em', margin: 0 }}>Permission <span className="gradient-text">Configuration</span></h2>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: role.allAccess ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {role.allAccess ? 'Absolute (Bypass) Access Authorized' : `${role.permissions?.length || 0} Modules Integrated`}
                  </div>
               </div>

               {role.allAccess ? (
                 <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(15, 118, 110, 0.03)', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--primary)' }}>
                    <Unlock size={48} style={{ color: 'var(--primary)', margin: '0 auto 1.5rem auto' }} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--primary)', marginBottom: '0.5rem' }}>FULL SYSTEM AUTHORIZATION</h3>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600, maxWidth: '400px', margin: '0 auto' }}>
                      This role has been granted unconditional access to all clinical, financial, and administrative modules within the network.
                    </p>
                 </div>
               ) : (
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                    {Object.entries(availablePermissions || {}).map(([moduleName, perms]: [string, any]) => {
                       const modulePerms = Object.values(perms);
                       const hasAccess = modulePerms.some(p => role.permissions?.includes(p));
                       return (
                        <div key={moduleName} style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-subtle)', opacity: hasAccess ? 1 : 0.4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '1rem', fontWeight: 850 }}>{moduleName.replace(/_/g, ' ')}</span>
                                {hasAccess ? <CheckSquare size={20} style={{ color: 'var(--primary)' }} /> : <Square size={20} style={{ opacity: 0.1 }} />}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '0.5rem', textTransform: 'uppercase' }}>
                              {hasAccess ? 'Integrated Authorization' : 'Access Restricted'}
                            </div>
                        </div>
                       );
                    })}
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Operational Context */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="clinical-form-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
               <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
               <h3 style={{ fontSize: '1.1rem', fontWeight: 950, letterSpacing: '-0.01em' }}>SECURITY FEED</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-subtle)' }}>
                   <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>HIERARCHY STATUS</span>
                   <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>{role.allAccess ? 'Level 10 (Root)' : 'Level 5 (Operational)'}</span>
                </div>
                
                <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-subtle)' }}>
                   <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DEPLOYMENT SCOPE</span>
                   <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)' }}>Cross-Branch Sync</span>
                </div>
            </div>
          </div>

          <div style={{ padding: '2rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Lock size={20} style={{ color: role.isSystemRole ? 'var(--primary)' : 'var(--text-muted)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0 }}>Integrity Check</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
               {role.isSystemRole 
                 ? "This is a core system role with hardcoded protections. Identity cannot be modified to ensure clinical governance integrity."
                 : "This is a custom clinical role. Authorization matrices can be adjusted dynamically by Super-Administrators."
               }
            </p>
          </div>

          <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.03)', border: '1px dashed #ef4444' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Permissions are <strong>Strictly Isolated</strong>. Modifying this role will immediately affect all associated clinical specialists across every branch.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
