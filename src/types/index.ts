// SCTE-35 Event Types
export interface SCTE35Event {
  id: string;
  action: 'CUE-OUT' | 'CUE-IN';
  eventId: number;
  adDuration?: number; // Only for CUE-OUT
  preRoll?: number; // Only for CUE-OUT
  timestamp: Date;
  status: 'pending' | 'sent' | 'confirmed' | 'failed';
}

// Stream Profile Validation
export interface StreamProfile {
  resolution: string;
  codec: string;
  bitrate: number;
  audioCodec: string;
  audioBitrate: number;
  audioSampleRate: number;
  loudness: number; // LKFS
}

export interface ComplianceCheck {
  spec: string;
  current: string | number;
  required: string | number;
  compliant: boolean;
}

// OME API Types
export interface OMEStream {
  id: string;
  name: string;
  state: 'ready' | 'streaming' | 'stopped';
  profile: StreamProfile;
}

export interface OMEApplication {
  id: string;
  name: string;
  streams: OMEStream[];
}

export interface OMEVHost {
  id: string;
  name: string;
  applications: OMEApplication[];
}

// Configuration Generator
export interface OutputProfileConfig {
  name: string;
  videoBitrate: number;
  audioBitrate: number;
  resolution: string;
  gop: number;
  bframes: number;
  loudness: number;
}

// WebSocket Event Types
export interface WebSocketEvent {
  type: 'scte35' | 'stream' | 'error';
  data: any;
  timestamp: Date;
}

// Comprehensive OME API Types
export interface OMEVHostDetailed {
  name: string;
  distribution?: string;
  host?: {
    names: string[];
    tls?: {
      certPath: string;
      chainCertPath: string;
      keyPath: string;
    };
  };
  signedPolicy?: {
    enables?: {
      providers: string;
      publishers: string;
    };
    policyQueryKeyName?: string;
    secretKey?: string;
    signatureQueryKeyName?: string;
  };
  admissionWebhooks?: {
    controlServerUrl?: string;
    secretKey?: string;
    timeout?: number;
    enables?: {
      providers: string;
      publishers: string;
    };
  };
  origins?: {
    origin: Array<{
      location: string;
      pass: {
        schema: string;
        urls: {
          url: string[];
        };
      };
    }>;
  };
  originMapStore?: {
    originHostName?: string;
    redisServer: {
      host: string;
      auth?: string;
    };
  };
  applications?: {
    application: OMEApplicationDetailed[];
  };
}

export interface OMEApplicationDetailed {
  name: string;
  type: string;
  dynamic?: boolean;
  decodes?: {
    threadcount?: number;
    onlyKeyframe?: boolean;
  };
  outputProfiles?: {
    hardwareAcceleration?: boolean;
    hwaccels?: {
      decoder?: {
        enable: boolean;
        modules: string;
      };
      encoder?: {
        enable: boolean;
        modules: string;
      };
    };
    outputprofile: OutputProfile[];
    decodes?: {
      threadcount?: number;
      onlyKeyframe?: boolean;
    };
  };
  providers?: {
    rtmp?: {
      blockDuplicateStreamName?: boolean;
      eventGenerator?: {
        event: Array<{
          trigger: string;
          hlsid3v2?: {
            eventType: string;
            frameType: string;
            info?: string;
            data: string;
          };
        }>;
      };
      passthroughOutputProfile?: boolean;
    };
    rtspPull?: {
      blockDuplicateStreamName?: boolean;
    };
    rtsp?: {};
    ovt?: {};
    srt?: {
      blockDuplicateStreamName?: boolean;
      audioMap?: {
        item: Array<{
          name: string;
          language?: string;
          characteristics?: string;
        }>;
      };
    };
    mpegts?: {
      streams?: {
        stream: Array<{
          name: string;
          port: string;
        }>;
      };
      audioMap?: {
        item: Array<{
          name: string;
          language?: string;
          characteristics?: string;
        }>;
      };
    };
    webrtc?: {
      timeout?: number;
      crossDomain?: {
        urls?: string[];
        headers?: Array<{
          key: string;
          value: string;
        }>;
      };
    };
    file?: {
      rootPath?: string;
      streamMap?: {
        stream: Array<{
          name: string;
          port: string;
        }>;
      };
      passthroughOutputProfile?: boolean;
    };
    schedule?: {
      mediaRootDir?: string;
      scheduleFilesDir?: string;
    };
    multiplex?: {
      muxFilesDir?: string;
    };
  };
  publishers?: {
    appWorkerCount?: number;
    streamWorkerCount?: number;
    delayBufferTimeMs?: number;
    llhls?: {
      chunkDuration?: number;
      partHoldBack?: number;
      enablePreloadHint?: boolean;
      drm?: {
        enable: boolean;
        infoFile: string;
      };
    };
    ovt?: {};
    webrtc?: {
      timeout?: number;
      jitterBuffer?: boolean;
      rtx?: boolean;
      ulpfec?: boolean;
      playoutDelay?: {
        min?: number;
        max?: number;
      };
      createDefaultPlaylist?: boolean;
      bandwidthEstimation?: string;
    };
    file?: {
      rootPath?: string;
      filePath?: string;
      infoPath?: string;
      streamMap?: {
        stream: Array<{
          name: string;
          port: string;
        }>;
      };
    };
    thumbnail?: {
      crossDomains?: {
        urls?: string[];
        headers?: Array<{
          key: string;
          value: string;
        }>;
      };
    };
    push?: {
      streamMap?: {
        stream: Array<{
          name: string;
          port: string;
        }>;
      };
    };
    srt?: {};
  };
}

