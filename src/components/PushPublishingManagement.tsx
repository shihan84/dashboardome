import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  message,
  Tabs,
  Row,
  Col,
  Progress,
  Tooltip,
  Alert,
  Statistic,
} from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
  CloudUploadOutlined,
  ClockCircleOutlined,
  FileOutlined,
  InfoCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import { OMEApiService } from '../services/omeApi';
import type { StreamPush, StreamPushed } from '../types/index';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

export const PushPublishingManagement: React.FC = () => {
  const [pushes, setPushes] = useState<StreamPushed[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPush, setEditingPush] = useState<StreamPush | null>(null);
  const [form] = Form.useForm();
  
  const { omeHost, omePort, omeUsername, omePassword, currentVHost, currentApp } = useStore();
  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  const loadPushes = useCallback(async () => {
    if (!currentVHost || !currentApp) return;
    
    setLoading(true);
    try {
      const pushes = await omeApi.getPushPublishingStatus(currentVHost, currentApp);
      setPushes(pushes);
    } catch (error) {
      message.error('Failed to load push publishing status');
      console.error('Error loading pushes:', error);
    } finally {
      setLoading(false);
    }
  }, [currentVHost, currentApp, omeApi]);

  useEffect(() => {
    loadPushes();
  }, [loadPushes]);

  const handleStartPush = async (values: { id: string; streamName: string; tracks?: string; variantNames?: string; destination: string; protocol: 'srt' | 'rtmp' | 'mpegts'; url: string; streamKey?: string; username?: string; password?: string }) => {
    if (!currentVHost || !currentApp) {
      message.error('Please select a virtual host and application');
      return;
    }

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

      await omeApi.startPushPublishing(currentVHost, currentApp, pushData);
      message.success('Push publishing started successfully');
      setModalVisible(false);
      form.resetFields();
      loadPushes();
    } catch (error) {
      message.error('Failed to start push publishing');
      console.error('Error starting push:', error);
    }
  };

  const handleStopPush = async (pushId: string) => {
    if (!currentVHost || !currentApp) return;

    try {
      await omeApi.stopPushPublishing(currentVHost, currentApp, pushId);
      message.success('Push publishing stopped successfully');
      loadPushes();
    } catch (error) {
      message.error('Failed to stop push publishing');
      console.error('Error stopping push:', error);
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

  const columns = [
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
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() => {
                setEditingPush(push);
                setModalVisible(true);
              }}
            />
          </Tooltip>
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

  const stats = getTotalStats();

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
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            <SendOutlined /> Push Publishing Management
          </Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadPushes}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingPush(null);
                setModalVisible(true);
              }}
            >
              Start Push
            </Button>
          </Space>
        </div>

        {!currentVHost || !currentApp ? (
          <Alert
            message="Please select a virtual host and application"
            type="warning"
            showIcon
          />
        ) : (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Active Pushes"
                    value={stats.active}
                    prefix={<PlayCircleOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Pushes"
                    value={stats.total}
                    prefix={<SendOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Data Sent"
                    value={formatBytes(stats.totalDataSent)}
                    prefix={<FileOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Duration"
                    value={formatDuration(stats.totalDuration)}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Table
              columns={columns}
              dataSource={pushes}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
            />
          </>
        )}
      </Card>

      <Modal
        title={editingPush ? 'Push Details' : 'Start Push Publishing'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPush(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleStartPush}
          initialValues={editingPush || {}}
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
                          form.setFieldsValue({
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
                          form.setFieldsValue({
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
                          form.setFieldsValue({
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

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              {!editingPush && (
                <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />}>
                  Start Push
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
