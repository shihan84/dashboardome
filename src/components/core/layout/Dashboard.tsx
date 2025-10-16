import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Layout,
  Menu,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Button,
  Alert,
  Spin,
  Switch,
} from 'antd';
import {
  DashboardOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  CodeOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  CloudServerOutlined,
  VideoCameraOutlined,
  SendOutlined,
  BarChartOutlined,
  NodeIndexOutlined,
  AppstoreOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  ShareAltOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import { Footer } from './Footer';
import { ConnectionTest } from '../../utils/testing/ConnectionTest';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';
import {
  StreamProfileValidator,
  ConfigurationGenerator,
  ConnectionSettings,
  VHostManagement,
  RecordingManager,
  PushPublishingManager,
  StatisticsDashboard,
  ChannelManagement,
  AccessControl,
  TLSStatus,
  IngressHelpers,
  ClusterManagement,
  StreamMonitor,
  ABRTranscoder,
  SCTE35Manager,
  RealtimeStats,
  WebRTCMonitor,
  ABRManager,
  PlayerManager,
  EncoderManager,
  DemoManager,
  ThumbnailManager,
  HLSManager,
  TranscodeWebhook,
  P2PManager,
} from '../../index';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

type DashboardTab = 'overview' | 'streaming-group' | 'channels' | 'streams' | 'ingress' | 'transcoding-group' | 'transcoder' | 'abr-manager' | 'webhooks' | 'players-group' | 'player-manager' | 'encoder-manager' | 'demo-manager' | 'output-group' | 'thumbnails' | 'hls' | 'p2p' | 'recording-group' | 'recording' | 'publishing' | 'compliance-group' | 'scte35' | 'validator' | 'infrastructure-group' | 'vhosts' | 'cluster' | 'security-group' | 'access' | 'tls' | 'monitoring-group' | 'statistics' | 'realtime-stats' | 'webrtc-monitor' | 'config-group' | 'config' | 'settings';

export const Dashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<DashboardTab>('overview');
  const [loading, setLoading] = useState(false);
  const [, setServerStats] = useState<unknown>(null);
  const [vhosts, setVhosts] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [scte35Enabled, setScte35Enabled] = useState(false);

  const {
    events,
    currentStream,
    complianceChecks,
    omeHost,
    omePort,
    omeUsername,
    omePassword,
  } = useStore();

  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  const checkConnection = useCallback(async () => {
    setConnectionStatus('checking');
    try {
      const isConnected = await omeApi.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    } catch {
      setConnectionStatus('disconnected');
    }
  }, [omeApi]);

  const handleToggleSCTE35 = useCallback(async (enabled: boolean) => {
    try {
      setScte35Enabled(enabled);
      // You can add API call here to enable/disable SCTE-35 globally
      console.log(`SCTE-35 ${enabled ? 'enabled' : 'disabled'} globally`);
    } catch (error) {
      console.error('Failed to toggle SCTE-35:', error);
      setScte35Enabled(!enabled); // Revert on error
    }
  }, []);

  const loadServerStats = useCallback(async () => {
    setLoading(true);
    try {
      const stats = await omeApi.getServerStats();
      setServerStats(stats);
    } catch (error) {
      console.error('Failed to load server stats:', error);
    } finally {
      setLoading(false);
    }
  }, [omeApi]);

  const loadVHosts = useCallback(async () => {
    try {
      const vhostsData = await omeApi.getVHosts();
      setVhosts(vhostsData);
    } catch (error) {
      console.error('Failed to load virtual hosts:', error);
    }
  }, [omeApi]);

  useEffect(() => {
    checkConnection();
    loadServerStats();
    loadVHosts();
  }, [omeHost, omePort, checkConnection, loadServerStats, loadVHosts]);

  const menuItems = [
    // DASHBOARD
    {
      key: 'overview',
      icon: <DashboardOutlined />,
      label: 'Overview',
    },
    
    // STREAMING & CHANNELS
    {
      key: 'streaming-group',
      icon: <PlayCircleOutlined />,
      label: 'Streaming & Channels',
      children: [
        {
          key: 'channels',
          icon: <NodeIndexOutlined />,
          label: 'Channel Management',
        },
        {
          key: 'streams',
          icon: <PlayCircleOutlined />,
          label: 'Stream Monitor',
        },
        {
          key: 'ingress',
          icon: <NodeIndexOutlined />,
          label: 'Ingress & Playback',
        },
      ],
    },
    
    // TRANSCODING & ABR
    {
      key: 'transcoding-group',
      icon: <CodeOutlined />,
      label: 'Transcoding & ABR',
      children: [
        {
          key: 'transcoder',
          icon: <CodeOutlined />,
          label: 'ABR & Transcoder',
        },
        {
          key: 'abr-manager',
          icon: <BarChartOutlined />,
          label: 'ABR Manager',
        },
        {
          key: 'webhooks',
          icon: <ApiOutlined />,
          label: 'Transcode Webhooks',
        },
      ],
    },
    
    // PLAYERS & ENCODERS
    {
      key: 'players-group',
      icon: <VideoCameraOutlined />,
      label: 'Players & Encoders',
      children: [
        {
          key: 'player-manager',
          icon: <PlayCircleOutlined />,
          label: 'Player Manager',
        },
        {
          key: 'encoder-manager',
          icon: <VideoCameraOutlined />,
          label: 'Encoder Manager',
        },
        {
          key: 'demo-manager',
          icon: <RocketOutlined />,
          label: 'Demo Manager',
        },
      ],
    },
    
    // OUTPUT MANAGEMENT
    {
      key: 'output-group',
      icon: <ThunderboltOutlined />,
      label: 'Output Management',
      children: [
        {
          key: 'thumbnails',
          icon: <VideoCameraOutlined />,
          label: 'Thumbnail Manager',
        },
        {
          key: 'hls',
          icon: <ThunderboltOutlined />,
          label: 'HLS Manager',
        },
        {
          key: 'p2p',
          icon: <ShareAltOutlined />,
          label: 'P2P Manager',
        },
      ],
    },
    
    // RECORDING & PUBLISHING
    {
      key: 'recording-group',
      icon: <VideoCameraOutlined />,
      label: 'Recording & Publishing',
      children: [
        {
          key: 'recording',
          icon: <VideoCameraOutlined />,
          label: 'Recording & DVR',
        },
        {
          key: 'publishing',
          icon: <SendOutlined />,
          label: 'Push Publishing',
        },
      ],
    },
    
    // COMPLIANCE & SCTE-35
    {
      key: 'compliance-group',
      icon: <CheckCircleOutlined />,
      label: 'Compliance & SCTE-35',
      children: [
        {
          key: 'scte35',
          icon: <PlayCircleOutlined />,
          label: 'SCTE-35 Management',
        },
        {
          key: 'validator',
          icon: <CheckCircleOutlined />,
          label: 'Stream Validator',
        },
      ],
    },
    
    // INFRASTRUCTURE
    {
      key: 'infrastructure-group',
      icon: <CloudServerOutlined />,
      label: 'Infrastructure',
      children: [
        {
          key: 'vhosts',
          icon: <CloudServerOutlined />,
          label: 'Virtual Hosts & Apps',
        },
        {
          key: 'cluster',
          icon: <CloudServerOutlined />,
          label: 'Clustering',
        },
      ],
    },
    
    // SECURITY & ACCESS
    {
      key: 'security-group',
      icon: <SettingOutlined />,
      label: 'Security & Access',
      children: [
        {
          key: 'access',
          icon: <SettingOutlined />,
          label: 'Access Control',
        },
        {
          key: 'tls',
          icon: <InfoCircleOutlined />,
          label: 'TLS Status',
        },
      ],
    },
    
    // MONITORING & ANALYTICS
    {
      key: 'monitoring-group',
      icon: <BarChartOutlined />,
      label: 'Monitoring & Analytics',
      children: [
        {
          key: 'statistics',
          icon: <BarChartOutlined />,
          label: 'Statistics',
        },
        {
          key: 'realtime-stats',
          icon: <DashboardOutlined />,
          label: 'Real-Time Stats',
        },
        {
          key: 'webrtc-monitor',
          icon: <ThunderboltOutlined />,
          label: 'WebRTC Monitor',
        },
      ],
    },
    
    // CONFIGURATION
    {
      key: 'config-group',
      icon: <CodeOutlined />,
      label: 'Configuration',
      children: [
        {
          key: 'config',
          icon: <CodeOutlined />,
          label: 'Config Generator',
        },
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: 'Connection Settings',
        },
      ],
    },
  ];

  const renderOverview = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Connection Status"
              value={connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
              valueStyle={{ 
                color: connectionStatus === 'connected' ? '#52c41a' : '#ff4d4f' 
              }}
              prefix={
                connectionStatus === 'connected' ? 
                <CheckCircleOutlined /> : 
                <InfoCircleOutlined />
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Virtual Hosts"
              value={vhosts.length}
              prefix={<CloudServerOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Events"
              value={events.length}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Current Stream"
              value={currentStream ? currentStream.name : 'None'}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Card title="Virtual Hosts" size="small">
            {vhosts.length > 0 ? (
              <div>
                {vhosts.map((vhost, index) => (
                  <div key={index} style={{ marginBottom: 8 }}>
                    <Space>
                      <CloudServerOutlined />
                      <Text strong>{vhost}</Text>
                    </Space>
                  </div>
                ))}
              </div>
            ) : (
              <Text type="secondary">No virtual hosts found</Text>
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Recent SCTE-35 Events" size="small">
            {events.length > 0 ? (
              <div>
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} style={{ marginBottom: 8 }}>
                    <Space>
                      <Text code>#{event.eventId}</Text>
                      <Text strong>{event.action}</Text>
                      <Text type="secondary">
                        {event.timestamp.toLocaleTimeString()}
                      </Text>
                    </Space>
                  </div>
                ))}
              </div>
            ) : (
              <Text type="secondary">No events recorded</Text>
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            title="SCTE-35 Control" 
            size="small"
            extra={
              <Switch
                checked={scte35Enabled}
                onChange={handleToggleSCTE35}
                checkedChildren={<PlayCircleOutlined />}
                unCheckedChildren={<PauseCircleOutlined />}
                size="small"
              />
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>SCTE-35 Injection: </Text>
                <Text type={scte35Enabled ? 'success' : 'secondary'}>
                  {scte35Enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {scte35Enabled 
                    ? 'Ad break signals will be injected into streams' 
                    : 'SCTE-35 injection is disabled for all streams'
                  }
                </Text>
              </div>
              {complianceChecks.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ fontSize: '12px' }}>Compliance:</Text>
                  {complianceChecks.slice(0, 2).map((check, index) => (
                    <div key={index} style={{ marginTop: 4 }}>
                      <Space>
                        <Text style={{ fontSize: '11px' }}>{check.spec}</Text>
                        {check.compliant ? (
                          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '10px' }} />
                        ) : (
                          <InfoCircleOutlined style={{ color: '#ff4d4f', fontSize: '10px' }} />
                        )}
                      </Space>
                    </div>
                  ))}
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Alert
            message="IBS Itassist Broadcast Solutions"
            description={
              <div>
                <p>
                  This dashboard ensures 100% compliance with distributor technical specifications.
                  Use the navigation menu to access different compliance tools:
                </p>
                <ul>
                  <li><strong>SCTE-35 Injection:</strong> Send compliant ad break signals</li>
                  <li><strong>Stream Validator:</strong> Verify technical specifications</li>
                  <li><strong>Event Log:</strong> Monitor and audit SCTE-35 events</li>
                  <li><strong>Config Generator:</strong> Generate compliant OME configurations</li>
                </ul>
              </div>
            }
            type="info"
            showIcon
          />
        </Col>
      </Row>
    </div>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      
      // STREAMING & CHANNELS
      case 'channels':
        return <ChannelManagement />;
      case 'streams':
        return <StreamMonitor />;
      case 'ingress':
        return <IngressHelpers />;
      
      // TRANSCODING & ABR
      case 'transcoder':
        return <ABRTranscoder />;
      case 'abr-manager':
        return <ABRManager />;
      case 'webhooks':
        return <TranscodeWebhook />;
      
      // PLAYERS & ENCODERS
      case 'player-manager':
        return <PlayerManager />;
      case 'encoder-manager':
        return <EncoderManager />;
      case 'demo-manager':
        return <DemoManager />;
      
      // OUTPUT MANAGEMENT
      case 'thumbnails':
        return <ThumbnailManager />;
      case 'hls':
        return <HLSManager />;
      case 'p2p':
        return <P2PManager />;
      
      // RECORDING & PUBLISHING
      case 'recording':
        return <RecordingManager />;
      case 'publishing':
        return <PushPublishingManager />;
      
      // COMPLIANCE & SCTE-35
      case 'scte35':
        return <SCTE35Manager />;
      case 'validator':
        return <StreamProfileValidator />;
      
      // INFRASTRUCTURE
      case 'vhosts':
        return <VHostManagement />;
      case 'cluster':
        return <ClusterManagement />;
      
      // SECURITY & ACCESS
      case 'access':
        return <AccessControl />;
      case 'tls':
        return <TLSStatus />;
      
      // MONITORING & ANALYTICS
      case 'statistics':
        return <StatisticsDashboard />;
      case 'realtime-stats':
        return <RealtimeStats />;
      case 'webrtc-monitor':
        return <WebRTCMonitor />;
      
      // CONFIGURATION
      case 'config':
        return <ConfigurationGenerator />;
      case 'settings':
        return <ConnectionSettings />;
      
      default:
        return renderOverview();
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <PlayCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0 }}>
              IBS Itassist Broadcast Solutions
            </Title>
          </Space>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadServerStats}
              loading={loading}
            >
              Refresh
            </Button>
            <Text type="secondary">
              {omeHost}:{omePort}
            </Text>
          </Space>
        </div>
      </Header>

      <Layout>
        <Sider width={250} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedTab]}
            items={menuItems}
            onClick={({ key }) => setSelectedTab(key as DashboardTab)}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>

        <Content style={{ padding: '24px', background: '#f5f5f5' }}>
          <ConnectionTest />
          <Spin spinning={loading}>
            {renderContent()}
          </Spin>
        </Content>
      </Layout>
      
      <Footer />
    </Layout>
  );
};
