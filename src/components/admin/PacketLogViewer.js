import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SecurityIcon from "@mui/icons-material/Security";

const PacketLogViewer = () => {
  const [packets, setPackets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    protocol: "",
    srcIp: "",
    dstIp: "",
    port: "",
  });
  const [simulateDialogOpen, setSimulateDialogOpen] = useState(false);
  const [simulationParams, setSimulationParams] = useState({
    targetIp: "192.168.1.1",
    duration: 10,
  });
  const [simulationStatus, setSimulationStatus] = useState(null);

  const refreshIntervalRef = useRef(null);

  // Function to fetch packet logs
  const fetchPackets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:8000/api/packets?limit=100"
      );

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      // Apply filters if any
      let filteredData = data;
      if (filters.protocol) {
        filteredData = filteredData.filter((packet) =>
          packet.protocol.toLowerCase().includes(filters.protocol.toLowerCase())
        );
      }
      if (filters.srcIp) {
        filteredData = filteredData.filter((packet) =>
          packet.src_ip.includes(filters.srcIp)
        );
      }
      if (filters.dstIp) {
        filteredData = filteredData.filter((packet) =>
          packet.dst_ip.includes(filters.dstIp)
        );
      }
      if (filters.port) {
        const portNum = filters.port;
        filteredData = filteredData.filter(
          (packet) =>
            (packet.src_port && packet.src_port.toString().includes(portNum)) ||
            (packet.dst_port && packet.dst_port.toString().includes(portNum))
        );
      }

      setPackets(filteredData);
    } catch (error) {
      console.error("Error fetching packet logs:", error);
      setError(`Failed to fetch packet logs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(fetchPackets, 2000);
    } else {
      clearInterval(refreshIntervalRef.current);
    }

    return () => {
      clearInterval(refreshIntervalRef.current);
    };
  }, [autoRefresh, filters]);

  // Initial fetch
  useEffect(() => {
    fetchPackets();
  }, []);

  // Function to toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Function to handle filter changes
  const handleFilterChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value,
    });
  };

  // Function to clear filters
  const clearFilters = () => {
    setFilters({
      protocol: "",
      srcIp: "",
      dstIp: "",
      port: "",
    });
  };

  // Function to handle simulation parameter changes
  const handleSimulationParamChange = (event) => {
    setSimulationParams({
      ...simulationParams,
      [event.target.name]: event.target.value,
    });
  };

  // Function to start DoS simulation
  const startDosSimulation = async () => {
    try {
      setSimulationStatus({ type: "info", message: "Starting simulation..." });

      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/ml/simulate-dos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetIp: simulationParams.targetIp,
          duration: simulationParams.duration,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      setSimulationStatus({
        type: "success",
        message: data.message || "Simulation started successfully",
      });

      // Close dialog after 2 seconds
      setTimeout(() => {
        setSimulateDialogOpen(false);
        // Keep status for 5 more seconds
        setTimeout(() => {
          setSimulationStatus(null);
        }, 5000);
      }, 2000);
    } catch (error) {
      console.error("Error starting DoS simulation:", error);
      setSimulationStatus({
        type: "error",
        message: `Failed to start simulation: ${error.message}`,
      });
    }
  };

  // Function to get color for protocol
  const getProtocolColor = (protocol) => {
    switch (protocol) {
      case "TCP":
        return "primary";
      case "UDP":
        return "secondary";
      case "ICMP":
        return "warning";
      default:
        return "default";
    }
  };

  // Function to format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Network Packet Monitor</Typography>
        <Box>
          <Tooltip title="Simulate DoS Attack">
            <IconButton
              color="warning"
              onClick={() => setSimulateDialogOpen(true)}
              sx={{ mr: 1 }}
            >
              <SecurityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filter Packets">
            <IconButton
              onClick={() => setFilterOpen(!filterOpen)}
              color={
                Object.values(filters).some((f) => f) ? "primary" : "default"
              }
              sx={{ mr: 1 }}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchPackets} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={autoRefresh ? "Pause Auto-refresh" : "Start Auto-refresh"}
          >
            <IconButton
              onClick={toggleAutoRefresh}
              color={autoRefresh ? "primary" : "default"}
            >
              {autoRefresh ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {simulationStatus && (
        <Alert
          severity={simulationStatus.type}
          sx={{ mb: 2 }}
          onClose={() => setSimulationStatus(null)}
        >
          {simulationStatus.message}
        </Alert>
      )}

      {filterOpen && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Filter Packets
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Protocol"
                name="protocol"
                value={filters.protocol}
                onChange={handleFilterChange}
                fullWidth
                size="small"
                placeholder="TCP, UDP, ICMP"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Source IP"
                name="srcIp"
                value={filters.srcIp}
                onChange={handleFilterChange}
                fullWidth
                size="small"
                placeholder="192.168.1"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Destination IP"
                name="dstIp"
                value={filters.dstIp}
                onChange={handleFilterChange}
                fullWidth
                size="small"
                placeholder="10.0.0"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Port"
                name="port"
                value={filters.port}
                onChange={handleFilterChange}
                fullWidth
                size="small"
                placeholder="80, 443"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={clearFilters} size="small">
              Clear Filters
            </Button>
          </Box>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Protocol</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Destination</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && packets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : packets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No packets found
                </TableCell>
              </TableRow>
            ) : (
              packets.map((packet, index) => (
                <TableRow key={index} hover>
                  <TableCell>{formatTimestamp(packet.timestamp)}</TableCell>
                  <TableCell>
                    <Chip
                      label={packet.protocol}
                      size="small"
                      color={getProtocolColor(packet.protocol)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {packet.src_ip}
                    {packet.src_port && `:${packet.src_port}`}
                  </TableCell>
                  <TableCell>
                    {packet.dst_ip}
                    {packet.dst_port && `:${packet.dst_port}`}
                  </TableCell>
                  <TableCell>{packet.size} bytes</TableCell>
                  <TableCell>
                    {packet.flags && (
                      <Tooltip title="TCP Flags">
                        <Chip
                          label={packet.flags}
                          size="small"
                          sx={{ mr: 0.5 }}
                        />
                      </Tooltip>
                    )}
                    {packet.http_method && (
                      <Tooltip
                        title={`${packet.http_method} ${packet.http_path}`}
                      >
                        <Chip
                          label={packet.http_method}
                          size="small"
                          color="info"
                          sx={{ mr: 0.5 }}
                        />
                      </Tooltip>
                    )}
                    {packet.payload && (
                      <Tooltip title={packet.payload}>
                        <Chip label="Payload" size="small" color="error" />
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* DoS Simulation Dialog */}
      <Dialog
        open={simulateDialogOpen}
        onClose={() => setSimulateDialogOpen(false)}
      >
        <DialogTitle>Simulate DoS Attack</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will simulate a DoS attack by generating a high volume of
            packets to the target IP. Use this for testing the detection system
            only.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Target IP"
                name="targetIp"
                value={simulationParams.targetIp}
                onChange={handleSimulationParamChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Duration (seconds)</InputLabel>
                <Select
                  name="duration"
                  value={simulationParams.duration}
                  onChange={handleSimulationParamChange}
                  label="Duration (seconds)"
                >
                  <MenuItem value={5}>5 seconds</MenuItem>
                  <MenuItem value={10}>10 seconds</MenuItem>
                  <MenuItem value={15}>15 seconds</MenuItem>
                  <MenuItem value={30}>30 seconds</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSimulateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={startDosSimulation}
            variant="contained"
            color="warning"
          >
            Start Simulation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PacketLogViewer;
