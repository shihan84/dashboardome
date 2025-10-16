import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Typography, Space } from 'antd';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;

export const ConnectionTest: React.FC = () => {
  const { omeHost, omePort, omeUsername, omePassword, isConnected } = useStore();
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setTestResult('');
    
    try {
      const api = new OMEApiService(omeHost, omePort, omeUsername, omePassword);
      const response = await api.getVHosts();
      
      if (response.success) {
        setTestResult(`✅ Connection successful! Found ${response.data.length} virtual hosts: ${response.data.join(', ')}`);
      } else {
        setTestResult(`❌ API returned error: ${response.message}`);
      }
    } catch (error) {
      setTestResult(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Card title="Connection Test" style={{ margin: '16px 0' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>Current Configuration:</Text>
          <br />
          <Text>Host: {omeHost}:{omePort}</Text>
          <br />
          <Text>Username: {omeUsername}</Text>
          <br />
          <Text>Connected: {isConnected ? '✅ Yes' : '❌ No'}</Text>
        </div>
        
        <Button 
          type="primary" 
          onClick={testConnection} 
          loading={loading}
        >
          Test Connection
        </Button>
        
        {testResult && (
          <Alert 
            message={testResult} 
            type={testResult.includes('✅') ? 'success' : 'error'}
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};
