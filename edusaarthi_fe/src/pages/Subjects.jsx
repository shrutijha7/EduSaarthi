import React from 'react';
import api from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, User, ChevronRight, Plus, X, Edit3, Trash2, Upload, File, Users } from 'lucide-react';

// Import themed images
import reactThumb from '../assets/react_course.png';
import nodeThumb from '../assets/node_course.png';
import designThumb from '../assets/design_course.png';
import pythonThumb from '../assets/python_course.png';
import automationThumb from '../assets/automation_workflow.png';
import gradingThumb from '../assets/grading_automation.png';
import docAiThumb from '../assets/document_ai.png';
import studentThumb from '../assets/student_portal.png';

const Subjects = () => {
    const [searchParams] = useSearchParams();
    const [subjects, setSubjects] = React.useState([]);
    const [batches, setBatches] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedSubject, setSelectedSubject] = React.useState(null);
    const [showModal, setShowModal] = React.useState(false);
    const [showEditModal, setShowEditModal] = React.useState(false);
    const [showBatchModal, setShowBatchModal] = React.useState(false);
    const [showEditBatchModal, setShowEditBatchModal] = React.useState(false);
    const [editItem, setEditItem] = React.useState({ id: '', title: '' });
    const [newItem, setNewItem] = React.useState({ title: '', files: [], selectedBatches: [] });
    const [newBatch, setNewBatch] = React.useState({ name: '', description: '', students: [] });
    const [editingBatch, setEditingBatch] = React.useState(null);
    const [studentInput, setStudentInput] = React.useState({ name: '', email: '', rollNumber: '' });
    const [selectedBatchId, setSelectedBatchId] = React.useState('all');
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [subjectsRes, batchesRes] = await Promise.all([
                    api.get('/api/subjects'),
                    api.get('/api/batches')
                ]);

                const imageMap = {
                    'react_course': reactThumb,
                    'node_course': nodeThumb,
                    'design_course': designThumb,
                    'python_course': pythonThumb,
                    'automation_workflow': automationThumb,
                    'grading_automation': gradingThumb,
                    'document_ai': docAiThumb,
                    'student_portal': studentThumb
                };

                const mappedSubjects = subjectsRes.data.data.subjects.map(subject => ({
                    ...subject,
                    image: imageMap[subject.imageName] || reactThumb
                }));

                setSubjects(mappedSubjects);
                setBatches(batchesRes.data.data.batches || []);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setNewItem({ ...newItem, files: [...newItem.files, ...files] });
    };

    const removeFile = (index) => {
        const updatedFiles = newItem.files.filter((_, i) => i !== index);
        setNewItem({ ...newItem, files: updatedFiles });
    };

    const toggleBatchSelection = (batchId) => {
        const isSelected = newItem.selectedBatches.includes(batchId);
        const updatedBatches = isSelected
            ? newItem.selectedBatches.filter(id => id !== batchId)
            : [...newItem.selectedBatches, batchId];
        setNewItem({ ...newItem, selectedBatches: updatedBatches });
    };

    const handleAddStudent = () => {
        if (studentInput.name && studentInput.email) {
            setNewBatch({
                ...newBatch,
                students: [...newBatch.students, { ...studentInput }]
            });
            setStudentInput({ name: '', email: '', rollNumber: '' });
        }
    };

    const handleCreateBatch = async () => {
        try {
            const response = await api.post('/api/batches', newBatch);
            const createdBatch = response.data.data.batch;
            setBatches([...batches, createdBatch]);
            setNewItem({ ...newItem, selectedBatches: [...newItem.selectedBatches, createdBatch._id] });
            setShowBatchModal(false);
            setNewBatch({ name: '', description: '', students: [] });
        } catch (error) {
            console.error('Error creating batch:', error);
            alert('Failed to create batch: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleEditBatchClick = (e, batch) => {
        e.stopPropagation();
        setEditingBatch({ ...batch });
        setShowEditBatchModal(true);
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
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this batch?')) return;
        try {
            await api.delete(`/api/batches/${id}`);
            setBatches(prev => prev.filter(b => b._id !== id));
            if (selectedBatchId === id) setSelectedBatchId('all');
        } catch (error) {
            console.error('Error deleting batch:', error);
        }
    };

    const handleAutomate = (e, subject) => {
        e.stopPropagation();
        navigate(`/subjects/${subject._id}`);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // Random image for demo variety
            const imgOptions = ['automation_workflow', 'grading_automation', 'document_ai', 'student_portal'];
            const randomImg = imgOptions[Math.floor(Math.random() * imgOptions.length)];

            const payload = {
                title: newItem.title,
                category: 'General',
                instructor: 'Self',
                imageName: randomImg,
                batches: newItem.selectedBatches
            };

            console.log('Creating subject with payload:', payload);
            const response = await api.post('/api/subjects', payload);
            const createdSubject = response.data.data.subject;
            console.log('Subject created successfully:', createdSubject);

            // Upload files if any
            if (newItem.files.length > 0) {
                for (const file of newItem.files) {
                    const formData = new FormData();
                    formData.append('file', file);

                    try {
                        await api.post(`/api/subjects/${createdSubject._id}/files`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                    } catch (error) {
                        console.error('Error uploading file:', error);
                    }
                }

                // Refresh subject data to get updated file list
                const updatedSubject = await api.get(`/api/subjects/${createdSubject._id}`);
                createdSubject.files = updatedSubject.data.data.subject.files;
                createdSubject.lessons = updatedSubject.data.data.subject.lessons;
            }

            // Optimistically update or append the new item
            const imageMap = {
                'react_course': reactThumb,
                'node_course': nodeThumb,
                'design_course': designThumb,
                'python_course': pythonThumb,
                'automation_workflow': automationThumb,
                'grading_automation': gradingThumb,
                'document_ai': docAiThumb,
                'student_portal': studentThumb
            };

            const finalSubject = {
                ...createdSubject,
                image: imageMap[createdSubject.imageName] || imageMap[randomImg] || reactThumb
            };

            setSubjects(prev => [...prev, finalSubject]);
            setShowModal(false);
            setNewItem({ title: '', files: [], selectedBatches: [] });

            // Auto-navigate to the new subject's detail page
            navigate(`/subjects/${createdSubject._id}`);

        } catch (error) {
            console.error('Error creating subject:', error);
            console.error('Error response:', error.response?.data);
            alert('Failed to create subject: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this subject? All associated files will be deleted.')) return;

        try {
            const token = localStorage.getItem('token');
            await api.delete(`/api/subjects/${id}`);
            setSubjects(prev => prev.filter(s => s._id !== id));
        } catch (error) {
            console.error('Error deleting subject:', error);
        }
    };

    const handleEditClick = (e, subject) => {
        e.stopPropagation();
        setEditItem({
            id: subject._id,
            title: subject.title
        });
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await api.patch(`/api/subjects/${editItem.id}`, {
                title: editItem.title
            });

            if (response.data && response.data.data && response.data.data.subject) {
                setSubjects(prev => prev.map(s =>
                    s._id === editItem.id ? { ...s, ...response.data.data.subject } : s
                ));
            }
            setShowEditModal(false);
        } catch (error) {
            console.error('Error updating subject:', error);
            alert('Failed to update subject: ' + (error.response?.data?.message || error.message));
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <div className="loader">Loading Subjects...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="page-transition">
                <header style={{ marginBottom: '3rem' }} className="animate-slide-up">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Subjects</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Manage your subjects and process documents with AI.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn-primary pulse-primary" style={{ width: 'auto' }} onClick={() => setShowModal(true)}>
                                <Plus size={20} /> New Subject
                            </button>
                        </div>
                    </div>

                    {/* Batch Management Panel at top left */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflowX: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '600', minWidth: 'fit-content' }}>
                            <Users size={20} />
                            <span>Batches:</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => setSelectedBatchId('all')}
                                style={{
                                    padding: '0.4rem 1rem',
                                    borderRadius: '20px',
                                    background: selectedBatchId === 'all' ? 'var(--primary)' : 'rgba(0,0,0,0.2)',
                                    color: selectedBatchId === 'all' ? 'white' : 'var(--text-muted)',
                                    border: '1px solid var(--glass-border)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                All Subjects
                            </button>
                            {batches.map(batch => (
                                <div key={batch._id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <button
                                        onClick={() => setSelectedBatchId(batch._id)}
                                        style={{
                                            padding: '0.4rem 1rem',
                                            borderRadius: '20px',
                                            background: selectedBatchId === batch._id ? 'var(--primary)' : 'rgba(0,0,0,0.2)',
                                            color: selectedBatchId === batch._id ? 'white' : 'var(--text-muted)',
                                            border: '1px solid var(--glass-border)',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            transition: 'all 0.2s',
                                            whiteSpace: 'nowrap',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        {batch.name}
                                        <div
                                            onClick={(e) => handleEditBatchClick(e, batch)}
                                            style={{ display: 'flex', alignItems: 'center', opacity: 0.6 }}
                                            title="Edit Batch"
                                        >
                                            <Edit3 size={12} />
                                        </div>
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setShowBatchModal(true)}
                                style={{
                                    padding: '0.4rem 1rem',
                                    borderRadius: '20px',
                                    background: 'transparent',
                                    color: 'var(--primary)',
                                    border: '1px dashed var(--primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <Plus size={14} /> New Batch
                            </button>
                        </div>
                    </div>
                </header>

                {subjects.length === 0 && (
                    <div className="glass-card animate-slide-up" style={{ textAlign: 'center', padding: '5rem 2rem', maxWidth: '600px', margin: '4rem auto' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <BookOpen size={40} color="var(--primary)" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No subjects yet</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Ready to start? Create your first subject to begin processing documents with AI.</p>
                        <button className="btn-primary" style={{ width: 'auto', margin: '0 auto' }} onClick={() => setShowModal(true)}>
                            <Plus size={20} /> Create Subject
                        </button>
                    </div>
                )}

                {showModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                        overflow: 'auto', padding: '2rem'
                    }}>
                        <div className="glass-card" style={{ width: '600px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem' }}>Create New Subject</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleCreate}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Subject Title</label>
                                    <input
                                        type="text"
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                        value={newItem.title}
                                        onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                        placeholder="e.g. Mathematics"
                                        autoFocus
                                    />
                                </div>

                                {/* File Upload Section */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        <File size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                        Upload Files (Optional)
                                    </label>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                        id="file-upload"
                                        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '8px',
                                            border: '1px dashed var(--glass-border)',
                                            background: 'rgba(0,0,0,0.2)',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                                    >
                                        <Upload size={18} />
                                        Choose Files
                                    </label>
                                    {newItem.files.length > 0 && (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            {newItem.files.map((file, index) => (
                                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', marginBottom: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{file.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Batch Selection/Creation Section */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            <Users size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                            Select Batches (Optional)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowBatchModal(true)}
                                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                        >
                                            <Plus size={14} /> Create New Batch
                                        </button>
                                    </div>
                                    <div style={{ maxHeight: '150px', overflow: 'auto', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.5rem', background: 'rgba(0,0,0,0.2)' }}>
                                        {batches.length === 0 ? (
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>No batches available. Create one!</p>
                                        ) : (
                                            batches.map(batch => (
                                                <label
                                                    key={batch._id}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer', borderRadius: '6px', transition: 'background 0.2s' }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.1)'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={newItem.selectedBatches.includes(batch._id)}
                                                        onChange={() => toggleBatchSelection(batch._id)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{batch.name}</div>
                                                        {batch.description && (
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{batch.description}</div>
                                                        )}
                                                    </div>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <button type="submit" className="btn-primary">Create Subject</button>
                            </form>
                        </div>
                    </div>
                )}

                {showEditModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }}>
                        <div className="glass-card" style={{ width: '500px', maxWidth: '90%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem' }}>Edit Subject</h2>
                                <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdate}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Subject Title</label>
                                    <input
                                        type="text"
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                        value={editItem.title}
                                        onChange={e => setEditItem({ ...editItem, title: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <button type="submit" className="btn-primary">Update Subject</button>
                            </form>
                        </div>
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
                        <div className="glass-card" style={{ width: '600px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto' }}>
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
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px auto', gap: '0.5rem', marginBottom: '0.75rem' }}>
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
                                    <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.5rem', background: 'rgba(0,0,0,0.2)' }}>
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
                        <div className="glass-card" style={{ width: '600px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto' }}>
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
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px auto', gap: '0.5rem', marginBottom: '0.75rem' }}>
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
                                            onClick={() => {
                                                if (studentInput.name && studentInput.email) {
                                                    setEditingBatch({
                                                        ...editingBatch,
                                                        students: [...editingBatch.students, { ...studentInput }]
                                                    });
                                                    setStudentInput({ name: '', email: '', rollNumber: '' });
                                                }
                                            }}
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
                                        <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.5rem', background: 'rgba(0,0,0,0.2)' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                    {subjects.filter(s => {
                        const q = searchParams.get('q')?.toLowerCase() || '';
                        const matchesSearch = s.title.toLowerCase().includes(q);
                        const matchesBatch = selectedBatchId === 'all' || (s.batches && s.batches.some(b => (b._id || b) === selectedBatchId));
                        return matchesSearch && matchesBatch;
                    }).map((subject, i) => (
                        <div
                            key={i}
                            className={`glass-card course-card animate-slide-up delay-${(i % 5) * 100} ${selectedSubject === subject._id ? 'selected' : ''}`}
                            onClick={(e) => handleAutomate(e, subject)}
                            style={{
                                padding: '0',
                                maxWidth: 'none',
                                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                                border: selectedSubject === subject._id ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                transform: selectedSubject === subject._id ? 'scale(1.02)' : 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                                <img
                                    src={subject.image}
                                    alt={subject.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                                    <span className="tag" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: 'white', border: 'none' }}>
                                        {subject.category}
                                    </span>
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button
                                            onClick={(e) => handleEditClick(e, subject)}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
                                            onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                                            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, subject._id)}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
                                            onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                                            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: '600' }}>{subject.title}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                    <User size={14} />
                                    <span>Instructor: {subject.instructor}</span>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                                        <span style={{ fontWeight: '600' }}>{subject.progress}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-inner" style={{ width: `${subject.progress}%`, background: subject.color }}></div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        <BookOpen size={14} />
                                        <span>{subject.lessons} Files</span>
                                    </div>
                                    <button
                                        className="btn-primary"
                                        style={{ padding: '0.5rem 1rem', width: 'auto', fontSize: '0.875rem' }}
                                        onClick={(e) => handleAutomate(e, subject)}
                                    >
                                        Open <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Subjects;
