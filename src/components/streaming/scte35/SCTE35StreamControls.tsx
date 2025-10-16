import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Switch, 
  InputNumber, 
  Form, 
  Row, 
  Col, 
  Alert, 
  Tag, 
  message,
  Divider,
  Statistic,
  Timeline
} from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  SendOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;

interface SCTE35StreamControlsProps {
  vhost?: string;
  app?: string;
  stream?: string;
}

interface SCTE35Event {
  id: number;
  type: 'cue-out' | 'cue-in' | 'preroll';
  duration: number;
  timestamp: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
  pid: number;
}

export const SCTE35StreamControls: React.FC<SCTE35StreamControlsProps> = ({
  vhost = 'default',
  app = 'live',
  stream = 'live'
}) => {
  const [enabled, setEnabled] = useState(false);
  const [eventId, setEventId] = useState(100023); // Starting from distributor requirement
  const [duration, setDuration] = useState(30);
  const [adDuration, setAdDuration] = useState(600); // 10 minutes default
  const [prerollDuration, setPrerollDuration] = useState(0); // 0-10 seconds
  const [scteDataPid, setScteDataPid] = useState(500); // Distributor requirement
  const [isInjecting, setIsInjecting] = useState(false);
  const [events, setEvents] = useState<SCTE35Event[]>([]);
  const [nextEventTime, setNextEventTime] = useState<number | null>(null);
  const [form] = Form.useForm();
  
  const omeApi = new OMEApiService();

  // Auto-increment event ID
  useEffect(() => {
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      setEventId(lastEvent.id + 1);
    }
  }, [events]);

  // Calculate next event time
  useEffect(() => {
    if (enabled && events.length > 0) {
      const lastEvent = events[events.length - 1];
      if (lastEvent.status === 'completed') {
        setNextEventTime(Date.now() + (duration * 1000));
      }
    }
  }, [enabled, events, duration]);

  const handleToggleSCTE35 = async (checked: boolean) => {
    try {
      setEnabled(checked);
      
      if (checked) {
        message.success('SCTE-35 pre-roll markers enabled');
        // Start the first event immediately
        await injectSCTE35Event();
      } else {
        message.info('SCTE-35 pre-roll markers disabled');
        setNextEventTime(null);
      }
    } catch (error) {
      console.error('Error toggling SCTE-35:', error);
      message.error('Failed to toggle SCTE-35 markers');
      setEnabled(false);
    }
  };

  const injectSCTE35Event = async (type: 'cue-out' | 'cue-in' | 'preroll' = 'preroll') => {
    if (isInjecting) return;
    
    setIsInjecting(true);
    try {
      const event: SCTE35Event = {
        id: eventId,
        type: type,
        duration: type === 'preroll' ? prerollDuration : adDuration,
        timestamp: Date.now(),
        status: 'pending',
        pid: scteDataPid
      };

      // Add to local events list
      setEvents(prev => [...prev, event]);

      // Use real OME API for SCTE-35 injection
      if (type === 'cue-out' || type === 'preroll') {
        await omeApi.sendSCTE35CueOut(vhost, app, stream, eventId, (type === 'preroll' ? prerollDuration : adDuration) * 1000);
      } else if (type === 'cue-in') {
        await omeApi.sendSCTE35CueIn(vhost, app, stream, eventId);
      }

      // Update event status to active
      setEvents(prev => prev.map(e => 
        e.id === event.id ? { ...e, status: 'active' } : e
      ));
      
      // Mark as completed after duration (for cue-out/preroll events)
      if (type === 'cue-out' || type === 'preroll') {
        setTimeout(() => {
          setEvents(prev => prev.map(e => 
            e.id === event.id ? { ...e, status: 'completed' } : e
          ));
          
          // Schedule next event if enabled
          if (enabled) {
            setTimeout(() => {
              injectSCTE35Event();
            }, 1000); // 1 second delay between events
          }
        }, duration * 1000);
      } else {
        // CUE-IN events are immediately completed
        setTimeout(() => {
          setEvents(prev => prev.map(e => 
            e.id === event.id ? { ...e, status: 'completed' } : e
          ));
        }, 100);
      }

      message.success(`SCTE-35 event ${eventId} injected successfully`);
    } catch (error) {
      console.error('Error injecting SCTE-35 event:', error);
      message.error('Failed to inject SCTE-35 event');
      setEvents(prev => prev.map(e => 
        e.id === eventId ? { ...e, status: 'failed' } : e
      ));
    } finally {
      setIsInjecting(false);
    }
  };

  const handleManualInject = async () => {
    await injectSCTE35Event('preroll');
  };

  const handleCueOut = async () => {
    await injectSCTE35Event('cue-out');
  };

  const handleCueIn = async () => {
    await injectSCTE35Event('cue-in');
  };

  const handleCrashOut = async () => {
    // Send immediate CUE-IN to get back to program
    await injectSCTE35Event('cue-in');
    message.warning('Crash out executed - returning to program immediately');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'blue';
      case 'active': return 'green';
      case 'completed': return 'default';
      case 'failed': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockCircleOutlined />;
      case 'active': return <PlayCircleOutlined />;
      case 'completed': return <CheckCircleOutlined />;
      case 'failed': return <WarningOutlined />;
      default: return <InfoCircleOutlined />;
    }
  };

  const activeEvents = events.filter(e => e.status === 'active').length;
  const completedEvents = events.filter(e => e.status === 'completed').length;
  const failedEvents = events.filter(e => e.status === 'failed').length;

  return (
    <div>
      <Card 
        title={
          <Space>
            <SendOutlined />
            <span>SCTE-35 Pre-Roll Markers</span>
            <Tag color={enabled ? 'green' : 'default'}>
              {enabled ? 'Enabled' : 'Disabled'}
            </Tag>
          </Space>
        }
        extra={
          <Switch
            checked={enabled}
            onChange={handleToggleSCTE35}
            loading={isInjecting}
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
        }
      >
        <Alert
          message="SCTE-35 Distributor Configuration"
          description={
            <div>
              <p><strong>Event ID:</strong> Starting from {eventId} (increments sequentially)</p>
              <p><strong>Data PID:</strong> {scteDataPid} | <strong>Null PID:</strong> 8191</p>
              <p><strong>Ad Duration:</strong> {adDuration}s | <strong>Pre-roll:</strong> {prerollDuration}s (0-10s)</p>
              <p><strong>Events:</strong> CUE-OUT (Program out) → CUE-IN (Program in) with crash out support</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Form.Item label="Ad Duration (seconds)">
              <InputNumber
                value={adDuration}
                onChange={(value) => setAdDuration(value || 600)}
                min={1}
                max={3600}
                disabled={enabled}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Pre-roll Duration (seconds)">
              <InputNumber
                value={prerollDuration}
                onChange={(value) => setPrerollDuration(value || 0)}
                min={0}
                max={10}
                disabled={enabled}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Next Event ID">
              <InputNumber
                value={eventId}
                onChange={(value) => setEventId(value || 100023)}
                min={100000}
                disabled={enabled}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Data PID">
              <InputNumber
                value={scteDataPid}
                onChange={(value) => setScteDataPid(value || 500)}
                min={1}
                max={8191}
                disabled={enabled}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleManualInject}
              loading={isInjecting}
              disabled={!enabled}
              style={{ width: '100%' }}
            >
              Pre-roll Inject
            </Button>
          </Col>
          <Col span={6}>
            <Button
              type="primary"
              danger
              icon={<SendOutlined />}
              onClick={handleCueOut}
              loading={isInjecting}
              disabled={!enabled}
              style={{ width: '100%' }}
            >
              CUE-OUT (Ad Start)
            </Button>
          </Col>
          <Col span={6}>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleCueIn}
              loading={isInjecting}
              disabled={!enabled}
              style={{ width: '100%' }}
            >
              CUE-IN (Ad End)
            </Button>
          </Col>
          <Col span={6}>
            <Button
              type="default"
              danger
              icon={<WarningOutlined />}
              onClick={handleCrashOut}
              loading={isInjecting}
              disabled={!enabled}
              style={{ width: '100%' }}
            >
              Crash Out
            </Button>
          </Col>
        </Row>

        <Divider />

        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic
              title="Active Events"
              value={activeEvents}
              valueStyle={{ color: '#52c41a' }}
              prefix={<PlayCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Completed"
              value={completedEvents}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Failed"
              value={failedEvents}
              valueStyle={{ color: '#f5222d' }}
              prefix={<WarningOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Events"
              value={events.length}
              valueStyle={{ color: '#722ed1' }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
        </Row>

        {nextEventTime && (
          <Alert
            message={`Next SCTE-35 event scheduled for: ${new Date(nextEventTime).toLocaleTimeString()}`}
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        {events.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Title level={5}>Recent SCTE-35 Events</Title>
            <Timeline
              items={events.slice(-5).reverse().map(event => ({
                color: getStatusColor(event.status),
                children: (
                  <div>
                    <Space>
                      {getStatusIcon(event.status)}
                      <Text strong>Event #{event.id}</Text>
                      <Tag color={event.type === 'cue-out' ? 'red' : event.type === 'cue-in' ? 'green' : 'blue'}>
                        {event.type.toUpperCase()}
                      </Tag>
                      <Tag color={getStatusColor(event.status)}>
                        {event.status.toUpperCase()}
                      </Tag>
                    </Space>
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary">
                        Duration: {event.duration}s | 
                        PID: {event.pid} | 
                        Time: {new Date(event.timestamp).toLocaleTimeString()}
                      </Text>
                    </div>
                  </div>
                )
              }))}
            />
          </div>
        )}
      </Card>
    </div>
  );
};
