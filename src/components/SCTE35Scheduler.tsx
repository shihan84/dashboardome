import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  DatePicker,
  TimePicker,
  InputNumber,
  Button,
  Table,
  Space,
  Typography,
  Popconfirm,
  Tag,
  Row,
  Col,
  message,
  Alert,
} from 'antd';
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import type { SCTE35Event } from '../types/index';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface ScheduledEvent {
  id: string;
  action: 'CUE-OUT' | 'CUE-IN';
  eventId: number;
  adDuration?: number;
  preRoll?: number;
  scheduledTime: Date;
  status: 'scheduled' | 'executed' | 'cancelled';
}

export const SCTE35Scheduler: React.FC = () => {
  const [form] = Form.useForm();
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const { addEvent, lastEventId } = useStore();

  useEffect(() => {
    // Load scheduled events from localStorage
    const stored = localStorage.getItem('scheduled-scte35-events');
    if (stored) {
      try {
        const events: ScheduledEvent[] = JSON.parse(stored).map((event: any) => ({
          ...event,
          scheduledTime: new Date(event.scheduledTime),
          status: (event.status as 'scheduled' | 'executed' | 'cancelled')
        }));
        setScheduledEvents(events);
      } catch (error) {
        console.error('Failed to load scheduled events:', error);
      }
    }
  }, []);

  const saveScheduledEvents = (events: ScheduledEvent[]) => {
    localStorage.setItem('scheduled-scte35-events', JSON.stringify(events));
    setScheduledEvents(events);
  };

  const handleSchedule = async (values: any) => {
    const scheduledTime = values.dateTime.toDate();
    const eventId = values.eventId || lastEventId + 1;

    const newEvent: ScheduledEvent = {
      id: `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action: values.action,
      eventId,
      adDuration: values.adDuration,
      preRoll: values.preRoll,
      scheduledTime,
        status: 'scheduled' as const,
    };

    const updatedEvents: ScheduledEvent[] = [...scheduledEvents, newEvent];
    saveScheduledEvents(updatedEvents);

    form.resetFields();
    message.success('Event scheduled successfully!');
  };

  const handleCancel = (id: string) => {
    const updatedEvents = scheduledEvents.map(event =>
      event.id === id ? { ...event, status: 'cancelled' as const } : event
    );
    saveScheduledEvents(updatedEvents);
  };

  const handleDelete = (id: string) => {
    const updatedEvents = scheduledEvents.filter(event => event.id !== id);
    saveScheduledEvents(updatedEvents);
  };

  const executeScheduledEvent = (event: ScheduledEvent) => {
    // Add to main event log
    addEvent({
      action: event.action,
      eventId: event.eventId,
      adDuration: event.adDuration,
      preRoll: event.preRoll,
      status: 'sent',
    });

    // Mark as executed
    const updatedEvents = scheduledEvents.map(e =>
      e.id === event.id ? { ...e, status: 'executed' as const } : e
    );
    saveScheduledEvents(updatedEvents);
  };

  // Check for events that should be executed
  useEffect(() => {
    const now = new Date();
    const toExecute = scheduledEvents.filter(
      event => 
        event.status === 'scheduled' && 
        event.scheduledTime <= now
    );

    toExecute.forEach(event => {
      executeScheduledEvent(event);
    });
  }, [scheduledEvents]);

  const columns = [
    {
      title: 'Event ID',
      dataIndex: 'eventId',
      key: 'eventId',
      width: 100,
      render: (eventId: number) => <Text code>{eventId}</Text>,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: ScheduledEvent['action']) => (
        <Space>
          {action === 'CUE-OUT' ? (
            <PlayCircleOutlined style={{ color: '#52c41a' }} />
          ) : (
            <PauseCircleOutlined style={{ color: '#ff4d4f' }} />
          )}
          <Tag color={action === 'CUE-OUT' ? 'green' : 'red'}>
            {action}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'adDuration',
      key: 'adDuration',
      width: 100,
      render: (duration: number | undefined) => duration ? `${duration}s` : '-',
    },
    {
      title: 'Scheduled Time',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      width: 180,
      render: (time: Date) => (
        <Text type="secondary">
          {dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ScheduledEvent['status']) => {
        const colors = {
          scheduled: 'blue',
          executed: 'green',
          cancelled: 'red',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: ScheduledEvent) => (
        <Space>
          {record.status === 'scheduled' && (
            <Popconfirm
              title="Cancel this scheduled event?"
              onConfirm={() => handleCancel(record.id)}
            >
              <Button size="small" type="link">
                Cancel
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Delete this scheduled event?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const upcomingEvents = scheduledEvents.filter(
    event => event.status === 'scheduled' && event.scheduledTime > new Date()
  ).length;

  const executedEvents = scheduledEvents.filter(
    event => event.status === 'executed'
  ).length;

  return (
    <Card
      title={
        <Space>
          <ClockCircleOutlined />
          <span>SCTE-35 Event Scheduler</span>
        </Space>
      }
    >
      <Alert
        message="Scheduled Events"
        description="Schedule future SCTE-35 injections for automated ad break management. Events are stored locally and executed automatically at the specified time."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                {upcomingEvents}
              </Title>
              <Text type="secondary">Upcoming Events</Text>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                {executedEvents}
              </Title>
              <Text type="secondary">Executed Events</Text>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#666' }}>
                {scheduledEvents.length}
              </Title>
              <Text type="secondary">Total Events</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSchedule}
        initialValues={{
          action: 'CUE-OUT',
          eventId: lastEventId + 1,
          adDuration: 30,
          preRoll: 0,
        }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              name="action"
              label="Action"
              rules={[{ required: true, message: 'Please select action' }]}
            >
              <select style={{ width: '100%', padding: '4px 8px', borderRadius: '6px', border: '1px solid #d9d9d9' }}>
                <option value="CUE-OUT">CUE-OUT (Ad Start)</option>
                <option value="CUE-IN">CUE-IN (Ad Stop)</option>
              </select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="eventId"
              label="Event ID"
              rules={[{ required: true, message: 'Please enter event ID' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Auto-incremented"
                min={1}
                precision={0}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="dateTime"
              label="Schedule Time"
              rules={[{ required: true, message: 'Please select time' }]}
            >
              <DatePicker
                showTime
                style={{ width: '100%' }}
                placeholder="Select date and time"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="adDuration"
              label="Ad Duration (s)"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="30"
                min={1}
                max={3600}
                precision={0}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<PlusOutlined />}
            loading={loading}
          >
            Schedule Event
          </Button>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={scheduledEvents}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} scheduled events`,
        }}
        size="small"
      />
    </Card>
  );
};
