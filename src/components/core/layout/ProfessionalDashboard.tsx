import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Badge,
  Avatar,
  Dropdown,
  Button,
  Space,
  Typography,
  Divider,
  Tooltip,
  Switch,
  notification
} from 'antd';
import {
  DashboardOutlined,
  VideoCameraOutlined,
  CloudServerOutlined,
  SettingOutlined,
  BarChartOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  WifiOutlined,
  DatabaseOutlined,
  SecurityScanOutlined,
  ToolOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RocketOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  ApiOutlined,
  MonitorOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  FileImageOutlined,
  SoundOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
// import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';
import DashboardOverview from './DashboardOverview';
import WebRTCStreamManager from '../../streaming/WebRTCStreamManager';
import SRTStreamManager from '../../streaming/SRTStreamManager';
import DVRRecordingManager from '../../streaming/DVRRecordingManager';
import PushPublishingManager from '../../streaming/PushPublishingManager';
import ScheduledChannelsManager from '../../streaming/ScheduledChannelsManager';
import MultiplexChannelsManager from '../../streaming/MultiplexChannelsManager';
import RealTimeAnalytics from '../../monitoring/RealTimeAnalytics';
import SystemHealthMonitor from '../../monitoring/SystemHealthMonitor';
import EnhancedSCTE35Manager from '../../compliance/scte35/EnhancedSCTE35Manager';
import VHostManagement from '../../management/VHostManagement';
import ApplicationManagement from '../../management/ApplicationManagement';
import WebhookManager from '../../security/WebhookManager';
import StreamManagement from '../../management/StreamManagement';
import TranscodingProfilesManager from '../../management/TranscodingProfilesManager';
import SSLCertificateManager from '../../security/SSLCertificateManager';
import ComponentTest from '../../testing/ComponentTest';
import ComingSoon from './ComingSoon';

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text } = Typography;

interface SystemStats {
  activeStreams: number;
  totalConnections: number;
  cpuUsage: number;
  memoryUsage: number;
  bandwidthUsage: number;
  uptime: string;
}

interface StreamInfo {
  name: string;
  status: 'active' | 'inactive' | 'error';
  viewers: number;
  bitrate: number;
  resolution: string;
  protocol: string;
}

