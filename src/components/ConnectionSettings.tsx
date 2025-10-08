import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Typography,
  Alert,
  Divider,
} from 'antd';
import {
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import { OMEApiService } from '../services/omeApi';

const { Title, Text } = Typography;

export const ConnectionSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  
  const {
    omeHost,
    omePort,
    omeUsername,
    omePassword,
    setOMEConnection,
  } = useStore();

  const handleSave = (values: any) => {
    setOMEConnection(
      values.host,
      values.port,
      values.username || '',
      values.password || ''
    );
    setTestResult(null);
  };

  const handleTest = async () => {
    const values = form.getFieldsValue();
    setTesting(true);
    setTestResult(null);
    
    try {
      const api = new OMEApiService(
        values.host,
        values.port,
        values.username || '',
        values.password || ''
      );
      
      const isConnected = await api.testConnection();
      setTestResult(isConnected ? 'success' : 'error');
    } catch (error) {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card
      title={
        <Space>
          <SettingOutlined />
          <span>OME Server Connection</span>
        </Space>
      }
    >
      <Alert
        message="Server Configuration"
        description="Configure connection to your OvenMediaEngine server. The dashboard will use these settings to communicate with the OME API."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          host: omeHost,
          port: omePort,
          username: omeUsername,
          password: omePassword,
        }}
      >
        <Form.Item
          name="host"
          label="Server Host"
          rules={[{ required: true, message: 'Please enter server host' }]}
        >
          <Input placeholder="localhost" />
        </Form.Item>

        <Form.Item
          name="port"
          label="API Port"
          rules={[{ required: true, message: 'Please enter API port' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="8081"
            min={1}
            max={65535}
          />
        </Form.Item>

        <Divider>Authentication (Optional)</Divider>

        <Form.Item
          name="username"
          label="Username"
        >
          <Input placeholder="Leave empty for no authentication" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
        >
          <Input.Password placeholder="Leave empty for no authentication" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<CheckCircleOutlined />}
            >
              Save Settings
            </Button>
            <Button
              onClick={handleTest}
              loading={testing}
              icon={<ExclamationCircleOutlined />}
            >
              Test Connection
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {testResult === 'success' && (
        <Alert
          message="Connection Successful"
          description="Successfully connected to OME server."
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {testResult === 'error' && (
        <Alert
          message="Connection Failed"
          description="Unable to connect to OME server. Please check your settings and ensure the server is running."
          type="error"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      <Alert
        message="API Endpoints"
        description={
          <div>
            <Text code>GET /v1/stats/current</Text> - Server statistics
            <br />
            <Text code>GET /v1/vhosts/{vhost}/apps/{app}/streams</Text> - Stream list
            <br />
            <Text code>POST /v1/vhosts/{vhost}/apps/{app}/streams/{stream}:sendEvent</Text> - Send events
            <br />
            <Text code>GET /v1/vhosts/{vhost}/apps/{app}/outputProfiles</Text> - Output profiles
          </div>
        }
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  );
};
