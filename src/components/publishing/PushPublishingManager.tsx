import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Alert, 
  Tag, 
  Descriptions, 
  Row, 
  Col, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Switch, 
  Modal, 
  Tabs,
  Progress,
  message,
  Tooltip,
  Statistic,
  Badge
} from 'antd';
import { 
  PlayCircleOutlined, 
  StopOutlined, 
  SettingOutlined, 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  PauseCircleOutlined,
  EyeOutlined,
  BarChartOutlined,
  ReloadOutlined,
  CloudUploadOutlined,
  GlobalOutlined,
  FileOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useStore } from '../../store/useStore';
import { OMEApiService } from '../../services/omeApi';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface Application {
  name: string;
  vhost: string;
}

interface PushPublisher {
  id: string;
  name: string;
  type: 'rtmp' | 'srt' | 'webrtc' | 'hls';
  url: string;
  enabled: boolean;
  streamKey?: string;
  username?: string;
  password?: string;
  quality?: string;
  bitrate?: number;
  resolution?: string;
  framerate?: number;
}

interface StreamInfo {
  vhost: string;
  app: string;
  stream: any;
  pushStatus?: any[];
}

interface StreamPush {
  id: string;
  stream: {
    name: string;
    tracks?: number[];
    variantNames?: string[];
  };
  protocol: 'srt' | 'rtmp' | 'mpegts';
  url: string;
  streamKey?: string;
}

interface StreamPushed {
  id: string;
  stream: { name: string };
  protocol: string;
  url: string;
  state: string;
  sentTime: number;
  totalSentTime: number;
  sentBytes: number;
  startTime: string;
}

