import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  InputNumber,
  Button,
  Space,
  Alert,
  Divider,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import { SCTE35Encoder } from '../utils/scte35';
import { OMEApiService } from '../services/omeApi';

const { Text } = Typography;
const { Option } = Select;

interface FormData {
  action: 'CUE-OUT' | 'CUE-IN';
  eventId: number;
  adDuration?: number;
  preRoll?: number;
}

export const ComplianceInjectionForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [lastEventId, setLastEventId] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const {
    addEvent,
    updateEventStatus,
    omeHost,
    omePort,
    omeUsername,
    omePassword,
    currentStream,
    currentVHost,
    currentApp,
    lastEventId: storeLastEventId,
  } = useStore();

  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  useEffect(() => {
    // Load last event ID from store
    setLastEventId(storeLastEventId);
  }, [storeLastEventId]);

  const handleSubmit = async (values: FormData) => {
    if (!currentStream) {
      Alert.error('No stream selected. Please select a stream first.');
      return;
    }

    setLoading(true);
    
    try {
      // Generate SCTE-35 message
      let scte35Message: string;
      
      if (values.action === 'CUE-OUT') {
        scte35Message = SCTE35Encoder.createCueOut(
          values.eventId,
          values.adDuration || 0,
          values.preRoll || 0
        );
      } else {
        scte35Message = SCTE35Encoder.createCueIn(values.eventId);
      }

      // Add event to store
      const eventData = {
        action: values.action,
        eventId: values.eventId,
        adDuration: values.adDuration,
        preRoll: values.preRoll,
        status: 'pending' as const,
      };
      
      addEvent(eventData);

      // Send to OME API
      await omeApi.injectSCTE35(
        currentVHost,
        currentApp,
        currentStream.id,
        scte35Message
      );

      // Update event status
      updateEventStatus(eventData.id || '', 'sent');
      
      Alert.success(`${values.action} signal sent successfully!`);
      
      // Auto-increment event ID for next use
      setLastEventId(values.eventId + 1);
      form.setFieldsValue({ eventId: values.eventId + 1 });
      
    } catch (error) {
      console.error('Failed to inject SCTE-35:', error);
      Alert.error('Failed to send SCTE-35 signal. Check OME connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleActionChange = (action: 'CUE-OUT' | 'CUE-IN') => {
    form.setFieldsValue({ 
      adDuration: action === 'CUE-OUT' ? 30 : undefined,
      preRoll: action === 'CUE-OUT' ? 0 : undefined,
    });
  };

  return (
    <Card 
      title={
        <Space>
          <SendOutlined />
          <span>Distributor Compliance - SCTE-35 Injection</span>
        </Space>
      }
      extra={
        <Button 
          type="link" 
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </Button>
      }
    >
      <Alert
        message="Compliance Tool"
        description="This form generates distributor-compliant SCTE-35 signals. CUE-OUT starts ad breaks, CUE-IN ends them. Event IDs must match between corresponding CUE-OUT and CUE-IN signals."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          action: 'CUE-OUT',
          eventId: lastEventId + 1,
          adDuration: 30,
          preRoll: 0,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="action"
              label="Action"
              rules={[{ required: true, message: 'Please select an action' }]}
            >
              <Select 
                placeholder="Select action"
                onChange={handleActionChange}
                suffixIcon={
                  <PlayCircleOutlined style={{ color: '#1890ff' }} />
                }
              >
                <Option value="CUE-OUT">
                  <Space>
                    <PlayCircleOutlined style={{ color: '#52c41a' }} />
                    CUE-OUT (Ad Start)
                  </Space>
                </Option>
                <Option value="CUE-IN">
                  <Space>
                    <PauseCircleOutlined style={{ color: '#ff4d4f' }} />
                    CUE-IN (Ad Stop)
                  </Space>
                </Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="eventId"
              label="Event ID"
              rules={[
                { required: true, message: 'Please enter event ID' },
                { type: 'number', min: 1, message: 'Event ID must be positive' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Auto-incremented"
                min={1}
                precision={0}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item shouldUpdate={(prevValues, currentValues) => 
          prevValues.action !== currentValues.action
        }>
          {({ getFieldValue }) => {
            const action = getFieldValue('action');
            
            if (action === 'CUE-OUT') {
              return (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="adDuration"
                        label="Ad Duration (seconds)"
                        rules={[
                          { required: true, message: 'Please enter ad duration' },
                          { type: 'number', min: 1, message: 'Duration must be at least 1 second' },
                        ]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          placeholder="30"
                          min={1}
                          max={3600}
                          precision={0}
                          addonAfter="sec"
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        name="preRoll"
                        label="Pre-roll (seconds)"
                        rules={[
                          { type: 'number', min: 0, max: 10, message: 'Pre-roll must be 0-10 seconds' },
                        ]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          placeholder="0"
                          min={0}
                          max={10}
                          precision={1}
                          step={0.1}
                          addonAfter="sec"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Alert
                    message="CUE-OUT Parameters"
                    description="Ad Duration: Length of the ad break in seconds. Pre-roll: Delay before the ad starts (0-10 seconds)."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                </>
              );
            }
            
            return (
              <Alert
                message="CUE-IN Parameters"
                description="CUE-IN signals end ad breaks. Use the same Event ID as the corresponding CUE-OUT signal."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            );
          }}
        </Form.Item>

        {showAdvanced && (
          <>
            <Divider>Advanced Settings</Divider>
            <Alert
              message="Technical Details"
              description={
                <div>
                  <Text code>SCTE-35 splice_insert</Text> commands are generated and Base64-encoded for OME API injection.
                  <br />
                  <Text code>out_of_network: true</Text> for CUE-OUT, <Text code>false</Text> for CUE-IN.
                  <br />
                  <Text code>break_duration</Text> is included only for CUE-OUT signals.
                </div>
              }
              type="info"
              showIcon
            />
          </>
        )}

        <Form.Item style={{ marginTop: 24 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SendOutlined />}
            size="large"
            block
          >
            Inject SCTE-35 Signal
          </Button>
        </Form.Item>
      </Form>

      {currentStream && (
        <Alert
          message={`Target Stream: ${currentStream.name}`}
          description={`Stream ID: ${currentStream.id} | Status: ${currentStream.state}`}
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
};
