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
  Slider,
  Radio,
  Checkbox
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  VideoCameraOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SoundOutlined,
  BarChartOutlined,
  PlayCircleOutlined,
  CloudServerOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useStore } from '../../store/useStore';
import { OMEApiService } from '../../services/omeApi';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface TranscodingProfile {
  name: string;
  enabled: boolean;
  video: {
    codec: string;
    bitrate: number;
    resolution: string;
    framerate: number;
    preset: string;
    crf: number;
  };
  audio: {
    codec: string;
    bitrate: number;
    sampleRate: number;
    channels: number;
  };
  output: {
    format: string;
    segmentDuration: number;
    playlistType: string;
  };
}

interface EncoderSettings {
  name: string;
  type: 'video' | 'audio';
  codec: string;
  bitrate: number;
  preset: string;
  crf?: number;
  resolution?: string;
  framerate?: number;
  sampleRate?: number;
  channels?: number;
}

const TranscodingProfilesManager: React.FC = () => {
  const { omeHost, omePort } = useStore();
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<TranscodingProfile[]>([]);
  const [vhosts, setVHosts] = useState<string[]>([]);
  const [applications, setApplications] = useState<string[]>([]);
  const [selectedVHost, setSelectedVHost] = useState<string>('default');
  const [selectedApplication, setSelectedApplication] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<TranscodingProfile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<TranscodingProfile | null>(null);
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

  const loadProfiles = async () => {
    if (!selectedVHost || !selectedApplication) return;
    
    setLoading(true);
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const profileNames = await omeApi.getOutputProfiles(selectedVHost, selectedApplication);
      // For now, create mock profiles based on the names
      // In a real implementation, you would need to fetch detailed profile data
      const transformedProfiles = profileNames.map((name: string) => ({
        name: name,
        enabled: true,
        video: {
          codec: 'h264',
          bitrate: 1000,
          resolution: '720p',
          framerate: 30,
          preset: 'medium',
          crf: 23
        },
        audio: {
          codec: 'aac',
          bitrate: 128,
          sampleRate: 44100,
          channels: 2
        },
        output: {
          format: 'hls',
          segmentDuration: 6,
          playlistType: 'vod'
        }
      }));
      setProfiles(transformedProfiles);
    } catch (error) {
      console.error('Failed to load transcoding profiles:', error);
      message.error('Failed to load transcoding profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (values: TranscodingProfile) => {
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const profileData = {
        name: values.name,
        enabled: values.enabled,
        video: {
          codec: values.video.codec,
          bitrate: values.video.bitrate,
          resolution: values.video.resolution,
          framerate: values.video.framerate,
          preset: values.video.preset,
          crf: values.video.crf
        },
        audio: {
          codec: values.audio.codec,
          bitrate: values.audio.bitrate,
          sampleRate: values.audio.sampleRate,
          channels: values.audio.channels
        },
        output: {
          format: values.output.format,
          segmentDuration: values.output.segmentDuration,
          playlistType: values.output.playlistType
        }
      };
      
      await omeApi.createOutputProfileNew(selectedVHost, selectedApplication, profileData);
      message.success('Transcoding profile created successfully');
      setModalVisible(false);
      form.resetFields();
      loadProfiles();
    } catch (error) {
      console.error('Failed to create transcoding profile:', error);
      message.error('Failed to create transcoding profile');
    }
  };

  const handleUpdateProfile = async (values: TranscodingProfile) => {
    if (!editingProfile) return;
    
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const profileData = {
        name: values.name,
        enabled: values.enabled,
        video: {
          codec: values.video.codec,
          bitrate: values.video.bitrate,
          resolution: values.video.resolution,
          framerate: values.video.framerate,
          preset: values.video.preset,
          crf: values.video.crf
        },
        audio: {
          codec: values.audio.codec,
          bitrate: values.audio.bitrate,
          sampleRate: values.audio.sampleRate,
          channels: values.audio.channels
        },
        output: {
          format: values.output.format,
          segmentDuration: values.output.segmentDuration,
          playlistType: values.output.playlistType
        }
      };
      
      await omeApi.updateOutputProfile(selectedVHost, selectedApplication, editingProfile.name, profileData);
      message.success('Transcoding profile updated successfully');
      setModalVisible(false);
      setEditingProfile(null);
      form.resetFields();
      loadProfiles();
    } catch (error) {
      console.error('Failed to update transcoding profile:', error);
      message.error('Failed to update transcoding profile');
    }
  };

  const handleDeleteProfile = async (profileName: string) => {
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      await omeApi.deleteOutputProfile(selectedVHost, selectedApplication, profileName);
      message.success('Transcoding profile deleted successfully');
      loadProfiles();
      if (selectedProfile?.name === profileName) {
        setSelectedProfile(null);
      }
    } catch (error) {
      console.error('Failed to delete transcoding profile:', error);
      message.error('Failed to delete transcoding profile');
    }
  };

  const openCreateModal = () => {
    setEditingProfile(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (profile: TranscodingProfile) => {
    setEditingProfile(profile);
    form.setFieldsValue(profile);
    setModalVisible(true);
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
      loadProfiles();
    }
  }, [selectedVHost, selectedApplication]);

  const columns = [
    {
      title: 'Profile Name',
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
      title: 'Video Codec',
      dataIndex: ['video', 'codec'],
      key: 'videoCodec',
      render: (codec: string) => (
        <Tag color="blue">{codec?.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Resolution',
      dataIndex: ['video', 'resolution'],
      key: 'resolution',
      render: (resolution: string) => (
        <Text>{resolution}</Text>
      ),
    },
    {
      title: 'Bitrate',
      dataIndex: ['video', 'bitrate'],
      key: 'bitrate',
      render: (bitrate: number) => (
        <Text>{bitrate} kbps</Text>
      ),
    },
    {
      title: 'Audio Codec',
      dataIndex: ['audio', 'codec'],
      key: 'audioCodec',
      render: (codec: string) => (
        <Tag color="green">{codec?.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Badge status={enabled ? 'success' : 'default'} text={enabled ? 'Enabled' : 'Disabled'} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: TranscodingProfile) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<InfoCircleOutlined />}
              onClick={() => setSelectedProfile(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this profile?"
            onConfirm={() => handleDeleteProfile(record.name)}
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
              <SettingOutlined /> Transcoding Profiles Management
            </Title>
            <Text type="secondary">Manage video transcoding profiles and encoder settings</Text>
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
              onClick={loadProfiles}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Create Profile
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Profiles"
                value={profiles.length}
                prefix={<VideoCameraOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Enabled Profiles"
                value={profiles.filter(p => p.enabled).length}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="H.264 Profiles"
                value={profiles.filter(p => p.video.codec === 'h264').length}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="H.265 Profiles"
                value={profiles.filter(p => p.video.codec === 'h265').length}
                prefix={<PlayCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title={`Transcoding Profiles in ${selectedApplication}`} size="small">
              <Table
                columns={columns}
                dataSource={profiles}
                rowKey="name"
                loading={loading}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            {selectedProfile ? (
              <Card title="Profile Details" size="small">
                <Tabs defaultActiveKey="video" size="small">
                  <TabPane tab="Video" key="video">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Codec">
                        <Tag color="blue">{selectedProfile.video.codec.toUpperCase()}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Resolution">
                        <Text>{selectedProfile.video.resolution}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Bitrate">
                        <Text>{selectedProfile.video.bitrate} kbps</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Framerate">
                        <Text>{selectedProfile.video.framerate} fps</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Preset">
                        <Text>{selectedProfile.video.preset}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="CRF">
                        <Text>{selectedProfile.video.crf}</Text>
                      </Descriptions.Item>
                    </Descriptions>
                  </TabPane>
                  
                  <TabPane tab="Audio" key="audio">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Codec">
                        <Tag color="green">{selectedProfile.audio.codec.toUpperCase()}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Bitrate">
                        <Text>{selectedProfile.audio.bitrate} kbps</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Sample Rate">
                        <Text>{selectedProfile.audio.sampleRate} Hz</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Channels">
                        <Text>{selectedProfile.audio.channels}</Text>
                      </Descriptions.Item>
                    </Descriptions>
                  </TabPane>
                  
                  <TabPane tab="Output" key="output">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Format">
                        <Tag color="purple">{selectedProfile.output.format.toUpperCase()}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Segment Duration">
                        <Text>{selectedProfile.output.segmentDuration}s</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Playlist Type">
                        <Text>{selectedProfile.output.playlistType}</Text>
                      </Descriptions.Item>
                    </Descriptions>
                  </TabPane>
                </Tabs>
              </Card>
            ) : (
              <Card title="Select a Profile" size="small">
                <Text type="secondary">Click on a profile to view details</Text>
              </Card>
            )}
          </Col>
        </Row>
      </Card>

      <Modal
        title={editingProfile ? 'Edit Transcoding Profile' : 'Create Transcoding Profile'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingProfile(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingProfile ? handleUpdateProfile : handleCreateProfile}
          initialValues={{
            enabled: true,
            video: {
              codec: 'h264',
              bitrate: 1000,
              resolution: '720p',
              framerate: 30,
              preset: 'medium',
              crf: 23
            },
            audio: {
              codec: 'aac',
              bitrate: 128,
              sampleRate: 44100,
              channels: 2
            },
            output: {
              format: 'hls',
              segmentDuration: 6,
              playlistType: 'vod'
            }
          }}
        >
          <Tabs defaultActiveKey="general">
            <TabPane tab="General" key="general">
              <Form.Item
                name="name"
                label="Profile Name"
                rules={[{ required: true, message: 'Please enter profile name' }]}
              >
                <Input placeholder="e.g., 720p_h264" disabled={!!editingProfile} />
              </Form.Item>
              
              <Form.Item
                name="enabled"
                label="Enable Profile"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </TabPane>
            
            <TabPane tab="Video" key="video">
              <Card title="Video Encoding Settings" size="small">
                <Form.Item
                  name={['video', 'codec']}
                  label="Video Codec"
                  rules={[{ required: true, message: 'Please select video codec' }]}
                >
                  <Select>
                    <Option value="h264">H.264 (AVC)</Option>
                    <Option value="h265">H.265 (HEVC)</Option>
                    <Option value="vp8">VP8</Option>
                    <Option value="vp9">VP9</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name={['video', 'resolution']}
                  label="Resolution"
                  rules={[{ required: true, message: 'Please select resolution' }]}
                >
                  <Select>
                    <Option value="480p">480p (854x480)</Option>
                    <Option value="720p">720p (1280x720)</Option>
                    <Option value="1080p">1080p (1920x1080)</Option>
                    <Option value="4k">4K (3840x2160)</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name={['video', 'bitrate']}
                  label="Video Bitrate (kbps)"
                  rules={[{ required: true, message: 'Please enter bitrate' }]}
                >
                  <InputNumber min={100} max={50000} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name={['video', 'framerate']}
                  label="Framerate (fps)"
                  rules={[{ required: true, message: 'Please enter framerate' }]}
                >
                  <InputNumber min={15} max={60} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name={['video', 'preset']}
                  label="Encoding Preset"
                >
                  <Select>
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
                
                <Form.Item
                  name={['video', 'crf']}
                  label="CRF (Constant Rate Factor)"
                >
                  <Slider min={0} max={51} marks={{ 0: '0', 23: '23', 51: '51' }} />
                </Form.Item>
              </Card>
            </TabPane>
            
            <TabPane tab="Audio" key="audio">
              <Card title="Audio Encoding Settings" size="small">
                <Form.Item
                  name={['audio', 'codec']}
                  label="Audio Codec"
                  rules={[{ required: true, message: 'Please select audio codec' }]}
                >
                  <Select>
                    <Option value="aac">AAC</Option>
                    <Option value="mp3">MP3</Option>
                    <Option value="opus">Opus</Option>
                    <Option value="vorbis">Vorbis</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name={['audio', 'bitrate']}
                  label="Audio Bitrate (kbps)"
                  rules={[{ required: true, message: 'Please enter bitrate' }]}
                >
                  <InputNumber min={64} max={320} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name={['audio', 'sampleRate']}
                  label="Sample Rate (Hz)"
                  rules={[{ required: true, message: 'Please enter sample rate' }]}
                >
                  <Select>
                    <Option value={22050}>22050 Hz</Option>
                    <Option value={44100}>44100 Hz</Option>
                    <Option value={48000}>48000 Hz</Option>
                    <Option value={96000}>96000 Hz</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name={['audio', 'channels']}
                  label="Audio Channels"
                  rules={[{ required: true, message: 'Please select channels' }]}
                >
                  <Radio.Group>
                    <Radio value={1}>Mono (1)</Radio>
                    <Radio value={2}>Stereo (2)</Radio>
                    <Radio value={6}>5.1 Surround (6)</Radio>
                  </Radio.Group>
                </Form.Item>
              </Card>
            </TabPane>
            
            <TabPane tab="Output" key="output">
              <Card title="Output Settings" size="small">
                <Form.Item
                  name={['output', 'format']}
                  label="Output Format"
                  rules={[{ required: true, message: 'Please select output format' }]}
                >
                  <Select>
                    <Option value="hls">HLS (HTTP Live Streaming)</Option>
                    <Option value="dash">DASH (Dynamic Adaptive Streaming)</Option>
                    <Option value="rtmp">RTMP</Option>
                    <Option value="webrtc">WebRTC</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name={['output', 'segmentDuration']}
                  label="Segment Duration (seconds)"
                  rules={[{ required: true, message: 'Please enter segment duration' }]}
                >
                  <InputNumber min={1} max={30} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name={['output', 'playlistType']}
                  label="Playlist Type"
                >
                  <Select>
                    <Option value="vod">VOD (Video on Demand)</Option>
                    <Option value="live">Live</Option>
                    <Option value="event">Event</Option>
                  </Select>
                </Form.Item>
              </Card>
            </TabPane>
          </Tabs>
          
          <Divider />
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingProfile ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TranscodingProfilesManager;
