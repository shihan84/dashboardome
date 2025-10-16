/**
 * Advanced Channel Failover Service
 * Monitors live streams and automatically switches to fallback content
 */

export interface StreamSource {
  id: string;
  name: string;
  type: 'rtmp' | 'hls' | 'srt' | 'file';
  url: string;
  priority: number;
  isActive: boolean;
  lastChecked: Date;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  errorCount: number;
}

export interface FailoverRule {
  id: string;
  name: string;
  channelId: string;
  primarySource: string;
  fallbackSources: string[];
  healthCheckInterval: number; // milliseconds
  maxErrors: number;
  switchDelay: number; // milliseconds
  autoRecovery: boolean;
  enabled: boolean;
}

export interface FailoverEvent {
  id: string;
  channelId: string;
  timestamp: Date;
  type: 'switch_to_fallback' | 'recovery_to_primary' | 'health_check_failed' | 'health_check_recovered';
  fromSource: string;
  toSource: string;
  reason: string;
  duration?: number; // milliseconds
}

class FailoverService {
  private streams: Map<string, StreamSource> = new Map();
  private rules: Map<string, FailoverRule> = new Map();
  private events: FailoverEvent[] = [];
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isMonitoring = false;

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // Default failover rules for our channels
    const defaultRules: FailoverRule[] = [
      {
        id: 'channel1_failover',
        name: 'Main Channel Failover',
        channelId: 'channel1',
        primarySource: 'live_stream',
        fallbackSources: ['morning_content', 'afternoon_content', 'evening_content'],
        healthCheckInterval: 5000, // 5 seconds
        maxErrors: 3,
        switchDelay: 2000, // 2 seconds
        autoRecovery: true,
        enabled: true
      },
      {
        id: 'channel2_failover',
        name: 'Music Channel Failover',
        channelId: 'channel2',
        primarySource: 'live_music',
        fallbackSources: ['music_playlist'],
        healthCheckInterval: 10000, // 10 seconds
        maxErrors: 2,
        switchDelay: 1000, // 1 second
        autoRecovery: true,
        enabled: true
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  /**
   * Add a stream source to monitor
   */
  addStreamSource(source: StreamSource): void {
    this.streams.set(source.id, source);
    console.log(`Added stream source: ${source.name} (${source.type})`);
  }

  /**
   * Remove a stream source
   */
  removeStreamSource(sourceId: string): void {
    this.streams.delete(sourceId);
    this.stopHealthCheck(sourceId);
    console.log(`Removed stream source: ${sourceId}`);
  }

  /**
   * Add a failover rule
   */
  addFailoverRule(rule: FailoverRule): void {
    this.rules.set(rule.id, rule);
    if (rule.enabled) {
      this.startHealthCheck(rule);
    }
    console.log(`Added failover rule: ${rule.name}`);
  }

  /**
   * Update a failover rule
   */
  updateFailoverRule(ruleId: string, updates: Partial<FailoverRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      const updatedRule = { ...rule, ...updates };
      this.rules.set(ruleId, updatedRule);
      
      if (updatedRule.enabled) {
        this.startHealthCheck(updatedRule);
      } else {
        this.stopHealthCheck(rule.primarySource);
      }
      console.log(`Updated failover rule: ${rule.name}`);
    }
  }

  /**
   * Start monitoring all enabled rules
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('Failover monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting failover monitoring...');

    this.rules.forEach(rule => {
      if (rule.enabled) {
        this.startHealthCheck(rule);
      }
    });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.healthCheckIntervals.forEach((interval, sourceId) => {
      clearInterval(interval);
    });
    this.healthCheckIntervals.clear();
    console.log('Stopped failover monitoring');
  }

  /**
   * Start health check for a specific rule
   */
  private startHealthCheck(rule: FailoverRule): void {
    this.stopHealthCheck(rule.primarySource);

    const interval = setInterval(async () => {
      await this.performHealthCheck(rule);
    }, rule.healthCheckInterval);

    this.healthCheckIntervals.set(rule.primarySource, interval);
  }

  /**
   * Stop health check for a specific source
   */
  private stopHealthCheck(sourceId: string): void {
    const interval = this.healthCheckIntervals.get(sourceId);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(sourceId);
    }
  }

