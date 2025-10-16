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
  Divider
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  EyeOutlined,
  WifiOutlined,
  ThunderboltOutlined,
  SoundOutlined,
  VideoCameraOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { OMEApiService } from '../../services/omeApi';
import { useStore } from '../../store/useStore';

const { Option } = Select;

interface WebRTCStream {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'connecting' | 'error';
  viewers: number;
  bitrate: number;
  resolution: string;
  framerate: number;
  codec: string;
  latency: number;
  iceCandidates: number;
  connectionType: 'direct' | 'relay' | 'turn';
  lastActivity: string;
  quality: 'high' | 'medium' | 'low';
}

const WebRTCStreamManager: React.FC = () => {
  const [streams, setStreams] = useState<WebRTCStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStream, setEditingStream] = useState<WebRTCStream | null>(null);
  const [form] = Form.useForm();
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  // WebRTC Configuration Options
  const codecOptions = [
    { value: 'VP8', label: 'VP8 (Compatible)' },
    { value: 'VP9', label: 'VP9 (Efficient)' },
    { value: 'H264', label: 'H.264 (Hardware)' },
    { value: 'AV1', label: 'AV1 (Next-gen)' }
  ];

  const resolutionOptions = [
    { value: '1920x1080', label: '1080p (1920x1080)' },
    { value: '1280x720', label: '720p (1280x720)' },
    { value: '854x480', label: '480p (854x480)' },
    { value: '640x360', label: '360p (640x360)' }
  ];

  const framerateOptions = [
    { value: 30, label: '30 FPS' },
    { value: 60, label: '60 FPS' },
    { value: 24, label: '24 FPS' },
    { value: 15, label: '15 FPS' }
  ];

  useEffect(() => {
    loadWebRTCStreams();
    const interval = setInterval(loadWebRTCStreams, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadWebRTCStreams = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual OME API calls
      const mockStreams: WebRTCStream[] = [
        {
          id: '1',
          name: 'live_webrtc',
          status: 'active',
          viewers: 15,
          bitrate: 2000,
          resolution: '1920x1080',
          framerate: 30,
          codec: 'VP8',
          latency: 120,
          iceCandidates: 4,
          connectionType: 'direct',
          lastActivity: '2 minutes ago',
          quality: 'high'
        },
        {
          id: '2',
          name: 'shreenews_webrtc',
          status: 'connecting',
          viewers: 0,
          bitrate: 1500,
          resolution: '1280x720',
          framerate: 30,
          codec: 'H264',
          latency: 0,
          iceCandidates: 2,
          connectionType: 'relay',
          lastActivity: 'Just now',
          quality: 'medium'
        }
      ];
      setStreams(mockStreams);
    } catch (error) {
      message.error('Failed to load WebRTC streams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStream = () => {
    setEditingStream(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditStream = (stream: WebRTCStream) => {
    setEditingStream(stream);
    form.setFieldsValue(stream);
    setModalVisible(true);
  };

  const handleSaveStream = async (values: any) => {
    try {
      if (editingStream) {
        // Update existing stream
        setStreams(prev => prev.map(stream => 
          stream.id === editingStream.id ? { ...stream, ...values } : stream
        ));
        message.success('WebRTC stream updated successfully!');
      } else {
        // Create new stream
        const newStream: WebRTCStream = {
          id: Date.now().toString(),
          ...values,
          status: 'inactive',
          viewers: 0,
          latency: 0,
          iceCandidates: 0,
          lastActivity: 'Never'
        };
        setStreams(prev => [...prev, newStream]);
        message.success('WebRTC stream created successfully!');
      }
      setModalVisible(false);
    } catch (error) {
      message.error('Failed to save WebRTC stream');
    }
  };

  const handleStartStream = async (streamId: string) => {
    try {
      setStreams(prev => prev.map(stream => 
        stream.id === streamId ? { ...stream, status: 'connecting' } : stream
      ));
      
      // Simulate WebRTC connection
      setTimeout(() => {
        setStreams(prev => prev.map(stream => 
          stream.id === streamId ? { 
            ...stream, 
            status: 'active',
            viewers: Math.floor(Math.random() * 20) + 1,
            latency: Math.floor(Math.random() * 200) + 50
          } : stream
        ));
        message.success('WebRTC stream started successfully!');
      }, 2000);
    } catch (error) {
      message.error('Failed to start WebRTC stream');
    }
  };

  const handleStopStream = async (streamId: string) => {
    try {
      setStreams(prev => prev.map(stream => 
        stream.id === streamId ? { 
          ...stream, 
          status: 'inactive',
          viewers: 0,
          latency: 0
        } : stream
      ));
      message.success('WebRTC stream stopped successfully!');
    } catch (error) {
      message.error('Failed to stop WebRTC stream');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'connecting': return 'processing';
      case 'inactive': return 'default';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'green';
      case 'medium': return 'orange';
      case 'low': return 'red';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Stream Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: WebRTCStream) => (
        <Space>
          <VideoCameraOutlined />
          <strong>{text}</strong>
          <Tag color={getQualityColor(record.quality)}>{record.quality}</Tag>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={getStatusColor(status)} text={status.toUpperCase()} />
      )
    },
    {
      title: 'Viewers',
      dataIndex: 'viewers',
      key: 'viewers',
      render: (viewers: number) => (
        <Space>
          <EyeOutlined />
          {viewers}
        </Space>
      )
    },
    {
      title: 'Quality',
      key: 'quality',
      render: (record: WebRTCStream) => (
        <Space direction="vertical" size="small">
          <Text>{record.resolution}</Text>
          <Text type="secondary">{record.bitrate}kbps @ {record.framerate}fps</Text>
        </Space>
      )
    },
    {
      title: 'Latency',
      dataIndex: 'latency',
      key: 'latency',
      render: (latency: number) => (
        <Space>
          <ThunderboltOutlined />
          {latency}ms
        </Space>
      )
    },
    {
      title: 'Codec',
      dataIndex: 'codec',
      key: 'codec',
      render: (codec: string) => <Tag color="blue">{codec}</Tag>
    },
    {
      title: 'Connection',
      key: 'connection',
      render: (record: WebRTCStream) => (
        <Space direction="vertical" size="small">
          <Tag color="purple">{record.connectionType}</Tag>
          <Text type="secondary">{record.iceCandidates} ICE candidates</Text>
        </Space>
      )
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      render: (activity: string) => (
        <Text type="secondary">{activity}</Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: WebRTCStream) => (
        <Space>
          {record.status === 'active' ? (
            <Tooltip title="Stop Stream">
              <Button 
                icon={<PauseCircleOutlined />} 
                danger 
                size="small"
                onClick={() => handleStopStream(record.id)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Start Stream">
              <Button 
                icon={<PlayCircleOutlined />} 
                type="primary" 
                size="small"
                onClick={() => handleStartStream(record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="Edit Stream">
            <Button 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEditStream(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Stream">
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const totalViewers = streams.reduce((sum, stream) => sum + stream.viewers, 0);
  const activeStreams = streams.filter(stream => stream.status === 'active').length;
  const avgLatency = streams.length > 0 
    ? Math.round(streams.reduce((sum, stream) => sum + stream.latency, 0) / streams.length)
    : 0;

  return (
    <div>
      {/* WebRTC Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Viewers"
              value={totalViewers}
              prefix={<EyeOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Streams"
              value={activeStreams}
              prefix={<PlayCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Average Latency"
              value={avgLatency}
              suffix="ms"
              prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* WebRTC Info Alert */}
      <Alert
        message="WebRTC Low-Latency Streaming"
        description="WebRTC provides ultra-low latency streaming (50-200ms) ideal for interactive applications, live gaming, and real-time communication. Configure ICE servers and codec preferences for optimal performance."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Streams Table */}
      <Card
        title="WebRTC Streams"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadWebRTCStreams}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateStream}
            >
              Create Stream
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={streams}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create/Edit Stream Modal */}
      <Modal
        title={editingStream ? 'Edit WebRTC Stream' : 'Create WebRTC Stream'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveStream}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Stream Name"
                rules={[{ required: true, message: 'Please enter stream name' }]}
              >
                <Input placeholder="e.g., live_webrtc" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quality"
                label="Quality Preset"
                rules={[{ required: true, message: 'Please select quality' }]}
              >
                <Select>
                  <Option value="high">High (1080p, 2Mbps)</Option>
                  <Option value="medium">Medium (720p, 1.5Mbps)</Option>
                  <Option value="low">Low (480p, 800kbps)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="resolution"
                label="Resolution"
                rules={[{ required: true, message: 'Please select resolution' }]}
              >
                <Select>
                  {resolutionOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="framerate"
                label="Frame Rate"
                rules={[{ required: true, message: 'Please select frame rate' }]}
              >
                <Select>
                  {framerateOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="codec"
                label="Video Codec"
                rules={[{ required: true, message: 'Please select codec' }]}
              >
                <Select>
                  {codecOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="bitrate"
                label="Bitrate (kbps)"
                rules={[{ required: true, message: 'Please enter bitrate' }]}
              >
                <Input type="number" placeholder="2000" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Advanced Settings</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="connectionType"
                label="Connection Type"
                initialValue="direct"
              >
                <Select>
                  <Option value="direct">Direct (P2P)</Option>
                  <Option value="relay">Relay (TURN)</Option>
                  <Option value="turn">TURN Server</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="enableAudio"
                label="Enable Audio"
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

export default WebRTCStreamManager;
