import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Badge,
  Progress,
  Statistic,
  Row,
  Col,
  Tag,
  Space,
  Button,
  Switch,
  Tooltip,
  Alert,
  Timeline,
  Modal,
  Descriptions
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  HistoryOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { failoverService, StreamSource, FailoverRule, FailoverEvent } from '../../services/failoverService';

const FailoverMonitor: React.FC = () => {
  const [streamSources, setStreamSources] = useState<StreamSource[]>([]);
  const [failoverRules, setFailoverRules] = useState<FailoverRule[]>([]);
  const [failoverEvents, setFailoverEvents] = useState<FailoverEvent[]>([]);
  const [monitoringStatus, setMonitoringStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FailoverEvent | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const sources = failoverService.getStreamSources();
      const rules = failoverService.getFailoverRules();
      const events = failoverService.getFailoverEvents(20);
      const status = failoverService.getMonitoringStatus();

      setStreamSources(sources);
      setFailoverRules(rules);
      setFailoverEvents(events);
      setMonitoringStatus(status);
    } catch (error) {
      console.error('Failed to load failover data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'unhealthy': return 'red';
      case 'unknown': return 'orange';
      default: return 'default';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleOutlined />;
      case 'unhealthy': return <ExclamationCircleOutlined />;
      case 'unknown': return <WarningOutlined />;
      default: return <WarningOutlined />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'switch_to_fallback': return 'red';
      case 'recovery_to_primary': return 'green';
      case 'health_check_failed': return 'orange';
      case 'health_check_recovered': return 'blue';
      default: return 'default';
    }
  };

  const streamColumns: ColumnsType<StreamSource> = [
    {
      title: 'Source Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: StreamSource) => (
        <Space>
          <strong>{text}</strong>
          <Tag color={record.isActive ? 'green' : 'default'}>
            {record.isActive ? 'Active' : 'Inactive'}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'rtmp' ? 'green' : type === 'file' ? 'blue' : 'orange'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Health Status',
      dataIndex: 'healthStatus',
      key: 'healthStatus',
      render: (status: string, record: StreamSource) => (
        <Space>
          <Tag color={getHealthStatusColor(status)} icon={getHealthStatusIcon(status)}>
            {status}
          </Tag>
          {record.errorCount > 0 && (
            <Badge count={record.errorCount} color="red" />
          )}
        </Space>
      ),
    },
    {
      title: 'Response Time',
      dataIndex: 'responseTime',
      key: 'responseTime',
      render: (time: number) => time ? `${time}ms` : 'N/A',
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
      title: 'Last Checked',
      dataIndex: 'lastChecked',
      key: 'lastChecked',
      render: (date: Date) => new Date(date).toLocaleTimeString(),
    },
  ];

  const ruleColumns: ColumnsType<FailoverRule> = [
    {
      title: 'Rule Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: FailoverRule) => (
        <Space>
          <strong>{text}</strong>
          <Tag color={record.enabled ? 'green' : 'default'}>
            {record.enabled ? 'Enabled' : 'Disabled'}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Channel',
      dataIndex: 'channelId',
      key: 'channelId',
    },
    {
      title: 'Primary Source',
      dataIndex: 'primarySource',
      key: 'primarySource',
    },
    {
      title: 'Fallback Sources',
      dataIndex: 'fallbackSources',
      key: 'fallbackSources',
      render: (sources: string[]) => (
        <Space wrap>
          {sources.map((source, index) => (
            <Tag key={index} color="blue">{source}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Check Interval',
      dataIndex: 'healthCheckInterval',
      key: 'healthCheckInterval',
      render: (interval: number) => `${interval / 1000}s`,
    },
    {
      title: 'Max Errors',
      dataIndex: 'maxErrors',
      key: 'maxErrors',
    },
    {
      title: 'Auto Recovery',
      dataIndex: 'autoRecovery',
      key: 'autoRecovery',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'default'}>
          {enabled ? 'Yes' : 'No'}
        </Tag>
      ),
    },
  ];

  const eventColumns: ColumnsType<FailoverEvent> = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date: Date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Channel',
      dataIndex: 'channelId',
      key: 'channelId',
    },
    {
      title: 'Event Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getEventTypeColor(type)}>
          {type.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'From Source',
      dataIndex: 'fromSource',
      key: 'fromSource',
    },
    {
      title: 'To Source',
      dataIndex: 'toSource',
      key: 'toSource',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: FailoverEvent) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => {
            setSelectedEvent(record);
            setEventModalVisible(true);
          }}
        >
          Details
        </Button>
      ),
    },
  ];

  const healthySources = streamSources.filter(s => s.healthStatus === 'healthy').length;
  const unhealthySources = streamSources.filter(s => s.healthStatus === 'unhealthy').length;
  const activeRules = failoverRules.filter(r => r.enabled).length;
  const recentEvents = failoverEvents.filter(e => 
    new Date(e.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
  ).length;

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <WarningOutlined />
            <span>Failover Monitor</span>
            <Tag color={monitoringStatus?.isMonitoring ? 'green' : 'red'}>
              {monitoringStatus?.isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
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
              icon={<SettingOutlined />}
              onClick={() => {
                // Open settings modal
                console.log('Open failover settings');
              }}
            >
              Settings
            </Button>
          </Space>
        }
      >
        {/* Status Overview */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="Healthy Sources"
              value={healthySources}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Unhealthy Sources"
              value={unhealthySources}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Active Rules"
              value={activeRules}
              valueStyle={{ color: '#1890ff' }}
              prefix={<SettingOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Events (24h)"
              value={recentEvents}
              valueStyle={{ color: '#722ed1' }}
              prefix={<HistoryOutlined />}
            />
          </Col>
        </Row>

        {/* Health Status Alert */}
        {unhealthySources > 0 && (
          <Alert
            message="Stream Health Warning"
            description={`${unhealthySources} stream source(s) are currently unhealthy. Failover system is monitoring and will switch to backup sources if needed.`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Stream Sources */}
        <Card
          title="Stream Sources"
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Table
            columns={streamColumns}
            dataSource={streamSources}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>

        {/* Failover Rules */}
        <Card
          title="Failover Rules"
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Table
            columns={ruleColumns}
            dataSource={failoverRules}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>

        {/* Recent Events */}
        <Card
          title="Recent Failover Events"
          size="small"
          extra={
            <Button
              icon={<HistoryOutlined />}
              size="small"
              onClick={() => {
                // Show all events
                console.log('Show all events');
              }}
            >
              View All
            </Button>
          }
        >
          <Table
            columns={eventColumns}
            dataSource={failoverEvents}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      </Card>

      {/* Event Details Modal */}
      <Modal
        title="Failover Event Details"
        open={eventModalVisible}
        onCancel={() => setEventModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedEvent && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Event ID">
              {selectedEvent.id}
            </Descriptions.Item>
            <Descriptions.Item label="Timestamp">
              {new Date(selectedEvent.timestamp).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Channel">
              {selectedEvent.channelId}
            </Descriptions.Item>
            <Descriptions.Item label="Event Type">
              <Tag color={getEventTypeColor(selectedEvent.type)}>
                {selectedEvent.type.replace(/_/g, ' ').toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="From Source">
              {selectedEvent.fromSource}
            </Descriptions.Item>
            <Descriptions.Item label="To Source">
              {selectedEvent.toSource}
            </Descriptions.Item>
            <Descriptions.Item label="Reason">
              {selectedEvent.reason}
            </Descriptions.Item>
            {selectedEvent.duration && (
              <Descriptions.Item label="Duration">
                {selectedEvent.duration}ms
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default FailoverMonitor;
