import React, { useState } from "react";
import Navbar from "../components/Navbar";
import OrganizationForm from "../components/OrganizationForm";
import UserOrganizations from "../components/UserOrganizations";
import { useAuth } from "../hooks/useAuth";

const Home = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const scrollToForm = () => {
    setShowForm(true);
    setTimeout(() => {
      const formElement = document.getElementById("organization-form");
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-3/5 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                Welcome, {user?.name || "User"}!
              </h1>
              <p className="text-xl md:text-2xl mb-6 opacity-90">
                You're logged in as <span className="font-semibold">{user?.email || "your account"}</span>
              </p>
              
              <button 
                onClick={scrollToForm}
                className="bg-white text-blue-700 px-6 py-3 rounded-lg font-medium text-lg shadow-lg hover:bg-blue-50 transition duration-300 transform hover:scale-105"
              >
                Register an Organization
              </button>
            </div>
            <div className="md:w-2/5 flex justify-center">
              <img 
                src="/gic-logo.png" 
                alt="GIC Logo" 
                className="max-h-64 object-contain filter drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* User Organizations Section */}
        <div className="mb-16">
          <div className="flex items-center mb-8">
            <div className="bg-blue-600 w-1 h-8 mr-4 rounded-full"></div>
            <h2 className="text-3xl font-bold text-gray-800">Your Organizations</h2>
          </div>
          <UserOrganizations />
        </div>
        
        {/* Organization Registration Form */}
        <div id="organization-form" className={`transition-all duration-500 ${showForm ? 'opacity-100' : 'opacity-100'}`}>
          <div className="flex items-center mb-8">
            <div className="bg-green-600 w-1 h-8 mr-4 rounded-full"></div>
            <h2 className="text-3xl font-bold text-gray-800">Register a New Organization</h2>
          </div>
          
          <OrganizationForm />
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <img src="/gic-logo.png" alt="GIC Logo" className="h-12 mb-4" />
              <p className="text-gray-300">© {new Date().getFullYear()} GIC. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Contact Us</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
