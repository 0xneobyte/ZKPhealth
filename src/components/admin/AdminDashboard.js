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
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Admin Dashboard</Typography>
        <Button variant="contained" color="secondary" onClick={logout}>
          Logout
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Profile" />
        <Tab label="View Users" />
        <Tab label="Security Monitoring" />
        <Tab label="Network Monitor" />
      </Tabs>

      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Profile
          </Typography>
          <Typography>Address: {user?.address}</Typography>
          <Typography>Role: {user?.role}</Typography>
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            All Users
          </Typography>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            users.map((user) => (
              <Box
                key={user._id}
                sx={{
                  mb: 2,
                  p: 2,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  "&:hover": {
                    bgcolor: "grey.200",
                  },
                }}
              >
                <Typography>
                  <strong>Address:</strong> {user.walletAddress}
                </Typography>
                <Typography>
                  <strong>Role:</strong> {user.role}
                </Typography>
                <Typography>
                  <strong>2FA Enabled:</strong>{" "}
                  {user.is2FAEnabled ? "Yes" : "No"}
                </Typography>
              </Box>
            ))
          )}
        </Paper>
      )}

      {tabValue === 2 && (
        <Box>
          {mlError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {mlError}
            </Alert>
          )}

          {mlLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading security data...</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* XSS Detection */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="XSS Attack Detection"
                    subheader={
                      xssStats
                        ? `Total Detections: ${xssStats.totalDetections}`
                        : "No data"
                    }
                  />
                  <Divider />
                  <CardContent>
                    {xssStats ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" gutterBottom>
                            Attack Types
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
                          <Typography variant="subtitle1" gutterBottom>
                            Detection Trend (24h)
                          </Typography>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart
                              data={xssStats.hourlyTrend}
                              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="hour" tick={false} />
                              <YAxis />
                              <Tooltip
                                labelFormatter={(value) => value.split(" ")[1]}
                              />
                              <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#8884d8"
                                activeDot={{ r: 8 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" gutterBottom>
                            Top Attack Sources
                          </Typography>
                          <List dense>
                            {xssStats.topSources.map((source, index) => (
                              <ListItem key={index}>
                                <ListItemText
                                  primary={source.ip}
                                  secondary={`Attacks: ${source.count}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" gutterBottom>
                            Top Attack Targets
                          </Typography>
                          <List dense>
                            {xssStats.topTargets.map((target, index) => (
                              <ListItem key={index}>
                                <ListItemText
                                  primary={target.endpoint}
                                  secondary={`Attacks: ${target.count}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                      </Grid>
                    ) : (
                      <Typography>No XSS data available</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* DDoS Detection */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="DDoS Attack Detection"
                    subheader={
                      ddosStats
                        ? `Total Detections: ${ddosStats.totalDetections}`
                        : "No data"
                    }
                  />
                  <Divider />
                  <CardContent>
                    {ddosStats ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" gutterBottom>
                            Attack Types
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
                          <Typography variant="subtitle1" gutterBottom>
                            Network Traffic (Last Hour)
                          </Typography>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart
                              data={ddosStats.trafficData}
                              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                              <YAxis />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="packets"
                                stroke="#82ca9d"
                                activeDot={{ r: 8 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" gutterBottom>
                            Top Attack Sources
                          </Typography>
                          <List dense>
                            {ddosStats.topSources.map((source, index) => (
                              <ListItem key={index}>
                                <ListItemText
                                  primary={source.ip}
                                  secondary={`Attacks: ${source.count}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" gutterBottom>
                            Top Attack Targets
                          </Typography>
                          <List dense>
                            {ddosStats.topTargets.map((target, index) => (
                              <ListItem key={index}>
                                <ListItemText
                                  primary={target.service}
                                  secondary={`Attacks: ${target.count}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                      </Grid>
                    ) : (
                      <Typography>No DDoS data available</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Security Alerts */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Recent Security Alerts" />
                  <Divider />
                  <CardContent>
                    {securityAlerts && securityAlerts.length > 0 ? (
                      <List>
                        {securityAlerts.map((alert) => (
                          <ListItem
                            key={alert.id}
                            sx={{
                              mb: 1,
                              bgcolor:
                                alert.severity === "high"
                                  ? "error.light"
                                  : alert.severity === "medium"
                                  ? "warning.light"
                                  : "info.light",
                              borderRadius: 1,
                            }}
                          >
                            <ListItemText
                              primary={alert.message}
                              secondary={
                                <>
                                  <Typography component="span" variant="body2">
                                    Severity: {alert.severity} | Type:{" "}
                                    {alert.type}
                                  </Typography>
                                  <br />
                                  <Typography component="span" variant="body2">
                                    {new Date(alert.timestamp).toLocaleString()}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography>No recent security alerts</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      )}

      {tabValue === 3 && (
        <Paper sx={{ p: 3 }}>
          <PacketLogViewer />
        </Paper>
      )}
    </Box>
  );
}

export default AdminDashboard;
