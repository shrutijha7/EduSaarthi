import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Bell, Settings, Search, LayoutGrid, BookOpen, Clock, Zap } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();

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
                        to="/courses"
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <BookOpen size={20} />
                        <span>My Assignments</span>
                    </NavLink>
                    <NavLink
                        to="/schedule"
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <Clock size={20} />
                        <span>Automation Queue</span>
                    </NavLink>
                    <NavLink
                        to="/settings"
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <Settings size={20} />
                        <span>Settings</span>
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
                        <input type="text" placeholder="Search assignments, logs..." />
                    </div>
                    <div className="top-nav-actions">
                        <div className="icon-badge" onClick={() => alert('No new notifications')}>
                            <Bell size={20} />
                            <span className="badge-dot"></span>
                        </div>
                        <div className="user-profile-small" style={{ cursor: 'pointer' }} onClick={() => alert('Viewing Profile Profile...')}>
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
