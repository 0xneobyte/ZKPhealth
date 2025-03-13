import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenu = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleClose();
    navigate("/");
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    handleMenuClose();
  };

  if (!user) return null;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: "white",
        borderBottom: "1px solid #e0e0e0",
        mb: 2,
        transition: "all 0.3s ease",
      }}
    >
      <Toolbar>
        <Box
          display="flex"
          alignItems="center"
          className="animate-fade-in"
          sx={{ flexGrow: { xs: 1, md: 0 } }}
        >
          <LocalHospitalIcon
            sx={{
              mr: 1,
              color: "primary.main",
              fontSize: "2rem",
              animation: "pulse 2s infinite",
              "@keyframes pulse": {
                "0%": { opacity: 0.7, transform: "scale(1)" },
                "50%": { opacity: 1, transform: "scale(1.1)" },
                "100%": { opacity: 0.7, transform: "scale(1)" },
              },
            }}
          />
          <Typography
            variant="h6"
            component={Link}
            to="/dashboard"
            sx={{
              color: "primary.main",
              textDecoration: "none",
              fontWeight: "bold",
              display: { xs: "none", sm: "block" },
            }}
          >
            DIGIMED
          </Typography>
        </Box>

        {/* Mobile menu */}
        {isMobile ? (
          <>
            <IconButton
              edge="start"
              color="primary"
              aria-label="menu"
              onClick={handleMobileMenu}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchorEl}
              keepMounted
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
            >
              {user?.role === "admin" && (
                <MenuItem onClick={() => handleMenuItemClick("/admin")}>
                  Admin Dashboard
                </MenuItem>
              )}
              {user?.role === "insurance" && (
                <MenuItem onClick={() => handleMenuItemClick("/insurance")}>
                  Insurance Portal
                </MenuItem>
              )}
              {user?.role === "doctor" && (
                <MenuItem onClick={() => handleMenuItemClick("/dashboard")}>
                  Doctor Dashboard
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Box
              sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}
            >
              {user?.role === "admin" && (
                <Button
                  color="primary"
                  component={Link}
                  to="/admin"
                  sx={{
                    mx: 1,
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-3px)" },
                  }}
                >
                  Admin Dashboard
                </Button>
              )}
              {user?.role === "insurance" && (
                <Button
                  color="primary"
                  component={Link}
                  to="/insurance"
                  sx={{
                    mx: 1,
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-3px)" },
                  }}
                >
                  Insurance Portal
                </Button>
              )}
              {user?.role === "doctor" && (
                <Button
                  color="primary"
                  component={Link}
                  to="/dashboard"
                  sx={{
                    mx: 1,
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-3px)" },
                  }}
                >
                  Doctor Dashboard
                </Button>
              )}
            </Box>

            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Account settings">
                <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      transition: "all 0.3s ease",
                      "&:hover": { bgcolor: "primary.dark" },
                    }}
                  >
                    <AccountCircleIcon />
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2" color="textSecondary">
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
