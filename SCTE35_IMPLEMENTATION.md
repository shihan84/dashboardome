# SCTE-35 Implementation for OvenMediaEngine Dashboard

## Overview

This document outlines the SCTE-35 (Society of Cable Telecommunications Engineers) implementation in the OvenMediaEngine dashboard, based on the official OME API documentation and distributor requirements.

## OME SCTE-35 API Implementation

### API Endpoint
```
POST /v1/vhosts/{vhost}/apps/{app}/streams/{stream}/sendEvent
```

### Request Format
```json
{
  "eventFormat": "scte35",
  "events": [
    {
      "spliceCommand": "spliceInsert",
      "id": 12345,
      "type": "out",
      "duration": 60500,
      "autoReturn": false
    }
  ]
}
```

### Parameters
- **eventFormat**: Must be "scte35"
- **spliceCommand**: Currently only "spliceInsert" is supported by OME
- **id**: 32-bit unsigned integer, unique event identifier
- **type**: "out" for CUE-OUT (ad break start), "in" for CUE-IN (ad break end)
- **duration**: Duration in milliseconds (only for "out" type)
- **autoReturn**: Boolean, whether to automatically return to program

## Distributor Requirements Implementation

### Video Specifications
- **Resolution**: HD 1920x1080
- **Codec**: H.264
- **Bitrate**: 5 Mbps
- **Profile**: High
- **GOP**: 12 frames
- **B-Frames**: 5
- **Keyframe Interval**: 12

### Audio Specifications
- **Codec**: AAC-LC
- **Bitrate**: 128 Kbps
- **Sample Rate**: 48 kHz
- **Channels**: 2 (Stereo)

### SCTE-35 Transport Stream Values
- **Data PID**: 500
- **Null PID**: 8191
- **Latency**: 2000 milliseconds (2 seconds)

### SCTE-35 Event Management
- **Event ID**: Starts from 10001, increments sequentially
- **Ad Duration**: Configurable in seconds
- **Pre-roll Duration**: 0-10 seconds configurable
- **CUE-OUT**: Ad break start signal
- **CUE-IN**: Ad break end signal
- **Crash Out**: Emergency CUE-IN functionality

## Implementation Details

### 1. API Service Methods

#### `injectSCTE35(vhost, app, stream, scte35Data)`
Main method for SCTE-35 injection with proper OME API format.

#### `sendSCTE35CueOut(vhost, app, stream, eventId, durationMs)`
Sends CUE-OUT signal for ad break start.

#### `sendSCTE35CueIn(vhost, app, stream, eventId)`
Sends CUE-IN signal for ad break end.

### 2. Dashboard Components

#### SCTE35Manager.tsx
- Comprehensive SCTE-35 management interface
- Event injection, scheduling, and logging
- Timeline and table views
- Configuration management

#### SCTE35StreamControls.tsx
- Stream-specific SCTE-35 controls
- Real-time event injection
- Pre-roll marker support
- Event timeline display

### 3. SRT Distributor Configuration

The SRT distributor is configured in the OME Server.xml with the following output profile:

```xml
<OutputProfile>
  <Name>srt_distributor</Name>
  <OutputStreamName>${OriginStreamName}_srt</OutputStreamName>
  <Encodes>
    <Video>
      <Codec>h264</Codec>
      <Width>1920</Width>
      <Height>1080</Height>
      <Bitrate>5000000</Bitrate>
      <Profile>high</Profile>
      <Preset>fast</Preset>
      <BFrames>5</BFrames>
      <KeyFrameInterval>12</KeyFrameInterval>
      <ThreadCount>4</ThreadCount>
    </Video>
    <Audio>
      <Codec>aac</Codec>
      <Bitrate>128000</Bitrate>
      <Samplerate>48000</Samplerate>
      <Channel>2</Channel>
    </Audio>
  </Encodes>
</OutputProfile>
```

## Usage Examples

### 1. Inject CUE-OUT (Ad Break Start)
```javascript
await omeApi.sendSCTE35CueOut('default', 'live', 'stream1', 10001, 30000);
// Event ID: 10001, Duration: 30 seconds
```

### 2. Inject CUE-IN (Ad Break End)
```javascript
await omeApi.sendSCTE35CueIn('default', 'live', 'stream1', 10002);
// Event ID: 10002
```

### 3. Pre-roll Marker
```javascript
await omeApi.sendSCTE35CueOut('default', 'live', 'stream1', 10001, 5000);
// 5-second pre-roll marker
```

## Event Timeline

The dashboard provides a comprehensive event timeline showing:
- Event injection timestamps
- Event duration and status
- CUE-OUT/CUE-IN pairs
- Pre-roll markers
- Crash out scenarios

## Compliance Features

### 1. Event ID Management
- Sequential event ID generation starting from 10001
- Automatic increment for each new event
- Unique identifier tracking

### 2. Duration Control
- Configurable ad duration (default: 600 seconds)
- Pre-roll duration (0-10 seconds)
- Real-time duration monitoring

### 3. Emergency Controls
- Crash out functionality for emergency CUE-IN
- Immediate event cancellation
- Status monitoring and alerts

## Testing

### Manual Testing
1. Start a stream in OBS to OME
2. Navigate to SCTE-35 Management in dashboard
3. Select the active stream
4. Inject CUE-OUT event with specified duration
5. Monitor event timeline
6. Inject CUE-IN event to end ad break

### API Testing
```bash
curl -X POST "http://192.168.1.102:8081/v1/vhosts/default/apps/live/streams/stream1/sendEvent" \
  -H "Authorization: Basic b3Zlbm1lZGlhZW5naW5lOg==" \
  -H "Content-Type: application/json" \
  -d '{
    "eventFormat": "scte35",
    "events": [{
      "spliceCommand": "spliceInsert",
      "id": 10001,
      "type": "out",
      "duration": 30000,
      "autoReturn": false
    }]
  }'
```

## Monitoring and Logging

The implementation includes:
- Real-time event status tracking
- Event history and timeline
- Error logging and recovery
- Performance metrics
- Compliance reporting

## Future Enhancements

1. **Advanced Scheduling**: Time-based event scheduling
2. **Bulk Operations**: Multiple event injection
3. **Template Management**: Predefined event templates
4. **Analytics**: Event performance analytics
5. **Integration**: Third-party ad server integration

## Troubleshooting

### Common Issues
1. **Authentication**: Ensure OME API token is configured
2. **Stream Status**: Verify stream is active before injection
3. **Event Format**: Use correct JSON format for API calls
4. **Duration**: Ensure duration is in milliseconds

### Debug Information
- Check OME server logs for SCTE-35 processing
- Monitor dashboard console for API errors
- Verify stream metrics in OME monitoring
- Test with simple CUE-OUT/CUE-IN pairs first

## References

- [OvenMediaEngine SCTE-35 Source Code](https://github.com/AirenSoft/OvenMediaEngine)
- [SCTE-35 Standard Documentation](https://www.scte.org/)
- [OME API Documentation](https://airensoft.github.io/OvenMediaEngine/)
- [MPEG-TS SCTE-35 Implementation](https://en.wikipedia.org/wiki/SCTE-35)
