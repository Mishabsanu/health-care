'use client'
import React, { useState, useEffect } from 'react';
import { usePCMSStore } from '@/store/useStore';
import api from '@/services/api';
import HasPermission from '@/components/HasPermission';
import { usePermission } from '@/hooks/usePermission';

export default function AttendancePage() {
  const { user, showToast } = usePCMSStore();
  const { hasPermission, isMaster } = usePermission();
  const [status, setStatus] = useState<any>({ staffPresent: [] });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualData, setManualData] = useState({
    type: 'Staff',
    staffId: '',
    checkIn: '',
    checkOut: '',
    note: ''
  });

  const [staffList, setStaffList] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 🛡️ Dynamic Authorization Check
      const canManageRegistry = hasPermission('operations:edit');
      
      const requests = [
        api.get('/attendance/status'),
        api.get('/attendance')
      ];
      
      if (canManageRegistry) {
        requests.push(api.get('/attendance/staff'));
      }

      const results = await Promise.allSettled(requests);
      
      if (results[0].status === 'fulfilled' && results[0].value.data) {
        setStatus(results[0].value.data);
      }
      if (results[1].status === 'fulfilled') setHistory(results[1].value.data);
      
      if (canManageRegistry && results[2]) {
        if (results[2].status === 'fulfilled') {
          setStaffList(results[2].value.data);
        }
      }
    } catch (err: any) {
      console.error('🚫 Operational Error | Failed to synchronize registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]); // Re-fetch when user object (permissions) changes

  const handleStaffAction = async () => {
    if (!user) return showToast('🛡️ Synchronizing Identity... Please wait.', 'info');
    
    setActionLoading(true);
    try {
      const staffSession = status?.staffPresent?.find((s: any) => s.id === user?.id);
      if (!staffSession) {
        await api.post('/attendance/check-in', {
          type: 'Staff',
          staffId: user?.id,
          note: 'Staff check-in triggered'
        });
      } else {
        await api.put(`/attendance/check-out/${staffSession.sessionId}`, {
          note: 'Staff checked out'
        });
      }
      await fetchData();
    } catch (err: any) {
      console.error('🚫 Registry Error:', err);
      const msg = err.response?.data?.message || 'Action failed.';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const submitManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/attendance/manual', {
        ...manualData
      });
      setShowManualModal(false);
      await fetchData();
    } catch (err) {
      showToast('Manual entry failed. Validate date/time format.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const calculateDuration = (inTime: string, outTime: string) => {
    if (!outTime) return 'Active';
    const duration = new Date(outTime).getTime() - new Date(inTime).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const toggleUserAttendance = async (staffMember: any) => {
    if (!hasPermission('operations:edit')) return showToast('🚫 Access Denied | Administrative permission required.', 'error');
    
    const activeSession = status?.staffPresent?.find((s: any) => s.id === staffMember._id);
    const userName = user?.name || user?.email || 'Authorized Manager';
    
    setActionLoading(true);
    try {
      if (!activeSession) {
        await api.post('/attendance/check-in', {
          type: 'Staff',
          staffId: staffMember._id,
          note: `Manager-led check-in by ${userName}`
        });
      } else {
        await api.put(`/attendance/check-out/${activeSession.sessionId}`, {
          note: `Manager-led check-out by ${userName}`
        });
      }
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Action failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>🛡️ Synchronizing Operational Registry...</div>;

  if (!hasPermission('operations:view')) {
    return (
      <div style={{ padding: '5rem', textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444', fontWeight: 800 }}>🛡️ Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>You do not have authorization to view clinical operations.</p>
      </div>
    );
  }

  const isStaffCheckedIn = user && status?.staffPresent?.some((s: any) => s.id === user?.id);

  return (
    <div className="attendance-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
            <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.02em' }}>Operations <span className="gradient-text">& Attendance</span></h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage clinical operations and staff attendance.</p>
        </div>
        
        <HasPermission permission="operations:create">
            <button 
                onClick={() => setShowManualModal(true)}
                style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}
            >
                + Manual Log Entry
            </button>
        </HasPermission>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Personal Attendance Quick-Action */}
            <div className="card" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Personal <span className="gradient-text">Attendance</span></h3>
                  <span style={{ 
                    padding: '0.35rem 0.75rem', 
                    borderRadius: '2rem', 
                    fontSize: '0.7rem', 
                    fontWeight: 800,
                    background: isStaffCheckedIn ? 'rgba(15, 118, 110, 0.1)' : '#f1f5f9',
                    color: isStaffCheckedIn ? 'var(--primary)' : 'var(--text-muted)'
                  }}>
                    {isStaffCheckedIn ? 'PRESENT' : 'NOT IN'}
                  </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Your current session status.</p>
              <button 
                onClick={handleStaffAction}
                disabled={actionLoading}
                style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-md)', 
                    background: isStaffCheckedIn ? '#6366f1' : 'var(--text-main)', 
                    color: 'white', 
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                }}
              >
                {actionLoading ? 'Updating...' : (isStaffCheckedIn ? 'CHECK-OUT' : 'CHECK-IN')}
              </button>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Active <span className="gradient-text">Personnel</span></h3>
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>{status?.staffPresent?.length || 0}</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Specialists currently on-site</p>
            </div>
        </div>

        {/* Manager-Led Staff Registry */}
        <HasPermission permission="operations:edit">
          <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Clinical <span className="gradient-text">Staff Registry</span></h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{status?.staffPresent?.length || 0}</span> Specialists Present
                  </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Clinical Specialist</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Current Status</th>
                            <th style={{ textAlign: 'right', padding: '1rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffList.map((member) => {
                            const activeSession = status?.staffPresent?.find((s: any) => s.id === member._id);
                            return (
                              <tr key={member._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                  <td style={{ padding: '1rem' }}>
                                    <p style={{ fontWeight: 700, margin: 0 }}>{member.name}</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{member.role?.name || 'Staff'}</p>
                                  </td>
                                  <td style={{ padding: '1rem' }}>
                                    <span style={{ 
                                        padding: '0.2rem 0.6rem', 
                                        borderRadius: '1rem', 
                                        fontSize: '0.65rem', 
                                        fontWeight: 800,
                                        background: activeSession ? '#dcfce7' : '#f1f5f9',
                                        color: activeSession ? '#15803d' : 'var(--text-muted)'
                                    }}>
                                        {activeSession ? 'PRESENT' : 'AWAY'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button 
                                        onClick={() => toggleUserAttendance(member)}
                                        disabled={actionLoading}
                                        style={{ 
                                          padding: '0.4rem 1rem', 
                                          borderRadius: 'var(--radius-sm)', 
                                          background: activeSession ? '#fee2e2' : 'var(--primary)', 
                                          color: activeSession ? '#b91c1c' : 'white',
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          border: 'none',
                                          cursor: 'pointer'
                                        }}
                                    >
                                        {activeSession ? 'Check-Out' : 'Check-In'}
                                    </button>
                                  </td>
                              </tr>
                            );
                        })}
                      </tbody>
                  </table>
              </div>
          </div>
        </HasPermission>

        {/* Operational Ledger */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Clinical <span className="gradient-text">Operational Ledger</span></h3>
          <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
                          <th style={{ textAlign: 'left', padding: '1rem' }}>Type</th>
                          <th style={{ textAlign: 'left', padding: '1rem' }}>Entity</th>
                          <th style={{ textAlign: 'left', padding: '1rem' }}>In Time</th>
                          <th style={{ textAlign: 'left', padding: '1rem' }}>Out Time</th>
                          <th style={{ textAlign: 'left', padding: '1rem' }}>Duration</th>
                          <th style={{ textAlign: 'left', padding: '1rem' }}>Note</th>
                      </tr>
                  </thead>
                  <tbody>
                      {history.map((record) => (
                          <tr key={record._id} style={{ borderBottom: '1px solid var(--border-subtle)' }} className="table-row-hover">
                              <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>{record.type.toUpperCase()}</td>
                              <td style={{ padding: '1rem' }}>
                                  {(record.staffId?.name || 'Specialist Registry')}
                              </td>
                              <td style={{ padding: '1rem' }}>{new Date(record.checkIn).toLocaleString()}</td>
                              <td style={{ padding: '1rem' }}>{record.checkOut ? new Date(record.checkOut).toLocaleString() : '-'}</td>
                              <td style={{ padding: '1rem' }}>
                                  <span style={{ 
                                      padding: '0.2rem 0.5rem', 
                                      borderRadius: '4px', 
                                      background: record.checkOut ? '#f1f5f9' : '#dcfce7',
                                      fontSize: '0.7rem',
                                      fontWeight: 700
                                  }}>
                                      {calculateDuration(record.checkIn, record.checkOut)}
                                  </span>
                              </td>
                              <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{record.note}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
        </div>
      </div>


      {/* Manual Entry Modal */}
      {showManualModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
             <div className="card glass animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Manual Clinical Session Log</h3>
                <form onSubmit={submitManualEntry}>
                    <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '2rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.5rem' }}>SELECT STAFF</label>
                            <select required value={manualData.staffId} onChange={(e) => setManualData({...manualData, staffId: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                                <option value="">Select Clinical Specialist</option>
                                {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.5rem' }}>IN TIME</label>
                                <input required type="datetime-local" onChange={(e) => setManualData({...manualData, checkIn: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.5rem' }}>OUT TIME</label>
                                <input required type="datetime-local" onChange={(e) => setManualData({...manualData, checkOut: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.5rem' }}>REASON / NOTE</label>
                            <input value={manualData.note} onChange={(e) => setManualData({...manualData, note: e.target.value})} placeholder="e.g., Forgot to sync session" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => setShowManualModal(false)} style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>Cancel</button>
                        <button type="submit" disabled={actionLoading} style={{ background: 'var(--primary)', color: 'white', padding: '0.75rem 2rem', borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
                            {actionLoading ? 'Saving...' : 'Commit Record'}
                        </button>
                    </div>
                </form>
             </div>
        </div>
      )}
    </div>
  );
}