export const PushPublishingManager: React.FC = () => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [streams, setStreams] = useState<StreamInfo[]>([]);
  const [publishers, setPublishers] = useState<PushPublisher[]>([]);
  const [pushes, setPushes] = useState<StreamPushed[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [publisherModalVisible, setPublisherModalVisible] = useState(false);
  const [pushModalVisible, setPushModalVisible] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState<PushPublisher | null>(null);
  const [form] = Form.useForm();
  const [pushForm] = Form.useForm();

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const vhosts = await omeApi.getVHosts();
      const allApps: Application[] = [];
      
      for (const vhost of vhosts) {
        const apps = await omeApi.getApplications(vhost.name).catch(() => []);
        for (const app of apps) {
          allApps.push({ name: app.name, vhost: vhost.name });
        }
      }
      
      setApplications(allApps);
      if (allApps.length > 0 && !selectedApp) {
        setSelectedApp(allApps[0]);
      }
    } catch (e: any) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [omeApi, selectedApp]);

  const loadStreams = useCallback(async (app: Application) => {
    if (!app) return;
    
    setLoading(true);
    try {
      const allStreams = await omeApi.getAllStreams();
      const appStreams = allStreams
        .filter(s => s.vhost === app.vhost && s.app === app.name)
        .map(({ vhost, app, stream }) => ({ vhost, app, stream }));

      // Load push publishing status for each stream
      const streamsWithStatus = await Promise.all(
        appStreams.map(async (streamInfo) => {
          try {
            const status = await omeApi.getPushPublishingStatusNew(streamInfo.vhost, streamInfo.app, streamInfo.stream.name);
            return { ...streamInfo, pushStatus: status };
          } catch {
            return streamInfo;
          }
        })
      );

      setStreams(streamsWithStatus);
    } catch (e: any) {
      setError('Failed to load streams');
    } finally {
      setLoading(false);
    }
  }, [omeApi]);

  const loadPublishers = useCallback(async (app: Application) => {
    if (!app) return;
    
    try {
      const publishers = await omeApi.getPushPublishers(app.vhost, app.name);
      setPublishers(publishers);
    } catch (e: any) {
      console.warn('Failed to load publishers');
    }
  }, [omeApi]);

  const loadPushes = useCallback(async (app: Application) => {
    if (!app) return;
    
    try {
      const pushes = await omeApi.getPushPublishingStatus(app.vhost, app.name);
      setPushes(pushes);
    } catch (e: any) {
      console.warn('Failed to load pushes');
    }
  }, [omeApi]);

  const loadStats = useCallback(async (app: Application) => {
    if (!app) return;
    
    try {
      const stats = await omeApi.getPushPublishingStats(app.vhost, app.name);
      setStats(stats);
    } catch (e: any) {
      console.warn('Failed to load stats');
    }
  }, [omeApi]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    if (selectedApp) {
      loadStreams(selectedApp);
      loadPublishers(selectedApp);
      loadPushes(selectedApp);
      loadStats(selectedApp);
    }
  }, [selectedApp, loadStreams, loadPublishers, loadPushes, loadStats]);

  const handleCreatePublisher = () => {
    setEditingPublisher(null);
    form.resetFields();
    setPublisherModalVisible(true);
  };

  const handleEditPublisher = (publisher: PushPublisher) => {
    setEditingPublisher(publisher);
    form.setFieldsValue(publisher);
    setPublisherModalVisible(true);
  };

  const handleDeletePublisher = async (publisherId: string) => {
    if (!selectedApp) return;
    
    try {
      await omeApi.deletePushPublisher(selectedApp.vhost, selectedApp.name, publisherId);
      message.success('Publisher deleted successfully');
      loadPublishers(selectedApp);
    } catch (e: any) {
      message.error('Failed to delete publisher');
    }
  };

  const handleSavePublisher = async (values: any) => {
    if (!selectedApp) return;
    
    try {
      if (editingPublisher) {
        await omeApi.updatePushPublisher(selectedApp.vhost, selectedApp.name, editingPublisher.id, values);
        message.success('Publisher updated successfully');
      } else {
        await omeApi.createPushPublisher(selectedApp.vhost, selectedApp.name, values);
        message.success('Publisher created successfully');
      }
      setPublisherModalVisible(false);
      loadPublishers(selectedApp);
    } catch (e: any) {
      message.error('Failed to save publisher');
    }
  };

  const handleStartPush = async (values: any) => {
    if (!selectedApp) return;
    
    try {
      const pushData: StreamPush = {
        id: values.id,
        stream: {
          name: values.streamName,
          tracks: values.tracks ? values.tracks.split(',').map((t: string) => parseInt(t.trim())) : [],
          variantNames: values.variantNames ? values.variantNames.split(',').map((name: string) => name.trim()) : [],
        },
        protocol: values.protocol,
        url: values.url,
        streamKey: values.streamKey,
      };

      await omeApi.startPushPublishing(selectedApp.vhost, selectedApp.name, pushData);
      message.success('Push publishing started successfully');
      setPushModalVisible(false);
      pushForm.resetFields();
      loadPushes(selectedApp);
    } catch (error) {
      message.error('Failed to start push publishing');
      console.error('Error starting push:', error);
    }
  };

  const handleStopPush = async (pushId: string) => {
    if (!selectedApp) return;

    try {
      await omeApi.stopPushPublishing(selectedApp.vhost, selectedApp.name, pushId);
      message.success('Push publishing stopped successfully');
      loadPushes(selectedApp);
    } catch (error) {
      message.error('Failed to stop push publishing');
      console.error('Error stopping push:', error);
    }
  };

  const handleStartPublishing = async (stream: StreamInfo, publisherId: string) => {
    try {
      await omeApi.startPushPublishingNew(stream.vhost, stream.app, stream.stream.name, publisherId);
      message.success('Push publishing started');
      loadStreams(selectedApp!);
    } catch (e: any) {
      message.error('Failed to start push publishing');
    }
  };

  const handleStopPublishing = async (stream: StreamInfo, publisherId: string) => {
    try {
      await omeApi.stopPushPublishingNew(stream.vhost, stream.app, stream.stream.name, publisherId);
      message.success('Push publishing stopped');
      loadStreams(selectedApp!);
    } catch (e: any) {
      message.error('Failed to stop push publishing');
    }
  };

  const getPushStatusColor = (state: string) => {
    switch (state) {
      case 'ready': return 'blue';
      case 'connecting': return 'orange';
      case 'pushing': return 'green';
      case 'stopping': return 'orange';
      case 'stopped': return 'gray';
      case 'error': return 'red';
      default: return 'default';
    }
  };

  const getProtocolIcon = (protocol: string) => {
    switch (protocol) {
      case 'srt': return <GlobalOutlined />;
      case 'rtmp': return <CloudUploadOutlined />;
      case 'mpegts': return <FileOutlined />;
      default: return <SendOutlined />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const publisherColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'rtmp' ? 'red' : type === 'srt' ? 'blue' : type === 'webrtc' ? 'green' : 'orange'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (url: string) => (
        <Text code style={{ fontSize: '12px' }}>{url}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? 'Enabled' : 'Disabled'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: PushPublisher) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditPublisher(record)}
          >
            Edit
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDeletePublisher(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const streamColumns = [
    {
      title: 'Stream Name',
      dataIndex: ['stream', 'name'],
      key: 'name',
    },
    {
      title: 'State',
      dataIndex: ['stream', 'state'],
      key: 'state',
      render: (state: string) => (
        <Tag color={state === 'streaming' ? 'green' : 'red'}>
          {state}
        </Tag>
      ),
    },
    {
      title: 'Push Publishers',
      key: 'publishers',
      render: (_, record: StreamInfo) => {
        const activePublishers = record.pushStatus?.filter(p => p.active) || [];
        return (
          <Space wrap>
            {activePublishers.map((pub, index) => (
              <Badge key={index} count={1} color="green">
                <Tag color="blue">{pub.name}</Tag>
              </Badge>
            ))}
            {activePublishers.length === 0 && (
              <Text type="secondary">No active publishers</Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: StreamInfo) => (
        <Space>
          {publishers.map(publisher => {
            const isActive = record.pushStatus?.some(p => p.id === publisher.id && p.active);
            return (
              <Button
                key={publisher.id}
                icon={isActive ? <StopOutlined /> : <PlayCircleOutlined />}
                size="small"
                type={isActive ? 'default' : 'primary'}
                onClick={() => isActive 
                  ? handleStopPublishing(record, publisher.id)
                  : handleStartPublishing(record, publisher.id)
                }
                disabled={record.stream.state !== 'streaming'}
              >
                {isActive ? 'Stop' : 'Start'} {publisher.name}
              </Button>
            );
          })}
        </Space>
      ),
    },
  ];

  const pushColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text code>{id}</Text>
      ),
    },
    {
      title: 'Stream',
      dataIndex: 'stream',
      key: 'stream',
      render: (stream: { name: string }) => (
        <Space>
          <SendOutlined />
          <Text strong>{stream.name}</Text>
        </Space>
      ),
    },
    {
      title: 'Protocol',
      dataIndex: 'protocol',
      key: 'protocol',
      render: (protocol: string) => (
        <Space>
          {getProtocolIcon(protocol)}
          <Tag color="blue">{protocol.toUpperCase()}</Tag>
        </Space>
      ),
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (url: string) => (
        <Text code style={{ fontSize: '12px' }}>{url}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'state',
      key: 'state',
      render: (state: string) => (
        <Tag color={getPushStatusColor(state)}>
          {state.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (push: StreamPushed) => {
        if (push.state === 'pushing') {
          const progress = push.totalSentTime > 0 ? (push.sentTime / push.totalSentTime) * 100 : 0;
          return (
            <Progress
              percent={Math.round(progress)}
              size="small"
              status={'active'}
            />
          );
        }
        return '-';
      },
    },
    {
      title: 'Duration',
      dataIndex: 'sentTime',
      key: 'duration',
      render: (sentTime: number) => formatDuration(sentTime),
    },
    {
      title: 'Data Sent',
      dataIndex: 'sentBytes',
      key: 'dataSent',
      render: (sentBytes: number) => formatBytes(sentBytes),
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (startTime: string) => dayjs(startTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (push: StreamPushed) => (
        <Space>
          {push.state === 'pushing' && (
            <Tooltip title="Stop Push">
              <Button
                type="text"
                danger
                icon={<StopOutlined />}
                onClick={() => handleStopPush(push.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const getTotalStats = () => {
    const activePushes = pushes.filter(p => p.state === 'pushing');
    const totalDataSent = pushes.reduce((sum, p) => sum + p.sentBytes, 0);
    const totalDuration = pushes.reduce((sum, p) => sum + p.sentTime, 0);
    
    return {
      active: activePushes.length,
      total: pushes.length,
      totalDataSent,
      totalDuration,
    };
  };

  const totalStats = getTotalStats();

  const generateSRTUrl = (host: string, port: number, streamKey?: string) => {
    return `srt://${host}:${port}?mode=caller&latency=120000&timeout=500000${streamKey ? `&streamid=${streamKey}` : ''}`;
  };

  const generateRTMPUrl = (host: string, port: number, app: string, streamKey: string) => {
    return `rtmp://${host}:${port}/${app}/${streamKey}`;
  };

  const generateMPEGTSUrl = (host: string, port: number) => {
    return `udp://${host}:${port}`;
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {error && <Alert type="error" message={error} showIcon />}
      
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Push Publishing Management</Title>}
        extra={
          <Space>
            <Select
              style={{ width: 200 }}
              placeholder="Select Application"
              value={selectedApp ? `${selectedApp.vhost}/${selectedApp.name}` : undefined}
              onChange={(value) => {
                const [vhost, name] = value.split('/');
                setSelectedApp({ vhost, name });
              }}
            >
              {applications.map(app => (
                <Option key={`${app.vhost}/${app.name}`} value={`${app.vhost}/${app.name}`}>
                  {app.vhost}/{app.name}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setPushModalVisible(true)}
              disabled={!selectedApp}
            >
              Start Push
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={handleCreatePublisher}
              disabled={!selectedApp}
            >
              New Publisher
            </Button>
          </Space>
        }
      >
        {selectedApp && (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Active Pushes"
                    value={totalStats.active}
                    prefix={<PlayCircleOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Pushes"
                    value={totalStats.total}
                    prefix={<SendOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Data Sent"
                    value={formatBytes(totalStats.totalDataSent)}
                    prefix={<FileOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Duration"
                    value={formatDuration(totalStats.totalDuration)}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Tabs defaultActiveKey="pushes">
              <TabPane tab="Active Pushes" key="pushes">
                <Table
                  columns={pushColumns}
                  dataSource={pushes}
                  loading={loading}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1200 }}
                />
              </TabPane>
              <TabPane tab="Publishers" key="publishers">
                <Table
                  columns={publisherColumns}
                  dataSource={publishers}
                  loading={loading}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </TabPane>
              <TabPane tab="Streams" key="streams">
                <Table
                  columns={streamColumns}
                  dataSource={streams}
                  loading={loading}
                  rowKey={(record) => `${record.vhost}-${record.app}-${record.stream.name}`}
                  pagination={false}
                  size="small"
                />
              </TabPane>
              <TabPane tab="Statistics" key="stats">
                {stats ? (
                  <Row gutter={16}>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="Total Publishers"
                          value={stats.totalPublishers || 0}
                          prefix={<SendOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="Active Publishers"
                          value={stats.activePublishers || 0}
                          prefix={<PlayCircleOutlined />}
                          valueStyle={{ color: '#3f8600' }}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="Total Streams"
                          value={stats.totalStreams || 0}
                          prefix={<EyeOutlined />}
                        />
                      </Card>
                    </Col>
                  </Row>
                ) : (
                  <Text type="secondary">No statistics available</Text>
                )}
              </TabPane>
            </Tabs>
          </>
        )}
      </Card>

      {/* Publisher Modal */}
      <Modal
        title={editingPublisher ? 'Edit Publisher' : 'Create Publisher'}
        open={publisherModalVisible}
        onCancel={() => setPublisherModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSavePublisher}
        >
          <Form.Item
            name="name"
            label="Publisher Name"
            rules={[{ required: true, message: 'Please enter publisher name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select type' }]}
          >
            <Select>
              <Option value="rtmp">RTMP</Option>
              <Option value="srt">SRT</Option>
              <Option value="webrtc">WebRTC</Option>
              <Option value="hls">HLS</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="url"
            label="URL"
            rules={[{ required: true, message: 'Please enter URL' }]}
          >
            <Input placeholder="rtmp://example.com/live" />
          </Form.Item>
          <Form.Item
            name="streamKey"
            label="Stream Key"
          >
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Username"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="password"
                label="Password"
              >
                <Input.Password />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="enabled"
            label="Enabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Start Push Modal */}
      <Modal
        title="Start Push Publishing"
        open={pushModalVisible}
        onCancel={() => {
          setPushModalVisible(false);
          pushForm.resetFields();
        }}
        onOk={() => pushForm.submit()}
        width={700}
      >
        <Form
          form={pushForm}
          layout="vertical"
          onFinish={handleStartPush}
        >
          <Tabs defaultActiveKey="basic">
            <TabPane tab="Basic" key="basic">
              <Form.Item
                name="id"
                label="Push ID"
                rules={[{ required: true, message: 'Please enter push ID' }]}
              >
                <Input placeholder="e.g., push_001" />
              </Form.Item>

              <Form.Item
                name="streamName"
                label="Stream Name"
                rules={[{ required: true, message: 'Please enter stream name' }]}
              >
                <Input placeholder="e.g., stream_001" />
              </Form.Item>

              <Form.Item
                name="protocol"
                label="Protocol"
                rules={[{ required: true, message: 'Please select protocol' }]}
              >
                <Select placeholder="Select protocol">
                  <Option value="srt">SRT</Option>
                  <Option value="rtmp">RTMP</Option>
                  <Option value="mpegts">MPEG-TS</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="url"
                label="Destination URL"
                rules={[{ required: true, message: 'Please enter destination URL' }]}
              >
                <Input placeholder="e.g., srt://destination.com:9999" />
              </Form.Item>

              <Form.Item
                name="streamKey"
                label="Stream Key"
                tooltip="Optional stream key for RTMP or SRT"
              >
                <Input placeholder="Enter stream key" />
              </Form.Item>

              <Form.Item
                name="variantNames"
                label="Variant Names (comma-separated)"
                tooltip="Leave empty to push all tracks"
              >
                <Input placeholder="e.g., h264_fhd, aac" />
              </Form.Item>

              <Form.Item
                name="tracks"
                label="Track IDs (comma-separated)"
                tooltip="Leave empty to push all tracks"
              >
                <Input placeholder="e.g., 0, 1, 2" />
              </Form.Item>
            </TabPane>

            <TabPane tab="Templates" key="templates">
              <Alert
                message="URL Templates"
                description="Use these templates to generate common push URLs"
                type="info"
                style={{ marginBottom: 16 }}
              />

              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small" title="SRT Template">
                    <Text code style={{ fontSize: '12px' }}>
                      srt://host:port?mode=caller&latency=120000&timeout=500000
                    </Text>
                    <Button
                      size="small"
                      style={{ marginTop: 8 }}
                      onClick={() => {
                        const host = prompt('Enter host:');
                        const port = prompt('Enter port:', '9999');
                        const streamKey = prompt('Enter stream key (optional):');
                        if (host && port) {
                          pushForm.setFieldsValue({
                            protocol: 'srt',
                            url: generateSRTUrl(host, parseInt(port), streamKey || undefined)
                          });
                        }
                      }}
                    >
                      Use Template
                    </Button>
                  </Card>
                </Col>

                <Col span={8}>
                  <Card size="small" title="RTMP Template">
                    <Text code style={{ fontSize: '12px' }}>
                      rtmp://host:port/app/stream
                    </Text>
                    <Button
                      size="small"
                      style={{ marginTop: 8 }}
                      onClick={() => {
                        const host = prompt('Enter host:');
                        const port = prompt('Enter port:', '1935');
                        const app = prompt('Enter app name:', 'live');
                        const streamKey = prompt('Enter stream key:');
                        if (host && port && app && streamKey) {
                          pushForm.setFieldsValue({
                            protocol: 'rtmp',
                            url: generateRTMPUrl(host, parseInt(port), app, streamKey),
                            streamKey: streamKey
                          });
                        }
                      }}
                    >
                      Use Template
                    </Button>
                  </Card>
                </Col>

                <Col span={8}>
                  <Card size="small" title="MPEG-TS Template">
                    <Text code style={{ fontSize: '12px' }}>
                      udp://host:port
                    </Text>
                    <Button
                      size="small"
                      style={{ marginTop: 8 }}
                      onClick={() => {
                        const host = prompt('Enter host:');
                        const port = prompt('Enter port:', '1234');
                        if (host && port) {
                          pushForm.setFieldsValue({
                            protocol: 'mpegts',
                            url: generateMPEGTSUrl(host, parseInt(port))
                          });
                        }
                      }}
                    >
                      Use Template
                    </Button>
                  </Card>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Form>
      </Modal>
    </Space>
  );
};
