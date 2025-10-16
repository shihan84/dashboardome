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
  Descriptions,
  Timeline,
  Slider,
  ColorPicker,
  Upload,
  Drawer
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
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
  DownloadOutlined,
  PictureOutlined,
  FontSizeOutlined,
  BorderOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  SwapOutlined,
  DragOutlined,
  CopyOutlined,
  ScissorOutlined,
  FilterOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  BgColorsOutlined,
  FontColorsOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined
} from '@ant-design/icons';
import { OMEApiService } from '../../services/omeApi';
import { useStore } from '../../store/useStore';

const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface MultiplexChannel {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'running' | 'paused' | 'error';
  outputFormat: 'hls' | 'dash' | 'rtmp' | 'srt' | 'webrtc';
  outputUrl: string;
  resolution: string;
  framerate: number;
  bitrate: number;
  quality: 'high' | 'medium' | 'low' | 'adaptive';
  layout: 'grid' | 'picture-in-picture' | 'side-by-side' | 'custom';
  gridColumns: number;
  gridRows: number;
  sources: MultiplexSource[];
  overlays: MultiplexOverlay[];
  transitions: MultiplexTransition[];
  audioMix: AudioMixSettings;
  videoEffects: VideoEffectSettings;
  enabled: boolean;
  autoStart: boolean;
  createdAt: string;
  lastRun?: string;
  runCount: number;
  successCount: number;
  errorCount: number;
  errorMessage?: string;
}

interface MultiplexSource {
  id: string;
  name: string;
  type: 'stream' | 'file' | 'url' | 'camera' | 'screen';
  sourcePath: string;
  position: { x: number; y: number; width: number; height: number };
  zIndex: number;
  visible: boolean;
  muted: boolean;
  volume: number;
  opacity: number;
  rotation: number;
  scale: number;
  filters: string[];
  crop: { x: number; y: number; width: number; height: number };
  aspectRatio: '16:9' | '4:3' | '1:1' | 'custom';
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffset: { x: number; y: number };
}

interface MultiplexOverlay {
  id: string;
  name: string;
  type: 'text' | 'image' | 'logo' | 'clock' | 'weather' | 'social';
  content: string;
  position: { x: number; y: number; width: number; height: number };
  zIndex: number;
  visible: boolean;
  opacity: number;
  rotation: number;
  scale: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontColor: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: number;
  alignment: 'left' | 'center' | 'right';
  animation: 'none' | 'fade' | 'slide' | 'bounce' | 'pulse';
  duration: number;
  delay: number;
}

interface MultiplexTransition {
  id: string;
  name: string;
  type: 'fade' | 'slide' | 'wipe' | 'zoom' | 'rotate' | 'custom';
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  direction: 'left' | 'right' | 'up' | 'down' | 'in' | 'out';
  trigger: 'manual' | 'time' | 'event';
  triggerTime?: number;
  triggerEvent?: string;
}

interface AudioMixSettings {
  masterVolume: number;
  sources: {
    sourceId: string;
    volume: number;
    pan: number;
    mute: boolean;
    effects: string[];
  }[];
  outputChannels: number;
  sampleRate: number;
  bitDepth: number;
  compression: boolean;
  normalization: boolean;
  limiter: boolean;
}

interface VideoEffectSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  gamma: number;
  blur: number;
  sharpen: number;
  noise: number;
  vignette: number;
  sepia: boolean;
  grayscale: boolean;
  invert: boolean;
  colorize: boolean;
  colorizeColor: string;
  colorizeAmount: number;
}

