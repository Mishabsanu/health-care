'use client'
import React, { useState } from 'react';
import { usePCMSStore } from '@/store/useStore';
import { 
  Search, 
  Bell, 
  Command, 
  ChevronDown, 
  Globe, 
  Building2, 
  X,
  Plus,
  Users,
  Calendar,
  Stethoscope,
  BriefcaseMedical,
  ReceiptIndianRupee,
  Wallet,
  Package,
  Lock
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const ALL_MODULES = [
  { label: 'Patients Registry', href: '/patients', icon: Users, color: '#0ea5e9' },
  { label: 'Appointments', href: '/appointments', icon: Calendar, color: '#8b5cf6' },
  { label: 'Billing & Invoices', href: '/billing', icon: ReceiptIndianRupee, color: '#10b981' },
  { label: 'Expenses', href: '/expenses', icon: Wallet, color: '#f43f5e' },
  { label: 'Inventory Stock', href: '/inventory', icon: Package, color: '#f59e0b' },
  { label: 'Clinical Services', href: '/services', icon: BriefcaseMedical, color: '#06b6d4' },
  { label: 'Staff / Doctors', href: '/users', icon: Stethoscope, color: '#3b82f6' },
  { label: 'Roles & Access', href: '/roles', icon: Lock, color: '#64748b' }
];

export default function Header() {
  const { user } = usePCMSStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [moduleQuery, setModuleQuery] = useState('');
  const router = useRouter();

  if (!user) return null;

  return (
    <header className="top-nav animate-fade-in">
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flex: 1 }}>
        <div style={{ position: 'relative', width: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search modules (e.g. patients, inv, billing)..." 
            style={{
              width: '100%',
              padding: '0.85rem 1rem 0.85rem 2.75rem',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid var(--border-subtle)',
              background: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.9rem',
              fontWeight: 600,
              outline: 'none',
              transition: 'var(--transition-smooth)'
            }}
            onChange={(e) => setModuleQuery(e.target.value)}
            value={moduleQuery}
            onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.background = 'white';
                setSearchFocused(true);
            }}
            onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-subtle)';
                e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                setTimeout(() => setSearchFocused(false), 200);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                const query = e.currentTarget.value.toLowerCase();
                const matched = ALL_MODULES.find(m => m.label.toLowerCase().includes(query) || m.href.includes(query));
                if (matched) {
                  router.push(matched.href);
                  setModuleQuery('');
                  setSearchFocused(false);
                }
              }
            }}
          />
          {searchFocused && (
            <div style={{
              position: 'absolute',
              top: '120%',
              left: 0,
              width: '500px',
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
              padding: '1.5rem',
              zIndex: 100
            }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Suggest Modules
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {ALL_MODULES.filter(m => m.label.toLowerCase().includes(moduleQuery.toLowerCase())).map(mod => {
                  const Icon = mod.icon;
                  return (
                    <button
                      key={mod.href}
                      onClick={() => {
                        router.push(mod.href);
                        setModuleQuery('');
                      }}
                      className="glass-interactive"
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                        padding: '1rem', borderRadius: 'var(--radius-md)', background: '#f8fafc',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ color: mod.color }}><Icon size={24} /></div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>{mod.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div style={{ 
            position: 'absolute', 
            right: '0.75rem', 
            top: '50%', 
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '2px 6px',
            background: '#f1f5f9',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            fontWeight: 700
          }}>
            <Command size={10} /> <span>K</span>
          </div>
        </div>

      </div>

      {/* Specialist Identity & Session Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button className="glass-interactive" style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'white',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)'
        }}>
          <Bell size={20} />
        </button>

        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.5rem', paddingLeft: '1.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '2px solid var(--border-subtle)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div className="profile-details" style={{ textAlign: 'right' }}>
            <p style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--primary)', margin: 0 }}>{user?.name?.toUpperCase() || 'USER'}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, margin: 0, opacity: 0.8 }}>
              {user?.roleName}
            </p>
          </div>
          <div className="avatar" style={{ width: '42px', height: '42px', fontSize: '1rem', border: '3px solid white', boxShadow: '0 0 0 1px var(--border-subtle)' }}>
            {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
