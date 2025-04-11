import Navbar from "../components/Navbar";
import OrganizationForm from "../components/OrganizationForm";
import { useAuth } from "../hooks/useAuth";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="rounded-lg p-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, {user?.name || "User"}!
            </h1>
            <p className="text-gray-600">
              You are successfully logged in as {user?.email || "your account"}.
            </p>
          </div>
          <OrganizationForm />
        </div>
      </div>
    </div>
  );
};

export default Home;
