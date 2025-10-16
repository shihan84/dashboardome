/**
 * SCTE-35 Integration with Scheduled Content Service
 * Handles SCTE-35 event injection during scheduled programs
 */

export interface ScheduledSCTE35Event {
  id: string;
  channelId: string;
  programId: string;
  eventType: 'cue_out' | 'cue_in' | 'pre_roll' | 'post_roll';
  eventId: number;
  scheduledTime: Date;
  duration?: number; // milliseconds, only for cue_out
  preRoll?: number; // milliseconds, only for cue_out
  status: 'scheduled' | 'executed' | 'cancelled' | 'failed';
  executedAt?: Date;
  error?: string;
  metadata?: {
    adBreakId?: string;
    advertiser?: string;
    product?: string;
    campaign?: string;
  };
}

export interface ProgramSCTE35Config {
  programId: string;
  channelId: string;
  enableSCTE35: boolean;
  adBreakSchedule: AdBreakSchedule[];
  preRollEnabled: boolean;
  postRollEnabled: boolean;
  defaultAdDuration: number; // milliseconds
  defaultPreRoll: number; // milliseconds
}

export interface AdBreakSchedule {
  id: string;
  name: string;
  scheduledTime: Date; // Relative to program start
  duration: number; // milliseconds
  preRoll: number; // milliseconds
  eventId: number;
  metadata?: {
    advertiser?: string;
    product?: string;
    campaign?: string;
  };
}

class SCTE35ScheduleService {
  private scheduledEvents: Map<string, ScheduledSCTE35Event> = new Map();
  private programConfigs: Map<string, ProgramSCTE35Config> = new Map();
  private executionQueue: ScheduledSCTE35Event[] = [];
  private isProcessing = false;
  private executionInterval: NodeJS.Timeout | null = null;
  private nextEventId = 10001;

  constructor() {
    this.startEventProcessor();
    this.initializeDefaultConfigs();
  }

  /**
   * Start the event processor
   */
  private startEventProcessor(): void {
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
    }

    this.executionInterval = setInterval(() => {
      this.processScheduledEvents();
    }, 1000); // Check every second

