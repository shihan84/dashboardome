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
  Timeline,
  List,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  GlobalOutlined,
  RocketOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface DemoManagerProps {
  vhost?: string;
  app?: string;
}

interface DemoInstance {
  id: string;
  name: string;
  type: 'streaming' | 'playback' | 'recording' | 'publishing';
  status: 'idle' | 'running' | 'paused' | 'error' | 'completed';
  description: string;
  streamUrl: string;
  playbackUrl: string;
  thumbnailUrl: string;
  duration: number;
  viewers: number;
  maxViewers: number;
  quality: 'ultra' | 'high' | 'medium' | 'low';
  latency: 'ultra-low' | 'low' | 'normal';
  features: string[];
  createdAt: string;
  lastActivity: string;
  stats: {
    uptime: number;
    totalViewers: number;
    peakViewers: number;
    averageLatency: number;
    bandwidthUsed: number;
    errors: number;
  };
}

interface DemoConfig {
  name: string;
  type: 'streaming' | 'playback' | 'recording' | 'publishing';
  description: string;
  streamUrl: string;
  playbackUrl: string;
  quality: 'ultra' | 'high' | 'medium' | 'low';
  latency: 'ultra-low' | 'low' | 'normal';
  features: string[];
}

export const DemoManager: React.FC<DemoManagerProps> = ({
  vhost = 'default',
  app = 'app'
}) => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const [demos, setDemos] = useState<DemoInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDemo, setEditingDemo] = useState<DemoInstance | null>(null);
  const [form] = Form.useForm();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  const fetchDemos = async () => {
    try {
      setLoading(true);
      
      // Simulate demo data based on OvenSpace capabilities
      const mockDemos: DemoInstance[] = [
        {
          id: 'demo_1',
          name: 'Sub-Second Latency Streaming',
          type: 'streaming',
          status: 'running',
          description: 'Demonstrates ultra-low latency streaming using WebRTC and LLHLS',
          streamUrl: `http://${omeHost}:8080/${vhost}/${app}/webrtc/stream`,
          playbackUrl: `http://${omeHost}:8080/${vhost}/${app}/llhls/stream`,
          thumbnailUrl: `http://${omeHost}:8080/${vhost}/${app}/thumbnail/stream`,
          duration: 0,
          viewers: 15,
          maxViewers: 25,
          quality: 'high',
          latency: 'ultra-low',
          features: ['WebRTC', 'LLHLS', 'Adaptive Bitrate', 'Real-time'],
          createdAt: new Date(Date.now() - 300000).toISOString(),
          lastActivity: new Date().toISOString(),
          stats: {
            uptime: 300,
            totalViewers: 45,
            peakViewers: 25,
            averageLatency: 45,
            bandwidthUsed: 125000000,
            errors: 0,
          },
        },
        {
          id: 'demo_2',
          name: 'Multi-Protocol Playback',
          type: 'playback',
          status: 'running',
          description: 'Shows playback across different protocols (HLS, DASH, WebRTC)',
          streamUrl: `http://${omeHost}:8080/${vhost}/${app}/hls/stream`,
          playbackUrl: `http://${omeHost}:8080/${vhost}/${app}/dash/stream`,
          thumbnailUrl: `http://${omeHost}:8080/${vhost}/${app}/thumbnail/stream`,
          duration: 0,
          viewers: 8,
          maxViewers: 15,
          quality: 'medium',
          latency: 'low',
          features: ['HLS', 'DASH', 'WebRTC', 'Cross-platform'],
          createdAt: new Date(Date.now() - 600000).toISOString(),
          lastActivity: new Date().toISOString(),
          stats: {
            uptime: 600,
            totalViewers: 32,
            peakViewers: 15,
            averageLatency: 120,
            bandwidthUsed: 85000000,
            errors: 1,
          },
        },
        {
          id: 'demo_3',
          name: 'Live Recording Demo',
          type: 'recording',
          status: 'paused',
          description: 'Demonstrates live stream recording with DVR capabilities',
          streamUrl: `http://${omeHost}:8080/${vhost}/${app}/rtmp/stream`,
          playbackUrl: `http://${omeHost}:8080/${vhost}/${app}/recorded/stream`,
          thumbnailUrl: `http://${omeHost}:8080/${vhost}/${app}/thumbnail/stream`,
          duration: 1800,
          viewers: 0,
          maxViewers: 5,
          quality: 'high',
          latency: 'normal',
          features: ['Recording', 'DVR', 'Playback', 'Storage'],
          createdAt: new Date(Date.now() - 900000).toISOString(),
          lastActivity: new Date(Date.now() - 300000).toISOString(),
          stats: {
            uptime: 0,
            totalViewers: 12,
            peakViewers: 5,
            averageLatency: 200,
            bandwidthUsed: 200000000,
            errors: 0,
          },
        },
        {
          id: 'demo_4',
          name: 'Push Publishing Demo',
          type: 'publishing',
          status: 'idle',
          description: 'Shows push publishing to external platforms (YouTube, Twitch, etc.)',
          streamUrl: `rtmp://${omeHost}:1935/${vhost}/${app}/stream`,
          playbackUrl: `https://youtube.com/watch?v=demo`,
          thumbnailUrl: `http://${omeHost}:8080/${vhost}/${app}/thumbnail/stream`,
          duration: 0,
          viewers: 0,
          maxViewers: 0,
          quality: 'high',
          latency: 'normal',
          features: ['Push Publishing', 'External Platforms', 'Multi-destination'],
          createdAt: new Date(Date.now() - 1200000).toISOString(),
          lastActivity: new Date(Date.now() - 600000).toISOString(),
          stats: {
            uptime: 0,
            totalViewers: 0,
            peakViewers: 0,
            averageLatency: 0,
            bandwidthUsed: 0,
            errors: 0,
          },
        },
      ];

      setDemos(mockDemos);
    } catch (err) {
      console.error('Failed to fetch demos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemos();
  }, [vhost, app]);

  const handleCreateDemo = () => {
    setEditingDemo(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditDemo = (demo: DemoInstance) => {
    setEditingDemo(demo);
    form.setFieldsValue(demo);
    setModalVisible(true);
  };

  const handleDeleteDemo = (demoId: string) => {
    setDemos(prev => prev.filter(d => d.id !== demoId));
  };

  const handleStartDemo = (demoId: string) => {
    setDemos(prev => prev.map(d => 
      d.id === demoId ? { ...d, status: 'running', lastActivity: new Date().toISOString() } : d
    ));
  };

  const handlePauseDemo = (demoId: string) => {
    setDemos(prev => prev.map(d => 
      d.id === demoId ? { ...d, status: 'paused', lastActivity: new Date().toISOString() } : d
    ));
  };

  const handleStopDemo = (demoId: string) => {
    setDemos(prev => prev.map(d => 
      d.id === demoId ? { ...d, status: 'idle', lastActivity: new Date().toISOString() } : d
    ));
  };

  const handleModalSubmit = async (values: DemoConfig) => {
    try {
      const newDemo: DemoInstance = {
        id: editingDemo?.id || `demo_${Date.now()}`,
        name: values.name,
        type: values.type,
        status: 'idle',
        description: values.description,
        streamUrl: values.streamUrl,
        playbackUrl: values.playbackUrl,
        thumbnailUrl: `http://${omeHost}:8080/${vhost}/${app}/thumbnail/stream`,
        duration: 0,
        viewers: 0,
        maxViewers: 0,
        quality: values.quality,
        latency: values.latency,
        features: values.features,
        createdAt: editingDemo?.createdAt || new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        stats: {
          uptime: 0,
          totalViewers: 0,
          peakViewers: 0,
          averageLatency: 0,
          bandwidthUsed: 0,
          errors: 0,
        },
      };

      if (editingDemo) {
        setDemos(prev => prev.map(d => d.id === editingDemo.id ? newDemo : d));
      } else {
        setDemos(prev => [...prev, newDemo]);
      }

      setModalVisible(false);
      setEditingDemo(null);
      form.resetFields();
    } catch (err) {
      console.error('Failed to save demo:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'green';
      case 'paused': return 'orange';
      case 'idle': return 'default';
      case 'error': return 'red';
      case 'completed': return 'blue';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'streaming': return <ThunderboltOutlined style={{ color: '#1890ff' }} />;
      case 'playback': return <PlayCircleOutlined style={{ color: '#52c41a' }} />;
      case 'recording': return <VideoCameraOutlined style={{ color: '#fa8c16' }} />;
      case 'publishing': return <GlobalOutlined style={{ color: '#722ed1' }} />;
      default: return <ExperimentOutlined />;
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

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const demoColumns = [
    {
      title: 'Demo Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: DemoInstance) => (
        <Space>
          {getTypeIcon(record.type)}
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
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
      title: 'Viewers',
      key: 'viewers',
      render: (record: DemoInstance) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.viewers}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Max: {record.maxViewers}
          </Text>
        </Space>
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
      title: 'Latency',
      dataIndex: 'latency',
      key: 'latency',
      render: (latency: string) => (
        <Text code>{latency}</Text>
      ),
    },
    {
      title: 'Features',
      dataIndex: 'features',
      key: 'features',
      render: (features: string[]) => (
        <Space wrap>
          {features.slice(0, 2).map(feature => (
            <Tag key={feature} size="small">{feature}</Tag>
          ))}
          {features.length > 2 && (
            <Tag size="small">+{features.length - 2}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => (
        <Text code>{formatDuration(duration)}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: DemoInstance) => (
        <Space>
          {record.status === 'running' ? (
            <Tooltip title="Pause">
              <Button
                type="text"
                icon={<PauseCircleOutlined />}
                onClick={() => handlePauseDemo(record.id)}
              />
            </Tooltip>
          ) : record.status === 'paused' ? (
            <Tooltip title="Resume">
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStartDemo(record.id)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Start">
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStartDemo(record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="Stop">
            <Button
              type="text"
              icon={<StopOutlined />}
              onClick={() => handleStopDemo(record.id)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditDemo(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const totalDemos = demos.length;
  const activeDemos = demos.filter(d => d.status === 'running').length;
  const totalViewers = demos.reduce((sum, d) => sum + d.viewers, 0);
  const totalBandwidth = demos.reduce((sum, d) => sum + d.stats.bandwidthUsed, 0);

  return (
    <div>
      <Card
        title={
          <Space>
            <RocketOutlined />
            <span>OvenSpace Demo Manager</span>
            <Badge count={activeDemos} color="green" />
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchDemos}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateDemo}
            >
              Create Demo
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Tabs defaultActiveKey="demos">
            <TabPane tab="Demos" key="demos">
              <Table
                columns={demoColumns}
                dataSource={demos}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="small"
                scroll={{ x: 1200 }}
                locale={{
                  emptyText: 'No demos found'
                }}
              />
            </TabPane>
            
            <TabPane tab="Overview" key="overview">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="Total Demos"
                      value={totalDemos}
                      prefix={<ExperimentOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {activeDemos} active
                    </Text>
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="Total Viewers"
                      value={totalViewers}
                      prefix={<EyeOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Currently watching
                    </Text>
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="Bandwidth Used"
                      value={formatBytes(totalBandwidth)}
                      prefix={<ThunderboltOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Total data transfer
                    </Text>
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="Active Demos"
                      value={activeDemos}
                      prefix={<RocketOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Currently running
                    </Text>
                  </Card>
                </Col>
              </Row>
            </TabPane>
            
            <TabPane tab="Features" key="features">
              <Alert
                message="OvenSpace Demo Features"
                description="OvenSpace is a Sub-Second Latency Streaming Demo Service using OvenMediaEngine, OvenPlayer, and OvenLiveKit. It showcases the complete streaming ecosystem with real-time capabilities."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card title="Streaming Features" size="small">
                    <List
                      size="small"
                      dataSource={[
                        'Sub-second latency streaming',
                        'WebRTC real-time communication',
                        'LLHLS low-latency HLS',
                        'Adaptive bitrate streaming',
                        'Multi-protocol support',
                        'Cross-platform compatibility',
                        'Mobile responsive design',
                        'Real-time monitoring'
                      ]}
                      renderItem={item => <List.Item>{item}</List.Item>}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="Demo Capabilities" size="small">
                    <List
                      size="small"
                      dataSource={[
                        'Live streaming demos',
                        'Playback testing',
                        'Recording demonstrations',
                        'Push publishing examples',
                        'Quality comparison',
                        'Latency testing',
                        'Performance monitoring',
                        'User experience showcase'
                      ]}
                      renderItem={item => <List.Item>{item}</List.Item>}
                    />
                  </Card>
                </Col>
              </Row>
            </TabPane>
            
            <TabPane tab="Timeline" key="timeline">
              <Card title="Demo Activity Timeline" size="small">
                <Timeline>
                  {demos.map(demo => (
                    <Timeline.Item
                      key={demo.id}
                      color={getStatusColor(demo.status)}
                    >
                      <div>
                        <Text strong>{demo.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {demo.type.toUpperCase()} • {demo.viewers} viewers • {formatDuration(demo.duration)}
                        </Text>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            </TabPane>
          </Tabs>
        </Spin>
      </Card>

      {/* Demo Creation/Edit Modal */}
      <Modal
        title={editingDemo ? 'Edit Demo' : 'Create Demo'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingDemo(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        okText={editingDemo ? 'Update' : 'Create'}
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
                label="Demo Name"
                rules={[{ required: true, message: 'Please enter demo name' }]}
              >
                <Input placeholder="e.g., Sub-Second Latency Demo" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Demo Type"
                rules={[{ required: true, message: 'Please select demo type' }]}
              >
                <Select placeholder="Select demo type">
                  <Option value="streaming">Streaming</Option>
                  <Option value="playback">Playback</Option>
                  <Option value="recording">Recording</Option>
                  <Option value="publishing">Publishing</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea 
              placeholder="Describe what this demo showcases..."
              rows={3}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="streamUrl"
                label="Stream URL"
                rules={[{ required: true, message: 'Please enter stream URL' }]}
              >
                <Input placeholder="e.g., http://192.168.1.102:8080/default/app/webrtc/stream" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="playbackUrl"
                label="Playback URL"
                rules={[{ required: true, message: 'Please enter playback URL' }]}
              >
                <Input placeholder="e.g., http://192.168.1.102:8080/default/app/llhls/stream" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
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
            <Col span={8}>
              <Form.Item
                name="latency"
                label="Latency Mode"
                initialValue="ultra-low"
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
                name="features"
                label="Features"
                initialValue={['WebRTC', 'LLHLS']}
              >
                <Select
                  mode="multiple"
                  placeholder="Select features"
                >
                  <Option value="WebRTC">WebRTC</Option>
                  <Option value="LLHLS">LLHLS</Option>
                  <Option value="HLS">HLS</Option>
                  <Option value="DASH">DASH</Option>
                  <Option value="Adaptive Bitrate">Adaptive Bitrate</Option>
                  <Option value="Real-time">Real-time</Option>
                  <Option value="Cross-platform">Cross-platform</Option>
                  <Option value="Mobile">Mobile</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
