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
  Divider, 
  Modal, 
  Tabs,
  Collapse,
  message
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SettingOutlined, 
  VideoCameraOutlined,
  AudioOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const { TabPane } = Tabs;

interface OutputProfile {
  name: string;
  outputStreamName: string;
  encoders: Encoder[];
}

interface Encoder {
  name: string;
  bypass: boolean;
  codec: string;
  preset?: string;
  bitrate?: number;
  width?: number;
  height?: number;
  framerate?: number;
  keyframeInterval?: number;
  bframes?: number;
  gop?: number;
  crf?: number;
  maxBitrate?: number;
  bufferSize?: number;
  profile?: string;
  level?: string;
  tune?: string;
}

interface Application {
  name: string;
  vhost: string;
}

export const ABRTranscoder: React.FC = () => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [outputProfiles, setOutputProfiles] = useState<OutputProfile[]>([]);
  const [transcoderSettings, setTranscoderSettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [encoderModalVisible, setEncoderModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<OutputProfile | null>(null);
  const [editingEncoder, setEditingEncoder] = useState<{profile: string, encoder: Encoder} | null>(null);
  const [form] = Form.useForm();
  const [encoderForm] = Form.useForm();

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

  const loadOutputProfiles = useCallback(async (app: Application) => {
    if (!app) return;
    
    setLoading(true);
    try {
      const profiles = await omeApi.getOutputProfiles(app.vhost, app.name);
      setOutputProfiles(profiles);
    } catch (e: any) {
      setError('Failed to load output profiles');
    } finally {
      setLoading(false);
    }
  }, [omeApi]);

  const loadTranscoderSettings = useCallback(async (app: Application) => {
    if (!app) return;
    
    try {
      const settings = await omeApi.getTranscoderSettings(app.vhost, app.name);
      setTranscoderSettings(settings);
    } catch (e: any) {
      console.warn('Failed to load transcoder settings');
    }
  }, [omeApi]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    if (selectedApp) {
      loadOutputProfiles(selectedApp);
      loadTranscoderSettings(selectedApp);
    }
  }, [selectedApp, loadOutputProfiles, loadTranscoderSettings]);

  const handleCreateProfile = () => {
    setEditingProfile(null);
    form.resetFields();
    setProfileModalVisible(true);
  };

  const handleEditProfile = (profile: OutputProfile) => {
    setEditingProfile(profile);
    form.setFieldsValue(profile);
    setProfileModalVisible(true);
  };

  const handleDeleteProfile = async (profileName: string) => {
    if (!selectedApp) return;
    
    try {
      await omeApi.deleteOutputProfile(selectedApp.vhost, selectedApp.name, profileName);
      message.success('Profile deleted successfully');
      loadOutputProfiles(selectedApp);
    } catch (e: any) {
      message.error('Failed to delete profile');
    }
  };

  const handleSaveProfile = async (values: any) => {
    if (!selectedApp) return;
    
    try {
      if (editingProfile) {
        await omeApi.updateOutputProfile(selectedApp.vhost, selectedApp.name, editingProfile.name, values);
        message.success('Profile updated successfully');
      } else {
        await omeApi.createOutputProfileNew(selectedApp.vhost, selectedApp.name, values);
        message.success('Profile created successfully');
      }
      setProfileModalVisible(false);
      loadOutputProfiles(selectedApp);
    } catch (e: any) {
      message.error('Failed to save profile');
    }
  };

  const handleCreateEncoder = (profileName: string) => {
    setEditingEncoder({ profile: profileName, encoder: { name: '', bypass: false, codec: 'h264' } });
    encoderForm.resetFields();
    setEncoderModalVisible(true);
  };

  const handleEditEncoder = (profileName: string, encoder: Encoder) => {
    setEditingEncoder({ profile: profileName, encoder });
    encoderForm.setFieldsValue(encoder);
    setEncoderModalVisible(true);
  };

  const handleSaveEncoder = async (values: any) => {
    if (!selectedApp || !editingEncoder) return;
    
    try {
      await omeApi.updateEncoderSettings(
        selectedApp.vhost, 
        selectedApp.name, 
        editingEncoder.profile, 
        editingEncoder.encoder.name, 
        values
      );
      message.success('Encoder updated successfully');
      setEncoderModalVisible(false);
      loadOutputProfiles(selectedApp);
    } catch (e: any) {
      message.error('Failed to save encoder');
    }
  };

  const profileColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Output Stream',
      dataIndex: 'outputStreamName',
      key: 'outputStreamName',
    },
    {
      title: 'Encoders',
      dataIndex: 'encoders',
      key: 'encoders',
      render: (encoders: Encoder[]) => (
        <Space wrap>
          {encoders.map((encoder, index) => (
            <Tag key={index} color={encoder.bypass ? 'default' : 'blue'}>
              {encoder.name} ({encoder.codec})
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: OutputProfile) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditProfile(record)}
          >
            Edit
          </Button>
          <Button
            icon={<SettingOutlined />}
            size="small"
            onClick={() => handleCreateEncoder(record.name)}
          >
            Add Encoder
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDeleteProfile(record.name)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const renderEncoderSettings = (encoders: Encoder[], profileName: string) => (
    <Collapse>
      {encoders.map((encoder, index) => (
        <Panel
          key={index}
          header={
            <Space>
              <VideoCameraOutlined />
              <Text strong>{encoder.name}</Text>
              <Tag color={encoder.bypass ? 'default' : 'blue'}>{encoder.codec}</Tag>
              {encoder.bitrate && <Text type="secondary">{encoder.bitrate}kbps</Text>}
              {encoder.width && encoder.height && (
                <Text type="secondary">{encoder.width}x{encoder.height}</Text>
              )}
            </Space>
          }
        >
          <Row gutter={16}>
            <Col span={8}>
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Codec">{encoder.codec}</Descriptions.Item>
                <Descriptions.Item label="Bypass">
                  <Tag color={encoder.bypass ? 'red' : 'green'}>
                    {encoder.bypass ? 'Yes' : 'No'}
                  </Tag>
                </Descriptions.Item>
                {encoder.preset && <Descriptions.Item label="Preset">{encoder.preset}</Descriptions.Item>}
                {encoder.bitrate && <Descriptions.Item label="Bitrate">{encoder.bitrate}kbps</Descriptions.Item>}
              </Descriptions>
            </Col>
            <Col span={8}>
              <Descriptions size="small" column={1}>
                {encoder.width && <Descriptions.Item label="Width">{encoder.width}px</Descriptions.Item>}
                {encoder.height && <Descriptions.Item label="Height">{encoder.height}px</Descriptions.Item>}
                {encoder.framerate && <Descriptions.Item label="Framerate">{encoder.framerate}fps</Descriptions.Item>}
                {encoder.keyframeInterval && <Descriptions.Item label="Keyframe">{encoder.keyframeInterval}</Descriptions.Item>}
              </Descriptions>
            </Col>
            <Col span={8}>
              <Space>
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => handleEditEncoder(profileName, encoder)}
                >
                  Edit
                </Button>
              </Space>
            </Col>
          </Row>
        </Panel>
      ))}
    </Collapse>
  );

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {error && <Alert type="error" message={error} showIcon />}
      
      <Card
        title={<Title level={4} style={{ margin: 0 }}>ABR Profiles & Transcoder</Title>}
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
              onClick={handleCreateProfile}
              disabled={!selectedApp}
            >
              New Profile
            </Button>
          </Space>
        }
      >
        {selectedApp && (
          <Tabs defaultActiveKey="profiles">
            <TabPane tab="Output Profiles" key="profiles">
              <Table
                columns={profileColumns}
                dataSource={outputProfiles}
                loading={loading}
                rowKey="name"
                pagination={false}
                size="small"
                expandable={{
                  expandedRowRender: (record) => renderEncoderSettings(record.encoders, record.name),
                  rowExpandable: (record) => record.encoders.length > 0,
                }}
              />
            </TabPane>
            <TabPane tab="Transcoder Settings" key="transcoder">
              {transcoderSettings && (
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Enabled">
                    <Tag color={transcoderSettings.enabled ? 'green' : 'red'}>
                      {transcoderSettings.enabled ? 'Yes' : 'No'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Hardware Acceleration">
                    <Tag color={transcoderSettings.hwAccel ? 'green' : 'red'}>
                      {transcoderSettings.hwAccel ? 'Yes' : 'No'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thread Count">
                    {transcoderSettings.threadCount || 'Auto'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Buffer Size">
                    {transcoderSettings.bufferSize || 'Default'}
                  </Descriptions.Item>
                </Descriptions>
              )}
            </TabPane>
          </Tabs>
        )}
      </Card>

      <Modal
        title={editingProfile ? 'Edit Profile' : 'Create Profile'}
        open={profileModalVisible}
        onCancel={() => setProfileModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveProfile}
        >
          <Form.Item
            name="name"
            label="Profile Name"
            rules={[{ required: true, message: 'Please enter profile name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="outputStreamName"
            label="Output Stream Name"
            rules={[{ required: true, message: 'Please enter output stream name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="encoders"
            label="Encoders"
            initialValue={[]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Enter encoder configuration as JSON array"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Encoder Settings"
        open={encoderModalVisible}
        onCancel={() => setEncoderModalVisible(false)}
        onOk={() => encoderForm.submit()}
        width={800}
      >
        <Form
          form={encoderForm}
          layout="vertical"
          onFinish={handleSaveEncoder}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Encoder Name"
                rules={[{ required: true, message: 'Please enter encoder name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="codec"
                label="Codec"
                rules={[{ required: true, message: 'Please select codec' }]}
              >
                <Select>
                  <Option value="h264">H.264</Option>
                  <Option value="h265">H.265</Option>
                  <Option value="vp8">VP8</Option>
                  <Option value="vp9">VP9</Option>
                  <Option value="aac">AAC</Option>
                  <Option value="opus">Opus</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="bypass"
            label="Bypass"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="bitrate" label="Bitrate (kbps)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="width" label="Width">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="height" label="Height">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="framerate" label="Framerate">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="keyframeInterval" label="Keyframe Interval">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="preset" label="Preset">
                <Select allowClear>
                  <Option value="ultrafast">Ultrafast</Option>
                  <Option value="superfast">Superfast</Option>
                  <Option value="veryfast">Veryfast</Option>
                  <Option value="faster">Faster</Option>
                  <Option value="fast">Fast</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="slow">Slow</Option>
                  <Option value="slower">Slower</Option>
                  <Option value="veryslow">Veryslow</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Space>
  );
};
