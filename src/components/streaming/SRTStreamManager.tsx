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
  InputNumber
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
  InfoCircleOutlined,
  GlobalOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import { OMEApiService } from '../../services/omeApi';
import { useStore } from '../../store/useStore';

const { Option } = Select;

interface SRTStream {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'connecting' | 'error';
  viewers: number;
  bitrate: number;
  resolution: string;
  framerate: number;
  latency: number;
  encryption: boolean;
  passphrase: string;
  port: number;
  mode: 'caller' | 'listener' | 'rendezvous';
  congestionControl: 'live' | 'file';
  lastActivity: string;
  packetLoss: number;
  rtt: number;
}

const SRTStreamManager: React.FC = () => {
  const [streams, setStreams] = useState<SRTStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStream, setEditingStream] = useState<SRTStream | null>(null);
  const [form] = Form.useForm();
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  // SRT Configuration Options
  const modeOptions = [
    { value: 'caller', label: 'Caller (Outgoing)' },
    { value: 'listener', label: 'Listener (Incoming)' },
    { value: 'rendezvous', label: 'Rendezvous (Bidirectional)' }
  ];

  const congestionControlOptions = [
    { value: 'live', label: 'Live (Low Latency)' },
    { value: 'file', label: 'File (Reliability)' }
  ];

  const latencyOptions = [
    { value: 20, label: '20ms (Ultra Low)' },
    { value: 40, label: '40ms (Low)' },
    { value: 80, label: '80ms (Medium)' },
    { value: 120, label: '120ms (High)' }
  ];

  useEffect(() => {
    loadSRTStreams();
    const interval = setInterval(loadSRTStreams, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadSRTStreams = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual OME API calls
      const mockStreams: SRTStream[] = [
        {
          id: '1',
          name: 'live_srt',
          status: 'active',
          viewers: 8,
          bitrate: 3000,
          resolution: '1920x1080',
          framerate: 30,
          latency: 40,
          encryption: true,
          passphrase: '****',
          port: 9999,
          mode: 'listener',
          congestionControl: 'live',
          lastActivity: '1 minute ago',
          packetLoss: 0.1,
          rtt: 25
        },
        {
          id: '2',
          name: 'backup_srt',
          status: 'inactive',
          viewers: 0,
          bitrate: 2000,
          resolution: '1280x720',
          framerate: 30,
          latency: 80,
          encryption: false,
          passphrase: '',
          port: 9998,
          mode: 'caller',
          congestionControl: 'file',
          lastActivity: 'Never',
          packetLoss: 0,
          rtt: 0
        }
      ];
      setStreams(mockStreams);
    } catch (error) {
      message.error('Failed to load SRT streams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStream = () => {
    setEditingStream(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditStream = (stream: SRTStream) => {
    setEditingStream(stream);
    form.setFieldsValue({
      ...stream,
      passphrase: stream.encryption ? '****' : ''
    });
    setModalVisible(true);
  };

  const handleSaveStream = async (values: any) => {
    try {
      if (editingStream) {
        // Update existing stream
        setStreams(prev => prev.map(stream => 
          stream.id === editingStream.id ? { ...stream, ...values } : stream
        ));
        message.success('SRT stream updated successfully!');
      } else {
        // Create new stream
        const newStream: SRTStream = {
          id: Date.now().toString(),
          ...values,
          status: 'inactive',
          viewers: 0,
          lastActivity: 'Never',
          packetLoss: 0,
          rtt: 0
        };
        setStreams(prev => [...prev, newStream]);
        message.success('SRT stream created successfully!');
      }
      setModalVisible(false);
    } catch (error) {
      message.error('Failed to save SRT stream');
    }
  };

  const handleStartStream = async (streamId: string) => {
    try {
      setStreams(prev => prev.map(stream => 
        stream.id === streamId ? { ...stream, status: 'connecting' } : stream
      ));
      
      // Simulate SRT connection
      setTimeout(() => {
        setStreams(prev => prev.map(stream => 
          stream.id === streamId ? { 
            ...stream, 
            status: 'active',
            viewers: Math.floor(Math.random() * 10) + 1,
            packetLoss: Math.random() * 0.5,
            rtt: Math.floor(Math.random() * 50) + 10
          } : stream
        ));
        message.success('SRT stream started successfully!');
      }, 2000);
    } catch (error) {
      message.error('Failed to start SRT stream');
    }
  };

  const handleStopStream = async (streamId: string) => {
    try {
      setStreams(prev => prev.map(stream => 
        stream.id === streamId ? { 
          ...stream, 
          status: 'inactive',
          viewers: 0,
          packetLoss: 0,
          rtt: 0
        } : stream
      ));
      message.success('SRT stream stopped successfully!');
    } catch (error) {
      message.error('Failed to stop SRT stream');
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

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'caller': return 'blue';
      case 'listener': return 'green';
      case 'rendezvous': return 'purple';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Stream Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: SRTStream) => (
        <Space>
          <VideoCameraOutlined />
          <strong>{text}</strong>
          {record.encryption && <LockOutlined style={{ color: '#52c41a' }} />}
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
      render: (record: SRTStream) => (
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
      title: 'Connection',
      key: 'connection',
      render: (record: SRTStream) => (
        <Space direction="vertical" size="small">
          <Tag color={getModeColor(record.mode)}>{record.mode}</Tag>
          <Text type="secondary">Port: {record.port}</Text>
        </Space>
      )
    },
    {
      title: 'Network Stats',
      key: 'network',
      render: (record: SRTStream) => (
        <Space direction="vertical" size="small">
          <Text type="secondary">RTT: {record.rtt}ms</Text>
          <Text type="secondary">Loss: {record.packetLoss.toFixed(1)}%</Text>
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
      render: (record: SRTStream) => (
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
  const encryptedStreams = streams.filter(stream => stream.encryption).length;

  return (
    <div>
      {/* SRT Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Viewers"
              value={totalViewers}
              prefix={<EyeOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Streams"
              value={activeStreams}
              prefix={<PlayCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Average Latency"
              value={avgLatency}
              suffix="ms"
              prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Encrypted Streams"
              value={encryptedStreams}
              prefix={<LockOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* SRT Info Alert */}
      <Alert
        message="SRT (Secure Reliable Transport)"
        description="SRT provides secure, low-latency streaming with built-in encryption, error recovery, and congestion control. Ideal for professional broadcasting and long-distance streaming."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Streams Table */}
      <Card
        title="SRT Streams"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadSRTStreams}
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
        title={editingStream ? 'Edit SRT Stream' : 'Create SRT Stream'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
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
                <Input placeholder="e.g., live_srt" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="port"
                label="Port"
                rules={[{ required: true, message: 'Please enter port' }]}
                initialValue={9999}
              >
                <InputNumber min={1024} max={65535} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="mode"
                label="Connection Mode"
                rules={[{ required: true, message: 'Please select mode' }]}
                initialValue="listener"
              >
                <Select>
                  {modeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="congestionControl"
                label="Congestion Control"
                rules={[{ required: true, message: 'Please select congestion control' }]}
                initialValue="live"
              >
                <Select>
                  {congestionControlOptions.map(option => (
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
                name="latency"
                label="Latency (ms)"
                rules={[{ required: true, message: 'Please select latency' }]}
                initialValue={40}
              >
                <Select>
                  {latencyOptions.map(option => (
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
                initialValue={2000}
              >
                <InputNumber min={100} max={10000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Security Settings</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="encryption"
                label="Enable Encryption"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="passphrase"
                label="Passphrase"
                dependencies={['encryption']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (getFieldValue('encryption') && !value) {
                        return Promise.reject(new Error('Passphrase is required when encryption is enabled'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Enter passphrase" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Video Settings</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="resolution"
                label="Resolution"
                rules={[{ required: true, message: 'Please select resolution' }]}
                initialValue="1920x1080"
              >
                <Select>
                  <Option value="1920x1080">1080p (1920x1080)</Option>
                  <Option value="1280x720">720p (1280x720)</Option>
                  <Option value="854x480">480p (854x480)</Option>
                  <Option value="640x360">360p (640x360)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="framerate"
                label="Frame Rate"
                rules={[{ required: true, message: 'Please select frame rate' }]}
                initialValue={30}
              >
                <Select>
                  <Option value={30}>30 FPS</Option>
                  <Option value={60}>60 FPS</Option>
                  <Option value={24}>24 FPS</Option>
                  <Option value={15}>15 FPS</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default SRTStreamManager;
