#!/usr/bin/env node

/**
 * Mock OvenMediaEngine Server
 * 
 * This is a simple Node.js server that mimics the OME REST API
 * for testing the compliance dashboard without requiring a full OME installation.
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8081;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockVHosts = [
  { name: 'default', state: 'Running' }
];

const mockApplications = [
  { name: 'app', state: 'Running' }
];

const mockStreams = [
  { 
    id: 'stream_001', 
    name: 'test_stream', 
    state: 'Playing',
    input: {
      video: { codec: 'h264', width: 1920, height: 1080, bitrate: 5000000 },
      audio: { codec: 'aac', bitrate: 128000, sampleRate: 48000, channel: 2 }
    },
    output: {
      video: { codec: 'h264', width: 1920, height: 1080, bitrate: 5000000 },
      audio: { codec: 'aac', bitrate: 128000, sampleRate: 48000, channel: 2 }
    }
  }
];

const mockServerStats = {
  version: '0.19.0',
  uptime: 3600,
  cpu: 25.5,
  memory: 1024,
  connections: 15,
  throughput: 50000000
};

const mockVHostStats = {
  name: 'default',
  connections: 10,
  throughput: 30000000,
  timing: {
    input: 50,
    output: 45
  }
};

const mockAppStats = {
  name: 'app',
  connections: 5,
  throughput: 20000000,
  timing: {
    input: 30,
    output: 25
  }
};

const mockStreamStats = {
  id: 'stream_001',
  name: 'test_stream',
  connections: 3,
  throughput: 15000000,
  timing: {
    input: 20,
    output: 18
  }
};

// API Routes

// Test connection
app.get('/v1', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: {
      version: '0.19.0',
      uptime: 3600
    }
  });
});

// Get server statistics
app.get('/v1/stats/current', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: {
      server: mockServerStats,
      vhosts: [mockVHostStats],
      applications: [mockAppStats],
      streams: [mockStreamStats]
    }
  });
});

// Get virtual hosts
app.get('/v1/vhosts', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: mockVHosts
  });
});

// Get applications
app.get('/v1/vhosts/:vhost/apps', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: mockApplications
  });
});

// Get streams
app.get('/v1/vhosts/:vhost/apps/:app/streams', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: mockStreams
  });
});

// Get stream info
app.get('/v1/vhosts/:vhost/apps/:app/streams/:stream', (req, res) => {
  const stream = mockStreams.find(s => s.id === req.params.stream);
  if (stream) {
    res.json({
      statusCode: 200,
      message: 'OK',
      response: stream
    });
  } else {
    res.status(404).json({
      statusCode: 404,
      message: 'Stream not found'
    });
  }
});

// Send event (SCTE-35 injection)
app.post('/v1/vhosts/:vhost/apps/:app/streams/:stream:sendEvent', (req, res) => {
  console.log('📡 SCTE-35 Event Received:', {
    vhost: req.params.vhost,
    app: req.params.app,
    stream: req.params.stream,
    event: req.body
  });
  
  // Simulate processing delay
  setTimeout(() => {
    res.json({
      statusCode: 200,
      message: 'Event sent successfully',
      response: {
        eventId: req.body.eventId || 'auto_generated',
        timestamp: new Date().toISOString(),
        status: 'sent'
      }
    });
  }, 100);
});

// Get output profiles
app.get('/v1/vhosts/:vhost/apps/:app/outputProfiles', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: [
      'DistributorCompliantSRT',
      'DefaultProfile',
      'HighQualityProfile'
    ]
  });
});

// Create output profile
app.post('/v1/vhosts/:vhost/apps/:app/outputProfiles', (req, res) => {
  console.log('📋 Output Profile Creation:', {
    vhost: req.params.vhost,
    app: req.params.app,
    profile: req.body
  });
  
  res.json({
    statusCode: 200,
    message: 'Output profile created successfully',
    response: {
      name: req.body.name || 'NewProfile',
      created: new Date().toISOString()
    }
  });
});

// Get vhost statistics
app.get('/v1/vhosts/:vhost/stats/current', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: mockVHostStats
  });
});

// Get application statistics
app.get('/v1/vhosts/:vhost/apps/:app/stats/current', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: mockAppStats
  });
});

// Get stream statistics
app.get('/v1/vhosts/:vhost/apps/:app/streams/:stream/stats/current', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: mockStreamStats
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    statusCode: 500,
    message: 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Mock OvenMediaEngine Server Started!');
  console.log(`📡 API Server: http://localhost:${PORT}/v1`);
  console.log(`🔗 Dashboard: http://localhost:5173/`);
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log('  GET  /v1/stats/current - Server statistics');
  console.log('  GET  /v1/vhosts - Virtual hosts');
  console.log('  GET  /v1/vhosts/:vhost/apps - Applications');
  console.log('  GET  /v1/vhosts/:vhost/apps/:app/streams - Streams');
  console.log('  POST /v1/vhosts/:vhost/apps/:app/streams/:stream:sendEvent - SCTE-35 injection');
  console.log('  GET  /v1/vhosts/:vhost/apps/:app/outputProfiles - Output profiles');
  console.log('  POST /v1/vhosts/:vhost/apps/:app/outputProfiles - Create profile');
  console.log('');
  console.log('🎯 Ready for testing! The dashboard can now connect to this mock server.');
});