export interface OMEStreamDetailed {
  id: string;
  name: string;
  input: {
    createdTime: string;
    sourceType: string;
    sourceUrl?: string;
    tracks: Array<{
      id: number;
      name: string;
      type: string;
      audio?: {
        codec: string;
        samplerate: number;
        channel: number;
        bitrate: string;
        bitrateConf: string;
        bitrateAvg: string;
        bitrateLatest: string;
        timebase: {
          num: number;
          den: number;
        };
      };
      video?: {
        bypass: boolean;
        codec: string;
        width: number;
        height: number;
        bitrate: string;
        bitrateConf: string;
        bitrateAvg: string;
        bitrateLatest: string;
        framerate: number;
        framerateConf: number;
        framerateAvg: number;
        framerateLatest: number;
        timebase: {
          num: number;
          den: number;
        };
        hasBframes: boolean;
        keyFrameInterval: number;
        keyFrameIntervalConf: number;
        keyFrameIntervalAvg: number;
        keyFrameIntervalLatest: number;
        deltaFramesSinceLastKeyFrame: number;
      };
    }>;
  };
  outputs: {
    name: string;
    tracks: Array<{
      id: number;
      name: string;
      type: string;
      audio?: {
        codec: string;
        samplerate: number;
        channel: number;
        bitrate: string;
        bitrateConf: string;
        bitrateAvg: string;
        bitrateLatest: string;
        timebase: {
          num: number;
          den: number;
        };
      };
      video?: {
        bypass: boolean;
        codec: string;
        width: number;
        height: number;
        bitrate: string;
        bitrateConf: string;
        bitrateAvg: string;
        bitrateLatest: string;
        framerate: number;
        framerateConf: number;
        framerateAvg: number;
        framerateLatest: number;
        timebase: {
          num: number;
          den: number;
        };
        hasBframes: boolean;
        keyFrameInterval: number;
        keyFrameIntervalConf: number;
        keyFrameIntervalAvg: number;
        keyFrameIntervalLatest: number;
        deltaFramesSinceLastKeyFrame: number;
      };
    }>;
    playlists?: Array<{
      name: string;
      fileName: string;
      options?: {
        webRtcAutoAbr?: boolean;
        hlsChunklistPathDepth?: number;
        enableTsPackaging?: boolean;
      };
      renditions?: Array<{
        name: string;
        videoVariantName?: string;
        video?: string;
        audio?: string;
        audioVariantName?: string;
        videoIndexHint?: number;
        audioIndexHint?: number;
      }>;
      rendition_templates?: Array<{
        name: string;
        video_template?: {
          variant_name: string;
          encoding_type: string;
          max_width: number;
          min_width: number;
          max_height: number;
          min_height: number;
          max_framerate: number;
          min_framerate: number;
          max_bitrate: number;
          min_bitrate: number;
        };
        audio_template?: {
          variant_name: string;
          encoding_type: string;
          max_bitrate: number;
          min_bitrate: number;
          max_samplerate: number;
          min_samplerate: number;
          max_channel: number;
          min_channel: number;
        };
      }>;
    }>;
  };
}

