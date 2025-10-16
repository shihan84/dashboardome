import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  Tabs,
  Row,
  Col,
  Typography,
  message,
  Popconfirm,
  Badge,
  Tooltip,
  Divider,
  Statistic,
  Empty,
  Spin,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CalendarOutlined,
  NodeIndexOutlined,
  VideoCameraOutlined,
  FilterOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { ChannelSearchResult, ChannelManagement, ScheduledChannel, MultiplexChannel } from '../types/index';
import { OMEApiService } from '../../../services/omeApi';
import { useStore } from '../../../store/useStore';

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Text, Title } = Typography;

export const ChannelManagement: React.FC = () => {
  const { omeHost, omePort, omeUsername, omePassword, currentVHost, currentApp } = useStore();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [channels, setChannels] = useState<ChannelManagement>({
    regular: [],
    scheduled: [],
    multiplex: [],
    total: 0
  });
  const [searchResults, setSearchResults] = useState<ChannelSearchResult[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelSearchResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'scheduled' | null>(null);
  const [form] = Form.useForm();

  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  // Load all channels and streams
  const loadChannels = async () => {
    if (!currentVHost || !currentApp) return;
    
    setLoading(true);
    try {
      // Get regular streams (main channels in OME)
      const streamsResponse = await omeApi.getStreams(currentVHost, currentApp);
      const regularStreams = streamsResponse.success ? streamsResponse.data : [];
      
      // Get scheduled channels (if supported)
      let scheduledChannels = [];
      try {
        const scheduledResponse = await omeApi.getScheduledChannels(currentVHost, currentApp);
        scheduledChannels = scheduledResponse || [];
      } catch (error) {
        console.log('Scheduled channels not supported or empty');
      }
      
      // Multiplex channels are not supported in OME
      const multiplexChannels = [];
      
      const data = {
        regular: regularStreams,
        scheduled: scheduledChannels,
        multiplex: multiplexChannels,
        total: regularStreams.length + scheduledChannels.length + multiplexChannels.length
      };
      
      console.log('Loaded channels:', data);
      setChannels(data);
    } catch (error) {
      console.error('Failed to load channels:', error);
      message.error('Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  // Search channels
  const searchChannels = async (query: string) => {
    if (!currentVHost || !currentApp || !query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Search through current channels data
      const allChannels: ChannelSearchResult[] = [
        ...channels.regular.map(stream => ({
          name: stream.name || stream,
          type: 'regular' as const,
          status: stream.state || 'unknown',
          vhost: currentVHost,
          app: currentApp,
          metadata: stream
        })),
        ...channels.scheduled.map(channel => ({
          name: channel.name || channel,
          type: 'scheduled' as const,
          status: channel.status || 'unknown',
          vhost: currentVHost,
          app: currentApp,
          metadata: channel
        }))
      ];

      const filtered = allChannels.filter(channel => 
        channel.name.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Failed to search channels:', error);
      message.error('Failed to search channels');
    } finally {
      setLoading(false);
    }
  };

  // Filter channels by type
  const filteredChannels = useMemo(() => {
    if (searchQuery) {
      return searchResults;
    }

    const allChannels: ChannelSearchResult[] = [
      ...channels.regular.map(stream => ({
        name: stream.name || stream,
        type: 'regular' as const,
        status: stream.state || 'unknown',
        vhost: currentVHost,
        app: currentApp,
        metadata: stream
      })),
      ...channels.scheduled.map(channel => ({
        name: channel.name || channel,
        type: 'scheduled' as const,
        status: channel.status || 'unknown',
        vhost: currentVHost,
        app: currentApp,
        metadata: channel
      }))
    ];

    if (filterType === 'all') {
      return allChannels;
    }

    return allChannels.filter(channel => channel.type === filterType);
  }, [channels, searchQuery, searchResults, filterType, currentVHost, currentApp]);

  // Load channels on mount and when vhost/app changes
  useEffect(() => {
    loadChannels();
  }, [currentVHost, currentApp]);

  // Search when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchChannels(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle channel actions
  const handleCreateChannel = (type: 'scheduled') => {
    setModalType(type);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEditChannel = (channel: ChannelSearchResult) => {
    setSelectedChannel(channel);
    setModalType(channel.type as 'scheduled');
    setModalVisible(true);
    form.setFieldsValue(channel.metadata);
  };

  const handleDeleteChannel = async (channel: ChannelSearchResult) => {
    if (!currentVHost || !currentApp) return;

    try {
      if (channel.type === 'scheduled') {
        await omeApi.deleteScheduledChannel(currentVHost, currentApp, channel.name);
        message.success('Scheduled channel deleted successfully');
      } else {
        message.info('Regular streams cannot be deleted through this interface');
      }
      
      loadChannels();
    } catch (error) {
      console.error('Failed to delete channel:', error);
      message.error('Failed to delete channel');
    }
  };

  const handleModalSubmit = async (values: any) => {
    if (!currentVHost || !currentApp || !modalType) return;

    try {
      if (modalType === 'scheduled') {
        if (selectedChannel) {
          await omeApi.updateScheduledChannel(currentVHost, currentApp, selectedChannel.name, values);
          message.success('Scheduled channel updated successfully');
        } else {
          await omeApi.createScheduledChannel(currentVHost, currentApp, values);
          message.success('Scheduled channel created successfully');
        }
      }
      
      setModalVisible(false);
      setSelectedChannel(null);
      loadChannels();
    } catch (error) {
      console.error('Failed to save channel:', error);
      message.error('Failed to save channel');
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'started':
        return 'success';
      case 'inactive':
      case 'stopped':
        return 'default';
      case 'error':
        return 'error';
      default:
        return 'processing';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'regular':
        return <VideoCameraOutlined />;
      case 'scheduled':
        return <CalendarOutlined />;
      case 'multiplex':
        return <NodeIndexOutlined />;
      default:
        return <VideoCameraOutlined />;
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ChannelSearchResult) => (
        <Space>
          {getTypeIcon(record.type)}
          <Text strong>{name}</Text>
          <Tag color="blue">{record.type}</Tag>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase() || 'UNKNOWN'}
        </Tag>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'regular' ? 'green' : type === 'scheduled' ? 'orange' : 'purple'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: ChannelSearchResult) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() => setSelectedChannel(record)}
            />
          </Tooltip>
          {record.type === 'scheduled' && (
            <>
              <Tooltip title="Edit">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEditChannel(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Are you sure you want to delete this channel?"
                onConfirm={() => handleDeleteChannel(record)}
                okText="Yes"
                cancelText="No"
              >
                <Tooltip title="Delete">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Title level={4} style={{ margin: 0 }}>
              Channel & Stream Management
            </Title>
            <Text type="secondary">
              Manage regular streams, scheduled channels, and multiplex channels
            </Text>
          </Col>
          <Col>
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
                onClick={() => handleCreateChannel('scheduled')}
              >
                Scheduled Channel
              </Button>
            </Space>
          </Col>
        </Row>

        <Divider />

        {/* Search and Filter */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search channels and streams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={searchChannels}
              enterButton={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              style={{ width: '100%' }}
              value={filterType}
              onChange={setFilterType}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">All Types</Option>
              <Option value="regular">Regular Streams</Option>
              <Option value="scheduled">Scheduled Channels</Option>
            </Select>
          </Col>
        </Row>

        <Divider />

        {/* Statistics */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8}>
            <Statistic
              title="Total Channels"
              value={channels.total}
              prefix={<VideoCameraOutlined />}
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title="Regular Streams"
              value={channels.regular.length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title="Scheduled Channels"
              value={channels.scheduled.length}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
        </Row>

        <Divider />

        {/* Channels Table */}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredChannels}
            rowKey="name"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} channels`,
            }}
            locale={{
              emptyText: (
                <Empty
                  description={
                    <div>
                      <p>No channels found</p>
                      <p style={{ color: '#666', fontSize: '14px' }}>
                        To create a stream, use OBS, FFmpeg, or another streaming software to push to:
                        <br />
                        <code>rtmp://192.168.1.102:1935/{currentApp}/your_stream_name</code>
                      </p>
                    </div>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        </Spin>
      </Card>

      {/* Channel Details Modal */}
      <Modal
        title={`Scheduled Channel ${selectedChannel ? 'Details' : 'Creation'}`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedChannel(null);
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
        >
          <Tabs defaultActiveKey="basic">
            <TabPane tab="Basic Info" key="basic">
              <Form.Item
                name="name"
                label="Channel Name"
                rules={[{ required: true, message: 'Please enter channel name' }]}
              >
                <Input placeholder="Enter channel name" />
              </Form.Item>

              {modalType === 'scheduled' && (
                <>
                  <Form.Item
                    name="scheduleFile"
                    label="Schedule File Path"
                    rules={[{ required: true, message: 'Please enter schedule file path' }]}
                  >
                    <Input placeholder="/path/to/schedule.sch" />
                  </Form.Item>

                  <Form.Item
                    name="fallbackProgram"
                    label="Fallback Program"
                  >
                    <Input.Group compact>
                      <Form.Item name={['fallbackProgram', 'type']} noStyle>
                        <Select placeholder="Type" style={{ width: '30%' }}>
                          <Option value="file">File</Option>
                          <Option value="stream">Stream</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item name={['fallbackProgram', 'path']} noStyle>
                        <Input placeholder="Path or Stream Name" style={{ width: '70%' }} />
                      </Form.Item>
                    </Input.Group>
                  </Form.Item>
                </>
              )}

            </TabPane>

            <TabPane tab="Advanced" key="advanced">
              <Form.Item
                name="metadata"
                label="Metadata"
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Additional metadata (JSON format)"
                />
              </Form.Item>
            </TabPane>
          </Tabs>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {selectedChannel ? 'Update' : 'Create'} Channel
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

