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

// Create virtual host
app.post('/v1/vhosts', (req, res) => {
  console.log('🏗️ Virtual Host Creation:', req.body);
  
  const newVHost = {
    name: req.body.name,
    distribution: req.body.distribution || 'default',
    host: req.body.hostNames ? {
      names: req.body.hostNames.split(',').map(name => name.trim()),
      tls: req.body.tlsEnabled ? {
        certPath: req.body.certPath,
        chainCertPath: req.body.chainCertPath,
        keyPath: req.body.keyPath
      } : undefined
    } : undefined,
    signedPolicy: req.body.signedPolicyEnabled ? {
      enables: {
        providers: req.body.providersEnabled ? 'on' : 'off',
        publishers: req.body.publishersEnabled ? 'on' : 'off'
      },
      policyQueryKeyName: req.body.policyQueryKeyName,
      secretKey: req.body.secretKey,
      signatureQueryKeyName: req.body.signatureQueryKeyName
    } : undefined,
    admissionWebhooks: req.body.admissionWebhooksEnabled ? {
      controlServerUrl: req.body.controlServerUrl,
      secretKey: req.body.webhookSecretKey,
      timeout: req.body.webhookTimeout,
      enables: {
        providers: req.body.webhookProvidersEnabled ? 'on' : 'off',
        publishers: req.body.webhookPublishersEnabled ? 'on' : 'off'
      }
    } : undefined,
    origins: req.body.originsEnabled ? {
      origin: req.body.origins ? req.body.origins.map(origin => ({
        location: origin.location,
        pass: {
          schema: origin.schema,
          urls: {
            url: origin.urls.split(',').map(url => url.trim())
          }
        }
      })) : []
    } : undefined,
    originMapStore: req.body.originMapStoreEnabled ? {
      originHostName: req.body.originHostName,
      redisServer: {
        host: req.body.redisHost,
        auth: req.body.redisAuth
      }
    } : undefined
  };
  
  // Add to mock data
  mockVHosts.push(newVHost);
  
  res.json({
    statusCode: 200,
    message: 'Virtual host created successfully',
    response: newVHost
  });
});

// Get detailed virtual host info
app.get('/v1/vhosts/:vhost', (req, res) => {
  const vhost = mockVHosts.find(v => v.name === req.params.vhost);
  if (vhost) {
    res.json({
      statusCode: 200,
      message: 'OK',
      response: vhost
    });
  } else {
    res.status(404).json({
      statusCode: 404,
      message: 'Virtual host not found'
    });
  }
});

