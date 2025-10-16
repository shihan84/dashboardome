import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Badge,
  Space,
  Typography,
  Button,
  Spin,
  Alert,
  Table,
  Tag
} from 'antd';
import {
  PlayCircleOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  EyeOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CloudServerOutlined,
  VideoCameraOutlined,
  WifiOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;

interface SystemStats {
  activeStreams: number;
  totalConnections: number;
  cpuUsage: number;
  memoryUsage: number;
  bandwidthUsage: number;
  uptime: string;
  serverStatus: 'online' | 'offline';
}

interface StreamInfo {
  name: string;
  status: 'active' | 'inactive' | 'error';
  viewers: number;
  bitrate: number;
  resolution: string;
  protocol: string;
}

const DashboardOverview: React.FC = () => {
  const { omeHost, omePort } = useStore();
  const [loading, setLoading] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    activeStreams: 0,
    totalConnections: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    bandwidthUsage: 0,
    uptime: '0d 0h 0m',
    serverStatus: 'offline'
  });
  const [activeStreams, setActiveStreams] = useState<StreamInfo[]>([]);

  const loadSystemStats = async () => {
    setLoading(true);
    try {
      // Create OME API service instance
      const omeApi = new OMEApiService(omeHost, omePort);
      
      // Load server statistics from real OME API
      const serverStats = await omeApi.getServerStats();
      
      // Load all virtual hosts to get applications and streams
      const vhostsResponse = await omeApi.getVHosts();
      let totalStreams = 0;
      let totalConnections = 0;
      const allStreams: StreamInfo[] = [];
      
      if (vhostsResponse.success) {
        for (const vhost of vhostsResponse.data) {
          // Get applications for each vhost
          const appsResponse = await omeApi.getApplications(vhost.name);
          if (appsResponse.success) {
            for (const app of appsResponse.data) {
              // Get streams for each application
              const streamsResponse = await omeApi.getStreams(vhost.name, app.name);
              if (streamsResponse.success) {
                totalStreams += streamsResponse.data.length;
                for (const stream of streamsResponse.data) {
                  // Get detailed stream information
                  const streamDetails = await omeApi.getStreamDetailed(vhost.name, app.name, stream.name);
                  const streamInfo: StreamInfo = {
                    name: stream.name,
                    status: streamDetails.state === 'started' ? 'active' : 'inactive',
                    viewers: streamDetails.connections?.total || 0,
                    bitrate: streamDetails.bitrate || 0,
                    resolution: streamDetails.video?.resolution || 'Unknown',
                    protocol: streamDetails.sourceType || 'Unknown'
                  };
                  allStreams.push(streamInfo);
                  totalConnections += streamInfo.viewers;
                }
              }
            }
          }
        }
      }
      
      // Parse server stats from OME response
      const cpuUsage = serverStats?.system?.cpu?.usage || 0;
      const memoryUsage = serverStats?.system?.memory?.usage || 0;
      const bandwidthUsage = serverStats?.system?.network?.bandwidth || 0;
      const uptime = serverStats?.system?.uptime || '0d 0h 0m';
      
      setSystemStats({
        activeStreams: totalStreams,
        totalConnections: totalConnections,
        cpuUsage: Math.round(cpuUsage * 100) / 100,
        memoryUsage: Math.round(memoryUsage * 100) / 100,
        bandwidthUsage: Math.round(bandwidthUsage / 1024 / 1024 * 100) / 100, // Convert to Mbps
        uptime: uptime,
        serverStatus: 'online'
      });

      setActiveStreams(allStreams);
    } catch (error) {
      console.error('Failed to load system stats:', error);
      setSystemStats(prev => ({ ...prev, serverStatus: 'offline' }));
      setActiveStreams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemStats();
    const interval = setInterval(loadSystemStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [omeHost, omePort]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const streamColumns = [
    {
      title: 'Stream Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: StreamInfo) => (
        <Space>
          <Badge status={getStatusColor(record.status)} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Protocol',
      dataIndex: 'protocol',
      key: 'protocol',
      render: (protocol: string) => (
        <Tag color="blue">{protocol.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Viewers',
      dataIndex: 'viewers',
      key: 'viewers',
      render: (viewers: number) => (
        <Space>
          <EyeOutlined />
          {viewers}
        </Space>
      ),
    },
    {
      title: 'Quality',
      dataIndex: 'resolution',
      key: 'resolution',
      render: (resolution: string, record: StreamInfo) => (
        <Space direction="vertical" size="small">
          <Text>{resolution}</Text>
          <Text type="secondary">{record.bitrate}kbps</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : status === 'error' ? 'red' : 'default'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Connection Status */}
      <Alert
        message={`Connected to OvenMediaEngine at ${omeHost}:${omePort}`}
        type={systemStats.serverStatus === 'online' ? 'success' : 'error'}
        icon={systemStats.serverStatus === 'online' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
        action={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadSystemStats} 
            loading={loading}
            size="small"
          >
            Refresh
          </Button>
        }
        style={{ marginBottom: 24 }}
      />

      {/* System Overview Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Streams"
              value={systemStats.activeStreams}
              prefix={<PlayCircleOutlined style={{ color: '#52c41a' }} />}
              suffix={<Badge status="processing" text="Live" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Connections"
              value={systemStats.totalConnections}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="CPU Usage"
              value={systemStats.cpuUsage}
              suffix="%"
              prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />}
            />
            <Progress percent={systemStats.cpuUsage} size="small" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Memory Usage"
              value={systemStats.memoryUsage}
              suffix="%"
              prefix={<DatabaseOutlined style={{ color: '#722ed1' }} />}
            />
            <Progress percent={systemStats.memoryUsage} size="small" />
          </Card>
        </Col>
      </Row>

      {/* Server Information */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Server Information" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Server Status</Text>
                <br />
                <Badge 
                  status={systemStats.serverStatus === 'online' ? 'success' : 'error'} 
                  text={systemStats.serverStatus === 'online' ? 'Online' : 'Offline'} 
                />
              </div>
              <div>
                <Text strong>Uptime</Text>
                <br />
                <Text type="secondary">{systemStats.uptime}</Text>
              </div>
              <div>
                <Text strong>Bandwidth Usage</Text>
                <br />
                <Text type="secondary">{systemStats.bandwidthUsage} Mbps</Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Quick Actions" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />} 
                block
                onClick={() => window.open('/streaming/live', '_blank')}
              >
                Manage Live Streams
              </Button>
              <Button 
                icon={<CloudServerOutlined />} 
                block
                onClick={() => window.open('/applications/list', '_blank')}
              >
                Application Management
              </Button>
              <Button 
                icon={<BarChartOutlined />} 
                block
                onClick={() => window.open('/monitoring/analytics', '_blank')}
              >
                View Analytics
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Active Streams Table */}
      <Card 
        title="Active Streams" 
        extra={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadSystemStats} 
            loading={loading}
            size="small"
          >
            Refresh
          </Button>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={streamColumns}
            dataSource={activeStreams}
            rowKey="name"
            pagination={false}
            size="small"
            locale={{
              emptyText: 'No active streams'
            }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default DashboardOverview;