const MultiplexChannelsManager: React.FC = () => {
  const [channels, setChannels] = useState<MultiplexChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [channelModalVisible, setChannelModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [editingChannel, setEditingChannel] = useState<MultiplexChannel | null>(null);
  const [previewChannel, setPreviewChannel] = useState<MultiplexChannel | null>(null);
  const [channelForm] = Form.useForm();
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  useEffect(() => {
    loadChannels();
    const interval = setInterval(() => {
      loadChannels();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadChannels = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual OME API calls when available
      const mockChannels: MultiplexChannel[] = [
        {
          id: '1',
          name: 'News Studio',
          description: 'Multi-camera news studio with graphics overlay',
          status: 'running',
          outputFormat: 'hls',
          outputUrl: 'https://multiplex.example.com/news_studio.m3u8',
          resolution: '1920x1080',
          framerate: 30,
          bitrate: 4000,
          quality: 'high',
          layout: 'grid',
          gridColumns: 2,
          gridRows: 2,
          sources: [
            {
              id: '1',
              name: 'Main Camera',
              type: 'camera',
              sourcePath: 'rtmp://camera1.example.com/live',
              position: { x: 0, y: 0, width: 960, height: 540 },
              zIndex: 1,
              visible: true,
              muted: false,
              volume: 80,
              opacity: 100,
              rotation: 0,
              scale: 1,
              filters: [],
              crop: { x: 0, y: 0, width: 1920, height: 1080 },
              aspectRatio: '16:9',
              backgroundColor: '#000000',
              borderColor: '#ffffff',
              borderWidth: 2,
              borderRadius: 0,
              shadow: true,
              shadowColor: '#000000',
              shadowBlur: 5,
              shadowOffset: { x: 2, y: 2 }
            },
            {
              id: '2',
              name: 'Graphics Overlay',
              type: 'url',
              sourcePath: 'https://graphics.example.com/news_overlay.html',
              position: { x: 0, y: 0, width: 1920, height: 1080 },
              zIndex: 10,
              visible: true,
              muted: true,
              volume: 0,
              opacity: 90,
              rotation: 0,
              scale: 1,
              filters: [],
              crop: { x: 0, y: 0, width: 1920, height: 1080 },
              aspectRatio: '16:9',
              backgroundColor: 'transparent',
              borderColor: 'transparent',
              borderWidth: 0,
              borderRadius: 0,
              shadow: false,
              shadowColor: 'transparent',
              shadowBlur: 0,
              shadowOffset: { x: 0, y: 0 }
            }
          ],
          overlays: [
            {
              id: '1',
              name: 'News Ticker',
              type: 'text',
              content: 'Breaking News: Latest updates from around the world...',
              position: { x: 0, y: 1000, width: 1920, height: 80 },
              zIndex: 20,
              visible: true,
              opacity: 95,
              rotation: 0,
              scale: 1,
              fontFamily: 'Arial',
              fontSize: 24,
              fontWeight: 'bold',
              fontColor: '#ffffff',
              backgroundColor: '#000000',
              borderColor: '#ff0000',
              borderWidth: 2,
              borderRadius: 0,
              padding: 10,
              alignment: 'left',
              animation: 'slide',
              duration: 30,
              delay: 0
            }
          ],
          transitions: [],
          audioMix: {
            masterVolume: 85,
            sources: [
              { sourceId: '1', volume: 80, pan: 0, mute: false, effects: [] },
              { sourceId: '2', volume: 0, pan: 0, mute: true, effects: [] }
            ],
            outputChannels: 2,
            sampleRate: 48000,
            bitDepth: 16,
            compression: true,
            normalization: true,
            limiter: true
          },
          videoEffects: {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            hue: 0,
            gamma: 0,
            blur: 0,
            sharpen: 0,
            noise: 0,
            vignette: 0,
            sepia: false,
            grayscale: false,
            invert: false,
            colorize: false,
            colorizeColor: '#ff0000',
            colorizeAmount: 0
          },
          enabled: true,
          autoStart: true,
          createdAt: '2024-01-15T10:00:00Z',
          lastRun: '2024-01-15T10:00:00Z',
          runCount: 25,
          successCount: 24,
          errorCount: 1
        },
        {
          id: '2',
          name: 'Sports Multi-View',
          description: 'Multi-angle sports coverage with statistics',
          status: 'active',
          outputFormat: 'hls',
          outputUrl: 'https://multiplex.example.com/sports_multi.m3u8',
          resolution: '1920x1080',
          framerate: 60,
          bitrate: 6000,
          quality: 'high',
          layout: 'picture-in-picture',
          gridColumns: 1,
          gridRows: 1,
          sources: [
            {
              id: '1',
              name: 'Main Game Feed',
              type: 'stream',
              sourcePath: 'rtmp://sports.example.com/main_feed',
              position: { x: 0, y: 0, width: 1920, height: 1080 },
              zIndex: 1,
              visible: true,
              muted: false,
              volume: 90,
              opacity: 100,
              rotation: 0,
              scale: 1,
              filters: [],
              crop: { x: 0, y: 0, width: 1920, height: 1080 },
              aspectRatio: '16:9',
              backgroundColor: '#000000',
              borderColor: '#ffffff',
              borderWidth: 0,
              borderRadius: 0,
              shadow: false,
              shadowColor: 'transparent',
              shadowBlur: 0,
              shadowOffset: { x: 0, y: 0 }
            },
            {
              id: '2',
              name: 'Replay Camera',
              type: 'stream',
              sourcePath: 'rtmp://sports.example.com/replay_feed',
              position: { x: 1400, y: 20, width: 500, height: 280 },
              zIndex: 2,
              visible: true,
              muted: true,
              volume: 0,
              opacity: 100,
              rotation: 0,
              scale: 1,
              filters: [],
              crop: { x: 0, y: 0, width: 1920, height: 1080 },
              aspectRatio: '16:9',
              backgroundColor: '#000000',
              borderColor: '#ff0000',
              borderWidth: 3,
              borderRadius: 8,
              shadow: true,
              shadowColor: '#000000',
              shadowBlur: 10,
              shadowOffset: { x: 3, y: 3 }
            }
          ],
          overlays: [
            {
              id: '1',
              name: 'Score Display',
              type: 'text',
              content: 'HOME 24 - 18 AWAY',
              position: { x: 50, y: 50, width: 400, height: 100 },
              zIndex: 20,
              visible: true,
              opacity: 95,
              rotation: 0,
              scale: 1,
              fontFamily: 'Arial',
              fontSize: 36,
              fontWeight: 'bold',
              fontColor: '#ffffff',
              backgroundColor: '#000000',
              borderColor: '#ff0000',
              borderWidth: 2,
              borderRadius: 10,
              padding: 15,
              alignment: 'center',
              animation: 'pulse',
              duration: 2,
              delay: 0
            }
          ],
          transitions: [
            {
              id: '1',
              name: 'Replay Transition',
              type: 'fade',
              duration: 1000,
              easing: 'ease-in-out',
              direction: 'in',
              trigger: 'manual',
              triggerEvent: 'replay_trigger'
            }
          ],
          audioMix: {
            masterVolume: 90,
            sources: [
              { sourceId: '1', volume: 90, pan: 0, mute: false, effects: ['compression'] },
              { sourceId: '2', volume: 0, pan: 0, mute: true, effects: [] }
            ],
            outputChannels: 2,
            sampleRate: 48000,
            bitDepth: 16,
            compression: true,
            normalization: true,
            limiter: true
          },
          videoEffects: {
            brightness: 5,
            contrast: 10,
            saturation: 5,
            hue: 0,
            gamma: 0,
            blur: 0,
            sharpen: 5,
            noise: 0,
            vignette: 0,
            sepia: false,
            grayscale: false,
            invert: false,
            colorize: false,
            colorizeColor: '#ff0000',
            colorizeAmount: 0
          },
          enabled: true,
          autoStart: true,
          createdAt: '2024-01-12T14:00:00Z',
          lastRun: '2024-01-15T14:00:00Z',
          runCount: 8,
          successCount: 8,
          errorCount: 0
        }
      ];
      setChannels(mockChannels);
    } catch (error) {
      message.error('Failed to load multiplex channels');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async (values: any) => {
    try {
      const newChannel: MultiplexChannel = {
        id: Date.now().toString(),
        name: values.name,
        description: values.description,
        status: 'inactive',
        outputFormat: values.outputFormat,
        outputUrl: values.outputUrl,
        resolution: values.resolution,
        framerate: values.framerate,
        bitrate: values.bitrate,
        quality: values.quality,
        layout: values.layout,
        gridColumns: values.gridColumns || 2,
        gridRows: values.gridRows || 2,
        sources: [],
        overlays: [],
        transitions: [],
        audioMix: {
          masterVolume: 85,
          sources: [],
          outputChannels: 2,
          sampleRate: 48000,
          bitDepth: 16,
          compression: true,
          normalization: true,
          limiter: true
        },
        videoEffects: {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          hue: 0,
          gamma: 0,
          blur: 0,
          sharpen: 0,
          noise: 0,
          vignette: 0,
          sepia: false,
          grayscale: false,
          invert: false,
          colorize: false,
          colorizeColor: '#ff0000',
          colorizeAmount: 0
        },
        enabled: values.enabled,
        autoStart: values.autoStart,
        createdAt: new Date().toISOString(),
        runCount: 0,
        successCount: 0,
        errorCount: 0
      };
      
      setChannels(prev => [...prev, newChannel]);
      setChannelModalVisible(false);
      channelForm.resetFields();
      message.success('Multiplex channel created successfully');
    } catch (error) {
      message.error('Failed to create multiplex channel');
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
      message.success('Multiplex channel updated successfully');
    } catch (error) {
      message.error('Failed to update multiplex channel');
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    try {
      setChannels(prev => prev.filter(channel => channel.id !== channelId));
      message.success('Multiplex channel deleted successfully');
    } catch (error) {
      message.error('Failed to delete multiplex channel');
    }
  };

  const handleToggleChannel = async (channelId: string, enabled: boolean) => {
    try {
      setChannels(prev => prev.map(channel => 
        channel.id === channelId 
          ? { ...channel, enabled, status: enabled ? 'active' : 'inactive' }
          : channel
      ));
      message.success(`Multiplex channel ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      message.error('Failed to toggle multiplex channel');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'running': return 'processing';
      case 'paused': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getLayoutIcon = (layout: string) => {
    switch (layout) {
      case 'grid': return <BorderOutlined />;
      case 'picture-in-picture': return <PictureOutlined />;
      case 'side-by-side': return <SwapOutlined />;
      case 'custom': return <SettingOutlined />;
      default: return <VideoCameraOutlined />;
    }
  };

  const channelColumns = [
    {
      title: 'Channel',
      key: 'channel',
      render: (record: MultiplexChannel) => (
        <Space>
          <Avatar icon={getLayoutIcon(record.layout)} />
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
      title: 'Layout',
      dataIndex: 'layout',
      key: 'layout',
      render: (layout: string, record: MultiplexChannel) => (
        <Space direction="vertical" size="small">
          <Tag color="blue" icon={getLayoutIcon(layout)}>
            {layout.toUpperCase()}
          </Tag>
          {layout === 'grid' && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {record.gridColumns}x{record.gridRows}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: MultiplexChannel) => (
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
      title: 'Sources',
      key: 'sources',
      render: (record: MultiplexChannel) => (
        <Space direction="vertical" size="small">
          <Text>{record.sources.length} sources</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.sources.filter(s => s.visible).length} visible
          </Text>
        </Space>
      )
    },
    {
      title: 'Overlays',
      key: 'overlays',
      render: (record: MultiplexChannel) => (
        <Space direction="vertical" size="small">
          <Text>{record.overlays.length} overlays</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.overlays.filter(o => o.visible).length} visible
          </Text>
        </Space>
      )
    },
    {
      title: 'Output',
      key: 'output',
      render: (record: MultiplexChannel) => (
        <Space direction="vertical" size="small">
          <Tag color="green">{record.outputFormat.toUpperCase()}</Tag>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.resolution} @ {record.framerate}fps
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.bitrate}kbps
          </Text>
        </Space>
      )
    },
    {
      title: 'Statistics',
      key: 'stats',
      render: (record: MultiplexChannel) => (
        <Space direction="vertical" size="small">
          <Text>Runs: {record.runCount}</Text>
          <Text>Success: {record.successCount}</Text>
          <Text>Errors: {record.errorCount}</Text>
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: MultiplexChannel) => (
        <Space>
          <Tooltip title="Preview">
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => {
                setPreviewChannel(record);
                setPreviewModalVisible(true);
              }}
            />
          </Tooltip>
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

  const activeChannels = channels.filter(c => c.status === 'active' || c.status === 'running').length;
  const totalChannels = channels.length;
  const totalSources = channels.reduce((sum, c) => sum + c.sources.length, 0);
  const totalOverlays = channels.reduce((sum, c) => sum + c.overlays.length, 0);

  return (
    <div>
      {/* Multiplex Channels Statistics */}
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
              title="Total Sources"
              value={totalSources}
              prefix={<VideoCameraOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Overlays"
              value={totalOverlays}
              prefix={<PictureOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Multiplex Channels Info Alert */}
      <Alert
        message="Multiplex Channels Management"
        description="Create and manage multi-source content aggregation with advanced layout controls, overlays, transitions, and real-time mixing capabilities."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Quick Actions */}
      <Card title="Quick Actions" style={{ marginBottom: 24 }}>
        <Space wrap>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setChannelModalVisible(true)}
          >
            Add Multiplex Channel
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
        title="Multiplex Channels"
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

      {/* Add/Edit Channel Modal */}
      <Modal
        title={editingChannel ? "Edit Multiplex Channel" : "Add Multiplex Channel"}
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
                <Input placeholder="e.g., News Studio" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="layout"
                label="Layout Type"
                rules={[{ required: true, message: 'Please select layout type' }]}
                initialValue="grid"
              >
                <Select>
                  <Option value="grid">Grid Layout</Option>
                  <Option value="picture-in-picture">Picture-in-Picture</Option>
                  <Option value="side-by-side">Side-by-Side</Option>
                  <Option value="custom">Custom Layout</Option>
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

          <Divider>Output Settings</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="outputFormat"
                label="Output Format"
                rules={[{ required: true, message: 'Please select output format' }]}
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
                initialValue={4000}
              >
                <InputNumber min={1000} max={20000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
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
          </Row>

          <Form.Item
            name="outputUrl"
            label="Output URL"
            rules={[{ required: true, message: 'Please enter output URL' }]}
          >
            <Input placeholder="e.g., https://multiplex.example.com/channel.m3u8" />
          </Form.Item>

          <Divider>Grid Settings</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="gridColumns"
                label="Grid Columns"
                initialValue={2}
              >
                <InputNumber min={1} max={8} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gridRows"
                label="Grid Rows"
                initialValue={2}
              >
                <InputNumber min={1} max={8} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Advanced Settings</Divider>

          <Row gutter={16}>
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
          </Row>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Drawer
        title={`Preview: ${previewChannel?.name}`}
        placement="right"
        width={800}
        open={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        extra={
          <Space>
            <Button icon={<PlayCircleOutlined />} type="primary">
              Start Preview
            </Button>
            <Button icon={<StopOutlined />}>
              Stop Preview
            </Button>
          </Space>
        }
      >
        {previewChannel && (
          <div>
            <Card title="Channel Information" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Status">
                  <Badge status={getStatusColor(previewChannel.status)} text={previewChannel.status} />
                </Descriptions.Item>
                <Descriptions.Item label="Layout">
                  <Tag icon={getLayoutIcon(previewChannel.layout)}>
                    {previewChannel.layout}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Resolution">
                  {previewChannel.resolution}
                </Descriptions.Item>
                <Descriptions.Item label="Frame Rate">
                  {previewChannel.framerate} fps
                </Descriptions.Item>
                <Descriptions.Item label="Bitrate">
                  {previewChannel.bitrate} kbps
                </Descriptions.Item>
                <Descriptions.Item label="Quality">
                  <Tag color="green">{previewChannel.quality}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Sources" style={{ marginBottom: 16 }}>
              <List
                dataSource={previewChannel.sources}
                renderItem={(source) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<VideoCameraOutlined />} />}
                      title={source.name}
                      description={
                        <Space direction="vertical" size="small">
                          <Text type="secondary">{source.type} - {source.sourcePath}</Text>
                          <Space>
                            <Tag color={source.visible ? 'green' : 'red'}>
                              {source.visible ? 'Visible' : 'Hidden'}
                            </Tag>
                            <Tag color={source.muted ? 'red' : 'green'}>
                              {source.muted ? 'Muted' : 'Audio'}
                            </Tag>
                            <Text type="secondary">Volume: {source.volume}%</Text>
                          </Space>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>

            <Card title="Overlays">
              <List
                dataSource={previewChannel.overlays}
                renderItem={(overlay) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<PictureOutlined />} />}
                      title={overlay.name}
                      description={
                        <Space direction="vertical" size="small">
                          <Text type="secondary">{overlay.type} - {overlay.content}</Text>
                          <Space>
                            <Tag color={overlay.visible ? 'green' : 'red'}>
                              {overlay.visible ? 'Visible' : 'Hidden'}
                            </Tag>
                            <Text type="secondary">Opacity: {overlay.opacity}%</Text>
                            {overlay.animation !== 'none' && (
                              <Tag color="blue">{overlay.animation}</Tag>
                            )}
                          </Space>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default MultiplexChannelsManager;
