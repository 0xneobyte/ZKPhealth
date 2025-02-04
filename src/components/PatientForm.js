import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

function PatientForm() {
  const [patientData, setPatientData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    email: "",
    address: "",
  });

  const auth = useAuth();

  if (!auth) {
    return <div>Loading...</div>;
  }

  const { user } = auth;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatientData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Here you would typically make an API call to save the patient data
      console.log("Patient Data:", patientData);
      console.log("Registered by doctor:", user.email);
    } catch (error) {
      console.error("Error registering patient:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Register New Patient</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">First Name</label>
            <input
              type="text"
              name="firstName"
              value={patientData.firstName}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={patientData.lastName}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>

        <div>
          <label className="block mb-1">Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            value={patientData.dateOfBirth}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Gender</label>
          <select
            name="gender"
            value={patientData.gender}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Phone Number</label>
          <input
            type="tel"
            name="phoneNumber"
            value={patientData.phoneNumber}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={patientData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Address</label>
          <textarea
            name="address"
            value={patientData.address}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="3"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Register Patient
        </button>
      </form>
    </div>
  );
}

export default PatientForm;