const ProfessionalDashboard: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [systemStats, setSystemStats] = useState<SystemStats>({
    activeStreams: 0,
    totalConnections: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    bandwidthUsage: 0,
    uptime: '0d 0h 0m'
  });
  const [activeStreams, setActiveStreams] = useState<StreamInfo[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const { omeHost, omePort } = useStore();

  // Menu items with enhanced OME features
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard Overview',
      children: [
        { key: '/dashboard/overview', label: 'System Overview' },
        { key: '/dashboard/analytics', label: 'Analytics & Reports' },
        { key: '/dashboard/health', label: 'System Health' }
      ]
    },
    {
      key: '/streaming',
      icon: <VideoCameraOutlined />,
      label: 'Streaming Management',
      children: [
        { key: '/streaming/live', label: 'Live Streams' },
        { key: '/streaming/webrtc', label: 'WebRTC Streams' },
        { key: '/streaming/srt', label: 'SRT Streams' },
        { key: '/streaming/rtmp', label: 'RTMP Streams' },
        { key: '/streaming/llhls', label: 'LLHLS Streams' },
        { key: '/streaming/recording', label: 'Recording & DVR' },
        { key: '/streaming/push', label: 'Push Publishing' },
        { key: '/streaming/scheduled', label: 'Scheduled Channels' },
        { key: '/streaming/multiplex', label: 'Multiplex Channels' }
      ]
    },
    {
      key: '/applications',
      icon: <CloudServerOutlined />,
      label: 'Application Management',
      children: [
        { key: '/applications/list', label: 'Applications' },
        { key: '/applications/quickstart', label: 'Quick Start Wizard' },
        { key: '/applications/templates', label: 'Templates' },
        { key: '/applications/transcoding', label: 'Transcoding Profiles' }
      ]
    },
    {
      key: '/content',
      icon: <FileTextOutlined />,
      label: 'Content Management',
      children: [
        { key: '/content/scheduler', label: 'Channel Scheduler' },
        { key: '/content/media', label: 'Media Library' },
        { key: '/content/playlists', label: 'Playlists' },
        { key: '/content/vod', label: 'Video on Demand' }
      ]
    },
    {
      key: '/monitoring',
      icon: <MonitorOutlined />,
      label: 'Monitoring & Analytics',
      children: [
        { key: '/monitoring/metrics', label: 'Real-time Metrics' },
        { key: '/monitoring/performance', label: 'Performance Charts' },
        { key: '/monitoring/logs', label: 'System Logs' },
        { key: '/monitoring/alerts', label: 'Alerts & Notifications' }
      ]
    },
    {
      key: '/compliance',
      icon: <SecurityScanOutlined />,
      label: 'Compliance & Security',
      children: [
        { key: '/compliance/scte35', label: 'SCTE-35 Management' },
        { key: '/compliance/authentication', label: 'Authentication' },
        { key: '/compliance/encryption', label: 'Encryption' },
        { key: '/compliance/access', label: 'Access Control' },
        { key: '/compliance/webhooks', label: 'Webhook Management' }
      ]
    },
    {
      key: '/network',
      icon: <GlobalOutlined />,
      label: 'Network & Protocols',
      children: [
        { key: '/network/endpoints', label: 'Endpoints' },
        { key: '/network/loadbalancing', label: 'Load Balancing' },
        { key: '/network/cdn', label: 'CDN Integration' },
        { key: '/network/firewall', label: 'Firewall Rules' }
      ]
    },
    {
      key: '/tools',
      icon: <ToolOutlined />,
      label: 'Tools & Utilities',
      children: [
        { key: '/tools/testing', label: 'Stream Testing' },
        { key: '/tools/diagnostics', label: 'Diagnostics' },
        { key: '/tools/backup', label: 'Backup & Restore' },
        { key: '/tools/maintenance', label: 'System Maintenance' }
      ]
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Configuration',
      children: [
        { key: '/settings/server', label: 'Server Settings' },
        { key: '/settings/api', label: 'API Configuration' },
        { key: '/settings/security', label: 'Security Settings' },
        { key: '/settings/advanced', label: 'Advanced Options' }
      ]
    }
  ];

  // Fetch system statistics from real OME API
  const fetchSystemStats = async () => {
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      
      // Get server statistics
      const serverStats = await omeApi.getServerStats();
      
      // Get all streams across all vhosts and applications
      const vhostsResponse = await omeApi.getVHosts();
      let totalStreams = 0;
      let totalConnections = 0;
      
      if (vhostsResponse.success) {
        for (const vhost of vhostsResponse.data) {
          const vhostName = typeof vhost === 'string' ? vhost : vhost.name;
          const appsResponse = await omeApi.getApplications(vhostName);
          if (appsResponse.success) {
            for (const app of appsResponse.data) {
              const appName = typeof app === 'string' ? app : app.name;
              const streamsResponse = await omeApi.getStreams(vhostName, appName);
              if (streamsResponse.success) {
                totalStreams += streamsResponse.data.length;
                for (const stream of streamsResponse.data) {
                  const streamName = typeof stream === 'string' ? stream : stream.name;
                  const streamDetails = await omeApi.getStreamDetailed(vhostName, appName, streamName);
                  totalConnections += streamDetails.connections?.total || 0;
                }
              }
            }
          }
        }
      }
      
      // Parse real server stats
      const cpuUsage = serverStats?.system?.cpu?.usage || 0;
      const memoryUsage = serverStats?.system?.memory?.usage || 0;
      const bandwidthUsage = serverStats?.system?.network?.bandwidth || 0;
      const uptime = serverStats?.system?.uptime || '0d 0h 0m';
      
      setSystemStats({
        activeStreams: totalStreams,
        totalConnections: totalConnections,
        cpuUsage: Math.round(cpuUsage * 100) / 100,
        memoryUsage: Math.round(memoryUsage * 100) / 100,
        bandwidthUsage: Math.round(bandwidthUsage / 1024 / 1024 * 100) / 100,
        uptime: uptime
      });
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
  };

  // Fetch active streams from real OME API
  const fetchActiveStreams = async () => {
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const allStreams: StreamInfo[] = [];
      
      // Get all streams across all vhosts and applications
      const vhostsResponse = await omeApi.getVHosts();
      if (vhostsResponse.success) {
        for (const vhost of vhostsResponse.data) {
          const vhostName = typeof vhost === 'string' ? vhost : vhost.name;
          const appsResponse = await omeApi.getApplications(vhostName);
          if (appsResponse.success) {
            for (const app of appsResponse.data) {
              const appName = typeof app === 'string' ? app : app.name;
              const streamsResponse = await omeApi.getStreams(vhostName, appName);
              if (streamsResponse.success) {
                for (const stream of streamsResponse.data) {
                  const streamName = typeof stream === 'string' ? stream : stream.name;
                  const streamDetails = await omeApi.getStreamDetailed(vhostName, appName, streamName);
                  const streamInfo: StreamInfo = {
                    name: streamName,
                    status: streamDetails.state === 'started' ? 'active' : 'inactive',
                    viewers: streamDetails.connections?.total || 0,
                    bitrate: streamDetails.bitrate || 0,
                    resolution: streamDetails.video?.resolution || 'Unknown',
                    protocol: streamDetails.sourceType || 'Unknown'
                  };
                  allStreams.push(streamInfo);
                }
              }
            }
          }
        }
      }
      
      setActiveStreams(allStreams);
    } catch (error) {
      console.error('Failed to fetch active streams:', error);
    }
  };

  useEffect(() => {
    fetchSystemStats();
    fetchActiveStreams();
    
    const interval = setInterval(() => {
      fetchSystemStats();
      fetchActiveStreams();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      // Implemented features
      case 'webrtc':
        return <WebRTCStreamManager />;
      case 'srt':
        return <SRTStreamManager />;
      case 'recording':
        return <DVRRecordingManager />;
      case 'push':
        return <PushPublishingManager />;
      case 'scheduled':
        return <ScheduledChannelsManager />;
      case 'multiplex':
        return <MultiplexChannelsManager />;
      case 'analytics':
        return <RealTimeAnalytics />;
      case 'health':
        return <SystemHealthMonitor />;
      case 'scte35':
        return <EnhancedSCTE35Manager />;
      case 'webhooks':
        return <WebhookManager />;
      
      // Coming soon features
              case 'live':
                return <StreamManagement />;
      case 'rtmp':
        return <ComingSoon feature="RTMP Streams" description="RTMP streaming management with advanced configuration options." estimatedDate="Q1 2025" />;
      case 'llhls':
        return <ComingSoon feature="LLHLS Streams" description="Low-latency HLS streaming with sub-second latency capabilities." estimatedDate="Q1 2025" />;
              case 'applications':
                return <ApplicationManagement />;
      case 'quickstart':
        return <ComingSoon feature="Quick Start Wizard" description="Guided setup wizard for creating applications and streams." estimatedDate="Q1 2025" />;
      case 'templates':
        return <ComingSoon feature="Application Templates" description="Pre-configured templates for common streaming scenarios." estimatedDate="Q1 2025" />;
              case 'transcoding':
                return <TranscodingProfilesManager />;
      case 'scheduler':
        return <ComingSoon feature="Channel Scheduler" description="Advanced channel scheduling with SCTE-35 integration." estimatedDate="Q1 2025" />;
      case 'media':
        return <ComingSoon feature="Media Library" description="Media file management and organization system." estimatedDate="Q2 2025" />;
      case 'playlists':
        return <ComingSoon feature="Playlist Management" description="Dynamic playlist creation and management." estimatedDate="Q2 2025" />;
      case 'vod':
        return <ComingSoon feature="Video on Demand" description="VOD content management and delivery system." estimatedDate="Q2 2025" />;
      case 'performance':
        return <ComingSoon feature="Performance Charts" description="Advanced performance monitoring with detailed charts." estimatedDate="Q1 2025" />;
      case 'logs':
        return <ComingSoon feature="System Logs" description="Comprehensive system logging and log analysis." estimatedDate="Q1 2025" />;
      case 'alerts':
        return <ComingSoon feature="Alerts & Notifications" description="Advanced alerting system with custom notifications." estimatedDate="Q1 2025" />;
      case 'authentication':
        return <ComingSoon feature="Authentication" description="Advanced authentication and user management system." estimatedDate="Q2 2025" />;
      case 'encryption':
        return <ComingSoon feature="Encryption" description="End-to-end encryption and security features." estimatedDate="Q2 2025" />;
      case 'access':
        return <ComingSoon feature="Access Control" description="Granular access control and permission management." estimatedDate="Q2 2025" />;
      case 'endpoints':
        return <ComingSoon feature="Network Endpoints" description="Network endpoint configuration and management." estimatedDate="Q2 2025" />;
      case 'loadbalancing':
        return <ComingSoon feature="Load Balancing" description="Advanced load balancing and failover management." estimatedDate="Q2 2025" />;
      case 'cdn':
        return <ComingSoon feature="CDN Integration" description="CDN integration and edge server management." estimatedDate="Q2 2025" />;
      case 'firewall':
        return <ComingSoon feature="Firewall Rules" description="Network security and firewall rule management." estimatedDate="Q2 2025" />;
              case 'testing':
                return <ComponentTest />;
      case 'diagnostics':
        return <ComingSoon feature="Diagnostics" description="Advanced diagnostic tools and troubleshooting." estimatedDate="Q1 2025" />;
      case 'backup':
        return <ComingSoon feature="Backup & Restore" description="System backup and restore capabilities." estimatedDate="Q2 2025" />;
      case 'maintenance':
        return <ComingSoon feature="System Maintenance" description="Automated maintenance and system optimization." estimatedDate="Q2 2025" />;
              case 'server':
                return <VHostManagement />;
      case 'api':
        return <ComingSoon feature="API Configuration" description="API configuration and management interface." estimatedDate="Q2 2025" />;
              case 'security':
                return <SSLCertificateManager />;
      case 'advanced':
        return <ComingSoon feature="Advanced Options" description="Advanced configuration options and expert settings." estimatedDate="Q2 2025" />;
      
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: '#001529',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #002140'
        }}>
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            {collapsed ? 'OME' : 'OME Dashboard'}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentPage]}
          defaultOpenKeys={['/dashboard', '/streaming']}
          items={menuItems}
          onClick={({ key }) => {
            // Simple navigation without react-router-dom
            const pageMap: { [key: string]: string } = {
              '/dashboard': 'dashboard',
              '/dashboard/overview': 'dashboard',
              '/dashboard/analytics': 'analytics',
              '/dashboard/health': 'health',
              '/streaming/live': 'live',
              '/streaming/webrtc': 'webrtc',
              '/streaming/srt': 'srt',
              '/streaming/rtmp': 'rtmp',
              '/streaming/llhls': 'llhls',
              '/streaming/recording': 'recording',
              '/applications/list': 'applications',
              '/applications/quickstart': 'quickstart',
              '/applications/templates': 'templates',
              '/applications/transcoding': 'transcoding',
              '/content/scheduler': 'scheduler',
              '/content/media': 'media',
              '/content/playlists': 'playlists',
              '/content/vod': 'vod',
              '/monitoring/metrics': 'analytics',
              '/monitoring/performance': 'performance',
              '/monitoring/logs': 'logs',
              '/monitoring/alerts': 'alerts',
              '/compliance/scte35': 'scte35',
              '/compliance/authentication': 'authentication',
              '/compliance/encryption': 'encryption',
              '/compliance/access': 'access',
              '/network/endpoints': 'endpoints',
              '/network/loadbalancing': 'loadbalancing',
              '/network/cdn': 'cdn',
              '/network/firewall': 'firewall',
              '/tools/testing': 'testing',
              '/tools/diagnostics': 'diagnostics',
              '/tools/backup': 'backup',
              '/tools/maintenance': 'maintenance',
              '/settings/server': 'server',
              '/settings/api': 'api',
              '/settings/security': 'security',
              '/settings/advanced': 'advanced'
            };
            const page = pageMap[key] || 'dashboard';
            setCurrentPage(page);
          }}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Divider type="vertical" />
            <Space>
              <Badge status="processing" text="Server Online" />
              <Text type="secondary">{omeHost}:{omePort}</Text>
            </Space>
          </Space>
          
          <Space size="large">
            <Tooltip title="Notifications">
              <Badge count={alerts.length} size="small">
                <BellOutlined style={{ fontSize: 18 }} />
              </Badge>
            </Tooltip>
            
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <Text>Admin</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ 
          margin: currentPage === 'dashboard' ? 0 : '24px 16px', 
          padding: currentPage === 'dashboard' ? 0 : 24, 
          background: currentPage === 'dashboard' ? 'transparent' : '#f0f2f5',
          minHeight: currentPage === 'dashboard' ? 'auto' : 280 
        }}>
          {currentPage !== 'dashboard' && (
            <>
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

              {/* Active Streams Panel */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={16}>
                  <Card title="Active Streams" extra={<Button icon={<ReloadOutlined />} size="small" />}>
                    <Row gutter={[16, 16]}>
                      {activeStreams.map((stream, index) => (
                        <Col xs={24} sm={12} md={8} key={index}>
                          <Card size="small" style={{ textAlign: 'center' }}>
                            <Space direction="vertical" size="small">
                              <Badge status={getStatusColor(stream.status)} text={stream.name} />
                              <Text type="secondary">{stream.protocol}</Text>
                              <Statistic
                                title="Viewers"
                                value={stream.viewers}
                                prefix={<EyeOutlined />}
                                valueStyle={{ fontSize: 16 }}
                              />
                              {stream.status === 'active' && (
                                <Space>
                                  <Text type="secondary">{stream.resolution}</Text>
                                  <Text type="secondary">{stream.bitrate}kbps</Text>
                                </Space>
                              )}
                            </Space>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Col>
                
                <Col xs={24} lg={8}>
                  <Card title="System Health" size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Uptime</Text>
                        <br />
                        <Text type="secondary">{systemStats.uptime}</Text>
                      </div>
                      <div>
                        <Text strong>Bandwidth</Text>
                        <br />
                        <Text type="secondary">{systemStats.bandwidthUsage} Mbps</Text>
                      </div>
                      <div>
                        <Text strong>Status</Text>
                        <br />
                        <Badge status="success" text="All Systems Operational" />
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {/* Main Content */}
          {renderCurrentPage()}
        </Content>

        <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
          OvenMediaEngine Dashboard ©2025 - Professional Streaming Management
        </Footer>
      </Layout>
    </Layout>
  );
};

export default ProfessionalDashboard;
