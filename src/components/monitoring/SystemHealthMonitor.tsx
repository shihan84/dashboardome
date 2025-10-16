import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Timeline,
  List,
  Avatar,
  Badge,
  Tooltip,
  Divider,
  Switch,
  Select,
  message
} from 'antd';
import {
  ThunderboltOutlined,
  DatabaseOutlined,
  WifiOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  MonitorOutlined,
  CloudServerOutlined,
  GlobalOutlined,
  TeamOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { OMEApiService } from '../../services/omeApi';
import { useStore } from '../../store/useStore';

const { Title, Text } = Typography;
const { Option } = Select;

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
    temperature?: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cached: number;
    swap: {
      total: number;
      used: number;
    };
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    interfaces: Array<{
      name: string;
      bytesIn: number;
      bytesOut: number;
      packetsIn: number;
      packetsOut: number;
      errors: number;
    }>;
    bandwidth: {
      in: number;
      out: number;
    };
  };
  processes: {
    total: number;
    running: number;
    sleeping: number;
    zombie: number;
  };
}

interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error' | 'warning';
  uptime: string;
  memory: number;
  cpu: number;
  port: number;
  pid: number;
  lastRestart?: string;
  health: 'healthy' | 'degraded' | 'unhealthy';
}

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  component: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  severity: number;
}

const SystemHealthMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  useEffect(() => {
    loadSystemMetrics();
    loadServiceStatus();
    loadSystemAlerts();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadSystemMetrics();
        loadServiceStatus();
        loadSystemAlerts();
      }, refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const loadSystemMetrics = async () => {
    try {
      // Mock data - replace with actual system monitoring
      const mockMetrics: SystemMetrics = {
        cpu: {
          usage: Math.floor(Math.random() * 40) + 20,
          cores: 8,
          loadAverage: [1.2, 1.5, 1.8],
          temperature: 45
        },
        memory: {
          total: 16384,
          used: 8192,
          free: 8192,
          cached: 2048,
          swap: {
            total: 4096,
            used: 512
          }
        },
        disk: {
          total: 500,
          used: 200,
          free: 300,
          usage: 40
        },
        network: {
          interfaces: [
            {
              name: 'eth0',
              bytesIn: 1024000,
              bytesOut: 512000,
              packetsIn: 15000,
              packetsOut: 12000,
              errors: 0
            },
            {
              name: 'lo',
              bytesIn: 256000,
              bytesOut: 256000,
              packetsIn: 5000,
              packetsOut: 5000,
              errors: 0
            }
          ],
          bandwidth: {
            in: 50,
            out: 25
          }
        },
        processes: {
          total: 245,
          running: 3,
          sleeping: 240,
          zombie: 2
        }
      };
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load system metrics:', error);
    }
  };

  const loadServiceStatus = async () => {
    try {
      const mockServices: ServiceStatus[] = [
        {
          name: 'OvenMediaEngine',
          status: 'running',
          uptime: '5d 12h 30m',
          memory: 512,
          cpu: 15,
          port: 1935,
          pid: 1234,
          health: 'healthy'
        },
        {
          name: 'Nginx',
          status: 'running',
          uptime: '5d 12h 25m',
          memory: 64,
          cpu: 2,
          port: 80,
          pid: 5678,
          health: 'healthy'
        },
        {
          name: 'Dashboard',
          status: 'running',
          uptime: '2h 15m',
          memory: 128,
          cpu: 5,
          port: 5173,
          pid: 9012,
          health: 'healthy'
        },
        {
          name: 'Database',
          status: 'warning',
          uptime: '5d 12h 20m',
          memory: 256,
          cpu: 8,
          port: 5432,
          pid: 3456,
          health: 'degraded',
          lastRestart: '2 hours ago'
        }
      ];
      setServices(mockServices);
    } catch (error) {
      console.error('Failed to load service status:', error);
    }
  };

  const loadSystemAlerts = async () => {
    try {
      const mockAlerts: SystemAlert[] = [
        {
          id: '1',
          type: 'warning',
          component: 'Database',
          message: 'High memory usage detected',
          timestamp: '10 minutes ago',
          resolved: false,
          severity: 3
        },
        {
          id: '2',
          type: 'info',
          component: 'Network',
          message: 'New connection established',
          timestamp: '5 minutes ago',
          resolved: true,
          severity: 1
        },
        {
          id: '3',
          type: 'critical',
          component: 'Disk',
          message: 'Disk space running low (85% used)',
          timestamp: '1 hour ago',
          resolved: false,
          severity: 5
        }
      ];
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Failed to load system alerts:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'success';
      case 'stopped': return 'error';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'default';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'unhealthy': return 'error';
      default: return 'default';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'critical': return '#ff4d4f';
      case 'warning': return '#faad14';
      case 'info': return '#1890ff';
      default: return '#d9d9d9';
    }
  };

  const serviceColumns = [
    {
      title: 'Service',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ServiceStatus) => (
        <Space>
          <CloudServerOutlined />
          <strong>{text}</strong>
          <Badge status={getHealthColor(record.health)} text={record.health} />
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
      title: 'Resources',
      key: 'resources',
      render: (record: ServiceStatus) => (
        <Space direction="vertical" size="small">
          <Text>CPU: {record.cpu}%</Text>
          <Text>Memory: {record.memory}MB</Text>
        </Space>
      )
    },
    {
      title: 'Port/PID',
      key: 'port',
      render: (record: ServiceStatus) => (
        <Space direction="vertical" size="small">
          <Text>Port: {record.port}</Text>
          <Text>PID: {record.pid}</Text>
        </Space>
      )
    },
    {
      title: 'Last Restart',
      dataIndex: 'lastRestart',
      key: 'lastRestart',
      render: (restart: string) => restart ? (
        <Text type="warning">{restart}</Text>
      ) : (
        <Text type="success">No recent restarts</Text>
      )
    }
  ];

  const criticalAlerts = alerts.filter(alert => alert.type === 'critical' && !alert.resolved).length;
  const warningAlerts = alerts.filter(alert => alert.type === 'warning' && !alert.resolved).length;
  const healthyServices = services.filter(service => service.health === 'healthy').length;

  return (
    <div>
      {/* System Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="System Health"
              value={healthyServices}
              suffix={`/ ${services.length}`}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Critical Alerts"
              value={criticalAlerts}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: criticalAlerts > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Warning Alerts"
              value={warningAlerts}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: warningAlerts > 0 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Uptime"
              value="5d 12h"
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Controls */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>Auto Refresh:</Text>
              <Switch 
                checked={autoRefresh} 
                onChange={setAutoRefresh}
                checkedChildren="On"
                unCheckedChildren="Off"
              />
              <Text strong>Interval:</Text>
              <Select 
                value={refreshInterval} 
                onChange={setRefreshInterval}
                style={{ width: 80 }}
              >
                <Option value={5}>5s</Option>
                <Option value={10}>10s</Option>
                <Option value={30}>30s</Option>
                <Option value={60}>1m</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                loadSystemMetrics();
                loadServiceStatus();
                loadSystemAlerts();
              }}
            >
              Refresh Now
            </Button>
          </Col>
        </Row>
      </Card>

      {/* System Resources */}
      {metrics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={8}>
            <Card title="CPU Usage">
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Progress
                  type="circle"
                  percent={metrics.cpu.usage}
                  format={(percent) => `${percent}%`}
                  strokeColor={metrics.cpu.usage > 80 ? '#ff4d4f' : metrics.cpu.usage > 60 ? '#faad14' : '#52c41a'}
                />
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="Cores" value={metrics.cpu.cores} />
                </Col>
                <Col span={12}>
                  <Statistic title="Load Avg" value={metrics.cpu.loadAverage[0]} precision={2} />
                </Col>
              </Row>
              {metrics.cpu.temperature && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Text type="secondary">Temperature: {metrics.cpu.temperature}°C</Text>
                </div>
              )}
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            <Card title="Memory Usage">
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Progress
                  type="circle"
                  percent={Math.round((metrics.memory.used / metrics.memory.total) * 100)}
                  format={(percent) => `${percent}%`}
                  strokeColor={metrics.memory.used / metrics.memory.total > 0.8 ? '#ff4d4f' : '#52c41a'}
                />
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="Used" value={Math.round(metrics.memory.used / 1024)} suffix="GB" />
                </Col>
                <Col span={12}>
                  <Statistic title="Free" value={Math.round(metrics.memory.free / 1024)} suffix="GB" />
                </Col>
              </Row>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Text type="secondary">Total: {Math.round(metrics.memory.total / 1024)}GB</Text>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            <Card title="Disk Usage">
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Progress
                  type="circle"
                  percent={metrics.disk.usage}
                  format={(percent) => `${percent}%`}
                  strokeColor={metrics.disk.usage > 80 ? '#ff4d4f' : metrics.disk.usage > 60 ? '#faad14' : '#52c41a'}
                />
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="Used" value={metrics.disk.used} suffix="GB" />
                </Col>
                <Col span={12}>
                  <Statistic title="Free" value={metrics.disk.free} suffix="GB" />
                </Col>
              </Row>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Text type="secondary">Total: {metrics.disk.total}GB</Text>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Network and Services */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Network Interfaces">
            {metrics?.network.interfaces.map((iface, index) => (
              <div key={index} style={{ marginBottom: 16 }}>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Space>
                      <WifiOutlined />
                      <Text strong>{iface.name}</Text>
                    </Space>
                  </Col>
                  <Col>
                    <Space>
                      <Text type="secondary">In: {(iface.bytesIn / 1024 / 1024).toFixed(1)}MB</Text>
                      <Text type="secondary">Out: {(iface.bytesOut / 1024 / 1024).toFixed(1)}MB</Text>
                    </Space>
                  </Col>
                </Row>
                {iface.errors > 0 && (
                  <Alert
                    message={`${iface.errors} network errors detected`}
                    type="warning"
                    size="small"
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>
            ))}
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="System Processes">
            {metrics && (
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="Total" value={metrics.processes.total} />
                </Col>
                <Col span={8}>
                  <Statistic title="Running" value={metrics.processes.running} />
                </Col>
                <Col span={8}>
                  <Statistic title="Sleeping" value={metrics.processes.sleeping} />
                </Col>
              </Row>
            )}
            {metrics?.processes.zombie > 0 && (
              <Alert
                message={`${metrics.processes.zombie} zombie processes detected`}
                type="warning"
                size="small"
                style={{ marginTop: 16 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Services and Alerts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Service Status" extra={
            <Badge count={services.filter(s => s.health !== 'healthy').length} size="small">
              <MonitorOutlined />
            </Badge>
          }>
            <Table
              columns={serviceColumns}
              dataSource={services}
              rowKey="name"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="System Alerts" extra={
            <Badge count={alerts.filter(a => !a.resolved).length} size="small">
              <WarningOutlined />
            </Badge>
          }>
            <List
              dataSource={alerts.filter(alert => !alert.resolved)}
              renderItem={(alert) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ backgroundColor: getAlertTypeColor(alert.type) }}
                        icon={<WarningOutlined />}
                      />
                    }
                    title={
                      <Space>
                        <Text strong>{alert.component}</Text>
                        <Tag color={alert.type === 'critical' ? 'red' : alert.type === 'warning' ? 'orange' : 'blue'}>
                          {alert.type}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Text>{alert.message}</Text>
                        <Text type="secondary">{alert.timestamp}</Text>
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

export default SystemHealthMonitor;
