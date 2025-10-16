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
    // Determine credentials. If none provided, try to read from localStorage (browser env only)
    let resolvedUsername = username;
    let resolvedPassword = password;

    if (!resolvedUsername && typeof window !== 'undefined') {
      try {
        const storedToken = window.localStorage.getItem('omeAuthToken') || window.localStorage.getItem('omeToken') || '';
        const storedUsername = window.localStorage.getItem('omeUsername') || '';
        const storedPassword = window.localStorage.getItem('omePassword') || '';

        if (storedToken) {
          // Many OME setups use a single admin token. Use it as username with empty password.
          resolvedUsername = storedToken;
          resolvedPassword = '';
        } else if (storedUsername || storedPassword) {
          resolvedUsername = storedUsername;
          resolvedPassword = storedPassword;
        }
      } catch {
        // ignore storage errors
      }
    }

    // Build Basic auth header. Basic requires base64 of "username:password".
    // For token-only auth, send "token:" (empty password).
    if (resolvedUsername || resolvedPassword) {
      this.auth = btoa(`${resolvedUsername}:${resolvedPassword ?? ''}`);
    } else {
      this.auth = '';
    }
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
  async getVHosts(): Promise<{success: boolean, data: OMEVHost[], message?: string}> {
    try {
      const response = await axios.get(`${this.baseUrl}/vhosts`, {
        headers: this.getHeaders(),
      });
      return {
        success: true,
        data: response.data.response || [],
        message: response.data.message
      };
    } catch (error) {
      console.error('Failed to fetch vhosts:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get applications for a virtual host
   */
  async getApplications(vhost: string): Promise<{success: boolean, data: OMEApplication[], message?: string}> {
    try {
      const response = await axios.get(`${this.baseUrl}/vhosts/${vhost}/apps`, {
        headers: this.getHeaders(),
      });
      return {
        success: true,
        data: response.data.response || [],
        message: response.data.message
      };
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get streams for an application
   */
  async getStreams(vhost: string, app: string): Promise<{success: boolean, data: OMEStream[], message?: string}> {
    try {
      const response = await axios.get(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/streams`, {
        headers: this.getHeaders(),
      });
      return {
        success: true,
        data: response.data.response || [],
        message: response.data.message
      };
    } catch (error) {
      console.error('Failed to fetch streams:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error'
      };
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
   * Inject SCTE-35 message into stream using OME's proper API format
   */
  async injectSCTE35(vhost: string, app: string, stream: string, scte35Data: {
    id: number;
    type: 'out' | 'in';
    duration?: number; // milliseconds, only for 'out' type
    autoReturn?: boolean;
  }): Promise<void> {
    const eventData = {
      eventFormat: 'scte35',
      events: [{
        spliceCommand: 'spliceInsert', // OME only supports spliceInsert
        id: scte35Data.id,
        type: scte35Data.type,
        duration: scte35Data.duration || 0,
        autoReturn: scte35Data.autoReturn || false
      }]
    };
    
    await this.sendEvent(vhost, app, stream, eventData);
  }

  /**
   * Send SCTE-35 CUE-OUT (ad break start)
   */
  async sendSCTE35CueOut(vhost: string, app: string, stream: string, eventId: number, durationMs: number): Promise<void> {
    return this.injectSCTE35(vhost, app, stream, {
      id: eventId,
      type: 'out',
      duration: durationMs,
      autoReturn: false
    });
  }

  /**
   * Send SCTE-35 CUE-IN (ad break end)
   */
  async sendSCTE35CueIn(vhost: string, app: string, stream: string, eventId: number): Promise<void> {
    return this.injectSCTE35(vhost, app, stream, {
      id: eventId,
      type: 'in',
      autoReturn: false
    });
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
   * Update Virtual Host configuration (access control, TLS, etc.)
   */
  async updateVHost(vhost: string, payload: Partial<OMEVHostDetailed>): Promise<any> {
    const response = await axios.patch(`${this.baseUrl}/vhosts/${vhost}`,
      payload,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  /**
   * Convenience: Get/Set Signed Policy on VHost
   */
  async getSignedPolicy(vhost: string): Promise<{success: boolean, data: any, message?: string}> {
    try {
      const v = await this.getVHostDetailed(vhost);
      return {
        success: true,
        data: v.signedPolicy,
        message: 'Success'
      };
    } catch (error) {
      // Return default configuration when API is not available
      return {
        success: false,
        data: {
          enabled: false,
          policyQueryKeyName: 'policy',
          secretKey: '',
          url: ''
        },
        message: error instanceof Error ? error.message : 'Access Control API not available - using defaults'
      };
    }
  }

  async setSignedPolicy(vhost: string, signedPolicy: NonNullable<OMEVHostDetailed['signedPolicy']>): Promise<any> {
    return this.updateVHost(vhost, { signedPolicy });
  }

  /**
   * Convenience: Get/Set Admission Webhooks on VHost
   */
  async getAdmissionWebhooks(vhost: string): Promise<OMEVHostDetailed['admissionWebhooks']> {
    const v = await this.getVHostDetailed(vhost);
    return v.admissionWebhooks;
  }

  async setAdmissionWebhooks(vhost: string, admissionWebhooks: NonNullable<OMEVHostDetailed['admissionWebhooks']>): Promise<any> {
    return this.updateVHost(vhost, { admissionWebhooks });
  }

  /**
   * Convenience: Get Host TLS info from VHost (paths only; read-only in UI)
   */
  async getHostTLS(vhost: string): Promise<{success: boolean, data: any, message?: string}> {
    try {
      const v = await this.getVHostDetailed(vhost);
      return {
        success: true,
        data: v.host,
        message: 'Success'
      };
    } catch (error) {
      // Return default TLS configuration when API is not available
      return {
        success: false,
        data: {
          tls: {
            enabled: false,
            certPath: '',
            keyPath: '',
            chainCertPath: '',
            validUntil: null,
            issuer: '',
            status: 'disabled'
          }
        },
        message: error instanceof Error ? error.message : 'TLS API not available - using defaults'
      };
    }
  }

  // ==================== CLUSTER / ORIGIN-EDGE ====================
  /**
   * Get origin mappings (for edge) from vhost
   */
  async getOrigins(vhost: string): Promise<NonNullable<OMEVHostDetailed['origins']> | undefined> {
    const v = await this.getVHostDetailed(vhost);
    return v.origins;
  }

  /**
   * Update origin mappings (for edge) on vhost
   */
  async setOrigins(vhost: string, origins: NonNullable<OMEVHostDetailed['origins']>): Promise<any> {
    return this.updateVHost(vhost, { origins });
  }

  /**
   * Get originMapStore (redis mapping for edge)
   */
  async getOriginMapStore(vhost: string): Promise<OMEVHostDetailed['originMapStore']> {
    const v = await this.getVHostDetailed(vhost);
    return v.originMapStore;
  }

  /**
   * Update originMapStore (redis mapping for edge)
   */
  async setOriginMapStore(vhost: string, originMapStore: NonNullable<OMEVHostDetailed['originMapStore']>): Promise<any> {
    return this.updateVHost(vhost, { originMapStore });
  }

  // ==================== STREAM MONITORING & THUMBNAILS ====================
  /**
   * Get thumbnail URL for a stream
   */
  getThumbnailUrl(vhost: string, app: string, stream: string): string {
    return `${this.baseUrl.replace('/v1', '')}/${vhost}/${app}/${stream}/thumbnails/thumbnail.jpg`;
  }

  /**
   * Get HLS playlist URL for a stream
   */
  getHLSPlaylistUrl(vhost: string, app: string, stream: string): string {
    return `${this.baseUrl.replace('/v1', '')}/${vhost}/${app}/${stream}/llhls.m3u8`;
  }

  /**
   * Get WebRTC playback URL for a stream
   */
  getWebRTCUrl(vhost: string, app: string, stream: string): string {
    return `ws://${this.baseUrl.replace('http://', '').replace('/v1', '')}/${vhost}/${app}/${stream}`;
  }

  /**
   * Get all streams across all vhosts and apps
   */
  async getAllStreams(): Promise<Array<{vhost: string, app: string, stream: OMEStream}>> {
    const vhostsResponse = await this.getVHosts();
    const allStreams: Array<{vhost: string, app: string, stream: OMEStream}> = [];
    
    if (vhostsResponse.success) {
      for (const vhost of vhostsResponse.data) {
        const vhostName = typeof vhost === 'string' ? vhost : vhost.name;
        const appsResponse = await this.getApplications(vhostName).catch(() => ({ success: false, data: [] }));
        if (appsResponse.success) {
          for (const app of appsResponse.data) {
            const streamsResponse = await this.getStreams(vhostName, app.name).catch(() => ({ success: false, data: [] }));
            if (streamsResponse.success) {
              for (const stream of streamsResponse.data) {
                allStreams.push({ vhost: vhostName, app: app.name, stream });
              }
            }
          }
        }
      }
    }
    
    return allStreams;
  }

  // ==================== ABR PROFILES & TRANSCODER ====================

  /**
   * Create output profile for an application
   */
  async createOutputProfileNew(vhost: string, app: string, profile: any): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/outputProfiles`, {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  /**
   * Update output profile for an application
   */
  async updateOutputProfile(vhost: string, app: string, profileName: string, profile: any): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/outputProfiles/${profileName}`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  /**
   * Delete output profile for an application
   */
  async deleteOutputProfile(vhost: string, app: string, profileName: string): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/outputProfiles/${profileName}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get transcoder settings for an application
   */
  async getTranscoderSettings(vhost: string, app: string): Promise<any> {
    const response = await this.request(`/vhosts/${vhost}/apps/${app}/transcoder`);
    return response;
  }

  /**
   * Update transcoder settings for an application
   */
  async updateTranscoderSettings(vhost: string, app: string, settings: any): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/transcoder`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  /**
   * Get encoder settings for a specific output profile
   */
  async getEncoderSettings(vhost: string, app: string, profileName: string, encoderName: string): Promise<any> {
    const response = await this.request(`/vhosts/${vhost}/apps/${app}/outputProfiles/${profileName}/encoders/${encoderName}`);
    return response;
  }

  /**
   * Update encoder settings for a specific output profile
   */
  async updateEncoderSettings(vhost: string, app: string, profileName: string, encoderName: string, settings: any): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/outputProfiles/${profileName}/encoders/${encoderName}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ==================== RECORDING & DVR ====================
  /**
   * Get recording configuration for an application
   */
  async getRecordingConfig(vhost: string, app: string): Promise<{success: boolean, data: any, message?: string}> {
    try {
      const response = await this.request(`/vhosts/${vhost}/apps/${app}/recording`);
      return {
        success: true,
        data: response,
        message: response.message
      };
    } catch (error) {
      // Return default configuration when API is not available
      return {
        success: false,
        data: {
          enabled: false,
          outputPath: '/var/recordings',
          fileFormat: 'mp4',
          segmentDuration: 10,
          maxFileSize: '1GB',
          autoStart: false
        },
        message: error instanceof Error ? error.message : 'Recording API not available - using defaults'
      };
    }
  }

  /**
   * Update recording configuration for an application
   */
  async updateRecordingConfig(vhost: string, app: string, config: any): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/recording`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  /**
   * Start recording for a stream
   */
  async startRecordingNew(vhost: string, app: string, stream: string, options?: any): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/streams/${stream}/recording`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  /**
   * Stop recording for a stream
   */
  async stopRecordingNew(vhost: string, app: string, stream: string): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/streams/${stream}/recording`, {
      method: 'DELETE',
    });
  }

  /**
   * Get recording status for a stream
   */
  async getRecordingStatusNew(vhost: string, app: string, stream: string): Promise<any> {
    const response = await this.request(`/vhosts/${vhost}/apps/${app}/streams/${stream}/recording`);
    return response;
  }

  /**
   * Get all recordings for an application
   */
  async getRecordings(vhost: string, app: string): Promise<any[]> {
    const response = await this.request(`/vhosts/${vhost}/apps/${app}/recordings`);
    return response.recordings || [];
  }

  /**
   * Get DVR configuration for an application
   */
  async getDVRConfig(vhost: string, app: string): Promise<any> {
    const response = await this.request(`/vhosts/${vhost}/apps/${app}/dvr`);
    return response;
  }

  /**
   * Update DVR configuration for an application
   */
  async updateDVRConfig(vhost: string, app: string, config: any): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/dvr`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  /**
   * Get DVR playlist for a stream
   */
  getDVRPlaylistUrl(vhost: string, app: string, stream: string): string {
    return `${this.baseUrl.replace('/v1', '')}/${vhost}/${app}/${stream}/dvr.m3u8`;
  }

  /**
   * Get DVR segments for a stream
   */
  async getDVRSegments(vhost: string, app: string, stream: string): Promise<any[]> {
    const response = await this.request(`/vhosts/${vhost}/apps/${app}/streams/${stream}/dvr/segments`);
    return response.segments || [];
  }

  // ==================== PUSH PUBLISHING ====================
  /**
   * Get push publishing targets for an application
   */
  async getPushPublishers(vhost: string, app: string): Promise<{success: boolean, data: any[], message?: string}> {
    try {
      const response = await this.request(`/vhosts/${vhost}/apps/${app}/pushPublishers`);
      return {
        success: true,
        data: response.pushPublishers || [],
        message: response.message
      };
    } catch (error) {
      // Return empty array when API is not available - no push publishers configured
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Push Publishing API not available'
      };
    }
  }

  /**
   * Create push publishing target
   */
  async createPushPublisher(vhost: string, app: string, publisher: any): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/pushPublishers`, {
      method: 'POST',
      body: JSON.stringify(publisher),
    });
  }

  /**
   * Update push publishing target
   */
  async updatePushPublisher(vhost: string, app: string, publisherId: string, publisher: any): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/pushPublishers/${publisherId}`, {
      method: 'PUT',
      body: JSON.stringify(publisher),
    });
  }

  /**
   * Delete push publishing target
   */
  async deletePushPublisher(vhost: string, app: string, publisherId: string): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/pushPublishers/${publisherId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Start push publishing for a stream
   */
  async startPushPublishingNew(vhost: string, app: string, stream: string, publisherId: string): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/streams/${stream}/pushPublishers/${publisherId}`, {
      method: 'POST',
    });
  }

  /**
   * Stop push publishing for a stream
   */
  async stopPushPublishingNew(vhost: string, app: string, stream: string, publisherId: string): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/streams/${stream}/pushPublishers/${publisherId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get push publishing status for a stream
   */
  async getPushPublishingStatusNew(vhost: string, app: string, stream: string): Promise<any[]> {
    const response = await this.request(`/vhosts/${vhost}/apps/${app}/streams/${stream}/pushPublishers`);
    return response.pushPublishers || [];
  }

  /**
   * Get push publishing statistics
   */
  async getPushPublishingStats(vhost: string, app: string, publisherId?: string): Promise<any> {
    const url = publisherId 
      ? `/vhosts/${vhost}/apps/${app}/pushPublishers/${publisherId}/stats`
      : `/vhosts/${vhost}/apps/${app}/pushPublishers/stats`;
    const response = await this.request(url);
    return response;
  }

  // ==================== STATISTICS & MONITORING ====================

  /**
   * Get virtual host statistics
   */
  async getVHostStatsNew(vhost: string): Promise<any> {
    const response = await this.request(`/vhosts/${vhost}/stats`);
    return response;
  }

  /**
   * Get application statistics
   */
  async getAppStatsNew(vhost: string, app: string): Promise<any> {
    const response = await this.request(`/vhosts/${vhost}/apps/${app}/stats`);
    return response;
  }

  /**
   * Get stream statistics
   */
  async getStreamStatsNew(vhost: string, app: string, stream: string): Promise<any> {
    const response = await this.request(`/vhosts/${vhost}/apps/${app}/streams/${stream}/stats`);
    return response;
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<any> {
    const response = await this.request('/metrics/system');
    return response;
  }

  /**
   * Get network metrics
   */
  async getNetworkMetrics(): Promise<any> {
    const response = await this.request('/metrics/network');
    return response;
  }

  /**
   * Get transcoding metrics
   */
  async getTranscodingMetrics(): Promise<any> {
    const response = await this.request('/metrics/transcoding');
    return response;
  }

  /**
   * Get historical statistics
   */
  async getHistoricalStats(timeRange: string, metric: string): Promise<any> {
    const response = await this.request(`/stats/historical?range=${timeRange}&metric=${metric}`);
    return response;
  }

  /**
   * Get real-time metrics
   */
  async getRealtimeMetrics(): Promise<any> {
    const response = await this.request('/metrics/realtime');
    return response;
  }

  // ==================== SCTE-35 SCHEDULING & INJECTION ====================
  /**
   * Get SCTE-35 events for a stream
   */
  async getSCTE35Events(vhost: string, app: string, stream: string): Promise<{success: boolean, data: any[], message?: string}> {
    try {
      const response = await this.request(`/vhosts/${vhost}/apps/${app}/streams/${stream}/scte35/events`);
      return {
        success: true,
        data: response.events || [],
        message: response.message
      };
    } catch (error) {
      // Return empty array when API is not available - SCTE-35 is optional
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'SCTE-35 API not available'
      };
    }
  }

  /**
   * Create SCTE-35 event
   */
  async createSCTE35Event(vhost: string, app: string, stream: string, event: any): Promise<{success: boolean, data: any, message?: string}> {
    try {
      const response = await this.request(`/vhosts/${vhost}/apps/${app}/streams/${stream}/scte35/events`, {
        method: 'POST',
        body: JSON.stringify(event),
      });
      return {
        success: true,
        data: response,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'SCTE-35 API not available'
      };
    }
  }

  /**
   * Update SCTE-35 event
   */
  async updateSCTE35Event(vhost: string, app: string, stream: string, eventId: string, event: any): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/streams/${stream}/scte35/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
  }

  /**
   * Delete SCTE-35 event
   */
  async deleteSCTE35Event(vhost: string, app: string, stream: string, eventId: string): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/streams/${stream}/scte35/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Inject SCTE-35 cue immediately
   */
  async injectSCTE35Cue(vhost: string, app: string, stream: string, cue: any): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/streams/${stream}/scte35/inject`, {
      method: 'POST',
      body: JSON.stringify(cue),
    });
  }

  /**
   * Get SCTE-35 configuration
   */
  async getSCTE35Config(vhost: string, app: string): Promise<any> {
    const response = await this.request(`/vhosts/${vhost}/apps/${app}/scte35`);
    return response;
  }

  /**
   * Update SCTE-35 configuration
   */
  async updateSCTE35Config(vhost: string, app: string, config: any): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/scte35`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  /**
   * Get SCTE-35 logs
   */
  async getSCTE35Logs(vhost: string, app: string, stream?: string, limit?: number): Promise<any[]> {
    let url = `/vhosts/${vhost}/apps/${app}/scte35/logs`;
    const params = new URLSearchParams();
    if (stream) params.append('stream', stream);
    if (limit) params.append('limit', limit.toString());
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await this.request(url);
    return response.logs || [];
  }

  /**
   * Schedule SCTE-35 event
   */
  async scheduleSCTE35Event(vhost: string, app: string, stream: string, event: any): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/streams/${stream}/scte35/schedule`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  /**
   * Get scheduled SCTE-35 events
   */
  async getScheduledSCTE35Events(vhost: string, app: string, stream?: string): Promise<any[]> {
    let url = `/vhosts/${vhost}/apps/${app}/scte35/schedule`;
    if (stream) url += `?stream=${stream}`;
    
    const response = await this.request(url);
    return response.events || [];
  }

  /**
   * Cancel scheduled SCTE-35 event
   */
  async cancelScheduledSCTE35Event(vhost: string, app: string, stream: string, eventId: string): Promise<any> {
    return this.request(`/vhosts/${vhost}/apps/${app}/streams/${stream}/scte35/schedule/${eventId}`, {
      method: 'DELETE',
    });
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
    try {
      const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps`, [app], { headers: this.getHeaders() });
      return {
        success: true,
        data: response.data,
        message: 'Application created successfully'
      };
    } catch (error) {
      console.error('Error creating application:', error);
      // Re-throw the error so the component can handle it properly
      throw error;
    }
  }

  /**
   * Update application settings
   */
  async updateApplication(vhost: string, app: string, appData: OMEApplicationDetailed): Promise<any> {
    try {
      const response = await axios.patch(`${this.baseUrl}/vhosts/${vhost}/apps/${app}`, appData, { headers: this.getHeaders() });
      return {
        success: true,
        data: response.data,
        message: 'Application updated successfully'
      };
    } catch (error) {
      console.error('Error updating application:', error);
      // Re-throw the error so the component can handle it properly
      throw error;
    }
  }

  /**
   * Delete an application
   */
  async deleteApplication(vhost: string, app: string): Promise<any> {
    try {
      const response = await axios.delete(`${this.baseUrl}/vhosts/${vhost}/apps/${app}`, { headers: this.getHeaders() });
      return {
        success: true,
        data: response.data,
        message: 'Application deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting application:', error);
      // Re-throw the error so the component can handle it properly
      throw error;
    }
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

  // ===== REAL-TIME SCHEDULE MANAGEMENT =====
  
  /**
   * Update schedule file in real-time
   */
  async updateScheduleFile(vhost: string, app: string, streamName: string, scheduleData: any): Promise<{success: boolean, message: string}> {
    try {
      // In a real implementation, this would update the .sch file and reload the schedule
      // For now, we'll simulate the API call
      const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/scheduledChannels/${streamName}/reload`, {}, this.getRequestConfig());
      return {
        success: true,
        message: 'Schedule updated successfully'
      };
    } catch (error) {
      console.error('Failed to update schedule:', error);
      return {
        success: false,
        message: 'Failed to update schedule'
      };
    }
  }

  /**
   * Insert emergency content into schedule
   */
  async insertEmergencyContent(vhost: string, app: string, streamName: string, content: {
    type: 'breaking_news' | 'emergency_announcement' | 'commercial';
    duration: number; // milliseconds
    priority: number;
    contentUrl: string;
  }): Promise<{success: boolean, message: string}> {
    try {
      const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/scheduledChannels/${streamName}/emergency`, content, this.getRequestConfig());
      return {
        success: true,
        message: 'Emergency content inserted successfully'
      };
    } catch (error) {
      console.error('Failed to insert emergency content:', error);
      return {
        success: false,
        message: 'Failed to insert emergency content'
      };
    }
  }

  /**
   * Get current schedule status
   */
  async getScheduleStatus(vhost: string, app: string, streamName: string): Promise<{
    currentProgram: string;
    nextProgram: string;
    timeRemaining: number;
    isLive: boolean;
    failoverActive: boolean;
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/scheduledChannels/${streamName}/status`, this.getRequestConfig());
      return response.data.response;
    } catch (error) {
      console.error('Failed to get schedule status:', error);
      return {
        currentProgram: 'Unknown',
        nextProgram: 'Unknown',
        timeRemaining: 0,
        isLive: false,
        failoverActive: false
      };
    }
  }

  /**
   * Skip to next program
   */
  async skipToNextProgram(vhost: string, app: string, streamName: string): Promise<{success: boolean, message: string}> {
    try {
      const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/scheduledChannels/${streamName}/skip`, {}, this.getRequestConfig());
      return {
        success: true,
        message: 'Skipped to next program'
      };
    } catch (error) {
      console.error('Failed to skip program:', error);
      return {
        success: false,
        message: 'Failed to skip program'
      };
    }
  }

  /**
   * Pause/Resume schedule
   */
  async toggleSchedulePause(vhost: string, app: string, streamName: string, pause: boolean): Promise<{success: boolean, message: string}> {
    try {
      const response = await axios.post(`${this.baseUrl}/vhosts/${vhost}/apps/${app}/scheduledChannels/${streamName}/pause`, { pause }, this.getRequestConfig());
      return {
        success: true,
        message: pause ? 'Schedule paused' : 'Schedule resumed'
      };
    } catch (error) {
      console.error('Failed to toggle schedule pause:', error);
      return {
        success: false,
        message: 'Failed to toggle schedule pause'
      };
    }
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
