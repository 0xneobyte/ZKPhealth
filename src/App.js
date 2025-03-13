import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./components/auth/Login";
import Dashboard from "./components/dashboard/Dashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import InsuranceDashboard from "./components/insurance/InsuranceDashboard";
import PrivateRoute from "./components/auth/PrivateRoute";
import Navbar from "./components/Navbar";
import { Box, Container } from "@mui/material";

// Layout component to provide consistent structure
const AppLayout = ({ children }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <Container
        component="main"
        sx={{
          flexGrow: 1,
          py: 3,
          px: { xs: 2, sm: 3 },
          animation: "fadeIn 0.5s ease-in-out",
          "@keyframes fadeIn": {
            "0%": { opacity: 0 },
            "100%": { opacity: 1 },
          },
        }}
      >
        {children}
      </Container>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: "auto",
          backgroundColor: "primary.main",
          color: "white",
          textAlign: "center",
          fontSize: "0.875rem",
        }}
      >
        <Container maxWidth="lg">
          © {new Date().getFullYear()} DIGIMED Healthcare - Secure Health Data
          Management
        </Container>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/insurance"
            element={
              <PrivateRoute>
                <AppLayout>
                  <InsuranceDashboard />
                </AppLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
