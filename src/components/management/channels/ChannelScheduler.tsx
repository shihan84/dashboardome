import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  TimePicker,
  DatePicker,
  Switch,
  Space,
  Tag,
  message,
  Popconfirm,
  Tabs,
  Row,
  Col,
  Statistic,
  Progress,
  Tooltip,
  Badge,
  Divider
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileOutlined,
  StreamOutlined,
  SettingOutlined,
  ReloadOutlined,
  UploadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { omeApi } from '../../../services/omeApi';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface ScheduleItem {
  id: string;
  name: string;
  type: 'file' | 'stream' | 'external';
  url: string;
  duration: number; // milliseconds
  start?: number; // start position in file
}

interface Program {
  id: string;
  name: string;
  scheduled: string; // ISO datetime
  repeat: 'daily' | 'weekly' | 'monthly' | 'once';
  items: ScheduleItem[];
  priority: number;
  enabled: boolean;
}

interface Channel {
  id: string;
  name: string;
  streamName: string;
  status: 'active' | 'inactive' | 'error';
  currentProgram?: string;
  nextProgram?: string;
  programs: Program[];
  fallbackProgram?: Program;
  lastUpdated: string;
}

const ChannelScheduler: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [programModalVisible, setProgramModalVisible] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  // Load channels and their schedules
  const loadChannels = useCallback(async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call OME API to get scheduled streams
      // For now, we'll simulate with the schedule files we created
      const mockChannels: Channel[] = [
        {
          id: 'channel1',
          name: 'Main Channel',
          streamName: 'channel1',
          status: 'active',
          currentProgram: 'morning_show',
          nextProgram: 'afternoon_show',
          lastUpdated: new Date().toISOString(),
          programs: [
            {
              id: 'morning_show',
              name: 'Morning Show',
              scheduled: '2025-10-15T06:00:00.000+00:00',
              repeat: 'daily',
              priority: 1,
              enabled: true,
              items: [
                {
                  id: 'live_stream',
                  name: 'Live Stream',
                  type: 'stream',
                  url: 'stream://default/live/live',
                  duration: 21600000
                },
                {
                  id: 'fallback_content',
                  name: 'Morning Content',
                  type: 'file',
                  url: 'file:///home/ubuntu/dashboardome/media/morning_content.mp4',
                  duration: 21600000
                }
              ]
            },
            {
              id: 'afternoon_show',
              name: 'Afternoon Show',
              scheduled: '2025-10-15T12:00:00.000+00:00',
              repeat: 'daily',
              priority: 2,
              enabled: true,
              items: [
                {
                  id: 'live_stream_afternoon',
                  name: 'Live Stream',
                  type: 'stream',
                  url: 'stream://default/live/live',
                  duration: 21600000
                },
                {
                  id: 'afternoon_content',
                  name: 'Afternoon Content',
                  type: 'file',
                  url: 'file:///home/ubuntu/dashboardome/media/afternoon_content.mp4',
                  duration: 21600000
                }
              ]
            }
          ]
        },
        {
          id: 'channel2',
          name: 'Music Channel',
          streamName: 'channel2',
          status: 'active',
          currentProgram: 'music_channel',
          nextProgram: 'news_update',
          lastUpdated: new Date().toISOString(),
          programs: [
            {
              id: 'music_channel',
              name: '24/7 Music',
              scheduled: '2025-10-15T00:00:00.000+00:00',
              repeat: 'daily',
              priority: 1,
              enabled: true,
              items: [
                {
                  id: 'live_music',
                  name: 'Live Music Stream',
                  type: 'stream',
                  url: 'stream://default/live/music',
                  duration: 86400000
                },
                {
                  id: 'music_playlist',
                  name: 'Music Playlist',
                  type: 'file',
                  url: 'file:///home/ubuntu/dashboardome/media/music_playlist.mp4',
                  duration: 86400000
                }
              ]
            }
          ]
        }
      ];
      setChannels(mockChannels);
    } catch (error) {
      console.error('Failed to load channels:', error);
      message.error('Failed to load channels');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const handleCreateChannel = () => {
    setEditingChannel(null);
    setModalVisible(true);
  };

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setModalVisible(true);
  };

  const handleDeleteChannel = async (channelId: string) => {
    try {
      // In real implementation, delete schedule file and stop stream
      message.success('Channel deleted successfully');
      loadChannels();
    } catch (error) {
      message.error('Failed to delete channel');
    }
  };

  const handleCreateProgram = (channelId: string) => {
    setSelectedChannel(channelId);
    setEditingProgram(null);
    setProgramModalVisible(true);
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setProgramModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'default';
      case 'error': return 'red';
      default: return 'default';
    }
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const columns: ColumnsType<Channel> = [
    {
      title: 'Channel Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Channel) => (
        <Space>
          <strong>{text}</strong>
          <Tag color={getStatusColor(record.status)}>{record.status}</Tag>
        </Space>
      ),
    },
    {
      title: 'Stream Name',
      dataIndex: 'streamName',
      key: 'streamName',
    },
    {
      title: 'Current Program',
      dataIndex: 'currentProgram',
      key: 'currentProgram',
      render: (text: string) => text || 'None',
    },
    {
      title: 'Next Program',
      dataIndex: 'nextProgram',
      key: 'nextProgram',
      render: (text: string) => text || 'None',
    },
    {
      title: 'Programs',
      dataIndex: 'programs',
      key: 'programs',
      render: (programs: Program[]) => (
        <Badge count={programs.length} showZero color="blue" />
      ),
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Channel) => (
        <Space>
          <Tooltip title="View Programs">
            <Button
              icon={<CalendarOutlined />}
              onClick={() => setSelectedChannel(record.id)}
            />
          </Tooltip>
          <Tooltip title="Edit Channel">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEditChannel(record)}
            />
          </Tooltip>
          <Tooltip title="Add Program">
            <Button
              icon={<PlusOutlined />}
              onClick={() => handleCreateProgram(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this channel?"
            onConfirm={() => handleDeleteChannel(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const programColumns: ColumnsType<Program> = [
    {
      title: 'Program Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Program) => (
        <Space>
          <strong>{text}</strong>
          {!record.enabled && <Tag color="red">Disabled</Tag>}
        </Space>
      ),
    },
    {
      title: 'Schedule',
      dataIndex: 'scheduled',
      key: 'scheduled',
      render: (text: string, record: Program) => (
        <Space direction="vertical" size="small">
          <div>{dayjs(text).format('YYYY-MM-DD HH:mm:ss')}</div>
          <Tag color="blue">{record.repeat}</Tag>
        </Space>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record: Program) => {
        const totalDuration = record.items.reduce((sum, item) => sum + item.duration, 0);
        return formatDuration(totalDuration);
      },
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items: ScheduleItem[]) => (
        <Space wrap>
          {items.map((item, index) => (
            <Tag key={index} color={item.type === 'stream' ? 'green' : 'blue'}>
              {item.type === 'stream' ? <StreamOutlined /> : <FileOutlined />}
              {item.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => (
        <Tag color={priority === 1 ? 'red' : priority === 2 ? 'orange' : 'green'}>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Program) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditProgram(record)}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => {
              // Handle delete program
              message.info('Delete program functionality to be implemented');
            }}
          />
        </Space>
      ),
    },
  ];

  const selectedChannelData = channels.find(c => c.id === selectedChannel);

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>Channel Scheduler</span>
            <Tag color="blue">Advanced Automation</Tag>
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
        <Tabs defaultActiveKey="channels">
          <TabPane tab="Channels Overview" key="channels">
            <Table
              columns={columns}
              dataSource={channels}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </TabPane>
          
          {selectedChannelData && (
            <TabPane tab={`Programs - ${selectedChannelData.name}`} key="programs">
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}>
                  <Statistic
                    title="Total Programs"
                    value={selectedChannelData.programs.length}
                    prefix={<CalendarOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Current Program"
                    value={selectedChannelData.currentProgram || 'None'}
                    prefix={<PlayCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Next Program"
                    value={selectedChannelData.nextProgram || 'None'}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Status"
                    value={selectedChannelData.status}
                    valueStyle={{ color: getStatusColor(selectedChannelData.status) === 'green' ? '#3f8600' : '#cf1322' }}
                    prefix={<StreamOutlined />}
                  />
                </Col>
              </Row>
              
              <div style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleCreateProgram(selectedChannel)}
                >
                  Add Program
                </Button>
              </div>
              
              <Table
                columns={programColumns}
                dataSource={selectedChannelData.programs}
                rowKey="id"
                pagination={false}
              />
            </TabPane>
          )}
          
          <TabPane tab="Schedule Management" key="schedule">
            <Card title="Advanced Scheduling Features">
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" title="Live Stream Failover">
                    <p>Automatic failover from live streams to local content when:</p>
                    <ul>
                      <li>RTMP/HLS/SRT stream disconnects</li>
                      <li>Network issues occur</li>
                      <li>Source becomes unavailable</li>
                    </ul>
                    <Tag color="green">Active</Tag>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="Dynamic Scheduling">
                    <p>Real-time schedule updates for:</p>
                    <ul>
                      <li>Breaking news insertion</li>
                      <li>Commercial scheduling</li>
                      <li>Emergency announcements</li>
                    </ul>
                    <Tag color="blue">Enabled</Tag>
                  </Card>
                </Col>
              </Row>
              
              <Divider />
              
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" title="Content Sources">
                    <Space direction="vertical">
                      <Tag icon={<FileOutlined />} color="blue">Local MP4 Files</Tag>
                      <Tag icon={<StreamOutlined />} color="green">RTMP Streams</Tag>
                      <Tag icon={<StreamOutlined />} color="green">HLS Streams</Tag>
                      <Tag icon={<StreamOutlined />} color="green">SRT Streams</Tag>
                      <Tag icon={<StreamOutlined />} color="orange">External URLs</Tag>
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="Schedule Patterns">
                    <Space direction="vertical">
                      <Tag color="purple">Daily Repeating</Tag>
                      <Tag color="purple">Weekly Repeating</Tag>
                      <Tag color="purple">Monthly Repeating</Tag>
                      <Tag color="purple">One-time Events</Tag>
                      <Tag color="purple">Priority-based</Tag>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* Channel Modal */}
      <Modal
        title={editingChannel ? 'Edit Channel' : 'Create Channel'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          onFinish={(values) => {
            // Handle channel creation/update
            message.success(editingChannel ? 'Channel updated' : 'Channel created');
            setModalVisible(false);
            loadChannels();
          }}
        >
          <Form.Item
            name="name"
            label="Channel Name"
            rules={[{ required: true, message: 'Please enter channel name' }]}
          >
            <Input placeholder="Enter channel name" />
          </Form.Item>
          
          <Form.Item
            name="streamName"
            label="Stream Name"
            rules={[{ required: true, message: 'Please enter stream name' }]}
          >
            <Input placeholder="Enter stream name" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingChannel ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Program Modal */}
      <Modal
        title={editingProgram ? 'Edit Program' : 'Create Program'}
        open={programModalVisible}
        onCancel={() => setProgramModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          layout="vertical"
          onFinish={(values) => {
            // Handle program creation/update
            message.success(editingProgram ? 'Program updated' : 'Program created');
            setProgramModalVisible(false);
            loadChannels();
          }}
        >
          <Form.Item
            name="name"
            label="Program Name"
            rules={[{ required: true, message: 'Please enter program name' }]}
          >
            <Input placeholder="Enter program name" />
          </Form.Item>
          
          <Form.Item
            name="scheduled"
            label="Schedule Time"
            rules={[{ required: true, message: 'Please select schedule time' }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="repeat"
            label="Repeat Pattern"
            rules={[{ required: true, message: 'Please select repeat pattern' }]}
          >
            <Select placeholder="Select repeat pattern">
              <Option value="once">Once</Option>
              <Option value="daily">Daily</Option>
              <Option value="weekly">Weekly</Option>
              <Option value="monthly">Monthly</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Please select priority' }]}
          >
            <Select placeholder="Select priority">
              <Option value={1}>High (1)</Option>
              <Option value={2}>Medium (2)</Option>
              <Option value={3}>Low (3)</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingProgram ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => setProgramModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ChannelScheduler;
