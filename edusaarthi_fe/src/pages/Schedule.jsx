import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { Calendar, Clock, Zap, FileText, CheckCircle2, History, Loader2, AlertCircle } from 'lucide-react';

const Schedule = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:3000/api/activities', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setActivities(response.data.data.activities);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching activities:', error);
                setError('Failed to load automation logs');
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    const handleAction = (e, action, title) => {
        e.stopPropagation();
        // Placeholder for real action
    };

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
                <div className="glass-card" style={{ padding: '0', maxWidth: 'none', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(31, 73, 89, 0.1)' }}>
                        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <History size={20} color="var(--primary)" /> Execution History
                        </h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span className="tag" style={{ background: 'var(--primary)', color: 'white' }}>Live</span>
                            <span className="tag">Successful</span>
                        </div>
                    </div>

                    <div style={{ padding: '0' }}>
                        {activities.length === 0 ? (
                            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <AlertCircle size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <p>No automation tasks found in the history.</p>
                            </div>
                        ) : (
                            activities.map((event, i) => (
                                <div
                                    key={event._id}
                                    onClick={() => setSelectedEvent(i)}
                                    style={{
                                        padding: '1.5rem 2rem',
                                        display: 'flex',
                                        gap: '2rem',
                                        borderBottom: i === activities.length - 1 ? 'none' : '1px solid var(--glass-border)',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer',
                                        background: selectedEvent === i ? 'rgba(var(--primary-rgb), 0.08)' : 'transparent',
                                        boxShadow: selectedEvent === i ? '0 8px 16px rgba(0, 0, 0, 0.4)' : 'transparent',
                                        borderLeft: selectedEvent === i ? '4px solid var(--primary)' : 'none'
                                    }} className="schedule-item">
                                    <div style={{ width: '80px', textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: selectedEvent === i ? 'var(--primary)' : 'inherit' }}>
                                            {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {new Date(event.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div style={{ width: '4px', background: 'var(--primary)', borderRadius: '4px', opacity: selectedEvent === i ? 0 : 0.4 }}></div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '1px' }}>{event.type}</div>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', fontWeight: '600' }}>{event.title}</h3>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{event.description}</div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <CheckCircle2 size={20} color="#10b981" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    <div className="glass-card" style={{ padding: '2rem', maxWidth: 'none', background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.2), rgba(var(--primary-rgb), 0.1))' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={20} color="var(--primary)" /> Task Insight
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                                <div key={day} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>{day}</div>
                            ))}
                            {Array.from({ length: 31 }, (_, i) => (
                                <div key={i} style={{
                                    padding: '0.5rem',
                                    fontSize: '0.875rem',
                                    borderRadius: '8px',
                                    background: (i + 1) === new Date().getDate() ? 'var(--primary)' : 'none',
                                    color: (i + 1) === new Date().getDate() ? 'var(--bg-dark)' : 'var(--text-main)',
                                    fontWeight: (i + 1) === new Date().getDate() ? '700' : '400',
                                    cursor: 'pointer',
                                    border: (i + 1) % 7 === 0 ? '1px solid var(--glass-border)' : 'none'
                                }}>
                                    {i + 1}
                                </div>
                            ))}
                        </div>
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
