import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Button,
  Select,
  DatePicker,
  Table,
  Progress,
  Tag,
  Tooltip,
  Alert,
  Spin,
  Tabs,
  Timeline,
  List,
  Avatar,
} from 'antd';
import {
  ReloadOutlined,
  DashboardOutlined,
  CloudServerOutlined,
  VideoCameraOutlined,
  SendOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  FileOutlined,
  WifiOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import { OMEApiService } from '../services/omeApi';
import type { OMEMetrics } from '../types/index';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

export const StatisticsDashboard: React.FC = () => {
  const [serverStats, setServerStats] = useState<OMEMetrics | null>(null);
  const [vhostStats, setVHostStats] = useState<OMEMetrics | null>(null);
  const [appStats, setAppStats] = useState<OMEMetrics | null>(null);
  const [streamStats, setStreamStats] = useState<OMEMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVHost, setSelectedVHost] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(1, 'hour'),
    dayjs(),
  ]);
  
  const { omeHost, omePort, omeUsername, omePassword, currentVHost, currentApp } = useStore();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  useEffect(() => {
    loadStatistics();
  }, [selectedVHost, selectedApp, selectedStream]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      // Load server statistics
      const server = await omeApi.getServerStats();
      setServerStats(server);

      // Load vhost statistics if selected
      if (selectedVHost) {
        const vhost = await omeApi.getVHostStats(selectedVHost);
        setVHostStats(vhost);
      }

      // Load app statistics if selected
      if (selectedVHost && selectedApp) {
        const app = await omeApi.getAppStats(selectedVHost, selectedApp);
        setAppStats(app);
      }

      // Load stream statistics if selected
      if (selectedVHost && selectedApp && selectedStream) {
        const stream = await omeApi.getStreamStats(selectedVHost, selectedApp, selectedStream);
        setStreamStats(stream);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getConnectionStatus = (connections: any) => {
    const total = Object.values(connections).reduce((sum: number, count: any) => sum + count, 0);
    return {
      total,
      active: total > 0,
      breakdown: connections,
    };
  };

  const getThroughputStatus = (inThroughput: number, outThroughput: number) => {
    const ratio = outThroughput > 0 ? (inThroughput / outThroughput) * 100 : 0;
    return {
      ratio: Math.round(ratio),
      status: ratio > 80 ? 'high' : ratio > 50 ? 'medium' : 'low',
    };
  };

  const renderConnectionStats = (stats: OMEMetrics) => {
    const connectionStatus = getConnectionStatus(stats.connections);
    const throughputStatus = getThroughputStatus(stats.lastThroughputIn, stats.lastThroughputOut);
    
    return (
      <Row gutter={16}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Connections"
              value={connectionStatus.total}
              prefix={<WifiOutlined />}
              valueStyle={{ color: connectionStatus.active ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="WebRTC"
              value={stats.connections.webrtc}
              prefix={<GlobalOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="LLHLS"
              value={stats.connections.llhls}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="SRT"
              value={stats.connections.srt}
              prefix={<SendOutlined />}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderThroughputStats = (stats: OMEMetrics) => {
    const throughputStatus = getThroughputStatus(stats.lastThroughputIn, stats.lastThroughputOut);
    
    return (
      <Row gutter={16}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Current In"
              value={formatBytes(stats.lastThroughputIn)}
              prefix={<FileOutlined />}
              suffix="/s"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Current Out"
              value={formatBytes(stats.lastThroughputOut)}
              prefix={<SendOutlined />}
              suffix="/s"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total In"
              value={formatBytes(stats.totalBytesIn)}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Card size="small">
              <Statistic
                title="Total Out"
                value={formatBytes(stats.totalBytesOut)}
                prefix={<SendOutlined />}
              />
            </Card>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderPerformanceStats = (stats: OMEMetrics) => {
    return (
      <Row gutter={16}>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Avg Throughput In"
              value={formatBytes(stats.avgThroughputIn)}
              prefix={<FileOutlined />}
              suffix="/s"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Max Throughput In"
              value={formatBytes(stats.maxThroughputIn)}
              prefix={<ThunderboltOutlined />}
              suffix="/s"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Max Connections"
              value={stats.maxTotalConnections}
              prefix={<WifiOutlined />}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderTimeline = (stats: OMEMetrics) => {
    const timelineItems = [
      {
        color: 'blue',
        children: `Created: ${dayjs(stats.createdTime).format('YYYY-MM-DD HH:mm:ss')}`,
      },
      {
        color: 'green',
        children: `Last Received: ${dayjs(stats.lastRecvTime).format('YYYY-MM-DD HH:mm:ss')}`,
      },
      {
        color: 'orange',
        children: `Last Sent: ${dayjs(stats.lastSentTime).format('YYYY-MM-DD HH:mm:ss')}`,
      },
      {
        color: 'purple',
        children: `Last Updated: ${dayjs(stats.lastUpdatedTime).format('YYYY-MM-DD HH:mm:ss')}`,
      },
    ];

    return (
      <Card title="Timeline" size="small">
        <Timeline items={timelineItems} />
      </Card>
    );
  };

  const renderConnectionBreakdown = (stats: OMEMetrics) => {
    const connections = Object.entries(stats.connections).map(([protocol, count]) => ({
      protocol: protocol.toUpperCase(),
      count,
      percentage: stats.totalConnections > 0 ? (count / stats.totalConnections) * 100 : 0,
    }));

    return (
      <Card title="Connection Breakdown" size="small">
        <List
          dataSource={connections}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar size="small">{item.protocol[0]}</Avatar>}
                title={item.protocol}
                description={
                  <Space>
                    <Text strong>{item.count}</Text>
                    <Progress
                      percent={Math.round(item.percentage)}
                      size="small"
                      showInfo={false}
                      style={{ width: 100 }}
                    />
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            <DashboardOutlined /> Statistics Dashboard
          </Title>
          <Space>
            <RangePicker
              value={timeRange}
              onChange={(dates) => setTimeRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={loadStatistics}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        <Spin spinning={loading}>
          <Tabs defaultActiveKey="server">
            <TabPane tab="Server Statistics" key="server" icon={<CloudServerOutlined />}>
              {serverStats && (
                <>
                  {renderConnectionStats(serverStats)}
                  <div style={{ marginTop: 16 }}>
                    {renderThroughputStats(serverStats)}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    {renderPerformanceStats(serverStats)}
                  </div>
                  <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={12}>
                      {renderTimeline(serverStats)}
                    </Col>
                    <Col span={12}>
                      {renderConnectionBreakdown(serverStats)}
                    </Col>
                  </Row>
                </>
              )}
            </TabPane>

            <TabPane tab="VHost Statistics" key="vhost" icon={<VideoCameraOutlined />}>
              <div style={{ marginBottom: 16 }}>
                <Space>
                  <Text>Select Virtual Host:</Text>
                  <Select
                    style={{ width: 200 }}
                    placeholder="Select vhost"
                    value={selectedVHost}
                    onChange={setSelectedVHost}
                  >
                    <Option value={currentVHost}>{currentVHost}</Option>
                  </Select>
                </Space>
              </div>

              {vhostStats && selectedVHost && (
                <>
                  {renderConnectionStats(vhostStats)}
                  <div style={{ marginTop: 16 }}>
                    {renderThroughputStats(vhostStats)}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    {renderPerformanceStats(vhostStats)}
                  </div>
                </>
              )}
            </TabPane>

            <TabPane tab="Application Statistics" key="app" icon={<SendOutlined />}>
              <div style={{ marginBottom: 16 }}>
                <Space>
                  <Text>Select Application:</Text>
                  <Select
                    style={{ width: 200 }}
                    placeholder="Select app"
                    value={selectedApp}
                    onChange={setSelectedApp}
                    disabled={!selectedVHost}
                  >
                    <Option value={currentApp}>{currentApp}</Option>
                  </Select>
                </Space>
              </div>

              {appStats && selectedVHost && selectedApp && (
                <>
                  {renderConnectionStats(appStats)}
                  <div style={{ marginTop: 16 }}>
                    {renderThroughputStats(appStats)}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    {renderPerformanceStats(appStats)}
                  </div>
                </>
              )}
            </TabPane>

            <TabPane tab="Stream Statistics" key="stream" icon={<EyeOutlined />}>
              <div style={{ marginBottom: 16 }}>
                <Space>
                  <Text>Select Stream:</Text>
                  <Select
                    style={{ width: 200 }}
                    placeholder="Select stream"
                    value={selectedStream}
                    onChange={setSelectedStream}
                    disabled={!selectedVHost || !selectedApp}
                  >
                    <Option value="stream_001">stream_001</Option>
                  </Select>
                </Space>
              </div>

              {streamStats && selectedVHost && selectedApp && selectedStream && (
                <>
                  {renderConnectionStats(streamStats)}
                  <div style={{ marginTop: 16 }}>
                    {renderThroughputStats(streamStats)}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    {renderPerformanceStats(streamStats)}
                  </div>
                </>
              )}
            </TabPane>
          </Tabs>
        </Spin>
      </Card>
    </div>
  );
};
