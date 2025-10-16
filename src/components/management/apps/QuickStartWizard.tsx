import React, { useState } from 'react';
import {
  Card,
  Button,
  Steps,
  Form,
  Input,
  Select,
  Radio,
  Switch,
  Space,
  message,
  Alert,
  Row,
  Col,
  Typography,
  Divider
} from 'antd';
import {
  RocketOutlined,
  PlayCircleOutlined,
  CloudServerOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { OMEApiService } from '../../../services/omeApi';
import { useStore } from '../../../store/useStore';

const { Option } = Select;
const { Step } = Steps;
const { Title, Text } = Typography;

interface QuickStartData {
  appName: string;
  appType: 'live' | 'vod';
  streamName: string;
  streamType: 'rtmp' | 'webrtc' | 'srt' | 'hls';
  bitrate: number;
  resolution: string;
  framerate: number;
}

const QuickStartWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [createdApp, setCreatedApp] = useState<string | null>(null);

  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  const steps = [
    {
      title: 'Application',
      description: 'Create your streaming app',
      icon: <CloudServerOutlined />
    },
    {
      title: 'Stream',
      description: 'Configure your stream',
      icon: <PlayCircleOutlined />
    },
    {
      title: 'Settings',
      description: 'Set quality parameters',
      icon: <RocketOutlined />
    },
    {
      title: 'Complete',
      description: 'Ready to stream!',
      icon: <CheckCircleOutlined />
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async (values: QuickStartData) => {
    setLoading(true);
    try {
      // Aggregate all form values across steps
      const allValues = form.getFieldsValue(true) as Partial<QuickStartData>;
      const appName = (allValues.appName as string) || (values as any).appName;
      const appType = (allValues.appType as QuickStartData['appType']) || (values as any).appType || 'live';

      if (!appName) {
        message.error('Please provide an Application Name in Step 1.');
        setCurrentStep(0);
        return;
      }

      console.log('Creating application with values:', { appName, appType, ...allValues });
      
      // First, ensure the virtual host exists
      const vhostsResp = await omeApi.getVHosts();
      const vhostsRaw = vhostsResp?.data || [];
      const vhostNames: string[] = vhostsRaw.map((vh: any) => (typeof vh === 'string' ? vh : vh?.name)).filter(Boolean);
      const testVHostExists = vhostNames.includes('test');
      
      if (!testVHostExists) {
        console.log('Creating test virtual host...');
        try {
          await omeApi.createVHost({ name: 'test' });
          console.log('Test virtual host created successfully');
        } catch (e: any) {
          const status = e?.response?.status || e?.status;
          if (status === 409) {
            console.warn('Virtual host "test" already exists. Proceeding.');
          } else {
            throw e;
          }
        }
      }
      
      // Create application
      const result = await omeApi.createApplication('test', {
        name: appName,
        type: appType as any,
      } as any);

      console.log('Application creation result:', result);
      setCreatedApp(appName);
      setCurrentStep(3);
      message.success('Application created successfully!');
    } catch (error: any) {
      console.error('Failed to create application:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.response?.status || error?.status,
        response: error?.response?.data || error?.response,
      });
      const apiMsg = error?.response?.data?.message;
      message.error(`Failed to create application${apiMsg ? `: ${apiMsg}` : ''}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Title level={4}>Create Your Streaming Application</Title>
            <Text type="secondary">
              Choose a name and type for your streaming application. This will be your main broadcast channel.
            </Text>
            <Divider />
            <Form.Item
              label="Application Name"
              name="appName"
              rules={[{ required: true, message: 'Please enter application name' }]}
            >
              <Input placeholder="e.g., MyLiveStream, NewsChannel, EventBroadcast" />
            </Form.Item>
            <Form.Item
              label="Application Type"
              name="appType"
              rules={[{ required: true, message: 'Please select application type' }]}
              initialValue="live"
            >
              <Radio.Group>
                <Radio value="live">Live Streaming</Radio>
                <Radio value="vod">Video on Demand</Radio>
              </Radio.Group>
            </Form.Item>
          </div>
        );

      case 1:
        return (
          <div>
            <Title level={4}>Configure Your Stream</Title>
            <Text type="secondary">
              Set up your stream source and type. Choose the protocol that best fits your needs.
            </Text>
            <Divider />
            <Form.Item
              label="Stream Name"
              name="streamName"
              rules={[{ required: true, message: 'Please enter stream name' }]}
            >
              <Input placeholder="e.g., main, backup, mobile" />
            </Form.Item>
            <Form.Item
              label="Stream Type"
              name="streamType"
              rules={[{ required: true, message: 'Please select stream type' }]}
            >
              <Select placeholder="Select stream protocol">
                <Option value="rtmp">
                  <Space>
                    <PlayCircleOutlined style={{ color: '#52c41a' }} />
                    <div>
                      <div>RTMP - Real-Time Messaging Protocol</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Best for: Live streaming, OBS, encoders
                      </Text>
                    </div>
                  </Space>
                </Option>
                <Option value="webrtc">
                  <Space>
                    <PlayCircleOutlined style={{ color: '#1890ff' }} />
                    <div>
                      <div>WebRTC - Web Real-Time Communication</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Best for: Low latency, web browsers
                      </Text>
                    </div>
                  </Space>
                </Option>
                <Option value="srt">
                  <Space>
                    <PlayCircleOutlined style={{ color: '#722ed1' }} />
                    <div>
                      <div>SRT - Secure Reliable Transport</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Best for: Long-distance, unreliable networks
                      </Text>
                    </div>
                  </Space>
                </Option>
                <Option value="hls">
                  <Space>
                    <PlayCircleOutlined style={{ color: '#fa8c16' }} />
                    <div>
                      <div>HLS - HTTP Live Streaming</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Best for: Wide compatibility, mobile devices
                      </Text>
                    </div>
                  </Space>
                </Option>
              </Select>
            </Form.Item>
          </div>
        );

      case 2:
        return (
          <div>
            <Title level={4}>Quality Settings</Title>
            <Text type="secondary">
              Configure video quality parameters for optimal streaming performance.
            </Text>
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Resolution"
                  name="resolution"
                  initialValue="1920x1080"
                >
                  <Select>
                    <Option value="1920x1080">1920x1080 (Full HD)</Option>
                    <Option value="1280x720">1280x720 (HD)</Option>
                    <Option value="854x480">854x480 (SD)</Option>
                    <Option value="640x360">640x360 (Low)</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Framerate (fps)"
                  name="framerate"
                  initialValue={30}
                >
                  <Select>
                    <Option value={24}>24 fps</Option>
                    <Option value={30}>30 fps</Option>
                    <Option value={60}>60 fps</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              label="Bitrate (kbps)"
              name="bitrate"
              initialValue={2500}
            >
              <Select>
                <Option value={1000}>1000 kbps (Low)</Option>
                <Option value={2500}>2500 kbps (Medium)</Option>
                <Option value={5000}>5000 kbps (High)</Option>
                <Option value={8000}>8000 kbps (Ultra)</Option>
              </Select>
            </Form.Item>
          </div>
        );

      case 3:
        return (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a', marginBottom: '24px' }} />
            <Title level={3}>Application Created Successfully!</Title>
            <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '24px' }}>
              Your streaming application "{createdApp}" is ready to use.
            </Text>
            <Alert
              message="Next Steps"
              description={
                <div>
                  <p>1. Use your streaming software (OBS, Wirecast, etc.) to connect to the stream</p>
                  <p>2. Configure your encoder with the recommended settings</p>
                  <p>3. Start streaming and monitor your broadcast</p>
                </div>
              }
              type="success"
              showIcon
              style={{ textAlign: 'left', marginTop: '24px' }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card
      title={
        <Space>
          <RocketOutlined />
          Quick Start Wizard
        </Space>
      }
      style={{ maxWidth: 800, margin: '0 auto' }}
    >
      <Steps current={currentStep} style={{ marginBottom: 32 }}>
        {steps.map((step, index) => (
          <Step
            key={index}
            title={step.title}
            description={step.description}
            icon={step.icon}
          />
        ))}
      </Steps>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ minHeight: 400 }}
      >
        {renderStepContent()}

        {currentStep < 3 && (
          <div style={{ textAlign: 'right', marginTop: 32 }}>
            <Space>
              {currentStep > 0 && (
                <Button onClick={handlePrev}>
                  Previous
                </Button>
              )}
              {currentStep < 2 ? (
                <Button type="primary" onClick={handleNext}>
                  Next
                  <ArrowRightOutlined />
                </Button>
              ) : (
                <Button type="primary" htmlType="submit" loading={loading}>
                  Create Application
                </Button>
              )}
            </Space>
          </div>
        )}

        {currentStep === 3 && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Button type="primary" onClick={() => {
              setCurrentStep(0);
              form.resetFields();
              setCreatedApp(null);
            }}>
              Create Another Application
            </Button>
          </div>
        )}
      </Form>
    </Card>
  );
};

export default QuickStartWizard;
