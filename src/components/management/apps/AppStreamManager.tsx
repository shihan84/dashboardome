import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Tag,
  message,
  Row,
  Col,
  Tabs,
  Divider,
  Alert,
  Steps,
  Upload,
  List,
  Avatar,
  Badge,
  Tooltip,
  Collapse,
  InputNumber,
  Radio,
  Checkbox
} from 'antd';
import {
  PlusOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  CloudServerOutlined,
  VideoCameraOutlined,
  SoundOutlined,
  FileOutlined,
  UploadOutlined,
  DownloadOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { OMEApiService } from '../../../services/omeApi';
import { useStore } from '../../../store/useStore';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Step } = Steps;
const { Panel } = Collapse;

interface StreamConfig {
  name: string;
  type: 'rtmp' | 'webrtc' | 'srt' | 'hls' | 'file';
  url?: string;
  enabled: boolean;
  parameters: {
    bitrate?: number;
    resolution?: string;
    framerate?: number;
    codec?: string;
    audioCodec?: string;
    audioBitrate?: number;
    [key: string]: any;
  };
}

interface AppConfig {
  name: string;
  type: 'live' | 'vod';
  description: string;
  enabled: boolean;
  streams: StreamConfig[];
  outputProfiles: string[];
  customParameters: {
    [key: string]: any;
  };
}

