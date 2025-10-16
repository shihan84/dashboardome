import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Popconfirm,
  message,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
  Divider,
  Tabs,
  Switch,
  InputNumber,
  Typography,
  Descriptions,
  Alert,
  Progress,
  Timeline
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  DeleteOutlined,
  ReloadOutlined,
  VideoCameraOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WifiOutlined,
  CloudUploadOutlined,
  SoundOutlined,
  BarChartOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useStore } from '../../store/useStore';
import { OMEApiService } from '../../services/omeApi';
import type { OMEStream, OMEStreamDetailed } from '../../types';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface StreamFormData {
  name: string;
  sourceType: string;
  state: string;
  bitrate: number;
  resolution: string;
  framerate: number;
  codec: string;
}

const StreamManagement: React.FC = () => {
  const { omeHost, omePort } = useStore();
  const [loading, setLoading] = useState(false);
  const [streams, setStreams] = useState<OMEStream[]>([]);
  const [vhosts, setVHosts] = useState<string[]>([]);
  const [applications, setApplications] = useState<string[]>([]);
  const [selectedVHost, setSelectedVHost] = useState<string>('default');
  const [selectedApplication, setSelectedApplication] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<OMEStreamDetailed | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStream, setEditingStream] = useState<OMEStreamDetailed | null>(null);
  const [form] = Form.useForm();

  const loadVHosts = async () => {
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const response = await omeApi.getVHosts();
      if (response.success) {
        const vhostNames = response.data.map(v => v.name);
        setVHosts(vhostNames);
        if (vhostNames.length > 0 && !selectedVHost) {
          setSelectedVHost(vhostNames[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load vhosts:', error);
    }
  };

  const loadApplications = async () => {
    if (!selectedVHost) return;
    
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const response = await omeApi.getApplications(selectedVHost);
      if (response.success) {
        const appNames = response.data.map(a => a.name);
        setApplications(appNames);
        if (appNames.length > 0 && !selectedApplication) {
          setSelectedApplication(appNames[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  };

  const loadStreams = async () => {
    if (!selectedVHost || !selectedApplication) return;
    
    setLoading(true);
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const response = await omeApi.getStreams(selectedVHost, selectedApplication);
      if (response.success) {
        setStreams(response.data);
      } else {
        message.error('Failed to load streams');
      }
    } catch (error) {
      console.error('Failed to load streams:', error);
      message.error('Failed to load streams');
    } finally {
      setLoading(false);
    }
  };

  const loadStreamDetails = async (streamName: string) => {
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const details = await omeApi.getStreamDetailed(selectedVHost, selectedApplication, streamName);
      setSelectedStream(details);
    } catch (error) {
      console.error('Failed to load stream details:', error);
      message.error('Failed to load stream details');
    }
  };

  const handleDeleteStream = async (streamName: string) => {
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      await omeApi.deleteStream(selectedVHost, selectedApplication, streamName);
      message.success('Stream deleted successfully');
      loadStreams();
      if (selectedStream?.name === streamName) {
        setSelectedStream(null);
      }
    } catch (error) {
      console.error('Failed to delete stream:', error);
      message.error('Failed to delete stream');
    }
  };

  const handleStartRecording = async (streamName: string) => {
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const recordData = {
        id: `record_${streamName}_${Date.now()}`,
        stream: {
          vhost: selectedVHost,
          app: selectedApplication,
          name: streamName
        },
        filePath: `/tmp/records/${streamName}_${Date.now()}.ts`,
        infoPath: `/tmp/records/info/${streamName}_${Date.now()}.json`
      };
      
      await omeApi.startRecording(selectedVHost, selectedApplication, recordData);
      message.success('Recording started successfully');
      loadStreams();
    } catch (error) {
      console.error('Failed to start recording:', error);
      message.error('Failed to start recording');
    }
  };

  const handleStopRecording = async (streamName: string) => {
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      // Note: This would need the actual record ID, which should be tracked
      await omeApi.stopRecording(selectedVHost, selectedApplication, `record_${streamName}`);
      message.success('Recording stopped successfully');
      loadStreams();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      message.error('Failed to stop recording');
    }
  };

  useEffect(() => {
    loadVHosts();
  }, []);

  useEffect(() => {
    if (selectedVHost) {
      loadApplications();
    }
  }, [selectedVHost]);

  useEffect(() => {
    if (selectedVHost && selectedApplication) {
      loadStreams();
    }
  }, [selectedVHost, selectedApplication]);

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'started': return 'success';
      case 'stopped': return 'default';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (state: string) => {
    switch (state) {
      case 'started': return 'Active';
      case 'stopped': return 'Stopped';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const columns = [
    {
      title: 'Stream Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <VideoCameraOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Source Type',
      dataIndex: 'sourceType',
      key: 'sourceType',
      render: (type: string) => (
        <Tag color="blue">{type?.toUpperCase() || 'Unknown'}</Tag>
      ),
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      render: (state: string) => (
        <Badge status={getStatusColor(state)} text={getStatusText(state)} />
      ),
    },
    {
      title: 'Bitrate',
      dataIndex: 'bitrate',
      key: 'bitrate',
      render: (bitrate: number) => (
        <Text>{bitrate ? `${bitrate} kbps` : 'N/A'}</Text>
      ),
    },
    {
      title: 'Resolution',
      dataIndex: 'video',
      key: 'resolution',
      render: (video: any) => (
        <Text>{video?.resolution || 'N/A'}</Text>
      ),
    },
    {
      title: 'Connections',
      dataIndex: 'connections',
      key: 'connections',
      render: (connections: any) => (
        <Space>
          <EyeOutlined />
          <Text>{connections?.total || 0}</Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: OMEStream) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<InfoCircleOutlined />}
              onClick={() => loadStreamDetails(record.name)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Start Recording">
            <Button
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartRecording(record.name)}
              size="small"
              disabled={record.state !== 'started'}
            />
          </Tooltip>
          <Tooltip title="Stop Recording">
            <Button
              icon={<StopOutlined />}
              onClick={() => handleStopRecording(record.name)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this stream?"
            onConfirm={() => handleDeleteStream(record.name)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                icon={<DeleteOutlined />}
                danger
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <VideoCameraOutlined /> Stream Management
            </Title>
            <Text type="secondary">Monitor and manage active streams</Text>
          </div>
          <Space>
            <Select
              value={selectedVHost}
              onChange={setSelectedVHost}
              style={{ width: 150 }}
              placeholder="VHost"
            >
              {vhosts.map(vhost => (
                <Option key={vhost} value={vhost}>{vhost}</Option>
              ))}
            </Select>
            <Select
              value={selectedApplication}
              onChange={setSelectedApplication}
              style={{ width: 150 }}
              placeholder="Application"
            >
              {applications.map(app => (
                <Option key={app} value={app}>{app}</Option>
              ))}
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadStreams}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Streams"
                value={streams.length}
                prefix={<VideoCameraOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Active Streams"
                value={streams.filter(s => s.state === 'started').length}
                prefix={<PlayCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Connections"
                value={streams.reduce((sum, s) => sum + (s.connections?.total || 0), 0)}
                prefix={<EyeOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Bitrate"
                value={streams.reduce((sum, s) => sum + (s.bitrate || 0), 0)}
                suffix="kbps"
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title={`Streams in ${selectedApplication}`} size="small">
              <Table
                columns={columns}
                dataSource={streams}
                rowKey="name"
                loading={loading}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            {selectedStream ? (
              <Card title="Stream Details" size="small">
                <Tabs defaultActiveKey="general" size="small">
                  <TabPane tab="General" key="general">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Name">
                        <Text code>{selectedStream.name}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Source Type">
                        <Tag color="blue">{selectedStream.sourceType?.toUpperCase()}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="State">
                        <Badge status={getStatusColor(selectedStream.state)} text={getStatusText(selectedStream.state)} />
                      </Descriptions.Item>
                      <Descriptions.Item label="Bitrate">
                        <Text>{selectedStream.bitrate ? `${selectedStream.bitrate} kbps` : 'N/A'}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Resolution">
                        <Text>{selectedStream.video?.resolution || 'N/A'}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Framerate">
                        <Text>{selectedStream.video?.framerate || 'N/A'} fps</Text>
                      </Descriptions.Item>
                    </Descriptions>
                  </TabPane>
                  
                  <TabPane tab="Connections" key="connections">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Total Connections</Text>
                        <br />
                        <Text>{selectedStream.connections?.total || 0}</Text>
                      </div>
                      <div>
                        <Text strong>WebRTC Connections</Text>
                        <br />
                        <Text>{selectedStream.connections?.webrtc || 0}</Text>
                      </div>
                      <div>
                        <Text strong>HLS Connections</Text>
                        <br />
                        <Text>{selectedStream.connections?.hls || 0}</Text>
                      </div>
                      <div>
                        <Text strong>DASH Connections</Text>
                        <br />
                        <Text>{selectedStream.connections?.dash || 0}</Text>
                      </div>
                    </Space>
                  </TabPane>
                  
                  <TabPane tab="Video" key="video">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Codec</Text>
                        <br />
                        <Text>{selectedStream.video?.codec || 'N/A'}</Text>
                      </div>
                      <div>
                        <Text strong>Resolution</Text>
                        <br />
                        <Text>{selectedStream.video?.resolution || 'N/A'}</Text>
                      </div>
                      <div>
                        <Text strong>Framerate</Text>
                        <br />
                        <Text>{selectedStream.video?.framerate || 'N/A'} fps</Text>
                      </div>
                      <div>
                        <Text strong>Bitrate</Text>
                        <br />
                        <Text>{selectedStream.video?.bitrate || 'N/A'} kbps</Text>
                      </div>
                    </Space>
                  </TabPane>
                  
                  <TabPane tab="Audio" key="audio">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Codec</Text>
                        <br />
                        <Text>{selectedStream.audio?.codec || 'N/A'}</Text>
                      </div>
                      <div>
                        <Text strong>Sample Rate</Text>
                        <br />
                        <Text>{selectedStream.audio?.sampleRate || 'N/A'} Hz</Text>
                      </div>
                      <div>
                        <Text strong>Channels</Text>
                        <br />
                        <Text>{selectedStream.audio?.channels || 'N/A'}</Text>
                      </div>
                      <div>
                        <Text strong>Bitrate</Text>
                        <br />
                        <Text>{selectedStream.audio?.bitrate || 'N/A'} kbps</Text>
                      </div>
                    </Space>
                  </TabPane>
                  
                  <TabPane tab="Timeline" key="timeline">
                    <Timeline size="small">
                      <Timeline.Item color="green">
                        Stream started
                      </Timeline.Item>
                      <Timeline.Item color="blue">
                        First connection
                      </Timeline.Item>
                      <Timeline.Item color="gray">
                        Recording started
                      </Timeline.Item>
                    </Timeline>
                  </TabPane>
                </Tabs>
              </Card>
            ) : (
              <Card title="Select a Stream" size="small">
                <Text type="secondary">Click on a stream to view details</Text>
              </Card>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default StreamManagement;
