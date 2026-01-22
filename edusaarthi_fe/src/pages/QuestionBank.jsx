import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import { Star, Trash2, Search, BookOpen, Clock, FileText, CheckCircle, HelpCircle, AlertCircle } from 'lucide-react';

const QuestionBank = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const response = await api.get('/api/question-bank');
            setQuestions(response.data.data.questions);
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this question from your library?')) return;
        try {
            await api.delete(`/api/question-bank/${id}`);
            setQuestions(prev => prev.filter(q => q._id !== id));
        } catch (error) {
            console.error('Error deleting question:', error);
        }
    };

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || q.type === filterType;
        return matchesSearch && matchesType;
    });

    const getTypeIcon = (type) => {
        switch (type) {
            case 'quiz': return <CheckCircle size={18} color="#10b981" />;
            case 'fill_in_blanks': return <FileText size={18} color="#3b82f6" />;
            case 'true_false': return <HelpCircle size={18} color="#f59e0b" />;
            case 'subjective': return <BookOpen size={18} color="#8b5cf6" />;
            default: return <Clock size={18} color="var(--primary)" />;
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'quiz': return 'MCQ Quiz';
            case 'fill_in_blanks': return 'Fill in Blank';
            case 'true_false': return 'True/False';
            case 'subjective': return 'Subjective';
            default: return 'Question';
        }
    };

    return (
        <DashboardLayout>
            <div className="page-transition">
                <header style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Question Bank</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Your library of verified, high-quality questions.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search questions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', color: 'white' }}
                            />
                        </div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', cursor: 'pointer' }}
                        >
                            <option value="all" style={{ color: 'black' }}>All Formats</option>
                            <option value="quiz" style={{ color: 'black' }}>MCQ Quiz</option>
                            <option value="fill_in_blanks" style={{ color: 'black' }}>Fill in the Blanks</option>
                            <option value="true_false" style={{ color: 'black' }}>True / False</option>
                            <option value="subjective" style={{ color: 'black' }}>Subjective</option>
                        </select>
                    </div>
                </header>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '5rem' }} className="loader">Loading Library...</div>
                ) : filteredQuestions.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                        <Star size={48} color="var(--primary)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                        <h3>No questions found</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Star questions from your assessments to save them here.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {filteredQuestions.map((q) => (
                            <div key={q._id} className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)', maxWidth: 'none' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                                        {getTypeIcon(q.type)}
                                        {getTypeLabel(q.type)}
                                    </div>
                                    <button onClick={() => handleDelete(q._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', lineHeight: '1.5' }}>{q.question}</h3>

                                {q.type === 'quiz' && q.options && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                                        {q.options.map((opt, i) => (
                                            <div key={i} style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{String.fromCharCode(65 + i)}.</span>
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {q.answer && (
                                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.9rem', color: '#34d399' }}>
                                        <strong>Correct Answer:</strong> {q.answer.toString()}
                                    </div>
                                )}

                                {q.suggestedAnswer && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>Model Answer:</div>
                                        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>{q.suggestedAnswer}</p>
                                        {q.keyPoints && q.keyPoints.length > 0 && (
                                            <div style={{ mt: '1rem' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', mt: '0.5rem', mb: '0.25rem' }}>Key Marking Points:</div>
                                                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {q.keyPoints.map((kp, i) => <li key={i}>{kp}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default QuestionBank;
