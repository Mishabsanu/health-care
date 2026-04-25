'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePCMSStore } from '@/store/useStore';
import api from '@/services/api';
import { 
  ShieldCheck, 
  Stethoscope, 
  Lock, 
  Mail, 
  ArrowRight, 
  Briefcase,
  Activity,
  ChevronRight,
  Heart,
  Eye,
  EyeOff
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = usePCMSStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/login', formData);
      const { accessToken, user } = res.data;
      
      localStorage.setItem('accessToken', accessToken);
      setUser(user);
      
      router.push('/');
    } catch (err: any) {
      console.error('🚫 Login Error:', err);
      setError(err.response?.data?.message || 'Invalid clinical credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      flexDirection: 'row',
      background: 'white',
      overflow: 'hidden'
    }} className="login-partition-workspace">

      {/* 🏙️ LEFT PARTITION | BRANDING PAVILION */}
      <div style={{ 
        flex: 1.2, 
        background: 'linear-gradient(135deg, #0f172a 0%, #0d9488 100%)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '5rem',
        color: 'white',
        overflow: 'hidden'
      }} className="hidden lg:flex">
        
        {/* Subtle Architectural Glows */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', background: 'rgba(20, 184, 166, 0.2)', filter: 'blur(120px)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '300px', height: '300px', background: 'rgba(15, 23, 42, 0.4)', filter: 'blur(100px)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '1rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <ShieldCheck size={32} className="text-teal-400" />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.15em', opacity: 0.8 }}>PCMS SECURE VAULT</h2>
            </div>

            <h1 style={{ fontSize: '4.5rem', fontWeight: 950, lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: '1.5rem' }}>
                Modern <br />Clinical <span style={{ color: '#2dd4bf' }}>Ops.</span>
            </h1>
            
            <p style={{ fontSize: '1.2rem', opacity: 0.7, fontWeight: 500, maxWidth: '480px', lineHeight: 1.6, marginBottom: '3.5rem' }}>
                Unified Physiotherapy Management. Secure clinical records, comprehensive revenue tracking, and specialized patient logistics at your fingertips.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '500px' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <Activity size={20} className="mt-1 text-teal-400" />
                    <div>
                        <h4 style={{ fontWeight: 800, fontSize: '0.9rem' }}>Real-time Registry</h4>
                        <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Dynamic synchronization within the clinical registry.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <Lock size={20} className="mt-1 text-teal-400" />
                    <div>
                        <h4 style={{ fontWeight: 800, fontSize: '0.9rem' }}>End-to-End Vault</h4>
                        <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Clinical-grade encryption for all medical ops.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Brand Info */}
        <div style={{ position: 'absolute', bottom: '4rem', left: '5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', opacity: 0.4 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.1em' }}>POWERED BY AKOD CARE PCMS</span>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'white' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.1em' }}>V2.4.0 PROFESSIONAL</span>
        </div>
      </div>

      {/* 📑 RIGHT PARTITION | LOGIN FORM */}
      <div style={{ 
        flex: 0.8, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem',
        background: '#f8fafc'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 950, color: '#1e293b', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Specialist Portal</h2>
                <p style={{ color: '#64748b', fontWeight: 600 }}>Please enter your clinical credentials.</p>
            </div>

            {error && (
                <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
                   <Activity size={18} /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Clinical Identifier (Email or Employee ID)</label>
                    <div style={{ position: 'relative' }}>
                        <Briefcase style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                        <input 
                            required
                            type="text" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="e.g. AKOD-0001 or specialist@akod.com"
                            style={{ 
                                width: '100%', 
                                padding: '1rem 1rem 1rem 3.5rem', 
                                borderRadius: '14px', 
                                border: '2px solid #e2e8f0', 
                                background: 'white',
                                fontSize: '1rem',
                                fontWeight: 500,
                                outline: 'none',
                                transition: '0.2s ease'
                            }}
                            className="focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Vault Password</label>
                    <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                        <input 
                            required
                            type={showPassword ? "text" : "password"} 
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            placeholder="••••••••"
                            style={{ 
                                width: '100%', 
                                padding: '1rem 3.5rem 1rem 3.5rem', 
                                borderRadius: '14px', 
                                border: '2px solid #e2e8f0', 
                                background: 'white',
                                fontSize: '1rem',
                                fontWeight: 500,
                                outline: 'none',
                                transition: '0.2s ease'
                            }}
                            className="focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', cursor: 'pointer' }}>
                        <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#0d9488' }} />
                        Stay logged in
                    </label>
                    <button type="button" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0d9488' }}>Reset password?</button>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    style={{ 
                        marginTop: '1.5rem',
                        width: '100%', 
                        padding: '1.1rem', 
                        borderRadius: '14px', 
                        background: '#0d9488', 
                        color: 'white', 
                        fontWeight: 900, 
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.4)',
                        transition: '0.3s ease'
                    }}
                    className="hover:scale-[1.02] active:scale-[0.98]"
                >
                    {loading ? 'Authenticating Clinical Vault...' : (
                        <>
                            Login to Registry <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </form>

            <div style={{ marginTop: '4rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '2.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Physio-Net Clinical Infrastructure Registry</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'white', border: '1px solid #e2e8f0' }}><Heart size={16} className="text-teal-600" /></div>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'white', border: '1px solid #e2e8f0' }}><Briefcase size={16} className="text-teal-600" /></div>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'white', border: '1px solid #e2e8f0' }}><Stethoscope size={16} className="text-teal-600" /></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
