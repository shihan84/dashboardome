import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Button,
  Select,
  DatePicker,
  Typography,
  Alert,
  Badge,
  Tooltip,
  Divider,
  Timeline,
  List,
  Avatar
} from 'antd';
// import {
//   LineChart,
//   Line,
//   AreaChart,
//   Area,
//   BarChart,
//   Bar,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip as RechartsTooltip,
//   Legend,
//   ResponsiveContainer
// } from 'recharts';
import {
  EyeOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  WifiOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  ReloadOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { OMEApiService } from '../../services/omeApi';
import { useStore } from '../../store/useStore';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface AnalyticsData {
  timestamp: string;
  viewers: number;
  bitrate: number;
  latency: number;
  cpu: number;
  memory: number;
  bandwidth: number;
  errors: number;
}

interface StreamMetrics {
  name: string;
  protocol: string;
  viewers: number;
  bitrate: number;
  quality: string;
  uptime: string;
  status: 'active' | 'inactive' | 'error';
  lastError?: string;
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
}

const RealTimeAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [streamMetrics, setStreamMetrics] = useState<StreamMetrics[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('1h');
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Generate mock real-time data
  const generateMockData = () => {
    const now = new Date();
    const data: AnalyticsData[] = [];
    
    for (let i = 59; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60000);
      data.push({
        timestamp: timestamp.toISOString(),
        viewers: Math.floor(Math.random() * 100) + 20,
        bitrate: Math.floor(Math.random() * 5000) + 1000,
        latency: Math.floor(Math.random() * 200) + 50,
        cpu: Math.floor(Math.random() * 40) + 20,
        memory: Math.floor(Math.random() * 30) + 40,
        bandwidth: Math.floor(Math.random() * 200) + 50,
        errors: Math.floor(Math.random() * 5)
      });
    }
    
    setAnalyticsData(data);
  };

  const generateStreamMetrics = () => {
    const streams: StreamMetrics[] = [
      {
        name: 'live',
        protocol: 'RTMP',
        viewers: 45,
        bitrate: 2500,
        quality: '1080p',
        uptime: '2h 15m',
        status: 'active'
      },
      {
        name: 'shreenews',
        protocol: 'WebRTC',
        viewers: 23,
        bitrate: 1800,
        quality: '720p',
        uptime: '1h 45m',
        status: 'active'
      },
      {
        name: 'backup_srt',
        protocol: 'SRT',
        viewers: 8,
        bitrate: 3000,
        quality: '1080p',
        uptime: '45m',
        status: 'active'
      },
      {
        name: 'test_stream',
        protocol: 'LLHLS',
        viewers: 0,
        bitrate: 0,
        quality: 'N/A',
        uptime: '0m',
        status: 'inactive',
        lastError: 'Connection timeout'
      }
    ];
    
    setStreamMetrics(streams);
  };

  const generateAlerts = () => {
    const systemAlerts: SystemAlert[] = [
      {
        id: '1',
        type: 'warning',
        message: 'High CPU usage detected on stream "live"',
        timestamp: '2 minutes ago',
        severity: 'medium',
        source: 'System Monitor'
      },
      {
        id: '2',
        type: 'error',
        message: 'Connection lost for stream "test_stream"',
        timestamp: '5 minutes ago',
        severity: 'high',
        source: 'Stream Monitor'
      },
      {
        id: '3',
        type: 'info',
        message: 'New viewer connected to "shreenews"',
        timestamp: '1 minute ago',
        severity: 'low',
        source: 'Viewer Tracker'
      },
      {
        id: '4',
        type: 'success',
        message: 'Stream "backup_srt" started successfully',
        timestamp: '10 minutes ago',
        severity: 'low',
        source: 'Stream Manager'
      }
    ];
    
    setAlerts(systemAlerts);
  };

  useEffect(() => {
    generateMockData();
    generateStreamMetrics();
    generateAlerts();
    
    // Update data every 30 seconds
    intervalRef.current = setInterval(() => {
      generateMockData();
      generateStreamMetrics();
      generateAlerts();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return '#ff4d4f';
      case 'warning': return '#faad14';
      case 'info': return '#1890ff';
      case 'success': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  // Calculate summary statistics
  const totalViewers = streamMetrics.reduce((sum, stream) => sum + stream.viewers, 0);
  const activeStreams = streamMetrics.filter(stream => stream.status === 'active').length;
  const avgBitrate = streamMetrics.length > 0 
    ? Math.round(streamMetrics.reduce((sum, stream) => sum + stream.bitrate, 0) / streamMetrics.length)
    : 0;
  const errorCount = alerts.filter(alert => alert.type === 'error').length;

  // Protocol distribution data for pie chart
  const protocolData = streamMetrics.reduce((acc, stream) => {
    const existing = acc.find(item => item.name === stream.protocol);
    if (existing) {
      existing.value += stream.viewers;
    } else {
      acc.push({ name: stream.protocol, value: stream.viewers });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const streamColumns = [
    {
      title: 'Stream',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: StreamMetrics) => (
        <Space>
          <VideoCameraOutlined />
          <strong>{text}</strong>
          <Tag color="blue">{record.protocol}</Tag>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={getStatusColor(status)} text={status.toUpperCase()} />
      )
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
      )
    },
    {
      title: 'Quality',
      key: 'quality',
      render: (record: StreamMetrics) => (
        <Space direction="vertical" size="small">
          <Text>{record.quality}</Text>
          <Text type="secondary">{record.bitrate}kbps</Text>
        </Space>
      )
    },
    {
      title: 'Uptime',
      dataIndex: 'uptime',
      key: 'uptime',
      render: (uptime: string) => (
        <Space>
          <ClockCircleOutlined />
          {uptime}
        </Space>
      )
    },
    {
      title: 'Last Error',
      dataIndex: 'lastError',
      key: 'lastError',
      render: (error: string) => error ? (
        <Text type="danger">{error}</Text>
      ) : (
        <Text type="success">No errors</Text>
      )
    }
  ];

  return (
    <div>
      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Viewers"
              value={totalViewers}
              prefix={<EyeOutlined style={{ color: '#1890ff' }} />}
              suffix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Streams"
              value={activeStreams}
              prefix={<PlayCircleOutlined style={{ color: '#52c41a' }} />}
              suffix={`/ ${streamMetrics.length}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Avg Bitrate"
              value={avgBitrate}
              suffix="kbps"
              prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="System Errors"
              value={errorCount}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: errorCount > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Real-time Performance */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Real-time Performance" extra={
            <Space>
              <Select value={timeRange} onChange={setTimeRange} size="small">
                <Option value="1h">Last Hour</Option>
                <Option value="6h">Last 6 Hours</Option>
                <Option value="24h">Last 24 Hours</Option>
                <Option value="7d">Last 7 Days</Option>
              </Select>
              <Button icon={<ReloadOutlined />} size="small" />
            </Space>
          }>
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <Title level={4}>Performance Metrics</Title>
              <Row gutter={[32, 16]} style={{ width: '100%' }}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Progress
                      type="circle"
                      percent={Math.floor(Math.random() * 40) + 20}
                      format={(percent) => `${percent}%`}
                      strokeColor="#1890ff"
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text strong>Viewers</Text>
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Progress
                      type="circle"
                      percent={Math.floor(Math.random() * 30) + 30}
                      format={(percent) => `${percent}%`}
                      strokeColor="#52c41a"
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text strong>Bitrate</Text>
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Progress
                      type="circle"
                      percent={Math.floor(Math.random() * 20) + 10}
                      format={(percent) => `${percent}%`}
                      strokeColor="#faad14"
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text strong>Latency</Text>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="Protocol Distribution">
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <Title level={4}>Stream Protocols</Title>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {protocolData.map((protocol, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Space>
                        <div 
                          style={{ 
                            width: 12, 
                            height: 12, 
                            backgroundColor: COLORS[index % COLORS.length],
                            borderRadius: '50%'
                          }} 
                        />
                        <Text>{protocol.name}</Text>
                      </Space>
                      <Text strong>{protocol.value} viewers</Text>
                    </div>
                  ))}
                </Space>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* System Resources */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="System Resources">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={Math.floor(Math.random() * 40) + 20}
                    format={(percent) => `${percent}%`}
                    strokeColor="#1890ff"
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text strong>CPU Usage</Text>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={Math.floor(Math.random() * 30) + 40}
                    format={(percent) => `${percent}%`}
                    strokeColor="#52c41a"
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text strong>Memory Usage</Text>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Network Performance">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Bandwidth"
                  value={Math.floor(Math.random() * 200) + 50}
                  suffix="Mbps"
                  prefix={<WifiOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Packet Loss"
                  value={Math.random() * 0.5}
                  precision={2}
                  suffix="%"
                  prefix={<DatabaseOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Stream Metrics and Alerts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Stream Metrics" extra={
            <Button icon={<ReloadOutlined />} size="small" />
          }>
            <Table
              columns={streamColumns}
              dataSource={streamMetrics}
              rowKey="name"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="System Alerts" extra={
            <Badge count={alerts.length} size="small">
              <WarningOutlined />
            </Badge>
          }>
            <List
              dataSource={alerts}
              renderItem={(alert) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ backgroundColor: getAlertColor(alert.type) }}
                        icon={<WarningOutlined />}
                      />
                    }
                    title={
                      <Space>
                        <Text strong>{alert.message}</Text>
                        <Tag color={getSeverityColor(alert.severity)} size="small">
                          {alert.severity}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Text type="secondary">{alert.timestamp}</Text>
                        <Text type="secondary">Source: {alert.source}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RealTimeAnalytics;
