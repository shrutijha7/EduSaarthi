import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { ChevronLeft, FileUp, Sparkles, Download, ArrowRight, ShieldCheck, Zap, Save, Eye, ClipboardList } from 'lucide-react';

import api, { API_BASE_URL } from '../utils/api';

const AssignmentWorkspace = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState('idle'); // idle, processing, completed
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedExistingFile, setSelectedExistingFile] = useState(null); // For selecting from subject files
    const [taskType, setTaskType] = useState('question_generation');
    const [generatedContent, setGeneratedContent] = useState(null);
    const [assignment, setAssignment] = useState(null);
    const [loadingAssignment, setLoadingAssignment] = useState(true);
    const [questionCount, setQuestionCount] = useState(5);
    const [subjectFiles, setSubjectFiles] = useState([]); // Files already uploaded to this subject
    const [previousAssessments, setPreviousAssessments] = useState([]);
    const [loadingAssessments, setLoadingAssessments] = useState(false);
    const [savingFile, setSavingFile] = useState(false);
    const [lastActivityId, setLastActivityId] = useState(null);
    const fileInputRef = useRef(null);

    // Detect if we're using subjects or courses based on URL
    const isSubjectMode = location.pathname.startsWith('/subjects');
    const apiEndpoint = isSubjectMode ? 'subjects' : 'courses';
    const itemKey = isSubjectMode ? 'subject' : 'course';

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const response = await api.get(`/api/${apiEndpoint}/${id}`);
                const fetchedItem = response.data.data[itemKey];
                setAssignment(fetchedItem);

                // Extract files if this is a subject
                if (isSubjectMode && fetchedItem.files && fetchedItem.files.length > 0) {
                    setSubjectFiles(fetchedItem.files);
                    // Auto-select the first file if available
                    setSelectedExistingFile(fetchedItem.files[0]);
                }
            } catch (error) {
                console.error('Error fetching details:', error);
            } finally {
                setLoadingAssignment(false);
            }
        };

        const fetchAssessments = async () => {
            setLoadingAssessments(true);
            try {
                const response = await api.get(`/api/activities/subject/${id}`);
                setPreviousAssessments(response.data.data.activities);
            } catch (error) {
                console.error('Error fetching assessments:', error);
            } finally {
                setLoadingAssessments(false);
            }
        };

        if (id) {
            fetchAssignment();
            fetchAssessments();
        }
    }, [id, apiEndpoint, itemKey, isSubjectMode, navigate]);


    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setSelectedExistingFile(null); // Clear existing file selection
            console.log('File selected:', file.name);
        }
    };

    const handleSaveFile = async () => {
        if (!selectedFile) return;
        setSavingFile(true);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await api.post(`/api/subjects/${id}/files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update local state with the new list of files from backend
            const updatedSubject = response.data.data.subject;
            setSubjectFiles(updatedSubject.files);
            setAssignment(updatedSubject);

            // Switch selection to the newly saved file
            const newFile = updatedSubject.files[updatedSubject.files.length - 1];
            setSelectedExistingFile(newFile);
            setSelectedFile(null);

            alert('File saved to subject successfully!');
        } catch (error) {
            console.error('Error saving file:', error);
            alert('Failed to save file: ' + (error.response?.data?.message || error.message));
        } finally {
            setSavingFile(false);
        }
    };

    const automationSteps = [
        { title: 'Topical Analysis', description: 'Deep-scanning document to identify core educational themes.', icon: FileUp },
        { title: 'Concept Mapping', description: 'Cross-referencing topics with academic knowledge bases.', icon: Sparkles },
        { title: 'Question Synthesis', description: 'Formulating conceptual questions to test deep understanding.', icon: ShieldCheck },
        { title: 'Review & Refine', description: 'Finalizing structure and ensuring clarity of options.', icon: Zap },
    ];

    const handleRunAutomation = async () => {
        // Check if either a new file or an existing file is selected
        if (!selectedFile && !selectedExistingFile) {
            alert('Please select a file first.');
            return;
        }

        setStatus('processing');

        try {
            const formData = new FormData();

            // If a new file was uploaded, use it; otherwise use the existing file info
            if (selectedFile) {
                formData.append('file', selectedFile);
            } else if (selectedExistingFile) {
                // For existing files, send the file path so backend can read it
                formData.append('existingFilePath', selectedExistingFile.path);
                formData.append('existingFileName', selectedExistingFile.originalName);
            }

            formData.append('taskType', taskType);
            formData.append('questionCount', questionCount);
            formData.append('subjectId', id); // Pass subject/course ID

            const token = localStorage.getItem('token');

            const response = await api.post('/api/activities/generate', formData);

            if (response.data.data.generatedContent) {
                setGeneratedContent(response.data.data.generatedContent);
            }

            if (response.data.data.activity) {
                setPreviousAssessments(prev => [response.data.data.activity, ...prev]);
                setLastActivityId(response.data.data.activity._id);
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
            <div className="page-transition">
                {/* ... Header section ... */}
                <div style={{ marginBottom: '2rem' }}>
                    <button
                        onClick={() => navigate(isSubjectMode ? '/subjects' : '/courses')}
                        className="animate-slide-up"
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
                        <ChevronLeft size={20} /> Back to {isSubjectMode ? 'Subjects' : 'Assignments'}
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }} className="animate-slide-up delay-100">
                        <div>
                            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                                {loadingAssignment ? 'Loading...' : (assignment?.title || 'Automation Workspace')}
                            </h1>
                            <p style={{ color: 'var(--text-muted)' }}>
                                {assignment ? `Configure automation for ${assignment.title}` : 'Configure and execute your assignment automation workflow.'}
                            </p>
                        </div>
                        {status === 'completed' && lastActivityId && (
                            <button
                                className="btn-primary"
                                style={{ width: 'auto', background: 'var(--primary)', borderColor: 'var(--primary)' }}
                                onClick={() => {
                                    window.open(`/assessment/${lastActivityId}`, '_blank');
                                }}
                            >
                                <Eye size={18} /> View Assessment
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2.5rem' }}>
                    <div className="glass-card" style={{ padding: '2.5rem', maxWidth: 'none' }}>
                        {/* Show existing subject files if available */}
                        {isSubjectMode && subjectFiles.length > 0 && (
                            <div style={{ marginBottom: '2.5rem', marginTop: '2rem' }}>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileUp size={20} color="var(--primary)" />
                                    Uploaded Files for this Subject
                                </h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                    Select a file to process, or upload a new one below.
                                </p>
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {subjectFiles.map((file, index) => (
                                        <div
                                            key={file._id || index}
                                            onClick={() => {
                                                setSelectedExistingFile(file);
                                                setSelectedFile(null); // Clear any newly uploaded file
                                            }}
                                            style={{
                                                padding: '1rem 1.25rem',
                                                background: selectedExistingFile?._id === file._id ? 'rgba(var(--primary-rgb), 0.15)' : 'rgba(0,0,0,0.2)',
                                                border: selectedExistingFile?._id === file._id ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem'
                                            }}
                                            onMouseOver={(e) => {
                                                if (selectedExistingFile?._id !== file._id) {
                                                    e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.08)';
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                if (selectedExistingFile?._id !== file._id) {
                                                    e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
                                                }
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                checked={selectedExistingFile?._id === file._id}
                                                onChange={() => { }}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                                                    {file.originalName}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    Uploaded {new Date(file.uploadDate).toLocaleDateString()} · {(file.size / 1024).toFixed(2)} KB
                                                </div>
                                            </div>
                                            {/* Open/View Link */}
                                            <a
                                                href={`${API_BASE_URL}/${file.path.replace(/\\/g, '/')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    color: 'var(--primary)',
                                                    padding: '0.5rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(var(--primary-rgb), 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.2)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.1)'}
                                                title="View/Open File"
                                            >
                                                <Eye size={18} />
                                            </a>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        )}

                        {previousAssessments.length > 0 && (
                            <div style={{ marginBottom: '2.5rem', marginTop: '2.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ClipboardList size={22} color="var(--primary)" />
                                    Previously Generated Assessments
                                </h3>
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {previousAssessments.map((item) => (
                                        <div
                                            key={item._id}
                                            onClick={() => {
                                                setGeneratedContent(item.content);
                                                setLastActivityId(item._id);
                                                setStatus('completed');
                                                window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll up to see results if they were at bottom
                                            }}
                                            style={{
                                                padding: '1.25rem',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '16px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1.25rem'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.08)';
                                                e.currentTarget.style.borderColor = 'var(--primary)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                                e.currentTarget.style.borderColor = 'var(--glass-border)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <div style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '12px',
                                                background: 'rgba(var(--primary-rgb), 0.15)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--primary)'
                                            }}>
                                                <Sparkles size={20} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '0.25rem' }}>
                                                    {item.title}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {new Date(item.createdAt).toLocaleDateString()} · {item.type === 'quiz' ? 'Quiz' : 'Questions'} · Based on {item.fileName}
                                                </div>
                                            </div>
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(`/assessment/${item._id}`, '_blank');
                                                }}
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    color: 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.2)';
                                                    e.currentTarget.style.color = 'var(--primary)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                    e.currentTarget.style.color = 'var(--text-muted)';
                                                }}
                                            >
                                                <Eye size={18} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={handleContainerClick}
                            style={{
                                border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--glass-border)'}`,
                                borderRadius: '24px',
                                padding: subjectFiles.length > 0 ? '2rem' : '4rem 2rem',
                                textAlign: 'center',
                                background: isDragging ? 'rgba(196, 164, 132, 0.1)' : 'rgba(255,255,255,0.02)',
                                marginBottom: '2.5rem',
                                cursor: 'pointer',
                                marginTop: subjectFiles.length > 0 ? '0' : '2rem',
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
                                boxShadow: '0 8px 16px rgba(196, 164, 132, 0.4)'
                            }}>
                                <FileUp size={32} color="white" />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                                {selectedFile ? 'New File Selected' : (subjectFiles.length > 0 ? 'Upload a new file' : 'Drop assignment brief here')}
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

                            {selectedFile && (
                                <button
                                    className="btn-primary"
                                    style={{
                                        width: 'auto',
                                        padding: '0.6rem 1.5rem',
                                        fontSize: '0.875rem',
                                        marginLeft: '1rem',
                                        background: '#10b981',
                                        borderColor: '#10b981'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveFile();
                                    }}
                                    disabled={savingFile}
                                >
                                    {savingFile ? 'Saving...' : (
                                        <>
                                            <Save size={16} style={{ marginRight: '0.5rem' }} /> Save to Subject
                                        </>
                                    )}
                                </button>
                            )}
                        </div>


                        <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <div style={{ flex: 1 }}>
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
                                        <option value="quiz" style={{ color: 'black' }}>Quiz</option>
                                    </select>
                                </div>
                                {(taskType === 'question_generation' || taskType === 'quiz') && (
                                    <div style={{ width: '150px' }}>
                                        <h4 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            Count
                                        </h4>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={questionCount}
                                            onChange={(e) => setQuestionCount(e.target.value)}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(0,0,0,0.2)',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '12px',
                                                color: 'white',
                                                padding: '1rem',
                                                outline: 'none',
                                                fontSize: '0.875rem'
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
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
                            style={{
                                marginTop: '2.5rem',
                                height: '60px',
                                fontSize: '1.1rem',
                                opacity: (!selectedFile && !selectedExistingFile) ? 0.5 : 1,
                                cursor: (!selectedFile && !selectedExistingFile) ? 'not-allowed' : 'pointer'
                            }}
                            onClick={() => {
                                if (!selectedFile && !selectedExistingFile) {
                                    alert('Please upload or select a file first.');
                                    return;
                                }
                                handleRunAutomation();
                            }}
                            disabled={status === 'processing' || (!selectedFile && !selectedExistingFile)}
                        >
                            {status === 'processing' ? 'Processing Assessment...' : 'Assessment'}
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

                                {generatedContent.type === 'quiz' && (
                                    <div style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '16px' }}>
                                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Generated Quiz</h3>
                                        <div style={{ display: 'grid', gap: '2rem' }}>
                                            {generatedContent.data.map((item, idx) => (
                                                <div key={idx} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                                    <div style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                                        {idx + 1}. {item.question}
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                        {item.options.map((opt, optIdx) => (
                                                            <div
                                                                key={optIdx}
                                                                style={{
                                                                    padding: '0.75rem 1rem',
                                                                    background: 'rgba(0,0,0,0.2)',
                                                                    border: '1px solid var(--glass-border)',
                                                                    borderRadius: '8px',
                                                                    fontSize: '0.9rem',
                                                                    color: 'var(--text-main)'
                                                                }}
                                                            >
                                                                {String.fromCharCode(65 + optIdx)}. {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
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
            </div>
        </DashboardLayout >
    );
};

export default AssignmentWorkspace;
