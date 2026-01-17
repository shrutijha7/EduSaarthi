import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { ChevronLeft, FileUp, Sparkles, Download, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

import axios from 'axios';

const AssignmentWorkspace = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('idle'); // idle, processing, completed
    const [selectedFile, setSelectedFile] = useState(null);
    const [taskType, setTaskType] = useState('question_generation');
    const [generatedContent, setGeneratedContent] = useState(null);
    const [assignment, setAssignment] = useState(null);
    const [loadingAssignment, setLoadingAssignment] = useState(true);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const response = await axios.get(`http://localhost:3000/api/courses/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAssignment(response.data.data.course);
            } catch (error) {
                console.error('Error fetching assignment details:', error);
                // navigate('/courses'); // Optional: redirect on fail
            } finally {
                setLoadingAssignment(false);
            }
        };

        if (id) {
            fetchAssignment();
        }
    }, [id, navigate]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            console.log('File selected:', file.name);
        }
    };

    const automationSteps = [
        { title: 'Document Analysis', description: 'Extracting key requirements and structure.', icon: FileUp },
        { title: 'Data Synthesis', description: 'Generating content using custom AI models.', icon: Sparkles },
        { title: 'Technical Verification', description: 'Cross-referencing with project guidelines.', icon: ShieldCheck },
        { title: 'Final Polish', description: 'Formatting and citation management.', icon: Zap },
    ];

    const handleRunAutomation = async () => {
        if (!selectedFile) {
            alert('Please select a file first.');
            return;
        }

        setStatus('processing');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('taskType', taskType);

            const token = localStorage.getItem('token');

            const response = await axios.post('http://localhost:3000/api/activities/generate', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.data.generatedContent) {
                setGeneratedContent(response.data.data.generatedContent);
            }

            // Simulate steps delay for visual effect if needed, or just set completed
            setTimeout(() => setStatus('completed'), 2000);

        } catch (error) {
            console.error('Error running automation:', error);
            setStatus('idle');
            alert(error.response?.data?.message || 'Failed to run automation. Please try again.');
        }
    };

    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
            console.log('File dropped:', files[0].name);
        }
    };

    const handleContainerClick = () => {
        fileInputRef.current.click();
    };

    // ... handleFileChange is already defined ...

    return (
        <DashboardLayout>
            {/* ... Header section ... */}
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/courses')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        marginBottom: '1rem',
                        transition: 'color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                    <ChevronLeft size={20} /> Back to Assignments
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                            {loadingAssignment ? 'Loading...' : (assignment?.title || 'Automation Workspace')}
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>
                            {assignment ? `Configure automation for ${assignment.title}` : 'Configure and execute your assignment automation workflow.'}
                        </p>
                    </div>
                    {status === 'completed' && (
                        <button className="btn-primary" style={{ width: 'auto', background: '#10b981' }}>
                            <Download size={18} /> Download Package
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2.5rem' }}>
                <div className="glass-card" style={{ padding: '2.5rem', maxWidth: 'none' }}>
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleContainerClick}
                        style={{
                            border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--glass-border)'}`,
                            borderRadius: '24px',
                            padding: '4rem 2rem',
                            textAlign: 'center',
                            background: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)',
                            marginBottom: '2.5rem',
                            cursor: 'pointer',
                            marginTop: '2rem',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'var(--primary)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.4)'
                        }}>
                            <FileUp size={32} color="white" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                            {selectedFile ? 'File Selected' : 'Drop assignment brief here'}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            {selectedFile ? selectedFile.name : 'Support PDF, DOCX, or Image formats'}
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <button
                            className="btn-primary"
                            style={{ width: 'auto', padding: '0.6rem 1.5rem', fontSize: '0.875rem' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current.click();
                            }}
                        >
                            {selectedFile ? 'Change File' : 'Browse Files'}
                        </button>
                    </div>

                    <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles size={18} color="var(--primary)" /> Select Task
                        </h4>
                        <select
                            value={taskType}
                            onChange={(e) => setTaskType(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                color: 'white',
                                padding: '1rem',
                                outline: 'none',
                                fontSize: '0.875rem',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="question_generation" style={{ color: 'black' }}>Question Generation</option>
                            <option value="email_automation" style={{ color: 'black' }}>Email Automation</option>
                        </select>
                    </div>

                    <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '16px' }}>
                        <h4 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles size={18} color="var(--primary)" /> AI Configuration
                        </h4>
                        <textarea
                            placeholder="Add specific instructions or constraints for the AI (optional)..."
                            style={{
                                width: '100%',
                                height: '120px',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                color: 'white',
                                padding: '1rem',
                                resize: 'none',
                                outline: 'none',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>

                    <button
                        className="btn-primary"
                        style={{ marginTop: '2.5rem', height: '60px', fontSize: '1.1rem' }}
                        onClick={handleRunAutomation}
                        disabled={status === 'processing'}
                    >
                        {status === 'processing' ? 'Processing Automation...' : 'Execute Full Automation'}
                        <ArrowRight size={20} />
                    </button>

                    {/* Results Section */}
                    {status === 'completed' && generatedContent && (
                        <div style={{ animation: 'fadeIn 0.5s ease-in', marginTop: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Generated Results</h2>

                            {generatedContent.type === 'questions' && (
                                <div style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '16px' }}>
                                    <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Generated Questions</h3>
                                    <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)', lineHeight: '1.8' }}>
                                        {generatedContent.data.map((q, idx) => (
                                            <li key={idx} style={{ marginBottom: '0.5rem' }}>{q}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {generatedContent.type === 'email' && (
                                <div style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '16px' }}>
                                    <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Email Draft</h3>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <strong>Subject:</strong> {generatedContent.data.subject}
                                    </div>
                                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>
                                        {generatedContent.data.body}
                                    </div>
                                </div>
                            )}

                            <button
                                className="btn-primary"
                                style={{ marginTop: '2rem', width: 'auto' }}
                                onClick={() => { setStatus('idle'); setGeneratedContent(null); setSelectedFile(null); }}
                            >
                                Run Another Task
                            </button>
                        </div>
                    )}
                </div>

                <div className="glass-card" style={{ padding: '2rem', maxWidth: 'none', height: 'fit-content' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Workflow Status</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {automationSteps.map((step, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                gap: '1.25rem',
                                opacity: status === 'idle' ? 0.5 : 1,
                                transition: 'opacity 0.3s'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: status === 'completed' ? '#10b981' : (status === 'processing' ? 'var(--primary)' : 'rgba(255,255,255,0.05)'),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 0.3s'
                                }}>
                                    <step.icon size={20} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem' }}>{step.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{step.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {status === 'completed' && (
                        <div style={{
                            marginTop: '2rem',
                            padding: '1rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '12px',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            fontSize: '0.875rem',
                            color: '#34d399',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <ShieldCheck size={18} /> All checks passed. Ready for review.
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AssignmentWorkspace;
