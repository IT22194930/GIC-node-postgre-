import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-gray-200 rounded-lg h-96 p-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome, {user?.name || 'User'}!
            </h1>
            <p className="text-gray-600 mb-4">
              You are successfully logged in as {user?.email || 'your account'}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 