import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Row,
  Col,
  Statistic,
  Progress,
  Badge,
  Tooltip,
  Alert,
  Divider,
  InputNumber,
  Typography,
  Tabs,
  List,
  Avatar,
  Descriptions,
  Timeline,
  Code,
  Collapse,
  Upload,
  Drawer
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ApiOutlined,
  LinkOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  DatabaseOutlined,
  SettingOutlined,
  HistoryOutlined,
  CloudServerOutlined,
  FileOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  GlobalOutlined,
  UploadOutlined,
  DownloadOutlined,
  BellOutlined,
  SendOutlined,
  ClockCircleOutlined,
  SecurityScanOutlined,
  KeyOutlined,
  LockOutlined,
  UnlockOutlined,
  CopyOutlined,
  ScissorOutlined,
  FilterOutlined,
  SearchOutlined,
  FilterFilled,
  SortAscendingOutlined,
  SortDescendingOutlined
} from '@ant-design/icons';
import { OMEApiService } from '../../services/omeApi';
import { useStore } from '../../store/useStore';

const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface Webhook {
  id: string;
  name: string;
  description: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  events: string[];
  headers: Record<string, string>;
  authentication: {
    type: 'none' | 'basic' | 'bearer' | 'api-key';
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
  payload: {
    format: 'json' | 'form-data' | 'xml';
    template: string;
    includeMetadata: boolean;
    includeStreamData: boolean;
    includeUserData: boolean;
  };
  retry: {
    enabled: boolean;
    maxAttempts: number;
    delay: number;
    backoff: 'linear' | 'exponential';
  };
  timeout: number;
  enabled: boolean;
  status: 'active' | 'inactive' | 'error' | 'testing';
  lastTriggered?: string;
  lastSuccess?: string;
  lastError?: string;
  triggerCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

interface WebhookEvent {
  id: string;
  webhookId: string;
  webhookName: string;
  event: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'success' | 'failed' | 'retrying';
  responseCode?: number;
  responseTime?: number;
  payload: any;
  response?: any;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

interface WebhookLog {
  id: string;
  webhookId: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  details?: any;
  event?: string;
  responseCode?: number;
  responseTime?: number;
}

const WebhookManager: React.FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [webhookModalVisible, setWebhookModalVisible] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<Webhook | null>(null);
  const [webhookForm] = Form.useForm();
  const [testForm] = Form.useForm();
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  const availableEvents = [
    'stream.started',
    'stream.stopped',
    'stream.connected',
    'stream.disconnected',
    'stream.recording.started',
    'stream.recording.stopped',
    'stream.recording.completed',
    'stream.transcoding.started',
    'stream.transcoding.stopped',
    'stream.transcoding.error',
    'application.created',
    'application.updated',
    'application.deleted',
    'vhost.created',
    'vhost.updated',
    'vhost.deleted',
    'system.startup',
    'system.shutdown',
    'system.error',
    'user.login',
    'user.logout',
    'user.permission.changed',
    'webhook.test',
    'custom.event'
  ];

  useEffect(() => {
    loadWebhooks();
    loadEvents();
    loadLogs();
    const interval = setInterval(() => {
      loadWebhooks();
      loadEvents();
      loadLogs();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual OME API calls when available
      const mockWebhooks: Webhook[] = [
        {
          id: '1',
          name: 'Stream Events',
          description: 'Notifications for stream start/stop events',
          url: 'https://api.example.com/webhooks/stream-events',
          method: 'POST',
          events: ['stream.started', 'stream.stopped', 'stream.connected', 'stream.disconnected'],
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Source': 'OvenMediaEngine'
          },
          authentication: {
            type: 'bearer',
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          },
          payload: {
            format: 'json',
            template: '{"event": "{{event}}", "stream": "{{stream.name}}", "timestamp": "{{timestamp}}"}',
            includeMetadata: true,
            includeStreamData: true,
            includeUserData: false
          },
          retry: {
            enabled: true,
            maxAttempts: 3,
            delay: 5000,
            backoff: 'exponential'
          },
          timeout: 30000,
          enabled: true,
          status: 'active',
          lastTriggered: '2024-01-15T14:30:00Z',
          lastSuccess: '2024-01-15T14:30:00Z',
          triggerCount: 45,
          successCount: 44,
          errorCount: 1,
          averageResponseTime: 250,
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-15T14:30:00Z'
        },
        {
          id: '2',
          name: 'Recording Notifications',
          description: 'Notifications for recording events',
          url: 'https://monitoring.example.com/webhooks/recording',
          method: 'POST',
          events: ['stream.recording.started', 'stream.recording.stopped', 'stream.recording.completed'],
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'recording-webhook-key-123'
          },
          authentication: {
            type: 'api-key',
            apiKey: 'recording-webhook-key-123',
            apiKeyHeader: 'X-API-Key'
          },
          payload: {
            format: 'json',
            template: '{"type": "recording", "event": "{{event}}", "stream": "{{stream.name}}", "file": "{{recording.filePath}}"}',
            includeMetadata: true,
            includeStreamData: false,
            includeUserData: false
          },
          retry: {
            enabled: true,
            maxAttempts: 5,
            delay: 2000,
            backoff: 'linear'
          },
          timeout: 15000,
          enabled: true,
          status: 'active',
          lastTriggered: '2024-01-15T13:45:00Z',
          lastSuccess: '2024-01-15T13:45:00Z',
          triggerCount: 12,
          successCount: 12,
          errorCount: 0,
          averageResponseTime: 180,
          createdAt: '2024-01-12T09:00:00Z',
          updatedAt: '2024-01-15T13:45:00Z'
        },
        {
          id: '3',
          name: 'System Alerts',
          description: 'System-level alerts and errors',
          url: 'https://alerts.example.com/webhooks/system',
          method: 'POST',
          events: ['system.error', 'system.startup', 'system.shutdown'],
          headers: {
            'Content-Type': 'application/json'
          },
          authentication: {
            type: 'basic',
            username: 'webhook_user',
            password: 'webhook_pass_123'
          },
          payload: {
            format: 'json',
            template: '{"alert": "{{event}}", "message": "{{message}}", "severity": "{{severity}}"}',
            includeMetadata: true,
            includeStreamData: false,
            includeUserData: false
          },
          retry: {
            enabled: true,
            maxAttempts: 10,
            delay: 1000,
            backoff: 'exponential'
          },
          timeout: 10000,
          enabled: false,
          status: 'inactive',
          triggerCount: 3,
          successCount: 2,
          errorCount: 1,
          averageResponseTime: 500,
          createdAt: '2024-01-08T15:00:00Z',
          updatedAt: '2024-01-14T10:00:00Z',
          errorMessage: 'Authentication failed'
        }
      ];
      setWebhooks(mockWebhooks);
    } catch (error) {
      message.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      // Mock data - replace with actual OME API calls when available
      const mockEvents: WebhookEvent[] = [
        {
          id: '1',
          webhookId: '1',
          webhookName: 'Stream Events',
          event: 'stream.started',
          timestamp: '2024-01-15T14:30:00Z',
          status: 'success',
          responseCode: 200,
          responseTime: 250,
          payload: {
            event: 'stream.started',
            stream: { name: 'live', id: 'stream_123' },
            timestamp: '2024-01-15T14:30:00Z'
          },
          response: { success: true, message: 'Webhook received' },
          retryCount: 0,
          maxRetries: 3
        },
        {
          id: '2',
          webhookId: '2',
          webhookName: 'Recording Notifications',
          event: 'stream.recording.completed',
          timestamp: '2024-01-15T13:45:00Z',
          status: 'success',
          responseCode: 201,
          responseTime: 180,
          payload: {
            type: 'recording',
            event: 'stream.recording.completed',
            stream: { name: 'live' },
            file: '/recordings/live_20240115_134500.mp4'
          },
          response: { id: 'recording_456', status: 'processed' },
          retryCount: 0,
          maxRetries: 5
        },
        {
          id: '3',
          webhookId: '3',
          webhookName: 'System Alerts',
          event: 'system.error',
          timestamp: '2024-01-15T12:00:00Z',
          status: 'failed',
          responseCode: 401,
          responseTime: 500,
          payload: {
            alert: 'system.error',
            message: 'Disk space low',
            severity: 'warning'
          },
          errorMessage: 'Authentication failed',
          retryCount: 3,
          maxRetries: 10
        }
      ];
      setEvents(mockEvents);
    } catch (error) {
      message.error('Failed to load webhook events');
    }
  };

  const loadLogs = async () => {
    try {
      // Mock data - replace with actual OME API calls when available
      const mockLogs: WebhookLog[] = [
        {
          id: '1',
          webhookId: '1',
          timestamp: '2024-01-15T14:30:00Z',
          level: 'info',
          message: 'Webhook triggered successfully',
          event: 'stream.started',
          responseCode: 200,
          responseTime: 250
        },
        {
          id: '2',
          webhookId: '2',
          timestamp: '2024-01-15T13:45:00Z',
          level: 'info',
          message: 'Recording webhook sent',
          event: 'stream.recording.completed',
          responseCode: 201,
          responseTime: 180
        },
        {
          id: '3',
          webhookId: '3',
          timestamp: '2024-01-15T12:00:00Z',
          level: 'error',
          message: 'Webhook authentication failed',
          event: 'system.error',
          responseCode: 401,
          responseTime: 500,
          details: { error: 'Invalid credentials' }
        }
      ];
      setLogs(mockLogs);
    } catch (error) {
      message.error('Failed to load webhook logs');
    }
  };

  const handleCreateWebhook = async (values: any) => {
    try {
      const newWebhook: Webhook = {
        id: Date.now().toString(),
        name: values.name,
        description: values.description,
        url: values.url,
        method: values.method,
        events: values.events,
        headers: values.headers || {},
        authentication: values.authentication || { type: 'none' },
        payload: values.payload || {
          format: 'json',
          template: '{}',
          includeMetadata: true,
          includeStreamData: false,
          includeUserData: false
        },
        retry: values.retry || {
          enabled: true,
          maxAttempts: 3,
          delay: 5000,
          backoff: 'exponential'
        },
        timeout: values.timeout || 30000,
        enabled: values.enabled,
        status: 'inactive',
        triggerCount: 0,
        successCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setWebhooks(prev => [...prev, newWebhook]);
      setWebhookModalVisible(false);
      webhookForm.resetFields();
      message.success('Webhook created successfully');
    } catch (error) {
      message.error('Failed to create webhook');
    }
  };

  const handleUpdateWebhook = async (values: any) => {
    try {
      setWebhooks(prev => prev.map(webhook => 
        webhook.id === editingWebhook?.id 
          ? { ...webhook, ...values, updatedAt: new Date().toISOString() }
          : webhook
      ));
      setWebhookModalVisible(false);
      setEditingWebhook(null);
      webhookForm.resetFields();
      message.success('Webhook updated successfully');
    } catch (error) {
      message.error('Failed to update webhook');
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      setWebhooks(prev => prev.filter(webhook => webhook.id !== webhookId));
      message.success('Webhook deleted successfully');
    } catch (error) {
      message.error('Failed to delete webhook');
    }
  };

  const handleToggleWebhook = async (webhookId: string, enabled: boolean) => {
    try {
      setWebhooks(prev => prev.map(webhook => 
        webhook.id === webhookId 
          ? { ...webhook, enabled, status: enabled ? 'active' : 'inactive' }
          : webhook
      ));
      message.success(`Webhook ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      message.error('Failed to toggle webhook');
    }
  };

  const handleTestWebhook = async (values: any) => {
    try {
      setTestingWebhook(prev => prev ? { ...prev, status: 'testing' } : null);
      message.success('Test webhook sent successfully');
      setTimeout(() => {
        setTestingWebhook(prev => prev ? { ...prev, status: 'active' } : null);
      }, 2000);
    } catch (error) {
      message.error('Failed to test webhook');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'error': return 'error';
      case 'testing': return 'processing';
      case 'pending': return 'default';
      case 'sent': return 'processing';
      case 'success': return 'success';
      case 'failed': return 'error';
      case 'retrying': return 'warning';
      default: return 'default';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'blue';
      case 'warning': return 'orange';
      case 'error': return 'red';
      case 'debug': return 'gray';
      default: return 'default';
    }
  };

  const webhookColumns = [
    {
      title: 'Webhook',
      key: 'webhook',
      render: (record: Webhook) => (
        <Space>
          <Avatar icon={<ApiOutlined />} />
          <div>
            <div><strong>{record.name}</strong></div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (url: string) => (
        <Text style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {url}
        </Text>
      )
    },
    {
      title: 'Events',
      key: 'events',
      render: (record: Webhook) => (
        <Space wrap>
          {record.events.slice(0, 2).map(event => (
            <Tag key={event} size="small">{event}</Tag>
          ))}
          {record.events.length > 2 && (
            <Tag size="small">+{record.events.length - 2}</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Webhook) => (
        <Space direction="vertical" size="small">
          <Badge status={getStatusColor(status)} text={status.toUpperCase()} />
          {record.errorMessage && (
            <Text type="danger" style={{ fontSize: '11px' }}>
              {record.errorMessage}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Statistics',
      key: 'stats',
      render: (record: Webhook) => (
        <Space direction="vertical" size="small">
          <Text>Triggers: {record.triggerCount}</Text>
          <Text>Success: {record.successCount}</Text>
          <Text>Errors: {record.errorCount}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Avg: {record.averageResponseTime}ms
          </Text>
        </Space>
      )
    },
    {
      title: 'Last Triggered',
      dataIndex: 'lastTriggered',
      key: 'lastTriggered',
      render: (time: string) => time ? new Date(time).toLocaleString() : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Webhook) => (
        <Space>
          <Tooltip title="Test">
            <Button 
              icon={<SendOutlined />} 
              size="small"
              onClick={() => {
                setTestingWebhook(record);
                setTestModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Logs">
            <Button 
              icon={<HistoryOutlined />} 
              size="small"
              onClick={() => setLogModalVisible(true)}
            />
          </Tooltip>
          <Tooltip title={record.enabled ? "Disable" : "Enable"}>
            <Switch
              checked={record.enabled}
              onChange={(checked) => handleToggleWebhook(record.id, checked)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => {
                setEditingWebhook(record);
                webhookForm.setFieldsValue(record);
                setWebhookModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
              onClick={() => handleDeleteWebhook(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const eventColumns = [
    {
      title: 'Event',
      key: 'event',
      render: (record: WebhookEvent) => (
        <Space>
          <Avatar icon={<BellOutlined />} />
          <div>
            <div><strong>{record.webhookName}</strong></div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.event}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: WebhookEvent) => (
        <Space direction="vertical" size="small">
          <Badge status={getStatusColor(status)} text={status.toUpperCase()} />
          {record.errorMessage && (
            <Text type="danger" style={{ fontSize: '11px' }}>
              {record.errorMessage}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Response',
      key: 'response',
      render: (record: WebhookEvent) => (
        <Space direction="vertical" size="small">
          {record.responseCode && (
            <Tag color={record.responseCode >= 200 && record.responseCode < 300 ? 'green' : 'red'}>
              {record.responseCode}
            </Tag>
          )}
          {record.responseTime && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {record.responseTime}ms
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: 'Retries',
      key: 'retries',
      render: (record: WebhookEvent) => (
        <Text>{record.retryCount}/{record.maxRetries}</Text>
      )
    }
  ];

  const logColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => (
        <Tag color={getLevelColor(level)}>{level.toUpperCase()}</Tag>
      )
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message'
    },
    {
      title: 'Event',
      dataIndex: 'event',
      key: 'event',
      render: (event: string) => event ? <Tag size="small">{event}</Tag> : '-'
    },
    {
      title: 'Response',
      key: 'response',
      render: (record: WebhookLog) => (
        <Space>
          {record.responseCode && (
            <Tag color={record.responseCode >= 200 && record.responseCode < 300 ? 'green' : 'red'}>
              {record.responseCode}
            </Tag>
          )}
          {record.responseTime && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {record.responseTime}ms
            </Text>
          )}
        </Space>
      )
    }
  ];

  const activeWebhooks = webhooks.filter(w => w.status === 'active').length;
  const totalWebhooks = webhooks.length;
  const totalEvents = events.length;
  const successRate = webhooks.length > 0 ? 
    Math.round((webhooks.reduce((sum, w) => sum + w.successCount, 0) / 
    webhooks.reduce((sum, w) => sum + w.triggerCount, 0)) * 100) : 0;

  return (
    <div>
      {/* Webhook Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Webhooks"
              value={activeWebhooks}
              prefix={<ApiOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Webhooks"
              value={totalWebhooks}
              prefix={<LinkOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Events"
              value={totalEvents}
              prefix={<BellOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={successRate}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Webhook Info Alert */}
      <Alert
        message="Webhook Management"
        description="Configure and manage webhook notifications for OvenMediaEngine events. Supports various authentication methods, retry policies, and payload customization."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Tabs defaultActiveKey="webhooks">
        <TabPane tab="Webhooks" key="webhooks">
          {/* Quick Actions */}
          <Card title="Quick Actions" style={{ marginBottom: 24 }}>
            <Space wrap>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setWebhookModalVisible(true)}
              >
                Add Webhook
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={loadWebhooks}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Card>

          {/* Webhooks Table */}
          <Card
            title="Webhooks"
            extra={
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={loadWebhooks}
                  loading={loading}
                >
                  Refresh
                </Button>
              </Space>
            }
          >
            <Table
              columns={webhookColumns}
              dataSource={webhooks}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Events" key="events">
          {/* Events Table */}
          <Card
            title="Webhook Events"
            extra={
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadEvents}
                loading={loading}
              >
                Refresh
              </Button>
            }
          >
            <Table
              columns={eventColumns}
              dataSource={events}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Logs" key="logs">
          {/* Logs Table */}
          <Card
            title="Webhook Logs"
            extra={
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadLogs}
                loading={loading}
              >
                Refresh
              </Button>
            }
          >
            <Table
              columns={logColumns}
              dataSource={logs}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Add/Edit Webhook Modal */}
      <Modal
        title={editingWebhook ? "Edit Webhook" : "Add Webhook"}
        open={webhookModalVisible}
        onCancel={() => {
          setWebhookModalVisible(false);
          setEditingWebhook(null);
          webhookForm.resetFields();
        }}
        onOk={() => {
          webhookForm.validateFields().then(values => {
            if (editingWebhook) {
              handleUpdateWebhook(values);
            } else {
              handleCreateWebhook(values);
            }
          });
        }}
        width={800}
      >
        <Form form={webhookForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Webhook Name"
                rules={[{ required: true, message: 'Please enter webhook name' }]}
              >
                <Input placeholder="e.g., Stream Events" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="method"
                label="HTTP Method"
                rules={[{ required: true, message: 'Please select HTTP method' }]}
                initialValue="POST"
              >
                <Select>
                  <Option value="POST">POST</Option>
                  <Option value="PUT">PUT</Option>
                  <Option value="PATCH">PATCH</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Webhook description" rows={2} />
          </Form.Item>

          <Form.Item
            name="url"
            label="Webhook URL"
            rules={[{ required: true, message: 'Please enter webhook URL' }]}
          >
            <Input placeholder="https://api.example.com/webhooks/events" />
          </Form.Item>

          <Form.Item
            name="events"
            label="Events"
            rules={[{ required: true, message: 'Please select events' }]}
          >
            <Select mode="multiple" placeholder="Select events to trigger webhook">
              {availableEvents.map(event => (
                <Option key={event} value={event}>{event}</Option>
              ))}
            </Select>
          </Form.Item>

          <Divider>Authentication</Divider>

          <Form.Item
            name={['authentication', 'type']}
            label="Authentication Type"
            initialValue="none"
          >
            <Select>
              <Option value="none">None</Option>
              <Option value="basic">Basic Auth</Option>
              <Option value="bearer">Bearer Token</Option>
              <Option value="api-key">API Key</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name={['authentication', 'token']}
            label="Bearer Token"
            dependencies={[['authentication', 'type']]}
            rules={[
              ({ getFieldValue }) => ({
                required: getFieldValue(['authentication', 'type']) === 'bearer',
                message: 'Please enter bearer token'
              })
            ]}
          >
            <Input.Password placeholder="Bearer token" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['authentication', 'username']}
                label="Username"
                dependencies={[['authentication', 'type']]}
                rules={[
                  ({ getFieldValue }) => ({
                    required: getFieldValue(['authentication', 'type']) === 'basic',
                    message: 'Please enter username'
                  })
                ]}
              >
                <Input placeholder="Username" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['authentication', 'password']}
                label="Password"
                dependencies={[['authentication', 'type']]}
                rules={[
                  ({ getFieldValue }) => ({
                    required: getFieldValue(['authentication', 'type']) === 'basic',
                    message: 'Please enter password'
                  })
                ]}
              >
                <Input.Password placeholder="Password" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Retry Settings</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name={['retry', 'enabled']}
                label="Enable Retry"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={['retry', 'maxAttempts']}
                label="Max Attempts"
                initialValue={3}
              >
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={['retry', 'delay']}
                label="Delay (ms)"
                initialValue={5000}
              >
                <InputNumber min={1000} max={60000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="timeout"
                label="Timeout (ms)"
                initialValue={30000}
              >
                <InputNumber min={5000} max={120000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="enabled"
                label="Enabled"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Test Webhook Modal */}
      <Modal
        title={`Test Webhook: ${testingWebhook?.name}`}
        open={testModalVisible}
        onCancel={() => {
          setTestModalVisible(false);
          setTestingWebhook(null);
          testForm.resetFields();
        }}
        onOk={() => {
          testForm.validateFields().then(values => {
            handleTestWebhook(values);
            setTestModalVisible(false);
          });
        }}
      >
        <Form form={testForm} layout="vertical">
          <Form.Item
            name="testEvent"
            label="Test Event"
            initialValue="webhook.test"
          >
            <Select>
              <Option value="webhook.test">Webhook Test</Option>
              <Option value="stream.started">Stream Started</Option>
              <Option value="stream.stopped">Stream Stopped</Option>
              <Option value="system.error">System Error</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="testPayload"
            label="Test Payload"
            initialValue='{"test": true, "message": "This is a test webhook"}'
          >
            <Input.TextArea rows={4} placeholder="Test payload JSON" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Logs Modal */}
      <Drawer
        title="Webhook Logs"
        placement="right"
        width={800}
        open={logModalVisible}
        onClose={() => setLogModalVisible(false)}
      >
        <Table
          columns={logColumns}
          dataSource={logs}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          size="small"
        />
      </Drawer>
    </div>
  );
};

export default WebhookManager;
