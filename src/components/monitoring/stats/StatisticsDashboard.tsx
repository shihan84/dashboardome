import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Alert, 
  Select, 
  Space, 
  Tabs,
  Table,
  Progress,
  Tag,
  Spin,
  Button,
  Tooltip
} from 'antd';
import { 
  BarChartOutlined, 
  LineChartOutlined, 
  PieChartOutlined,
  PlayCircleOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  WifiOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface MetricData {
  timestamp: string;
  value: number;
  label?: string;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    inbound: number;
    outbound: number;
  };
  uptime: number;
}

interface StreamMetrics {
  totalStreams: number;
  activeStreams: number;
  totalConnections: number;
  bandwidth: {
    inbound: number;
    outbound: number;
  };
  transcoding: {
    active: number;
    queued: number;
    completed: number;
  };
}

export const StatisticsDashboard: React.FC = () => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  const [loading, setLoading] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [streamMetrics, setStreamMetrics] = useState<StreamMetrics | null>(null);
  const [serverStats, setServerStats] = useState<any>(null);
  const [vhostStats, setVhostStats] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('1h');
  const [selectedMetric, setSelectedMetric] = useState('bandwidth');

  const loadSystemMetrics = useCallback(async () => {
    try {
      const [system, network, realtime] = await Promise.all([
        omeApi.getSystemMetrics().catch(() => null),
        omeApi.getNetworkMetrics().catch(() => null),
        omeApi.getRealtimeMetrics().catch(() => null)
      ]);

      if (system || network || realtime) {
        setSystemMetrics({
          cpu: system?.cpu || 0,
          memory: system?.memory || 0,
          disk: system?.disk || 0,
          network: {
            inbound: network?.inbound || 0,
            outbound: network?.outbound || 0
          },
          uptime: system?.uptime || 0
        });
      }
    } catch (e) {
      console.warn('Failed to load system metrics');
    }
  }, [omeApi]);

  const loadStreamMetrics = useCallback(async () => {
    try {
      const [server, transcoding] = await Promise.all([
        omeApi.getServerStats().catch(() => null),
        omeApi.getTranscodingMetrics().catch(() => null)
      ]);

      if (server) {
        setStreamMetrics({
          totalStreams: server.totalStreams || 0,
          activeStreams: server.activeStreams || 0,
          totalConnections: server.totalConnections || 0,
          bandwidth: {
            inbound: server.bandwidth?.inbound || 0,
            outbound: server.bandwidth?.outbound || 0
          },
          transcoding: {
            active: transcoding?.active || 0,
            queued: transcoding?.queued || 0,
            completed: transcoding?.completed || 0
          }
        });
      }
    } catch (e) {
      console.warn('Failed to load stream metrics');
    }
  }, [omeApi]);

  const loadServerStats = useCallback(async () => {
    try {
      const stats = await omeApi.getServerStats();
      setServerStats(stats);
    } catch (e) {
      console.warn('Failed to load server stats');
    }
  }, [omeApi]);

  const loadVHostStats = useCallback(async () => {
    try {
      const vhosts = await omeApi.getVHosts();
      const stats = await Promise.all(
        vhosts.map(vhost => 
          omeApi.getVHostStats(vhost.name).catch(() => null)
        )
      );
      setVhostStats(stats.filter(Boolean));
    } catch (e) {
      console.warn('Failed to load vhost stats');
    }
  }, [omeApi]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadSystemMetrics(),
        loadStreamMetrics(),
        loadServerStats(),
        loadVHostStats()
      ]);
    } catch (e: any) {
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, [loadSystemMetrics, loadStreamMetrics, loadServerStats, loadVHostStats]);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadAllData]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const vhostColumns = [
    {
      title: 'Virtual Host',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Applications',
      dataIndex: 'applications',
      key: 'applications',
      render: (apps: any[]) => apps?.length || 0,
    },
    {
      title: 'Streams',
      dataIndex: 'streams',
      key: 'streams',
      render: (streams: any[]) => streams?.length || 0,
    },
    {
      title: 'Connections',
      dataIndex: 'connections',
      key: 'connections',
      render: (connections: number) => connections || 0,
    },
    {
      title: 'Bandwidth',
      key: 'bandwidth',
      render: (_, record: any) => (
        <Space direction="vertical" size="small">
          <Text type="secondary">In: {formatBytes(record.bandwidth?.inbound || 0)}/s</Text>
          <Text type="secondary">Out: {formatBytes(record.bandwidth?.outbound || 0)}/s</Text>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {error && <Alert type="error" message={error} showIcon />}
      
      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>Statistics Dashboard</Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadAllData}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
        extra={
          <Space>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 120 }}
            >
              <Option value="5m">Last 5m</Option>
              <Option value="1h">Last 1h</Option>
              <Option value="6h">Last 6h</Option>
              <Option value="24h">Last 24h</Option>
            </Select>
            <Select
              value={selectedMetric}
              onChange={setSelectedMetric}
              style={{ width: 120 }}
            >
              <Option value="bandwidth">Bandwidth</Option>
              <Option value="connections">Connections</Option>
              <Option value="cpu">CPU Usage</Option>
              <Option value="memory">Memory</Option>
            </Select>
          </Space>
        }
      >
        <Tabs defaultActiveKey="overview">
          <TabPane tab="Overview" key="overview">
            <Row gutter={16}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Total Streams"
                    value={streamMetrics?.totalStreams || 0}
                    prefix={<PlayCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Active Streams"
                    value={streamMetrics?.activeStreams || 0}
                    prefix={<PlayCircleOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Total Connections"
                    value={streamMetrics?.totalConnections || 0}
                    prefix={<CloudServerOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Uptime"
                    value={systemMetrics?.uptime ? formatUptime(systemMetrics.uptime) : 'N/A'}
                    prefix={<DatabaseOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card title="System Resources" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>CPU Usage</Text>
                      <Progress 
                        percent={systemMetrics?.cpu || 0} 
                        status={systemMetrics && systemMetrics.cpu > 80 ? 'exception' : 'normal'}
                      />
                    </div>
                    <div>
                      <Text strong>Memory Usage</Text>
                      <Progress 
                        percent={systemMetrics?.memory || 0} 
                        status={systemMetrics && systemMetrics.memory > 80 ? 'exception' : 'normal'}
                      />
                    </div>
                    <div>
                      <Text strong>Disk Usage</Text>
                      <Progress 
                        percent={systemMetrics?.disk || 0} 
                        status={systemMetrics && systemMetrics.disk > 80 ? 'exception' : 'normal'}
                      />
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Network Traffic" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>Inbound</Text>
                      <Text style={{ float: 'right' }}>
                        {formatBytes(systemMetrics?.network.inbound || 0)}/s
                      </Text>
                    </div>
                    <div>
                      <Text strong>Outbound</Text>
                      <Text style={{ float: 'right' }}>
                        {formatBytes(systemMetrics?.network.outbound || 0)}/s
                      </Text>
                    </div>
                    <div>
                      <Text strong>Total Bandwidth</Text>
                      <Text style={{ float: 'right' }}>
                        {formatBytes((systemMetrics?.network.inbound || 0) + (systemMetrics?.network.outbound || 0))}/s
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Streams" key="streams">
            <Row gutter={16}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Active Transcoding"
                    value={streamMetrics?.transcoding.active || 0}
                    prefix={<BarChartOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Queued Transcoding"
                    value={streamMetrics?.transcoding.queued || 0}
                    prefix={<BarChartOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Completed Transcoding"
                    value={streamMetrics?.transcoding.completed || 0}
                    prefix={<BarChartOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card title="Bandwidth Usage" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>Inbound</Text>
                      <Text style={{ float: 'right' }}>
                        {formatBytes(streamMetrics?.bandwidth.inbound || 0)}/s
                      </Text>
                    </div>
                    <div>
                      <Text strong>Outbound</Text>
                      <Text style={{ float: 'right' }}>
                        {formatBytes(streamMetrics?.bandwidth.outbound || 0)}/s
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Stream Distribution" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>Active</Text>
                      <Tag color="green" style={{ float: 'right' }}>
                        {streamMetrics?.activeStreams || 0}
                      </Tag>
                    </div>
                    <div>
                      <Text strong>Inactive</Text>
                      <Tag color="default" style={{ float: 'right' }}>
                        {(streamMetrics?.totalStreams || 0) - (streamMetrics?.activeStreams || 0)}
                      </Tag>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Virtual Hosts" key="vhosts">
            <Table
              columns={vhostColumns}
              dataSource={vhostStats}
              loading={loading}
              rowKey="name"
              pagination={false}
              size="small"
            />
          </TabPane>

          <TabPane tab="System" key="system">
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Server Information" size="small">
                  {serverStats ? (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Version:</Text>
                        <Text style={{ float: 'right' }}>{serverStats.version || 'N/A'}</Text>
                      </div>
                      <div>
                        <Text strong>Build Date:</Text>
                        <Text style={{ float: 'right' }}>{serverStats.buildDate || 'N/A'}</Text>
                      </div>
                      <div>
                        <Text strong>Platform:</Text>
                        <Text style={{ float: 'right' }}>{serverStats.platform || 'N/A'}</Text>
                      </div>
                      <div>
                        <Text strong>Architecture:</Text>
                        <Text style={{ float: 'right' }}>{serverStats.architecture || 'N/A'}</Text>
                      </div>
                    </Space>
                  ) : (
                    <Text type="secondary">No server information available</Text>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Performance Metrics" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>CPU Cores:</Text>
                      <Text style={{ float: 'right' }}>{serverStats?.cpuCores || 'N/A'}</Text>
                    </div>
                    <div>
                      <Text strong>Total Memory:</Text>
                      <Text style={{ float: 'right' }}>
                        {serverStats?.totalMemory ? formatBytes(serverStats.totalMemory) : 'N/A'}
                      </Text>
                    </div>
                    <div>
                      <Text strong>Free Memory:</Text>
                      <Text style={{ float: 'right' }}>
                        {serverStats?.freeMemory ? formatBytes(serverStats.freeMemory) : 'N/A'}
                      </Text>
                    </div>
                    <div>
                      <Text strong>Disk Space:</Text>
                      <Text style={{ float: 'right' }}>
                        {serverStats?.diskSpace ? formatBytes(serverStats.diskSpace) : 'N/A'}
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>
    </Space>
  );
};