#!/usr/bin/env node

/**
 * Comprehensive Mock OvenMediaEngine Server
 * 
 * This is a comprehensive Node.js server that mimics the OME REST API
 * for testing all dashboard features without requiring a full OME installation.
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
  { name: 'default', state: 'Running' },
  { name: 'vhost1', state: 'Running' },
  { name: 'vhost2', state: 'Running' }
];

const mockApplications = [
  { name: 'app', state: 'Running' },
  { name: 'live', state: 'Running' },
  { name: 'vod', state: 'Running' }
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

const mockRecordings = [];
const mockPushes = [];

const mockServerStats = {
  version: '0.19.0',
  uptime: 3600,
  cpu: 25.5,
  memory: 1024,
  connections: 15,
  throughput: 50000000
};

// Helper function to generate mock statistics
const generateMockStats = (level = 'server') => {
  const baseStats = {
    connections: {
      webrtc: Math.floor(Math.random() * 10),
      llhls: Math.floor(Math.random() * 20),
      ovt: Math.floor(Math.random() * 5),
      file: Math.floor(Math.random() * 3),
      push: Math.floor(Math.random() * 8),
      thumbnail: Math.floor(Math.random() * 2),
      hls: Math.floor(Math.random() * 15),
      srt: Math.floor(Math.random() * 6)
    },
    createdTime: new Date().toISOString(),
    lastRecvTime: new Date().toISOString(),
    lastSentTime: new Date().toISOString(),
    lastUpdatedTime: new Date().toISOString(),
    lastThroughputIn: Math.floor(Math.random() * 2000000),
    lastThroughputOut: Math.floor(Math.random() * 1500000),
    maxTotalConnectionTime: new Date().toISOString(),
    maxTotalConnections: Math.floor(Math.random() * 100),
    totalBytesIn: Math.floor(Math.random() * 1000000000),
    totalBytesOut: Math.floor(Math.random() * 800000000),
    totalConnections: Math.floor(Math.random() * 50),
    avgThroughputIn: Math.floor(Math.random() * 1000000),
    avgThroughputOut: Math.floor(Math.random() * 800000),
    maxThroughputIn: Math.floor(Math.random() * 3000000),
    maxThroughputOut: Math.floor(Math.random() * 2000000)
  };

  // Scale down stats based on level
  if (level === 'vhost') {
    Object.keys(baseStats.connections).forEach(key => {
      baseStats.connections[key] = Math.floor(baseStats.connections[key] * 0.6);
    });
    baseStats.totalConnections = Math.floor(baseStats.totalConnections * 0.6);
  } else if (level === 'app') {
    Object.keys(baseStats.connections).forEach(key => {
      baseStats.connections[key] = Math.floor(baseStats.connections[key] * 0.4);
    });
    baseStats.totalConnections = Math.floor(baseStats.totalConnections * 0.4);
  } else if (level === 'stream') {
    Object.keys(baseStats.connections).forEach(key => {
      baseStats.connections[key] = Math.floor(baseStats.connections[key] * 0.2);
    });
    baseStats.totalConnections = Math.floor(baseStats.totalConnections * 0.2);
  }

  return baseStats;
};

// API Routes

// Server Statistics
app.get('/v1/stats/current', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: generateMockStats('server')
  });
});

// Virtual Host Management
app.get('/v1/vhosts', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: mockVHosts.map(v => v.name)
  });
});

app.get('/v1/vhosts/:vhost', (req, res) => {
  const vhost = mockVHosts.find(v => v.name === req.params.vhost);
  if (vhost) {
    res.json({
      statusCode: 200,
      message: 'OK',
      response: {
        name: vhost.name,
        distribution: 'default',
        host: {
          names: ['localhost', '127.0.0.1']
        },
        applications: {
          application: mockApplications
        }
      }
    });
  } else {
    res.status(404).json({
      statusCode: 404,
      message: 'Virtual host not found'
    });
  }
});

app.post('/v1/vhosts', (req, res) => {
  console.log('🏠 Virtual Host Created:', req.body);
  const newVHost = req.body[0];
  mockVHosts.push({ name: newVHost.name, state: 'Running' });
  res.json({
    statusCode: 200,
    message: 'Virtual host created successfully',
    response: newVHost
  });
});

app.delete('/v1/vhosts/:vhost', (req, res) => {
  console.log('🗑️ Virtual Host Deleted:', req.params.vhost);
  const index = mockVHosts.findIndex(v => v.name === req.params.vhost);
  if (index !== -1) {
    mockVHosts.splice(index, 1);
  }
  res.json({
    statusCode: 200,
    message: 'Virtual host deleted successfully'
  });
});

// Application Management
app.get('/v1/vhosts/:vhost/apps', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: mockApplications.map(a => a.name)
  });
});

app.get('/v1/vhosts/:vhost/apps/:app', (req, res) => {
  const app = mockApplications.find(a => a.name === req.params.app);
  if (app) {
    res.json({
      statusCode: 200,
      message: 'OK',
      response: {
        name: app.name,
        type: 'live',
        dynamic: false,
        outputProfiles: {
          hardwareAcceleration: false,
          outputprofile: [
            {
              name: 'DistributorCompliantSRT',
              outputStreamName: 'distributor_srt',
              encodes: {
                audios: [
                  {
                    name: 'aac',
                    codec: 'aac',
                    bitrate: 128000,
                    samplerate: 48000,
                    channel: 2
                  }
                ],
                videos: [
                  {
                    name: 'h264',
                    codec: 'h264',
                    bitrate: '5000000',
                    width: 1920,
                    height: 1080,
                    framerate: 30
                  }
                ]
              }
            }
          ]
        }
      }
    });
  } else {
    res.status(404).json({
      statusCode: 404,
      message: 'Application not found'
    });
  }
});

app.post('/v1/vhosts/:vhost/apps', (req, res) => {
  console.log('📱 Application Created:', req.body);
  const newApp = req.body[0];
  mockApplications.push({ name: newApp.name, state: 'Running' });
  res.json({
    statusCode: 200,
    message: 'Application created successfully',
    response: newApp
  });
});

app.patch('/v1/vhosts/:vhost/apps/:app', (req, res) => {
  console.log('📱 Application Updated:', req.body);
  res.json({
    statusCode: 200,
    message: 'Application updated successfully',
    response: req.body
  });
});

app.delete('/v1/vhosts/:vhost/apps/:app', (req, res) => {
  console.log('🗑️ Application Deleted:', req.params.app);
  const index = mockApplications.findIndex(a => a.name === req.params.app);
  if (index !== -1) {
    mockApplications.splice(index, 1);
  }
  res.json({
    statusCode: 200,
    message: 'Application deleted successfully'
  });
});

// Stream Management
app.get('/v1/vhosts/:vhost/apps/:app/streams', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: mockStreams.map(s => s.name)
  });
});

app.get('/v1/vhosts/:vhost/apps/:app/streams/:stream', (req, res) => {
  const stream = mockStreams.find(s => s.name === req.params.stream);
  if (stream) {
    res.json({
      statusCode: 200,
      message: 'OK',
      response: {
        id: stream.id,
        name: stream.name,
        input: {
          createdTime: new Date().toISOString(),
          sourceType: 'webrtc',
          sourceUrl: 'webrtc://localhost:3333',
          tracks: [
            {
              id: 0,
              name: 'video',
              type: 'video',
              video: {
                bypass: false,
                codec: 'h264',
                width: 1920,
                height: 1080,
                bitrate: '5000000',
                bitrateConf: '5000000',
                bitrateAvg: '4800000',
                bitrateLatest: '5200000',
                framerate: 30,
                framerateConf: 30,
                framerateAvg: 29.8,
                framerateLatest: 30.1,
                timebase: { num: 1, den: 30 },
                hasBframes: true,
                keyFrameInterval: 2,
                keyFrameIntervalConf: 2,
                keyFrameIntervalAvg: 2.1,
                keyFrameIntervalLatest: 1.9,
                deltaFramesSinceLastKeyFrame: 0
              }
            },
            {
              id: 1,
              name: 'audio',
              type: 'audio',
              audio: {
                codec: 'aac',
                samplerate: 48000,
                channel: 2,
                bitrate: '128000',
                bitrateConf: '128000',
                bitrateAvg: '125000',
                bitrateLatest: '130000',
                timebase: { num: 1, den: 48000 }
              }
            }
          ]
        },
        outputs: {
          name: 'output',
          tracks: [
            {
              id: 0,
              name: 'video',
              type: 'video',
              video: {
                bypass: false,
                codec: 'h264',
                width: 1920,
                height: 1080,
                bitrate: '5000000',
                bitrateConf: '5000000',
                bitrateAvg: '4800000',
                bitrateLatest: '5200000',
                framerate: 30,
                framerateConf: 30,
                framerateAvg: 29.8,
                framerateLatest: 30.1,
                timebase: { num: 1, den: 30 },
                hasBframes: true,
                keyFrameInterval: 2,
                keyFrameIntervalConf: 2,
                keyFrameIntervalAvg: 2.1,
                keyFrameIntervalLatest: 1.9,
                deltaFramesSinceLastKeyFrame: 0
              }
            },
            {
              id: 1,
              name: 'audio',
              type: 'audio',
              audio: {
                codec: 'aac',
                samplerate: 48000,
                channel: 2,
                bitrate: '128000',
                bitrateConf: '128000',
                bitrateAvg: '125000',
                bitrateLatest: '130000',
                timebase: { num: 1, den: 48000 }
              }
            }
          ]
        }
      }
    });
  } else {
    res.status(404).json({
      statusCode: 404,
      message: 'Stream not found'
    });
  }
});

app.post('/v1/vhosts/:vhost/apps/:app/streams', (req, res) => {
  console.log('📡 Stream Created:', req.body);
  res.json({
    statusCode: 200,
    message: 'Stream created successfully',
    response: req.body
  });
});

app.delete('/v1/vhosts/:vhost/apps/:app/streams/:stream', (req, res) => {
  console.log('🗑️ Stream Deleted:', req.params.stream);
  res.json({
    statusCode: 200,
    message: 'Stream deleted successfully'
  });
});

// SCTE-35 Event Injection
app.post('/v1/vhosts/:vhost/apps/:app/streams/:stream/sendEvent', (req, res) => {
  console.log('📡 SCTE-35 Event Received:', {
    vhost: req.params.vhost,
    app: req.params.app,
    stream: req.params.stream,
    event: req.body
  });
  
  res.json({
    statusCode: 200,
    message: 'Event sent successfully',
    response: {
      eventId: req.body.eventId || Math.floor(Math.random() * 10000),
      timestamp: new Date().toISOString(),
      status: 'sent'
    }
  });
});

// Recording Management
app.post('/v1/vhosts/:vhost/apps/:app:startRecord', (req, res) => {
  console.log('🎥 Recording Started:', req.body);
  const recording = {
    ...req.body,
    vhost: req.params.vhost,
    app: req.params.app,
    state: 'started',
    outputFilePath: `/recordings/${req.body.id}.mp4`,
    outputInfoPath: `/recordings/${req.body.id}.info`,
    recordBytes: 0,
    recordTime: 0,
    totalRecordBytes: 0,
    totalRecordTime: 0,
    sequence: 1,
    startTime: new Date().toISOString(),
    createdTime: new Date().toISOString(),
    isConfig: false
  };
  mockRecordings.push(recording);
  
  res.json({
    statusCode: 200,
    message: 'Recording started successfully',
    response: recording
  });
});

app.post('/v1/vhosts/:vhost/apps/:app:stopRecord', (req, res) => {
  console.log('⏹️ Recording Stopped:', req.body);
  const recording = mockRecordings.find(r => r.id === req.body.id);
  if (recording) {
    recording.state = 'stopped';
    recording.finishTime = new Date().toISOString();
  }
  
  res.json({
    statusCode: 200,
    message: 'Recording stopped successfully'
  });
});

app.post('/v1/vhosts/:vhost/apps/:app:records', (req, res) => {
  const recordings = req.body.id 
    ? mockRecordings.filter(r => r.id === req.body.id)
    : mockRecordings;
  
  res.json({
    statusCode: 200,
    message: 'OK',
    response: recordings
  });
});

// Push Publishing Management
app.post('/v1/vhosts/:vhost/apps/:app:startPush', (req, res) => {
  console.log('📤 Push Publishing Started:', req.body);
  const push = {
    ...req.body,
    vhost: req.params.vhost,
    app: req.params.app,
    state: 'pushing',
    sentBytes: 0,
    sentTime: 0,
    totalSentBytes: 0,
    totalSentTime: 0,
    sequence: 1,
    startTime: new Date().toISOString(),
    createdTime: new Date().toISOString(),
    isConfig: false
  };
  mockPushes.push(push);
  
  res.json({
    statusCode: 200,
    message: 'Push publishing started successfully',
    response: push
  });
});

app.post('/v1/vhosts/:vhost/apps/:app:stopPush', (req, res) => {
  console.log('⏹️ Push Publishing Stopped:', req.body);
  const push = mockPushes.find(p => p.id === req.body.id);
  if (push) {
    push.state = 'stopped';
    push.finishTime = new Date().toISOString();
  }
  
  res.json({
    statusCode: 200,
    message: 'Push publishing stopped successfully'
  });
});

app.post('/v1/vhosts/:vhost/apps/:app:pushes', (req, res) => {
  const pushes = req.body.id 
    ? mockPushes.filter(p => p.id === req.body.id)
    : mockPushes;
  
  res.json({
    statusCode: 200,
    message: 'OK',
    response: pushes
  });
});

// Statistics endpoints
app.get('/v1/stats/current/vhosts/:vhost', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: generateMockStats('vhost')
  });
});

app.get('/v1/stats/current/vhosts/:vhost/apps/:app', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: generateMockStats('app')
  });
});

app.get('/v1/stats/current/vhosts/:vhost/apps/:app/streams/:stream', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: generateMockStats('stream')
  });
});

// Output Profiles
app.get('/v1/vhosts/:vhost/apps/:app/outputProfiles', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'OK',
    response: ['DistributorCompliantSRT', 'WebRTC', 'LLHLS']
  });
});

app.post('/v1/vhosts/:vhost/apps/:app/outputProfiles', (req, res) => {
  console.log('📋 Output Profile Created:', req.body);
  res.json({
    statusCode: 200,
    message: 'Output profile created successfully',
    response: req.body
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Comprehensive Mock OvenMediaEngine Server Started!`);
  console.log(`📡 API Server: http://localhost:${PORT}/v1`);
  console.log(`🔗 Dashboard: http://localhost:5173/`);
  console.log(`📋 Available Endpoints:`);
  console.log(`  GET  /v1/stats/current - Server statistics`);
  console.log(`  GET  /v1/vhosts - Virtual hosts`);
  console.log(`  GET  /v1/vhosts/:vhost - Virtual host details`);
  console.log(`  POST /v1/vhosts - Create virtual host`);
  console.log(`  DELETE /v1/vhosts/:vhost - Delete virtual host`);
  console.log(`  GET  /v1/vhosts/:vhost/apps - Applications`);
  console.log(`  GET  /v1/vhosts/:vhost/apps/:app - Application details`);
  console.log(`  POST /v1/vhosts/:vhost/apps - Create application`);
  console.log(`  PATCH /v1/vhosts/:vhost/apps/:app - Update application`);
  console.log(`  DELETE /v1/vhosts/:vhost/apps/:app - Delete application`);
  console.log(`  GET  /v1/vhosts/:vhost/apps/:app/streams - Streams`);
  console.log(`  GET  /v1/vhosts/:vhost/apps/:app/streams/:stream - Stream details`);
  console.log(`  POST /v1/vhosts/:vhost/apps/:app/streams - Create stream`);
  console.log(`  DELETE /v1/vhosts/:vhost/apps/:app/streams/:stream - Delete stream`);
  console.log(`  POST /v1/vhosts/:vhost/apps/:app/streams/:stream/sendEvent - SCTE-35 injection`);
  console.log(`  POST /v1/vhosts/:vhost/apps/:app:startRecord - Start recording`);
  console.log(`  POST /v1/vhosts/:vhost/apps/:app:stopRecord - Stop recording`);
  console.log(`  POST /v1/vhosts/:vhost/apps/:app:records - Get recording status`);
  console.log(`  POST /v1/vhosts/:vhost/apps/:app:startPush - Start push publishing`);
  console.log(`  POST /v1/vhosts/:vhost/apps/:app:stopPush - Stop push publishing`);
  console.log(`  POST /v1/vhosts/:vhost/apps/:app:pushes - Get push status`);
  console.log(`  GET  /v1/vhosts/:vhost/apps/:app/outputProfiles - Output profiles`);
  console.log(`  POST /v1/vhosts/:vhost/apps/:app/outputProfiles - Create profile`);
  console.log(`🎯 Ready for testing! The dashboard can now connect to this comprehensive mock server.`);
});
