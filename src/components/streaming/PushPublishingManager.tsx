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
  InputNumber,
  Typography,
  Tabs,
  List,
  Avatar,
  Descriptions
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CloudUploadOutlined,
  LinkOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  VideoCameraOutlined,
  SoundOutlined,
  WifiOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import { OMEApiService } from '../../services/omeApi';
import { useStore } from '../../store/useStore';

const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface PushDestination {
  id: string;
  name: string;
  url: string;
  protocol: 'rtmp' | 'srt' | 'webrtc' | 'llhls';
  status: 'active' | 'inactive' | 'error' | 'connecting';
  streamName: string;
  quality: 'high' | 'medium' | 'low' | 'adaptive';
  bitrate: number;
  resolution: string;
  framerate: number;
  key?: string;
  enabled: boolean;
  createdAt: string;
  lastConnected?: string;
  connectionCount: number;
  totalBytes: number;
  errorMessage?: string;
}

interface PushSession {
  id: string;
  destinationId: string;
  destinationName: string;
  streamName: string;
  status: 'pushing' | 'stopped' | 'error' | 'paused';
  startTime: string;
  endTime?: string;
  duration: string;
  bytesPushed: number;
  bitrate: number;
  quality: string;
  errorMessage?: string;
}

const PushPublishingManager: React.FC = () => {
  const [destinations, setDestinations] = useState<PushDestination[]>([]);
  const [sessions, setSessions] = useState<PushSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [destinationModalVisible, setDestinationModalVisible] = useState(false);
  const [editingDestination, setEditingDestination] = useState<PushDestination | null>(null);
  const [destinationForm] = Form.useForm();
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  useEffect(() => {
    loadDestinations();
    loadSessions();
    const interval = setInterval(() => {
      loadDestinations();
      loadSessions();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDestinations = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual OME API calls when available
      const mockDestinations: PushDestination[] = [
        {
          id: '1',
          name: 'YouTube Live',
          url: 'rtmp://a.rtmp.youtube.com/live2',
          protocol: 'rtmp',
          status: 'active',
          streamName: 'live',
          quality: 'high',
          bitrate: 2500,
          resolution: '1920x1080',
          framerate: 30,
          key: 'youtube_stream_key',
          enabled: true,
          createdAt: '2024-01-15T10:00:00Z',
          lastConnected: '2024-01-15T14:30:00Z',
          connectionCount: 15,
          totalBytes: 1024000000
        },
        {
          id: '2',
          name: 'Facebook Live',
          url: 'rtmp://live-api-s.facebook.com:80/rtmp',
          protocol: 'rtmp',
          status: 'inactive',
          streamName: 'live',
          quality: 'medium',
          bitrate: 1500,
          resolution: '1280x720',
          framerate: 30,
          key: 'facebook_stream_key',
          enabled: false,
          createdAt: '2024-01-10T09:00:00Z',
          connectionCount: 8,
          totalBytes: 512000000
        },
        {
          id: '3',
          name: 'Twitch Stream',
          url: 'rtmp://live.twitch.tv/live',
          protocol: 'rtmp',
          status: 'error',
          streamName: 'live',
          quality: 'high',
          bitrate: 3000,
          resolution: '1920x1080',
          framerate: 60,
          key: 'twitch_stream_key',
          enabled: true,
          createdAt: '2024-01-12T11:00:00Z',
          lastConnected: '2024-01-12T16:45:00Z',
          connectionCount: 3,
          totalBytes: 256000000,
          errorMessage: 'Connection timeout'
        },
        {
          id: '4',
          name: 'CDN Relay',
          url: 'srt://cdn.example.com:9999',
          protocol: 'srt',
          status: 'connecting',
          streamName: 'live',
          quality: 'adaptive',
          bitrate: 2000,
          resolution: '1920x1080',
          framerate: 30,
          enabled: true,
          createdAt: '2024-01-14T13:00:00Z',
          connectionCount: 0,
          totalBytes: 0
        }
      ];
      setDestinations(mockDestinations);
    } catch (error) {
      message.error('Failed to load push destinations');
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      // Mock data - replace with actual OME API calls when available
      const mockSessions: PushSession[] = [
        {
          id: '1',
          destinationId: '1',
          destinationName: 'YouTube Live',
          streamName: 'live',
          status: 'pushing',
          startTime: '2024-01-15T14:30:00Z',
          duration: '2h 15m',
          bytesPushed: 1024000000,
          bitrate: 2500,
          quality: '1920x1080@30fps'
        },
        {
          id: '2',
          destinationId: '3',
          destinationName: 'Twitch Stream',
          streamName: 'live',
          status: 'error',
          startTime: '2024-01-12T16:45:00Z',
          endTime: '2024-01-12T17:00:00Z',
          duration: '15m',
          bytesPushed: 256000000,
          bitrate: 3000,
          quality: '1920x1080@60fps',
          errorMessage: 'Connection lost'
        }
      ];
      setSessions(mockSessions);
    } catch (error) {
      message.error('Failed to load push sessions');
    }
  };

  const handleCreateDestination = async (values: any) => {
    try {
      const newDestination: PushDestination = {
        id: Date.now().toString(),
        name: values.name,
        url: values.url,
        protocol: values.protocol,
        status: 'inactive',
        streamName: values.streamName,
        quality: values.quality,
        bitrate: values.bitrate,
        resolution: values.resolution,
        framerate: values.framerate,
        key: values.key,
        enabled: values.enabled,
        createdAt: new Date().toISOString(),
        connectionCount: 0,
        totalBytes: 0
      };
      
      setDestinations(prev => [...prev, newDestination]);
      setDestinationModalVisible(false);
      destinationForm.resetFields();
      message.success('Push destination created successfully');
    } catch (error) {
      message.error('Failed to create push destination');
    }
  };

  const handleUpdateDestination = async (values: any) => {
    try {
      setDestinations(prev => prev.map(dest => 
        dest.id === editingDestination?.id 
          ? { ...dest, ...values }
          : dest
      ));
      setDestinationModalVisible(false);
      setEditingDestination(null);
      destinationForm.resetFields();
      message.success('Push destination updated successfully');
    } catch (error) {
      message.error('Failed to update push destination');
    }
  };

  const handleDeleteDestination = async (destinationId: string) => {
    try {
      setDestinations(prev => prev.filter(dest => dest.id !== destinationId));
      message.success('Push destination deleted successfully');
    } catch (error) {
      message.error('Failed to delete push destination');
    }
  };

  const handleToggleDestination = async (destinationId: string, enabled: boolean) => {
    try {
      setDestinations(prev => prev.map(dest => 
        dest.id === destinationId 
          ? { ...dest, enabled, status: enabled ? 'connecting' : 'inactive' }
          : dest
      ));
      message.success(`Push destination ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      message.error('Failed to toggle push destination');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'error': return 'error';
      case 'connecting': return 'processing';
      case 'pushing': return 'processing';
      case 'stopped': return 'default';
      case 'paused': return 'warning';
      default: return 'default';
    }
  };

  const getProtocolIcon = (protocol: string) => {
    switch (protocol) {
      case 'rtmp': return <CloudUploadOutlined />;
      case 'srt': return <WifiOutlined />;
      case 'webrtc': return <GlobalOutlined />;
      case 'llhls': return <ThunderboltOutlined />;
      default: return <LinkOutlined />;
    }
  };

  const destinationColumns = [
    {
      title: 'Destination',
      key: 'destination',
      render: (record: PushDestination) => (
        <Space>
          <Avatar icon={getProtocolIcon(record.protocol)} />
          <div>
            <div><strong>{record.name}</strong></div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.url}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Protocol',
      dataIndex: 'protocol',
      key: 'protocol',
      render: (protocol: string) => (
        <Tag color="blue" icon={getProtocolIcon(protocol)}>
          {protocol.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: PushDestination) => (
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
      title: 'Stream',
      dataIndex: 'streamName',
      key: 'streamName',
      render: (streamName: string) => (
        <Space>
          <VideoCameraOutlined />
          {streamName}
        </Space>
      )
    },
    {
      title: 'Quality',
      key: 'quality',
      render: (record: PushDestination) => (
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
      render: (record: PushDestination) => (
        <Space direction="vertical" size="small">
          <Text>Connections: {record.connectionCount}</Text>
          <Text>Data: {(record.totalBytes / (1024 * 1024)).toFixed(1)} MB</Text>
          {record.lastConnected && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Last: {new Date(record.lastConnected).toLocaleString()}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: PushDestination) => (
        <Space>
          <Tooltip title={record.enabled ? "Disable" : "Enable"}>
            <Switch
              checked={record.enabled}
              onChange={(checked) => handleToggleDestination(record.id, checked)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => {
                setEditingDestination(record);
                destinationForm.setFieldsValue(record);
                setDestinationModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
              onClick={() => handleDeleteDestination(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const sessionColumns = [
    {
      title: 'Session',
      key: 'session',
      render: (record: PushSession) => (
        <Space>
          <Avatar icon={<CloudUploadOutlined />} />
          <div>
            <div><strong>{record.destinationName}</strong></div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.streamName}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: PushSession) => (
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
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: string) => (
        <Space>
          <ClockCircleOutlined />
          {duration}
        </Space>
      )
    },
    {
      title: 'Quality',
      dataIndex: 'quality',
      key: 'quality',
      render: (quality: string) => (
        <Space>
          <VideoCameraOutlined />
          {quality}
        </Space>
      )
    },
    {
      title: 'Data Pushed',
      dataIndex: 'bytesPushed',
      key: 'bytesPushed',
      render: (bytes: number) => (
        <Space>
          <DatabaseOutlined />
          {(bytes / (1024 * 1024)).toFixed(1)} MB
        </Space>
      )
    },
    {
      title: 'Bitrate',
      dataIndex: 'bitrate',
      key: 'bitrate',
      render: (bitrate: number) => (
        <Space>
          <ThunderboltOutlined />
          {bitrate} kbps
        </Space>
      )
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => new Date(time).toLocaleString()
    }
  ];

  const activeDestinations = destinations.filter(d => d.status === 'active').length;
  const totalDestinations = destinations.length;
  const activeSessions = sessions.filter(s => s.status === 'pushing').length;
  const totalDataPushed = sessions.reduce((sum, s) => sum + s.bytesPushed, 0);

  return (
    <div>
      {/* Push Publishing Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Destinations"
              value={activeDestinations}
              prefix={<CloudUploadOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Destinations"
              value={totalDestinations}
              prefix={<LinkOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Sessions"
              value={activeSessions}
              prefix={<PlayCircleOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Data Pushed"
              value={(totalDataPushed / (1024 * 1024)).toFixed(1)}
              suffix="MB"
              prefix={<DatabaseOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Push Publishing Info Alert */}
      <Alert
        message="Push Publishing Management"
        description="Configure and manage external streaming destinations including YouTube Live, Facebook Live, Twitch, and custom CDN endpoints. Supports RTMP, SRT, WebRTC, and LLHLS protocols."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Tabs defaultActiveKey="destinations">
        <TabPane tab="Destinations" key="destinations">
          {/* Quick Actions */}
          <Card title="Quick Actions" style={{ marginBottom: 24 }}>
            <Space wrap>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setDestinationModalVisible(true)}
              >
                Add Destination
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={loadDestinations}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Card>

          {/* Destinations Table */}
          <Card
            title="Push Destinations"
            extra={
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={loadDestinations}
                  loading={loading}
                >
                  Refresh
                </Button>
              </Space>
            }
          >
            <Table
              columns={destinationColumns}
              dataSource={destinations}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Active Sessions" key="sessions">
          {/* Sessions Table */}
          <Card
            title="Push Sessions"
            extra={
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadSessions}
                loading={loading}
              >
                Refresh
              </Button>
            }
          >
            <Table
              columns={sessionColumns}
              dataSource={sessions}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Add/Edit Destination Modal */}
      <Modal
        title={editingDestination ? "Edit Push Destination" : "Add Push Destination"}
        open={destinationModalVisible}
        onCancel={() => {
          setDestinationModalVisible(false);
          setEditingDestination(null);
          destinationForm.resetFields();
        }}
        onOk={() => {
          destinationForm.validateFields().then(values => {
            if (editingDestination) {
              handleUpdateDestination(values);
            } else {
              handleCreateDestination(values);
            }
          });
        }}
        width={600}
      >
        <Form form={destinationForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Destination Name"
                rules={[{ required: true, message: 'Please enter destination name' }]}
              >
                <Input placeholder="e.g., YouTube Live" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="protocol"
                label="Protocol"
                rules={[{ required: true, message: 'Please select protocol' }]}
                initialValue="rtmp"
              >
                <Select>
                  <Option value="rtmp">RTMP</Option>
                  <Option value="srt">SRT</Option>
                  <Option value="webrtc">WebRTC</Option>
                  <Option value="llhls">LLHLS</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="url"
            label="Destination URL"
            rules={[{ required: true, message: 'Please enter destination URL' }]}
          >
            <Input placeholder="e.g., rtmp://a.rtmp.youtube.com/live2" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="streamName"
                label="Stream Name"
                rules={[{ required: true, message: 'Please enter stream name' }]}
                initialValue="live"
              >
                <Input placeholder="live" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="key"
                label="Stream Key"
                tooltip="Optional stream key for authentication"
              >
                <Input placeholder="stream_key" />
              </Form.Item>
            </Col>
          </Row>

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
                name="enabled"
                label="Enabled"
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

export default PushPublishingManager;
