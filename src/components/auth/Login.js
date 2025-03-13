import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box,
  Button,
  Typography,
  Container,
  Alert,
  Paper,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";

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
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #e4efe9 100%)",
        px: 2,
      }}
    >
      <Container maxWidth="sm" className="animate-fade-in">
        <Card
          elevation={8}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            transition: "transform 0.3s ease-in-out",
            "&:hover": {
              transform: "translateY(-10px)",
            },
          }}
        >
          <CardMedia
            sx={{
              height: 120,
              bgcolor: "primary.main",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              overflow: "hidden",
              "&::after": {
                content: '""',
                position: "absolute",
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(45deg, rgba(46, 125, 50, 0.7) 0%, rgba(76, 175, 80, 0.4) 100%)",
                zIndex: 1,
              },
            }}
          >
            <Box
              sx={{
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
              }}
            >
              <LocalHospitalIcon
                sx={{
                  fontSize: 60,
                  color: "white",
                  mb: 1,
                  animation: "pulse 2s infinite",
                  "@keyframes pulse": {
                    "0%": { transform: "scale(1)", opacity: 0.8 },
                    "50%": { transform: "scale(1.2)", opacity: 1 },
                    "100%": { transform: "scale(1)", opacity: 0.8 },
                  },
                }}
              />
            </Box>
          </CardMedia>
          <CardContent sx={{ p: 4 }}>
            <Typography
              component="h1"
              variant="h4"
              align="center"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: "primary.main",
                mb: 3,
                animation: "slideUp 0.8s ease-out",
                "@keyframes slideUp": {
                  "0%": { transform: "translateY(20px)", opacity: 0 },
                  "100%": { transform: "translateY(0)", opacity: 1 },
                },
              }}
            >
              DIGIMED Healthcare
            </Typography>

            <Typography
              variant="subtitle1"
              align="center"
              gutterBottom
              sx={{
                mb: 3,
                color: "text.secondary",
                animation: "slideUp 0.8s ease-out 0.2s both",
              }}
            >
              Secure Health Data Management System
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{
                  width: "100%",
                  mb: 3,
                  animation: "shake 0.5s cubic-bezier(.36,.07,.19,.97) both",
                }}
              >
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={handleLogin}
              disabled={loading}
              sx={{
                py: 1.5,
                mt: 2,
                fontWeight: 600,
                animation: "slideUp 0.8s ease-out 0.4s both",
                position: "relative",
                overflow: "hidden",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  top: 0,
                  left: "-100%",
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)",
                  transition: "all 0.6s",
                },
                "&:hover::after": {
                  left: "100%",
                },
              }}
            >
              {loading ? "Connecting..." : "Connect with MetaMask"}
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;
