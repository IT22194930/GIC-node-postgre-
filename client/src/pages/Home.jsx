import React, { useState } from "react";
import Navbar from "../components/Navbar";
import OrganizationForm from "../components/OrganizationForm";
import ServiceForm from "../components/ServiceForm";
import UserOrganizations from "../components/UserOrganizations";
import UserServices from "../components/UserServices";
import { useAuth } from "../hooks/useAuth";

const Home = () => {
  const { user } = useAuth();
  const [activeForm, setActiveForm] = useState("organizations"); // "organizations" or "services"
  const [showForm, setShowForm] = useState(false);

  const scrollToForm = (formType) => {
    setActiveForm(formType);
    setShowForm(true);
    setTimeout(() => {
      const formElement = document.getElementById("form-section");
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
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button 
                  onClick={() => scrollToForm("organizations")}
                  className="bg-white text-blue-700 px-6 py-3 rounded-lg font-medium text-lg shadow-lg hover:bg-blue-50 transition duration-300 transform hover:scale-105"
                >
                  Register an Organization
                </button>
                <button 
                  onClick={() => scrollToForm("services")}
                  className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium text-lg shadow-lg hover:bg-indigo-600 transition duration-300 transform hover:scale-105 border border-indigo-400"
                >
                  Add Services
                </button>
              </div>
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
          <div className="bg-white rounded-lg shadow-md">
            <UserOrganizations />
          </div>
        </div>

        {/* User Services Section */}
        <div className="mb-16">
          <div className="flex items-center mb-8">
            <div className="bg-indigo-600 w-1 h-8 mr-4 rounded-full"></div>
            <h2 className="text-3xl font-bold text-gray-800">Your Services</h2>
          </div>
          <div className="bg-white rounded-lg shadow-md">
            <UserServices />
          </div>
        </div>
        
        {/* Registration Forms */}
        {showForm && (
          <div id="form-section" className="transition-all duration-500">
            <div className="flex items-center mb-6">
              <div className={`${activeForm === "organizations" ? "bg-green-600" : "bg-purple-600"} w-1 h-8 mr-4 rounded-full`}></div>
              <h2 className="text-3xl font-bold text-gray-800">
                {activeForm === "organizations" ? "Register a New Organization" : "Add Services to an Organization"}
              </h2>
            </div>
            
            <div className="mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-center">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setActiveForm("organizations")}
                      className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                        activeForm === "organizations"
                          ? "bg-blue-600 text-white shadow"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Organization Details
                    </button>
                    <button
                      onClick={() => setActiveForm("services")}
                      className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                        activeForm === "services"
                          ? "bg-purple-600 text-white shadow"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Services
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {activeForm === "organizations" ? <OrganizationForm /> : <ServiceForm />}
          </div>
        )}
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
