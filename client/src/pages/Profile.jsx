import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Function to format date in a more readable way
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get user initials for the avatar
  const getInitials = () => {
    if (!user?.name) return '?';
    return user.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-blue-600 py-6 px-8">
            <h1 className="text-3xl font-bold text-white">Profile</h1>
            <p className="text-blue-100 mt-1">Manage your account information</p>
          </div>
          
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8">
                <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md">
                  {getInitials()}
                </div>
              </div>
              
              <div className="flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Name</h3>
                    <p className="mt-2 text-xl font-semibold text-gray-800">{user?.name || 'Not set'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Email</h3>
                    <p className="mt-2 text-xl font-semibold text-gray-800 break-all">{user?.email || 'Not set'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Account Created</h3>
                    <p className="mt-2 text-xl font-semibold text-gray-800">{formatDate(user?.created_at)}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Account Type</h3>
                    <p className="mt-2 text-xl font-semibold text-gray-800">
                      {user?.is_admin ? 'Administrator' : 'Standard User'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-10 flex justify-center md:justify-end">
              <button
                onClick={() => navigate('/update-profile')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm font-medium transition-colors duration-300 flex items-center shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;