// Recording Management Types
export interface StreamRecord {
  id: string;
  stream: {
    name: string;
    variantNames?: string[];
  };
  interval?: number;
  filePath?: string;
  infoPath?: string;
  schedule?: string;
  metadata?: string;
  segmentationRule?: 'discontinuity' | 'continuity';
}

export interface StreamRecorded extends StreamRecord {
  vhost: string;
  app: string;
  state: 'ready' | 'started' | 'stopping' | 'stopped' | 'error';
  outputFilePath: string;
  outputInfoPath: string;
  recordBytes: number;
  recordTime: number;
  totalRecordBytes: number;
  totalRecordTime: number;
  sequence: number;
  startTime: string;
  finishTime?: string;
  createdTime: string;
  isConfig: boolean;
}

// Push Publishing Types
export interface StreamPush {
  id: string;
  stream: {
    name: string;
    tracks?: number[];
    variantNames?: string[];
  };
  protocol: 'srt' | 'rtmp' | 'mpegts';
  url: string;
  streamKey?: string;
}

export interface StreamPushed extends StreamPush {
  vhost: string;
  app: string;
  state: 'ready' | 'connecting' | 'pushing' | 'stopping' | 'stopped' | 'error';
  sentBytes: number;
  sentTime: number;
  totalSentBytes: number;
  totalSentTime: number;
  sequence: number;
  startTime: string;
  finishTime?: string;
  createdTime: string;
  isConfig: boolean;
}

// Statistics Types
export interface OMEMetrics {
  connections: {
    webrtc: number;
    llhls: number;
    ovt: number;
    file: number;
    push: number;
    thumbnail: number;
    hls: number;
    srt: number;
  };
  createdTime: string;
  lastRecvTime: string;
  lastSentTime: string;
  lastUpdatedTime: string;
  lastThroughputIn: number;
  lastThroughputOut: number;
  maxTotalConnectionTime: string;
  maxTotalConnections: number;
  totalBytesIn: number;
  totalBytesOut: number;
  totalConnections: number;
  avgThroughputIn: number;
  avgThroughputOut: number;
  maxThroughputIn: number;
  maxThroughputOut: number;
}

// Scheduled Channel Types
export interface ScheduledChannel {
  name: string;
  type: 'scheduled';
  schedule: string;
  mediaRootDir: string;
  scheduleFilesDir: string;
}

// Multiplex Channel Types
export interface MultiplexChannel {
  name: string;
  type: 'multiplex';
  muxFilesDir: string;
}

// Thumbnail Types
export interface ThumbnailConfig {
  crossDomains?: {
    urls?: string[];
    headers?: Array<{
      key: string;
      value: string;
    }>;
  };
}

// HLS Dump Types
export interface HLSDump {
  stream: {
    name: string;
    variantNames?: string[];
  };
  filePath?: string;
  infoPath?: string;
  schedule?: string;
  metadata?: string;
}

// WebRTC Types
export interface WebRTCConfig {
  timeout?: number;
  jitterBuffer?: boolean;
  rtx?: boolean;
  ulpfec?: boolean;
  playoutDelay?: {
    min?: number;
    max?: number;
  };
  createDefaultPlaylist?: boolean;
  bandwidthEstimation?: string;
  crossDomain?: {
    urls?: string[];
    headers?: Array<{
      key: string;
      value: string;
    }>;
  };
}

