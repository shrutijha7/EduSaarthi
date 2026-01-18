import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Layout, User, Bell, ChevronRight } from 'lucide-react';
import bannerImg from '../assets/banner.png';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await api.get('/api/activities');
                setActivities(response.data.data.activities);
            } catch (error) {
                console.error('Error fetching activities:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    const stats = [
        { title: 'Total Assignments', value: '12', icon: Layout, color: 'var(--primary)' },
        { title: 'Files Processed', value: '156', icon: User, color: '#10b981' },
        { title: 'Hours Saved', value: '42.5', icon: Bell, color: '#f59e0b' }
    ];

    const [selectedActivity, setSelectedActivity] = useState(null);

    return (
        <DashboardLayout>
            <div className="glass-card" style={{
                padding: '0',
                maxWidth: 'none',
                marginBottom: '3rem',
                height: '300px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                border: 'none'
            }}>
                <img
                    src={bannerImg}
                    alt="Automation Banner"
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: '0.6'
                    }}
                />
                <div style={{ position: 'relative', zIndex: 1, padding: '3rem', maxWidth: '600px' }}>
                    <h1 style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: '1.1' }}>Accelerate your workflow, {user?.username}!</h1>
                    <p style={{ color: 'var(--text-main)', fontSize: '1.2rem', opacity: '0.9', marginBottom: '1.5rem' }}>
                        Your AI-powered assistant is ready. You have {activities.length > 0 ? 'new automation logs' : 'no pending tasks'} to review.
                    </p>
                    <button
                        className="btn-primary"
                        style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
                        onClick={() => navigate('/courses')}
                    >
                        New Automation <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {stats.map((stat, i) => (
                    <div key={i} className="glass-card" style={{ padding: '2rem', maxWidth: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.75rem', borderRadius: '12px', background: `${stat.color}15`, color: stat.color }}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>{stat.title}</h3>
                        <p style={{ fontSize: '2.25rem', fontWeight: '700' }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <section style={{ marginTop: '4rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Automation History</h2>
                <div className="glass-card" style={{ padding: '0', maxWidth: 'none', overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading logs...</div>
                    ) : activities.length > 0 ? (
                        activities.map((activity, i) => (
                            <div
                                key={i}
                                onClick={() => {
                                    setSelectedActivity(i);
                                    // Navigate to courses/assignments for now as a default action
                                    navigate('/courses');
                                }}
                                style={{
                                    padding: '1.5rem 2rem',
                                    borderBottom: i === activities.length - 1 ? 'none' : '1px solid var(--glass-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1.5rem',
                                    cursor: 'pointer',
                                    background: selectedActivity === i ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Layout size={20} style={{ color: selectedActivity === i ? 'var(--primary)' : 'var(--text-muted)' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{activity.title}</h4>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{activity.description}</p>
                                </div>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{new Date(activity.createdAt).toLocaleDateString()}</span>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No automation history found.</div>
                    )}
                </div>
            </section>
        </DashboardLayout>
    );
};

export default Dashboard;
