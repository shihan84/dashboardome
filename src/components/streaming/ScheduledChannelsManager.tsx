import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Row,
  Col,
  Statistic,
  Progress,
  Badge,
  Tooltip,
  Alert,
  Divider,
  DatePicker,
  TimePicker,
  InputNumber,
  Typography,
  Tabs,
  List,
  Avatar,
  Descriptions,
  Timeline,
  Calendar,
  Popover
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  VideoCameraOutlined,
  SoundOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  SettingOutlined,
  HistoryOutlined,
  CloudServerOutlined,
  FileOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  GlobalOutlined,
  LinkOutlined,
  UploadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { OMEApiService } from '../../services/omeApi';
import { useStore } from '../../store/useStore';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface ScheduledChannel {
  id: string;
  name: string;
  description: string;
  channelType: 'live' | 'vod' | 'playlist' | 'event';
  status: 'active' | 'inactive' | 'running' | 'paused' | 'error';
  scheduleType: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  timezone: string;
  days: string[];
  sourceType: 'file' | 'url' | 'stream' | 'playlist';
  sourcePath: string;
  outputFormat: 'hls' | 'dash' | 'rtmp' | 'srt' | 'webrtc';
  quality: 'high' | 'medium' | 'low' | 'adaptive';
  bitrate: number;
  resolution: string;
  framerate: number;
  enabled: boolean;
  autoStart: boolean;
  autoStop: boolean;
  repeatCount: number;
  currentRepeat: number;
  createdAt: string;
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  successCount: number;
  errorCount: number;
  errorMessage?: string;
}

interface ScheduleEvent {
  id: string;
  channelId: string;
  channelName: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  duration: number;
  sourcePath: string;
  outputPath?: string;
  errorMessage?: string;
  createdAt: string;
}