// Delete virtual host
app.delete('/v1/vhosts/:vhost', (req, res) => {
  const index = mockVHosts.findIndex(v => v.name === req.params.vhost);
  if (index !== -1) {
    mockVHosts.splice(index, 1);
    res.json({
      statusCode: 200,
      message: 'Virtual host deleted successfully'
    });
  } else {
    res.status(404).json({
      statusCode: 404,
      message: 'Virtual host not found'
    });
  }
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
app.post('/v1/vhosts/:vhost/apps/:app/streams/:stream/sendEvent', (req, res) => {
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

// ===== SCHEDULED CHANNELS API =====

// Get scheduled channels
app.get('/v1/vhosts/:vhost/apps/:app/scheduledChannels', (req, res) => {
  const { vhost, app } = req.params;
  console.log(`📋 Getting scheduled channels for ${vhost}/${app}`);
  
  res.json({
    statusCode: 200,
    message: 'OK',
    response: ['morning-news', 'evening-show', 'weekend-special']
  });
});

// Get scheduled channel details
app.get('/v1/vhosts/:vhost/apps/:app/scheduledChannels/:stream', (req, res) => {
  const { vhost, app, stream } = req.params;
  console.log(`📋 Getting scheduled channel details for ${vhost}/${app}/${stream}`);
  
  res.json({
    statusCode: 200,
    message: 'OK',
    response: {
      name: stream,
      type: 'scheduled',
      status: 'active',
      scheduleFile: `/opt/ovenmediaengine/schedules/${stream}.sch`,
      fallbackProgram: {
        type: 'file',
        path: '/opt/ovenmediaengine/fallback.mp4'
      },
      programs: [
        {
          id: 'prog1',
          name: 'Morning News',
          type: 'file',
          path: '/opt/ovenmediaengine/content/morning-news.mp4',
          startTime: '2024-01-01T06:00:00Z',
          duration: 3600,
          audioMap: [
            { trackId: 1, language: 'en', name: 'English', codec: 'aac' }
          ]
        }
      ],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString()
    }
  });
});

// Create scheduled channel
app.post('/v1/vhosts/:vhost/apps/:app/scheduledChannels', (req, res) => {
  const { vhost, app } = req.params;
  const channelData = req.body;
  
  console.log(`➕ Creating scheduled channel for ${vhost}/${app}:`, channelData);
  
  res.json({
    statusCode: 201,
    message: 'Scheduled channel created successfully',
    response: {
      name: channelData.name,
      type: 'scheduled',
      status: 'active',
      ...channelData
    }
  });
});

// Update scheduled channel
app.patch('/v1/vhosts/:vhost/apps/:app/scheduledChannels/:stream', (req, res) => {
  const { vhost, app, stream } = req.params;
  const channelData = req.body;
  
  console.log(`✏️ Updating scheduled channel ${vhost}/${app}/${stream}:`, channelData);
  
  res.json({
    statusCode: 200,
    message: 'Scheduled channel updated successfully',
    response: {
      name: stream,
      type: 'scheduled',
      status: 'active',
      ...channelData
    }
  });
});

// Delete scheduled channel
app.delete('/v1/vhosts/:vhost/apps/:app/scheduledChannels/:stream', (req, res) => {
  const { vhost, app, stream } = req.params;
  
  console.log(`🗑️ Deleting scheduled channel ${vhost}/${app}/${stream}`);
  
  res.json({
    statusCode: 200,
    message: 'Scheduled channel deleted successfully',
    response: null
  });
});

// ===== MULTIPLEX CHANNELS API =====

// Get multiplex channels
app.get('/v1/vhosts/:vhost/apps/:app/multiplexChannels', (req, res) => {
  const { vhost, app } = req.params;
  console.log(`📋 Getting multiplex channels for ${vhost}/${app}`);
  
  res.json({
    statusCode: 200,
    message: 'OK',
    response: ['main-feed', 'backup-feed', 'aggregated-stream']
  });
});

// Get multiplex channel details
app.get('/v1/vhosts/:vhost/apps/:app/multiplexChannels/:stream', (req, res) => {
  const { vhost, app, stream } = req.params;
  console.log(`📋 Getting multiplex channel details for ${vhost}/${app}/${stream}`);
  
  res.json({
    statusCode: 200,
    message: 'OK',
    response: {
      name: stream,
      type: 'multiplex',
      status: 'active',
      inputStreams: [
        { name: 'camera1', type: 'video', trackId: 1, enabled: true },
        { name: 'camera2', type: 'video', trackId: 2, enabled: true },
        { name: 'audio1', type: 'audio', trackId: 1, language: 'en', enabled: true }
      ],
      outputStream: {
        name: `${stream}_output`,
        profiles: ['720p', '480p', '360p']
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString()
    }
  });
});

// Create multiplex channel
app.post('/v1/vhosts/:vhost/apps/:app/multiplexChannels', (req, res) => {
  const { vhost, app } = req.params;
  const channelData = req.body;
  
  console.log(`➕ Creating multiplex channel for ${vhost}/${app}:`, channelData);
  
  res.json({
    statusCode: 201,
    message: 'Multiplex channel created successfully',
    response: {
      name: channelData.name,
      type: 'multiplex',
      status: 'active',
      ...channelData
    }
  });
});

// Delete multiplex channel
app.delete('/v1/vhosts/:vhost/apps/:app/multiplexChannels/:stream', (req, res) => {
  const { vhost, app, stream } = req.params;
  
  console.log(`🗑️ Deleting multiplex channel ${vhost}/${app}/${stream}`);
  
  res.json({
    statusCode: 200,
    message: 'Multiplex channel deleted successfully',
    response: null
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
  console.log('  GET  /v1/vhosts/:vhost/apps/:app/scheduledChannels - Scheduled channels');
  console.log('  POST /v1/vhosts/:vhost/apps/:app/scheduledChannels - Create scheduled channel');
  console.log('  GET  /v1/vhosts/:vhost/apps/:app/multiplexChannels - Multiplex channels');
  console.log('  POST /v1/vhosts/:vhost/apps/:app/multiplexChannels - Create multiplex channel');
  console.log('');
  console.log('🎯 Ready for testing! The dashboard can now connect to this mock server.');
});
