import React from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Star, User, ChevronRight } from 'lucide-react';

// Import themed images
import reactThumb from '../assets/react_course.png';
import nodeThumb from '../assets/node_course.png';
import designThumb from '../assets/design_course.png';
import pythonThumb from '../assets/python_course.png';

const Assignments = () => {
    const [assignments, setAssignments] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedAssignment, setSelectedAssignment] = React.useState(null);
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
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Assignments</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Manage your active automations and process new documents.</p>
            </header>

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