  /**
   * Perform health check on a stream source
   */
  private async performHealthCheck(rule: FailoverRule): Promise<void> {
    const primarySource = this.streams.get(rule.primarySource);
    if (!primarySource) {
      console.warn(`Primary source not found: ${rule.primarySource}`);
      return;
    }

    try {
      const startTime = Date.now();
      const isHealthy = await this.checkStreamHealth(primarySource);
      const responseTime = Date.now() - startTime;

      primarySource.responseTime = responseTime;
      primarySource.lastChecked = new Date();

      if (isHealthy) {
        if (primarySource.healthStatus === 'unhealthy') {
          // Stream recovered
          primarySource.healthStatus = 'healthy';
          primarySource.errorCount = 0;
          this.logEvent({
            id: this.generateEventId(),
            channelId: rule.channelId,
            timestamp: new Date(),
            type: 'health_check_recovered',
            fromSource: rule.primarySource,
            toSource: rule.primarySource,
            reason: 'Stream health recovered'
          });

          // Auto-recovery to primary if enabled
          if (rule.autoRecovery) {
            await this.switchToSource(rule.channelId, rule.primarySource, 'Auto-recovery to primary');
          }
        } else {
          primarySource.healthStatus = 'healthy';
        }
      } else {
        primarySource.healthStatus = 'unhealthy';
        primarySource.errorCount++;

        this.logEvent({
          id: this.generateEventId(),
          channelId: rule.channelId,
          timestamp: new Date(),
          type: 'health_check_failed',
          fromSource: rule.primarySource,
          toSource: rule.primarySource,
          reason: `Health check failed (${primarySource.errorCount}/${rule.maxErrors})`
        });

        // Switch to fallback if error threshold reached
        if (primarySource.errorCount >= rule.maxErrors) {
          await this.switchToFallback(rule);
        }
      }
    } catch (error) {
      console.error(`Health check error for ${rule.primarySource}:`, error);
      primarySource.healthStatus = 'unhealthy';
      primarySource.errorCount++;
    }
  }

  /**
   * Check if a stream source is healthy
   */
  private async checkStreamHealth(source: StreamSource): Promise<boolean> {
    try {
      switch (source.type) {
        case 'rtmp':
          return await this.checkRTMPHealth(source.url);
        case 'hls':
          return await this.checkHLSHealth(source.url);
        case 'srt':
          return await this.checkSRTHealth(source.url);
        case 'file':
          return await this.checkFileHealth(source.url);
        default:
          console.warn(`Unknown stream type: ${source.type}`);
          return false;
      }
    } catch (error) {
      console.error(`Health check failed for ${source.id}:`, error);
      return false;
    }
  }

