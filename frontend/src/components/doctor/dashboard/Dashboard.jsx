import React from 'react';
import { useAuth } from '../../../context/AuthContext';

const DoctorDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Doctor Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, Dr. {user?.name || 'Doctor'}</h2>
        <p className="text-gray-700 mb-4">
          This is your doctor dashboard where you can manage patient appointments, 
          create prescriptions, and communicate with your patients.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-700">Patient Appointments</h3>
            <p className="text-gray-600 mt-2">View and manage your scheduled appointments</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-700">Write Prescriptions</h3>
            <p className="text-gray-600 mt-2">Create and manage patient prescriptions</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-700">Patient Messages</h3>
            <p className="text-gray-600 mt-2">Communicate with your patients</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
