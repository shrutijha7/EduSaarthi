import React from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Star, User, ChevronRight, Plus, X, Edit3, Trash2 } from 'lucide-react';

// Import themed images
import reactThumb from '../assets/react_course.png';
import nodeThumb from '../assets/node_course.png';
import designThumb from '../assets/design_course.png';
import pythonThumb from '../assets/python_course.png';

const Assignments = () => {
    const [assignments, setAssignments] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedAssignment, setSelectedAssignment] = React.useState(null);
    const [showModal, setShowModal] = React.useState(false);
    const [showEditModal, setShowEditModal] = React.useState(false);
    const [editItem, setEditItem] = React.useState({ id: '', title: '', category: '', instructor: '' });
    const [newItem, setNewItem] = React.useState({ title: '', category: '', instructor: '' });
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:3000/api/courses', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const imageMap = {
                    'react_course': reactThumb,
                    'node_course': nodeThumb,
                    'design_course': designThumb,
                    'python_course': pythonThumb
                };

                const mappedAssignments = response.data.data.courses.map(assignment => ({
                    ...assignment,
                    image: imageMap[assignment.imageName] || reactThumb
                }));

                setAssignments(mappedAssignments);
            } catch (error) {
                console.error('Error fetching assignments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, []);

    const handleAutomate = (e, assignment) => {
        e.stopPropagation();
        navigate(`/courses/${assignment._id}`);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // Random image for demo variety
            const randomImg = ['react_course', 'node_course', 'design_course', 'python_course'][Math.floor(Math.random() * 4)];

            const payload = {
                title: newItem.title,
                category: newItem.category,
                instructor: newItem.instructor,
                imageName: randomImg
            };
            const response = await axios.post('http://localhost:3000/api/courses', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Optimistically update or append the new item
            const imageMap = {
                'react_course': reactThumb,
                'node_course': nodeThumb,
                'design_course': designThumb,
                'python_course': pythonThumb
            };

            // Assume API returns the created course object in response.data.data.course
            // If not, we might need to re-fetch or guess the structure. 
            // Safer to just re-fetch if we could, but appending is smoother.
            // Let's rely on the response.
            if (response.data && response.data.data && response.data.data.course) {
                const createdCourse = {
                    ...response.data.data.course,
                    image: imageMap[response.data.data.course.imageName] || imageMap[randomImg] || reactThumb
                };
                setAssignments(prev => [...prev, createdCourse]);
            }

            setShowModal(false);
            setNewItem({ title: '', category: '', instructor: '' });

        } catch (error) {
            console.error('Error creating assignment:', error);
            // alert('Failed to create assignment'); // Removed alert for better UX
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this assignment?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3000/api/courses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssignments(prev => prev.filter(a => a._id !== id));
        } catch (error) {
            console.error('Error deleting assignment:', error);
        }
    };

    const handleEditClick = (e, assignment) => {
        e.stopPropagation();
        setEditItem({
            id: assignment._id,
            title: assignment.title,
            category: assignment.category,
            instructor: assignment.instructor
        });
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(`http://localhost:3000/api/courses/${editItem.id}`, {
                title: editItem.title,
                category: editItem.category,
                instructor: editItem.instructor
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data && response.data.data && response.data.data.course) {
                setAssignments(prev => prev.map(a =>
                    a._id === editItem.id ? { ...a, ...response.data.data.course } : a
                ));
            }
            setShowEditModal(false);
        } catch (error) {
            console.error('Error updating assignment:', error);
            alert('Failed to update assignment: ' + (error.response?.data?.message || error.message));
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <div className="loader">Loading Assignments...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Assignments</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Manage your active automations and process new documents.</p>
                </div>
                <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowModal(true)}>
                    <Plus size={20} /> New Assignment
                </button>
            </header>

            {assignments.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <p>No assignments found. create one to get started.</p>
                </div>
            )}

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="glass-card" style={{ width: '500px', maxWidth: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>Create New Assignment</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Assignment Title</label>
                                <input
                                    type="text"
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                    value={newItem.title}
                                    onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                    placeholder="e.g. Q1 Marketing Report"
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Category</label>
                                <input
                                    type="text"
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                    value={newItem.category}
                                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                    placeholder="e.g. Finance"
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Processor / Lead</label>
                                <input
                                    type="text"
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                    value={newItem.instructor}
                                    onChange={e => setNewItem({ ...newItem, instructor: e.target.value })}
                                    placeholder="e.g. Jane Doe"
                                />
                            </div>
                            <button type="submit" className="btn-primary">Create Assignment</button>
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
                            <h2 style={{ fontSize: '1.5rem' }}>Rename / Edit Assignment</h2>
                            <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Assignment Title</label>
                                <input
                                    type="text"
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                    value={editItem.title}
                                    onChange={e => setEditItem({ ...editItem, title: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Category</label>
                                <input
                                    type="text"
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                    value={editItem.category}
                                    onChange={e => setEditItem({ ...editItem, category: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Processor / Lead</label>
                                <input
                                    type="text"
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                    value={editItem.instructor}
                                    onChange={e => setEditItem({ ...editItem, instructor: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="btn-primary">Update Assignment</button>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                {assignments.map((assignment, i) => (
                    <div
                        key={i}
                        className={`glass-card course-card ${selectedAssignment === assignment._id ? 'selected' : ''}`}
                        onClick={() => setSelectedAssignment(assignment._id)}
                        style={{
                            padding: '0',
                            maxWidth: 'none',
                            overflow: 'hidden',
                            border: selectedAssignment === assignment._id ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                            transform: selectedAssignment === assignment._id ? 'scale(1.02)' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                            <img
                                src={assignment.image}
                                alt={assignment.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                                <span className="tag" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: 'white', border: 'none' }}>
                                    {assignment.category}
                                </span>
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24' }}>
                                    <Star size={16} fill="#fbbf24" />
                                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>Priority: {assignment.rating > 4 ? 'High' : 'Normal'}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button
                                        onClick={(e) => handleEditClick(e, assignment)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
                                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, assignment._id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
                                        onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: '600' }}>{assignment.title}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                <User size={14} />
                                <span>Processor: {assignment.instructor}</span>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Automation Progress</span>
                                    <span style={{ fontWeight: '600' }}>{assignment.progress}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-inner" style={{ width: `${assignment.progress}%`, background: assignment.color }}></div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    <BookOpen size={14} />
                                    <span>{assignment.lessons} Tasks</span>
                                </div>
                                <button
                                    className="btn-primary"
                                    style={{ padding: '0.5rem 1rem', width: 'auto', fontSize: '0.875rem' }}
                                    onClick={(e) => handleAutomate(e, assignment)}
                                >
                                    Automate <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
};

export default Assignments;
