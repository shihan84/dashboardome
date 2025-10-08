import React, { useState, useEffect, ErrorBoundary } from 'react';
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
} from '@ant-design/icons';
import { ComplianceInjectionForm } from './ComplianceInjectionForm';
import { StreamProfileValidator } from './StreamProfileValidator';
import { SCTE35EventLog } from './SCTE35EventLog';
import { ConfigurationGenerator } from './ConfigurationGenerator';
import { SCTE35Scheduler } from './SCTE35Scheduler';
import { ConnectionSettings } from './ConnectionSettings';
import { VHostManagement } from './VHostManagement';
import { RecordingManagement } from './RecordingManagement';
import { PushPublishingManagement } from './PushPublishingManagement';
import { StatisticsDashboard } from './StatisticsDashboard';
import { useStore } from '../store/useStore';
import { OMEApiService } from '../services/omeApi';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

type DashboardTab = 'overview' | 'compliance' | 'validator' | 'events' | 'scheduler' | 'config' | 'vhosts' | 'recording' | 'publishing' | 'statistics' | 'settings';

export const Dashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<DashboardTab>('overview');
  const [loading, setLoading] = useState(false);
  const [serverStats, setServerStats] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  const {
    events,
    currentStream,
    complianceChecks,
    omeHost,
    omePort,
    omeUsername,
    omePassword,
    currentVHost,
    currentApp,
    setOMEConnection,
    setCurrentStream,
  } = useStore();

  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  useEffect(() => {
    checkConnection();
    loadServerStats();
  }, [omeHost, omePort]);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const isConnected = await omeApi.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  const loadServerStats = async () => {
    setLoading(true);
    try {
      const stats = await omeApi.getServerStats();
      setServerStats(stats);
    } catch (error) {
      console.error('Failed to load server stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      key: 'overview',
      icon: <DashboardOutlined />,
      label: 'Overview',
    },
    {
      key: 'compliance',
      icon: <PlayCircleOutlined />,
      label: 'SCTE-35 Injection',
    },
    {
      key: 'validator',
      icon: <CheckCircleOutlined />,
      label: 'Stream Validator',
    },
    {
      key: 'events',
      icon: <ClockCircleOutlined />,
      label: 'Event Log',
    },
    {
      key: 'scheduler',
      icon: <ClockCircleOutlined />,
      label: 'Scheduler',
    },
    {
      key: 'config',
      icon: <CodeOutlined />,
      label: 'Config Generator',
    },
    {
      key: 'vhosts',
      icon: <CloudServerOutlined />,
      label: 'Virtual Hosts',
    },
    {
      key: 'recording',
      icon: <VideoCameraOutlined />,
      label: 'Recording',
    },
    {
      key: 'publishing',
      icon: <SendOutlined />,
      label: 'Push Publishing',
    },
    {
      key: 'statistics',
      icon: <BarChartOutlined />,
      label: 'Statistics',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Connection Settings',
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
              title="Total Events"
              value={events.length}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Compliant Specs"
              value={complianceChecks.filter(c => c.compliant).length}
              suffix={`/ ${complianceChecks.length}`}
              prefix={<CheckCircleOutlined />}
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
        <Col span={12}>
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
        <Col span={12}>
          <Card title="Compliance Status" size="small">
            {complianceChecks.length > 0 ? (
              <div>
                {complianceChecks.map((check, index) => (
                  <div key={index} style={{ marginBottom: 8 }}>
                    <Space>
                      <Text>{check.spec}</Text>
                      {check.compliant ? (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      ) : (
                        <InfoCircleOutlined style={{ color: '#ff4d4f' }} />
                      )}
                    </Space>
                  </div>
                ))}
              </div>
            ) : (
              <Text type="secondary">No compliance data available</Text>
            )}
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Alert
            message="Distributor Compliance Dashboard"
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
      case 'compliance':
        return <ComplianceInjectionForm />;
      case 'validator':
        return <StreamProfileValidator />;
      case 'events':
        return <SCTE35EventLog />;
      case 'scheduler':
        return <SCTE35Scheduler />;
      case 'config':
        return <ConfigurationGenerator />;
      case 'vhosts':
        return <VHostManagement />;
      case 'recording':
        return <RecordingManagement />;
      case 'publishing':
        return <PushPublishingManagement />;
      case 'statistics':
        return <StatisticsDashboard />;
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
              OME Compliance Dashboard
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
          <Spin spinning={loading}>
            {renderContent()}
          </Spin>
        </Content>
      </Layout>
    </Layout>
  );
};