// SRT Types
export interface SRTConfig {
  port?: number;
  latency?: number;
  recvLatency?: number;
  peerLatency?: number;
  backlog?: number;
  sendBufferSize?: number;
  recvBufferSize?: number;
  udpRecvBufferSize?: number;
  udpSendBufferSize?: number;
  maxbw?: number;
  inputbw?: number;
  oheadbw?: number;
  congestion?: number;
  tsbpd?: number;
  tlpktdrop?: number;
  sndbuf?: number;
  rcvbuf?: number;
  lossmaxttl?: number;
  minversion?: string;
  streamid?: string;
  smoother?: string;
  messageapi?: number;
  payloadSize?: number;
  srtEnc?: number;
  srtpbkeylen?: number;
  srtpassphrase?: string;
  srtkmrefreshrate?: number;
  srtkmstate?: number;
  srtkmpreannounce?: number;
  srtkmr?: number;
  srtkmx?: number;
  srtkmy?: number;
  srtkmz?: number;
  srtkmw?: number;
  srtkmv?: number;
  srtkmu?: number;
  srtkmt?: number;
  srtkms?: number;
  srtkmq?: number;
  srtkmp?: number;
  srtkmo?: number;
  srtkmn?: number;
  srtkml?: number;
  srtkmk?: number;
  srtkmj?: number;
  srtkmi?: number;
  srtkmh?: number;
  srtkmg?: number;
  srtkmf?: number;
  srtkme?: number;
  srtkmd?: number;
  srtkmc?: number;
  srtkmb?: number;
  srtkma?: number;
  srtkm9?: number;
  srtkm8?: number;
  srtkm7?: number;
  srtkm6?: number;
  srtkm5?: number;
  srtkm4?: number;
  srtkm3?: number;
  srtkm2?: number;
  srtkm1?: number;
  srtkm0?: number;
}

// RTMP Types
export interface RTMPConfig {
  blockDuplicateStreamName?: boolean;
  eventGenerator?: {
    event: Array<{
      trigger: string;
      hlsid3v2?: {
        eventType: string;
        frameType: string;
        info?: string;
        data: string;
      };
    }>;
  };
  passthroughOutputProfile?: boolean;
}

// RTSP Types
export interface RTSPConfig {
  blockDuplicateStreamName?: boolean;
}

// Access Control Types
export interface SignedPolicy {
  enables?: {
    providers: string;
    publishers: string;
  };
  policyQueryKeyName?: string;
  secretKey?: string;
  signatureQueryKeyName?: string;
}

export interface AdmissionWebhooks {
  controlServerUrl?: string;
  secretKey?: string;
  timeout?: number;
  enables?: {
    providers: string;
    publishers: string;
  };
}

// DRM Types
export interface DRMConfig {
  enable: boolean;
  infoFile: string;
}

// Subtitle Types
export interface SubtitleConfig {
  webvtt?: {
    enable: boolean;
    language?: string;
  };
  id3v2?: {
    enable: boolean;
    eventType: string;
    frameType: string;
    data: string;
  };
}

// GPU Acceleration Types
export interface GPUAcceleration {
  hardwareAcceleration: boolean;
  hwaccels: {
    decoder?: {
      enable: boolean;
      modules: string;
    };
    encoder?: {
      enable: boolean;
      modules: string;
    };
  };
}

// Webhook Types
export interface AdmissionWebhookRequest {
  client: {
    address: string;
    port: number;
    real_ip: string;
    user_agent?: string;
  };
  request: {
    direction: 'incoming' | 'outgoing';
    protocol: 'webrtc' | 'rtmp' | 'srt' | 'llhls' | 'thumbnail';
    status: 'opening' | 'closing';
    url: string;
    new_url?: string;
    time: string;
  };
}

export interface AdmissionWebhookResponse {
  allowed: boolean;
  new_url?: string;
  lifetime?: number;
  reason?: string;
}

export interface TranscodeWebhookRequest {
  source?: string;
  stream?: {
    name: string;
    virtualHost: string;
    application: string;
    sourceType: string;
    createdTime: string;
    sourceUrl?: string;
    tracks: Array<{
      id: number;
      name: string;
      type: string;
      audio?: any;
      video?: any;
    }>;
  };
}

export interface TranscodeWebhookResponse {
  allowed: boolean;
  reason?: string;
  outputProfiles?: {
    hardwareAcceleration?: boolean;
    hwaccels?: {
      decoder?: {
        enable: boolean;
        modules: string;
      };
      encoder?: {
        enable: boolean;
        modules: string;
      };
    };
    outputprofile: OutputProfile[];
    decodes?: {
      threadcount?: number;
      onlyKeyframe?: boolean;
    };
  };
}
