'use client'
import React, { useState, useEffect } from 'react';
import { usePCMSStore } from '@/store/useStore';
import api from '@/services/api';
import { usePermission } from '@/hooks/usePermission';
import {
  Calendar, Users, Clock, Search, LogIn, LogOut,
  Download, FileText, Activity, XCircle, Info, ChevronRight
} from 'lucide-react';

export default function AttendancePage() {
  const { user, showToast } = usePCMSStore();
  const { hasPermission } = usePermission();

  // 🧭 System State
  const [teamSubTab, setTeamSubTab] = useState<'day' | 'register'>('day');
  const [status, setStatus] = useState<any>({ staffPresent: [] });
  const [history, setHistory] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // 🔍 Filtering & Context
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');

  // 📋 Modal Orchestration
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<any>(null);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, historyRes, staffRes] = await Promise.all([
        api.get('/attendance/status'),
        api.get(`/attendance?month=${selectedMonth}&year=${selectedYear}`),
        api.get('/attendance/staff')
      ]);

      setStatus(statusRes.data);
      setHistory(historyRes.data);
      setStaffList(staffRes.data);
    } catch (err: any) {
      console.error('🚫 Intelligence Gateway Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const safeDate = (val: any) => {
    if (!val) return null;
    const d = val?.$date ? new Date(val.$date) : new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const togglePresence = async (staffId: string, currentSessionId?: string) => {
    setActionLoading(true);
    try {
      if (!currentSessionId) {
        await api.post('/attendance/check-in', { staffId });
        showToast('Clinical Session Activated', 'success');
      } else {
        await api.put(`/attendance/check-out/${currentSessionId}`);
        showToast('Clinical Session Terminated', 'success');
      }
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const calculateDuration = (inTime: any, outTime: any) => {
    const start = safeDate(inTime);
    const end = safeDate(outTime);
    if (!start || !end) return 0;
    return end.getTime() - start.getTime();
  };

  const formatMs = (ms: number) => {
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
  };

  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const monthDaysCount = getDaysInMonth(selectedYear, selectedMonth);

  const filteredStaff = staffList.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // 📈 Dynamic Clinic Analytics (Responsive to Search)
  const workforceSize = filteredStaff.length || 0;
  const presentCount = status?.staffPresent?.filter((p: any) =>
    filteredStaff.some(s => s._id === p.id)
  ).length || 0;
  const clinicalPulse = workforceSize > 0 ? Math.round((presentCount / workforceSize) * 100) : 0;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '1.5rem 2.5rem 5rem', overflowX: 'hidden' }} className="animate-fade-in">

      {/* 🏛️ Command Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Clinical <span className="gradient-text">Attendance</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Real-time workforce visibility and clinical floor analytics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '1.25rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              placeholder="Search medical staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-premium"
              style={{ paddingLeft: '3.2rem', width: '320px', borderRadius: '14px', height: '48px' }}
            />
          </div>
          <button style={{ height: '48px', padding: '0 1.5rem', borderRadius: '14px', background: 'white', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', boxShadow: 'var(--shadow-sm)' }}>
            <Download size={18} />
            Export Audit
          </button>
        </div>
      </div>

      {/* 📊 High-Fidelity Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        {[
          { label: 'Clinic Pulse', value: `${clinicalPulse}%`, icon: Activity, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.05)' },
          { label: 'Total Staff', value: workforceSize, icon: Users, color: '#0d9488', bg: 'rgba(13, 148, 136, 0.05)' },
          { label: 'On Floor Now', value: presentCount, icon: Clock, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)' },
          { label: 'Today Absents', value: Math.max(0, workforceSize - presentCount), icon: XCircle, color: '#e11d48', bg: 'rgba(225, 29, 72, 0.05)', critical: true },
        ].map((card, i) => (
          <div key={i} className="card-premium" style={{ padding: '1.75rem', background: card.critical ? '#fff1f2' : 'white', border: card.critical ? '1px solid #ffe4e6' : '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: card.bg, color: card.color }}>
                <card.icon size={22} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: card.critical ? '#e11d48' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
            </div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: card.critical ? '#e11d48' : 'var(--text-main)', margin: 0, letterSpacing: '-0.03em' }}>{card.value}</h2>
          </div>
        ))}
      </div>

      {/* 📅 Operational Framework */}

      <div
        style={{
          background: 'white',
          borderRadius: '30px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 50px -12px rgba(0,0,0,0.05)',
          width: '100%',
          maxWidth: '100%',
          contain: 'paint',
        }}
      >
        {/* Navigation & Period Controls */}
        <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', borderRadius: '30px 30px 0 0' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-main)', padding: '0.4rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setTeamSubTab('day')}
              style={{
                padding: '0.75rem 1.5rem', borderRadius: '12px',
                background: teamSubTab === 'day' ? 'white' : 'transparent',
                color: teamSubTab === 'day' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: teamSubTab === 'day' ? 'var(--shadow-sm)' : 'none',
                border: teamSubTab === 'day' ? '1px solid var(--border-subtle)' : '1px solid transparent'
              }}
            >
              Operational Ledger
            </button>
            <button
              onClick={() => setTeamSubTab('register')}
              style={{
                padding: '0.75rem 1.5rem', borderRadius: '12px',
                background: teamSubTab === 'register' ? 'white' : 'transparent',
                color: teamSubTab === 'register' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: teamSubTab === 'register' ? 'var(--shadow-sm)' : 'none',
                border: teamSubTab === 'register' ? '1px solid var(--border-subtle)' : '1px solid transparent'
              }}
            >
              Attendance Register
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-main)', padding: '0.5rem 1.25rem', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
              <Calendar size={16} style={{ color: 'var(--primary)' }} />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{ background: 'none', border: 'none', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer', outline: 'none' }}
              >
                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }} />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{ background: 'none', border: 'none', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer', outline: 'none' }}
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 📋 Data Rendering Layer */}
        <div style={{ padding: '0', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
          {teamSubTab === 'day' ? (
            <div
              style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                width: '100%',
                maxWidth: '100%',
                padding: '1.5rem 2.5rem 2.5rem',
                boxSizing: 'border-box',
              }}
              className="custom-scrollbar"
            >
              <table style={{ minWidth: '820px', width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>STAFF</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem' }}>Status</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem' }}>Discovery Time</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem' }}>Departure</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem' }}>Bench Duration</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem 1.5rem' }}>Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map(member => {
                    const activeSession = status.staffPresent.find((s: any) => s.id === member._id);
                    const isCurrentUser = member._id === user?.id;

                    const todayStr = new Date().toDateString();
                    const todayLogs = history
                      .filter(h => {
                        const hId = h.staffId?._id?.toString() || h.staffId?.toString();
                        const mId = member._id?.toString() || member.id?.toString();
                        return hId === mId && safeDate(h.checkIn)?.toDateString() === todayStr;
                      })
                      .sort((a, b) => (safeDate(a.checkIn)?.getTime() || 0) - (safeDate(b.checkIn)?.getTime() || 0));

                    const arrival = todayLogs.length > 0 ? safeDate(todayLogs[0].checkIn) : (activeSession ? safeDate(activeSession.checkIn) : null);
                    const finishedLogs = todayLogs.filter(l => l.checkOut);
                    const departure = finishedLogs.length > 0 ? safeDate(finishedLogs[finishedLogs.length - 1].checkOut) : null;

                    let dailyMs = 0;
                    todayLogs.forEach(l => {
                      const start = safeDate(l.checkIn);
                      const end = safeDate(l.checkOut);
                      if (start && end) dailyMs += (end.getTime() - start.getTime());
                    });
                    if (activeSession) {
                      const activeStart = safeDate(activeSession.checkIn);
                      if (activeStart) dailyMs += (new Date().getTime() - activeStart.getTime());
                    }

                    return (
                      <tr key={member._id} className="table-row-hover-refined" style={{ transition: 'all 0.2s' }}>
                        <td style={{ padding: '0.75rem 1.5rem', background: 'white', borderRadius: '16px 0 0 16px', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', borderLeft: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                              width: '44px', height: '44px', borderRadius: '12px',
                              background: activeSession ? 'var(--primary)' : 'var(--bg-main)',
                              color: activeSession ? 'white' : 'var(--primary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: '1rem', border: '1px solid var(--border-subtle)'
                            }}>
                              {member.name[0]}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0, color: 'var(--text-main)' }}>{member.name}</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>{member.role?.name || 'Practitioner'}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', background: 'white', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 800, padding: '0.4rem 0.8rem', borderRadius: '10px',
                            background: activeSession ? 'rgba(13, 148, 136, 0.1)' : 'rgba(225, 29, 72, 0.05)',
                            color: activeSession ? 'var(--primary)' : '#e11d48',
                            border: `1px solid ${activeSession ? 'rgba(13, 148, 136, 0.2)' : 'rgba(225, 29, 72, 0.1)'}`
                          }}>
                            {activeSession ? 'ON FLOOR' : 'OFF DUTY'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem', background: 'white', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                          {arrival ? arrival.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }) : '-- : --'}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem', background: 'white', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                          {departure ? departure.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }) : '-- : --'}
                        </td>
                        <td style={{ textAlign: 'center', background: 'white', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-main)', padding: '0.4rem 0.75rem', borderRadius: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                            <Clock size={14} />
                            {formatMs(dailyMs)}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right', background: 'white', borderRadius: '0 16px 16px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => togglePresence(member._id, activeSession?.sessionId)}
                              disabled={actionLoading}
                              className="action-btn"
                              style={{
                                padding: '0.6rem', borderRadius: '10px',
                                background: activeSession ? 'rgba(225, 29, 72, 0.05)' : 'rgba(13, 148, 136, 0.05)',
                                color: activeSession ? '#e11d48' : 'var(--primary)',
                                border: `1px solid ${activeSession ? 'rgba(225, 29, 72, 0.1)' : 'rgba(13, 148, 136, 0.1)'}`
                              }}
                            >
                              {activeSession ? <LogOut size={18} /> : <LogIn size={18} />}
                            </button>
                            <button className="action-btn" style={{ padding: '0.6rem', borderRadius: '10px', background: 'var(--bg-main)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                              <Activity size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                width: '100%',
                maxWidth: '100%',
                paddingBottom: '1.5rem',
                boxSizing: 'border-box',
                WebkitOverflowScrolling: 'touch',
              }}
              className="custom-scrollbar"
            >
              <table
                style={{
                  minWidth: `${180 + (monthDaysCount * 48)}px`,
                  width: 'max-content',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                }}
              >
                <thead>
                  <tr style={{ background: 'var(--bg-main)' }}>
                    <th style={{
                      textAlign: 'left', padding: '1.25rem 2rem', position: 'sticky', left: 0,
                      background: 'var(--bg-main)', zIndex: 100, fontSize: '0.7rem',
                      fontWeight: 800, color: 'var(--text-main)', borderRight: '1px solid var(--border-subtle)',
                      textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid var(--border-subtle)',
                      boxShadow: '4px 0 10px -5px rgba(0,0,0,0.08)'
                    }}>STAFF</th>
                    {Array.from({ length: monthDaysCount }).map((_, i) => {
                      const date = new Date(selectedYear, selectedMonth - 1, i + 1);
                      const isSun = date.getDay() === 0;
                      return (
                        <th key={i} style={{
                          padding: '0.75rem 0.25rem', minWidth: '48px', textAlign: 'center',
                          borderRight: '1px solid rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-subtle)',
                          background: isSun ? 'rgba(225, 29, 72, 0.02)' : 'transparent'
                        }}>
                          <p style={{ fontSize: '0.6rem', fontWeight: 800, color: isSun ? '#e11d48' : 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{date.toLocaleDateString(undefined, { weekday: 'short' }).substring(0, 2)}</p>
                          <p style={{ fontSize: '0.78rem', fontWeight: 800, color: isSun ? '#e11d48' : 'var(--text-main)', margin: '1px 0 0' }}>{i + 1}</p>
                        </th>
                      );
                    })}
                    <th style={{ padding: '1rem 1.25rem', minWidth: '80px', textAlign: 'center', background: 'rgba(13, 148, 136, 0.07)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', borderLeft: '2px solid var(--primary)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>Days P</th>
                    <th style={{ padding: '1rem 1.25rem', minWidth: '80px', textAlign: 'center', background: 'rgba(225, 29, 72, 0.07)', fontSize: '0.7rem', fontWeight: 800, color: '#e11d48', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>Days A</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map(member => {
                    let pDays = 0;
                    return (
                      <tr key={member._id} className="matrix-row-hover">
                        <td style={{
                          padding: '0.5rem 2rem', position: 'sticky', left: 0,
                          background: 'white', zIndex: 90, borderRight: '1px solid var(--border-subtle)',
                          borderBottom: '1px solid rgba(0,0,0,0.03)', boxShadow: '4px 0 10px -5px rgba(0,0,0,0.08)'
                        }}>
                          <p style={{ fontWeight: 800, fontSize: '0.85rem', margin: 0, color: 'var(--text-main)', lineHeight: 1.1 }}>{member.name}</p>
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{member.role?.shortName || member.role?.name || 'Staff'}</p>
                        </td>
                        {Array.from({ length: monthDaysCount }).map((_, i) => {
                          const isSun = new Date(selectedYear, selectedMonth - 1, i + 1).getDay() === 0;
                          const dailyLogs = history.filter(h => {
                            const hId = h.staffId?._id?.toString() || h.staffId?.toString();
                            const mId = member._id?.toString() || member.id?.toString();
                            return hId === mId && safeDate(h.checkIn)?.getDate() === (i + 1);
                          });
                          if (dailyLogs.length > 0 && !isSun) pDays++;

                          return (
                            <td key={i} style={{
                              padding: '0.5rem', textAlign: 'center',
                              borderRight: '1px solid rgba(0,0,0,0.03)',
                              borderBottom: '1px solid rgba(0,0,0,0.03)',
                              background: isSun ? 'rgba(225, 29, 72, 0.01)' : 'transparent'
                            }}>
                              {isSun ? (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 800, opacity: 0.4 }}>WO</span>
                              ) : dailyLogs.length > 0 ? (
                                <div
                                  onClick={() => { setModalData(dailyLogs); setShowModal(true); }}
                                  className="attendance-dot present"
                                  title="Present - Click for details"
                                >
                                  P
                                </div>
                              ) : (
                                <div className="attendance-dot absent">A</div>
                              )}
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--primary)', background: 'rgba(13, 148, 136, 0.05)', fontSize: '1rem', borderBottom: '1px solid rgba(0,0,0,0.03)', borderLeft: '2px solid var(--primary)', padding: '0.5rem 1rem' }}>{pDays}</td>
                        <td style={{ textAlign: 'center', fontWeight: 800, color: '#e11d48', background: 'rgba(225, 29, 72, 0.05)', fontSize: '1rem', borderBottom: '1px solid rgba(0,0,0,0.03)', padding: '0.5rem 1rem' }}>{Math.max(0, (monthDaysCount - 4) - pDays)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 🛠️ High-Capacity Details Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '2rem' }}>
          <div className="animate-slide-up glass-premium" style={{ width: '100%', maxWidth: '600px', maxHeight: '85vh', borderRadius: '32px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.6)' }}>
            <div style={{ padding: '2rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.5)' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Shift Analysis</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>Detailed clinical session audit</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                <XCircle size={20} />
              </button>
            </div>

            <div style={{ padding: '2rem 2.5rem', overflowY: 'auto', flex: 1 }} className="custom-scrollbar">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {modalData?.map((log: any, idx: number) => (
                  <div key={idx} style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-subtle)', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <div style={{ position: 'absolute', top: '-10px', left: '20px', background: 'var(--primary)', color: 'white', padding: '2px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800 }}>SEGMENT {idx + 1}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Arrival</p>
                        <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          {safeDate(log.checkIn)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Departure</p>
                        <p style={{ fontSize: '1.1rem', fontWeight: 800, color: log.checkOut ? 'var(--text-main)' : 'var(--primary)', margin: 0 }}>
                          {log.checkOut ? safeDate(log.checkOut)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ACTIVE'}
                        </p>
                      </div>
                    </div>
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Duration:</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>{formatMs(calculateDuration(log.checkIn, log.checkOut || new Date()))}</span>
                    </div>
                  </div>
                ))}
                {modalData?.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>No segments found.</p>}
              </div>
            </div>

            <div style={{ padding: '1.5rem 2.5rem', background: 'rgba(255,255,255,0.5)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'var(--text-main)', color: 'white', padding: '0.75rem 2rem', borderRadius: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .gradient-text {
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
        }
        .table-row-hover-refined:hover td {
          background-color: var(--bg-main) !important;
          transform: translateY(-1px);
        }
        .matrix-row-hover:hover td {
          background-color: rgba(13, 148, 136, 0.02) !important;
        }
        .matrix-row-hover:hover td:first-child {
          background-color: #f8fafc !important;
          box-shadow: 4px 0 15px -5px rgba(0,0,0,0.1);
        }
        .attendance-dot {
          width: 30px; height: 30px; border-radius: 8px; margin: 0 auto;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 900; transition: all 0.2s;
          line-height: 1;
        }
        .attendance-dot.present {
          background: rgba(13, 148, 136, 0.12); color: var(--primary);
          border: 1px solid rgba(13, 148, 136, 0.25); cursor: pointer;
          font-weight: 900;
        }
        .attendance-dot.present:hover {
          background: var(--primary); color: white; transform: scale(1.1);
        }
        .attendance-dot.absent {
          background: rgba(225, 29, 72, 0.08); color: #e11d48;
          border: 1px solid rgba(225, 29, 72, 0.2); font-weight: 900;
        }
        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
          .custom-scrollbar::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 14px; width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc; border-radius: 10px;
          border: 1px solid var(--border-subtle);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--primary); border-radius: 10px; border: 3px solid #f8fafc;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0f766e;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
