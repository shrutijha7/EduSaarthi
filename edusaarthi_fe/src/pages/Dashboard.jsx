import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout, User, Bell, ChevronRight } from 'lucide-react';
import bannerImg from '../assets/banner.png';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role === 'student') {
            navigate('/student/dashboard');
        }
    }, [user, navigate]);

    const stats = [
        { title: 'Total Assignments', value: '12', icon: Layout, color: 'var(--primary)' },
        { title: 'Files Processed', value: '156', icon: '#10b981', iconComponent: User },
        { title: 'Hours Saved', value: '42.5', icon: '#f59e0b', iconComponent: Bell }
    ];

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const response = await api.get('/api/activities');
                setActivities(response.data.data.activities.slice(0, 4));
            } catch (error) {
                console.error('Error fetching activities:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchActivities();
    }, []);

    return (
        <DashboardLayout>
            <div className="glass-card" style={{
                padding: '0',
                maxWidth: 'none',
                marginBottom: '2rem',
                height: '240px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                border: 'none',
                borderRadius: '20px'
            }}>
                <img
                    src={bannerImg}
                    alt="Automation Banner"
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: '0.5'
                    }}
                />
                <div style={{ position: 'relative', zIndex: 1, padding: '2.5rem', maxWidth: '600px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', lineHeight: '1.1' }}>Welcome back, {user?.username}!</h1>
                    <p style={{ color: 'var(--text-main)', fontSize: '1.1rem', opacity: '0.8', marginBottom: '1.5rem' }}>
                        Your AI assistant has processed 12 documents today.
                    </p>
                    <button
                        className="btn-primary"
                        style={{ width: 'auto', padding: '0.6rem 1.2rem' }}
                        onClick={() => navigate('/subjects')}
                    >
                        New Subject <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {stats.map((stat, i) => (
                    <div key={i} className="glass-card" style={{
                        padding: '1.25rem 1.5rem',
                        maxWidth: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem'
                    }}>
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '12px',
                            background: `${stat.color || stat.icon}15`,
                            color: stat.color || stat.icon,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {stat.iconComponent ? <stat.iconComponent size={24} /> : <stat.icon size={24} />}
                        </div>
                        <div>
                            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.1rem' }}>{stat.title}</h3>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Section */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Recent Activity</h2>
                    <button
                        onClick={() => navigate('/history')}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
                    >
                        View all
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="glass-card" style={{ height: '100px', opacity: 0.5 }}></div>)
                    ) : activities.length > 0 ? (
                        activities.map((activity, i) => (
                            <div key={i} className="glass-card" style={{ padding: '1.25rem', maxWidth: 'none', cursor: 'pointer' }} onClick={() => navigate('/history')}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                        <Layout size={20} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activity.title}</h4>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activity.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No recent activity found.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
