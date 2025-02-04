import React, { useContext, useState, useEffect } from "react";
import { connectWallet } from "../utils/web3";
import { twoFactorService } from "../services/twoFactor.service";
import { getConnectedContract } from "../services/contract.service";
import Verify2FA from "../components/auth/Verify2FA";
import { useNavigate } from "react-router-dom";

export const AuthContext = React.createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [tempAddress, setTempAddress] = useState(null);
  const [tempRole, setTempRole] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        // Check if there's a stored user
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async () => {
    if (isLoggingIn) return;
    try {
      setIsLoggingIn(true);
      setLoading(true);
      console.log("Starting login process...");
      const { signer, address } = await connectWallet();
      console.log("Connected wallet:", address);

      const connectedContract = await getConnectedContract(signer);

      // Check if user is registered
      const isRegistered = await connectedContract.isUserRegistered(address);
      console.log("Is registered:", isRegistered);

      if (!isRegistered) {
        throw new Error("User not registered");
      }

      // Get user role
      const role = await connectedContract.getUserRole(address);
      console.log("User role:", role);

      // Check if 2FA is enabled
      const is2FAEnabled = await connectedContract.is2FAEnabled(address);
      console.log("2FA enabled:", is2FAEnabled);

      if (is2FAEnabled) {
        // Store temporary data and show 2FA dialog
        setTempAddress(address);
        setTempRole(role);
        setRequires2FA(true);
        setShow2FADialog(true);
        console.log("Showing 2FA verification dialog");
      } else {
        // Complete login if 2FA not required
        await completeLogin(address, role);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async (code) => {
    try {
      setLoading(true);
      console.log("Verifying 2FA code...");

      const response = await twoFactorService.verify(tempAddress, code);
      console.log("Verification response:", response);

      if (response.success) {
        console.log("2FA verification successful");
        await completeLogin(tempAddress, tempRole);
        setRequires2FA(false);
        setShow2FADialog(false);
        setTempAddress(null);
        setTempRole(null);
        navigate("/dashboard");
      } else {
        throw new Error("Invalid verification code");
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = async (address, role) => {
    try {
      setUser({
        address,
        role,
        contract: getConnectedContract,
      });
      console.log("Login completed successfully");
      localStorage.setItem("user", JSON.stringify({ address, role }));
    } catch (error) {
      console.error("Complete login error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setRequires2FA(false);
    setShow2FADialog(false);
    setTempAddress(null);
    setTempRole(null);
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        verify2FA,
        requires2FA,
        loading,
        show2FADialog,
        setShow2FADialog,
      }}
    >
      {children}
      {show2FADialog && (
        <Verify2FA
          open={show2FADialog}
          onClose={() => {
            setShow2FADialog(false);
            setRequires2FA(false);
            setTempAddress(null);
            setTempRole(null);
          }}
        />
      )}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
