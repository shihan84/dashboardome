import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Timeline,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Button,
  Select,
  DatePicker,
  Input,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import type { SCTE35Event } from '../types/index';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export const SCTE35EventLog: React.FC = () => {
  const [filteredEvents, setFilteredEvents] = useState<SCTE35Event[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [searchText, setSearchText] = useState('');

  const { events, isConnected } = useStore();

  useEffect(() => {
    let filtered = [...events];

    // Apply filters
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === statusFilter);
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(event => event.action === actionFilter);
    }

    if (dateRange) {
      const [start, end] = dateRange;
      filtered = filtered.filter(event => {
        const eventDate = dayjs(event.timestamp);
        return eventDate.isAfter(start) && eventDate.isBefore(end);
      });
    }

    if (searchText) {
      filtered = filtered.filter(event =>
        event.id.toLowerCase().includes(searchText.toLowerCase()) ||
        event.eventId.toString().includes(searchText)
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setFilteredEvents(filtered);
  }, [events, statusFilter, actionFilter, dateRange, searchText]);

  const getStatusColor = (status: SCTE35Event['status']) => {
    switch (status) {
      case 'sent':
        return 'processing';
      case 'confirmed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: SCTE35Event['status']) => {
    switch (status) {
      case 'sent':
        return <ClockCircleOutlined />;
      case 'confirmed':
        return <CheckCircleOutlined />;
      case 'failed':
        return <ExclamationCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const getActionIcon = (action: SCTE35Event['action']) => {
    return action === 'CUE-OUT' ? (
      <PlayCircleOutlined style={{ color: '#52c41a' }} />
    ) : (
      <PauseCircleOutlined style={{ color: '#ff4d4f' }} />
    );
  };

  const columns = [
    {
      title: 'Event ID',
      dataIndex: 'eventId',
      key: 'eventId',
      width: 100,
      render: (eventId: number) => (
        <Text code>{eventId}</Text>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: SCTE35Event['action']) => (
        <Space>
          {getActionIcon(action)}
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
      render: (duration: number | undefined) => (
        duration ? `${duration}s` : '-'
      ),
    },
    {
      title: 'Pre-roll',
      dataIndex: 'preRoll',
      key: 'preRoll',
      width: 100,
      render: (preRoll: number | undefined) => (
        preRoll ? `${preRoll}s` : '-'
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: SCTE35Event['status']) => (
        <Tag
          icon={getStatusIcon(status)}
          color={getStatusColor(status)}
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: Date) => (
        <Text type="secondary">
          {dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}
        </Text>
      ),
    },
  ];

  const timelineItems = filteredEvents.map((event) => ({
    color: event.action === 'CUE-OUT' ? 'green' : 'red',
    children: (
      <div>
        <Space>
          {getActionIcon(event.action)}
          <Text strong>Event #{event.eventId}</Text>
          <Tag color={event.action === 'CUE-OUT' ? 'green' : 'red'}>
            {event.action}
          </Tag>
          <Tag
            icon={getStatusIcon(event.status)}
            color={getStatusColor(event.status)}
          >
            {event.status.toUpperCase()}
          </Tag>
        </Space>
        <div style={{ marginTop: 8 }}>
          {event.adDuration && (
            <Text type="secondary">Duration: {event.adDuration}s</Text>
          )}
          {event.preRoll && (
            <Text type="secondary"> | Pre-roll: {event.preRoll}s</Text>
          )}
          <br />
          <Text type="secondary">
            {dayjs(event.timestamp).format('YYYY-MM-DD HH:mm:ss')}
          </Text>
        </div>
      </div>
    ),
  }));

  const stats = {
    total: events.length,
    cueOut: events.filter(e => e.action === 'CUE-OUT').length,
    cueIn: events.filter(e => e.action === 'CUE-IN').length,
    sent: events.filter(e => e.status === 'sent').length,
    confirmed: events.filter(e => e.status === 'confirmed').length,
    failed: events.filter(e => e.status === 'failed').length,
  };

  return (
    <Card
      title={
        <Space>
          <ClockCircleOutlined />
          <span>SCTE-35 Event Log & Timeline</span>
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Space>
      }
    >
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic
            title="Total Events"
            value={stats.total}
            prefix={<ClockCircleOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="CUE-OUT"
            value={stats.cueOut}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="CUE-IN"
            value={stats.cueIn}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Confirmed"
            value={stats.confirmed}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Select
            style={{ width: '100%' }}
            placeholder="Filter by Status"
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="all">All Status</Option>
            <Option value="pending">Pending</Option>
            <Option value="sent">Sent</Option>
            <Option value="confirmed">Confirmed</Option>
            <Option value="failed">Failed</Option>
          </Select>
        </Col>
        <Col span={6}>
          <Select
            style={{ width: '100%' }}
            placeholder="Filter by Action"
            value={actionFilter}
            onChange={setActionFilter}
          >
            <Option value="all">All Actions</Option>
            <Option value="CUE-OUT">CUE-OUT</Option>
            <Option value="CUE-IN">CUE-IN</Option>
          </Select>
        </Col>
        <Col span={6}>
          <RangePicker
            style={{ width: '100%' }}
            placeholder={['Start Date', 'End Date']}
            value={dateRange}
            onChange={setDateRange}
          />
        </Col>
        <Col span={6}>
          <Input
            placeholder="Search Event ID"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<FilterOutlined />}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Space>
            <Button
              type={viewMode === 'table' ? 'primary' : 'default'}
              onClick={() => setViewMode('table')}
            >
              Table View
            </Button>
            <Button
              type={viewMode === 'timeline' ? 'primary' : 'default'}
              onClick={() => setViewMode('timeline')}
            >
              Timeline View
            </Button>
          </Space>
        </Col>
      </Row>

      {viewMode === 'table' ? (
        <Table
          columns={columns}
          dataSource={filteredEvents}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} events`,
          }}
          size="small"
        />
      ) : (
        <Timeline
          items={timelineItems}
          mode="left"
        />
      )}

      {!isConnected && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary">
            WebSocket disconnected. Real-time events may not be received.
          </Text>
        </div>
      )}
    </Card>
  );
};
