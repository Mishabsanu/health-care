'use client'
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePCMSStore } from '@/store/useStore';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Stethoscope, 
  Activity, 
  BriefcaseMedical, 
  ReceiptIndianRupee, 
  Wallet,
  Package,
  ShieldCheck, 
  Lock,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  permission?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = usePCMSStore();

  const navGroups: NavGroup[] = [
    {
      label: 'CORE CLINICAL',
      items: [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard },
        { label: 'Patients', href: '/patients', icon: Users },
        { label: 'Appointments', href: '/appointments', icon: Calendar },
        { label: 'Billing & Invoices', href: '/billing', icon: ReceiptIndianRupee },
        { label: 'Doctors', href: '/doctors', icon: Stethoscope },
      ]
    },
    {
      label: 'OPERATIONS',
      items: [
        { label: 'Clinic Attendance', href: '/attendance', icon: Activity, permission: 'operations:view' },
        { label: 'Services Catalog', href: '/services', icon: BriefcaseMedical, permission: 'services:view' },
        { label: 'Expense Management', href: '/expenses', icon: Wallet, permission: 'expenses:view' },
        { label: 'Inventory Registry', href: '/inventory', icon: Package, permission: 'inventory:view' },
      ]
    },
    {
      label: 'ADMINISTRATION',
      items: [
        { label: 'Clinical Staff', href: '/users', icon: ShieldCheck, permission: 'users:view' },
        { label: 'Staff Payroll', href: '/payroll', icon: Wallet, permission: 'users:view' },
        { label: 'Roles & Permissions', href: '/roles', icon: Lock, permission: 'roles:view' },
      ]
    }
  ];

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (user?.allAccess) return true;
    return user?.permissions?.includes(permission);
  };

  return (
    <aside className="sidebar animate-fade-in">
      <div className="sidebar-logo" style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '1rem'
          }}>P</div>
          <div>
            <h1 style={{ fontSize: '1.25rem', letterSpacing: '-0.02em', fontWeight: 800, margin: 0 }}>
              Physio<span className="gradient-text">4</span>
            </h1>
            <p style={{ fontSize: '0.6rem', opacity: 0.4, letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase' }}>
              Clinical systems v1.4
            </p>
          </div>
        </div>
      </div>
      
      <div className="sidebar-nav" style={{ overflowY: 'auto' }}>
        {navGroups.map((group, gIdx) => {
          const filteredItems = group.items.filter(item => hasPermission(item.permission));
          if (filteredItems.length === 0) return null;

          return (
            <div key={group.label} style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                fontSize: '0.65rem', 
                fontWeight: 800, 
                color: 'rgba(255,255,255,0.3)', 
                letterSpacing: '0.12em', 
                padding: '0 1.25rem',
                marginBottom: '1rem'
              }}>
                {group.label}
              </h3>
              <nav>
                {filteredItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href} 
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      style={{ marginBottom: '0.25rem' }}
                    >
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {isActive && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', marginTop: 'auto' }}>
        <button 
          onClick={() => logout()}
          className="nav-item glass-interactive"
          style={{ 
            width: '100%', 
            color: '#f87171',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.1)'
          }}
        >
          <LogOut size={18} />
          <span>Secure Logout</span>
        </button>
      </div>
    </aside>
  );
}
