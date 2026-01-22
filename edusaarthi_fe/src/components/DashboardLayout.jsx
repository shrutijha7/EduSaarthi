import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Bell, Settings, Search, LayoutGrid, BookOpen, Clock, Zap } from 'lucide-react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [showNotifications, setShowNotifications] = useState(false);
    const [activities, setActivities] = useState([]);
    const notificationRef = useRef(null);

    const searchQuery = searchParams.get('q') || '';

    const handleSearchChange = (e) => {
        const query = e.target.value;
        if (query) {
            setSearchParams({ q: query });
        } else {
            setSearchParams({});
        }
    };

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const response = await api.get('/api/activities');
                    setActivities(response.data.data.activities.slice(0, 5));
                }
            } catch (error) {
                console.error('Error fetching activities:', error);
            }
        };

        fetchActivities();

        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getRelativeTime = (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;

        const days = Math.floor(diffInSeconds / 86400);
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;

        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="logo" style={{ padding: '2rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={20} color="white" fill="white" />
                    </div>
                    <span>EduSaarthi AI</span>
                </div>
                <nav className="sidebar-nav">
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <LayoutGrid size={20} />
                        <span>Overview</span>
                    </NavLink>
                    <NavLink
                        to="/subjects"
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <BookOpen size={20} />
                        <span>My Subjects</span>
                    </NavLink>
                    <NavLink
                        to="/history"
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <Clock size={20} />
                        <span>History</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                    <button onClick={logout} className="logout-btn">
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <div className="main-content">
                <nav className="top-nav">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search assignments, logs..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="top-nav-actions">
                        <div
                            className="icon-badge"
                            title="Settings"
                            onClick={() => navigate('/settings')}
                        >
                            <Settings size={20} />
                        </div>
                        <div
                            className="icon-badge"
                            title="Notifications"
                            onClick={() => setShowNotifications(!showNotifications)}
                            ref={notificationRef}
                        >
                            <Bell size={20} />
                            {activities.length > 0 && <span className="badge-dot"></span>}

                            {showNotifications && (
                                <div className="notifications-dropdown glass-card">
                                    <div className="notifications-header">
                                        <h3>Recent Notifications</h3>
                                    </div>
                                    <div className="notifications-list">
                                        {activities.length > 0 ? (
                                            activities.map((activity, i) => (
                                                <div
                                                    key={i}
                                                    className="notification-item"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate('/dashboard');
                                                        setShowNotifications(false);
                                                    }}
                                                >
                                                    <div className="notification-icon">
                                                        <Zap size={14} />
                                                    </div>
                                                    <div className="notification-content">
                                                        <p className="notification-title">{activity.title}</p>
                                                        <p className="notification-time">{getRelativeTime(activity.createdAt)}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-notifications">No new notifications</div>
                                        )}
                                    </div>
                                    <div className="notifications-footer" onClick={(e) => {
                                        e.stopPropagation();
                                        navigate('/dashboard');
                                        setShowNotifications(false);
                                    }}>
                                        View all history
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="user-profile-small" style={{ cursor: 'pointer' }} onClick={() => navigate('/settings')}>
                            <div className="avatar-circle">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <span className="username-text" style={{ userSelect: 'none' }}>{user?.username}</span>
                        </div>
                    </div>
                </nav>
                <main className="content-area">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