    console.log('SCTE-35 schedule event processor started');
  }

  /**
   * Stop the event processor
   */
  stopEventProcessor(): void {
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
      this.executionInterval = null;
    }
    console.log('SCTE-35 schedule event processor stopped');
  }

  /**
   * Initialize default program configurations
   */
  private initializeDefaultConfigs(): void {
    const defaultConfigs: ProgramSCTE35Config[] = [
      {
        programId: 'morning_show',
        channelId: 'channel1',
        enableSCTE35: true,
        preRollEnabled: true,
        postRollEnabled: true,
        defaultAdDuration: 180000, // 3 minutes
        defaultPreRoll: 5000, // 5 seconds
        adBreakSchedule: [
          {
            id: 'morning_break_1',
            name: 'Morning Break 1',
            scheduledTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
            duration: 180000, // 3 minutes
            preRoll: 5000, // 5 seconds
            eventId: this.nextEventId++,
            metadata: {
              advertiser: 'Morning Sponsor',
              product: 'Coffee Brand',
              campaign: 'Morning Energy'
            }
          },
          {
            id: 'morning_break_2',
            name: 'Morning Break 2',
            scheduledTime: new Date(Date.now() + 60 * 60 * 1000), // 60 minutes from now
            duration: 120000, // 2 minutes
            preRoll: 3000, // 3 seconds
            eventId: this.nextEventId++,
            metadata: {
              advertiser: 'News Sponsor',
              product: 'News Service',
              campaign: 'Stay Informed'
            }
          }
        ]
      },
      {
        programId: 'afternoon_show',
        channelId: 'channel1',
        enableSCTE35: true,
        preRollEnabled: true,
        postRollEnabled: true,
        defaultAdDuration: 240000, // 4 minutes
        defaultPreRoll: 5000, // 5 seconds
        adBreakSchedule: [
          {
            id: 'afternoon_break_1',
            name: 'Afternoon Break 1',
            scheduledTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
            duration: 240000, // 4 minutes
            preRoll: 5000, // 5 seconds
            eventId: this.nextEventId++,
            metadata: {
              advertiser: 'Afternoon Sponsor',
              product: 'Snack Brand',
              campaign: 'Afternoon Treat'
            }
          }
        ]
      }
    ];

    defaultConfigs.forEach(config => {
      this.programConfigs.set(config.programId, config);
    });

    console.log('Initialized default SCTE-35 program configurations');
  }

  /**
   * Process scheduled SCTE-35 events
   */
  private async processScheduledEvents(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      const now = new Date();
      const eventsToExecute = this.executionQueue.filter(event => 
        event.status === 'scheduled' && 
        event.scheduledTime <= now
      );

      for (const event of eventsToExecute) {
        await this.executeSCTE35Event(event);
      }
    } catch (error) {
      console.error('Error processing scheduled SCTE-35 events:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a scheduled SCTE-35 event
   */
  private async executeSCTE35Event(event: ScheduledSCTE35Event): Promise<void> {
    try {
      console.log(`Executing SCTE-35 event: ${event.eventType} for channel ${event.channelId}`);
      
      // In a real implementation, this would call the OME API to inject SCTE-35
      await this.injectSCTE35Event(event);
      
      event.status = 'executed';
      event.executedAt = new Date();
      
      console.log(`SCTE-35 event executed successfully: ${event.id}`);
    } catch (error) {
      event.status = 'failed';
      event.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to execute SCTE-35 event: ${event.id}`, error);
    }
  }

  /**
   * Inject SCTE-35 event into OME
   */
  private async injectSCTE35Event(event: ScheduledSCTE35Event): Promise<void> {
    // In a real implementation, this would call the OME API
    // For now, we'll simulate the API call
    
    const eventData = {
      eventFormat: 'scte35',
      events: [{
        spliceCommand: 'spliceInsert',
        id: event.eventId,
        type: event.eventType === 'cue_out' ? 'out' : 'in',
        duration: event.duration || 0,
        autoReturn: false
      }]
    };

    console.log(`Injecting SCTE-35 event:`, eventData);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In real implementation:
    // await fetch(`http://192.168.1.102:8081/v1/vhosts/default/apps/live/streams/${event.channelId}/sendEvent`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': 'Basic b3Zlbm1lZGlhZW5naW5lOg=='
    //   },
    //   body: JSON.stringify(eventData)
    // });
  }

  /**
   * Schedule SCTE-35 events for a program
   */
  scheduleProgramEvents(programId: string, programStartTime: Date): string[] {
    const config = this.programConfigs.get(programId);
    if (!config || !config.enableSCTE35) {
      console.log(`SCTE-35 not enabled for program: ${programId}`);
      return [];
    }

    const eventIds: string[] = [];
    const programEndTime = new Date(programStartTime.getTime() + 2 * 60 * 60 * 1000); // Assume 2-hour program

    // Schedule pre-roll if enabled
    if (config.preRollEnabled) {
      const preRollEvent: ScheduledSCTE35Event = {
        id: `preroll_${programId}_${Date.now()}`,
        channelId: config.channelId,
        programId,
        eventType: 'pre_roll',
        eventId: this.nextEventId++,
        scheduledTime: new Date(programStartTime.getTime() - config.defaultPreRoll),
        duration: config.defaultPreRoll,
        status: 'scheduled'
      };
      
      this.scheduledEvents.set(preRollEvent.id, preRollEvent);
      this.executionQueue.push(preRollEvent);
      eventIds.push(preRollEvent.id);
    }

    // Schedule ad breaks
    config.adBreakSchedule.forEach(adBreak => {
      const breakStartTime = new Date(programStartTime.getTime() + adBreak.scheduledTime.getTime());
      const breakEndTime = new Date(breakStartTime.getTime() + adBreak.duration);

      // CUE-OUT event
      const cueOutEvent: ScheduledSCTE35Event = {
        id: `cueout_${adBreak.id}_${Date.now()}`,
        channelId: config.channelId,
        programId,
        eventType: 'cue_out',
        eventId: adBreak.eventId,
        scheduledTime: new Date(breakStartTime.getTime() - adBreak.preRoll),
        duration: adBreak.duration,
        preRoll: adBreak.preRoll,
        status: 'scheduled',
        metadata: adBreak.metadata
      };

      // CUE-IN event
      const cueInEvent: ScheduledSCTE35Event = {
        id: `cuein_${adBreak.id}_${Date.now()}`,
        channelId: config.channelId,
        programId,
        eventType: 'cue_in',
        eventId: adBreak.eventId,
        scheduledTime: breakEndTime,
        status: 'scheduled',
        metadata: adBreak.metadata
      };

      this.scheduledEvents.set(cueOutEvent.id, cueOutEvent);
      this.scheduledEvents.set(cueInEvent.id, cueInEvent);
      this.executionQueue.push(cueOutEvent, cueInEvent);
      eventIds.push(cueOutEvent.id, cueInEvent.id);
    });

    // Schedule post-roll if enabled
    if (config.postRollEnabled) {
      const postRollEvent: ScheduledSCTE35Event = {
        id: `postroll_${programId}_${Date.now()}`,
        channelId: config.channelId,
        programId,
        eventType: 'post_roll',
        eventId: this.nextEventId++,
        scheduledTime: programEndTime,
        status: 'scheduled'
      };
      
      this.scheduledEvents.set(postRollEvent.id, postRollEvent);
      this.executionQueue.push(postRollEvent);
      eventIds.push(postRollEvent.id);
    }

    console.log(`Scheduled ${eventIds.length} SCTE-35 events for program: ${programId}`);
    return eventIds;
  }

  /**
   * Cancel scheduled events for a program
   */
  cancelProgramEvents(programId: string): number {
    let cancelledCount = 0;
    
    this.executionQueue.forEach(event => {
      if (event.programId === programId && event.status === 'scheduled') {
        event.status = 'cancelled';
        cancelledCount++;
      }
    });

    console.log(`Cancelled ${cancelledCount} SCTE-35 events for program: ${programId}`);
    return cancelledCount;
  }

  /**
   * Add emergency SCTE-35 event
   */
  addEmergencyEvent(channelId: string, eventType: 'cue_out' | 'cue_in', duration?: number): string {
    const event: ScheduledSCTE35Event = {
      id: `emergency_${Date.now()}`,
      channelId,
      programId: 'emergency',
      eventType,
      eventId: this.nextEventId++,
      scheduledTime: new Date(), // Execute immediately
      duration,
      status: 'scheduled'
    };

    this.scheduledEvents.set(event.id, event);
    this.executionQueue.unshift(event); // Add to front of queue for immediate execution
    
    console.log(`Added emergency SCTE-35 event: ${event.id}`);
    return event.id;
  }

  /**
   * Update program configuration
   */
  updateProgramConfig(programId: string, config: Partial<ProgramSCTE35Config>): void {
    const existingConfig = this.programConfigs.get(programId);
    if (existingConfig) {
      const updatedConfig = { ...existingConfig, ...config };
      this.programConfigs.set(programId, updatedConfig);
      console.log(`Updated SCTE-35 configuration for program: ${programId}`);
    } else {
      console.warn(`Program configuration not found: ${programId}`);
    }
  }

  /**
   * Get scheduled events for a program
   */
  getProgramEvents(programId: string): ScheduledSCTE35Event[] {
    return Array.from(this.scheduledEvents.values())
      .filter(event => event.programId === programId);
  }

  /**
   * Get all scheduled events
   */
  getAllScheduledEvents(): ScheduledSCTE35Event[] {
    return Array.from(this.scheduledEvents.values());
  }

  /**
   * Get program configuration
   */
  getProgramConfig(programId: string): ProgramSCTE35Config | undefined {
    return this.programConfigs.get(programId);
  }

  /**
   * Get all program configurations
   */
  getAllProgramConfigs(): ProgramSCTE35Config[] {
    return Array.from(this.programConfigs.values());
  }

  /**
   * Get service status
   */
  getStatus(): {
    isProcessing: boolean;
    totalEvents: number;
    scheduledEvents: number;
    executedEvents: number;
    cancelledEvents: number;
    failedEvents: number;
    configuredPrograms: number;
  } {
    const events = Array.from(this.scheduledEvents.values());
    return {
      isProcessing: this.isProcessing,
      totalEvents: events.length,
      scheduledEvents: events.filter(e => e.status === 'scheduled').length,
      executedEvents: events.filter(e => e.status === 'executed').length,
      cancelledEvents: events.filter(e => e.status === 'cancelled').length,
      failedEvents: events.filter(e => e.status === 'failed').length,
      configuredPrograms: this.programConfigs.size
    };
  }

  /**
   * Clear executed events
   */
  clearExecutedEvents(): void {
    const executedEvents = Array.from(this.scheduledEvents.values())
      .filter(event => event.status === 'executed');
    
    executedEvents.forEach(event => {
      this.scheduledEvents.delete(event.id);
    });

    // Remove from execution queue
    this.executionQueue = this.executionQueue.filter(event => event.status !== 'executed');
    
    console.log(`Cleared ${executedEvents.length} executed SCTE-35 events`);
  }
}

// Export singleton instance
export const scte35ScheduleService = new SCTE35ScheduleService();
