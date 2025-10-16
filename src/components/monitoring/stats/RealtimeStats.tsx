import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Space,
  Typography,
  Switch,
  Button,
  Tooltip,
  Badge,
  Alert,
  Spin,
  Tabs,
  Timeline,
  Tag,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  DashboardOutlined,
  CloudServerOutlined,
  WifiOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  UserOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
// Using Ant Design built-in components instead of @ant-design/plots
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface RealtimeStatsProps {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

interface StatsData {
  avgThroughputIn: number;
  avgThroughputOut: number;
  lastThroughputIn: number;
  lastThroughputOut: number;
  maxThroughputIn: number;
  maxThroughputOut: number;
  totalBytesIn: number;
  totalBytesOut: number;
  totalConnections: number;
  maxTotalConnections: number;
  connections: {
    file: number;
    hlsv3: number;
    llhls: number;
    ovt: number;
    push: number;
    srt: number;
    thumbnail: number;
    webrtc: number;
  };
  createdTime: string;
  lastRecvTime: string;
  lastSentTime: string;
  lastUpdatedTime: string;
  maxTotalConnectionTime: string;
}

interface HistoricalData {
  timestamp: string;
  throughputIn: number;
  throughputOut: number;
  connections: number;
  bytesIn: number;
  bytesOut: number;
}

export const RealtimeStats: React.FC<RealtimeStatsProps> = ({
  refreshInterval = 5000,
  autoRefresh = true
}) => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(autoRefresh);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await omeApi.getServerStats();
      if (response.success) {
        setStats(response.data);
        setLastUpdate(new Date());
        
        // Add to historical data
        const newDataPoint: HistoricalData = {
          timestamp: new Date().toISOString(),
          throughputIn: response.data.avgThroughputIn || 0,
          throughputOut: response.data.avgThroughputOut || 0,
          connections: response.data.totalConnections || 0,
          bytesIn: response.data.totalBytesIn || 0,
          bytesOut: response.data.totalBytesOut || 0,
        };
        
        setHistoricalData(prev => {
          const newData = [...prev, newDataPoint];
          // Keep only last 50 data points
          return newData.slice(-50);
        });
      } else {
        setError(response.message || 'Failed to fetch statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (isAutoRefresh) {
      intervalRef.current = setInterval(fetchStats, refreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoRefresh, refreshInterval]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatThroughput = (bytes: number) => {
    return formatBytes(bytes) + '/s';
  };

  const getConnectionStatus = () => {
    if (!stats) return 'unknown';
    if (stats.totalConnections === 0) return 'idle';
    if (stats.totalConnections < 10) return 'low';
    if (stats.totalConnections < 50) return 'medium';
    return 'high';
  };

  const getThroughputStatus = () => {
    if (!stats) return 'unknown';
    const totalThroughput = (stats.avgThroughputIn || 0) + (stats.avgThroughputOut || 0);
    if (totalThroughput === 0) return 'idle';
    if (totalThroughput < 1024 * 1024) return 'low'; // < 1MB/s
    if (totalThroughput < 10 * 1024 * 1024) return 'medium'; // < 10MB/s
    return 'high';
  };

  const connectionStatusColor = {
    idle: 'default',
    low: 'green',
    medium: 'orange',
    high: 'red',
    unknown: 'gray'
  };

  const throughputStatusColor = {
    idle: 'default',
    low: 'green',
    medium: 'orange',
    high: 'red',
    unknown: 'gray'
  };

  const connectionColumns = [
    {
      title: 'Protocol',
      dataIndex: 'protocol',
      key: 'protocol',
      render: (protocol: string) => (
        <Space>
          {protocol === 'webrtc' && <ThunderboltOutlined style={{ color: '#1890ff' }} />}
          {protocol === 'llhls' && <PlayCircleOutlined style={{ color: '#52c41a' }} />}
          {protocol === 'hlsv3' && <PlayCircleOutlined style={{ color: '#52c41a' }} />}
          {protocol === 'srt' && <WifiOutlined style={{ color: '#fa8c16' }} />}
          {protocol === 'rtmp' && <CloudServerOutlined style={{ color: '#722ed1' }} />}
          {protocol === 'file' && <DatabaseOutlined style={{ color: '#13c2c2' }} />}
          {protocol === 'push' && <GlobalOutlined style={{ color: '#eb2f96' }} />}
          {protocol === 'thumbnail' && <EyeOutlined style={{ color: '#fa541c' }} />}
          <Text strong>{protocol.toUpperCase()}</Text>
        </Space>
      ),
    },
    {
      title: 'Active Connections',
      dataIndex: 'connections',
      key: 'connections',
      render: (connections: number) => (
        <Badge 
          count={connections} 
          color={connections > 0 ? 'green' : 'default'}
          showZero
        />
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: any) => (
        <Tag color={record.connections > 0 ? 'green' : 'default'}>
          {record.connections > 0 ? 'Active' : 'Idle'}
        </Tag>
      ),
    },
  ];

  const connectionData = stats ? Object.entries(stats.connections).map(([protocol, connections]) => ({
    protocol,
    connections,
  })) : [];

  const totalConnections = stats ? Object.values(stats.connections).reduce((sum, count) => sum + count, 0) : 0;

  const chartConfig = {
    data: historicalData,
    xField: 'timestamp',
    yField: 'throughputIn',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  };

  const throughputChartConfig = {
    data: historicalData,
    xField: 'timestamp',
    yField: 'throughputOut',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  };

  const connectionsChartConfig = {
    data: historicalData,
    xField: 'timestamp',
    yField: 'connections',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  };

  if (error) {
    return (
      <Card title="Real-Time Statistics" extra={
        <Button icon={<ReloadOutlined />} onClick={fetchStats}>
          Retry
        </Button>
      }>
        <Alert
          message="Error Loading Statistics"
          description={error}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <DashboardOutlined />
            <span>Real-Time Statistics</span>
            <Badge 
              status={isAutoRefresh ? 'processing' : 'default'} 
              text={isAutoRefresh ? 'Live' : 'Paused'}
            />
          </Space>
        }
        extra={
          <Space>
            <Switch
              checked={isAutoRefresh}
              onChange={setIsAutoRefresh}
              checkedChildren="Auto"
              unCheckedChildren="Manual"
            />
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchStats}
              loading={loading}
            >
              Refresh
            </Button>
            {lastUpdate && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Last update: {lastUpdate.toLocaleTimeString()}
              </Text>
            )}
          </Space>
        }
      >
        <Spin spinning={loading}>
          {stats && (
            <Tabs defaultActiveKey="overview">
              <TabPane tab="Overview" key="overview">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Total Connections"
                        value={totalConnections}
                        prefix={<UserOutlined />}
                        valueStyle={{ color: connectionStatusColor[getConnectionStatus()] }}
                      />
                      <Progress
                        percent={Math.min((totalConnections / (stats.maxTotalConnections || 100)) * 100, 100)}
                        size="small"
                        status={getConnectionStatus() === 'high' ? 'exception' : 'normal'}
                      />
                    </Card>
                  </Col>
                  
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Avg Throughput In"
                        value={formatThroughput(stats.avgThroughputIn)}
                        prefix={<WifiOutlined />}
                        valueStyle={{ color: throughputStatusColor[getThroughputStatus()] }}
                      />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Max: {formatThroughput(stats.maxThroughputIn)}
                      </Text>
                    </Card>
                  </Col>
                  
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Avg Throughput Out"
                        value={formatThroughput(stats.avgThroughputOut)}
                        prefix={<CloudServerOutlined />}
                        valueStyle={{ color: throughputStatusColor[getThroughputStatus()] }}
                      />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Max: {formatThroughput(stats.maxThroughputOut)}
                      </Text>
                    </Card>
                  </Col>
                  
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Total Data In"
                        value={formatBytes(stats.totalBytesIn)}
                        prefix={<DatabaseOutlined />}
                      />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Total Out: {formatBytes(stats.totalBytesOut)}
                      </Text>
                    </Card>
                  </Col>
                </Row>
              </TabPane>
              
              <TabPane tab="Connections" key="connections">
                <Table
                  columns={connectionColumns}
                  dataSource={connectionData}
                  rowKey="protocol"
                  pagination={false}
                  size="small"
                  locale={{
                    emptyText: 'No connection data available'
                  }}
                />
              </TabPane>
              
              <TabPane tab="Throughput" key="throughput">
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card title="Throughput In" size="small">
                      <Row gutter={16}>
                        <Col span={6}>
                          <Statistic
                            title="Current"
                            value={stats.throughputIn}
                            suffix="Mbps"
                            valueStyle={{ color: '#52c41a' }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic
                            title="Peak"
                            value={stats.peakThroughputIn}
                            suffix="Mbps"
                            valueStyle={{ color: '#fa8c16' }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic
                            title="Average"
                            value={stats.avgThroughputIn}
                            suffix="Mbps"
                            valueStyle={{ color: '#1890ff' }}
                          />
                        </Col>
                        <Col span={6}>
                          <Progress
                            type="circle"
                            percent={Math.min((stats.throughputIn / stats.peakThroughputIn) * 100, 100)}
                            format={() => `${stats.throughputIn.toFixed(1)} Mbps`}
                            strokeColor="#52c41a"
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                  <Col span={24}>
                    <Card title="Throughput Out" size="small">
                      <Row gutter={16}>
                        <Col span={6}>
                          <Statistic
                            title="Current"
                            value={stats.throughputOut}
                            suffix="Mbps"
                            valueStyle={{ color: '#52c41a' }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic
                            title="Peak"
                            value={stats.peakThroughputOut}
                            suffix="Mbps"
                            valueStyle={{ color: '#fa8c16' }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic
                            title="Average"
                            value={stats.avgThroughputOut}
                            suffix="Mbps"
                            valueStyle={{ color: '#1890ff' }}
                          />
                        </Col>
                        <Col span={6}>
                          <Progress
                            type="circle"
                            percent={Math.min((stats.throughputOut / stats.peakThroughputOut) * 100, 100)}
                            format={() => `${stats.throughputOut.toFixed(1)} Mbps`}
                            strokeColor="#52c41a"
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>
              </TabPane>
              
              <TabPane tab="Connections Trend" key="connections-trend">
                <Card title="Connection Count Over Time" size="small">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic
                        title="Total Connections"
                        value={stats.totalConnections}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Active Connections"
                        value={stats.activeConnections}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Peak Connections"
                        value={stats.peakConnections}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Col>
                  </Row>
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary">
                      Connection trends are updated every 5 seconds. 
                      Peak connections: {stats.peakConnections} at {new Date(stats.peakTime).toLocaleString()}
                    </Text>
                  </div>
                </Card>
              </TabPane>
              
              <TabPane tab="System Info" key="system">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card title="Server Information" size="small">
                      <Timeline>
                        <Timeline.Item>
                          <Text strong>Created:</Text> {new Date(stats.createdTime).toLocaleString()}
                        </Timeline.Item>
                        <Timeline.Item>
                          <Text strong>Last Received:</Text> {new Date(stats.lastRecvTime).toLocaleString()}
                        </Timeline.Item>
                        <Timeline.Item>
                          <Text strong>Last Sent:</Text> {new Date(stats.lastSentTime).toLocaleString()}
                        </Timeline.Item>
                        <Timeline.Item>
                          <Text strong>Last Updated:</Text> {new Date(stats.lastUpdatedTime).toLocaleString()}
                        </Timeline.Item>
                      </Timeline>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="Performance Metrics" size="small">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                          <Text strong>Max Connections:</Text> {stats.maxTotalConnections}
                        </div>
                        <div>
                          <Text strong>Peak Throughput In:</Text> {formatThroughput(stats.maxThroughputIn)}
                        </div>
                        <div>
                          <Text strong>Peak Throughput Out:</Text> {formatThroughput(stats.maxThroughputOut)}
                        </div>
                        <div>
                          <Text strong>Total Data Processed:</Text> {formatBytes(stats.totalBytesIn + stats.totalBytesOut)}
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          )}
        </Spin>
      </Card>
    </div>
  );
};
