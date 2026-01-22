import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Schedule from './pages/Schedule';
import CourseDetail from './pages/CourseDetail';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ViewAssessment from './pages/ViewAssessment';
import QuestionBank from './pages/QuestionBank';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: 'white' }}>
        <div className="loader">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

const CourseRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/subjects/${id}`} replace />;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return <Navigate to="/dashboard" replace />;
};

const App = () => {
  React.useEffect(() => {
    const savedColor = localStorage.getItem('themeColor');
    if (savedColor) {
      document.documentElement.style.setProperty('--primary', savedColor);
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects"
            element={
              <ProtectedRoute>
                <Subjects />
              </ProtectedRoute>
            }
          />
          <Route path="/courses" element={<Navigate to="/subjects" />} />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <Schedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:id"
            element={<CourseRedirect />}
          />
          <Route
            path="/subjects/:id"
            element={
              <ProtectedRoute>
                <CourseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/:id"
            element={
              <ProtectedRoute>
                <ViewAssessment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/question-bank"
            element={
              <ProtectedRoute>
                <QuestionBank />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
