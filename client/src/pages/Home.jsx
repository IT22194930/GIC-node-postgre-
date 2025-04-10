import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-gray-200 rounded-lg h-96 p-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome, {user?.name || 'User'}!
            </h1>
            <p className="text-gray-600 mb-4">
              You are successfully logged in as {user?.email || 'your account'}.
            </p>
            <div className="mt-4">
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 