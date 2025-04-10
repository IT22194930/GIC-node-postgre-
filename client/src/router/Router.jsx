import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home';
import { useAuth } from '../hooks/useAuth';
import Profile from '../pages/Profile';
import UpdateProfile from '../pages/UpdateProfile';
import AdminHome from '../pages/AdminHome';
import ManageUsers from '../pages/ManageUsers';
import EditUser from '../pages/EditUser';

const AppRouter = () => {
  const { isAuthenticated, user } = useAuth();

  const HomeComponent = () => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    if (user?.role === 'admin') return <Navigate to="/admin" />;
    return <Home />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
        <Route path="/" element={isAuthenticated ? <HomeComponent /> : <Navigate to="/login" />} />
        <Route path="/admin" element={isAuthenticated ? <AdminHome /> : <Navigate to="/login" />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/update-profile" element={<UpdateProfile />} />
        <Route path="/users" element={<ManageUsers />} />
        <Route path="/users/edit/:id" element={<EditUser />} />
      </Routes>
    </Router>
  );
};

export default AppRouter; 