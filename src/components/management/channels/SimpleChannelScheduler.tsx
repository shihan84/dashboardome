import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  TimePicker,
  Switch,
  Space,
  Tag,
  message,
  Row,
  Col,
  Timeline,
  Badge,
  Tooltip,
  Divider,
  Alert,
  Steps,
  Upload,
  List,
  Avatar
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileOutlined,
  SettingOutlined,
  UploadOutlined,
  VideoCameraOutlined,
  SoundOutlined,
  FileTextOutlined,
  TrophyOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { OMEApiService } from '../../../services/omeApi';
import { useStore } from '../../../store/useStore';

const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

interface ScheduleItem {
  id: string;
  name: string;
  type: 'file' | 'stream' | 'external';
  url: string;
  duration: number; // minutes
  icon: string;
}

interface Program {
  id: string;
  name: string;
  time: string; // HH:mm format
  repeat: 'daily' | 'weekly' | 'once';
  items: ScheduleItem[];
  enabled: boolean;
  color: string;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  programs: Program[];
  currentProgram?: string;
  nextProgram?: string;
}

const SimpleChannelScheduler: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  // Load channels from OME server
  const loadChannels = async () => {
    setLoading(true);
    try {
      const vhosts = await omeApi.getVHosts();
      const allChannels: Channel[] = [];
      
      for (const vhost of vhosts) {
        const apps = await omeApi.getApplications(vhost.name);
        for (const app of apps) {
          const streams = await omeApi.getStreams(vhost.name, app.name);
          
          // Create a channel for each application
          const channel: Channel = {
            id: `${vhost.name}_${app.name}`,
            name: `${app.name} (${vhost.name})`,
            description: `Application in ${vhost.name} virtual host`,
            status: 'active',
            currentProgram: streams.length > 0 ? streams[0].name : undefined,
            nextProgram: streams.length > 1 ? streams[1].name : undefined,
            programs: streams.map((stream, index) => ({
              id: stream.name,
              name: stream.name,
              time: `${String(index * 2).padStart(2, '0')}:00`,
              repeat: 'daily',
              enabled: true,
              color: ['#52c41a', '#1890ff', '#fa8c16', '#722ed1'][index % 4],
              items: [
                {
                  id: stream.name,
                  name: stream.name,
                  type: 'stream',
                  url: `stream://${vhost.name}/${app.name}/${stream.name}`,
                  duration: 120,
                  icon: 'stream'
                }
              ]
            }))
          };
          
          allChannels.push(channel);
        }
      }
      
      setChannels(allChannels);
    } catch (error) {
      console.error('Failed to load channels:', error);
      message.error('Failed to load channels from OME server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'stream': return <PlayCircleOutlined style={{ color: '#52c41a' }} />;
      case 'file': return <FileOutlined style={{ color: '#1890ff' }} />;
      case 'music': return <SoundOutlined style={{ color: '#722ed1' }} />;
      case 'news': return <FileTextOutlined style={{ color: '#fa8c16' }} />;
      default: return <VideoCameraOutlined />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      default: return 'error';
    }
  };

  const handleCreateChannel = () => {
    setEditingChannel(null);
    setCurrentStep(0);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setCurrentStep(0);
    form.setFieldsValue({
      name: channel.name,
      description: channel.description,
      status: channel.status
    });
    setModalVisible(true);
  };

  const handleSaveChannel = async (values: any) => {
    setLoading(true);
    try {
      if (editingChannel) {
        // Update existing channel - in real implementation, this would update OME configuration
        setChannels(prev => prev.map(ch => 
          ch.id === editingChannel.id 
            ? { ...ch, ...values }
            : ch
        ));
        message.success('Channel updated successfully!');
      } else {
        // Create new application in OME
        try {
          // Create application in the test virtual host
          await omeApi.createApplication('test', {
            name: values.name,
            type: 'live'
          });
          
          // Reload channels to get the new application
          await loadChannels();
          message.success('Channel created successfully!');
        } catch (apiError) {
          console.error('Failed to create application:', apiError);
          message.error('Failed to create application in OME server');
        }
      }
      setModalVisible(false);
    } catch (error) {
      message.error('Failed to save channel');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChannel = (channelId: string) => {
    setChannels(prev => prev.map(ch => 
      ch.id === channelId 
        ? { ...ch, status: ch.status === 'active' ? 'inactive' : 'active' }
        : ch
    ));
  };

  const renderProgramTimeline = (programs: Program[]) => {
    const sortedPrograms = [...programs].sort((a, b) => a.time.localeCompare(b.time));
    
    return (
      <Timeline>
        {sortedPrograms.map((program, index) => (
          <Timeline.Item
            key={program.id}
            dot={
              <Badge
                color={program.color}
                text={
                  <span style={{ color: program.color, fontWeight: 'bold' }}>
                    {program.time}
                  </span>
                }
              />
            }
          >
            <div style={{ marginBottom: 8 }}>
              <Space>
                <Tag color={program.color}>{program.name}</Tag>
                <Tag color={program.enabled ? 'success' : 'default'}>
                  {program.repeat}
                </Tag>
                <Switch
                  size="small"
                  checked={program.enabled}
                  onChange={(checked) => {
                    setChannels(prev => prev.map(ch => ({
                      ...ch,
                      programs: ch.programs.map(p => 
                        p.id === program.id ? { ...p, enabled: checked } : p
                      )
                    })));
                  }}
                />
              </Space>
            </div>
            <List
              size="small"
              dataSource={program.items}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={getIcon(item.icon)} size="small" />}
                    title={item.name}
                    description={`${item.duration} minutes • ${item.type}`}
                  />
                </List.Item>
              )}
            />
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  const steps = [
    {
      title: 'Basic Info',
      content: (
        <Form.Item
          label="Channel Name"
          name="name"
          rules={[{ required: true, message: 'Please enter channel name' }]}
        >
          <Input placeholder="Enter channel name" />
        </Form.Item>
      )
    },
    {
      title: 'Description',
      content: (
        <Form.Item
          label="Description"
          name="description"
        >
          <TextArea rows={3} placeholder="Enter channel description" />
        </Form.Item>
      )
    },
    {
      title: 'Settings',
      content: (
        <Form.Item
          label="Status"
          name="status"
          initialValue="active"
        >
          <Select>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
        </Form.Item>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <CalendarOutlined />
            Channel Scheduler
            <Badge count={channels.length} style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadChannels}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateChannel}
            >
              Create Channel
            </Button>
          </Space>
        }
      >
        <Alert
          message="Easy Channel Scheduling"
          description="Create and manage your broadcast channels with simple drag-and-drop scheduling. Set up programs, upload content, and manage live streams all in one place."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={[24, 24]}>
          {channels.map((channel) => (
            <Col xs={24} lg={12} key={channel.id}>
              <Card
                title={
                  <Space>
                    <VideoCameraOutlined />
                    {channel.name}
                    <Badge
                      status={getStatusColor(channel.status) as any}
                      text={channel.status}
                    />
                  </Space>
                }
                extra={
                  <Space>
                    <Tooltip title={channel.status === 'active' ? 'Stop Channel' : 'Start Channel'}>
                      <Button
                        type="text"
                        icon={channel.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                        onClick={() => handleToggleChannel(channel.id)}
                      />
                    </Tooltip>
                    <Button
                      type="text"
                      icon={<SettingOutlined />}
                      onClick={() => handleEditChannel(channel)}
                    />
                  </Space>
                }
                style={{ height: '100%' }}
              >
                <div style={{ marginBottom: 16 }}>
                  <p style={{ color: '#666', margin: 0 }}>{channel.description}</p>
                </div>

                {channel.currentProgram && (
                  <Alert
                    message={`Now Playing: ${channel.currentProgram}`}
                    type="success"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {renderProgramTimeline(channel.programs)}
                </div>

                <Divider />
                <Row justify="space-between" align="middle">
                  <Col>
                    <Space>
                      <ClockCircleOutlined />
                      <span>Next: {channel.nextProgram || 'No upcoming programs'}</span>
                    </Space>
                  </Col>
                  <Col>
                    <Button size="small" icon={<UploadOutlined />}>
                      Upload Content
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Modal
        title={
          <Space>
            <CalendarOutlined />
            {editingChannel ? 'Edit Channel' : 'Create New Channel'}
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveChannel}
        >
          {steps[currentStep].content}

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              {currentStep > 0 && (
                <Button onClick={() => setCurrentStep(currentStep - 1)}>
                  Previous
                </Button>
              )}
              {currentStep < steps.length - 1 ? (
                <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                  Next
                </Button>
              ) : (
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingChannel ? 'Update' : 'Create'}
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SimpleChannelScheduler;
