'use client'
import Image from 'next/image';
import { usePCMSStore } from '@/store/useStore';
import {
  Activity,
  BriefcaseMedical,
  Calendar,
  ChevronRight,
  LayoutDashboard,
  Lock,
  LogOut,
  Package,
  ReceiptIndianRupee,
  ShieldCheck,
  Stethoscope,
  Users,
  Wallet
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
        { label: 'Attendance', href: '/attendance', icon: Activity, permission: 'operations:view' },
        { label: 'Services', href: '/services', icon: BriefcaseMedical, permission: 'services:view' },
        { label: 'Expenses', href: '/expenses', icon: Wallet, permission: 'expenses:view' },
        { label: 'Inventory', href: '/inventory', icon: Package, permission: 'inventory:view' },
      ]
    },
    {
      label: 'ADMINISTRATION',
      items: [
        { label: 'Specialists', href: '/users', icon: ShieldCheck, permission: 'users:view' },
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
      <div className="sidebar-logo" style={{ marginBottom: '2.5rem' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Image
              src="/logo.png"
              alt="AKOD TECH Logo"
              width={100}
              height={100}
              priority
              loading="eager"
              style={{ borderRadius: '10px', objectFit: 'cover', width: 'auto', height: 'auto' }}
            />
            <div>
              <h1 style={{ fontSize: '1.15rem', letterSpacing: '-0.02em', fontWeight: 800, margin: 0, color: 'white' }}>
                Physio<span className="gradient-text"> 4</span>
              </h1>
              <p style={{ fontSize: '0.6rem', opacity: 0.4, letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
                Clinical Systems v1.4
              </p>
            </div>
          </div>
        </Link>
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
          suppressHydrationWarning
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
