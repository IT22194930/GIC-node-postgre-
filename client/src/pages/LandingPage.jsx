import React from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-950 text-white relative overflow-hidden">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute w-full h-full">
          {Array.from({ length: 15 }).map((_, i) => (
            <div 
              key={i}
              className="absolute bg-blue-400 rounded-full"
              style={{
                width: Math.random() * 6 + 4 + "px",
                height: Math.random() * 6 + 4 + "px",
                top: Math.random() * 100 + "%",
                left: Math.random() * 100 + "%",
                animation: `float ${Math.random() * 5 + 3}s infinite linear`
              }}
            />
          ))}
        </div>
        
        {/* Light accent */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-500 rounded-full filter blur-[100px] opacity-20"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full filter blur-[100px] opacity-20"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <img src="/gic-logo.png" alt="GIC Logo" className="h-12 sm:h-16 mb-4 sm:mb-0" />
          <div className="flex space-x-3 sm:space-x-4">
            <Link to="/login" className="px-4 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 transition-colors rounded-full font-medium text-sm sm:text-base">Login</Link>
            <Link to="/register" className="px-4 sm:px-5 py-2 bg-transparent border border-blue-500 hover:bg-blue-800/30 transition-colors rounded-full font-medium text-sm sm:text-base">Register</Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-12 flex flex-col items-center text-center">
        {/* Hero section */}
        <div className="mb-6 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-3 md:mb-4 text-blue-100 leading-tight">
            Organization Information Portal
          </h1>
          <h2 className="text-lg sm:text-xl md:text-3xl font-medium mb-4 md:mb-5 text-blue-200">
            Submit and manage your organization's details
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto text-blue-300 px-2 md:px-4">
            A secure platform for organization officers to register and update their organization information 
            and service details for the Government Information Centre database.
          </p>
        </div>

        {/* Visual elements - 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 md:mb-16 w-full max-w-5xl px-2">
          {/* Organization Registration */}
          <div className="bg-blue-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-blue-700/30 flex flex-col items-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-700/70 flex items-center justify-center mb-3 sm:mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Register Organization</h3>
            <p className="text-blue-200 text-center text-sm sm:text-base">Submit your organization's details and contact information</p>
          </div>

          {/* Service Details */}
          <div className="bg-blue-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-blue-700/30 flex flex-col items-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-700/70 flex items-center justify-center mb-3 sm:mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Manage Services</h3>
            <p className="text-blue-200 text-center text-sm sm:text-base">Document the services your organization provides to the public</p>
          </div>

          {/* Information Update */}
          <div className="bg-blue-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-blue-700/30 flex flex-col items-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-700/70 flex items-center justify-center mb-3 sm:mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Keep Info Updated</h3>
            <p className="text-blue-200 text-center text-sm sm:text-base">Easily update your organization's information when changes occur</p>
          </div>
        </div>

        {/* CTA section */}
        <div className="mt-2 sm:mt-4 mb-6 sm:mb-8">
          <Link to="/register" className="px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 transition-colors rounded-full font-medium text-base sm:text-lg inline-block">
            Register as an Organization Officer
          </Link>
        </div>

        {/* Contact info - simplified */}
        <div className="mt-2 text-center">
          <p className="text-blue-200">
            Need assistance? Contact: <a href="mailto:support@gic.gov.lk" className="text-blue-300 hover:text-white">support@gic.gov.lk</a>
          </p>
        </div>
      </main>

      {/* Footer with language options */}
      <footer className="relative z-10 py-4 mt-8 border-t border-blue-800/30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-center items-center">
          <div className="flex items-center mb-2 md:mb-0">
            <img src="/sl-logo.png" alt="Sri Lanka Logo" className="h-10 mr-3" />
            <p className="text-blue-300 text-sm">© {new Date().getFullYear()} Organization Information Portal</p>
          </div>
        </div>
      </footer>

      {/* Adding animation styles via regular style tag */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-20px) translateX(10px); }
            100% { transform: translateY(0px) translateX(0px); }
          }
        `
      }} />
    </div>
  );
};

export default LandingPage;