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
  Progress,
  Statistic,
} from 'antd';
import {
  ShareAltOutlined,
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
  UserOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;
const { Option } = Select;

interface P2PConfig {
  enabled: boolean;
  maxPeers: number;
  maxConnections: number;
  discoveryTimeout: number;
  connectionTimeout: number;
  keepAliveInterval: number;
  enableRelay: boolean;
  enableNAT: boolean;
  enableUPnP: boolean;
  enableSTUN: boolean;
  stunServers: string[];
  enableTURN: boolean;
  turnServers: Array<{
    url: string;
    username: string;
    credential: string;
  }>;
}

interface P2PConnection {
  id: string;
  peerId: string;
  streamName: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  connectionType: 'direct' | 'relay' | 'turn';
  bandwidth: number;
  latency: number;
  packetsReceived: number;
  packetsSent: number;
  bytesReceived: number;
  bytesSent: number;
  connectedAt: number;
  lastActivity: number;
}

interface P2PStats {
  totalConnections: number;
  activeConnections: number;
  totalBandwidth: number;
  averageLatency: number;
  totalPackets: number;
  totalBytes: number;
  relayConnections: number;
  directConnections: number;
}

export const P2PManager: React.FC = () => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<P2PConnection[]>([]);
  const [stats, setStats] = useState<P2PStats>({
    totalConnections: 0,
    activeConnections: 0,
    totalBandwidth: 0,
    averageLatency: 0,
    totalPackets: 0,
    totalBytes: 0,
    relayConnections: 0,
    directConnections: 0,
  });
  const [config, setConfig] = useState<P2PConfig>({
    enabled: false,
    maxPeers: 50,
    maxConnections: 100,
    discoveryTimeout: 10000,
    connectionTimeout: 30000,
    keepAliveInterval: 30000,
    enableRelay: true,
    enableNAT: true,
    enableUPnP: true,
    enableSTUN: true,
    stunServers: ['stun:stun.l.google.com:19302'],
    enableTURN: false,
    turnServers: [],
  });
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [connectionModalVisible, setConnectionModalVisible] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<P2PConnection | null>(null);
  const [selectedVHost, setSelectedVHost] = useState<string>('default');
  const [selectedApp, setSelectedApp] = useState<string>('app');
  const [vhosts, setVhosts] = useState<string[]>([]);
  const [applications, setApplications] = useState<string[]>([]);

  const [configForm] = Form.useForm();

  useEffect(() => {
    loadVHosts();
    loadP2PConfig();
    loadConnections();
    loadStats();
    
    // Refresh data every 5 seconds
    const interval = setInterval(() => {
      loadConnections();
      loadStats();
    }, 5000);

    return () => clearInterval(interval);
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

  const loadP2PConfig = async () => {
    setLoading(true);
    try {
      // This would be a real API call to get P2P configuration
      setConfig({
        enabled: false,
        maxPeers: 50,
        maxConnections: 100,
        discoveryTimeout: 10000,
        connectionTimeout: 30000,
        keepAliveInterval: 30000,
        enableRelay: true,
        enableNAT: true,
        enableUPnP: true,
        enableSTUN: true,
        stunServers: ['stun:stun.l.google.com:19302'],
        enableTURN: false,
        turnServers: [],
      });
    } catch (error) {
      message.error('Failed to load P2P configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadConnections = async () => {
    try {
      // This would be a real API call to get P2P connections
      const mockConnections: P2PConnection[] = [
        {
          id: '1',
          peerId: 'peer_abc123',
          streamName: 'test_stream',
          status: 'connected',
          connectionType: 'direct',
          bandwidth: 2500000,
          latency: 45,
          packetsReceived: 1250,
          packetsSent: 1200,
          bytesReceived: 1250000,
          bytesSent: 1200000,
          connectedAt: Date.now() - 300000,
          lastActivity: Date.now() - 5000,
        },
        {
          id: '2',
          peerId: 'peer_def456',
          streamName: 'test_stream_720p',
          status: 'connected',
          connectionType: 'relay',
          bandwidth: 1500000,
          latency: 120,
          packetsReceived: 800,
          packetsSent: 750,
          bytesReceived: 800000,
          bytesSent: 750000,
          connectedAt: Date.now() - 180000,
          lastActivity: Date.now() - 2000,
        },
      ];
      setConnections(mockConnections);
    } catch (error) {
      message.error('Failed to load P2P connections');
    }
  };

  const loadStats = async () => {
    try {
      // This would be a real API call to get P2P statistics
      const mockStats: P2PStats = {
        totalConnections: connections.length,
        activeConnections: connections.filter(c => c.status === 'connected').length,
        totalBandwidth: connections.reduce((sum, c) => sum + c.bandwidth, 0),
        averageLatency: connections.length > 0 ? connections.reduce((sum, c) => sum + c.latency, 0) / connections.length : 0,
        totalPackets: connections.reduce((sum, c) => sum + c.packetsReceived + c.packetsSent, 0),
        totalBytes: connections.reduce((sum, c) => sum + c.bytesReceived + c.bytesSent, 0),
        relayConnections: connections.filter(c => c.connectionType === 'relay').length,
        directConnections: connections.filter(c => c.connectionType === 'direct').length,
      };
      setStats(mockStats);
    } catch (error) {
      message.error('Failed to load P2P statistics');
    }
  };

  const handleConfigSubmit = async (values: P2PConfig) => {
    try {
      setConfig(values);
      setConfigModalVisible(false);
      message.success('P2P configuration updated successfully');
    } catch (error) {
      message.error('Failed to update P2P configuration');
    }
  };

  const handleDisconnectConnection = async (id: string) => {
    try {
      setConnections(connections.filter(c => c.id !== id));
      message.success('Connection disconnected');
    } catch (error) {
      message.error('Failed to disconnect connection');
    }
  };

  const handleViewConnection = (connection: P2PConnection) => {
    setSelectedConnection(connection);
    setConnectionModalVisible(true);
  };

  const connectionColumns = [
    {
      title: 'Peer ID',
      dataIndex: 'peerId',
      key: 'peerId',
      render: (peerId: string, record: P2PConnection) => (
        <Space>
          <UserOutlined />
          <div>
            <Text strong>{peerId}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.streamName}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const color = status === 'connected' ? 'green' : status === 'connecting' ? 'blue' : 'red';
        const icon = status === 'connected' ? <CheckCircleOutlined /> : <CloseCircleOutlined />;
        return (
          <Tag color={color} icon={icon}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Type',
      dataIndex: 'connectionType',
      key: 'connectionType',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'direct' ? 'green' : type === 'relay' ? 'orange' : 'blue'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Bandwidth',
      dataIndex: 'bandwidth',
      key: 'bandwidth',
      render: (bandwidth: number) => `${(bandwidth / 1000000).toFixed(1)} Mbps`,
    },
    {
      title: 'Latency',
      dataIndex: 'latency',
      key: 'latency',
      render: (latency: number) => `${latency}ms`,
    },
    {
      title: 'Connected',
      dataIndex: 'connectedAt',
      key: 'connectedAt',
      render: (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: P2PConnection) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewConnection(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Disconnect peer?"
            description="This will terminate the P2P connection."
            onConfirm={() => handleDisconnectConnection(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Disconnect">
              <Button
                type="text"
                danger
                icon={<PauseCircleOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <ShareAltOutlined />
            <Title level={4} style={{ margin: 0 }}>P2P Configuration & Monitoring</Title>
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
              icon={<SettingOutlined />}
              onClick={() => setConfigModalVisible(true)}
            >
              Configure
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                loadConnections();
                loadStats();
              }}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <Alert
          message="P2P Streaming"
          description={
            <div>
              <p>Configure and monitor peer-to-peer connections for efficient streaming.</p>
              <p><strong>Status:</strong> {config.enabled ? 'Enabled' : 'Disabled'}</p>
              {config.enabled && (
                <p>
                  <strong>Configuration:</strong> Max {config.maxPeers} peers, 
                  {config.maxConnections} connections, 
                  {config.enableRelay ? 'Relay enabled' : 'Relay disabled'}
                </p>
              )}
            </div>
          }
          type={config.enabled ? 'success' : 'info'}
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Active Connections"
                value={stats.activeConnections}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Total Bandwidth"
                value={stats.totalBandwidth / 1000000}
                precision={1}
                suffix="Mbps"
                prefix={<GlobalOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Average Latency"
                value={stats.averageLatency}
                precision={0}
                suffix="ms"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Direct Connections"
                value={stats.directConnections}
                suffix={`/ ${stats.totalConnections}`}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={connectionColumns}
          dataSource={connections}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          locale={{
            emptyText: 'No P2P connections found. Enable P2P to start peer-to-peer streaming.',
          }}
        />
      </Card>

      {/* Configuration Modal */}
      <Modal
        title="P2P Configuration"
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        onOk={() => configForm.submit()}
        width={800}
      >
        <Form
          form={configForm}
          layout="vertical"
          initialValues={config}
          onFinish={handleConfigSubmit}
        >
          <Form.Item
            name="enabled"
            label="Enable P2P"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="maxPeers"
                label="Max Peers"
                rules={[{ required: true, message: 'Please enter max peers' }]}
              >
                <Input type="number" min={1} max={1000} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxConnections"
                label="Max Connections"
                rules={[{ required: true, message: 'Please enter max connections' }]}
              >
                <Input type="number" min={1} max={10000} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="discoveryTimeout"
                label="Discovery Timeout (ms)"
                rules={[{ required: true, message: 'Please enter discovery timeout' }]}
              >
                <Input type="number" min={1000} max={60000} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="connectionTimeout"
                label="Connection Timeout (ms)"
                rules={[{ required: true, message: 'Please enter connection timeout' }]}
              >
                <Input type="number" min={1000} max={300000} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="keepAliveInterval"
            label="Keep Alive Interval (ms)"
            rules={[{ required: true, message: 'Please enter keep alive interval' }]}
          >
            <Input type="number" min={5000} max={300000} />
          </Form.Item>

          <Divider>Connection Types</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="enableRelay"
                label="Enable Relay"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="enableNAT"
                label="Enable NAT Traversal"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="enableUPnP"
                label="Enable UPnP"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="enableSTUN"
            label="Enable STUN"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="stunServers"
            label="STUN Servers"
            dependencies={['enableSTUN']}
          >
            <Select
              mode="tags"
              placeholder="Add STUN servers"
              options={[
                { label: 'Google STUN', value: 'stun:stun.l.google.com:19302' },
                { label: 'Mozilla STUN', value: 'stun:stun.mozilla.org:3478' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="enableTURN"
            label="Enable TURN"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Connection Details Modal */}
      <Modal
        title={`Connection Details - ${selectedConnection?.peerId}`}
        open={connectionModalVisible}
        onCancel={() => setConnectionModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setConnectionModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedConnection && (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Peer ID">{selectedConnection.peerId}</Descriptions.Item>
            <Descriptions.Item label="Stream Name">{selectedConnection.streamName}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedConnection.status === 'connected' ? 'green' : 'red'}>
                {selectedConnection.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Connection Type">
              <Tag color={selectedConnection.connectionType === 'direct' ? 'green' : 'orange'}>
                {selectedConnection.connectionType.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Bandwidth">
              {(selectedConnection.bandwidth / 1000000).toFixed(1)} Mbps
            </Descriptions.Item>
            <Descriptions.Item label="Latency">{selectedConnection.latency}ms</Descriptions.Item>
            <Descriptions.Item label="Packets Received">{selectedConnection.packetsReceived}</Descriptions.Item>
            <Descriptions.Item label="Packets Sent">{selectedConnection.packetsSent}</Descriptions.Item>
            <Descriptions.Item label="Bytes Received">
              {(selectedConnection.bytesReceived / 1024 / 1024).toFixed(2)} MB
            </Descriptions.Item>
            <Descriptions.Item label="Bytes Sent">
              {(selectedConnection.bytesSent / 1024 / 1024).toFixed(2)} MB
            </Descriptions.Item>
            <Descriptions.Item label="Connected At">
              {new Date(selectedConnection.connectedAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Last Activity">
              {new Date(selectedConnection.lastActivity).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};
