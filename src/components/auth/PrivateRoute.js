import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { CircularProgress, Box } from "@mui/material";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  console.log("PrivateRoute - User:", user);
  console.log("PrivateRoute - Path:", window.location.pathname);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return user ? children : <Navigate to="/" />;
};

export default PrivateRoute;
