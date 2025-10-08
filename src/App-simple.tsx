import React from 'react';
import { ConfigProvider, Layout, Typography, Card, Row, Col, Button, Space } from 'antd';
import { DashboardOutlined, PlayCircleOutlined, CheckCircleOutlined, SettingOutlined } from '@ant-design/icons';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <DashboardOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              OME Compliance Dashboard
            </Title>
          </div>
        </Header>
        
        <Content style={{ padding: '24px', background: '#f5f5f5' }}>
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Card>
                <Title level={2}>Welcome to OME Compliance Dashboard</Title>
                <Text>
                  A comprehensive dashboard for managing OvenMediaEngine servers with SCTE-35 compliance features.
                </Text>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Card 
                title="SCTE-35 Injection" 
                extra={<PlayCircleOutlined />}
                hoverable
              >
                <Text>Inject SCTE-35 signals for ad insertion and compliance.</Text>
                <br />
                <Button type="primary" style={{ marginTop: '12px' }}>
                  Open Injection Form
                </Button>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Card 
                title="Stream Validation" 
                extra={<CheckCircleOutlined />}
                hoverable
              >
                <Text>Validate stream profiles against distributor requirements.</Text>
                <br />
                <Button type="primary" style={{ marginTop: '12px' }}>
                  Validate Stream
                </Button>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Card 
                title="Configuration" 
                extra={<SettingOutlined />}
                hoverable
              >
                <Text>Generate OME output profiles and manage server settings.</Text>
                <br />
                <Button type="primary" style={{ marginTop: '12px' }}>
                  Configure
                </Button>
              </Card>
            </Col>
            
            <Col span={24}>
              <Card title="Quick Start">
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Title level={4}>Getting Started</Title>
                    <Text>
                      1. Configure your OME server connection in Settings<br />
                      2. Use the SCTE-35 Injection form for ad insertion<br />
                      3. Validate your streams for compliance<br />
                      4. Monitor real-time statistics and events
                    </Text>
                  </div>
                  
                  <div>
                    <Title level={4}>Features</Title>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <ul>
                          <li>SCTE-35 Compliance Injection</li>
                          <li>Stream Profile Validation</li>
                          <li>Event Logging & Timeline</li>
                          <li>Scheduled Events</li>
                        </ul>
                      </Col>
                      <Col span={12}>
                        <ul>
                          <li>Virtual Host Management</li>
                          <li>Recording Management</li>
                          <li>Push Publishing</li>
                          <li>Real-time Statistics</li>
                        </ul>
                      </Col>
                    </Row>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
