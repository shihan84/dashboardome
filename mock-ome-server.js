const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8081;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockStats = {
  response: {
    server: {
      version: "0.15.15",
      uptime: 3600,
      totalConnections: 5,
      totalBytesIn: 1024000,
      totalBytesOut: 2048000
    },
    vhosts: [
      {
        name: "default",
        enabled: true,
        applications: [
          {
            name: "app",
            enabled: true,
            streams: [
              {
                name: "test_stream",
                state: "streaming",
                totalConnections: 2,
                totalBytesIn: 512000,
                totalBytesOut: 1024000
              }
            ]
          }
        ]
      }
    ]
  }
};

const mockVHosts = {
  response: {
    vhosts: [
      {
        name: "default",
        domain: "localhost",
        enabled: true,
        tls: false
      }
    ]
  }
};

const mockApplications = {
  response: {
    applications: [
      {
        name: "app",
        enabled: true
      }
    ]
  }
};

// Routes
app.get('/v1/stats/current', (req, res) => {
  res.json(mockStats);
});

app.get('/v1/vhosts', (req, res) => {
  res.json(mockVHosts);
});

app.get('/v1/vhosts/:vhost/apps', (req, res) => {
  res.json(mockApplications);
});

app.get('/v1/vhosts/:vhost/apps/:app/streams', (req, res) => {
  res.json({
    response: {
      streams: [
        {
          name: "test_stream",
          state: "streaming",
          totalConnections: 2,
          totalBytesIn: 512000,
          totalBytesOut: 1024000
        }
      ]
    }
  });
});

app.get('/v1/vhosts/:vhost/stats', (req, res) => {
  res.json({
    response: {
      totalConnections: 5,
      totalBytesIn: 1024000,
      totalBytesOut: 2048000
    }
  });
});

app.get('/v1/vhosts/:vhost/apps/:app/stats', (req, res) => {
  res.json({
    response: {
      totalConnections: 2,
      totalBytesIn: 512000,
      totalBytesOut: 1024000
    }
  });
});

app.get('/v1/vhosts/:vhost/apps/:app/streams/:stream/stats', (req, res) => {
  res.json({
    response: {
      totalConnections: 2,
      totalBytesIn: 512000,
      totalBytesOut: 1024000
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock OvenMediaEngine API server running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET /v1/stats/current`);
  console.log(`  GET /v1/vhosts`);
  console.log(`  GET /v1/vhosts/:vhost/apps`);
  console.log(`  GET /v1/vhosts/:vhost/apps/:app/streams`);
  console.log(`  GET /v1/vhosts/:vhost/stats`);
  console.log(`  GET /v1/vhosts/:vhost/apps/:app/stats`);
  console.log(`  GET /v1/vhosts/:vhost/apps/:app/streams/:stream/stats`);
  console.log(`  GET /health`);
});