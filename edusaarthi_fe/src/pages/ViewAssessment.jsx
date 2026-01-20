import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { Sparkles, Printer, ChevronLeft, Download } from 'lucide-react';

const ViewAssessment = () => {
    const { id } = useParams();
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const response = await api.get(`/api/activities/${id}`);
                setAssessment(response.data.data.activity);
            } catch (err) {
                console.error('Error fetching assessment:', err);
                const message = err.response?.data?.message || err.message;
                setError(`Failed to load assessment: ${message}`);
            }
            finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchAssessment();
        }
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#c4a484' }}>
                <div className="loader">Loading Assessment...</div>
            </div>
        );
    }

    if (error || !assessment) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050505', color: 'white', padding: '2rem' }}>
                <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Error</h2>
                <p>{error || 'Assessment not found'}</p>
                <button
                    onClick={() => window.close()}
                    className="btn-primary"
                    style={{ marginTop: '2rem', width: 'auto' }}
                >
                    Close Window
                </button>
            </div>
        );
    }

    const title = assessment.title || 'Untitled Assessment';
    const createdAt = assessment.createdAt || new Date();
    const fileName = assessment.fileName || 'Unknown Source';
    const content = assessment.content || { type: 'unknown', data: [] };

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#e5e7eb', padding: '2rem' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Header Actions - Hidden during print */}
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <button
                        onClick={() => window.close()}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                        <ChevronLeft size={20} /> Close
                    </button>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={handlePrint}
                            className="btn-primary"
                            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
                        >
                            <Printer size={18} /> Print / Save PDF
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div className="glass-card" style={{ padding: '3rem', maxWidth: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2rem' }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            background: 'var(--primary)',
                            borderRadius: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            boxShadow: '0 8px 20px rgba(196, 164, 132, 0.3)'
                        }}>
                            <Sparkles size={32} color="white" />
                        </div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'white' }}>EduSaarthi AI Assessment</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Generated on {new Date(createdAt).toLocaleString()}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Assessment Title</span>
                            <span style={{ fontWeight: '600', color: 'white' }}>{title}</span>
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Source Document</span>
                            <span style={{ fontWeight: '600', color: 'white' }}>{fileName}</span>
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Type</span>
                            <span style={{ fontWeight: '600', color: 'white' }}>{content.type === 'quiz' ? 'Multiple Choice Quiz' : 'Study Questions'}</span>
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Question Count</span>
                            <span style={{ fontWeight: '600', color: 'white' }}>{content.data.length} Questions</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        {content.type === 'questions' ? (
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                {content.data && Array.isArray(content.data) ? content.data.map((q, idx) => (
                                    <div key={idx} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                                        <div style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'white' }}>
                                            <span style={{ fontWeight: '700', marginRight: '0.75rem', color: 'var(--primary)' }}>{idx + 1}.</span>
                                            {q}
                                        </div>
                                    </div>
                                )) : <p>No questions found in this assessment.</p>}
                            </div>
                        ) : content.type === 'quiz' ? (
                            <div style={{ display: 'grid', gap: '2.5rem' }}>
                                {content.data && Array.isArray(content.data) ? content.data.map((item, idx) => (
                                    <div key={idx} style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontWeight: '600', marginBottom: '1.5rem', fontSize: '1.2rem', color: 'white', display: 'flex', gap: '1rem' }}>
                                            <span style={{ color: 'var(--primary)' }}>Q{idx + 1}.</span>
                                            <span>{item.question}</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                                            {item.options && item.options.map((opt, optIdx) => {
                                                const letter = String.fromCharCode(65 + optIdx);
                                                return (
                                                    <div
                                                        key={optIdx}
                                                        style={{
                                                            padding: '1rem 1.25rem',
                                                            background: 'rgba(0,0,0,0.3)',
                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                            borderRadius: '10px',
                                                            fontSize: '1rem',
                                                            color: 'var(--text-main)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.75rem'
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: '700', opacity: 0.7 }}>{letter}.</span>
                                                        {opt}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )) : <p>No quiz data found in this assessment.</p>}
                            </div>
                        ) : (
                            <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                <h4 style={{ marginBottom: '1rem' }}>Raw Content</h4>
                                <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    {JSON.stringify(content, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>

                    {/* Footer for print */}
                    <div style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                        <p>© {new Date().getFullYear()} EduSaarthi AI. All rights reserved.</p>
                        <p>This assessment was automatically generated based on uploaded educational materials.</p>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .glass-card {
                        background: white !important;
                        border: none !important;
                        box-shadow: none !important;
                        color: black !important;
                        padding: 0 !important;
                    }
                    h1, h2, h3, span, div {
                        color: black !important;
                    }
                    .glass-card > div {
                        background: #f9fafb !important;
                        border: 1px solid #e5e7eb !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ViewAssessment;