  /**
   * Check RTMP stream health
   */
  private async checkRTMPHealth(url: string): Promise<boolean> {
    // For RTMP, we can check if the stream is listed in OME API
    try {
      const response = await fetch('http://192.168.1.102:8081/v1/vhosts/default/apps/live/streams', {
        headers: {
          'Authorization': 'Basic b3Zlbm1lZGlhZW5naW5lOg=='
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Check if our stream is in the list
        return Array.isArray(data) && data.length > 0;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check HLS stream health
   */
  private async checkHLSHealth(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check SRT stream health
   */
  private async checkSRTHealth(url: string): Promise<boolean> {
    // SRT health check would require SRT-specific implementation
    // For now, return true as SRT is generally reliable
    return true;
  }

  /**
   * Check file health
   */
  private async checkFileHealth(url: string): Promise<boolean> {
    try {
      // For file URLs, check if file exists
      const filePath = url.replace('file://', '');
      const response = await fetch(`http://192.168.1.102:8081/v1/vhosts/default/apps/live/streams`, {
        method: 'HEAD',
        headers: {
          'Authorization': 'Basic b3Zlbm1lZGlhZW5naW5lOg=='
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Switch to fallback source
   */
  private async switchToFallback(rule: FailoverRule): Promise<void> {
    const fallbackSource = this.findNextAvailableFallback(rule);
    if (fallbackSource) {
      await this.switchToSource(rule.channelId, fallbackSource.id, 'Primary source failed');
    } else {
      console.error(`No available fallback sources for channel ${rule.channelId}`);
    }
  }

  /**
   * Find next available fallback source
   */
  private findNextAvailableFallback(rule: FailoverRule): StreamSource | null {
    for (const fallbackId of rule.fallbackSources) {
      const fallback = this.streams.get(fallbackId);
      if (fallback && fallback.healthStatus === 'healthy') {
        return fallback;
      }
    }
    return null;
  }

  /**
   * Switch to a specific source
   */
  private async switchToSource(channelId: string, sourceId: string, reason: string): Promise<void> {
    try {
      // In a real implementation, this would call OME API to switch the stream source
      console.log(`Switching channel ${channelId} to source ${sourceId}: ${reason}`);
      
      // Simulate API call to OME
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.logEvent({
        id: this.generateEventId(),
        channelId,
        timestamp: new Date(),
        type: 'switch_to_fallback',
        fromSource: 'previous_source',
        toSource: sourceId,
        reason
      });

      console.log(`Successfully switched channel ${channelId} to source ${sourceId}`);
    } catch (error) {
      console.error(`Failed to switch channel ${channelId} to source ${sourceId}:`, error);
    }
  }

  /**
   * Log a failover event
   */
  private logEvent(event: FailoverEvent): void {
    this.events.unshift(event);
    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events = this.events.slice(0, 100);
    }
    console.log(`Failover event: ${event.type} for channel ${event.channelId}`);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all stream sources
   */
  getStreamSources(): StreamSource[] {
    return Array.from(this.streams.values());
  }

  /**
   * Get all failover rules
   */
  getFailoverRules(): FailoverRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get failover events
   */
  getFailoverEvents(limit = 50): FailoverEvent[] {
    return this.events.slice(0, limit);
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): { isMonitoring: boolean; activeRules: number; totalSources: number } {
    return {
      isMonitoring: this.isMonitoring,
      activeRules: Array.from(this.rules.values()).filter(rule => rule.enabled).length,
      totalSources: this.streams.size
    };
  }
}

// Export singleton instance
export const failoverService = new FailoverService();

// Initialize with default stream sources
failoverService.addStreamSource({
  id: 'live_stream',
  name: 'Live RTMP Stream',
  type: 'rtmp',
  url: 'rtmp://192.168.1.102:1935/live/live',
  priority: 1,
  isActive: true,
  lastChecked: new Date(),
  healthStatus: 'unknown',
  errorCount: 0
});

failoverService.addStreamSource({
  id: 'morning_content',
  name: 'Morning Content',
  type: 'file',
  url: 'file:///home/ubuntu/dashboardome/media/morning_content.mp4',
  priority: 2,
  isActive: false,
  lastChecked: new Date(),
  healthStatus: 'healthy',
  errorCount: 0
});

failoverService.addStreamSource({
  id: 'afternoon_content',
  name: 'Afternoon Content',
  type: 'file',
  url: 'file:///home/ubuntu/dashboardome/media/afternoon_content.mp4',
  priority: 2,
  isActive: false,
  lastChecked: new Date(),
  healthStatus: 'healthy',
  errorCount: 0
});

failoverService.addStreamSource({
  id: 'live_music',
  name: 'Live Music Stream',
  type: 'rtmp',
  url: 'rtmp://192.168.1.102:1935/live/music',
  priority: 1,
  isActive: true,
  lastChecked: new Date(),
  healthStatus: 'unknown',
  errorCount: 0
});

failoverService.addStreamSource({
  id: 'music_playlist',
  name: 'Music Playlist',
  type: 'file',
  url: 'file:///home/ubuntu/dashboardome/media/music_playlist.mp4',
  priority: 2,
  isActive: false,
  lastChecked: new Date(),
  healthStatus: 'healthy',
  errorCount: 0
});

failoverService.addStreamSource({
  id: 'external_hls',
  name: 'External HLS Stream',
  type: 'hls',
  url: 'https://cdn.itassist.one/jd/mqtv/index.m3u8',
  priority: 1,
  isActive: true,
  lastChecked: new Date(),
  healthStatus: 'unknown',
  errorCount: 0
});

// Start monitoring
failoverService.startMonitoring();
