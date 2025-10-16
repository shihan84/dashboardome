import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Space,
  Typography,
  Button,
  Tooltip,
  Badge,
  Alert,
  Spin,
  Tabs,
  Progress,
  Tag,
  Timeline,
} from 'antd';
import {
  ThunderboltOutlined,
  WifiOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  DashboardOutlined,
  SignalFilled,
  VideoCameraOutlined,
  AudioOutlined,
} from '@ant-design/icons';
// Charts will be implemented with alternative solutions
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface WebRTCMonitorProps {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

interface WebRTCConnection {
  id: string;
  peerId: string;
  state: 'connecting' | 'connected' | 'disconnected' | 'failed';
  protocol: 'webrtc';
  localCandidate: string;
  remoteCandidate: string;
  iceConnectionState: 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected' | 'closed';
  iceGatheringState: 'new' | 'gathering' | 'complete';
  connectionState: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
  quality: {
    bitrate: number;
    resolution: string;
    framerate: number;
    latency: number;
    packetLoss: number;
    jitter: number;
  };
  stats: {
    bytesReceived: number;
    bytesSent: number;
    packetsReceived: number;
    packetsSent: number;
    packetsLost: number;
    rtt: number;
  };
  createdAt: string;
  lastActivity: string;
}

interface WebRTCStats {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  averageLatency: number;
  averageBitrate: number;
  totalBytesReceived: number;
  totalBytesSent: number;
  averagePacketLoss: number;
  averageJitter: number;
  qualityDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

export const WebRTCMonitor: React.FC<WebRTCMonitorProps> = ({
  refreshInterval = 3000,
  autoRefresh = true
}) => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const [connections, setConnections] = useState<WebRTCConnection[]>([]);
  const [stats, setStats] = useState<WebRTCStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(autoRefresh);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  const fetchWebRTCData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate WebRTC data since OME API doesn't provide detailed WebRTC stats
      // In a real implementation, this would call actual OME WebRTC endpoints
      const mockConnections: WebRTCConnection[] = [
        {
          id: 'conn_1',
          peerId: 'peer_12345',
          state: 'connected',
          protocol: 'webrtc',
          localCandidate: '192.168.1.102:10000',
          remoteCandidate: '203.0.113.1:54321',
          iceConnectionState: 'connected',
          iceGatheringState: 'complete',
          connectionState: 'connected',
          quality: {
            bitrate: 2500000,
            resolution: '1920x1080',
            framerate: 30,
            latency: 45,
            packetLoss: 0.1,
            jitter: 2.5,
          },
          stats: {
            bytesReceived: 125000000,
            bytesSent: 98000000,
            packetsReceived: 15000,
            packetsSent: 12000,
            packetsLost: 15,
            rtt: 45,
          },
          createdAt: new Date(Date.now() - 300000).toISOString(),
          lastActivity: new Date().toISOString(),
        },
        {
          id: 'conn_2',
          peerId: 'peer_67890',
          state: 'connected',
          protocol: 'webrtc',
          localCandidate: '192.168.1.102:10001',
          remoteCandidate: '203.0.113.2:54322',
          iceConnectionState: 'connected',
          iceGatheringState: 'complete',
          connectionState: 'connected',
          quality: {
            bitrate: 1500000,
            resolution: '1280x720',
            framerate: 25,
            latency: 38,
            packetLoss: 0.05,
            jitter: 1.8,
          },
          stats: {
            bytesReceived: 75000000,
            bytesSent: 60000000,
            packetsReceived: 9000,
            packetsSent: 8000,
            packetsLost: 8,
            rtt: 38,
          },
          createdAt: new Date(Date.now() - 180000).toISOString(),
          lastActivity: new Date().toISOString(),
        },
      ];

      const mockStats: WebRTCStats = {
        totalConnections: 2,
        activeConnections: 2,
        failedConnections: 0,
        averageLatency: 41.5,
        averageBitrate: 2000000,
        totalBytesReceived: 200000000,
        totalBytesSent: 158000000,
        averagePacketLoss: 0.075,
        averageJitter: 2.15,
        qualityDistribution: {
          excellent: 1,
          good: 1,
          fair: 0,
          poor: 0,
        },
      };

      setConnections(mockConnections);
      setStats(mockStats);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebRTCData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoRefresh) {
      interval = setInterval(fetchWebRTCData, refreshInterval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoRefresh, refreshInterval]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatBitrate = (bitrate: number) => {
    if (bitrate < 1000) return bitrate + ' bps';
    if (bitrate < 1000000) return (bitrate / 1000).toFixed(1) + ' Kbps';
    return (bitrate / 1000000).toFixed(1) + ' Mbps';
  };

  const getConnectionStateColor = (state: string) => {
    switch (state) {
      case 'connected': return 'green';
      case 'connecting': return 'blue';
      case 'disconnected': return 'default';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'green';
      case 'good': return 'blue';
      case 'fair': return 'orange';
      case 'poor': return 'red';
      default: return 'gray';
    }
  };

  const getQualityLevel = (bitrate: number, latency: number, packetLoss: number) => {
    if (bitrate > 2000000 && latency < 50 && packetLoss < 0.1) return 'excellent';
    if (bitrate > 1000000 && latency < 100 && packetLoss < 0.5) return 'good';
    if (bitrate > 500000 && latency < 200 && packetLoss < 1.0) return 'fair';
    return 'poor';
  };

  const connectionColumns = [
    {
      title: 'Peer ID',
      dataIndex: 'peerId',
      key: 'peerId',
      render: (peerId: string) => (
        <Space>
          <ThunderboltOutlined style={{ color: '#1890ff' }} />
          <Text code>{peerId}</Text>
        </Space>
      ),
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      render: (state: string) => (
        <Tag color={getConnectionStateColor(state)}>
          {state.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Quality',
      key: 'quality',
      render: (record: WebRTCConnection) => {
        const quality = getQualityLevel(record.quality.bitrate, record.quality.latency, record.quality.packetLoss);
        return (
          <Tag color={getQualityColor(quality)}>
            {quality.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Bitrate',
      dataIndex: 'quality',
      key: 'bitrate',
      render: (quality: any) => formatBitrate(quality.bitrate),
    },
    {
      title: 'Resolution',
      dataIndex: 'quality',
      key: 'resolution',
      render: (quality: any) => (
        <Space>
          <VideoCameraOutlined />
          <Text>{quality.resolution}</Text>
        </Space>
      ),
    },
    {
      title: 'Latency',
      dataIndex: 'quality',
      key: 'latency',
      render: (quality: any) => (
        <Space>
          <ClockCircleOutlined />
          <Text>{quality.latency}ms</Text>
        </Space>
      ),
    },
    {
      title: 'Packet Loss',
      dataIndex: 'quality',
      key: 'packetLoss',
      render: (quality: any) => (
        <Text type={quality.packetLoss > 0.5 ? 'danger' : 'secondary'}>
          {(quality.packetLoss * 100).toFixed(2)}%
        </Text>
      ),
    },
    {
      title: 'RTT',
      dataIndex: 'stats',
      key: 'rtt',
      render: (stats: any) => `${stats.rtt}ms`,
    },
    {
      title: 'Data Transferred',
      key: 'data',
      render: (record: WebRTCConnection) => (
        <Space direction="vertical" size="small">
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ↓ {formatBytes(record.stats.bytesReceived)}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ↑ {formatBytes(record.stats.bytesSent)}
          </Text>
        </Space>
      ),
    },
  ];

  const qualityGaugeConfig = {
    percent: stats ? (stats.averageBitrate / 5000000) * 100 : 0,
    range: {
      color: '#30BF78',
    },
    indicator: {
      pointer: {
        style: {
          stroke: '#D0D0D0',
        },
      },
      pin: {
        style: {
          stroke: '#D0D0D0',
        },
      },
    },
    statistic: {
      content: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        formatter: () => `${formatBitrate(stats?.averageBitrate || 0)}\nAverage Bitrate`,
      },
    },
  };

  if (error) {
    return (
      <Card title="WebRTC Monitor" extra={
        <Button icon={<ReloadOutlined />} onClick={fetchWebRTCData}>
          Retry
        </Button>
      }>
        <Alert
          message="Error Loading WebRTC Data"
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
            <ThunderboltOutlined />
            <span>WebRTC Monitor</span>
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
              onClick={fetchWebRTCData}
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
                        title="Active Connections"
                        value={stats.activeConnections}
                        prefix={<ThunderboltOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Total: {stats.totalConnections}
                      </Text>
                    </Card>
                  </Col>
                  
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Average Latency"
                        value={stats.averageLatency}
                        suffix="ms"
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ 
                          color: stats.averageLatency < 50 ? '#52c41a' : 
                                 stats.averageLatency < 100 ? '#faad14' : '#ff4d4f'
                        }}
                      />
                      <Progress
                        percent={Math.min((100 - stats.averageLatency) / 100 * 100, 100)}
                        size="small"
                        status={stats.averageLatency < 50 ? 'success' : 'normal'}
                      />
                    </Card>
                  </Col>
                  
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Average Bitrate"
                        value={formatBitrate(stats.averageBitrate)}
                        prefix={<WifiOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Packet Loss: {(stats.averagePacketLoss * 100).toFixed(2)}%
                      </Text>
                    </Card>
                  </Col>
                  
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Data Transferred"
                        value={formatBytes(stats.totalBytesReceived + stats.totalBytesSent)}
                        prefix={<DatabaseOutlined />}
                      />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        ↓ {formatBytes(stats.totalBytesReceived)} ↑ {formatBytes(stats.totalBytesSent)}
                      </Text>
                    </Card>
                  </Col>
                </Row>
              </TabPane>
              
              <TabPane tab="Connections" key="connections">
                <Table
                  columns={connectionColumns}
                  dataSource={connections}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ x: 1000 }}
                  locale={{
                    emptyText: 'No WebRTC connections found'
                  }}
                />
              </TabPane>
              
              <TabPane tab="Quality Analysis" key="quality">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card title="Bitrate Distribution" size="small">
                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic
                            title="Current Bitrate"
                            value={stats.currentBitrate}
                            suffix="kbps"
                            valueStyle={{ color: '#52c41a' }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="Average Bitrate"
                            value={stats.avgBitrate}
                            suffix="kbps"
                            valueStyle={{ color: '#1890ff' }}
                          />
                        </Col>
                        <Col span={8}>
                          <Progress
                            type="circle"
                            percent={Math.min((stats.currentBitrate / stats.maxBitrate) * 100, 100)}
                            format={() => `${stats.currentBitrate}kbps`}
                            strokeColor="#52c41a"
                          />
                        </Col>
                      </Row>
                      <div style={{ marginTop: 16 }}>
                        <Text type="secondary">
                          Max Bitrate: {stats.maxBitrate} kbps | Min Bitrate: {stats.minBitrate} kbps
                        </Text>
                      </div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="Quality Distribution" size="small">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                          <Text strong>Excellent:</Text> 
                          <Badge count={stats.qualityDistribution.excellent} color="green" style={{ marginLeft: 8 }} />
                        </div>
                        <div>
                          <Text strong>Good:</Text> 
                          <Badge count={stats.qualityDistribution.good} color="blue" style={{ marginLeft: 8 }} />
                        </div>
                        <div>
                          <Text strong>Fair:</Text> 
                          <Badge count={stats.qualityDistribution.fair} color="orange" style={{ marginLeft: 8 }} />
                        </div>
                        <div>
                          <Text strong>Poor:</Text> 
                          <Badge count={stats.qualityDistribution.poor} color="red" style={{ marginLeft: 8 }} />
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </TabPane>
              
              <TabPane tab="Performance" key="performance">
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card title="Connection Performance Metrics" size="small">
                      <Row gutter={[16, 16]}>
                        <Col span={8}>
                          <Statistic
                            title="Average Jitter"
                            value={stats.averageJitter}
                            suffix="ms"
                            precision={2}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="Failed Connections"
                            value={stats.failedConnections}
                            valueStyle={{ color: stats.failedConnections > 0 ? '#ff4d4f' : '#52c41a' }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="Success Rate"
                            value={((stats.totalConnections - stats.failedConnections) / stats.totalConnections * 100).toFixed(1)}
                            suffix="%"
                            valueStyle={{ color: '#52c41a' }}
                          />
                        </Col>
                      </Row>
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