const ScheduledChannelsManager: React.FC = () => {
  const [channels, setChannels] = useState<ScheduledChannel[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [channelModalVisible, setChannelModalVisible] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ScheduledChannel | null>(null);
  const [channelForm] = Form.useForm();
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  useEffect(() => {
    loadChannels();
    loadEvents();
    const interval = setInterval(() => {
      loadChannels();
      loadEvents();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadChannels = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual OME API calls when available
      const mockChannels: ScheduledChannel[] = [
        {
          id: '1',
          name: 'Morning News',
          description: 'Daily morning news broadcast',
          channelType: 'live',
          status: 'active',
          scheduleType: 'daily',
          startTime: '09:00',
          endTime: '10:00',
          duration: 60,
          timezone: 'UTC',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          sourceType: 'stream',
          sourcePath: 'rtmp://source.example.com/live/news',
          outputFormat: 'hls',
          quality: 'high',
          bitrate: 2500,
          resolution: '1920x1080',
          framerate: 30,
          enabled: true,
          autoStart: true,
          autoStop: true,
          repeatCount: 0,
          currentRepeat: 0,
          createdAt: '2024-01-15T10:00:00Z',
          lastRun: '2024-01-15T09:00:00Z',
          nextRun: '2024-01-16T09:00:00Z',
          runCount: 15,
          successCount: 14,
          errorCount: 1
        },
        {
          id: '2',
          name: 'Weekly Documentary',
          description: 'Weekly documentary series',
          channelType: 'vod',
          status: 'inactive',
          scheduleType: 'weekly',
          startTime: '20:00',
          endTime: '21:30',
          duration: 90,
          timezone: 'UTC',
          days: ['Sunday'],
          sourceType: 'file',
          sourcePath: '/media/documentaries/weekly_doc.mp4',
          outputFormat: 'hls',
          quality: 'medium',
          bitrate: 1500,
          resolution: '1280x720',
          framerate: 24,
          enabled: false,
          autoStart: true,
          autoStop: true,
          repeatCount: 0,
          currentRepeat: 0,
          createdAt: '2024-01-10T09:00:00Z',
          lastRun: '2024-01-14T20:00:00Z',
          nextRun: '2024-01-21T20:00:00Z',
          runCount: 4,
          successCount: 4,
          errorCount: 0
        },
        {
          id: '3',
          name: 'Music Playlist',
          description: 'Continuous music playlist',
          channelType: 'playlist',
          status: 'running',
          scheduleType: 'daily',
          startTime: '00:00',
          endTime: '23:59',
          duration: 1440,
          timezone: 'UTC',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          sourceType: 'playlist',
          sourcePath: '/media/playlists/music_playlist.m3u8',
          outputFormat: 'hls',
          quality: 'medium',
          bitrate: 128,
          resolution: '640x360',
          framerate: 30,
          enabled: true,
          autoStart: true,
          autoStop: false,
          repeatCount: -1,
          currentRepeat: 1,
          createdAt: '2024-01-01T00:00:00Z',
          lastRun: '2024-01-15T00:00:00Z',
          nextRun: '2024-01-16T00:00:00Z',
          runCount: 15,
          successCount: 15,
          errorCount: 0
        },
        {
          id: '4',
          name: 'Special Event',
          description: 'One-time special event broadcast',
          channelType: 'event',
          status: 'error',
          scheduleType: 'once',
          startTime: '19:00',
          endTime: '22:00',
          duration: 180,
          timezone: 'UTC',
          days: [],
          sourceType: 'url',
          sourcePath: 'https://event.example.com/live/stream',
          outputFormat: 'rtmp',
          quality: 'high',
          bitrate: 3000,
          resolution: '1920x1080',
          framerate: 60,
          enabled: true,
          autoStart: true,
          autoStop: true,
          repeatCount: 1,
          currentRepeat: 1,
          createdAt: '2024-01-12T10:00:00Z',
          lastRun: '2024-01-12T19:00:00Z',
          runCount: 1,
          successCount: 0,
          errorCount: 1,
          errorMessage: 'Source stream unavailable'
        }
      ];
      setChannels(mockChannels);
    } catch (error) {
      message.error('Failed to load scheduled channels');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      // Mock data - replace with actual OME API calls when available
      const mockEvents: ScheduleEvent[] = [
        {
          id: '1',
          channelId: '1',
          channelName: 'Morning News',
          startTime: '2024-01-16T09:00:00Z',
          endTime: '2024-01-16T10:00:00Z',
          status: 'scheduled',
          duration: 60,
          sourcePath: 'rtmp://source.example.com/live/news',
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          channelId: '3',
          channelName: 'Music Playlist',
          startTime: '2024-01-15T00:00:00Z',
          endTime: '2024-01-15T23:59:00Z',
          status: 'running',
          duration: 1440,
          sourcePath: '/media/playlists/music_playlist.m3u8',
          outputPath: '/output/music_playlist_20240115.m3u8',
          createdAt: '2024-01-15T00:00:00Z'
        },
        {
          id: '3',
          channelId: '1',
          channelName: 'Morning News',
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T10:00:00Z',
          status: 'completed',
          duration: 60,
          sourcePath: 'rtmp://source.example.com/live/news',
          outputPath: '/output/morning_news_20240115.m3u8',
          createdAt: '2024-01-15T09:00:00Z'
        }
      ];
      setEvents(mockEvents);
    } catch (error) {
      message.error('Failed to load schedule events');
    }
  };

  const handleCreateChannel = async (values: any) => {
    try {
      const newChannel: ScheduledChannel = {
        id: Date.now().toString(),
        name: values.name,
        description: values.description,
        channelType: values.channelType,
        status: 'inactive',
        scheduleType: values.scheduleType,
        startTime: values.startTime,
        endTime: values.endTime,
        duration: values.duration,
        timezone: values.timezone || 'UTC',
        days: values.days || [],
        sourceType: values.sourceType,
        sourcePath: values.sourcePath,
        outputFormat: values.outputFormat,
        quality: values.quality,
        bitrate: values.bitrate,
        resolution: values.resolution,
        framerate: values.framerate,
        enabled: values.enabled,
        autoStart: values.autoStart,
        autoStop: values.autoStop,
        repeatCount: values.repeatCount || 0,
        currentRepeat: 0,
        createdAt: new Date().toISOString(),
        runCount: 0,
        successCount: 0,
        errorCount: 0
      };
      
      setChannels(prev => [...prev, newChannel]);
      setChannelModalVisible(false);
      channelForm.resetFields();
      message.success('Scheduled channel created successfully');
    } catch (error) {
      message.error('Failed to create scheduled channel');
    }
  };

  const handleUpdateChannel = async (values: any) => {
    try {
      setChannels(prev => prev.map(channel => 
        channel.id === editingChannel?.id 
          ? { ...channel, ...values }
          : channel
      ));
      setChannelModalVisible(false);
      setEditingChannel(null);
      channelForm.resetFields();
      message.success('Scheduled channel updated successfully');
    } catch (error) {
      message.error('Failed to update scheduled channel');
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    try {
      setChannels(prev => prev.filter(channel => channel.id !== channelId));
      message.success('Scheduled channel deleted successfully');
    } catch (error) {
      message.error('Failed to delete scheduled channel');
    }
  };

  const handleToggleChannel = async (channelId: string, enabled: boolean) => {
    try {
      setChannels(prev => prev.map(channel => 
        channel.id === channelId 
          ? { ...channel, enabled, status: enabled ? 'active' : 'inactive' }
          : channel
      ));
      message.success(`Scheduled channel ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      message.error('Failed to toggle scheduled channel');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'running': return 'processing';
      case 'paused': return 'warning';
      case 'error': return 'error';
      case 'scheduled': return 'default';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getChannelTypeIcon = (type: string) => {
    switch (type) {
      case 'live': return <VideoCameraOutlined />;
      case 'vod': return <FileOutlined />;
      case 'playlist': return <PlayCircleOutlined />;
      case 'event': return <CalendarOutlined />;
      default: return <CloudServerOutlined />;
    }
  };

  const channelColumns = [
    {
      title: 'Channel',
      key: 'channel',
      render: (record: ScheduledChannel) => (
        <Space>
          <Avatar icon={getChannelTypeIcon(record.channelType)} />
          <div>
            <div><strong>{record.name}</strong></div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Type',
      dataIndex: 'channelType',
      key: 'channelType',
      render: (type: string) => (
        <Tag color="blue" icon={getChannelTypeIcon(type)}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: ScheduledChannel) => (
        <Space direction="vertical" size="small">
          <Badge status={getStatusColor(status)} text={status.toUpperCase()} />
          {record.errorMessage && (
            <Text type="danger" style={{ fontSize: '11px' }}>
              {record.errorMessage}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Schedule',
      key: 'schedule',
      render: (record: ScheduledChannel) => (
        <Space direction="vertical" size="small">
          <Text>{record.scheduleType}</Text>
          <Text type="secondary">{record.startTime} - {record.endTime}</Text>
          {record.days.length > 0 && (
            <Text type="secondary">{record.days.join(', ')}</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Source',
      key: 'source',
      render: (record: ScheduledChannel) => (
        <Space direction="vertical" size="small">
          <Text>{record.sourceType}</Text>
          <Text type="secondary" style={{ fontSize: '11px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {record.sourcePath}
          </Text>
        </Space>
      )
    },
    {
      title: 'Quality',
      key: 'quality',
      render: (record: ScheduledChannel) => (
        <Space direction="vertical" size="small">
          <Text>{record.resolution}</Text>
          <Text type="secondary">{record.bitrate}kbps @ {record.framerate}fps</Text>
          <Tag color="green">{record.quality}</Tag>
        </Space>
      )
    },
    {
      title: 'Statistics',
      key: 'stats',
      render: (record: ScheduledChannel) => (
        <Space direction="vertical" size="small">
          <Text>Runs: {record.runCount}</Text>
          <Text>Success: {record.successCount}</Text>
          <Text>Errors: {record.errorCount}</Text>
          {record.nextRun && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Next: {new Date(record.nextRun).toLocaleString()}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: ScheduledChannel) => (
        <Space>
          <Tooltip title={record.enabled ? "Disable" : "Enable"}>
            <Switch
              checked={record.enabled}
              onChange={(checked) => handleToggleChannel(record.id, checked)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => {
                setEditingChannel(record);
                channelForm.setFieldsValue(record);
                setChannelModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
              onClick={() => handleDeleteChannel(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const eventColumns = [
    {
      title: 'Event',
      key: 'event',
      render: (record: ScheduleEvent) => (
        <Space>
          <Avatar icon={<CalendarOutlined />} />
          <div>
            <div><strong>{record.channelName}</strong></div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.duration} minutes
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: ScheduleEvent) => (
        <Space direction="vertical" size="small">
          <Badge status={getStatusColor(status)} text={status.toUpperCase()} />
          {record.errorMessage && (
            <Text type="danger" style={{ fontSize: '11px' }}>
              {record.errorMessage}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: 'Source',
      dataIndex: 'sourcePath',
      key: 'sourcePath',
      render: (path: string) => (
        <Text style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {path}
        </Text>
      )
    },
    {
      title: 'Output',
      dataIndex: 'outputPath',
      key: 'outputPath',
      render: (path: string) => path ? (
        <Text style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {path}
        </Text>
      ) : '-'
    }
  ];

  const activeChannels = channels.filter(c => c.status === 'active' || c.status === 'running').length;
  const totalChannels = channels.length;
  const scheduledEvents = events.filter(e => e.status === 'scheduled').length;
  const runningEvents = events.filter(e => e.status === 'running').length;

  return (
    <div>
      {/* Scheduled Channels Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Channels"
              value={activeChannels}
              prefix={<PlayCircleOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Channels"
              value={totalChannels}
              prefix={<CloudServerOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Scheduled Events"
              value={scheduledEvents}
              prefix={<CalendarOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Running Events"
              value={runningEvents}
              prefix={<ThunderboltOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Scheduled Channels Info Alert */}
      <Alert
        message="Scheduled Channels Management"
        description="Create and manage automated content delivery schedules for live streams, VOD content, playlists, and special events. Supports various schedule types and output formats."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Tabs defaultActiveKey="channels">
        <TabPane tab="Channels" key="channels">
          {/* Quick Actions */}
          <Card title="Quick Actions" style={{ marginBottom: 24 }}>
            <Space wrap>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setChannelModalVisible(true)}
              >
                Add Channel
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={loadChannels}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Card>

          {/* Channels Table */}
          <Card
            title="Scheduled Channels"
            extra={
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={loadChannels}
                  loading={loading}
                >
                  Refresh
                </Button>
              </Space>
            }
          >
            <Table
              columns={channelColumns}
              dataSource={channels}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Events" key="events">
          {/* Events Table */}
          <Card
            title="Schedule Events"
            extra={
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadEvents}
                loading={loading}
              >
                Refresh
              </Button>
            }
          >
            <Table
              columns={eventColumns}
              dataSource={events}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Add/Edit Channel Modal */}
      <Modal
        title={editingChannel ? "Edit Scheduled Channel" : "Add Scheduled Channel"}
        open={channelModalVisible}
        onCancel={() => {
          setChannelModalVisible(false);
          setEditingChannel(null);
          channelForm.resetFields();
        }}
        onOk={() => {
          channelForm.validateFields().then(values => {
            if (editingChannel) {
              handleUpdateChannel(values);
            } else {
              handleCreateChannel(values);
            }
          });
        }}
        width={800}
      >
        <Form form={channelForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Channel Name"
                rules={[{ required: true, message: 'Please enter channel name' }]}
              >
                <Input placeholder="e.g., Morning News" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="channelType"
                label="Channel Type"
                rules={[{ required: true, message: 'Please select channel type' }]}
                initialValue="live"
              >
                <Select>
                  <Option value="live">Live Stream</Option>
                  <Option value="vod">Video on Demand</Option>
                  <Option value="playlist">Playlist</Option>
                  <Option value="event">Special Event</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Channel description" rows={2} />
          </Form.Item>

          <Divider>Schedule Settings</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="scheduleType"
                label="Schedule Type"
                rules={[{ required: true, message: 'Please select schedule type' }]}
                initialValue="daily"
              >
                <Select>
                  <Option value="once">Once</Option>
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                  <Option value="monthly">Monthly</Option>
                  <Option value="custom">Custom</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="startTime"
                label="Start Time"
                rules={[{ required: true, message: 'Please select start time' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="endTime"
                label="End Time"
                rules={[{ required: true, message: 'Please select end time' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="timezone"
                label="Timezone"
                initialValue="UTC"
              >
                <Select>
                  <Option value="UTC">UTC</Option>
                  <Option value="EST">Eastern Time</Option>
                  <Option value="PST">Pacific Time</Option>
                  <Option value="GMT">Greenwich Mean Time</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="enabled"
                label="Enabled"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Source Settings</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sourceType"
                label="Source Type"
                rules={[{ required: true, message: 'Please select source type' }]}
                initialValue="file"
              >
                <Select>
                  <Option value="file">File</Option>
                  <Option value="url">URL</Option>
                  <Option value="stream">Stream</Option>
                  <Option value="playlist">Playlist</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="outputFormat"
                label="Output Format"
                initialValue="hls"
              >
                <Select>
                  <Option value="hls">HLS</Option>
                  <Option value="dash">DASH</Option>
                  <Option value="rtmp">RTMP</Option>
                  <Option value="srt">SRT</Option>
                  <Option value="webrtc">WebRTC</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="sourcePath"
            label="Source Path"
            rules={[{ required: true, message: 'Please enter source path' }]}
          >
            <Input placeholder="e.g., /media/videos/news.mp4 or rtmp://source.example.com/live" />
          </Form.Item>

          <Divider>Quality Settings</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="quality"
                label="Quality"
                initialValue="high"
              >
                <Select>
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                  <Option value="adaptive">Adaptive</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="resolution"
                label="Resolution"
                initialValue="1920x1080"
              >
                <Select>
                  <Option value="1920x1080">1920x1080 (1080p)</Option>
                  <Option value="1280x720">1280x720 (720p)</Option>
                  <Option value="854x480">854x480 (480p)</Option>
                  <Option value="640x360">640x360 (360p)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="framerate"
                label="Frame Rate"
                initialValue={30}
              >
                <Select>
                  <Option value={24}>24 fps</Option>
                  <Option value={30}>30 fps</Option>
                  <Option value={60}>60 fps</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="bitrate"
                label="Bitrate (kbps)"
                initialValue={2500}
              >
                <InputNumber min={500} max={10000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="repeatCount"
                label="Repeat Count"
                tooltip="0 = infinite, 1+ = specific number of times"
                initialValue={0}
              >
                <InputNumber min={0} max={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Advanced Settings</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="autoStart"
                label="Auto Start"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="autoStop"
                label="Auto Stop"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduledChannelsManager;
