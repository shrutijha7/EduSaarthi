import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../utils/api';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (password.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
            return;
        }

        setLoading(true);

        try {
            const res = await api.post(`/api/auth/resetpassword/${token}`, { password });
            if (res.data.status === 'success') {
                setIsSuccess(true);
                setMessage({ type: 'success', text: 'Password reset successfully!' });
                // Automatically redirect after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Token is invalid or has expired' });
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="auth-container">
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '1.5rem', color: '#4ade80' }}>
                        <CheckCircle size={64} style={{ margin: '0 auto' }} />
                    </div>
                    <h1 style={{ marginBottom: '1rem' }}>Success!</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Your password has been reset successfully. You will be redirected to the login page in a few seconds.
                    </p>
                    <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="glass-card">
                <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem' }}>New Password</h1>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Please enter your new password below.
                </p>

                {message.text && (
                    <div className={message.type === 'success' ? 'success-message' : 'error-message'} style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        textAlign: 'center',
                        background: message.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                        color: message.type === 'success' ? '#4ade80' : '#f87171',
                        border: `1px solid ${message.type === 'success' ? '#4ade80' : '#f87171'}`
                    }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="password">New Password</label>
                        <div className="input-wrapper">
                            <Lock />
                            <input
                                id="password"
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <div className="input-wrapper">
                            <Lock />
                            <input
                                id="confirmPassword"
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                        {loading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                </form>

                <div className="auth-footer">
                    Remembered your password?
                    <Link to="/login" className="auth-link">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
