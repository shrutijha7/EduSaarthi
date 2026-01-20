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

    const stats = [
        { title: 'Total Assignments', value: '12', icon: Layout, color: 'var(--primary)' },
        { title: 'Files Processed', value: '156', icon: User, color: '#10b981' },
        { title: 'Hours Saved', value: '42.5', icon: Bell, color: '#f59e0b' }
    ];

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
                        Your AI-powered assistant is ready to help you manage your subjects and assessments.
                    </p>
                    <button
                        className="btn-primary"
                        style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
                        onClick={() => navigate('/subjects')}
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
        </DashboardLayout>
    );
};

export default Dashboard;
