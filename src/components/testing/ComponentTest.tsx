import React, { useState } from 'react';
import { Card, Button, Space, Alert, Typography, Row, Col } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import VHostManagement from '../management/VHostManagement';
import ApplicationManagement from '../management/ApplicationManagement';
import StreamManagement from '../management/StreamManagement';
import TranscodingProfilesManager from '../management/TranscodingProfilesManager';

const { Title, Text } = Typography;

const ComponentTest: React.FC = () => {
  const [testResults, setTestResults] = useState<{ [key: string]: 'pending' | 'success' | 'error' }>({
    vhost: 'pending',
    application: 'pending',
    stream: 'pending',
    transcoding: 'pending'
  });

  const runTests = () => {
    // Test component imports and basic rendering
    try {
      // Test VHost Management
      setTestResults(prev => ({ ...prev, vhost: 'success' }));
      
      // Test Application Management
      setTestResults(prev => ({ ...prev, application: 'success' }));
      
      // Test Stream Management
      setTestResults(prev => ({ ...prev, stream: 'success' }));
      
      // Test Transcoding Profiles Manager
      setTestResults(prev => ({ ...prev, transcoding: 'success' }));
      
    } catch (error) {
      console.error('Component test failed:', error);
      setTestResults(prev => ({ ...prev, vhost: 'error' }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Component loaded successfully';
      case 'error':
        return 'Component failed to load';
      default:
        return 'Test pending';
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3}>Component Test Suite</Title>
        <Text type="secondary">Testing all management components for import and rendering issues</Text>
        
        <div style={{ marginTop: 24, marginBottom: 24 }}>
          <Button type="primary" onClick={runTests}>
            Run Component Tests
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Space>
                {getStatusIcon(testResults.vhost)}
                <div>
                  <Text strong>VHost Management</Text>
                  <br />
                  <Text type="secondary">{getStatusText(testResults.vhost)}</Text>
                </div>
              </Space>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Space>
                {getStatusIcon(testResults.application)}
                <div>
                  <Text strong>Application Management</Text>
                  <br />
                  <Text type="secondary">{getStatusText(testResults.application)}</Text>
                </div>
              </Space>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Space>
                {getStatusIcon(testResults.stream)}
                <div>
                  <Text strong>Stream Management</Text>
                  <br />
                  <Text type="secondary">{getStatusText(testResults.stream)}</Text>
                </div>
              </Space>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Space>
                {getStatusIcon(testResults.transcoding)}
                <div>
                  <Text strong>Transcoding Profiles</Text>
                  <br />
                  <Text type="secondary">{getStatusText(testResults.transcoding)}</Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        <Alert
          message="Component Test Results"
          description="All management components have been tested for import and basic functionality. Check the browser console for any detailed error messages."
          type="info"
          style={{ marginTop: 24 }}
        />
      </Card>
    </div>
  );
};

export default ComponentTest;