const AppStreamManager: React.FC = () => {
  const [apps, setApps] = useState<AppConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingApp, setEditingApp] = useState<AppConfig | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [streamForm] = Form.useForm();
  const [streamModalVisible, setStreamModalVisible] = useState(false);
  const [editingStream, setEditingStream] = useState<StreamConfig | null>(null);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  // Load applications from OME server
  const loadApps = async () => {
    setLoading(true);
    try {
      const vhostsResponse = await omeApi.getVHosts();
      const vhostsRaw = vhostsResponse?.data || [];
      const vhostNames: string[] = vhostsRaw.map((vh: any) => (typeof vh === 'string' ? vh : vh?.name)).filter(Boolean);

      const allApps: AppConfig[] = [];
      
      for (const vhostName of vhostNames) {
        const appsResponse = await omeApi.getApplications(vhostName);
        const appsRaw = appsResponse?.data || [];
        const appNames: string[] = appsRaw.map((a: any) => (typeof a === 'string' ? a : a?.name)).filter(Boolean);
        for (const appName of appNames) {
          const streamsResponse = await omeApi.getStreams(vhostName, appName);
          const streamsList = (streamsResponse?.data || []).map((s: any) => ({ name: s?.name || s }));
          
          allApps.push({
            name: appName,
            type: 'live',
            description: `Application in ${vhostName}`,
            enabled: true,
            streams: streamsList.map(stream => ({
              name: stream.name,
              type: 'rtmp',
              enabled: true,
              parameters: {}
            })),
            outputProfiles: [],
            customParameters: {}
          });
        }
      }
      
      setApps(allApps);
    } catch (error) {
      console.error('Failed to load apps:', error);
      message.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  const handleCreateApp = () => {
    setEditingApp(null);
    setCurrentStep(0);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditApp = (app: AppConfig) => {
    setEditingApp(app);
    setCurrentStep(0);
    form.setFieldsValue(app);
    setModalVisible(true);
  };

  const handleSaveApp = async (values: any) => {
    setLoading(true);
    try {
      if (editingApp) {
        // Update existing app
        setApps(prev => prev.map(app => 
          app.name === editingApp.name 
            ? { ...app, ...values }
            : app
        ));
        message.success('Application updated successfully!');
      } else {
        // Create new app
        const newApp: AppConfig = {
          ...values,
          streams: [],
          outputProfiles: [],
          customParameters: {}
        };
        setApps(prev => [...prev, newApp]);
        message.success('Application created successfully!');
      }
      setModalVisible(false);
    } catch (error) {
      message.error('Failed to save application');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStream = (appName: string) => {
    setSelectedApp(appName);
    setEditingStream(null);
    streamForm.resetFields();
    setStreamModalVisible(true);
  };

  const handleEditStream = (appName: string, stream: StreamConfig) => {
    setSelectedApp(appName);
    setEditingStream(stream);
    streamForm.setFieldsValue(stream);
    setStreamModalVisible(true);
  };

  const handleSaveStream = async (values: any) => {
    if (!selectedApp) return;
    
    setLoading(true);
    try {
      setApps(prev => prev.map(app => {
        if (app.name === selectedApp) {
          if (editingStream) {
            // Update existing stream
            return {
              ...app,
              streams: app.streams.map(stream => 
                stream.name === editingStream.name ? { ...stream, ...values } : stream
              )
            };
          } else {
            // Add new stream
            return {
              ...app,
              streams: [...app.streams, { ...values, parameters: {} }]
            };
          }
        }
        return app;
      }));
      
      message.success(`Stream ${editingStream ? 'updated' : 'created'} successfully!`);
      setStreamModalVisible(false);
    } catch (error) {
      message.error('Failed to save stream');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStream = (appName: string, streamName: string) => {
    setApps(prev => prev.map(app => {
      if (app.name === appName) {
        return {
          ...app,
          streams: app.streams.filter(stream => stream.name !== streamName)
        };
      }
      return app;
    }));
    message.success('Stream deleted successfully!');
  };

  const getStreamIcon = (type: string) => {
    switch (type) {
      case 'rtmp': return <PlayCircleOutlined style={{ color: '#52c41a' }} />;
      case 'webrtc': return <VideoCameraOutlined style={{ color: '#1890ff' }} />;
      case 'srt': return <CloudServerOutlined style={{ color: '#722ed1' }} />;
      case 'hls': return <FileOutlined style={{ color: '#fa8c16' }} />;
      case 'file': return <FileOutlined style={{ color: '#8c8c8c' }} />;
      default: return <PlayCircleOutlined />;
    }
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled ? 'success' : 'default';
  };

  const appSteps = [
    {
      title: 'Basic Info',
      content: (
        <>
          <Form.Item
            label="Application Name"
            name="name"
            rules={[{ required: true, message: 'Please enter application name' }]}
          >
            <Input placeholder="Enter application name" />
          </Form.Item>
          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true, message: 'Please select application type' }]}
            initialValue="live"
          >
            <Radio.Group>
              <Radio value="live">Live Streaming</Radio>
              <Radio value="vod">Video on Demand</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea rows={3} placeholder="Enter application description" />
          </Form.Item>
        </>
      )
    },
    {
      title: 'Configuration',
      content: (
        <>
          <Form.Item
            label="Status"
            name="enabled"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
          </Form.Item>
          <Form.Item
            label="Output Profiles"
            name="outputProfiles"
          >
            <Select mode="multiple" placeholder="Select output profiles">
              <Option value="bypass">Bypass</Option>
              <Option value="h264">H.264</Option>
              <Option value="h265">H.265</Option>
              <Option value="vp8">VP8</Option>
              <Option value="vp9">VP9</Option>
            </Select>
          </Form.Item>
        </>
      )
    },
    {
      title: 'Custom Parameters',
      content: (
        <Alert
          message="Custom Parameters"
          description="Add custom parameters for advanced configuration. These will be passed to the OME server."
          type="info"
          showIcon
        />
      )
    }
  ];

  const streamTypes = [
    { value: 'rtmp', label: 'RTMP', description: 'Real-Time Messaging Protocol' },
    { value: 'webrtc', label: 'WebRTC', description: 'Web Real-Time Communication' },
    { value: 'srt', label: 'SRT', description: 'Secure Reliable Transport' },
    { value: 'hls', label: 'HLS', description: 'HTTP Live Streaming' },
    { value: 'file', label: 'File', description: 'Local media file' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <CloudServerOutlined />
            Application & Stream Manager
            <Badge count={apps.length} style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadApps}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateApp}
            >
              Create App
            </Button>
          </Space>
        }
      >
        <Alert
          message="🚀 Quick Start Guide"
          description={
            <div>
              <p><strong>1. Create Application:</strong> Click "Create App" to set up a new streaming application</p>
              <p><strong>2. Add Streams:</strong> Configure RTMP, WebRTC, SRT, or HLS streams with custom parameters</p>
              <p><strong>3. Monitor:</strong> Watch live streams and manage your broadcast infrastructure</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={[24, 24]}>
          {apps.map((app) => (
            <Col xs={24} lg={12} key={app.name}>
              <Card
                title={
                  <Space>
                    <CloudServerOutlined />
                    {app.name}
                    <Badge
                      status={getStatusColor(app.enabled) as any}
                      text={app.enabled ? 'Active' : 'Inactive'}
                    />
                  </Space>
                }
                extra={
                  <Space>
                    <Tooltip title="View Details">
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => setSelectedApp(app.name)}
                      />
                    </Tooltip>
                    <Tooltip title="Edit Application">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEditApp(app)}
                      />
                    </Tooltip>
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={() => handleCreateStream(app.name)}
                    />
                  </Space>
                }
                style={{ height: '100%' }}
              >
                <div style={{ marginBottom: 16 }}>
                  <Tag color={app.type === 'live' ? 'blue' : 'green'}>
                    {app.type.toUpperCase()}
                  </Tag>
                  <p style={{ color: '#666', margin: '8px 0 0 0' }}>
                    {app.description}
                  </p>
                </div>

                <Divider orientation="left">Streams ({app.streams.length})</Divider>
                
                <List
                  size="small"
                  dataSource={app.streams}
                  renderItem={(stream) => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEditStream(app.name, stream)}
                        />,
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteStream(app.name, stream.name)}
                        />
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={getStreamIcon(stream.type)} size="small" />}
                        title={stream.name}
                        description={
                          <Space>
                            <Tag color="blue">{stream.type.toUpperCase()}</Tag>
                            <Badge
                              status={getStatusColor(stream.enabled) as any}
                              text={stream.enabled ? 'Active' : 'Inactive'}
                            />
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />

                {app.streams.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <PlayCircleOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                    <p>No streams configured</p>
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => handleCreateStream(app.name)}
                    >
                      Add Stream
                    </Button>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>

        {apps.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
            <CloudServerOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <h3>No Applications Found</h3>
            <p>Create your first application to get started with stream management</p>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateApp}
            >
              Create Application
            </Button>
          </div>
        )}
      </Card>

      {/* Application Creation/Edit Modal */}
      <Modal
        title={
          <Space>
            <CloudServerOutlined />
            {editingApp ? 'Edit Application' : 'Create New Application'}
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {appSteps.map((step, index) => (
            <Step key={index} title={step.title} />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveApp}
        >
          {appSteps[currentStep].content}

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              {currentStep > 0 && (
                <Button onClick={() => setCurrentStep(currentStep - 1)}>
                  Previous
                </Button>
              )}
              {currentStep < appSteps.length - 1 ? (
                <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                  Next
                </Button>
              ) : (
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingApp ? 'Update' : 'Create'}
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Stream Creation/Edit Modal */}
      <Modal
        title={
          <Space>
            <PlayCircleOutlined />
            {editingStream ? 'Edit Stream' : 'Create New Stream'}
          </Space>
        }
        open={streamModalVisible}
        onCancel={() => setStreamModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={streamForm}
          layout="vertical"
          onFinish={handleSaveStream}
        >
          <Form.Item
            label="Stream Name"
            name="name"
            rules={[{ required: true, message: 'Please enter stream name' }]}
          >
            <Input placeholder="Enter stream name" />
          </Form.Item>

          <Form.Item
            label="Stream Type"
            name="type"
            rules={[{ required: true, message: 'Please select stream type' }]}
          >
            <Select placeholder="Select stream type">
              {streamTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  <Space>
                    {getStreamIcon(type.value)}
                    <div>
                      <div>{type.label}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {type.description}
                      </div>
                    </div>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Stream URL"
            name="url"
          >
            <Input placeholder="Enter stream URL (optional)" />
          </Form.Item>

          <Form.Item
            label="Status"
            name="enabled"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
          </Form.Item>

          <Collapse>
            <Panel header="Advanced Parameters" key="1">
              <Form.Item
                label="Bitrate (kbps)"
                name={['parameters', 'bitrate']}
              >
                <InputNumber min={100} max={10000} placeholder="2500" />
              </Form.Item>
              
              <Form.Item
                label="Resolution"
                name={['parameters', 'resolution']}
              >
                <Select placeholder="Select resolution">
                  <Option value="1920x1080">1920x1080 (Full HD)</Option>
                  <Option value="1280x720">1280x720 (HD)</Option>
                  <Option value="854x480">854x480 (SD)</Option>
                  <Option value="640x360">640x360 (Low)</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Framerate (fps)"
                name={['parameters', 'framerate']}
              >
                <InputNumber min={15} max={60} placeholder="30" />
              </Form.Item>

              <Form.Item
                label="Video Codec"
                name={['parameters', 'codec']}
              >
                <Select placeholder="Select video codec">
                  <Option value="h264">H.264</Option>
                  <Option value="h265">H.265</Option>
                  <Option value="vp8">VP8</Option>
                  <Option value="vp9">VP9</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Audio Codec"
                name={['parameters', 'audioCodec']}
              >
                <Select placeholder="Select audio codec">
                  <Option value="aac">AAC</Option>
                  <Option value="opus">Opus</Option>
                  <Option value="mp3">MP3</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Audio Bitrate (kbps)"
                name={['parameters', 'audioBitrate']}
              >
                <InputNumber min={64} max={320} placeholder="128" />
              </Form.Item>
            </Panel>
          </Collapse>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setStreamModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingStream ? 'Update' : 'Create'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AppStreamManager;
