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
  Modal, 
  Tabs,
  DatePicker,
  Timeline,
  message,
  Statistic,
  Switch
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  ClockCircleOutlined,
  FileTextOutlined,
  SendOutlined,
  CalendarOutlined,
  HistoryOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
// const { TextArea } = Input; // Removed unused import
const { RangePicker } = DatePicker;

interface Application {
  name: string;
  vhost: string;
}

interface SCTE35Event {
  id: string;
  action: 'CUE-OUT' | 'CUE-IN';
  eventId: number;
  adDuration?: number;
  preRoll?: number;
  scheduledTime?: Date;
  status: 'scheduled' | 'executed' | 'cancelled' | 'failed';
  timestamp: Date;
  streamName?: string;
  message?: string;
}

interface ScheduledEvent {
  id: string;
  action: 'CUE-OUT' | 'CUE-IN';
  eventId: number;
  adDuration?: number;
  preRoll?: number;
  scheduledTime: Date;
  status: 'scheduled' | 'executed' | 'cancelled';
}

interface StreamInfo {
  vhost: string;
  app: string;
  stream: any;
}

export const SCTE35Manager: React.FC = () => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [streams, setStreams] = useState<StreamInfo[]>([]);
  const [events, setEvents] = useState<SCTE35Event[]>([]);
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scte35Enabled, setScte35Enabled] = useState(false);
  const [injectionModalVisible, setInjectionModalVisible] = useState(false);
  const [schedulerModalVisible, setSchedulerModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SCTE35Event | null>(null);
  const [injectionForm] = Form.useForm();
  const [schedulerForm] = Form.useForm();
  const [eventForm] = Form.useForm();

  // Filters for event log
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [searchText, setSearchText] = useState('');

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const vhostsResponse = await omeApi.getVHosts();
      const allApps: Application[] = [];
      
      if (vhostsResponse.success) {
        for (const vhost of vhostsResponse.data) {
          const vhostName = typeof vhost === 'string' ? vhost : vhost.name;
          const appsResponse = await omeApi.getApplications(vhostName).catch(() => ({ success: false, data: [] }));
          if (appsResponse.success) {
            for (const app of appsResponse.data) {
              allApps.push({ name: app.name, vhost: vhostName });
            }
          }
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

  const loadStreams = useCallback(async (app: Application) => {
    if (!app) return;
    
    setLoading(true);
    try {
      const allStreams = await omeApi.getAllStreams();
      const appStreams = allStreams
        .filter(s => s.vhost === app.vhost && s.app === app.name)
        .map(({ vhost, app, stream }) => ({ vhost, app, stream }));

      setStreams(appStreams);
    } catch (e: any) {
      setError('Failed to load streams');
    } finally {
      setLoading(false);
    }
  }, [omeApi]);

  const loadEvents = useCallback(async (app: Application) => {
    if (!app) return;
    
    try {
      const eventsResponse = await omeApi.getSCTE35Events(app.vhost, app.name, 'default');
      if (eventsResponse.success) {
        setEvents(eventsResponse.data);
      } else {
        setEvents([]);
      }
    } catch (e: any) {
      console.warn('Failed to load SCTE-35 events');
      setEvents([]);
    }
  }, [omeApi]);

  const loadScheduledEvents = useCallback(async (app: Application) => {
    if (!app) return;
    
    try {
      const scheduled = await omeApi.getScheduledSCTE35Events(app.vhost, app.name);
      setScheduledEvents(scheduled);
    } catch (e: any) {
      console.warn('Failed to load scheduled events');
    }
  }, [omeApi]);

  const handleToggleSCTE35 = useCallback(async (enabled: boolean) => {
    try {
      setScte35Enabled(enabled);
      if (enabled) {
        message.success('SCTE-35 injection enabled for all streams');
      } else {
        message.info('SCTE-35 injection disabled for all streams');
      }
    } catch (error) {
      console.error('Failed to toggle SCTE-35:', error);
      message.error('Failed to toggle SCTE-35 injection');
      setScte35Enabled(!enabled); // Revert on error
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    if (selectedApp) {
      loadStreams(selectedApp);
      loadEvents(selectedApp);
      loadScheduledEvents(selectedApp);
    }
  }, [selectedApp, loadStreams, loadEvents, loadScheduledEvents]);

  const handleInjectEvent = async (values: any) => {
    if (!selectedApp) return;
    
    try {
      const eventData = {
        action: values.action,
        eventId: values.eventId,
        adDuration: values.adDuration,
        preRoll: values.preRoll,
        streamName: values.streamName
      };

      if (values.eventType === 'CUE-OUT') {
        await omeApi.sendSCTE35CueOut(selectedApp.vhost, selectedApp.name, values.streamName, values.eventId, values.adDuration * 1000);
      } else if (values.eventType === 'CUE-IN') {
        await omeApi.sendSCTE35CueIn(selectedApp.vhost, selectedApp.name, values.streamName, values.eventId);
      }
      message.success('SCTE-35 event injected successfully');
      setInjectionModalVisible(false);
      injectionForm.resetFields();
      loadEvents(selectedApp);
    } catch (e: any) {
      message.error('Failed to inject SCTE-35 event');
    }
  };

  const handleScheduleEvent = async (values: any) => {
    if (!selectedApp) return;
    
    try {
      const eventData = {
        action: values.action,
        eventId: values.eventId,
        adDuration: values.adDuration,
        preRoll: values.preRoll,
        scheduledTime: values.scheduledTime.toDate(),
        streamName: values.streamName
      };

      await omeApi.scheduleSCTE35Event(selectedApp.vhost, selectedApp.name, values.streamName, eventData);
      message.success('SCTE-35 event scheduled successfully');
      setSchedulerModalVisible(false);
      schedulerForm.resetFields();
      loadScheduledEvents(selectedApp);
    } catch (e: any) {
      message.error('Failed to schedule SCTE-35 event');
    }
  };

  const handleCancelScheduledEvent = async (eventId: string) => {
    if (!selectedApp) return;
    
    try {
      await omeApi.cancelScheduledSCTE35Event(selectedApp.vhost, selectedApp.name, 'default', eventId);
      message.success('Scheduled event cancelled');
      loadScheduledEvents(selectedApp);
    } catch (e: any) {
      message.error('Failed to cancel scheduled event');
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'executed': return 'green';
      case 'scheduled': return 'blue';
      case 'cancelled': return 'gray';
      case 'failed': return 'red';
      default: return 'default';
    }
  };

  const getActionColor = (action: string) => {
    return action === 'CUE-OUT' ? 'red' : 'green';
  };

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === statusFilter);
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(event => event.action === actionFilter);
    }

    if (dateRange) {
      const [start, end] = dateRange;
      filtered = filtered.filter(event => 
        dayjs(event.timestamp).isAfter(start) && dayjs(event.timestamp).isBefore(end)
      );
    }

    if (searchText) {
      filtered = filtered.filter(event => 
        event.streamName?.toLowerCase().includes(searchText.toLowerCase()) ||
        event.message?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return filtered;
  }, [events, statusFilter, actionFilter, dateRange, searchText]);

  const eventColumns = [
    {
      title: 'Event ID',
      dataIndex: 'eventId',
      key: 'eventId',
      render: (id: number) => <Text code>{id}</Text>,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color={getActionColor(action)}>
          {action}
        </Tag>
      ),
    },
    {
      title: 'Stream',
      dataIndex: 'streamName',
      key: 'streamName',
      render: (name: string) => name || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getEventStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'adDuration',
      key: 'adDuration',
      render: (duration: number) => duration ? `${duration}s` : 'N/A',
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: Date) => dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: SCTE35Event) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingEvent(record);
              setEventModalVisible(true);
            }}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  const scheduledColumns = [
    {
      title: 'Event ID',
      dataIndex: 'eventId',
      key: 'eventId',
      render: (id: number) => <Text code>{id}</Text>,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color={getActionColor(action)}>
          {action}
        </Tag>
      ),
    },
    {
      title: 'Scheduled Time',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      render: (time: Date) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getEventStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'adDuration',
      key: 'adDuration',
      render: (duration: number) => duration ? `${duration}s` : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ScheduledEvent) => (
        <Space>
          {record.status === 'scheduled' && (
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleCancelScheduledEvent(record.id)}
            >
              Cancel
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const getTotalStats = () => {
    const totalEvents = events.length;
    const executedEvents = events.filter((e: any) => e.status === 'executed').length;
    const totalScheduledEvents = scheduledEvents.length;
    const activeScheduled = scheduledEvents.filter((e: any) => e.status === 'scheduled').length;
    
    return {
      totalEvents,
      executedEvents,
      scheduledEvents: totalScheduledEvents,
      activeScheduled,
    };
  };

  const stats = getTotalStats();

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    } else {
      setDateRange(null);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {error && <Alert type="error" message={error} showIcon />}
      
      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>SCTE-35 Compliance Management</Title>
            <Tag color={scte35Enabled ? 'green' : 'default'}>
              {scte35Enabled ? 'Enabled' : 'Disabled'}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Space>
              <Text strong>SCTE-35 Injection:</Text>
              <Switch
                checked={scte35Enabled}
                onChange={handleToggleSCTE35}
                checkedChildren={<PlayCircleOutlined />}
                unCheckedChildren={<PauseCircleOutlined />}
                style={{ marginLeft: 8 }}
              />
            </Space>
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
              icon={<SendOutlined />}
              onClick={() => setInjectionModalVisible(true)}
              disabled={!selectedApp}
            >
              Inject Event
            </Button>
            <Button
              icon={<CalendarOutlined />}
              onClick={() => setSchedulerModalVisible(true)}
              disabled={!selectedApp}
            >
              Schedule Event
            </Button>
          </Space>
        }
      >
        {selectedApp && (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Events"
                    value={stats.totalEvents}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Executed Events"
                    value={stats.executedEvents}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Scheduled Events"
                    value={stats.scheduledEvents}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Active Scheduled"
                    value={stats.activeScheduled}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>

            <Tabs defaultActiveKey="events">
              <TabPane tab="Event Log" key="events">
                <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <Input
                      placeholder="Search events..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ width: 200 }}
                    />
                    <Select
                      value={statusFilter}
                      onChange={setStatusFilter}
                      style={{ width: 120 }}
                    >
                      <Option value="all">All Status</Option>
                      <Option value="executed">Executed</Option>
                      <Option value="scheduled">Scheduled</Option>
                      <Option value="cancelled">Cancelled</Option>
                      <Option value="failed">Failed</Option>
                    </Select>
                    <Select
                      value={actionFilter}
                      onChange={setActionFilter}
                      style={{ width: 120 }}
                    >
                      <Option value="all">All Actions</Option>
                      <Option value="CUE-OUT">CUE-OUT</Option>
                      <Option value="CUE-IN">CUE-IN</Option>
                    </Select>
                    <RangePicker
                      value={dateRange}
                      onChange={handleDateRangeChange}
                    />
                  </Space>
                  <Space>
                    <Button
                      icon={viewMode === 'table' ? <HistoryOutlined /> : <FileTextOutlined />}
                      onClick={() => setViewMode(viewMode === 'table' ? 'timeline' : 'table')}
                    >
                      {viewMode === 'table' ? 'Timeline View' : 'Table View'}
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => loadEvents(selectedApp!)}
                    >
                      Refresh
                    </Button>
                  </Space>
                </Space>

                {viewMode === 'table' ? (
                  <Table
                    columns={eventColumns}
                    dataSource={filteredEvents}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                ) : (
                  <Timeline>
                    {filteredEvents.map((event, index) => (
                      <Timeline.Item
                        key={event.id}
                        color={getEventStatusColor(event.status)}
                        dot={event.status === 'executed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                      >
                        <Card size="small">
                          <Space>
                            <Tag color={getActionColor(event.action)}>{event.action}</Tag>
                            <Text strong>Event ID: {event.eventId}</Text>
                            <Text type="secondary">
                              {dayjs(event.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                            </Text>
                            {event.adDuration && (
                              <Text type="secondary">Duration: {event.adDuration}s</Text>
                            )}
                          </Space>
                        </Card>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                )}
              </TabPane>
              <TabPane tab="Scheduled Events" key="scheduled">
                <Table
                  columns={scheduledColumns}
                  dataSource={scheduledEvents}
                  loading={loading}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              </TabPane>
              <TabPane tab="Configuration" key="config">
                <Row gutter={16}>
                  <Col span={12}>
                    <Card title="SCTE-35 Configuration" size="small">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Enabled">
                          <Tag color="green">Yes</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Default Event ID">
                          1
                        </Descriptions.Item>
                        <Descriptions.Item label="Default Duration">
                          30 seconds
                        </Descriptions.Item>
                        <Descriptions.Item label="Pre-roll">
                          2 seconds
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="Stream Information" size="small">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Available Streams">
                          {streams.length}
                        </Descriptions.Item>
                        <Descriptions.Item label="Active Streams">
                          {streams.filter(s => s.stream.state === 'streaming').length}
                        </Descriptions.Item>
                        <Descriptions.Item label="Last Event">
                          {events.length > 0 ? dayjs(events[0].timestamp).format('YYYY-MM-DD HH:mm:ss') : 'None'}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </>
        )}
      </Card>

      {/* Injection Modal */}
      <Modal
        title="Inject SCTE-35 Event"
        open={injectionModalVisible}
        onCancel={() => {
          setInjectionModalVisible(false);
          injectionForm.resetFields();
        }}
        onOk={() => injectionForm.submit()}
        width={600}
      >
        <Form
          form={injectionForm}
          layout="vertical"
          onFinish={handleInjectEvent}
        >
          <Form.Item
            name="streamName"
            label="Stream Name"
            rules={[{ required: true, message: 'Please select stream' }]}
          >
            <Select placeholder="Select stream">
              {streams.map(stream => (
                <Option key={stream.stream.name} value={stream.stream.name}>
                  {stream.stream.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="action"
            label="Action"
            rules={[{ required: true, message: 'Please select action' }]}
          >
            <Select>
              <Option value="CUE-OUT">CUE-OUT</Option>
              <Option value="CUE-IN">CUE-IN</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="eventId"
            label="Event ID"
            rules={[{ required: true, message: 'Please enter event ID' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="adDuration"
            label="Ad Duration (seconds)"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="preRoll"
            label="Pre-roll (seconds)"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Scheduler Modal */}
      <Modal
        title="Schedule SCTE-35 Event"
        open={schedulerModalVisible}
        onCancel={() => {
          setSchedulerModalVisible(false);
          schedulerForm.resetFields();
        }}
        onOk={() => schedulerForm.submit()}
        width={600}
      >
        <Form
          form={schedulerForm}
          layout="vertical"
          onFinish={handleScheduleEvent}
        >
          <Form.Item
            name="streamName"
            label="Stream Name"
            rules={[{ required: true, message: 'Please select stream' }]}
          >
            <Select placeholder="Select stream">
              {streams.map(stream => (
                <Option key={stream.stream.name} value={stream.stream.name}>
                  {stream.stream.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="action"
            label="Action"
            rules={[{ required: true, message: 'Please select action' }]}
          >
            <Select>
              <Option value="CUE-OUT">CUE-OUT</Option>
              <Option value="CUE-IN">CUE-IN</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="eventId"
            label="Event ID"
            rules={[{ required: true, message: 'Please enter event ID' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="scheduledTime"
            label="Scheduled Time"
            rules={[{ required: true, message: 'Please select scheduled time' }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Form.Item>

          <Form.Item
            name="adDuration"
            label="Ad Duration (seconds)"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="preRoll"
            label="Pre-roll (seconds)"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Event Details Modal */}
      <Modal
        title="Event Details"
        open={eventModalVisible}
        onCancel={() => {
          setEventModalVisible(false);
          setEditingEvent(null);
        }}
        footer={null}
        width={500}
      >
        {editingEvent && (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Event ID">
              {editingEvent.eventId}
            </Descriptions.Item>
            <Descriptions.Item label="Action">
              <Tag color={getActionColor(editingEvent.action)}>
                {editingEvent.action}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getEventStatusColor(editingEvent.status)}>
                {editingEvent.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Stream">
              {editingEvent.streamName || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Duration">
              {editingEvent.adDuration ? `${editingEvent.adDuration}s` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Pre-roll">
              {editingEvent.preRoll ? `${editingEvent.preRoll}s` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Timestamp">
              {dayjs(editingEvent.timestamp).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {editingEvent.message && (
              <Descriptions.Item label="Message">
                {editingEvent.message}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </Space>
  );
};