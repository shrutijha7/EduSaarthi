import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { User, Bell, Shield, Moon, Save, X, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Settings = () => {
    const { user, setUser, logout } = useAuth(); // usage of user from context as initial state
    const [localUser, setLocalUser] = useState({ name: '', email: '', username: '' });
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // UI States
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    // Form States
    const [profileForm, setProfileForm] = useState({ name: '', email: '', username: '' });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

    useEffect(() => {
        if (user) {
            setLocalUser({ name: user.name, email: user.email, username: user.username });
            setProfileForm({ name: user.name, email: user.email, username: user.username });
            setNotificationsEnabled(user.notificationsEnabled !== false); // default to true
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('http://localhost:3000/api/auth/updatedetails', profileForm, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.status === 'success') {
                const updatedUser = res.data.data.user;
                setLocalUser(updatedUser);
                setUser(updatedUser); // Update global context
                setIsEditingProfile(false);
                setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
            }
        } catch (error) {
            setStatusMessage({ type: 'error', text: error.response?.data?.message || 'Update failed' });
        }
    };

    const handleNotificationToggle = async () => {
        const newValue = !notificationsEnabled;
        setNotificationsEnabled(newValue);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('http://localhost:3000/api/auth/updatedetails',
                { notificationsEnabled: newValue },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.status === 'success') {
                setUser(res.data.data.user); // Update global context
                setStatusMessage({ type: 'success', text: 'Notification preferences updated!' });
            }
        } catch (error) {
            setNotificationsEnabled(!newValue); // revert on error
            setStatusMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update notifications' });
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('http://localhost:3000/api/auth/updatepassword', passwordForm, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.status === 'success') {
                setIsChangingPassword(false);
                setPasswordForm({ currentPassword: '', newPassword: '' });
                setStatusMessage({ type: 'success', text: 'Password updated successfully!' });
            }
        } catch (error) {
            setStatusMessage({ type: 'error', text: error.response?.data?.message || 'Password update failed' });
        }
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem' }}>Settings</h1>
                {statusMessage.text && (
                    <div style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        background: statusMessage.type === 'success' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                        color: statusMessage.type === 'success' ? '#4ade80' : '#f87171',
                        border: `1px solid ${statusMessage.type === 'success' ? '#4ade80' : '#f87171'}`
                    }}>
                        {statusMessage.text}
                    </div>
                )}
            </div>

            <div className="glass-card" style={{ maxWidth: '800px', padding: '0', overflow: 'hidden' }}>

                {/* ACCOUNT SECTION */}
                <div style={{ padding: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: isEditingProfile ? '1.5rem' : '0' }}>
                        <User size={24} color="var(--primary)" style={{ marginTop: '0.25rem' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Account</h3>
                                {!isEditingProfile && (
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="btn-primary"
                                        style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>

                            {!isEditingProfile ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', color: 'var(--text-muted)' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Name</div>
                                        <div style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{localUser.name || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Email</div>
                                        <div style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{localUser.email || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Username</div>
                                        <div style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{localUser.username || 'N/A'}</div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleProfileUpdate} style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Full Name</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={profileForm.name}
                                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Username</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={profileForm.username}
                                                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email Address</label>
                                        <input
                                            type="email"
                                            className="input-field"
                                            value={profileForm.email}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Save size={16} /> Save Changes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingProfile(false)}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid var(--glass-border)',
                                                color: 'var(--text-primary)',
                                                padding: '0.75rem 1.5rem',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <X size={16} /> Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* NOTIFICATIONS SECTION */}
                <div style={{ padding: '2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Bell size={24} color="var(--primary)" />
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Notifications</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Receive email updates about your assignment progress</p>
                    </div>
                    <div>
                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                            <input
                                type="checkbox"
                                checked={notificationsEnabled}
                                onChange={handleNotificationToggle}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: notificationsEnabled ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.1)',
                                transition: '.4s', borderRadius: '34px',
                                border: '1px solid var(--glass-border)'
                            }}>
                                <span style={{
                                    position: 'absolute', content: '""', height: '20px', width: '20px',
                                    left: notificationsEnabled ? '26px' : '4px',
                                    bottom: '3px',
                                    backgroundColor: 'var(--primary)', transition: '.4s', borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                    </div>
                </div>

                {/* SECURITY SECTION */}
                <div style={{ padding: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <Shield size={24} color="var(--primary)" style={{ marginTop: '0.25rem' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Security</h3>
                                {!isChangingPassword && (
                                    <button
                                        onClick={() => setIsChangingPassword(true)}
                                        className="btn-primary"
                                        style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
                                    >
                                        Change Password
                                    </button>
                                )}
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: isChangingPassword ? '1rem' : '0' }}>
                                Manage your password and account security settings
                            </p>

                            {isChangingPassword && (
                                <form onSubmit={handlePasswordUpdate} style={{ maxWidth: '400px', display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Current Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                                            <input
                                                type="password"
                                                className="input-field"
                                                style={{ paddingLeft: '2.5rem' }}
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>New Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                                            <input
                                                type="password"
                                                className="input-field"
                                                style={{ paddingLeft: '2.5rem' }}
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            Update Password
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsChangingPassword(false)}
                                            style={{
                                                background: 'transparent',
                                                color: 'var(--text-muted)',
                                                border: 'none',
                                                cursor: 'pointer',
                                                textDecoration: 'underline'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* APPEARANCE SECTION */}
                <div style={{ padding: '2rem', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Moon size={24} color="var(--primary)" />
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Appearance</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Customize the interface theme and accent color</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginLeft: '3.5rem' }}>
                        {[
                            { name: 'Dark Beige', color: '#c4a484' },
                            { name: 'Earthy Blue', color: '#5C7C89' },
                            { name: 'Deep Teal', color: '#1F4959' },
                            { name: 'Midnight', color: '#011425' },
                            { name: 'Sage', color: '#7c895c' }
                        ].map((theme) => (
                            <button
                                key={theme.name}
                                onClick={() => {
                                    document.documentElement.style.setProperty('--primary', theme.color);
                                    localStorage.setItem('themeColor', theme.color);
                                    setStatusMessage({ type: 'success', text: `Theme changed to ${theme.name}` });
                                }}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: theme.color,
                                    border: '2px solid white',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                title={theme.name}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
};

export default Settings;
