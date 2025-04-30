import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home';
import LandingPage from '../pages/LandingPage';
import { useAuth } from '../hooks/useAuth';
import Profile from '../pages/Profile';
import UpdateProfile from '../pages/UpdateProfile';
import AdminHome from '../pages/AdminHome';
import ManageUsers from '../pages/ManageUsers';
import EditUser from '../pages/EditUser';
import ManageOrganizations from '../pages/ManageOrganizations';
import OrganizationDetail from '../pages/OrganizationDetail';
import OrganizationUserView from '../pages/OrganizationUserView';
import OrganizationEdit from '../pages/OrganizationEdit';

const AppRouter = () => {
  const { isAuthenticated, user } = useAuth();

  const HomeComponent = () => {
    if (!isAuthenticated) return <LandingPage />;
    if (user?.role === 'admin') return <Navigate to="/admin" />;
    return <Home />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
        <Route path="/" element={<HomeComponent />} />
        <Route path="/admin" element={isAuthenticated ? <AdminHome /> : <Navigate to="/login" />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/update-profile" element={<UpdateProfile />} />
        <Route path="/users" element={<ManageUsers />} />
        <Route path="/users/edit/:id" element={<EditUser />} />
        
        {/* Regular organizations routes */}
        <Route path="/organizations" element={<ManageOrganizations />} />
        <Route path="/organizations/:id" element={<OrganizationDetail />} />
        <Route path="/organizations/:id/details" element={<OrganizationUserView />} />
        <Route path="/organizations/:id/edit" element={<OrganizationEdit />} />
        
        {/* Pending organizations routes */}
        <Route path="/pending-organizations/:id/details" element={<OrganizationUserView isPending={true} />} />
        <Route path="/pending-organizations/:id/edit" element={<OrganizationEdit isPending={true} />} />
        <Route path="/pending-organizations/:id" element={<OrganizationDetail isPending={true} />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;