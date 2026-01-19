import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Clock, Zap, FileText, CheckCircle2, History, Loader2, AlertCircle } from 'lucide-react';

const Schedule = () => {
    const [searchParams] = useSearchParams();
    const [activities, setActivities] = useState([]);
    const [scheduledTasks, setScheduledTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [error, setError] = useState(null);

    // Calendar States
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewDate, setViewDate] = useState(new Date());

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [actRes, schRes] = await Promise.all([
                    api.get('/api/activities'),
                    api.get('/api/activities/scheduled')
                ]);
                setActivities(actRes.data.data.activities);
                setScheduledTasks(schRes.data.data.tasks);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load automation queue');
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const generateCalendarDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const days = [];
        const totalDays = daysInMonth(year, month);
        const startingDay = firstDayOfMonth(year, month);

        // Padding for previous month
        for (let i = 0; i < startingDay; i++) {
            days.push({ day: null, currentMonth: false });
        }

        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            days.push({
                day: i,
                currentMonth: true,
                date: new Date(year, month, i)
            });
        }

        return days;
    };

    const isSelected = (date) => {
        return date &&
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
    };

    const hasActivity = (date) => {
        if (!date) return false;
        const existsInActivities = activities.some(act => {
            const actDate = new Date(act.createdAt);
            return actDate.getDate() === date.getDate() &&
                actDate.getMonth() === date.getMonth() &&
                actDate.getFullYear() === date.getFullYear();
        });
        const existsInScheduled = scheduledTasks.some(task => {
            const taskDate = new Date(task.scheduledDate);
            return taskDate.getDate() === date.getDate() &&
                taskDate.getMonth() === date.getMonth() &&
                taskDate.getFullYear() === date.getFullYear();
        });
        return existsInActivities || existsInScheduled;
    };

    const filteredActivities = activities.filter(act => {
        const actDate = new Date(act.createdAt);
        const matchesDate = actDate.getDate() === selectedDate.getDate() &&
            actDate.getMonth() === selectedDate.getMonth() &&
            actDate.getFullYear() === selectedDate.getFullYear();

        const q = searchParams.get('q')?.toLowerCase() || '';
        const matchesSearch = act.title.toLowerCase().includes(q) ||
            act.description.toLowerCase().includes(q) ||
            act.type.toLowerCase().includes(q);

        return matchesDate && matchesSearch;
    });

    const filteredScheduled = scheduledTasks.filter(task => {
        const taskDate = new Date(task.scheduledDate);
        const matchesDate = taskDate.getDate() === selectedDate.getDate() &&
            taskDate.getMonth() === selectedDate.getMonth() &&
            taskDate.getFullYear() === selectedDate.getFullYear();

        const q = searchParams.get('q')?.toLowerCase() || '';
        const matchesSearch = task.originalFileName.toLowerCase().includes(q) ||
            task.taskType.toLowerCase().includes(q);

        return matchesDate && matchesSearch;
    });

    const allItems = [
        ...filteredScheduled.map(t => ({ ...t, isScheduled: true, title: `Scheduled: ${t.originalFileName}`, description: `Planned execution for ${new Date(t.scheduledDate).toLocaleTimeString()}`, type: t.taskType, createdAt: t.scheduledDate })),
        ...filteredActivities.map(a => ({ ...a, isScheduled: false }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
                    <Loader2 className="animate-spin" size={40} color="var(--primary)" />
                    <p style={{ color: 'var(--text-muted)' }}>Retrieving automation queue...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: '700' }}>Automation Queue</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Monitor background tasks and execution history.</p>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '2.5rem',
                alignItems: 'start'
            }}>
                {/* History Section */}
                <div className="glass-card" style={{ padding: '0', maxWidth: 'none', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(var(--primary-rgb), 0.05)' }}>
                        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <History size={20} color="var(--primary)" />
                            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Tasks
                        </h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span className="tag" style={{ background: 'var(--primary)', color: 'white' }}>{allItems.length} Total</span>
                        </div>
                    </div>

                    <div style={{ padding: '0', maxHeight: '600px', overflowY: 'auto' }}>
                        {allItems.length === 0 ? (
                            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <AlertCircle size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <p>No automation tasks for this date.</p>
                            </div>
                        ) : (
                            allItems.map((event, i) => (
                                <div
                                    key={event._id}
                                    onClick={() => setSelectedEvent(i)}
                                    style={{
                                        padding: '1.5rem 2rem',
                                        display: 'flex',
                                        gap: '2rem',
                                        borderBottom: i === allItems.length - 1 ? 'none' : '1px solid var(--glass-border)',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer',
                                        background: selectedEvent === i ? 'rgba(var(--primary-rgb), 0.08)' : 'transparent',
                                        borderLeft: selectedEvent === i ? '4px solid var(--primary)' : (event.isScheduled ? '4px solid #f59e0b' : 'none')
                                    }} className="schedule-item">
                                    <div style={{ width: '80px', textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: selectedEvent === i ? 'var(--primary)' : 'inherit' }}>
                                            {new Date(event.createdAt || event.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: event.isScheduled ? '#f59e0b' : 'var(--primary)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {event.type} {event.isScheduled && <Clock size={12} />}
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', fontWeight: '600' }}>{event.title}</h3>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{event.description}</div>
                                    </div>
                                    {event.isScheduled ? (
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f59e0b', opacity: 0.5 }}></div>
                                    ) : (
                                        <CheckCircle2 size={20} color="#10b981" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Calendar & Details Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    {/* Interactive Calendar Card */}
                    <div className="glass-card" style={{ padding: '2rem', maxWidth: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={20} color="var(--primary)" />
                                {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '5px' }}>&lt;</button>
                                <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '5px' }}>&gt;</button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                                <div key={day} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', paddingBottom: '0.5rem' }}>{day}</div>
                            ))}
                            {generateCalendarDays().map((item, i) => (
                                <div
                                    key={i}
                                    onClick={() => item.day && setSelectedDate(item.date)}
                                    style={{
                                        position: 'relative',
                                        padding: '0.75rem 0',
                                        fontSize: '0.875rem',
                                        borderRadius: '10px',
                                        cursor: item.day ? 'pointer' : 'default',
                                        background: isSelected(item.date) ? 'var(--primary)' : 'none',
                                        color: isSelected(item.date) ? 'var(--bg-dark)' : (item.day ? 'var(--text-main)' : 'transparent'),
                                        fontWeight: isSelected(item.date) ? '700' : '400',
                                        border: item.day ? '1px solid transparent' : 'none',
                                        transition: 'all 0.2s',
                                        opacity: item.day ? 1 : 0
                                    }}
                                    className={item.day ? "calendar-day" : ""}
                                >
                                    {item.day}
                                    {hasActivity(item.date) && !isSelected(item.date) && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '4px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '4px',
                                            height: '4px',
                                            borderRadius: '50%',
                                            background: 'var(--primary)'
                                        }}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Task Insight Card (Contextual) */}
                    <div className="glass-card" style={{ padding: '2rem', maxWidth: 'none', background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.15), rgba(var(--primary-rgb), 0.05))' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                            <Zap size={18} /> Detailed Insights
                        </h3>

                        {selectedEvent !== null && allItems[selectedEvent] ? (
                            <div className="animate-slide-up">
                                <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: allItems[selectedEvent].isScheduled ? '#f59e0b' : 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                                        {allItems[selectedEvent].type} {allItems[selectedEvent].isScheduled ? 'Draft' : 'Report'}
                                    </div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>{allItems[selectedEvent].title}</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>{allItems[selectedEvent].description}</p>
                                </div>

                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{allItems[selectedEvent].isScheduled ? 'Scheduled ID' : 'Sync ID'}</div>
                                        <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-main)' }}>{allItems[selectedEvent]._id}</div>
                                    </div>

                                    {allItems[selectedEvent].isScheduled ? (
                                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Target Date</div>
                                            <div style={{ fontWeight: '600', color: '#f59e0b' }}>{new Date(allItems[selectedEvent].scheduledDate).toLocaleString()}</div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Execution Status</div>
                                            <div style={{ fontWeight: '600', color: '#10b981' }}>Success (Verified)</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <FileText size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Select a task from the list to view its technical breakdown and execution metrics.</p>
                            </div>
                        )}
                    </div>

                    <div className="glass-card" style={{ padding: '2rem', maxWidth: 'none' }}>
                        <h4 style={{ fontSize: '1rem', marginBottom: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>Network Health</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{activities.length} Processed</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total automated tasks</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>Real-time</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last synced: Just now</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Schedule;
