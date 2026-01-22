import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { ChevronLeft, FileUp, Sparkles, Download, ArrowRight, ShieldCheck, Zap, Save, Eye, ClipboardList, ChevronDown, ChevronUp, X, Users, Plus, Edit3, Trash2 } from 'lucide-react';

import api, { API_BASE_URL } from '../utils/api';

const AssignmentWorkspace = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [assignment, setAssignment] = useState(null);
    const [subjectFiles, setSubjectFiles] = useState([]);
    const [selectedExistingFile, setSelectedExistingFile] = useState(null);
    const [loadingAssignment, setLoadingAssignment] = useState(true);
    const [loadingAssessments, setLoadingAssessments] = useState(false);
    const [previousAssessments, setPreviousAssessments] = useState([]);
    const [status, setStatus] = useState('idle'); // idle, processing, completed
    const [selectedFile, setSelectedFile] = useState(null);
    const [savingFile, setSavingFile] = useState(false);
    const [taskType, setTaskType] = useState('question_generation');
    const [questionCount, setQuestionCount] = useState(5);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [lastActivityId, setLastActivityId] = useState(null);
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailDraft, setEmailDraft] = useState({ subject: '', body: '', recipients: [] });
    const [sendingEmail, setSendingEmail] = useState(false);
    const [showPreviousAssessments, setShowPreviousAssessments] = useState(true);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showEditBatchModal, setShowEditBatchModal] = useState(false);
    const [newBatch, setNewBatch] = useState({ name: '', description: '', students: [] });
    const [editingBatch, setEditingBatch] = useState(null);
    const [studentInput, setStudentInput] = useState({ name: '', email: '', rollNumber: '' });
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

        const fetchBatches = async () => {
            try {
                const response = await api.get('/api/batches');
                setBatches(response.data.data.batches || []);

                // Only auto-select if no batch is currently selected
                setSelectedBatchId(currentId => {
                    if (currentId) return currentId;

                    // If subject has batches, prefer those or select first available
                    if (isSubjectMode && assignment?.batches && assignment.batches.length > 0) {
                        const firstBatch = assignment.batches[0];
                        return firstBatch._id || firstBatch;
                    } else if (response.data.data.batches?.length > 0) {
                        return response.data.data.batches[0]._id;
                    }
                    return currentId;
                });
            } catch (error) {
                console.error('Error fetching batches:', error);
            }
        };

        if (id) {
            fetchAssignment();
            fetchAssessments();
            fetchBatches();
        }
    }, [id, apiEndpoint, itemKey, isSubjectMode, navigate, assignment?.batches]);


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
        setShowEmailModal(false); // Hide any previous email review
        setGeneratedContent(null);

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

            const response = await api.post('/api/activities/generate', formData);

            if (response.data.data.generatedContent) {
                setGeneratedContent(response.data.data.generatedContent);
            }

            if (response.data.data.activity) {
                setPreviousAssessments(prev => [response.data.data.activity, ...prev]);
                setLastActivityId(response.data.data.activity._id);
            }

            // Simulate steps delay for visual effect if needed, or just set completed
            setTimeout(() => setStatus('completed'), 1000);

        } catch (error) {
            console.error('Error running automation:', error);
            setStatus('idle');
            alert(error.response?.data?.message || 'Failed to run automation. Please try again.');
        }
    };

    const handlePrepareEmail = () => {
        if (!generatedContent || !selectedBatchId) {
            alert('Please generate assessment and select a batch first.');
            return;
        }

        const batch = batches.find(b => b._id === selectedBatchId);
        if (!batch || !batch.students || batch.students.length === 0) {
            alert('Selected batch has no students.');
            return;
        }

        const subject = `Assessment: ${assignment?.title || 'Course Material'}`;
        let body = `Hello Students,\n\nAn assessment has been generated for you based on our recent course material.\n\n`;

        if (generatedContent.type === 'questions') {
            body += `Please review the following questions:\n\n`;
            generatedContent.data.forEach((q, i) => body += `${i + 1}. ${q}\n`);
        } else if (generatedContent.type === 'quiz') {
            body += `A quiz is ready for you with ${generatedContent.data.length} questions.\n\n`;
        }

        body += `\n\nBest regards,\nEduSaarthi AI`;

        setEmailDraft({
            subject,
            body,
            recipients: batch.students.map(s => s.email)
        });
        setShowEmailModal(true);
    };

    const handleSendEmail = async () => {
        setSendingEmail(true);
        let emailsSent = false;

        try {
            // 1. Send the manual email notification
            await api.post('/api/activities/send-manual', {
                recipientEmail: emailDraft.recipients.join(','),
                title: emailDraft.subject,
                content: generatedContent,
                fileName: selectedExistingFile?.originalName || selectedFile?.name || 'Course Material'
            });
            emailsSent = true;

            alert('Emails sent successfully!');
            setShowEmailModal(false);
        } catch (error) {
            console.error('Error sending email:', error);
            const errorMessage = error.response?.data?.message || error.message;
            if (emailsSent) {
                alert('Emails were sent, but there was an issue linking the assignment to the student dashboard.');
                setShowEmailModal(false);
            } else {
                alert('Failed to send emails: ' + errorMessage);
            }
        } finally {
            setSendingEmail(false);
        }
    };
    const handleAddStudent = () => {
        if (studentInput.name && studentInput.email) {
            if (showEditBatchModal) {
                setEditingBatch({
                    ...editingBatch,
                    students: [...editingBatch.students, { ...studentInput }]
                });
            } else {
                setNewBatch({
                    ...newBatch,
                    students: [...newBatch.students, { ...studentInput }]
                });
            }
            setStudentInput({ name: '', email: '', rollNumber: '' });
        }
    };

    const handleCreateBatch = async () => {
        try {
            const response = await api.post('/api/batches', newBatch);
            const createdBatch = response.data.data.batch;
            setBatches([...batches, createdBatch]);
            setSelectedBatchId(createdBatch._id);
            setShowBatchModal(false);
            setNewBatch({ name: '', description: '', students: [] });
        } catch (error) {
            console.error('Error creating batch:', error);
            alert('Failed to create batch: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleEditBatchClick = (e) => {
        if (!selectedBatchId) return;
        const batch = batches.find(b => b._id === selectedBatchId);
        if (batch) {
            setEditingBatch({ ...batch });
            setShowEditBatchModal(true);
        }
    };

    const handleUpdateBatch = async (e) => {
        e.preventDefault();
        try {
            const response = await api.patch(`/api/batches/${editingBatch._id}`, editingBatch);
            const updatedBatch = response.data.data.batch;
            setBatches(prev => prev.map(b => b._id === updatedBatch._id ? updatedBatch : b));
            setShowEditBatchModal(false);
            setEditingBatch(null);
        } catch (error) {
            console.error('Error updating batch:', error);
            alert('Failed to update batch: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteBatch = async (e, id) => {
        if (!window.confirm('Are you sure you want to delete this batch?')) return;
        try {
            await api.delete(`/api/batches/${id}`);
            setBatches(prev => prev.filter(b => b._id !== id));
            setSelectedBatchId('');
            setShowEditBatchModal(false);
        } catch (error) {
            console.error('Error deleting batch:', error);
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                            <Users size={18} color="var(--primary)" /> Recipient Batch
                                        </h4>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {selectedBatchId && (
                                                <button
                                                    type="button"
                                                    onClick={handleEditBatchClick}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                                                    title="Edit Selected Batch"
                                                >
                                                    <Edit3 size={14} /> Edit
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setShowBatchModal(true)}
                                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                                            >
                                                <Plus size={14} /> New Batch
                                            </button>
                                        </div>
                                    </div>
                                    <select
                                        value={selectedBatchId}
                                        onChange={(e) => setSelectedBatchId(e.target.value)}
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
                                        <option value="" style={{ color: 'black' }}>Select a Batch...</option>
                                        {batches.map(batch => (
                                            <option key={batch._id} value={batch._id} style={{ color: 'black' }}>
                                                {batch.name} ({batch.students.length} students)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Sparkles size={18} color="var(--primary)" /> Task Type
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
                                    <div style={{ width: '100%' }}>
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
                            {status === 'processing' ? 'Processing Assessment...' : 'Generate Assessment'}
                            <ArrowRight size={20} />
                        </button>

                        {/* Results Section */}
                        {status === 'completed' && generatedContent && (
                            <div style={{ animation: 'fadeIn 0.5s ease-in', marginTop: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Generated Results</h2>

                                {generatedContent.type === 'questions' && (
                                    <div style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '16px' }}>
                                        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Generated Questions (Editable)</h3>
                                        <ul style={{ paddingLeft: '0', listStyle: 'none', color: 'var(--text-main)', lineHeight: '1.8' }}>
                                            {generatedContent.data.map((q, idx) => (
                                                <li key={idx} style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                    <span style={{ paddingTop: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}>{idx + 1}.</span>
                                                    <textarea
                                                        value={q}
                                                        onChange={(e) => {
                                                            const newQuestions = [...generatedContent.data];
                                                            newQuestions[idx] = e.target.value;
                                                            setGeneratedContent({ ...generatedContent, data: newQuestions });
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.75rem',
                                                            borderRadius: '8px',
                                                            border: '1px solid var(--glass-border)',
                                                            background: 'rgba(0,0,0,0.2)',
                                                            color: 'white',
                                                            resize: 'vertical',
                                                            minHeight: '60px'
                                                        }}
                                                    />
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {generatedContent.type === 'quiz' && (
                                    <div style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '16px' }}>
                                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Generated Quiz (Editable)</h3>
                                        <div style={{ display: 'grid', gap: '2rem' }}>
                                            {generatedContent.data.map((item, idx) => (
                                                <div key={idx} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Q{idx + 1}.</span>
                                                        <input
                                                            type="text"
                                                            value={item.question}
                                                            onChange={(e) => {
                                                                const newQuiz = [...generatedContent.data];
                                                                newQuiz[idx].question = e.target.value;
                                                                setGeneratedContent({ ...generatedContent, data: newQuiz });
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.5rem',
                                                                borderRadius: '6px',
                                                                border: '1px solid var(--glass-border)',
                                                                background: 'rgba(0,0,0,0.2)',
                                                                color: 'white',
                                                                fontWeight: '600'
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                        {item.options.map((opt, optIdx) => (
                                                            <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', width: '20px' }}>{String.fromCharCode(65 + optIdx)}.</span>
                                                                <input
                                                                    type="text"
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const newQuiz = [...generatedContent.data];
                                                                        newQuiz[idx].options[optIdx] = e.target.value;
                                                                        setGeneratedContent({ ...generatedContent, data: newQuiz });
                                                                    }}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '0.5rem',
                                                                        borderRadius: '6px',
                                                                        border: '1px solid var(--glass-border)',
                                                                        background: 'rgba(0,0,0,0.2)',
                                                                        color: 'var(--text-main)',
                                                                        fontSize: '0.9rem'
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}


                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                                    <button
                                        className="btn-primary"
                                        style={{ width: 'auto', background: '#10b981', borderColor: '#10b981' }}
                                        onClick={handlePrepareEmail}
                                        disabled={!selectedBatchId}
                                    >
                                        <Zap size={18} /> Send to Batch
                                    </button>
                                    <button
                                        className="btn-primary"
                                        style={{ width: 'auto' }}
                                        onClick={() => { setStatus('idle'); setGeneratedContent(null); setSelectedFile(null); setShowEmailModal(false); }}
                                    >
                                        Run Another Task
                                    </button>
                                </div>

                                {/* Email Review Section - Now Inline */}
                                {showEmailModal && (
                                    <div style={{
                                        marginTop: '2rem',
                                        animation: 'fadeIn 0.5s ease-out',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '16px',
                                        padding: '2rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>Review & Edit Email</h2>
                                            <button onClick={() => setShowEmailModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                <X size={24} />
                                            </button>
                                        </div>

                                        <div style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>To:</div>
                                            <div style={{ fontSize: '0.9rem', maxHeight: '60px', overflowY: 'auto' }}>
                                                {emailDraft.recipients.join(', ')}
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Subject</label>
                                            <input
                                                type="text"
                                                value={emailDraft.subject}
                                                onChange={(e) => setEmailDraft({ ...emailDraft, subject: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '2rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Message Body</label>
                                            <textarea
                                                value={emailDraft.body}
                                                onChange={(e) => setEmailDraft({ ...emailDraft, body: e.target.value })}
                                                style={{ width: '100%', height: '250px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', resize: 'vertical' }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                            <button onClick={() => setShowEmailModal(false)} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)', width: 'auto' }}>Cancel</button>
                                            <button
                                                onClick={handleSendEmail}
                                                className="btn-primary"
                                                style={{ width: 'auto', background: 'var(--primary)' }}
                                                disabled={sendingEmail}
                                            >
                                                {sendingEmail ? 'Sending...' : 'Send Emails Now'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}



                        {/* Batch Creation Modal */}
                        {showBatchModal && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001,
                                overflow: 'auto', padding: '2rem'
                            }}>
                                <div className="glass-card" style={{ width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                        <h2 style={{ fontSize: '1.5rem' }}>Create New Batch</h2>
                                        <button onClick={() => setShowBatchModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Batch Name</label>
                                        <input
                                            type="text"
                                            required
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                            value={newBatch.name}
                                            onChange={e => setNewBatch({ ...newBatch, name: e.target.value })}
                                            placeholder="e.g. Class 10A"
                                            autoFocus
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Description (Optional)</label>
                                        <textarea
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', minHeight: '60px', resize: 'vertical' }}
                                            value={newBatch.description}
                                            onChange={e => setNewBatch({ ...newBatch, description: e.target.value })}
                                            placeholder="Brief description of this batch"
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            Add Students
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            <input
                                                type="text"
                                                placeholder="Name"
                                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                                value={studentInput.name}
                                                onChange={e => setStudentInput({ ...studentInput, name: e.target.value })}
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                                value={studentInput.email}
                                                onChange={e => setStudentInput({ ...studentInput, email: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Roll #"
                                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                                value={studentInput.rollNumber}
                                                onChange={e => setStudentInput({ ...studentInput, rollNumber: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddStudent}
                                                style={{
                                                    background: 'var(--primary)',
                                                    border: 'none',
                                                    color: 'white',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    padding: '0.75rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>

                                        {/* Students List */}
                                        {newBatch.students.length > 0 && (
                                            <div style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'hidden', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.5rem', background: 'rgba(0,0,0,0.2)' }}>
                                                {newBatch.students.map((student, index) => (
                                                    <div
                                                        key={index}
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '0.5rem',
                                                            background: 'rgba(0,0,0,0.3)',
                                                            borderRadius: '6px',
                                                            marginBottom: '0.5rem'
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                                                {student.name} {student.rollNumber && `(${student.rollNumber})`}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                {student.email}
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updatedStudents = newBatch.students.filter((_, i) => i !== index);
                                                                setNewBatch({ ...newBatch, students: updatedStudents });
                                                            }}
                                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={handleCreateBatch}
                                        disabled={!newBatch.name || newBatch.students.length === 0}
                                        style={{ opacity: (!newBatch.name || newBatch.students.length === 0) ? 0.5 : 1 }}
                                    >
                                        Create Batch
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Edit Batch Modal */}
                        {showEditBatchModal && editingBatch && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001,
                                overflow: 'auto', padding: '2rem'
                            }}>
                                <div className="glass-card" style={{ width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                        <h2 style={{ fontSize: '1.5rem' }}>Edit Batch: {editingBatch.name}</h2>
                                        <button onClick={() => setShowEditBatchModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleUpdateBatch}>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Batch Name</label>
                                            <input
                                                type="text"
                                                required
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                                value={editingBatch.name}
                                                onChange={e => setEditingBatch({ ...editingBatch, name: e.target.value })}
                                                placeholder="e.g. Class 10A"
                                            />
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Description (Optional)</label>
                                            <textarea
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', minHeight: '60px', resize: 'vertical' }}
                                                value={editingBatch.description}
                                                onChange={e => setEditingBatch({ ...editingBatch, description: e.target.value })}
                                                placeholder="Brief description of this batch"
                                            />
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                Students
                                            </label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Name"
                                                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                                    value={studentInput.name}
                                                    onChange={e => setStudentInput({ ...studentInput, name: e.target.value })}
                                                />
                                                <input
                                                    type="email"
                                                    placeholder="Email"
                                                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                                    value={studentInput.email}
                                                    onChange={e => setStudentInput({ ...studentInput, email: e.target.value })}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Roll #"
                                                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                                    value={studentInput.rollNumber}
                                                    onChange={e => setStudentInput({ ...studentInput, rollNumber: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddStudent}
                                                    style={{
                                                        background: 'var(--primary)',
                                                        border: 'none',
                                                        color: 'white',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        padding: '0.75rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>

                                            {/* Students List */}
                                            {editingBatch.students.length > 0 && (
                                                <div style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'hidden', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.5rem', background: 'rgba(0,0,0,0.2)' }}>
                                                    {editingBatch.students.map((student, index) => (
                                                        <div
                                                            key={index}
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: '0.5rem',
                                                                background: 'rgba(0,0,0,0.3)',
                                                                borderRadius: '6px',
                                                                marginBottom: '0.5rem'
                                                            }}
                                                        >
                                                            <div>
                                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                                                    {student.name} {student.rollNumber && `(${student.rollNumber})`}
                                                                </div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                    {student.email}
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updatedStudents = editingBatch.students.filter((_, i) => i !== index);
                                                                    setEditingBatch({ ...editingBatch, students: updatedStudents });
                                                                }}
                                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteBatch(e, editingBatch._id)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.875rem' }}
                                            >
                                                Delete Batch
                                            </button>
                                            <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Update Batch</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {previousAssessments.length > 0 && (
                            <div className="glass-card" style={{ padding: '0', maxWidth: 'none', overflow: 'hidden' }}>
                                <div
                                    onClick={() => setShowPreviousAssessments(!showPreviousAssessments)}
                                    style={{
                                        padding: '1.5rem 2rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        background: showPreviousAssessments ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <ClipboardList size={22} color="var(--primary)" />
                                        <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Previous Assessments</span>
                                    </div>
                                    {showPreviousAssessments ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>

                                {showPreviousAssessments && (
                                    <div style={{ padding: '0 2rem 2rem 2rem', display: 'grid', gap: '0.75rem' }}>
                                        {previousAssessments.map((item) => (
                                            <div
                                                key={item._id}
                                                onClick={() => {
                                                    setGeneratedContent(item.content);
                                                    setLastActivityId(item._id);
                                                    setStatus('completed');
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                style={{
                                                    padding: '1rem',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '1rem'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.08)';
                                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.1rem' }}>
                                                        {item.title}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(`/assessment/${item._id}`, '_blank');
                                                    }}
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    <Eye size={16} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

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
            </div>
        </DashboardLayout>
    );
};

export default AssignmentWorkspace;
