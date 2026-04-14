'use client';

import React, { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/services/api';
import { usePCMSStore } from '@/store/useStore';
import styles from './page.module.css';
import {
  Activity,
  Calendar,
  Clock,
  Download,
  Eye,
  LogIn,
  LogOut,
  Search,
  Users,
  XCircle,
} from 'lucide-react';

type ApiDateValue =
  | string
  | number
  | Date
  | { $date?: string | number | Date }
  | null
  | undefined;

interface StaffMember {
  _id: string;
  id?: string;
  name: string;
  role?: { name?: string | null } | null;
}

interface ActiveSession {
  id: string;
  sessionId?: string;
  checkIn?: ApiDateValue;
}

interface AttendanceStatus {
  staffPresent: ActiveSession[];
}

interface StaffReference {
  _id?: string;
  id?: string;
  name?: string;
}

interface AttendanceLog {
  _id?: string;
  staffId?: string | StaffReference | null;
  checkIn?: ApiDateValue;
  checkOut?: ApiDateValue | null;
}

interface ModalHeader {
  title: string;
  subtitle: string;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const YEAR_OPTIONS = Array.from(
  { length: 4 },
  (_, index) => new Date().getFullYear() - 2 + index
);

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const cn = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ');

const getEntityId = (
  entity?: string | { _id?: string; id?: string } | null
) => {
  if (!entity) return '';
  return typeof entity === 'string' ? entity : entity._id || entity.id || '';
};

const safeDate = (value: ApiDateValue) => {
  if (!value) return null;

  const rawValue =
    typeof value === 'object' && !(value instanceof Date) && '$date' in value
      ? value.$date
      : value;

  const parsed = rawValue instanceof Date ? rawValue : new Date(rawValue as string | number);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatTime = (value: ApiDateValue) => {
  const parsed = safeDate(value);
  if (!parsed) return '-- : --';
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateLabel = (value: Date) =>
  value.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

const getDisplayNameFromLog = (log: AttendanceLog) => {
  if (typeof log.staffId === 'string') return 'Staff member';
  return log.staffId?.name || 'Staff member';
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
  ) {
    return error.response.data.message;
  }

  return fallback;
};

export default function AttendancePage() {
  const { user, showToast } = usePCMSStore();

  const [teamSubTab, setTeamSubTab] = useState<'day' | 'register'>('day');
  const [status, setStatus] = useState<AttendanceStatus>({ staffPresent: [] });
  const [history, setHistory] = useState<AttendanceLog[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalHeader, setModalHeader] = useState<ModalHeader>({
    title: 'Shift Audit',
    subtitle: 'Detailed attendance segments for the selected period.',
  });
  const [modalData, setModalData] = useState<AttendanceLog[]>([]);

  const monthLabel = MONTHS[selectedMonth - 1];
  const monthDaysCount = new Date(selectedYear, selectedMonth, 0).getDate();
  const todayKey = new Date().toDateString();
  const firstName = user?.name?.trim()?.split(' ')[0] || 'Team';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, historyRes, staffRes] = await Promise.all([
        api.get('/attendance/status'),
        api.get(`/attendance?month=${selectedMonth}&year=${selectedYear}`),
        api.get('/attendance/staff'),
      ]);

      setStatus({
        staffPresent: Array.isArray(statusRes.data?.staffPresent)
          ? statusRes.data.staffPresent
          : [],
      });
      setHistory(
        Array.isArray(historyRes.data)
          ? historyRes.data
          : Array.isArray(historyRes.data?.data)
            ? historyRes.data.data
            : []
      );
      setStaffList(
        Array.isArray(staffRes.data)
          ? staffRes.data
          : Array.isArray(staffRes.data?.data)
            ? staffRes.data.data
            : []
      );
    } catch (error) {
      console.error('Attendance fetch failed:', error);
      showToast('Could not load attendance data.', 'error');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [selectedMonth, selectedYear, showToast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const calculateDuration = (inTime: ApiDateValue, outTime: ApiDateValue) => {
    const start = safeDate(inTime);
    const end = safeDate(outTime);
    if (!start || !end) return 0;
    return end.getTime() - start.getTime();
  };

  const formatMs = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const openLogModal = (
    logs: AttendanceLog[],
    title: string,
    subtitle: string
  ) => {
    if (!logs.length) {
      showToast('No attendance logs available for this selection.', 'info');
      return;
    }

    setModalHeader({ title, subtitle });
    setModalData(logs);
    setShowModal(true);
  };

  const togglePresence = async (staffId: string, currentSessionId?: string) => {
    setActionLoadingId(staffId);
    try {
      if (!currentSessionId) {
        await api.post('/attendance/check-in', { staffId });
        showToast('Check-in recorded successfully.', 'success');
      } else {
        await api.put(`/attendance/check-out/${currentSessionId}`);
        showToast('Check-out recorded successfully.', 'success');
      }

      await fetchData();
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Attendance action failed.'), 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredStaff = staffList.filter((member) =>
    member.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const workforceSize = filteredStaff.length;
  const presentCount =
    status.staffPresent.filter((entry) =>
      filteredStaff.some((member) => getEntityId(member) === entry.id)
    ).length || 0;
  const absentCount = Math.max(0, workforceSize - presentCount);
  const clinicalPulse = workforceSize > 0 ? Math.round((presentCount / workforceSize) * 100) : 0;
  const trackedDays = new Set(
    history
      .map((entry) => safeDate(entry.checkIn)?.toDateString())
      .filter((value): value is string => Boolean(value))
  ).size;
  const coverageRatio = monthDaysCount > 0 ? Math.round((trackedDays / monthDaysCount) * 100) : 0;
  const activeSessions = status.staffPresent.length;
  const totalSessions = history.length;

  const handleExportAudit = () => {
    if (!filteredStaff.length) {
      showToast('There are no staff rows to export right now.', 'info');
      return;
    }

    const headers = [
      'Staff Name',
      'Role',
      'Current Status',
      'First Check In Today',
      'Last Check Out Today',
      'Worked Today',
      'Sessions This Month',
    ];

    const rows = filteredStaff.map((member) => {
      const memberId = getEntityId(member);
      const activeSession = status.staffPresent.find((entry) => entry.id === memberId);
      const todayLogs = history.filter((entry) => {
        const logDate = safeDate(entry.checkIn);
        return getEntityId(entry.staffId) === memberId && logDate?.toDateString() === todayKey;
      });

      const finishedLogs = todayLogs.filter((entry) => safeDate(entry.checkOut));
      const firstCheckIn = todayLogs[0]?.checkIn || activeSession?.checkIn;
      const lastCheckOut = finishedLogs[finishedLogs.length - 1]?.checkOut;

      const workedMilliseconds = todayLogs.reduce((total, entry) => {
        const endTime = entry.checkOut || new Date();
        return total + calculateDuration(entry.checkIn, endTime);
      }, 0);

      return [
        member.name,
        member.role?.name || 'Practitioner',
        activeSession ? 'On floor' : 'Off duty',
        formatTime(firstCheckIn),
        formatTime(lastCheckOut),
        formatMs(workedMilliseconds),
        history.filter((entry) => getEntityId(entry.staffId) === memberId).length,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `attendance-audit-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 0);

    showToast('Attendance audit exported.', 'success');
  };

  const renderRegisterCells = () => {
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();
    const cells: React.ReactNode[] = [];

    for (let paddingIndex = 0; paddingIndex < firstDay; paddingIndex += 1) {
      cells.push(<div key={`pad-${paddingIndex}`} className={styles.calendarPad} />);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const dateObject = new Date(selectedYear, selectedMonth - 1, day);
      const isToday = dateObject.toDateString() === todayKey;
      const isSunday = dateObject.getDay() === 0;

      const dailyLogs = history.filter((entry) => {
        const checkIn = safeDate(entry.checkIn);
        return (
          checkIn?.getDate() === day &&
          checkIn.getMonth() === selectedMonth - 1 &&
          checkIn.getFullYear() === selectedYear
        );
      });

      const presentIds = Array.from(
        new Set(dailyLogs.map((entry) => getEntityId(entry.staffId)).filter(Boolean))
      );

      const visibleMembers = filteredStaff.filter((member) =>
        presentIds.includes(getEntityId(member))
      );
      const previewMembers = visibleMembers.slice(0, 3);
      const remainingCount = Math.max(0, visibleMembers.length - previewMembers.length);
      const presenceRatio = workforceSize > 0 ? Math.round((presentIds.length / workforceSize) * 100) : 0;

      cells.push(
        <button
          key={day}
          type="button"
          disabled={!dailyLogs.length}
          onClick={() =>
            openLogModal(
              dailyLogs,
              `${formatDateLabel(dateObject)} Attendance`,
              `${dailyLogs.length} session segment${dailyLogs.length === 1 ? '' : 's'} recorded for this day.`
            )
          }
          className={cn(
            styles.calendarCell,
            isToday && styles.calendarCellToday,
            isSunday && styles.calendarCellSunday,
            !isSunday && !dailyLogs.length && styles.calendarCellQuiet
          )}
        >
          <div className={styles.calendarCellHeader}>
            <span className={styles.calendarDay}>{day}</span>
            <span className={styles.calendarHint}>
              {isSunday ? 'Weekend' : dailyLogs.length ? 'Open log' : 'No logs'}
            </span>
          </div>

          {isSunday ? (
            <div className={styles.calendarOffState}>
              <Clock size={16} />
              <span>Rest day</span>
            </div>
          ) : (
            <>
              <div className={styles.calendarRatio}>
                <span>{presentIds.length} present</span>
                <span>{presenceRatio}%</span>
              </div>

              {previewMembers.length > 0 ? (
                <div className={styles.calendarMembers}>
                  {previewMembers.map((member) => (
                    <div key={member._id} className={styles.memberPill}>
                      <span className={styles.memberAvatar}>
                        {member.name?.trim()?.charAt(0).toUpperCase() || '?'}
                      </span>
                      <span>{member.name.split(' ')[0]}</span>
                    </div>
                  ))}
                  {remainingCount > 0 ? (
                    <div className={styles.moreMembers}>+{remainingCount} more</div>
                  ) : null}
                </div>
              ) : (
                <p className={styles.calendarEmptyText}>
                  {dailyLogs.length ? 'Logs available' : 'No sessions logged'}
                </p>
              )}

              <div className={styles.progressTrack}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${presenceRatio}%` }}
                />
              </div>
            </>
          )}
        </button>
      );
    }

    return cells;
  };

  if (loading && !hasLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <div className={cn(styles.page, 'animate-fade-in')}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} />

        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Attendance Desk</span>
          <h1 className={styles.heroTitle}>
            Clinical <span>Attendance</span>
          </h1>
          <p className={styles.heroText}>
            Keep a live eye on floor coverage, daily movement, and monthly attendance
            trends from one calmer workspace.
          </p>

          <div className={styles.heroBadges}>
            <span className={styles.heroBadge}>Hello, {firstName}</span>
            <span className={styles.heroBadge}>{trackedDays}/{monthDaysCount} days tracked</span>
            <span className={styles.heroBadge}>{totalSessions} session logs this month</span>
          </div>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.searchField}>
            <Search size={18} className={styles.searchIcon} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search staff name..."
              className={cn('input-premium', styles.searchInput)}
            />
          </div>

          <div className={styles.panelControls}>
            <div className={styles.selectGroup}>
              <label className={styles.controlLabel}>Month</label>
              <div className={styles.selectWrap}>
                <Calendar size={16} />
                <select
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(Number(event.target.value))}
                  className={styles.selectInput}
                >
                  {MONTHS.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.selectGroup}>
              <label className={styles.controlLabel}>Year</label>
              <div className={styles.selectWrap}>
                <Clock size={16} />
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                  className={styles.selectInput}
                >
                  {YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button type="button" onClick={handleExportAudit} className={styles.exportButton}>
            <Download size={18} />
            Export Audit
          </button>

          <div className={styles.panelFootnote}>
            <span className={styles.liveDot} />
            {loading ? 'Refreshing live attendance data...' : `${monthLabel} ${selectedYear} is in sync.`}
          </div>
        </div>
      </section>

      <section className={styles.statsGrid}>
        {[
          {
            label: 'Live Coverage',
            value: `${clinicalPulse}%`,
            detail: `${presentCount} of ${workforceSize} staff are currently active`,
            icon: Activity,
            accentColor: '#0f766e',
            accentSurface: 'rgba(15, 118, 110, 0.1)',
          },
          {
            label: 'Present Now',
            value: presentCount,
            detail: `${activeSessions} open session${activeSessions === 1 ? '' : 's'} on the floor`,
            icon: Users,
            accentColor: '#0ea5e9',
            accentSurface: 'rgba(14, 165, 233, 0.1)',
          },
          {
            label: 'Absent Today',
            value: absentCount,
            detail: 'Staff outside the current active attendance set',
            icon: XCircle,
            accentColor: '#e11d48',
            accentSurface: 'rgba(225, 29, 72, 0.1)',
          },
          {
            label: 'Month Coverage',
            value: `${coverageRatio}%`,
            detail: `${trackedDays} tracked day${trackedDays === 1 ? '' : 's'} across ${monthDaysCount} days`,
            icon: Calendar,
            accentColor: '#f59e0b',
            accentSurface: 'rgba(245, 158, 11, 0.12)',
          },
        ].map((card) => (
          <article
            key={card.label}
            className={styles.statCard}
            style={
              {
                '--accent-color': card.accentColor,
                '--accent-surface': card.accentSurface,
              } as React.CSSProperties
            }
          >
            <div className={styles.statIcon}>
              <card.icon size={20} />
            </div>
            <div className={styles.statLabel}>{card.label}</div>
            <div className={styles.statValue}>{card.value}</div>
            <p className={styles.statDetail}>{card.detail}</p>
          </article>
        ))}
      </section>

      <section className={styles.workspace}>
        <div className={styles.workspaceHeader}>
          <div className={styles.segmentedControl}>
            <button
              type="button"
              onClick={() => setTeamSubTab('day')}
              className={cn(styles.segmentButton, teamSubTab === 'day' && styles.segmentButtonActive)}
            >
              Daily Board
            </button>
            <button
              type="button"
              onClick={() => setTeamSubTab('register')}
              className={cn(styles.segmentButton, teamSubTab === 'register' && styles.segmentButtonActive)}
            >
              Monthly Register
            </button>
          </div>

          <div className={styles.headerMeta}>
            <span className={styles.metaPill}>{monthLabel} {selectedYear}</span>
            <span className={styles.metaPill}>{filteredStaff.length} visible staff</span>
            {loading ? <span className={styles.metaPillLive}>Syncing...</span> : null}
          </div>
        </div>

        {teamSubTab === 'day' ? (
          <div className={styles.viewSection}>
            <div className={styles.sectionIntro}>
              <div>
                <h2 className={styles.sectionTitle}>Today&apos;s Floor Board</h2>
                <p className={styles.sectionText}>
                  Review check-in state, arrival time, shift duration, and quick actions
                  without leaving the page.
                </p>
              </div>

              <div className={styles.legendRow}>
                <span className={styles.legendItem}>
                  <span className={cn(styles.legendDot, styles.legendDotActive)} />
                  On floor
                </span>
                <span className={styles.legendItem}>
                  <span className={cn(styles.legendDot, styles.legendDotInactive)} />
                  Off duty
                </span>
              </div>
            </div>

            {filteredStaff.length === 0 ? (
              <div className={styles.emptyState}>
                <Search size={22} />
                <h3>No staff match this search</h3>
                <p>Try a different name or clear the search field to see the full roster.</p>
              </div>
            ) : (
              <div className={styles.tableShell}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Status</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Worked</th>
                      <th className={styles.actionsHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((member) => {
                      const memberId = getEntityId(member);
                      const activeSession = status.staffPresent.find((entry) => entry.id === memberId);

                      const todayLogs = history.filter((entry) => {
                        const logDate = safeDate(entry.checkIn);
                        return (
                          getEntityId(entry.staffId) === memberId &&
                          logDate?.toDateString() === todayKey
                        );
                      });

                      const fallbackActiveLog =
                        activeSession && todayLogs.length === 0
                          ? [
                              {
                                staffId: {
                                  _id: member._id,
                                  name: member.name,
                                },
                                checkIn: activeSession.checkIn,
                                checkOut: null,
                              } satisfies AttendanceLog,
                            ]
                          : [];

                      const sessionLogs = todayLogs.length > 0 ? todayLogs : fallbackActiveLog;
                      const firstArrival = todayLogs[0]?.checkIn || activeSession?.checkIn;
                      const finishedLogs = todayLogs.filter((entry) => safeDate(entry.checkOut));
                      const lastDeparture = finishedLogs[finishedLogs.length - 1]?.checkOut;

                      const workedMilliseconds = todayLogs.reduce((total, entry) => {
                        const checkOutTime = entry.checkOut || new Date();
                        return total + calculateDuration(entry.checkIn, checkOutTime);
                      }, 0);

                      const liveWorkedMilliseconds = activeSession
                        ? calculateDuration(activeSession.checkIn, new Date())
                        : 0;
                      const totalWorked = todayLogs.length > 0 ? workedMilliseconds : liveWorkedMilliseconds;

                      return (
                        <tr key={member._id}>
                          <td>
                            <div className={styles.staffCell}>
                              <div className={cn(styles.avatar, activeSession && styles.avatarActive)}>
                                {member.name?.trim()?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div>
                                <div className={styles.staffName}>{member.name}</div>
                                <div className={styles.staffRole}>
                                  {member.role?.name || 'Practitioner'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className={cn(
                                styles.statusBadge,
                                activeSession ? styles.statusBadgeActive : styles.statusBadgeInactive
                              )}
                            >
                              {activeSession ? 'On floor' : 'Off duty'}
                            </span>
                          </td>
                          <td className={styles.timeCell}>{formatTime(firstArrival)}</td>
                          <td className={styles.timeCellMuted}>{formatTime(lastDeparture)}</td>
                          <td>
                            <span className={styles.durationChip}>
                              <Clock size={14} />
                              {formatMs(totalWorked)}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionGroup}>
                              <button
                                type="button"
                                title={activeSession ? 'Check out' : 'Check in'}
                                disabled={actionLoadingId === member._id}
                                onClick={() => togglePresence(member._id, activeSession?.sessionId)}
                                className={cn(
                                  styles.iconButton,
                                  activeSession ? styles.iconButtonDanger : styles.iconButtonPrimary
                                )}
                              >
                                {activeSession ? <LogOut size={18} /> : <LogIn size={18} />}
                              </button>

                              <button
                                type="button"
                                title="View today log"
                                onClick={() =>
                                  openLogModal(
                                    sessionLogs,
                                    `${member.name} Shift Audit`,
                                    'Today\'s attendance segments for this staff member.'
                                  )
                                }
                                className={cn(styles.iconButton, styles.iconButtonNeutral)}
                              >
                                <Eye size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.viewSection}>
            <div className={styles.sectionIntro}>
              <div>
                <h2 className={styles.sectionTitle}>Monthly Attendance Register</h2>
                <p className={styles.sectionText}>
                  Scan the month at a glance, open any recorded day, and spot gaps in the
                  attendance trail faster.
                </p>
              </div>

              <div className={styles.legendRow}>
                <span className={styles.legendItem}>
                  <span className={cn(styles.legendDot, styles.legendDotCalendar)} />
                  Logged day
                </span>
                <span className={styles.legendItem}>
                  <span className={cn(styles.legendDot, styles.legendDotQuiet)} />
                  No log
                </span>
                <span className={styles.legendItem}>
                  <span className={cn(styles.legendDot, styles.legendDotSunday)} />
                  Weekend
                </span>
              </div>
            </div>

            <div className={styles.registerMetrics}>
              <article className={styles.miniCard}>
                <span className={styles.miniLabel}>Staff in view</span>
                <strong>{workforceSize}</strong>
                <p>Current search scope</p>
              </article>
              <article className={styles.miniCard}>
                <span className={styles.miniLabel}>Tracked days</span>
                <strong>{trackedDays}</strong>
                <p>Days with at least one attendance entry</p>
              </article>
              <article className={styles.miniCard}>
                <span className={styles.miniLabel}>Session logs</span>
                <strong>{totalSessions}</strong>
                <p>Recorded in {monthLabel} {selectedYear}</p>
              </article>
            </div>

            <div className={styles.calendarShell}>
              <div className={styles.weekdayRow}>
                {WEEK_DAYS.map((day) => (
                  <div key={day} className={styles.weekdayLabel}>
                    {day}
                  </div>
                ))}
              </div>

              <div className={styles.calendarGrid}>{renderRegisterCells()}</div>
            </div>
          </div>
        )}
      </section>

      {showModal ? (
        <div className={styles.modalBackdrop}>
          <div className={cn(styles.modalCard, 'animate-slide-up')}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderInfo}>
                <div className={styles.modalHeaderIcon}>
                  <Activity size={20} />
                </div>
                <div>
                  <h3>{modalHeader.title}</h3>
                  <p>{modalHeader.subtitle}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={styles.modalClose}
                aria-label="Close attendance details"
              >
                <XCircle size={22} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {modalData.map((log, index) => (
                <article key={log._id || `${getEntityId(log.staffId)}-${index}`} className={styles.logCard}>
                  <div className={styles.logCardTop}>
                    <div>
                      <span className={styles.logIndex}>Segment {index + 1}</span>
                      <h4>{getDisplayNameFromLog(log)}</h4>
                    </div>
                    <span className={styles.logDuration}>
                      {formatMs(calculateDuration(log.checkIn, log.checkOut || new Date()))}
                    </span>
                  </div>

                  <div className={styles.logGrid}>
                    <div>
                      <span className={styles.logLabel}>Check in</span>
                      <strong>{formatTime(log.checkIn)}</strong>
                    </div>
                    <div>
                      <span className={styles.logLabel}>Check out</span>
                      <strong>{log.checkOut ? formatTime(log.checkOut) : 'Active session'}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className={styles.modalFooter}>
              <button type="button" onClick={() => setShowModal(false)} className={styles.closeButton}>
                Close Audit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
