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
          <div className="flex items-center gap-2 font-medium text-gray-900">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-white">
              <Shield className="size-4" />
            </div>
            ZKP Health
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
        <div className="relative h-full flex flex-col justify-between p-8 text-white">
          {/* Top section with logo/branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">ZKP Health</h3>
              <p className="text-sm text-white/80">Secure • Private • Verified</p>
            </div>
          </div>

          {/* Main content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold leading-tight">
                Secure Healthcare
                <br />
                <span className="text-blue-300">Data Management</span>
              </h2>
              <p className="text-xl text-white/90 max-w-md">
                Experience the future of healthcare with Zero-Knowledge Proof technology
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="w-3 h-3 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-white">End-to-End Encryption</h4>
                  <p className="text-white/80 text-sm">Your medical data remains private and secure</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="w-3 h-3 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-white">Blockchain Verified</h4>
                  <p className="text-white/80 text-sm">Immutable records on the blockchain</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="w-3 h-3 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-white">Zero-Knowledge Proofs</h4>
                  <p className="text-white/80 text-sm">Prove eligibility without revealing data</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom quote/testimonial */}
          <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
            <p className="text-white/90 italic text-sm">
              "Revolutionizing healthcare data management with cutting-edge cryptographic technology."
            </p>
            <p className="text-white/70 text-xs mt-2">— Healthcare Innovation Team</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
