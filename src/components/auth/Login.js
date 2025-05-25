import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Shield } from "lucide-react";
import { LoginForm } from "../login-form";

const Login = () => {
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      console.log("Initiating login...");
      await login();
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">DIGIMED</h3>
              <p className="text-sm text-gray-600">Secure • Private • Verified</p>
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm 
              onLogin={handleLogin}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-gray-50 lg:block">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/healthcare-hero.jpg)',
          }}
        ></div>
        
        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
        
        {/* Content */}
        <div className="relative h-full flex flex-col justify-center p-8 text-white">
          {/* Main content - centered */}
          <div className="space-y-12 max-w-lg">
            {/* Hero Section */}
            <div className="space-y-6">
              <h1 className="text-5xl font-bold leading-tight">
                Secure Healthcare
                <br />
                <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                  Data Management
                </span>
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Experience the future of healthcare with Zero-Knowledge Proof technology ensuring complete privacy and security.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid gap-6">
              <div className="group flex items-start gap-4 p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-3 h-3 bg-emerald-400 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform duration-300"></div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-2">End-to-End Encryption</h3>
                  <p className="text-white/80 text-sm leading-relaxed">Your medical data remains completely private and secure with military-grade encryption</p>
                </div>
              </div>
              
              <div className="group flex items-start gap-4 p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-3 h-3 bg-blue-400 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform duration-300"></div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-2">Blockchain Verified</h3>
                  <p className="text-white/80 text-sm leading-relaxed">Immutable records stored on the blockchain ensuring data integrity and trust</p>
                </div>
              </div>
              
              <div className="group flex items-start gap-4 p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-3 h-3 bg-purple-400 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform duration-300"></div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-2">Zero-Knowledge Proofs</h3>
                  <p className="text-white/80 text-sm leading-relaxed">Prove eligibility and authenticity without revealing sensitive personal data</p>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/95 italic text-base leading-relaxed">
                    "Revolutionizing healthcare data management with cutting-edge cryptographic technology that puts privacy first."
                  </p>
                  <p className="text-white/70 text-sm mt-3 font-medium">— Healthcare Innovation Team</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
