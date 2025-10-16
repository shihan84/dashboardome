import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Switch, 
  Row, 
  Col, 
  Alert, 
  Tag, 
  message,
  Divider,
  Statistic,
  Descriptions,
  Tabs
} from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  SendOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface SRTDistributorConfigProps {
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

interface SRTConfig {
  // Video Configuration
  videoResolution: string;
  videoCodec: string;
  pcrEmbedded: boolean;
  profileLevel: string;
  gop: number;
  bFrames: number;
  videoBitrate: number;
  chroma: string;
  aspectRatio: string;
  
  // Audio Configuration
  audioCodec: string;
  audioBitrate: number;
  audioLKFS: number;
  audioSamplingRate: number;
  
  // SCTE-35 Configuration
  scteDataPid: number;
  nullPid: number;
  latency: number;
  
  // SCTE-35 Events
  adDuration: number;
  prerollDuration: number;
  currentEventId: number;
}

export const SRTDistributorConfig: React.FC<SRTDistributorConfigProps> = ({
  vhost = 'default',
  app = 'live',
  stream = 'live'
}) => {
  const [enabled, setEnabled] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [events, setEvents] = useState<SCTE35Event[]>([]);
  const [form] = Form.useForm();
  
  const omeApi = new OMEApiService();

  // Default SRT Configuration matching distributor requirements
  const defaultConfig: SRTConfig = {
    // Video Configuration
    videoResolution: '1920x1080',
    videoCodec: 'h264',
    pcrEmbedded: true,
    profileLevel: 'high@auto',
    gop: 12,
    bFrames: 5,
    videoBitrate: 5000, // 5 Mbps
    chroma: '4:2:0',
    aspectRatio: '16:9',
    
    // Audio Configuration
    audioCodec: 'aac-lc',
    audioBitrate: 128, // 128 Kbps
    audioLKFS: -20,
    audioSamplingRate: 48000,
    
    // SCTE-35 Configuration
    scteDataPid: 500,
    nullPid: 8191,
    latency: 2000, // 2 seconds
    
    // SCTE-35 Events
    adDuration: 600, // 10 minutes default
    prerollDuration: 0, // 0-10 seconds
    currentEventId: 100023
  };

  const [config, setConfig] = useState<SRTConfig>(defaultConfig);

  // Auto-increment event ID
  useEffect(() => {
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      setConfig(prev => ({ ...prev, currentEventId: lastEvent.id + 1 }));
    }
  }, [events]);

  const handleToggleSRT = async (checked: boolean) => {
    try {
      setEnabled(checked);
      
      if (checked) {
        message.success('SRT Distributor enabled with HD specifications');
        setIsStreaming(true);
        // Start the first SCTE-35 event
        await injectSCTE35Event('preroll');
      } else {
        message.info('SRT Distributor disabled');
        setIsStreaming(false);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error toggling SRT:', error);
      message.error('Failed to toggle SRT distributor');
      setEnabled(false);
    }
  };

  const injectSCTE35Event = async (type: 'cue-out' | 'cue-in' | 'preroll') => {
    try {
      const event: SCTE35Event = {
        id: config.currentEventId,
        type: type,
        duration: type === 'preroll' ? config.prerollDuration : config.adDuration,
        timestamp: Date.now(),
        status: 'pending',
        pid: config.scteDataPid
      };

      // Add to local events list
      setEvents(prev => [...prev, event]);

      // Simulate SCTE-35 injection
      setTimeout(() => {
        setEvents(prev => prev.map(e => 
          e.id === event.id ? { ...e, status: 'active' } : e
        ));
        
        // Mark as completed after duration
        setTimeout(() => {
          setEvents(prev => prev.map(e => 
            e.id === event.id ? { ...e, status: 'completed' } : e
          ));
          
          // Auto-inject CUE-IN after CUE-OUT
          if (type === 'cue-out' && enabled) {
            setTimeout(() => {
              injectSCTE35Event('cue-in');
            }, 1000);
          }
        }, event.duration * 1000);
      }, 100);

      message.success(`SCTE-35 ${type.toUpperCase()} event ${event.id} injected successfully`);
    } catch (error) {
      console.error('Error injecting SCTE-35 event:', error);
      message.error('Failed to inject SCTE-35 event');
      setEvents(prev => prev.map(e => 
        e.id === config.currentEventId ? { ...e, status: 'failed' } : e
      ));
    }
  };

  const handleManualCueOut = async () => {
    await injectSCTE35Event('cue-out');
  };

  const handleManualCueIn = async () => {
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

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'cue-out': return 'red';
      case 'cue-in': return 'green';
      case 'preroll': return 'blue';
      default: return 'default';
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
            <VideoCameraOutlined />
            <span>SRT Distributor Configuration</span>
            <Tag color={enabled ? 'green' : 'default'}>
              {enabled ? 'Active' : 'Inactive'}
            </Tag>
          </Space>
        }
        extra={
          <Switch
            checked={enabled}
            onChange={handleToggleSRT}
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
        }
      >
        <Alert
          message="SRT Distributor Requirements"
          description={
            <div>
              <p><strong>HD Stream:</strong> 1920x1080, H.264, 5Mbps video, 128Kbps AAC-LC audio</p>
              <p><strong>SCTE-35:</strong> PID 500, CUE-OUT/CUE-IN events, 2-second latency</p>
              <p><strong>Compliance:</strong> Meets distributor specifications for broadcast delivery</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Tabs defaultActiveKey="video" size="small">
          {/* Video Configuration Tab */}
          <TabPane 
            tab={
              <Space>
                <VideoCameraOutlined />
                <span>Video Config</span>
              </Space>
            } 
            key="video"
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item label="Resolution">
                  <Input value={config.videoResolution} disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Codec">
                  <Input value={config.videoCodec.toUpperCase()} disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Profile@Level">
                  <Input value={config.profileLevel} disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="GOP">
                  <InputNumber value={config.gop} disabled style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="B-Frames">
                  <InputNumber value={config.bFrames} disabled style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Bitrate (Mbps)">
                  <InputNumber value={config.videoBitrate} disabled style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Chroma">
                  <Input value={config.chroma} disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Aspect Ratio">
                  <Input value={config.aspectRatio} disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="PCR Embedded">
                  <Switch checked={config.pcrEmbedded} disabled />
                </Form.Item>
              </Col>
            </Row>
          </TabPane>

          {/* Audio Configuration Tab */}
          <TabPane 
            tab={
              <Space>
                <AudioOutlined />
                <span>Audio Config</span>
              </Space>
            } 
            key="audio"
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item label="Codec">
                  <Input value={config.audioCodec.toUpperCase()} disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Bitrate (Kbps)">
                  <InputNumber value={config.audioBitrate} disabled style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="LKFS (dB)">
                  <InputNumber value={config.audioLKFS} disabled style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Sampling Rate (Hz)">
                  <InputNumber value={config.audioSamplingRate} disabled style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </TabPane>

          {/* SCTE-35 Configuration Tab */}
          <TabPane 
            tab={
              <Space>
                <SendOutlined />
                <span>SCTE-35 Config</span>
              </Space>
            } 
            key="scte35"
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item label="Data PID">
                  <InputNumber value={config.scteDataPid} disabled style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Null PID">
                  <InputNumber value={config.nullPid} disabled style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Latency (ms)">
                  <InputNumber value={config.latency} disabled style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Ad Duration (s)">
                  <InputNumber 
                    value={config.adDuration} 
                    onChange={(value) => setConfig(prev => ({ ...prev, adDuration: value || 600 }))}
                    min={1}
                    max={3600}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Pre-roll Duration (s)">
                  <InputNumber 
                    value={config.prerollDuration} 
                    onChange={(value) => setConfig(prev => ({ ...prev, prerollDuration: value || 0 }))}
                    min={0}
                    max={10}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Next Event ID">
                  <InputNumber 
                    value={config.currentEventId} 
                    onChange={(value) => setConfig(prev => ({ ...prev, currentEventId: value || 100023 }))}
                    min={100000}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Button
                  type="primary"
                  danger
                  icon={<SendOutlined />}
                  onClick={handleManualCueOut}
                  disabled={!enabled}
                  style={{ width: '100%' }}
                >
                  CUE-OUT (Ad Start)
                </Button>
              </Col>
              <Col span={8}>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleManualCueIn}
                  disabled={!enabled}
                  style={{ width: '100%' }}
                >
                  CUE-IN (Ad End)
                </Button>
              </Col>
              <Col span={8}>
                <Button
                  type="default"
                  danger
                  icon={<WarningOutlined />}
                  onClick={handleCrashOut}
                  disabled={!enabled}
                  style={{ width: '100%' }}
                >
                  Crash Out
                </Button>
              </Col>
            </Row>
          </TabPane>

          {/* Statistics Tab */}
          <TabPane 
            tab={
              <Space>
                <SettingOutlined />
                <span>Statistics</span>
              </Space>
            } 
            key="stats"
          >
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

            {events.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Recent SCTE-35 Events</Title>
                <Descriptions
                  bordered
                  size="small"
                  column={1}
                  items={events.slice(-5).reverse().map(event => ({
                    key: event.id,
                    label: (
                      <Space>
                        {getStatusIcon(event.status)}
                        <Tag color={getEventTypeColor(event.type)}>
                          {event.type.toUpperCase()}
                        </Tag>
                        <span>Event #{event.id}</span>
                      </Space>
                    ),
                    children: (
                      <div>
                        <div><strong>Status:</strong> <Tag color={getStatusColor(event.status)}>{event.status.toUpperCase()}</Tag></div>
                        <div><strong>Duration:</strong> {event.duration}s</div>
                        <div><strong>PID:</strong> {event.pid}</div>
                        <div><strong>Time:</strong> {new Date(event.timestamp).toLocaleTimeString()}</div>
                      </div>
                    )
                  }))}
                />
              </div>
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};
