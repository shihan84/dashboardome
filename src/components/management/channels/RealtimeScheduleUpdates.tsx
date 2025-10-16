import React, { useState, useEffect } from 'react';
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
  Row,
  Col,
  Statistic,
  Progress,
  Tooltip,
  Badge,
  Divider,
  Alert,
  Timeline,
  Descriptions,
  Tabs
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
  DownloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  HistoryOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { scheduleUpdateService, ScheduleUpdate, EmergencyContent } from '../../../services/scheduleUpdateService';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const RealtimeScheduleUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<ScheduleUpdate[]>([]);
  const [emergencyQueue, setEmergencyQueue] = useState<EmergencyContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<ScheduleUpdate | null>(null);
  const [serviceStatus, setServiceStatus] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const updatesData = scheduleUpdateService.getUpdates(50);
      const emergencyData = scheduleUpdateService.getEmergencyQueue();
      const status = scheduleUpdateService.getStatus();

      setUpdates(updatesData);
      setEmergencyQueue(emergencyData);
      setServiceStatus(status);
    } catch (error) {
      console.error('Failed to load schedule update data:', error);
      message.error('Failed to load schedule update data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const getUpdateStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'processing': return 'blue';
      case 'failed': return 'red';
      case 'pending': return 'orange';
      default: return 'default';
    }
  };

  const getUpdateStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined />;
      case 'processing': return <ClockCircleOutlined />;
      case 'failed': return <ExclamationCircleOutlined />;
      case 'pending': return <WarningOutlined />;
      default: return <WarningOutlined />;
    }
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'red';
      case 'insert': return 'green';
      case 'modify': return 'blue';
      case 'delete': return 'orange';
      default: return 'default';
    }
  };

  const getEmergencyTypeColor = (type: string) => {
    switch (type) {
      case 'breaking_news': return 'red';
      case 'emergency_announcement': return 'orange';
      case 'commercial': return 'blue';
      case 'weather_alert': return 'yellow';
      default: return 'default';
    }
  };

  const handleEmergencyInsert = (values: any) => {
    const emergencyContent: EmergencyContent = {
      id: `emergency_${Date.now()}`,
      type: values.type,
      title: values.title,
      content: values.content,
      duration: values.duration * 1000, // Convert to milliseconds
      priority: 0,
      startTime: new Date(),
      contentUrl: values.contentUrl,
      streamUrl: values.streamUrl
    };

    const updateId = scheduleUpdateService.insertEmergencyContent(values.channelId, emergencyContent);
    message.success(`Emergency content queued: ${updateId}`);
    setEmergencyModalVisible(false);
    loadData();
  };

  const handleProgramModification = (values: any) => {
    const updateId = scheduleUpdateService.modifyProgram(
      values.channelId,
      values.programId,
      values.newData,
      values.reason
    );
    message.success(`Program modification queued: ${updateId}`);
    setModalVisible(false);
    loadData();
  };

  const handleProgramDeletion = (values: any) => {
    const updateId = scheduleUpdateService.deleteProgram(
      values.channelId,
      values.programId,
      values.reason
    );
    message.success(`Program deletion queued: ${updateId}`);
    setModalVisible(false);
    loadData();
  };

  const handleProgramInsertion = (values: any) => {
    const updateId = scheduleUpdateService.insertProgram(
      values.channelId,
      values.programData,
      values.reason
    );
    message.success(`Program insertion queued: ${updateId}`);
    setModalVisible(false);
    loadData();
  };

  const updateColumns: ColumnsType<ScheduleUpdate> = [
    {
      title: 'Update ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => (
        <Tooltip title={text}>
          <code style={{ fontSize: '12px' }}>{text.substring(0, 20)}...</code>
        </Tooltip>
      ),
    },
    {
      title: 'Channel',
      dataIndex: 'channelId',
      key: 'channelId',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getUpdateTypeColor(type)}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getUpdateStatusColor(status)} icon={getUpdateStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: ScheduleUpdate) => (
        <Button
          size="small"
          onClick={() => {
            setSelectedUpdate(record);
            setModalVisible(true);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  const emergencyColumns: ColumnsType<EmergencyContent> = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getEmergencyTypeColor(type)}>
          {type.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => `${Math.round(duration / 1000)}s`,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => (
        <Tag color={priority === 0 ? 'red' : 'orange'}>
          {priority === 0 ? 'CRITICAL' : 'HIGH'}
        </Tag>
      ),
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (date: Date) => dayjs(date).format('HH:mm:ss'),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <ThunderboltOutlined />
            <span>Real-time Schedule Updates</span>
            <Tag color={serviceStatus?.isProcessing ? 'green' : 'red'}>
              {serviceStatus?.isProcessing ? 'Processing Active' : 'Processing Inactive'}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              danger
              icon={<ExclamationCircleOutlined />}
              onClick={() => setEmergencyModalVisible(true)}
            >
              Emergency Insert
            </Button>
          </Space>
        }
      >
        {/* Status Overview */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="Total Updates"
              value={serviceStatus?.totalUpdates || 0}
              prefix={<HistoryOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Pending"
              value={serviceStatus?.pendingUpdates || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Completed"
              value={serviceStatus?.completedUpdates || 0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Failed"
              value={serviceStatus?.failedUpdates || 0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Col>
        </Row>

        <Tabs defaultActiveKey="updates">
          <TabPane tab="Schedule Updates" key="updates">
            <Table
              columns={updateColumns}
              dataSource={updates}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </TabPane>

          <TabPane tab="Emergency Queue" key="emergency">
            <Alert
              message="Emergency Content Queue"
              description="Critical content that will be inserted immediately into the schedule with highest priority."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={emergencyColumns}
              dataSource={emergencyQueue}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </TabPane>

          <TabPane tab="Quick Actions" key="actions">
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" title="Insert Program">
                  <Form onFinish={handleProgramInsertion} layout="vertical">
                    <Form.Item name="channelId" label="Channel ID" rules={[{ required: true }]}>
                      <Select placeholder="Select channel">
                        <Option value="channel1">Main Channel</Option>
                        <Option value="channel2">Music Channel</Option>
                        <Option value="channel3">News Channel</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
                      <Input placeholder="Reason for insertion" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" block>
                        Queue Insertion
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="Modify Program">
                  <Form onFinish={handleProgramModification} layout="vertical">
                    <Form.Item name="channelId" label="Channel ID" rules={[{ required: true }]}>
                      <Select placeholder="Select channel">
                        <Option value="channel1">Main Channel</Option>
                        <Option value="channel2">Music Channel</Option>
                        <Option value="channel3">News Channel</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name="programId" label="Program ID" rules={[{ required: true }]}>
                      <Input placeholder="Program ID to modify" />
                    </Form.Item>
                    <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
                      <Input placeholder="Reason for modification" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" block>
                        Queue Modification
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="Delete Program">
                  <Form onFinish={handleProgramDeletion} layout="vertical">
                    <Form.Item name="channelId" label="Channel ID" rules={[{ required: true }]}>
                      <Select placeholder="Select channel">
                        <Option value="channel1">Main Channel</Option>
                        <Option value="channel2">Music Channel</Option>
                        <Option value="channel3">News Channel</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name="programId" label="Program ID" rules={[{ required: true }]}>
                      <Input placeholder="Program ID to delete" />
                    </Form.Item>
                    <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
                      <Input placeholder="Reason for deletion" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" danger htmlType="submit" block>
                        Queue Deletion
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* Emergency Content Modal */}
      <Modal
        title="Insert Emergency Content"
        open={emergencyModalVisible}
        onCancel={() => setEmergencyModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form onFinish={handleEmergencyInsert} layout="vertical">
          <Form.Item name="channelId" label="Channel" rules={[{ required: true }]}>
            <Select placeholder="Select channel">
              <Option value="channel1">Main Channel</Option>
              <Option value="channel2">Music Channel</Option>
              <Option value="channel3">News Channel</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="type" label="Emergency Type" rules={[{ required: true }]}>
            <Select placeholder="Select emergency type">
              <Option value="breaking_news">Breaking News</Option>
              <Option value="emergency_announcement">Emergency Announcement</Option>
              <Option value="commercial">Commercial Break</Option>
              <Option value="weather_alert">Weather Alert</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Emergency content title" />
          </Form.Item>
          
          <Form.Item name="content" label="Content">
            <TextArea rows={3} placeholder="Emergency content description" />
          </Form.Item>
          
          <Form.Item name="duration" label="Duration (seconds)" rules={[{ required: true }]}>
            <Input type="number" placeholder="Duration in seconds" />
          </Form.Item>
          
          <Form.Item name="contentUrl" label="Content URL (optional)">
            <Input placeholder="URL to emergency content" />
          </Form.Item>
          
          <Form.Item name="streamUrl" label="Stream URL (optional)">
            <Input placeholder="URL to emergency stream" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">
                Insert Emergency Content
              </Button>
              <Button onClick={() => setEmergencyModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Update Details Modal */}
      <Modal
        title="Update Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedUpdate && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Update ID">
              {selectedUpdate.id}
            </Descriptions.Item>
            <Descriptions.Item label="Channel">
              {selectedUpdate.channelId}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color={getUpdateTypeColor(selectedUpdate.type)}>
                {selectedUpdate.type.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getUpdateStatusColor(selectedUpdate.status)} icon={getUpdateStatusIcon(selectedUpdate.status)}>
                {selectedUpdate.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Timestamp">
              {dayjs(selectedUpdate.timestamp).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="Data">
              <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                {JSON.stringify(selectedUpdate.data, null, 2)}
              </pre>
            </Descriptions.Item>
            {selectedUpdate.error && (
              <Descriptions.Item label="Error">
                <Tag color="red">{selectedUpdate.error}</Tag>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default RealtimeScheduleUpdates;
