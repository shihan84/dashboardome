import React, { useState, useEffect, useRef } from 'react';
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
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  SettingOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  CopyOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface PlayerManagerProps {
  vhost?: string;
  app?: string;
}

interface PlayerInstance {
  id: string;
  name: string;
  type: 'llhls' | 'webrtc' | 'hls' | 'dash';
  url: string;
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'error';
  quality: 'auto' | 'high' | 'medium' | 'low';
  volume: number;
  muted: boolean;
  autoplay: boolean;
  controls: boolean;
  createdAt: string;
  lastActivity: string;
}

interface PlayerConfig {
  type: 'llhls' | 'webrtc' | 'hls' | 'dash';
  url: string;
  autoplay: boolean;
  controls: boolean;
  volume: number;
  muted: boolean;
  quality: 'auto' | 'high' | 'medium' | 'low';
  latency: 'ultra-low' | 'low' | 'normal';
  adaptiveBitrate: boolean;
  crossOrigin: boolean;
  preload: 'none' | 'metadata' | 'auto';
}

export const PlayerManager: React.FC<PlayerManagerProps> = ({
  vhost = 'default',
  app = 'app'
}) => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const [players, setPlayers] = useState<PlayerInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerInstance | null>(null);
  const [form] = Form.useForm();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const playerRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      
      // Simulate player data since OME API doesn't provide player instances
      // In a real implementation, this would track active player instances
      const mockPlayers: PlayerInstance[] = [
        {
          id: 'player_1',
          name: 'Main Stream Player',
          type: 'llhls',
          url: `http://${omeHost}:8080/${vhost}/${app}/llhls/stream`,
          status: 'playing',
          quality: 'high',
          volume: 80,
          muted: false,
          autoplay: true,
          controls: true,
          createdAt: new Date(Date.now() - 300000).toISOString(),
          lastActivity: new Date().toISOString(),
        },
        {
          id: 'player_2',
          name: 'WebRTC Player',
          type: 'webrtc',
          url: `http://${omeHost}:8080/${vhost}/${app}/webrtc/stream`,
          status: 'playing',
          quality: 'high',
          volume: 70,
          muted: false,
          autoplay: true,
          controls: true,
          createdAt: new Date(Date.now() - 180000).toISOString(),
          lastActivity: new Date().toISOString(),
        },
        {
          id: 'player_3',
          name: 'HLS Player',
          type: 'hls',
          url: `http://${omeHost}:8080/${vhost}/${app}/hls/stream`,
          status: 'paused',
          quality: 'medium',
          volume: 60,
          muted: false,
          autoplay: false,
          controls: true,
          createdAt: new Date(Date.now() - 600000).toISOString(),
          lastActivity: new Date(Date.now() - 120000).toISOString(),
        },
      ];

      setPlayers(mockPlayers);
    } catch (err) {
      console.error('Failed to fetch players:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [vhost, app]);

  const handleCreatePlayer = () => {
    setEditingPlayer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditPlayer = (player: PlayerInstance) => {
    setEditingPlayer(player);
    form.setFieldsValue(player);
    setModalVisible(true);
  };

  const handleDeletePlayer = (playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
  };

  const handleModalSubmit = async (values: PlayerConfig) => {
    try {
      const newPlayer: PlayerInstance = {
        id: editingPlayer?.id || `player_${Date.now()}`,
        name: values.name || `${values.type.toUpperCase()} Player`,
        type: values.type,
        url: values.url,
        status: 'idle',
        quality: values.quality,
        volume: values.volume,
        muted: values.muted,
        autoplay: values.autoplay,
        controls: values.controls,
        createdAt: editingPlayer?.createdAt || new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };

      if (editingPlayer) {
        setPlayers(prev => prev.map(p => p.id === editingPlayer.id ? newPlayer : p));
      } else {
        setPlayers(prev => [...prev, newPlayer]);
      }

      setModalVisible(false);
      setEditingPlayer(null);
      form.resetFields();
    } catch (err) {
      console.error('Failed to save player:', err);
    }
  };

  const handlePlay = (playerId: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, status: 'playing', lastActivity: new Date().toISOString() } : p
    ));
  };

  const handlePause = (playerId: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, status: 'paused', lastActivity: new Date().toISOString() } : p
    ));
  };

  const handleStop = (playerId: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, status: 'idle', lastActivity: new Date().toISOString() } : p
    ));
  };

  const handleQualityChange = (playerId: string, quality: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, quality: quality as any, lastActivity: new Date().toISOString() } : p
    ));
  };

  const handleVolumeChange = (playerId: string, volume: number) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, volume, lastActivity: new Date().toISOString() } : p
    ));
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'playing': return 'green';
      case 'paused': return 'orange';
      case 'loading': return 'blue';
      case 'error': return 'red';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'webrtc': return <ThunderboltOutlined style={{ color: '#1890ff' }} />;
      case 'llhls': return <PlayCircleOutlined style={{ color: '#52c41a' }} />;
      case 'hls': return <VideoCameraOutlined style={{ color: '#fa8c16' }} />;
      case 'dash': return <GlobalOutlined style={{ color: '#722ed1' }} />;
      default: return <PlayCircleOutlined />;
    }
  };

  const playerColumns = [
    {
      title: 'Player Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: PlayerInstance) => (
        <Space>
          {getTypeIcon(record.type)}
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.type.toUpperCase()}
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
        <Tag color={quality === 'high' ? 'green' : quality === 'medium' ? 'orange' : 'blue'}>
          {quality.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Volume',
      dataIndex: 'volume',
      key: 'volume',
      render: (volume: number) => (
        <Space>
          <AudioOutlined />
          <Text>{volume}%</Text>
        </Space>
      ),
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (url: string) => (
        <Space>
          <Text code style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden' }}>
            {url}
          </Text>
          <Tooltip title="Copy URL">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyUrl(url)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: PlayerInstance) => (
        <Space>
          <Tooltip title="Play">
            <Button
              type="text"
              icon={<PlayCircleOutlined />}
              onClick={() => handlePlay(record.id)}
              disabled={record.status === 'playing'}
            />
          </Tooltip>
          <Tooltip title="Pause">
            <Button
              type="text"
              icon={<PauseCircleOutlined />}
              onClick={() => handlePause(record.id)}
              disabled={record.status !== 'playing'}
            />
          </Tooltip>
          <Tooltip title="Stop">
            <Button
              type="text"
              icon={<StopOutlined />}
              onClick={() => handleStop(record.id)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => handleEditPlayer(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <PlayCircleOutlined />
            <span>OvenPlayer Manager</span>
            <Badge count={players.length} color="blue" />
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchPlayers}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={handleCreatePlayer}
            >
              Create Player
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Tabs defaultActiveKey="players">
            <TabPane tab="Players" key="players">
              <Table
                columns={playerColumns}
                dataSource={players}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="small"
                scroll={{ x: 1000 }}
                locale={{
                  emptyText: 'No players found'
                }}
              />
            </TabPane>
            
            <TabPane tab="Player Preview" key="preview">
              <Row gutter={[16, 16]}>
                <Col span={16}>
                  <Card title="Player Preview" size="small">
                    <div style={{ 
                      height: '400px', 
                      background: '#000', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      borderRadius: '8px',
                      border: '1px solid #d9d9d9'
                    }}>
                      <Space direction="vertical" align="center">
                        <PlayCircleOutlined style={{ fontSize: '48px', color: '#fff' }} />
                        <Text style={{ color: '#fff' }}>Player Preview</Text>
                        <Text type="secondary" style={{ color: '#fff' }}>
                          Select a player to preview
                        </Text>
                      </Space>
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card title="Player Controls" size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Quality:</Text>
                        <Select
                          style={{ width: '100%', marginTop: 8 }}
                          value={selectedPlayer ? players.find(p => p.id === selectedPlayer)?.quality : 'auto'}
                          onChange={(value) => selectedPlayer && handleQualityChange(selectedPlayer, value)}
                        >
                          <Option value="auto">Auto</Option>
                          <Option value="high">High</Option>
                          <Option value="medium">Medium</Option>
                          <Option value="low">Low</Option>
                        </Select>
                      </div>
                      <div>
                        <Text strong>Volume:</Text>
                        <InputNumber
                          style={{ width: '100%', marginTop: 8 }}
                          min={0}
                          max={100}
                          value={selectedPlayer ? players.find(p => p.id === selectedPlayer)?.volume : 50}
                          onChange={(value) => selectedPlayer && value && handleVolumeChange(selectedPlayer, value)}
                        />
                      </div>
                      <Divider />
                      <Space>
                        <Button icon={<PlayCircleOutlined />}>Play</Button>
                        <Button icon={<PauseCircleOutlined />}>Pause</Button>
                        <Button icon={<StopOutlined />}>Stop</Button>
                      </Space>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </TabPane>
            
            <TabPane tab="Configuration" key="config">
              <Alert
                message="OvenPlayer Configuration"
                description="OvenPlayer is a JavaScript-based LLHLS and WebRTC Player for OvenMediaEngine. It supports sub-second latency streaming with adaptive bitrate capabilities."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card title="Supported Formats" size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <ThunderboltOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                        <Text strong>WebRTC</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>Ultra-low latency</Text>
                      </div>
                      <div>
                        <PlayCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        <Text strong>LLHLS</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>Low-latency HLS</Text>
                      </div>
                      <div>
                        <VideoCameraOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                        <Text strong>HLS</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>Standard HLS</Text>
                      </div>
                      <div>
                        <GlobalOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                        <Text strong>DASH</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>Dynamic Adaptive Streaming</Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="Features" size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>✅ Sub-second latency</div>
                      <div>✅ Adaptive bitrate</div>
                      <div>✅ Cross-platform support</div>
                      <div>✅ Mobile responsive</div>
                      <div>✅ Custom controls</div>
                      <div>✅ Event handling</div>
                      <div>✅ Quality selection</div>
                      <div>✅ Volume control</div>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Spin>
      </Card>

      {/* Player Creation/Edit Modal */}
      <Modal
        title={editingPlayer ? 'Edit Player' : 'Create Player'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPlayer(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        okText={editingPlayer ? 'Update' : 'Create'}
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
                label="Player Name"
                rules={[{ required: true, message: 'Please enter player name' }]}
              >
                <Input placeholder="e.g., Main Stream Player" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Player Type"
                rules={[{ required: true, message: 'Please select player type' }]}
              >
                <Select placeholder="Select player type">
                  <Option value="llhls">LLHLS</Option>
                  <Option value="webrtc">WebRTC</Option>
                  <Option value="hls">HLS</Option>
                  <Option value="dash">DASH</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="url"
            label="Stream URL"
            rules={[{ required: true, message: 'Please enter stream URL' }]}
          >
            <Input placeholder="e.g., http://192.168.1.102:8080/default/app/llhls/stream" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="quality"
                label="Default Quality"
                initialValue="auto"
              >
                <Select>
                  <Option value="auto">Auto</Option>
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="volume"
                label="Volume"
                initialValue={50}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
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
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="autoplay"
                label="Autoplay"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="controls"
                label="Show Controls"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="muted"
                label="Muted"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="adaptiveBitrate"
                label="Adaptive Bitrate"
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
