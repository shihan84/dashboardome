import axios from 'axios';
import type { 
  OMEVHost, 
  OMEApplication, 
  OMEStream,
  OMEVHostDetailed,
  OMEApplicationDetailed,
  OMEStreamDetailed,
  StreamRecord,
  StreamRecorded,
  StreamPush,
  StreamPushed,
  HLSDump,
  WebRTCConfig,
  SRTConfig,
  RTMPConfig,
  RTSPConfig,
  DRMConfig,
  GPUAcceleration
} from '../types/index';

export class OMEApiService {
  private baseUrl: string;
  private auth: string;

  constructor(host: string, port: number, username: string = '', password: string = '') {
    this.baseUrl = `http://${host}:${port}/v1`;
    this.auth = username && password ? btoa(`${username}:${password}`) : '';
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.auth && { Authorization: `Basic ${this.auth}` }),
    };
  }

  private getRequestConfig() {
    return {
      headers: this.getHeaders(),
    };
  }

  /**
   * Get all virtual hosts
   */
  async getVHosts(): Promise<OMEVHost[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/vhosts`, {
        headers: this.getHeaders(),
      });
      return response.data.response || [];
    } catch (error) {
      console.error('Failed to fetch vhosts:', error);
      throw error;
    }
  }

  /**
   * Get applications for a virtual host
   */
  async getApplications(vhost: string): Promise<OMEApplication[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/vhosts/${vhost}/apps`, {
        headers: this.getHeaders(),
      });
      return response.data.response || [];
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      throw error;
    }
  }

  /**
   * Get streams for an application
   */
  async getStreams(vhost: string, app: string): Promise<OMEStream[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/streams`, {
        headers: this.getHeaders(),
      });
      return response.data.response || [];
    } catch (error) {
      console.error('Failed to fetch streams:', error);
      throw error;
    }
  }

  /**
   * Get detailed stream information
   */
  async getStreamInfo(vhost: string, app: string, stream: string): Promise<OMEStream> {
    try {
      const response = await axios.get(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/streams/${stream}`, {
        headers: this.getHeaders(),
      });
      return response.data.response;
    } catch (error) {
      console.error('Failed to fetch stream info:', error);
      throw error;
    }
  }


  /**
   * Get server statistics
   */
  async getServerStats(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/stats/current`, {
        headers: this.getHeaders(),
      });
      return response.data.response;
    } catch (error) {
      console.error('Failed to fetch server stats:', error);
      throw error;
    }
  }

  /**
   * Get virtual host statistics
   */
  async getVHostStats(vhost: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/stats/current/vhosts/${vhost}`, {
        headers: this.getHeaders(),
      });
      return response.data.response;
    } catch (error) {
      console.error('Failed to fetch vhost stats:', error);
      throw error;
    }
  }

  /**
   * Get application statistics
   */
  async getAppStats(vhost: string, app: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/stats/current/vhosts/${vhost}/apps/${app}`, {
        headers: this.getHeaders(),
      });
      return response.data.response;
    } catch (error) {
      console.error('Failed to fetch app stats:', error);
      throw error;
    }
  }

  /**
   * Get stream statistics
   */
  async getStreamStats(vhost: string, app: string, stream: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/stats/current/vhosts/${vhost}/apps/${app}/streams/${stream}`, {
        headers: this.getHeaders(),
      });
      return response.data.response;
    } catch (error) {
      console.error('Failed to fetch stream stats:', error);
      throw error;
    }
  }

  /**
   * Get output profiles for an application
   */
  async getOutputProfiles(vhost: string, app: string): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/outputProfiles`, {
        headers: this.getHeaders(),
      });
      return response.data.response || [];
    } catch (error) {
      console.error('Failed to fetch output profiles:', error);
      throw error;
    }
  }

  /**
   * Create output profile
   */
  async createOutputProfile(vhost: string, app: string, profileData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/outputProfiles`, [profileData], {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create output profile:', error);
      throw error;
    }
  }

  /**
   * Send event to stream (SCTE-35 injection)
   */
  async sendEvent(vhost: string, app: string, stream: string, eventData: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/vhosts/${vhost}/apps/${app}/streams/${stream}/sendEvent`,
        eventData,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to send event:', error);
      throw error;
    }
  }

  /**
   * Inject SCTE-35 message into stream
   */
  async injectSCTE35(vhost: string, app: string, stream: string, message: string): Promise<void> {
    const eventData = {
      eventType: 'video',
      frameType: 'TXXX',
      data: message,
      timestamp: Date.now()
    };
    
    await this.sendEvent(vhost, app, stream, eventData);
  }

  /**
   * Test connection to OME server
   */
  async testConnection(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/stats/current`, { 
        headers: this.getHeaders(),
        timeout: 5000 
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // ==================== VIRTUAL HOST MANAGEMENT ====================
  
  /**
   * Get detailed virtual host information
   */
  async getVHostDetailed(vhost: string): Promise<OMEVHostDetailed> {
    const response = await axios.get(`${this.baseUrl}/vhosts/${vhost}`, {
      headers: this.getHeaders(),
    });
    return response.data.response;
  }

  /**
   * Create a new virtual host
   */
  async createVHost(vhost: OMEVHostDetailed): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/vhosts`, [vhost], { headers: this.getHeaders() });
    return response.data;
  }

  /**
   * Delete a virtual host
   */
  async deleteVHost(vhost: string): Promise<any> {
    const response = await axios.delete(`${this.baseUrl}/vhosts/${vhost}`, { headers: this.getHeaders() });
    return response.data;
  }

  // ==================== APPLICATION MANAGEMENT ====================
  
  /**
   * Get detailed application information
   */
  async getApplicationDetailed(vhost: string, app: string): Promise<OMEApplicationDetailed> {
    const response = await axios.get(`${this.baseUrl}/vhosts/${vhost}/apps/${app}`, { headers: this.getHeaders() });
    return response.data.response;
  }

  /**
   * Create a new application
   */
  async createApplication(vhost: string, app: OMEApplicationDetailed): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps`, [app], { headers: this.getHeaders() });
    return response.data;
  }

  /**
   * Update application settings
   */
  async updateApplication(vhost: string, app: string, appData: OMEApplicationDetailed): Promise<any> {
    const response = await axios.patch(`${this.baseUrl}/vhosts/${vhost}/apps/${app}`, appData, { headers: this.getHeaders() });
    return response.data;
  }

  /**
   * Delete an application
   */
  async deleteApplication(vhost: string, app: string): Promise<any> {
    const response = await axios.delete(`${this.baseUrl}/vhosts/${vhost}/apps/${app}`, { headers: this.getHeaders() });
    return response.data;
  }

  // ==================== STREAM MANAGEMENT ====================
  
  /**
   * Get detailed stream information
   */
  async getStreamDetailed(vhost: string, app: string, stream: string): Promise<OMEStreamDetailed> {
    const response = await axios.get(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/streams/${stream}`, { headers: this.getHeaders() });
    return response.data.response;
  }

  /**
   * Create a stream by pulling external URL (RTSP, OVT)
   */
  async createPullStream(vhost: string, app: string, streamData: {
    name: string;
    urls: string[];
    properties?: {
      persistent?: boolean;
      noInputFailoverTimeoutMs?: number;
      unusedStreamDeletionTimeoutMs?: number;
      ignoreRtcpSRTimestamp?: number;
    };
  }): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/streams`, streamData, { headers: this.getHeaders() });
    return response.data;
  }

  /**
   * Delete a stream
   */
  async deleteStream(vhost: string, app: string, stream: string): Promise<any> {
    const response = await axios.delete(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/streams/${stream}`, { headers: this.getHeaders() });
    return response.data;
  }

  // ==================== RECORDING MANAGEMENT ====================
  
  /**
   * Start recording a stream
   */
  async startRecording(vhost: string, app: string, recordData: StreamRecord): Promise<StreamRecorded> {
    const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}:startRecord`, recordData, { headers: this.getHeaders() });
    return response.data.response;
  }

  /**
   * Stop recording
   */
  async stopRecording(vhost: string, app: string, recordId: string): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}:stopRecord`, { id: recordId }, { headers: this.getHeaders() });
    return response.data;
  }

  /**
   * Get recording status
   */
  async getRecordingStatus(vhost: string, app: string, recordId?: string): Promise<StreamRecorded[]> {
    const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}:records`, 
      recordId ? { id: recordId } : {}, { headers: this.getHeaders() });
    return response.data.response;
  }

  // ==================== PUSH PUBLISHING ====================
  
  /**
   * Start push publishing
   */
  async startPushPublishing(vhost: string, app: string, pushData: StreamPush): Promise<StreamPushed> {
    const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}:startPush`, pushData, { headers: this.getHeaders() });
    return response.data.response;
  }

  /**
   * Stop push publishing
   */
  async stopPushPublishing(vhost: string, app: string, pushId: string): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}:stopPush`, { id: pushId }, { headers: this.getHeaders() });
    return response.data;
  }

  /**
   * Get push publishing status
   */
  async getPushPublishingStatus(vhost: string, app: string, pushId?: string): Promise<StreamPushed[]> {
    const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}:pushes`, 
      pushId ? { id: pushId } : {}, { headers: this.getHeaders() });
    return response.data.response;
  }

  // ==================== HLS DUMP ====================
  
  /**
   * Start HLS dump for VoD creation
   */
  async startHLSDump(vhost: string, app: string, stream: string, dumpData: HLSDump): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/streams/${stream}/hlsDump`, dumpData, { headers: this.getHeaders() });
    return response.data;
  }

  /**
   * Conclude HLS live stream
   */
  async concludeHLSLive(vhost: string, app: string, stream: string): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/streams/${stream}/concludeHlsLive`, {}, { headers: this.getHeaders() });
    return response.data;
  }

  // ==================== SUBTITLES ====================
  
  /**
   * Send subtitles to stream
   */
  async sendSubtitles(vhost: string, app: string, stream: string, subtitleData: {
    eventType: string;
    frameType: string;
    data: string;
    info?: string;
  }): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/streams/${stream}/sendSubtitles`, subtitleData, { headers: this.getHeaders() });
    return response.data;
  }

  // ==================== CONFIGURATION HELPERS ====================
  
  /**
   * Generate SRT configuration
   */
  generateSRTConfig(config: Partial<SRTConfig>): SRTConfig {
    return {
      port: 9999,
      latency: 2000,
      recvLatency: 2000,
      peerLatency: 2000,
      backlog: 5,
      sendBufferSize: 65536,
      recvBufferSize: 65536,
      udpRecvBufferSize: 65536,
      udpSendBufferSize: 65536,
      maxbw: 0,
      inputbw: 0,
      oheadbw: 25,
      congestion: 0,
      tsbpd: 1,
      tlpktdrop: 1,
      sndbuf: 0,
      rcvbuf: 0,
      lossmaxttl: 0,
      minversion: '0x010000',
      streamid: '',
      smoother: 'live',
      messageapi: 1,
      payloadSize: 1316,
      srtEnc: 0,
      srtpbkeylen: 0,
      srtpassphrase: '',
      srtkmrefreshrate: 0,
      srtkmstate: 0,
      srtkmpreannounce: 0,
      srtkmr: 0,
      srtkmx: 0,
      srtkmy: 0,
      srtkmz: 0,
      srtkmw: 0,
      srtkmv: 0,
      srtkmu: 0,
      srtkmt: 0,
      srtkms: 0,
      srtkmq: 0,
      srtkmp: 0,
      srtkmo: 0,
      srtkmn: 0,
      srtkml: 0,
      srtkmk: 0,
      srtkmj: 0,
      srtkmi: 0,
      srtkmh: 0,
      srtkmg: 0,
      srtkmf: 0,
      srtkme: 0,
      srtkmd: 0,
      srtkmc: 0,
      srtkmb: 0,
      srtkma: 0,
      srtkm9: 0,
      srtkm8: 0,
      srtkm7: 0,
      srtkm6: 0,
      srtkm5: 0,
      srtkm4: 0,
      srtkm3: 0,
      srtkm2: 0,
      srtkm1: 0,
      srtkm0: 0,
      ...config
    };
  }

  /**
   * Generate WebRTC configuration
   */
  generateWebRTCConfig(config: Partial<WebRTCConfig>): WebRTCConfig {
    return {
      timeout: 30000,
      jitterBuffer: true,
      rtx: true,
      ulpfec: true,
      playoutDelay: {
        min: 0,
        max: 1000
      },
      createDefaultPlaylist: true,
      bandwidthEstimation: 'tcc',
      crossDomain: {
        urls: [],
        headers: []
      },
      ...config
    };
  }

  /**
   * Generate RTMP configuration
   */
  generateRTMPConfig(config: Partial<RTMPConfig>): RTMPConfig {
    return {
      blockDuplicateStreamName: false,
      passthroughOutputProfile: false,
      ...config
    };
  }

  /**
   * Generate RTSP configuration
   */
  generateRTSPConfig(config: Partial<RTSPConfig>): RTSPConfig {
    return {
      blockDuplicateStreamName: false,
      ...config
    };
  }

  /**
   * Generate DRM configuration
   */
  generateDRMConfig(config: Partial<DRMConfig>): DRMConfig {
    return {
      enable: false,
      infoFile: '',
      ...config
    };
  }

  /**
   * Generate GPU acceleration configuration
   */
  generateGPUAccelerationConfig(config: Partial<GPUAcceleration>): GPUAcceleration {
    return {
      hardwareAcceleration: false,
      hwaccels: {
        decoder: {
          enable: false,
          modules: ''
        },
        encoder: {
          enable: false,
          modules: ''
        }
      },
      ...config
    };
  }

  // ===== SCHEDULED CHANNELS API =====
  
  // Get all scheduled channels
  async getScheduledChannels(vhost: string, app: string): Promise<string[]> {
    const response = await axios.get(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/scheduledChannels`, this.getRequestConfig());
    return response.data.response;
  }

  // Get scheduled channel details
  async getScheduledChannel(vhost: string, app: string, streamName: string): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/scheduledChannels/${streamName}`, this.getRequestConfig());
    return response.data.response;
  }

  // Create scheduled channel
  async createScheduledChannel(vhost: string, app: string, channelData: any): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/scheduledChannels`, channelData, this.getRequestConfig());
    return response.data.response;
  }

  // Update scheduled channel
  async updateScheduledChannel(vhost: string, app: string, streamName: string, channelData: any): Promise<any> {
    const response = await axios.patch(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/scheduledChannels/${streamName}`, channelData, this.getRequestConfig());
    return response.data.response;
  }

  // Delete scheduled channel
  async deleteScheduledChannel(vhost: string, app: string, streamName: string): Promise<any> {
    const response = await axios.delete(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/scheduledChannels/${streamName}`, this.getRequestConfig());
    return response.data.response;
  }

  // ===== MULTIPLEX CHANNELS API =====
  
  // Get all multiplex channels
  async getMultiplexChannels(vhost: string, app: string): Promise<string[]> {
    const response = await axios.get(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/multiplexChannels`, this.getRequestConfig());
    return response.data.response;
  }

  // Get multiplex channel details
  async getMultiplexChannel(vhost: string, app: string, streamName: string): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/multiplexChannels/${streamName}`, this.getRequestConfig());
    return response.data.response;
  }

  // Create multiplex channel
  async createMultiplexChannel(vhost: string, app: string, channelData: any): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/multiplexChannels`, channelData, this.getRequestConfig());
    return response.data.response;
  }

  // Delete multiplex channel
  async deleteMultiplexChannel(vhost: string, app: string, streamName: string): Promise<any> {
    const response = await axios.delete(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/multiplexChannels/${streamName}`, this.getRequestConfig());
    return response.data.response;
  }

  // ===== STREAM SEARCH AND FILTERING =====
  
  // Search streams across all types
  async searchStreams(vhost: string, app: string, query: string): Promise<any> {
    const [regularStreams, scheduledChannels, multiplexChannels] = await Promise.all([
      this.getStreams(vhost, app).catch(() => []),
      this.getScheduledChannels(vhost, app).catch(() => []),
      this.getMultiplexChannels(vhost, app).catch(() => [])
    ]);

    const allStreams = [
      ...regularStreams.map((stream: any) => ({ ...stream, type: 'regular' })),
      ...scheduledChannels.map((name: string) => ({ name, type: 'scheduled' })),
      ...multiplexChannels.map((name: string) => ({ name, type: 'multiplex' }))
    ];

    return allStreams.filter(stream => 
      stream.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Get all channels and streams with metadata
  async getAllChannelsAndStreams(vhost: string, app: string): Promise<any> {
    const [regularStreams, scheduledChannels, multiplexChannels] = await Promise.all([
      this.getStreams(vhost, app).catch(() => []),
      this.getScheduledChannels(vhost, app).catch(() => []),
      this.getMultiplexChannels(vhost, app).catch(() => [])
    ]);

    return {
      regular: regularStreams,
      scheduled: scheduledChannels,
      multiplex: multiplexChannels,
      total: regularStreams.length + scheduledChannels.length + multiplexChannels.length
    };
  }
}
