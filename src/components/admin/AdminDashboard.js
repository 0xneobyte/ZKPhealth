import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Button,
  Grid,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  Badge,
  Container,
  Fade,
  alpha,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  NetworkCheck as NetworkIcon,
  Person as PersonIcon,
  Shield as ShieldIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import PacketLogViewer from "./PacketLogViewer";

function AdminDashboard() {
  const { user, logout } = useAuth();
  console.log("AdminDashboard - User:", user);
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ML data states
  const [xssStats, setXssStats] = useState(null);
  const [ddosStats, setDdosStats] = useState(null);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState("");

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);

    // Load ML data when security tab is selected
    if (newValue === 2 && !xssStats) {
      fetchSecurityData();
    }
  };

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Function to fetch security monitoring data
  const fetchSecurityData = async () => {
    try {
      setMlLoading(true);
      setMlError("");
      const apiUrl = process.env.REACT_APP_API_URL;

      const response = await fetch(`${apiUrl}/ml/dashboard`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched security data:", data);

      setXssStats(data.xss);
      setDdosStats(data.ddos);
      setSecurityAlerts(data.alerts);
    } catch (error) {
      console.error("Error fetching security data:", error);
      setMlError(`Failed to fetch security data: ${error.message}`);
    } finally {
      setMlLoading(false);
    }
  };

  // Format data for pie charts
  const formatPieData = (byType) => {
    if (!byType) return [];

    return Object.entries(byType).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL;

      // First check if the server is running
      try {
        const healthCheck = await fetch(`${apiUrl}/health`, {
          credentials: "include",
        });
        if (!healthCheck.ok) {
          throw new Error("Backend server is not running");
        }
      } catch (error) {
        throw new Error(
          `Cannot connect to server at ${apiUrl}. Is it running?`
        );
      }

      console.log("Fetching users from:", `${apiUrl}/auth/users`);
      const response = await fetch(`${apiUrl}/auth/users`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "Users endpoint not found. Check your backend routes."
          );
        }
        const errorData = await response.text();
        console.error("Server response:", errorData);
        throw new Error(`Server returned ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      console.log("Fetched users:", data);
      setUsers(data);
      setError("");
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(`Failed to fetch users: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Colors for pie charts
  const COLORS = ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe", "#00f2fe"];

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha('#667eea', 0.1)} 0%, ${alpha('#764ba2', 0.1)} 100%)`,
        pb: 4
      }}
    >
      <Container maxWidth="xl">
        {/* Modern Header */}
        <Box sx={{ py: 4 }}>
          <Paper
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 4,
              p: 4,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: alpha('#ffffff', 0.2),
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <AdminIcon sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Admin Dashboard
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Welcome back, Administrator
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<LogoutIcon />}
                  onClick={logout}
                  sx={{
                    color: 'white',
                    borderColor: alpha('#ffffff', 0.3),
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: alpha('#ffffff', 0.1),
                    },
                  }}
                >
                  Logout
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Modern Navigation Tabs */}
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            mb: 4,
            overflow: 'hidden',
            background: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            sx={{ 
              '& .MuiTabs-indicator': {
                height: 4,
                borderRadius: '4px 4px 0 0',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              },
              '& .MuiTab-root': {
                minHeight: 72,
                fontWeight: 600,
                fontSize: '0.95rem',
                textTransform: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha('#667eea', 0.05),
                },
                '&.Mui-selected': {
                  color: '#667eea',
                },
              },
            }}
          >
            <Tab 
              icon={<DashboardIcon />} 
              label="Overview" 
              iconPosition="start"
              sx={{ gap: 1 }}
            />
            <Tab 
              icon={<PeopleIcon />} 
              label="Users Management" 
              iconPosition="start"
              sx={{ gap: 1 }}
            />
            <Tab 
              icon={<SecurityIcon />} 
              label="Security Center" 
              iconPosition="start"
              sx={{ gap: 1 }}
            />
            <Tab 
              icon={<NetworkIcon />} 
              label="Network Monitor" 
              iconPosition="start"
              sx={{ gap: 1 }}
            />
          </Tabs>
        </Paper>

        {/* Profile Tab - Modern Stats Cards */}
        {tabValue === 0 && (
          <Fade in={true} timeout={600}>
            <Grid container spacing={3}>
              {/* Admin Profile Card */}
              <Grid item xs={12} md={4}>
                <Card 
                  elevation={0}
                  sx={{ 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 100,
                      height: 100,
                      background: alpha('#ffffff', 0.1),
                      borderRadius: '50%',
                      transform: 'translate(30%, -30%)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: alpha('#ffffff', 0.2),
                          mr: 2,
                        }}
                      >
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Administrator
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          System Admin
                        </Typography>
                      </Box>
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        opacity: 0.8,
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        wordBreak: 'break-all',
                      }}
                    >
                      {user?.address}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* System Status Cards */}
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Card 
                      elevation={0}
                      sx={{ 
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                        textAlign: 'center',
                        p: 2,
                      }}
                    >
                      <ShieldIcon sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Secure
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        System Status
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card 
                      elevation={0}
                      sx={{ 
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                        color: '#333',
                        textAlign: 'center',
                        p: 2,
                      }}
                    >
                      <TrendingUpIcon sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Active
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Monitoring
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card 
                      elevation={0}
                      sx={{ 
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                        color: '#333',
                        textAlign: 'center',
                        p: 2,
                      }}
                    >
                      <NotificationsIcon sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {securityAlerts?.length || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Alerts
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card 
                      elevation={0}
                      sx={{ 
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
                        color: '#333',
                        textAlign: 'center',
                        p: 2,
                      }}
                    >
                      <PeopleIcon sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {users?.length || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Users
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              {/* Recent Activity */}
              <Grid item xs={12}>
                <Card 
                  elevation={0}
                  sx={{ 
                    borderRadius: 3,
                    background: 'white',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                >
                  <CardHeader
                    title={
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Quick Actions
                      </Typography>
                    }
                    sx={{ pb: 1 }}
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<PeopleIcon />}
                          onClick={() => setTabValue(1)}
                          sx={{
                            py: 1.5,
                            borderColor: alpha('#667eea', 0.3),
                            color: '#667eea',
                            '&:hover': {
                              borderColor: '#667eea',
                              bgcolor: alpha('#667eea', 0.05),
                            },
                          }}
                        >
                          Manage Users
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<SecurityIcon />}
                          onClick={() => setTabValue(2)}
                          sx={{
                            py: 1.5,
                            borderColor: alpha('#f5576c', 0.3),
                            color: '#f5576c',
                            '&:hover': {
                              borderColor: '#f5576c',
                              bgcolor: alpha('#f5576c', 0.05),
                            },
                          }}
                        >
                          Security Center
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<NetworkIcon />}
                          onClick={() => setTabValue(3)}
                          sx={{
                            py: 1.5,
                            borderColor: alpha('#4facfe', 0.3),
                            color: '#4facfe',
                            '&:hover': {
                              borderColor: '#4facfe',
                              bgcolor: alpha('#4facfe', 0.05),
                            },
                          }}
                        >
                          Network Monitor
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<TrendingUpIcon />}
                          sx={{
                            py: 1.5,
                            borderColor: alpha('#764ba2', 0.3),
                            color: '#764ba2',
                            '&:hover': {
                              borderColor: '#764ba2',
                              bgcolor: alpha('#764ba2', 0.05),
                            },
                          }}
                        >
                          Analytics
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Fade>
        )}

        {/* Users Management Tab */}
        {tabValue === 1 && (
          <Fade in={true} timeout={600}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 3,
                background: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
            >
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#667eea' }}>
                      <PeopleIcon />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Users Management
                    </Typography>
                    <Chip 
                      label={`${users.length} Total`}
                      size="small"
                      sx={{ 
                        bgcolor: alpha('#667eea', 0.1),
                        color: '#667eea',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                }
                sx={{ pb: 1 }}
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                {error && (
                  <Alert severity="error" sx={{ m: 3, mb: 0, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}
                {isLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
                    <CircularProgress size={40} sx={{ color: '#667eea' }} />
                  </Box>
                ) : (
                  <Grid container spacing={2} sx={{ p: 3 }}>
                    {users.map((user, index) => (
                      <Grid item xs={12} sm={6} lg={4} key={user._id}>
                        <Card 
                          elevation={0}
                          sx={{
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: alpha('#667eea', 0.1),
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: '#667eea',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)',
                            },
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar
                                sx={{
                                  width: 40,
                                  height: 40,
                                  bgcolor: `hsl(${(index * 50) % 360}, 70%, 50%)`,
                                  mr: 2,
                                  fontSize: '1.1rem',
                                  fontWeight: 600,
                                }}
                              >
                                {user.role?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography 
                                  variant="subtitle1" 
                                  sx={{ 
                                    fontWeight: 600,
                                    lineHeight: 1.2,
                                    mb: 0.5,
                                  }}
                                >
                                  {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                                </Typography>
                                <Chip
                                  label={user.is2FAEnabled ? "2FA Enabled" : "2FA Disabled"}
                                  size="small"
                                  icon={user.is2FAEnabled ? <CheckCircleIcon /> : <CancelIcon />}
                                  sx={{
                                    bgcolor: user.is2FAEnabled 
                                      ? alpha('#4caf50', 0.1) 
                                      : alpha('#f44336', 0.1),
                                    color: user.is2FAEnabled ? '#4caf50' : '#f44336',
                                    fontWeight: 600,
                                    '& .MuiChip-icon': {
                                      fontSize: '1rem',
                                    },
                                  }}
                                />
                              </Box>
                            </Box>
                            <Box 
                              sx={{ 
                                bgcolor: alpha('#667eea', 0.05),
                                borderRadius: 2,
                                p: 2,
                                border: '1px solid',
                                borderColor: alpha('#667eea', 0.1),
                              }}
                            >
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: 'text.secondary',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.5,
                                }}
                              >
                                Wallet Address
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                  wordBreak: 'break-all',
                                  mt: 0.5,
                                  lineHeight: 1.4,
                                }}
                              >
                                {user.walletAddress}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Fade>
        )}

        {/* Security Center Tab */}
        {tabValue === 2 && (
          <Fade in={true} timeout={600}>
            <Box>
              {mlError && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {mlError}
                </Alert>
              )}

              {mlLoading ? (
                <Card 
                  elevation={0}
                  sx={{ 
                    borderRadius: 3,
                    background: 'white',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    p: 6,
                  }}
                >
                  <CircularProgress size={60} sx={{ color: '#667eea', mb: 3 }} />
                  <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                    Loading Security Data...
                  </Typography>
                </Card>
              ) : (
                <Grid container spacing={3}>
                  {/* XSS Detection Card */}
                  <Grid item xs={12} lg={6}>
                    <Card 
                      elevation={0}
                      sx={{ 
                        borderRadius: 3,
                        background: 'white',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        height: '100%',
                      }}
                    >
                      <CardHeader
                        avatar={
                          <Avatar sx={{ bgcolor: '#f5576c' }}>
                            <WarningIcon />
                          </Avatar>
                        }
                        title={
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            XSS Attack Detection
                          </Typography>
                        }
                        subheader={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Chip
                              label={`${xssStats?.totalDetections || 0} Total Detections`}
                              size="small"
                              sx={{ 
                                bgcolor: alpha('#f5576c', 0.1),
                                color: '#f5576c',
                                fontWeight: 600,
                              }}
                            />
                            <Chip
                              label="Active"
                              size="small"
                              sx={{ 
                                bgcolor: alpha('#4caf50', 0.1),
                                color: '#4caf50',
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        }
                        sx={{ pb: 1 }}
                      />
                      <Divider />
                      <CardContent>
                        {xssStats ? (
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <Typography 
                                variant="subtitle2" 
                                gutterBottom 
                                sx={{ fontWeight: 600, color: 'text.primary' }}
                              >
                                Attack Types Distribution
                              </Typography>
                              <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                  <Pie
                                    data={formatPieData(xssStats.byType)}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) =>
                                      `${name}: ${(percent * 100).toFixed(0)}%`
                                    }
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {formatPieData(xssStats.byType).map(
                                      (entry, index) => (
                                        <Cell
                                          key={`cell-${index}`}
                                          fill={COLORS[index % COLORS.length]}
                                        />
                                      )
                                    )}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography 
                                variant="subtitle2" 
                                gutterBottom
                                sx={{ fontWeight: 600, color: 'text.primary' }}
                              >
                                Detection Trend (24h)
                              </Typography>
                              <ResponsiveContainer width="100%" height={200}>
                                <LineChart
                                  data={xssStats.hourlyTrend}
                                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke={alpha('#667eea', 0.2)} />
                                  <XAxis dataKey="hour" tick={false} />
                                  <YAxis />
                                  <Tooltip
                                    labelFormatter={(value) => value.split(" ")[1]}
                                    contentStyle={{
                                      backgroundColor: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#f5576c"
                                    strokeWidth={3}
                                    dot={{ fill: '#f5576c', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: '#f5576c', strokeWidth: 2 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography 
                                variant="subtitle2" 
                                gutterBottom
                                sx={{ fontWeight: 600, color: 'text.primary' }}
                              >
                                Top Attack Sources
                              </Typography>
                              <List dense>
                                {xssStats.topSources.map((source, index) => (
                                  <ListItem 
                                    key={index}
                                    sx={{
                                      bgcolor: alpha('#f5576c', 0.05),
                                      borderRadius: 1,
                                      mb: 1,
                                      border: '1px solid',
                                      borderColor: alpha('#f5576c', 0.1),
                                    }}
                                  >
                                    <ListItemText
                                      primary={
                                        <Typography sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                                          {source.ip}
                                        </Typography>
                                      }
                                      secondary={
                                        <Chip 
                                          label={`${source.count} attacks`}
                                          size="small"
                                          sx={{ 
                                            bgcolor: alpha('#f5576c', 0.1),
                                            color: '#f5576c',
                                            fontWeight: 600,
                                          }}
                                        />
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography 
                                variant="subtitle2" 
                                gutterBottom
                                sx={{ fontWeight: 600, color: 'text.primary' }}
                              >
                                Top Attack Targets
                              </Typography>
                              <List dense>
                                {xssStats.topTargets.map((target, index) => (
                                  <ListItem 
                                    key={index}
                                    sx={{
                                      bgcolor: alpha('#f5576c', 0.05),
                                      borderRadius: 1,
                                      mb: 1,
                                      border: '1px solid',
                                      borderColor: alpha('#f5576c', 0.1),
                                    }}
                                  >
                                    <ListItemText
                                      primary={
                                        <Typography sx={{ fontWeight: 600 }}>
                                          {target.endpoint}
                                        </Typography>
                                      }
                                      secondary={
                                        <Chip 
                                          label={`${target.count} attacks`}
                                          size="small"
                                          sx={{ 
                                            bgcolor: alpha('#f5576c', 0.1),
                                            color: '#f5576c',
                                            fontWeight: 600,
                                          }}
                                        />
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Grid>
                          </Grid>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <WarningIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                            <Typography color="text.secondary">
                              No XSS data available
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* DDoS Detection Card */}
                  <Grid item xs={12} lg={6}>
                    <Card 
                      elevation={0}
                      sx={{ 
                        borderRadius: 3,
                        background: 'white',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        height: '100%',
                      }}
                    >
                      <CardHeader
                        avatar={
                          <Avatar sx={{ bgcolor: '#4facfe' }}>
                            <SecurityIcon />
                          </Avatar>
                        }
                        title={
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            DDoS Attack Detection
                          </Typography>
                        }
                        subheader={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Chip
                              label={`${ddosStats?.totalDetections || 0} Total Detections`}
                              size="small"
                              sx={{ 
                                bgcolor: alpha('#4facfe', 0.1),
                                color: '#4facfe',
                                fontWeight: 600,
                              }}
                            />
                            <Chip
                              label={ddosStats?.isMonitoring ? "Monitoring" : "Inactive"}
                              size="small"
                              sx={{ 
                                bgcolor: ddosStats?.isMonitoring 
                                  ? alpha('#4caf50', 0.1) 
                                  : alpha('#ff9800', 0.1),
                                color: ddosStats?.isMonitoring ? '#4caf50' : '#ff9800',
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        }
                        sx={{ pb: 1 }}
                      />
                      <Divider />
                      <CardContent>
                        {ddosStats ? (
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <Typography 
                                variant="subtitle2" 
                                gutterBottom
                                sx={{ fontWeight: 600, color: 'text.primary' }}
                              >
                                Attack Types Distribution
                              </Typography>
                              <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                  <Pie
                                    data={formatPieData(ddosStats.byType)}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) =>
                                      `${name}: ${(percent * 100).toFixed(0)}%`
                                    }
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {formatPieData(ddosStats.byType).map(
                                      (entry, index) => (
                                        <Cell
                                          key={`cell-${index}`}
                                          fill={COLORS[index % COLORS.length]}
                                        />
                                      )
                                    )}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography 
                                variant="subtitle2" 
                                gutterBottom
                                sx={{ fontWeight: 600, color: 'text.primary' }}
                              >
                                Network Traffic (Last Hour)
                              </Typography>
                              <ResponsiveContainer width="100%" height={200}>
                                <LineChart
                                  data={ddosStats.trafficData}
                                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke={alpha('#4facfe', 0.2)} />
                                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                  <YAxis />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="packets"
                                    stroke="#4facfe"
                                    strokeWidth={3}
                                    dot={{ fill: '#4facfe', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: '#4facfe', strokeWidth: 2 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography 
                                variant="subtitle2" 
                                gutterBottom
                                sx={{ fontWeight: 600, color: 'text.primary' }}
                              >
                                Top Attack Sources
                              </Typography>
                              <List dense>
                                {ddosStats.topSources.map((source, index) => (
                                  <ListItem 
                                    key={index}
                                    sx={{
                                      bgcolor: alpha('#4facfe', 0.05),
                                      borderRadius: 1,
                                      mb: 1,
                                      border: '1px solid',
                                      borderColor: alpha('#4facfe', 0.1),
                                    }}
                                  >
                                    <ListItemText
                                      primary={
                                        <Typography sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                                          {source.ip}
                                        </Typography>
                                      }
                                      secondary={
                                        <Chip 
                                          label={`${source.count} attacks`}
                                          size="small"
                                          sx={{ 
                                            bgcolor: alpha('#4facfe', 0.1),
                                            color: '#4facfe',
                                            fontWeight: 600,
                                          }}
                                        />
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography 
                                variant="subtitle2" 
                                gutterBottom
                                sx={{ fontWeight: 600, color: 'text.primary' }}
                              >
                                Top Attack Targets
                              </Typography>
                              <List dense>
                                {ddosStats.topTargets.map((target, index) => (
                                  <ListItem 
                                    key={index}
                                    sx={{
                                      bgcolor: alpha('#4facfe', 0.05),
                                      borderRadius: 1,
                                      mb: 1,
                                      border: '1px solid',
                                      borderColor: alpha('#4facfe', 0.1),
                                    }}
                                  >
                                    <ListItemText
                                      primary={
                                        <Typography sx={{ fontWeight: 600 }}>
                                          {target.service}
                                        </Typography>
                                      }
                                      secondary={
                                        <Chip 
                                          label={`${target.count} attacks`}
                                          size="small"
                                          sx={{ 
                                            bgcolor: alpha('#4facfe', 0.1),
                                            color: '#4facfe',
                                            fontWeight: 600,
                                          }}
                                        />
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Grid>
                          </Grid>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <SecurityIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                            <Typography color="text.secondary">
                              No DDoS data available
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Security Alerts */}
                  <Grid item xs={12}>
                    <Card 
                      elevation={0}
                      sx={{ 
                        borderRadius: 3,
                        background: 'white',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      }}
                    >
                      <CardHeader
                        avatar={
                          <Badge badgeContent={securityAlerts?.length || 0} color="error">
                            <Avatar sx={{ bgcolor: '#ff9800' }}>
                              <NotificationsIcon />
                            </Avatar>
                          </Badge>
                        }
                        title={
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Recent Security Alerts
                          </Typography>
                        }
                        sx={{ pb: 1 }}
                      />
                      <Divider />
                      <CardContent>
                        {securityAlerts && securityAlerts.length > 0 ? (
                          <List>
                            {/* Group alerts by type and severity and show only the most recent from each category */}
                            {(() => {
                              // Group alerts by their category
                              const alertCategories = {
                                rule_based: null, // For orange alerts (medium severity) - keep only 1
                                ml_model_alerts: [], // For red alerts (high severity) - keep the 2 newest
                              };

                              // Find the most recent medium severity alert and the two newest high severity alerts
                              securityAlerts.forEach((alert) => {
                                // Rule-based alerts have medium severity - keep only the newest one
                                if (
                                  alert.severity === "medium" &&
                                  (!alertCategories.rule_based ||
                                    new Date(alert.timestamp) >
                                      new Date(
                                        alertCategories.rule_based.timestamp
                                      ))
                                ) {
                                  alertCategories.rule_based = alert;
                                }
                                // ML model alerts have high severity - keep the two newest
                                else if (alert.severity === "high") {
                                  alertCategories.ml_model_alerts.push(alert);
                                }
                              });

                              // Sort high severity alerts by timestamp (newest first) and keep only the two newest
                              alertCategories.ml_model_alerts.sort(
                                (a, b) =>
                                  new Date(b.timestamp) - new Date(a.timestamp)
                              );

                              // Only keep the two newest high severity alerts
                              alertCategories.ml_model_alerts =
                                alertCategories.ml_model_alerts.slice(0, 2);

                              // Combine alerts from both categories
                              const combinedAlerts = [];
                              if (alertCategories.rule_based) {
                                combinedAlerts.push(alertCategories.rule_based);
                              }
                              combinedAlerts.push(
                                ...alertCategories.ml_model_alerts
                              );

                              // Return the filtered alerts
                              return combinedAlerts.map((alert) => (
                                <ListItem
                                  key={alert.id}
                                  sx={{
                                    mb: 2,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: alert.severity === "high"
                                      ? alpha('#f44336', 0.2)
                                      : alert.severity === "medium"
                                      ? alpha('#ff9800', 0.2)
                                      : alpha('#2196f3', 0.2),
                                    bgcolor: alert.severity === "high"
                                      ? alpha('#f44336', 0.05)
                                      : alert.severity === "medium"
                                      ? alpha('#ff9800', 0.05)
                                      : alpha('#2196f3', 0.05),
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      transform: 'translateY(-1px)',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    },
                                  }}
                                >
                                  <Avatar 
                                    sx={{ 
                                      mr: 2,
                                      bgcolor: alert.severity === "high"
                                        ? '#f44336'
                                        : alert.severity === "medium"
                                        ? '#ff9800'
                                        : '#2196f3',
                                    }}
                                  >
                                    <WarningIcon />
                                  </Avatar>
                                  <ListItemText
                                    primary={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                          {alert.message}
                                        </Typography>
                                        <Chip
                                          label={alert.severity.toUpperCase()}
                                          size="small"
                                          sx={{
                                            bgcolor: alert.severity === "high"
                                              ? '#f44336'
                                              : alert.severity === "medium"
                                              ? '#ff9800'
                                              : '#2196f3',
                                            color: 'white',
                                            fontWeight: 600,
                                          }}
                                        />
                                      </Box>
                                    }
                                    secondary={
                                      <Box>
                                        <Typography
                                          variant="body2"
                                          sx={{ color: 'text.secondary', mb: 0.5 }}
                                        >
                                          Type: {alert.type}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          sx={{ color: 'text.disabled' }}
                                        >
                                          {new Date(alert.timestamp).toLocaleString()}
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                </ListItem>
                              ));
                            })()}
                          </List>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 6 }}>
                            <CheckCircleIcon sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
                            <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 600 }}>
                              All Clear!
                            </Typography>
                            <Typography color="text.secondary">
                              No recent security alerts
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Fade>
        )}

        {/* Network Monitor Tab */}
        {tabValue === 3 && (
          <Fade in={true} timeout={600}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 3,
                background: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
            >
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: '#4facfe' }}>
                    <NetworkIcon />
                  </Avatar>
                }
                title={
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Network Packet Monitor
                  </Typography>
                }
                subheader="Real-time network traffic analysis and monitoring"
                sx={{ pb: 1 }}
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <PacketLogViewer />
              </CardContent>
            </Card>
          </Fade>
        )}
      </Container>
    </Box>
  );
}

export default AdminDashboard;
