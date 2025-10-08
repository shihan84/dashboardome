import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SCTE35Event, OMEStream, ComplianceCheck } from '../types/index';

interface AppState {
  // SCTE-35 Events
  events: SCTE35Event[];
  lastEventId: number;
  
  // OME Connection
  omeHost: string;
  omePort: number;
  omeUsername: string;
  omePassword: string;
  isConnected: boolean;
  
  // Current Stream
  currentStream: OMEStream | null;
  currentVHost: string;
  currentApp: string;
  complianceChecks: ComplianceCheck[];
  
  // WebSocket
  wsConnection: WebSocket | null;
  
  // Actions
  addEvent: (event: Omit<SCTE35Event, 'id' | 'timestamp'>) => void;
  updateEventStatus: (id: string, status: SCTE35Event['status']) => void;
  setOMEConnection: (host: string, port: number, username?: string, password?: string) => void;
  setCurrentStream: (stream: OMEStream | null) => void;
  setCurrentVHost: (vhost: string) => void;
  setCurrentApp: (app: string) => void;
  setComplianceChecks: (checks: ComplianceCheck[]) => void;
  connectWebSocket: (url: string) => void;
  disconnectWebSocket: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      events: [],
      lastEventId: 0,
      omeHost: 'localhost',
      omePort: 8081,
      omeUsername: '',
      omePassword: '',
      isConnected: false,
      currentStream: null,
      currentVHost: 'default',
      currentApp: 'app',
      complianceChecks: [],
      wsConnection: null,

      // Actions
      addEvent: (eventData) => {
        const newEvent: SCTE35Event = {
          ...eventData,
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };
        
        set((state) => ({
          events: [...state.events, newEvent],
          lastEventId: eventData.eventId,
        }));
      },

      updateEventStatus: (id, status) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, status } : event
          ),
        }));
      },

      setOMEConnection: (host, port, username = '', password = '') => {
        set({ omeHost: host, omePort: port, omeUsername: username, omePassword: password });
      },

      setCurrentVHost: (vhost) => {
        set({ currentVHost: vhost });
      },

      setCurrentApp: (app) => {
        set({ currentApp: app });
      },

      setCurrentStream: (stream) => {
        set({ currentStream: stream });
      },

      setComplianceChecks: (checks) => {
        set({ complianceChecks: checks });
      },

      connectWebSocket: (url) => {
        const ws = new WebSocket(url);
        ws.onopen = () => set({ isConnected: true, wsConnection: ws });
        ws.onclose = () => set({ isConnected: false, wsConnection: null });
        ws.onerror = () => set({ isConnected: false, wsConnection: null });
      },

      disconnectWebSocket: () => {
        const { wsConnection } = get();
        if (wsConnection) {
          wsConnection.close();
        }
        set({ isConnected: false, wsConnection: null });
      },
    }),
    {
      name: 'ibs-itassist-store',
      partialize: (state) => ({
        events: state.events,
        lastEventId: state.lastEventId,
        omeHost: state.omeHost,
        omePort: state.omePort,
        omeUsername: state.omeUsername,
        omePassword: state.omePassword,
        currentVHost: state.currentVHost,
        currentApp: state.currentApp,
      }),
    }
  )
);
