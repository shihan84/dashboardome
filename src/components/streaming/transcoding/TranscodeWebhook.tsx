import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Switch,
  Select,
  Row,
  Col,
  Alert,
  Descriptions,
  message,
  Tooltip,
  Popconfirm,
  Badge,
  Divider,
} from 'antd';
import {
  ApiOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;
const { Option } = Select;

interface TranscodeWebhook {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  timeout: number;
  secretKey: string;
  events: string[];
  lastTriggered?: number;
  lastStatus?: 'success' | 'error' | 'timeout';
  lastResponse?: string;
}

interface WebhookEvent {
  id: string;
  webhookId: string;
  timestamp: number;
  event: string;
  status: 'success' | 'error' | 'timeout';
  responseTime: number;
  response?: string;
  error?: string;
}

export const TranscodeWebhook: React.FC = () => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  const [loading, setLoading] = useState(false);
  const [webhooks, setWebhooks] = useState<TranscodeWebhook[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [webhookModalVisible, setWebhookModalVisible] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<TranscodeWebhook | null>(null);
  const [eventsModalVisible, setEventsModalVisible] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<TranscodeWebhook | null>(null);
  const [selectedVHost, setSelectedVHost] = useState<string>('default');
  const [selectedApp, setSelectedApp] = useState<string>('app');
  const [vhosts, setVhosts] = useState<string[]>([]);
  const [applications, setApplications] = useState<string[]>([]);

  const [webhookForm] = Form.useForm();

  useEffect(() => {
    loadVHosts();
    loadWebhooks();
    loadEvents();
  }, [selectedVHost, selectedApp]);

  const loadVHosts = async () => {
    try {
      const response = await omeApi.getVHosts();
      if (response.success) {
        setVhosts(response.data);
        if (response.data.length > 0 && !selectedVHost) {
          setSelectedVHost(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load virtual hosts:', error);
    }
  };

  const loadApplications = async (vhost: string) => {
    try {
      const response = await omeApi.getApplications(vhost);
      if (response.success) {
        setApplications(response.data);
        if (response.data.length > 0 && !selectedApp) {
          setSelectedApp(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  };

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      // This would be a real API call to get transcode webhooks
      const mockWebhooks: TranscodeWebhook[] = [
        {
          id: '1',
          name: 'Quality Monitor',
          url: 'https://api.example.com/transcode/quality',
          enabled: true,
          timeout: 5000,
          secretKey: 'webhook_secret_123',
          events: ['transcode_started', 'transcode_completed', 'transcode_failed'],
          lastTriggered: Date.now() - 300000,
          lastStatus: 'success',
          lastResponse: 'OK',
        },
        {
          id: '2',
          name: 'Analytics Tracker',
          url: 'https://analytics.example.com/webhook',
          enabled: false,
          timeout: 10000,
          secretKey: 'analytics_secret_456',
          events: ['transcode_started', 'transcode_completed'],
          lastTriggered: Date.now() - 3600000,
          lastStatus: 'error',
          lastResponse: 'Connection timeout',
        },
      ];
      setWebhooks(mockWebhooks);
    } catch (error) {
      message.error('Failed to load transcode webhooks');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      // This would be a real API call to get webhook events
      const mockEvents: WebhookEvent[] = [
        {
          id: '1',
          webhookId: '1',
          timestamp: Date.now() - 300000,
          event: 'transcode_started',
          status: 'success',
          responseTime: 150,
          response: 'OK',
        },
        {
          id: '2',
          webhookId: '1',
          timestamp: Date.now() - 600000,
          event: 'transcode_completed',
          status: 'success',
          responseTime: 200,
          response: 'OK',
        },
        {
          id: '3',
          webhookId: '2',
          timestamp: Date.now() - 3600000,
          event: 'transcode_started',
          status: 'timeout',
          responseTime: 10000,
          error: 'Connection timeout after 10s',
        },
      ];
      setEvents(mockEvents);
    } catch (error) {
      message.error('Failed to load webhook events');
    }
  };

  const handleCreateWebhook = () => {
    setEditingWebhook(null);
    webhookForm.resetFields();
    setWebhookModalVisible(true);
  };

  const handleEditWebhook = (webhook: TranscodeWebhook) => {
    setEditingWebhook(webhook);
    webhookForm.setFieldsValue(webhook);
    setWebhookModalVisible(true);
  };

  const handleWebhookSubmit = async (values: TranscodeWebhook) => {
    try {
      if (editingWebhook) {
        // Update existing webhook
        setWebhooks(webhooks.map(w => w.id === editingWebhook.id ? { ...values, id: editingWebhook.id } : w));
        message.success('Webhook updated successfully');
      } else {
        // Create new webhook
        const newWebhook = { ...values, id: Date.now().toString() };
        setWebhooks([...webhooks, newWebhook]);
        message.success('Webhook created successfully');
      }
      setWebhookModalVisible(false);
      setEditingWebhook(null);
    } catch (error) {
      message.error('Failed to save webhook');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      setWebhooks(webhooks.filter(w => w.id !== id));
      message.success('Webhook deleted successfully');
    } catch (error) {
      message.error('Failed to delete webhook');
    }
  };

  const handleToggleWebhook = async (id: string) => {
    try {
      setWebhooks(webhooks.map(w => 
        w.id === id ? { ...w, enabled: !w.enabled } : w
      ));
      message.success('Webhook status updated');
    } catch (error) {
      message.error('Failed to update webhook status');
    }
  };

  const handleViewEvents = (webhook: TranscodeWebhook) => {
    setSelectedWebhook(webhook);
    setEventsModalVisible(true);
  };

  const webhookColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: TranscodeWebhook) => (
        <Space>
          <ApiOutlined />
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.url}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? 'Enabled' : 'Disabled'}
        </Tag>
      ),
    },
    {
      title: 'Events',
      dataIndex: 'events',
      key: 'events',
      render: (events: string[]) => (
        <Space wrap>
          {events.map(event => (
            <Tag key={event} size="small">{event}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Last Triggered',
      dataIndex: 'lastTriggered',
      key: 'lastTriggered',
      render: (timestamp: number) => timestamp ? new Date(timestamp).toLocaleString() : 'Never',
    },
    {
      title: 'Last Status',
      dataIndex: 'lastStatus',
      key: 'lastStatus',
      render: (status: string) => {
        if (!status) return '-';
        const color = status === 'success' ? 'green' : status === 'error' ? 'red' : 'orange';
        const icon = status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />;
        return (
          <Tag color={color} icon={icon}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: TranscodeWebhook) => (
        <Space>
          <Tooltip title="View Events">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewEvents(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditWebhook(record)}
            />
          </Tooltip>
          <Tooltip title={record.enabled ? 'Disable' : 'Enable'}>
            <Button
              type="text"
              icon={record.enabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleToggleWebhook(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete webhook?"
            description="This action cannot be undone."
            onConfirm={() => handleDeleteWebhook(record.id)}
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
        </Space>
      ),
    },
  ];

  const eventColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp).toLocaleString(),
    },
    {
      title: 'Event',
      dataIndex: 'event',
      key: 'event',
      render: (event: string) => <Tag>{event}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'success' ? 'green' : status === 'error' ? 'red' : 'orange';
        const icon = status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />;
        return (
          <Tag color={color} icon={icon}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Response Time',
      dataIndex: 'responseTime',
      key: 'responseTime',
      render: (time: number) => `${time}ms`,
    },
    {
      title: 'Response',
      dataIndex: 'response',
      key: 'response',
      render: (response: string, record: WebhookEvent) => (
        <Text type={record.status === 'success' ? 'success' : 'danger'}>
          {response || record.error || '-'}
        </Text>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <ApiOutlined />
            <Title level={4} style={{ margin: 0 }}>Transcode Webhooks</Title>
          </Space>
        }
        extra={
          <Space>
            <Select
              style={{ width: 150 }}
              value={selectedVHost}
              onChange={(value) => {
                setSelectedVHost(value);
                loadApplications(value);
              }}
            >
              {vhosts.map(vhost => (
                <Option key={vhost} value={vhost}>{vhost}</Option>
              ))}
            </Select>
            <Select
              style={{ width: 150 }}
              value={selectedApp}
              onChange={setSelectedApp}
            >
              {applications.map(app => (
                <Option key={app} value={app}>{app}</Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateWebhook}
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
        }
      >
        <Alert
          message="Transcode Webhooks"
          description={
            <div>
              <p>Configure webhooks to receive notifications about transcoding events.</p>
              <p><strong>Available Events:</strong> transcode_started, transcode_completed, transcode_failed, quality_changed</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={webhookColumns}
          dataSource={webhooks}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: 'No webhooks configured. Add a webhook to start receiving transcoding notifications.',
          }}
        />
      </Card>

      {/* Webhook Configuration Modal */}
      <Modal
        title={editingWebhook ? 'Edit Webhook' : 'Create Webhook'}
        open={webhookModalVisible}
        onCancel={() => {
          setWebhookModalVisible(false);
          setEditingWebhook(null);
          webhookForm.resetFields();
        }}
        onOk={() => webhookForm.submit()}
        width={600}
      >
        <Form
          form={webhookForm}
          layout="vertical"
          onFinish={handleWebhookSubmit}
        >
          <Form.Item
            name="name"
            label="Webhook Name"
            rules={[{ required: true, message: 'Please enter webhook name' }]}
          >
            <Input placeholder="e.g., Quality Monitor" />
          </Form.Item>

          <Form.Item
            name="url"
            label="Webhook URL"
            rules={[
              { required: true, message: 'Please enter webhook URL' },
              { type: 'url', message: 'Please enter a valid URL' }
            ]}
          >
            <Input placeholder="https://api.example.com/webhook" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="timeout"
                label="Timeout (ms)"
                rules={[{ required: true, message: 'Please enter timeout' }]}
                initialValue={5000}
              >
                <Input type="number" min={1000} max={30000} />
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

          <Form.Item
            name="secretKey"
            label="Secret Key"
            rules={[{ required: true, message: 'Please enter secret key' }]}
          >
            <Input.Password placeholder="webhook_secret_key" />
          </Form.Item>

          <Form.Item
            name="events"
            label="Events to Monitor"
            rules={[{ required: true, message: 'Please select at least one event' }]}
            initialValue={['transcode_started', 'transcode_completed']}
          >
            <Select
              mode="multiple"
              placeholder="Select events"
              options={[
                { label: 'Transcode Started', value: 'transcode_started' },
                { label: 'Transcode Completed', value: 'transcode_completed' },
                { label: 'Transcode Failed', value: 'transcode_failed' },
                { label: 'Quality Changed', value: 'quality_changed' },
                { label: 'Bitrate Changed', value: 'bitrate_changed' },
                { label: 'Resolution Changed', value: 'resolution_changed' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Events Modal */}
      <Modal
        title={`Webhook Events - ${selectedWebhook?.name}`}
        open={eventsModalVisible}
        onCancel={() => setEventsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setEventsModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={1000}
      >
        <Table
          columns={eventColumns}
          dataSource={events.filter(e => e.webhookId === selectedWebhook?.id)}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 800 }}
          size="small"
        />
      </Modal>
    </div>
  );
};
