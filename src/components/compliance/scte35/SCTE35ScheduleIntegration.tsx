import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
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
  Statistic,
  Tooltip,
  Badge,
  Divider,
  Alert,
  Timeline,
  Descriptions,
  Tabs,
  TimePicker,
  InputNumber
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { scte35ScheduleService, ScheduledSCTE35Event, ProgramSCTE35Config, AdBreakSchedule } from '../../../services/scte35ScheduleService';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const SCTE35ScheduleIntegration: React.FC = () => {
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledSCTE35Event[]>([]);
  const [programConfigs, setProgramConfigs] = useState<ProgramSCTE35Config[]>([]);
  const [loading, setLoading] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [adBreakModalVisible, setAdBreakModalVisible] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ScheduledSCTE35Event | null>(null);
  const [serviceStatus, setServiceStatus] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const events = scte35ScheduleService.getAllScheduledEvents();
      const configs = scte35ScheduleService.getAllProgramConfigs();
      const status = scte35ScheduleService.getStatus();

      setScheduledEvents(events);
      setProgramConfigs(configs);
      setServiceStatus(status);
    } catch (error) {
      console.error('Failed to load SCTE-35 schedule data:', error);
      message.error('Failed to load SCTE-35 schedule data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'executed': return 'green';
      case 'scheduled': return 'blue';
      case 'cancelled': return 'orange';
      case 'failed': return 'red';
      default: return 'default';
    }
  };

  const getEventStatusIcon = (status: string) => {
    switch (status) {
      case 'executed': return <CheckCircleOutlined />;
      case 'scheduled': return <ClockCircleOutlined />;
      case 'cancelled': return <PauseCircleOutlined />;
      case 'failed': return <ExclamationCircleOutlined />;
      default: return <WarningOutlined />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'cue_out': return 'red';
      case 'cue_in': return 'green';
      case 'pre_roll': return 'blue';
      case 'post_roll': return 'purple';
      default: return 'default';
    }
  };

  const handleScheduleProgram = (programId: string) => {
    const programStartTime = new Date();
    const eventIds = scte35ScheduleService.scheduleProgramEvents(programId, programStartTime);
    message.success(`Scheduled ${eventIds.length} SCTE-35 events for program: ${programId}`);
    loadData();
  };

  const handleCancelProgram = (programId: string) => {
    const cancelledCount = scte35ScheduleService.cancelProgramEvents(programId);
    message.success(`Cancelled ${cancelledCount} SCTE-35 events for program: ${programId}`);
    loadData();
  };

  const handleEmergencyEvent = (channelId: string, eventType: 'cue_out' | 'cue_in', duration?: number) => {
    const eventId = scte35ScheduleService.addEmergencyEvent(channelId, eventType, duration);
    message.success(`Emergency SCTE-35 event added: ${eventId}`);
    loadData();
  };

  const handleUpdateConfig = (values: any) => {
    scte35ScheduleService.updateProgramConfig(values.programId, values);
    message.success('Program configuration updated');
    setConfigModalVisible(false);
    loadData();
  };

  const eventColumns: ColumnsType<ScheduledSCTE35Event> = [
    {
      title: 'Event ID',
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
      title: 'Program',
      dataIndex: 'programId',
      key: 'programId',
    },
    {
      title: 'Type',
      dataIndex: 'eventType',
      key: 'eventType',
      render: (type: string) => (
        <Tag color={getEventTypeColor(type)}>
          {type.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Event ID',
      dataIndex: 'eventId',
      key: 'eventId',
      render: (id: number) => <Tag color="blue">{id}</Tag>,
    },
    {
      title: 'Scheduled Time',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => duration ? `${Math.round(duration / 1000)}s` : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getEventStatusColor(status)} icon={getEventStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Executed At',
      dataIndex: 'executedAt',
      key: 'executedAt',
      render: (date: Date) => date ? dayjs(date).format('HH:mm:ss') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: ScheduledSCTE35Event) => (
        <Button
          size="small"
          onClick={() => {
            setSelectedEvent(record);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  const configColumns: ColumnsType<ProgramSCTE35Config> = [
    {
      title: 'Program ID',
      dataIndex: 'programId',
      key: 'programId',
    },
    {
      title: 'Channel',
      dataIndex: 'channelId',
      key: 'channelId',
    },
    {
      title: 'SCTE-35 Enabled',
      dataIndex: 'enableSCTE35',
      key: 'enableSCTE35',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? 'Enabled' : 'Disabled'}
        </Tag>
      ),
    },
    {
      title: 'Pre-roll',
      dataIndex: 'preRollEnabled',
      key: 'preRollEnabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'default'}>
          {enabled ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Post-roll',
      dataIndex: 'postRollEnabled',
      key: 'postRollEnabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'default'}>
          {enabled ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Ad Breaks',
      dataIndex: 'adBreakSchedule',
      key: 'adBreakSchedule',
      render: (schedule: AdBreakSchedule[]) => (
        <Badge count={schedule.length} showZero color="blue" />
      ),
    },
    {
      title: 'Default Duration',
      dataIndex: 'defaultAdDuration',
      key: 'defaultAdDuration',
      render: (duration: number) => `${Math.round(duration / 1000)}s`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: ProgramSCTE35Config) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedProgram(record.programId);
              setConfigModalVisible(true);
            }}
          >
            Configure
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => handleScheduleProgram(record.programId)}
          >
            Schedule
          </Button>
          <Button
            size="small"
            danger
            icon={<PauseCircleOutlined />}
            onClick={() => handleCancelProgram(record.programId)}
          >
            Cancel
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <VideoCameraOutlined />
            <span>SCTE-35 Schedule Integration</span>
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
              onClick={() => {
                Modal.confirm({
                  title: 'Emergency CUE-OUT',
                  content: 'Inject emergency CUE-OUT event?',
                  onOk: () => handleEmergencyEvent('channel1', 'cue_out', 300000)
                });
              }}
            >
              Emergency CUE-OUT
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: 'Emergency CUE-IN',
                  content: 'Inject emergency CUE-IN event?',
                  onOk: () => handleEmergencyEvent('channel1', 'cue_in')
                });
              }}
            >
              Emergency CUE-IN
            </Button>
          </Space>
        }
      >
        {/* Status Overview */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={4}>
            <Statistic
              title="Total Events"
              value={serviceStatus?.totalEvents || 0}
              prefix={<HistoryOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Scheduled"
              value={serviceStatus?.scheduledEvents || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Executed"
              value={serviceStatus?.executedEvents || 0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Cancelled"
              value={serviceStatus?.cancelledEvents || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<PauseCircleOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Failed"
              value={serviceStatus?.failedEvents || 0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Programs"
              value={serviceStatus?.configuredPrograms || 0}
              prefix={<CalendarOutlined />}
            />
          </Col>
        </Row>

        <Tabs defaultActiveKey="events">
          <TabPane tab="Scheduled Events" key="events">
            <Table
              columns={eventColumns}
              dataSource={scheduledEvents}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </TabPane>

          <TabPane tab="Program Configurations" key="configs">
            <Table
              columns={configColumns}
              dataSource={programConfigs}
              rowKey="programId"
              loading={loading}
              pagination={false}
              size="small"
            />
          </TabPane>

          <TabPane tab="Emergency Controls" key="emergency">
            <Alert
              message="Emergency SCTE-35 Controls"
              description="Use these controls to immediately inject SCTE-35 events for emergency situations."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="Emergency CUE-OUT">
                  <p>Inject emergency CUE-OUT (ad break start) event immediately.</p>
                  <Button
                    type="primary"
                    danger
                    icon={<ExclamationCircleOutlined />}
                    onClick={() => {
                      Modal.confirm({
                        title: 'Emergency CUE-OUT',
                        content: 'Inject emergency CUE-OUT event?',
                        onOk: () => handleEmergencyEvent('channel1', 'cue_out', 300000)
                      });
                    }}
                  >
                    Emergency CUE-OUT
                  </Button>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Emergency CUE-IN">
                  <p>Inject emergency CUE-IN (ad break end) event immediately.</p>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => {
                      Modal.confirm({
                        title: 'Emergency CUE-IN',
                        content: 'Inject emergency CUE-IN event?',
                        onOk: () => handleEmergencyEvent('channel1', 'cue_in')
                      });
                    }}
                  >
                    Emergency CUE-IN
                  </Button>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* Program Configuration Modal */}
      <Modal
        title="Program SCTE-35 Configuration"
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form onFinish={handleUpdateConfig} layout="vertical">
          <Form.Item name="programId" label="Program ID" rules={[{ required: true }]}>
            <Input placeholder="Program ID" />
          </Form.Item>
          
          <Form.Item name="channelId" label="Channel ID" rules={[{ required: true }]}>
            <Select placeholder="Select channel">
              <Option value="channel1">Main Channel</Option>
              <Option value="channel2">Music Channel</Option>
              <Option value="channel3">News Channel</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="enableSCTE35" label="Enable SCTE-35" valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item name="preRollEnabled" label="Enable Pre-roll" valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item name="postRollEnabled" label="Enable Post-roll" valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item name="defaultAdDuration" label="Default Ad Duration (seconds)">
            <InputNumber min={1} max={600} placeholder="180" />
          </Form.Item>
          
          <Form.Item name="defaultPreRoll" label="Default Pre-roll (seconds)">
            <InputNumber min={1} max={30} placeholder="5" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Configuration
              </Button>
              <Button onClick={() => setConfigModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Event Details Modal */}
      <Modal
        title="SCTE-35 Event Details"
        open={!!selectedEvent}
        onCancel={() => setSelectedEvent(null)}
        footer={null}
        width={600}
      >
        {selectedEvent && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Event ID">
              {selectedEvent.id}
            </Descriptions.Item>
            <Descriptions.Item label="Channel">
              {selectedEvent.channelId}
            </Descriptions.Item>
            <Descriptions.Item label="Program">
              {selectedEvent.programId}
            </Descriptions.Item>
            <Descriptions.Item label="Event Type">
              <Tag color={getEventTypeColor(selectedEvent.eventType)}>
                {selectedEvent.eventType.replace(/_/g, ' ').toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="SCTE-35 Event ID">
              {selectedEvent.eventId}
            </Descriptions.Item>
            <Descriptions.Item label="Scheduled Time">
              {dayjs(selectedEvent.scheduledTime).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="Duration">
              {selectedEvent.duration ? `${Math.round(selectedEvent.duration / 1000)}s` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Pre-roll">
              {selectedEvent.preRoll ? `${Math.round(selectedEvent.preRoll / 1000)}s` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getEventStatusColor(selectedEvent.status)} icon={getEventStatusIcon(selectedEvent.status)}>
                {selectedEvent.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            {selectedEvent.executedAt && (
              <Descriptions.Item label="Executed At">
                {dayjs(selectedEvent.executedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
            {selectedEvent.error && (
              <Descriptions.Item label="Error">
                <Tag color="red">{selectedEvent.error}</Tag>
              </Descriptions.Item>
            )}
            {selectedEvent.metadata && (
              <Descriptions.Item label="Metadata">
                <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default SCTE35ScheduleIntegration;
