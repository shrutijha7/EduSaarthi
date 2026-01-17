import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Calendar, Clock, Video, FileText, ChevronRight } from 'lucide-react';

const Schedule = () => {
    const events = [
        {
            time: '09:00 AM',
            duration: '1h 30m',
            title: 'Batch Assignment Processing',
            type: 'System Task',
            processor: 'AI Kernel v4.2',
            color: '#6366f1',
            date: 'Today'
        },
        {
            time: '01:30 PM',
            duration: '45m',
            title: 'Technical Report Synthesis',
            type: 'Generation',
            processor: 'NLP Engine',
            color: '#10b981',
            date: 'Today'
        },
        {
            time: '04:00 PM',
            duration: '2h',
            title: 'Cross-Reference Verification',
            type: 'QA Check',
            processor: 'Compliance Bot',
            color: '#f59e0b',
            date: 'Today'
        },
        {
            time: '10:00 AM',
            duration: '1h',
            title: 'Data Extraction: Lab Reports',
            type: 'System Task',
            processor: 'Vision API',
            color: '#ec4899',
            date: 'Tomorrow'
        }
    ];

    const [selectedEvent, setSelectedEvent] = React.useState(null);

    const handleAction = (e, action, title) => {
        e.stopPropagation();
        alert(`${action} for ${title}`);
    };

    return (
        <DashboardLayout>
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Automation Queue</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Monitor background tasks and scheduled automation sequences.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2.5rem' }}>
                <div className="glass-card" style={{ padding: '0', maxWidth: 'none', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem' }}>Active Tasks</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span className="tag" style={{ background: 'var(--primary)', color: 'white' }}>Today</span>
                            <span className="tag">Queue</span>
                            <span className="tag">History</span>
                        </div>
                    </div>

                    <div style={{ padding: '1rem 0' }}>
                        {events.map((event, i) => (
                            <div
                                key={i}
                                onClick={() => setSelectedEvent(i)}
                                style={{
                                    padding: '1.5rem 2rem',
                                    display: 'flex',
                                    gap: '2rem',
                                    borderBottom: i === events.length - 1 ? 'none' : '1px solid var(--glass-border)',
                                    transition: 'background 0.2s',
                                    cursor: 'pointer',
                                    background: selectedEvent === i ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
                                }} className="schedule-item">
                                <div style={{ width: '80px', textAlign: 'right' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: '700' }}>{event.time}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{event.duration}</div>
                                </div>

                                <div style={{ width: '4px', background: event.color, borderRadius: '4px' }}></div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ color: event.color, fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{event.type}</div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{event.title}</h3>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{event.processor}</div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    {event.type.includes('Generation') ? (
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '0.5rem 1rem', width: 'auto', borderRadius: '8px', fontSize: '0.875rem', background: event.color }}
                                            onClick={(e) => handleAction(e, 'Monitoring Task', event.title)}
                                        >
                                            <Zap size={16} /> Monitor
                                        </button>
                                    ) : (
                                        <button
                                            style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--glass-border)',
                                                background: 'none',
                                                color: 'var(--text-main)',
                                                fontSize: '0.875rem',
                                                cursor: 'pointer'
                                            }}
                                            onClick={(e) => handleAction(e, 'Viewing Logs', event.title)}
                                        >
                                            View Logs
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '2rem', maxWidth: 'none', height: 'fit-content' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Queue Calendar</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                            <div key={day} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{day}</div>
                        ))}
                        {Array.from({ length: 31 }, (_, i) => (
                            <div key={i} style={{
                                padding: '0.5rem',
                                fontSize: '0.875rem',
                                borderRadius: '8px',
                                background: (i + 1) === 16 ? 'var(--primary)' : 'none',
                                color: (i + 1) === 16 ? 'white' : 'var(--text-main)',
                                cursor: 'pointer',
                                border: [9, 16, 23].includes(i + 1) ? '1px solid var(--primary)' : 'none'
                            }}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '2rem' }}>
                        <h4 style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Queue Stats</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>14 Active Tasks</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currently in pipeline</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>8 Completed Today</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Successfully processed</div>
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
