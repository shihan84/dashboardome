import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Switch,
  Divider,
  Alert,
  Spin,
  Tabs,
  Table,
  Tag,
  Tooltip,
  Modal,
  Form,
  InputNumber,
  Progress,
  Badge,
} from 'antd';
import {
  VideoCameraOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  AudioOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface EncoderManagerProps {
  vhost?: string;
  app?: string;
}

interface EncoderInstance {
  id: string;
  name: string;
  type: 'webrtc' | 'rtmp' | 'srt' | 'rtsp';
  status: 'idle' | 'connecting' | 'streaming' | 'error' | 'disconnected';
  inputSource: string;
  outputUrl: string;
  resolution: string;
  bitrate: number;
  framerate: number;
  codec: string;
  audioCodec: string;
  audioBitrate: number;
  quality: 'ultra' | 'high' | 'medium' | 'low';
  latency: 'ultra-low' | 'low' | 'normal';
  adaptiveBitrate: boolean;
  hardwareAcceleration: boolean;
  createdAt: string;
  lastActivity: string;
  stats: {
    uptime: number;
    framesEncoded: number;
    framesDropped: number;
    bytesEncoded: number;
    averageBitrate: number;
    cpuUsage: number;
    memoryUsage: number;
  };
}

interface EncoderConfig {
  name: string;
  type: 'webrtc' | 'rtmp' | 'srt' | 'rtsp';
  inputSource: string;
  outputUrl: string;
  resolution: string;
  bitrate: number;
  framerate: number;
  codec: string;
  audioCodec: string;
  audioBitrate: number;
  quality: 'ultra' | 'high' | 'medium' | 'low';
  latency: 'ultra-low' | 'low' | 'normal';
  adaptiveBitrate: boolean;
  hardwareAcceleration: boolean;
}

export const EncoderManager: React.FC<EncoderManagerProps> = ({
  vhost = 'default',
  app = 'app'
}) => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const [encoders, setEncoders] = useState<EncoderInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEncoder, setEditingEncoder] = useState<EncoderInstance | null>(null);
  const [form] = Form.useForm();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  const fetchEncoders = async () => {
    try {
      setLoading(true);
      
      // Simulate encoder data since OME API doesn't provide encoder instances
      // In a real implementation, this would track active encoder instances
      const mockEncoders: EncoderInstance[] = [
        {
          id: 'encoder_1',
          name: 'WebRTC Encoder',
          type: 'webrtc',
          status: 'streaming',
          inputSource: 'Camera',
          outputUrl: `http://${omeHost}:8080/${vhost}/${app}/webrtc/stream`,
          resolution: '1920x1080',
          bitrate: 2500000,
          framerate: 30,
          codec: 'libvpx-vp8',
          audioCodec: 'libopus',
          audioBitrate: 128000,
          quality: 'high',
          latency: 'ultra-low',
          adaptiveBitrate: true,
          hardwareAcceleration: false,
          createdAt: new Date(Date.now() - 300000).toISOString(),
          lastActivity: new Date().toISOString(),
          stats: {
            uptime: 300,
            framesEncoded: 9000,
            framesDropped: 5,
            bytesEncoded: 125000000,
            averageBitrate: 2400000,
            cpuUsage: 45,
            memoryUsage: 128,
          },
        },
        {
          id: 'encoder_2',
          name: 'RTMP Encoder',
          type: 'rtmp',
          status: 'streaming',
          inputSource: 'OBS Studio',
          outputUrl: `rtmp://${omeHost}:1935/${vhost}/${app}/stream`,
          resolution: '1280x720',
          bitrate: 1500000,
          framerate: 30,
          codec: 'libx264',
          audioCodec: 'aac',
          audioBitrate: 128000,
          quality: 'medium',
          latency: 'normal',
          adaptiveBitrate: false,
          hardwareAcceleration: true,
          createdAt: new Date(Date.now() - 600000).toISOString(),
          lastActivity: new Date().toISOString(),
          stats: {
            uptime: 600,
            framesEncoded: 18000,
            framesDropped: 12,
            bytesEncoded: 200000000,
            averageBitrate: 1450000,
            cpuUsage: 35,
            memoryUsage: 96,
          },
        },
        {
          id: 'encoder_3',
          name: 'SRT Encoder',
          type: 'srt',
          status: 'idle',
          inputSource: 'File',
          outputUrl: `srt://${omeHost}:9999/${vhost}/${app}/stream`,
          resolution: '1920x1080',
          bitrate: 3000000,
          framerate: 25,
          codec: 'libx264',
          audioCodec: 'aac',
          audioBitrate: 192000,
          quality: 'high',
          latency: 'low',
          adaptiveBitrate: true,
          hardwareAcceleration: true,
          createdAt: new Date(Date.now() - 900000).toISOString(),
          lastActivity: new Date(Date.now() - 300000).toISOString(),
          stats: {
            uptime: 0,
            framesEncoded: 0,
            framesDropped: 0,
            bytesEncoded: 0,
            averageBitrate: 0,
            cpuUsage: 0,
            memoryUsage: 0,
          },
        },
      ];

      setEncoders(mockEncoders);
    } catch (err) {
      console.error('Failed to fetch encoders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncoders();
  }, [vhost, app]);

  const handleCreateEncoder = () => {
    setEditingEncoder(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditEncoder = (encoder: EncoderInstance) => {
    setEditingEncoder(encoder);
    form.setFieldsValue(encoder);
    setModalVisible(true);
  };

  const handleDeleteEncoder = (encoderId: string) => {
    setEncoders(prev => prev.filter(e => e.id !== encoderId));
  };

  const handleStartEncoder = (encoderId: string) => {
    setEncoders(prev => prev.map(e => 
      e.id === encoderId ? { ...e, status: 'streaming', lastActivity: new Date().toISOString() } : e
    ));
  };

  const handleStopEncoder = (encoderId: string) => {
    setEncoders(prev => prev.map(e => 
      e.id === encoderId ? { ...e, status: 'idle', lastActivity: new Date().toISOString() } : e
    ));
  };

  const handleModalSubmit = async (values: EncoderConfig) => {
    try {
      const newEncoder: EncoderInstance = {
        id: editingEncoder?.id || `encoder_${Date.now()}`,
        name: values.name,
        type: values.type,
        status: 'idle',
        inputSource: values.inputSource,
        outputUrl: values.outputUrl,
        resolution: values.resolution,
        bitrate: values.bitrate,
        framerate: values.framerate,
        codec: values.codec,
        audioCodec: values.audioCodec,
        audioBitrate: values.audioBitrate,
        quality: values.quality,
        latency: values.latency,
        adaptiveBitrate: values.adaptiveBitrate,
        hardwareAcceleration: values.hardwareAcceleration,
        createdAt: editingEncoder?.createdAt || new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        stats: {
          uptime: 0,
          framesEncoded: 0,
          framesDropped: 0,
          bytesEncoded: 0,
          averageBitrate: 0,
          cpuUsage: 0,
          memoryUsage: 0,
        },
      };

      if (editingEncoder) {
        setEncoders(prev => prev.map(e => e.id === editingEncoder.id ? newEncoder : e));
      } else {
        setEncoders(prev => [...prev, newEncoder]);
      }

      setModalVisible(false);
      setEditingEncoder(null);
      form.resetFields();
    } catch (err) {
      console.error('Failed to save encoder:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'streaming': return 'green';
      case 'connecting': return 'blue';
      case 'idle': return 'default';
      case 'error': return 'red';
      case 'disconnected': return 'gray';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'webrtc': return <ThunderboltOutlined style={{ color: '#1890ff' }} />;
      case 'rtmp': return <VideoCameraOutlined style={{ color: '#52c41a' }} />;
      case 'srt': return <WifiOutlined style={{ color: '#fa8c16' }} />;
      case 'rtsp': return <PlayCircleOutlined style={{ color: '#722ed1' }} />;
      default: return <VideoCameraOutlined />;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'ultra': return 'purple';
      case 'high': return 'green';
      case 'medium': return 'orange';
      case 'low': return 'red';
      default: return 'default';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatBitrate = (bitrate: number) => {
    if (bitrate < 1000) return bitrate + ' bps';
    if (bitrate < 1000000) return (bitrate / 1000).toFixed(1) + ' Kbps';
    return (bitrate / 1000000).toFixed(1) + ' Mbps';
  };

  const encoderColumns = [
    {
      title: 'Encoder Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: EncoderInstance) => (
        <Space>
          {getTypeIcon(record.type)}
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.type.toUpperCase()} • {record.inputSource}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Quality',
      dataIndex: 'quality',
      key: 'quality',
      render: (quality: string) => (
        <Tag color={getQualityColor(quality)}>
          {quality.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Resolution',
      dataIndex: 'resolution',
      key: 'resolution',
      render: (resolution: string) => (
        <Text code>{resolution}</Text>
      ),
    },
    {
      title: 'Bitrate',
      dataIndex: 'bitrate',
      key: 'bitrate',
      render: (bitrate: number) => formatBitrate(bitrate),
    },
    {
      title: 'Framerate',
      dataIndex: 'framerate',
      key: 'framerate',
      render: (framerate: number) => `${framerate} fps`,
    },
    {
      title: 'Codec',
      key: 'codec',
      render: (record: EncoderInstance) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: '12px' }}>
            <VideoCameraOutlined /> {record.codec}
          </Text>
          <Text style={{ fontSize: '12px' }}>
            <AudioOutlined /> {record.audioCodec}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Stats',
      key: 'stats',
      render: (record: EncoderInstance) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: '12px' }}>
            Frames: {record.stats.framesEncoded.toLocaleString()}
          </Text>
          <Text style={{ fontSize: '12px' }}>
            CPU: {record.stats.cpuUsage}%
          </Text>
          <Text style={{ fontSize: '12px' }}>
            Memory: {record.stats.memoryUsage}MB
          </Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: EncoderInstance) => (
        <Space>
          {record.status === 'streaming' ? (
            <Tooltip title="Stop">
              <Button
                type="text"
                icon={<StopOutlined />}
                onClick={() => handleStopEncoder(record.id)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Start">
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStartEncoder(record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditEncoder(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteEncoder(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const totalEncoders = encoders.length;
  const activeEncoders = encoders.filter(e => e.status === 'streaming').length;
  const totalFrames = encoders.reduce((sum, e) => sum + e.stats.framesEncoded, 0);
  const averageCpuUsage = encoders.length > 0 ? encoders.reduce((sum, e) => sum + e.stats.cpuUsage, 0) / encoders.length : 0;

  return (
    <div>
      <Card
        title={
          <Space>
            <VideoCameraOutlined />
            <span>OvenLiveKit Encoder Manager</span>
            <Badge count={activeEncoders} color="green" />
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchEncoders}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateEncoder}
            >
              Create Encoder
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Tabs defaultActiveKey="encoders">
            <TabPane tab="Encoders" key="encoders">
              <Table
                columns={encoderColumns}
                dataSource={encoders}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="small"
                scroll={{ x: 1200 }}
                locale={{
                  emptyText: 'No encoders found'
                }}
              />
            </TabPane>
            
            <TabPane tab="Overview" key="overview">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="Total Encoders"
                      value={totalEncoders}
                      prefix={<VideoCameraOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {activeEncoders} active
                    </Text>
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="Frames Encoded"
                      value={totalFrames}
                      prefix={<PlayCircleOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Total processed
                    </Text>
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="CPU Usage"
                      value={averageCpuUsage.toFixed(1)}
                      suffix="%"
                      prefix={<ThunderboltOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                    <Progress
                      percent={averageCpuUsage}
                      size="small"
                      status={averageCpuUsage > 80 ? 'exception' : 'normal'}
                    />
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="Active Streams"
                      value={activeEncoders}
                      prefix={<WifiOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Currently streaming
                    </Text>
                  </Card>
                </Col>
              </Row>
            </TabPane>
            
            <TabPane tab="Configuration" key="config">
              <Alert
                message="OvenLiveKit Configuration"
                description="OvenLiveKit for Web is a JavaScript-based Live Streaming Encoder that supports WebRTC, RTMP, SRT, and RTSP protocols with hardware acceleration and adaptive bitrate capabilities."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card title="Supported Protocols" size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <ThunderboltOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                        <Text strong>WebRTC</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>Ultra-low latency</Text>
                      </div>
                      <div>
                        <VideoCameraOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        <Text strong>RTMP</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>Real-time messaging</Text>
                      </div>
                      <div>
                        <WifiOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                        <Text strong>SRT</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>Secure reliable transport</Text>
                      </div>
                      <div>
                        <PlayCircleOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                        <Text strong>RTSP</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>Real-time streaming</Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="Features" size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>✅ Hardware acceleration</div>
                      <div>✅ Adaptive bitrate</div>
                      <div>✅ Multiple codecs</div>
                      <div>✅ Real-time monitoring</div>
                      <div>✅ Cross-platform</div>
                      <div>✅ Mobile support</div>
                      <div>✅ Custom settings</div>
                      <div>✅ Quality control</div>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Spin>
      </Card>

      {/* Encoder Creation/Edit Modal */}
      <Modal
        title={editingEncoder ? 'Edit Encoder' : 'Create Encoder'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingEncoder(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={800}
        okText={editingEncoder ? 'Update' : 'Create'}
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Encoder Name"
                rules={[{ required: true, message: 'Please enter encoder name' }]}
              >
                <Input placeholder="e.g., WebRTC Encoder" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Encoder Type"
                rules={[{ required: true, message: 'Please select encoder type' }]}
              >
                <Select placeholder="Select encoder type">
                  <Option value="webrtc">WebRTC</Option>
                  <Option value="rtmp">RTMP</Option>
                  <Option value="srt">SRT</Option>
                  <Option value="rtsp">RTSP</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="inputSource"
                label="Input Source"
                rules={[{ required: true, message: 'Please enter input source' }]}
              >
                <Input placeholder="e.g., Camera, OBS Studio, File" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="outputUrl"
                label="Output URL"
                rules={[{ required: true, message: 'Please enter output URL' }]}
              >
                <Input placeholder="e.g., rtmp://192.168.1.102:1935/default/app/stream" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Video Settings</Divider>
          
          <Row gutter={16}>
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
                name="bitrate"
                label="Bitrate (bps)"
                initialValue={2500000}
              >
                <InputNumber min={100000} max={10000000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="framerate"
                label="Framerate"
                initialValue={30}
              >
                <InputNumber min={1} max={60} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="codec"
                label="Video Codec"
                initialValue="libx264"
              >
                <Select>
                  <Option value="libx264">H.264 (libx264)</Option>
                  <Option value="libx265">H.265 (libx265)</Option>
                  <Option value="libvpx-vp8">VP8</Option>
                  <Option value="libvpx-vp9">VP9</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quality"
                label="Quality"
                initialValue="high"
              >
                <Select>
                  <Option value="ultra">Ultra</Option>
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>Audio Settings</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="audioCodec"
                label="Audio Codec"
                initialValue="aac"
              >
                <Select>
                  <Option value="aac">AAC</Option>
                  <Option value="libopus">Opus</Option>
                  <Option value="mp3">MP3</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="audioBitrate"
                label="Audio Bitrate (bps)"
                initialValue={128000}
              >
                <InputNumber min={32000} max={512000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Advanced Settings</Divider>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="latency"
                label="Latency Mode"
                initialValue="normal"
              >
                <Select>
                  <Option value="ultra-low">Ultra Low</Option>
                  <Option value="low">Low</Option>
                  <Option value="normal">Normal</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="adaptiveBitrate"
                label="Adaptive Bitrate"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="hardwareAcceleration"
                label="Hardware Acceleration"
                valuePropName="checked"
                initialValue={false}
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
