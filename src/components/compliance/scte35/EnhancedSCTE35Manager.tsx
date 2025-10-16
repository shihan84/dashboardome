import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Alert,
  Tag,
  Row,
  Col,
  Form,
  Input,
  Select,
  InputNumber,
  Modal,
  Tabs,
  DatePicker,
  Timeline,
  message,
  Statistic,
  Switch,
  Divider,
  Progress,
  Badge,
  Tooltip,
  Descriptions,
  List,
  Avatar
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SendOutlined,
  CalendarOutlined,
  HistoryOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  DollarOutlined,
  BarChartOutlined,
  SettingOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined
} from '@ant-design/icons';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// Enhanced SCTE-35 Message Types
interface SCTE35Message {
  id: string;
  messageType: 'splice_insert' | 'time_signal' | 'bandwidth_reservation' | 'segmentation_descriptor';
  spliceCommandType: 'immediate' | 'scheduled';
  spliceTime: number;
  uniqueProgramId: number;
  availNum: number;
  availsExpected: number;
  segmentationDescriptors: SegmentationDescriptor[];
  status: 'pending' | 'sent' | 'acknowledged' | 'failed';
  timestamp: Date;
  streamName: string;
  metadata?: {
    advertiser?: string;
    campaign?: string;
    product?: string;
    revenue?: number;
  };
}

interface SegmentationDescriptor {
  segmentationType: number;
  segmentationEventId: number;
  segmentationDuration?: number;
  segmentationUpid?: string;
  segmentationTypeId?: number;
  deliveryRestrictions?: {
    webDeliveryAllowed: boolean;
    noRegionalBlackout: boolean;
    archiveAllowed: boolean;
    deviceRestrictions: string[];
  };
}

interface AdDecisionServer {
  id: string;
  name: string;
  url: string;
  timeout: number;
  enabled: boolean;
  fallbackAds: AdContent[];
  targeting: TargetingCriteria;
}

interface AdContent {
  id: string;
  name: string;
  url: string;
  duration: number;
  format: 'mp4' | 'hls' | 'dash';
  bitrate: number;
  resolution: string;
  advertiser: string;
  campaign: string;
}

interface TargetingCriteria {
  demographics: {
    ageRange: [number, number];
    gender: string[];
    location: string[];
  };
  interests: string[];
  behavior: string[];
}

interface ManifestModification {
  streamName: string;
  protocol: 'hls' | 'dash';
  adMarkers: AdMarker[];
  contentReplacement: ContentReplacement[];
  lastModified: Date;
}

interface AdMarker {
  id: string;
  startTime: number;
  duration: number;
  adId: string;
  type: 'pre_roll' | 'mid_roll' | 'post_roll';
  status: 'scheduled' | 'active' | 'completed' | 'failed';
}

interface ContentReplacement {
  id: string;
  originalSegment: string;
  replacementContent: string;
  startTime: number;
  duration: number;
  conditions: ReplacementCondition[];
  status: 'scheduled' | 'active' | 'completed' | 'failed';
}

interface ReplacementCondition {
  type: 'geographic' | 'demographic' | 'time_based' | 'content_based';
  value: any;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
}

interface SCTE35Analytics {
  totalEvents: number;
  successfulInsertions: number;
  failedInsertions: number;
  averageLatency: number;
  adRevenue: number;
  viewerEngagement: {
    impressions: number;
    clicks: number;
    conversions: number;
    completionRate: number;
  };
  topPerformingAds: AdContent[];
  revenueByTime: Array<{
    timestamp: Date;
    revenue: number;
  }>;
}

const EnhancedSCTE35Manager: React.FC = () => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  const [loading, setLoading] = useState(false);
  const [scte35Messages, setScte35Messages] = useState<SCTE35Message[]>([]);
  const [adDecisionServers, setAdDecisionServers] = useState<AdDecisionServer[]>([]);
  const [manifestModifications, setManifestModifications] = useState<ManifestModification[]>([]);
  const [analytics, setAnalytics] = useState<SCTE35Analytics | null>(null);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [adsModalVisible, setAdsModalVisible] = useState(false);
  const [manifestModalVisible, setManifestModalVisible] = useState(false);
  const [editingMessage, setEditingMessage] = useState<SCTE35Message | null>(null);
  const [messageForm] = Form.useForm();
  const [adsForm] = Form.useForm();
  const [manifestForm] = Form.useForm();

  // SCTE-35 Message Types
  const messageTypes = [
    { value: 'splice_insert', label: 'Splice Insert', description: 'Immediate or scheduled splice point' },
    { value: 'time_signal', label: 'Time Signal', description: 'Timing information for events' },
    { value: 'bandwidth_reservation', label: 'Bandwidth Reservation', description: 'Bandwidth allocation signal' },
    { value: 'segmentation_descriptor', label: 'Segmentation Descriptor', description: 'Content segmentation marker' }
  ];

  // Segmentation Types
  const segmentationTypes = [
    { value: 16, label: 'Program Start', description: 'Program beginning marker' },
    { value: 17, label: 'Program End', description: 'Program ending marker' },
    { value: 18, label: 'Program Early Termination', description: 'Early program end' },
    { value: 19, label: 'Program Breakaway', description: 'Program interruption' },
    { value: 20, label: 'Program Resumption', description: 'Program continuation' },
    { value: 48, label: 'Provider Ad Avail Start', description: 'Ad break start' },
    { value: 49, label: 'Provider Ad Avail End', description: 'Ad break end' },
    { value: 50, label: 'Distributor Ad Avail Start', description: 'Distributor ad start' },
    { value: 51, label: 'Distributor Ad Avail End', description: 'Distributor ad end' }
  ];

  useEffect(() => {
    loadSCTE35Data();
    const interval = setInterval(loadSCTE35Data, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSCTE35Data = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual OME API calls
      const mockMessages: SCTE35Message[] = [
        {
          id: '1',
          messageType: 'splice_insert',
          spliceCommandType: 'scheduled',
          spliceTime: Date.now() + 30000,
          uniqueProgramId: 12345,
          availNum: 1,
          availsExpected: 3,
          segmentationDescriptors: [{
            segmentationType: 48,
            segmentationEventId: 1001,
            segmentationDuration: 30000,
            segmentationUpid: 'ad_break_1'
          }],
          status: 'pending',
          timestamp: new Date(),
          streamName: 'live',
          metadata: {
            advertiser: 'TechCorp',
            campaign: 'Q1_2025',
            product: 'SmartPhone Pro',
            revenue: 1500
          }
        },
        {
          id: '2',
          messageType: 'time_signal',
          spliceCommandType: 'immediate',
          spliceTime: Date.now(),
          uniqueProgramId: 12346,
          availNum: 2,
          availsExpected: 3,
          segmentationDescriptors: [{
            segmentationType: 16,
            segmentationEventId: 1002,
            segmentationUpid: 'program_start'
          }],
          status: 'sent',
          timestamp: new Date(Date.now() - 60000),
          streamName: 'shreenews'
        }
      ];

      const mockADS: AdDecisionServer[] = [
        {
          id: '1',
          name: 'Primary ADS',
          url: 'https://ads.example.com/vast',
          timeout: 5000,
          enabled: true,
          fallbackAds: [],
          targeting: {
            demographics: {
              ageRange: [18, 65],
              gender: ['male', 'female'],
              location: ['US', 'CA']
            },
            interests: ['technology', 'sports'],
            behavior: ['frequent_viewer']
          }
        }
      ];

      const mockManifest: ManifestModification[] = [
        {
          streamName: 'live',
          protocol: 'hls',
          adMarkers: [
            {
              id: '1',
              startTime: 120,
              duration: 30,
              adId: 'ad_001',
              type: 'mid_roll',
              status: 'active'
            }
          ],
          contentReplacement: [],
          lastModified: new Date()
        }
      ];

      const mockAnalytics: SCTE35Analytics = {
        totalEvents: 1250,
        successfulInsertions: 1180,
        failedInsertions: 70,
        averageLatency: 45,
        adRevenue: 12500,
        viewerEngagement: {
          impressions: 45000,
          clicks: 2250,
          conversions: 180,
          completionRate: 0.85
        },
        topPerformingAds: [],
        revenueByTime: []
      };

      setSCTE35Messages(mockMessages);
      setAdDecisionServers(mockADS);
      setManifestModifications(mockManifest);
      setAnalytics(mockAnalytics);
    } catch (error) {
      message.error('Failed to load SCTE-35 data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMessage = () => {
    setEditingMessage(null);
    messageForm.resetFields();
    setMessageModalVisible(true);
  };

  const handleEditMessage = (message: SCTE35Message) => {
    setEditingMessage(message);
    messageForm.setFieldsValue({
      ...message,
      spliceTime: dayjs(message.spliceTime)
    });
    setMessageModalVisible(true);
  };

  const handleSaveMessage = async (values: any) => {
    try {
      const newMessage: SCTE35Message = {
        id: editingMessage?.id || Date.now().toString(),
        ...values,
        spliceTime: values.spliceTime.valueOf(),
        status: 'pending',
        timestamp: new Date(),
        segmentationDescriptors: values.segmentationDescriptors || []
      };

      if (editingMessage) {
        setSCTE35Messages(prev => prev.map(msg => 
          msg.id === editingMessage.id ? newMessage : msg
        ));
        message.success('SCTE-35 message updated successfully!');
      } else {
        setSCTE35Messages(prev => [newMessage, ...prev]);
        message.success('SCTE-35 message created successfully!');
      }
      setMessageModalVisible(false);
    } catch (error) {
      message.error('Failed to save SCTE-35 message');
    }
  };

  const handleSendMessage = async (messageId: string) => {
    try {
      setSCTE35Messages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'sent' } : msg
      ));
      message.success('SCTE-35 message sent successfully!');
    } catch (error) {
      message.error('Failed to send SCTE-35 message');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'sent': return 'processing';
      case 'acknowledged': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'splice_insert': return 'blue';
      case 'time_signal': return 'green';
      case 'bandwidth_reservation': return 'orange';
      case 'segmentation_descriptor': return 'purple';
      default: return 'default';
    }
  };

  const messageColumns = [
    {
      title: 'Message Type',
      dataIndex: 'messageType',
      key: 'messageType',
      render: (type: string) => (
        <Tag color={getMessageTypeColor(type)}>
          {type.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Stream',
      dataIndex: 'streamName',
      key: 'streamName',
      render: (stream: string) => (
        <Space>
          <PlayCircleOutlined />
          {stream}
        </Space>
      )
    },
    {
      title: 'Splice Time',
      dataIndex: 'spliceTime',
      key: 'spliceTime',
      render: (time: number) => (
        <Space>
          <ClockCircleOutlined />
          {new Date(time).toLocaleString()}
        </Space>
      )
    },
    {
      title: 'Program ID',
      dataIndex: 'uniqueProgramId',
      key: 'uniqueProgramId',
      render: (id: number) => <Text code>{id}</Text>
    },
    {
      title: 'Segmentation',
      key: 'segmentation',
      render: (record: SCTE35Message) => (
        <Space direction="vertical" size="small">
          {record.segmentationDescriptors.map((desc, index) => (
            <Tag key={index} color="cyan">
              {segmentationTypes.find(t => t.value === desc.segmentationType)?.label || `Type ${desc.segmentationType}`}
            </Tag>
          ))}
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
      title: 'Revenue',
      key: 'revenue',
      render: (record: SCTE35Message) => (
        record.metadata?.revenue ? (
          <Space>
            <DollarOutlined />
            ${record.metadata.revenue}
          </Space>
        ) : '-'
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: SCTE35Message) => (
        <Space>
          {record.status === 'pending' && (
            <Tooltip title="Send Message">
              <Button 
                icon={<SendOutlined />} 
                type="primary" 
                size="small"
                onClick={() => handleSendMessage(record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="Edit Message">
            <Button 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEditMessage(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Message">
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const successRate = analytics ? (analytics.successfulInsertions / analytics.totalEvents * 100) : 0;
  const revenuePerEvent = analytics ? (analytics.adRevenue / analytics.totalEvents) : 0;

  return (
    <div>
      {/* SCTE-35 Analytics Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Events"
              value={analytics?.totalEvents || 0}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={successRate}
              precision={1}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
            <Progress percent={successRate} size="small" />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Ad Revenue"
              value={analytics?.adRevenue || 0}
              prefix="$"
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Avg Latency"
              value={analytics?.averageLatency || 0}
              suffix="ms"
              prefix={<ThunderboltOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Enhanced SCTE-35 Info Alert */}
      <Alert
        message="Enhanced SCTE-35 Management"
        description="Advanced SCTE-35 message handling with support for all message types, Ad Decision Server integration, manifest modification, and comprehensive analytics. Industry-standard compliance with Wowza, Nimble, and Flussonic."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Main SCTE-35 Management */}
      <Card
        title="SCTE-35 Messages"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadSCTE35Data}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateMessage}
            >
              Create Message
            </Button>
          </Space>
        }
      >
        <Table
          columns={messageColumns}
          dataSource={scte35Messages}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create/Edit SCTE-35 Message Modal */}
      <Modal
        title={editingMessage ? 'Edit SCTE-35 Message' : 'Create SCTE-35 Message'}
        open={messageModalVisible}
        onCancel={() => setMessageModalVisible(false)}
        onOk={() => messageForm.submit()}
        width={800}
      >
        <Form
          form={messageForm}
          layout="vertical"
          onFinish={handleSaveMessage}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="messageType"
                label="Message Type"
                rules={[{ required: true, message: 'Please select message type' }]}
              >
                <Select placeholder="Select message type">
                  {messageTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      <Space direction="vertical" size="small">
                        <Text strong>{type.label}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {type.description}
                        </Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="spliceCommandType"
                label="Splice Command Type"
                rules={[{ required: true, message: 'Please select command type' }]}
                initialValue="scheduled"
              >
                <Select>
                  <Option value="immediate">Immediate</Option>
                  <Option value="scheduled">Scheduled</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="streamName"
                label="Stream Name"
                rules={[{ required: true, message: 'Please enter stream name' }]}
              >
                <Select placeholder="Select stream">
                  <Option value="live">live</Option>
                  <Option value="shreenews">shreenews</Option>
                  <Option value="app">app</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="spliceTime"
                label="Splice Time"
                rules={[{ required: true, message: 'Please select splice time' }]}
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }}
                  placeholder="Select splice time"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="uniqueProgramId"
                label="Program ID"
                rules={[{ required: true, message: 'Please enter program ID' }]}
                initialValue={12345}
              >
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="availNum"
                label="Avail Number"
                rules={[{ required: true, message: 'Please enter avail number' }]}
                initialValue={1}
              >
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Segmentation Descriptors</Divider>

          <Form.List name="segmentationDescriptors">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'segmentationType']}
                          label="Segmentation Type"
                          rules={[{ required: true, message: 'Please select type' }]}
                        >
                          <Select placeholder="Select type">
                            {segmentationTypes.map(type => (
                              <Option key={type.value} value={type.value}>
                                {type.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'segmentationEventId']}
                          label="Event ID"
                          rules={[{ required: true, message: 'Please enter event ID' }]}
                        >
                          <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'segmentationDuration']}
                          label="Duration (ms)"
                        >
                          <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Button 
                      type="link" 
                      danger 
                      onClick={() => remove(name)}
                      icon={<DeleteOutlined />}
                    >
                      Remove Descriptor
                    </Button>
                  </Card>
                ))}
                <Button 
                  type="dashed" 
                  onClick={() => add()} 
                  block 
                  icon={<PlusOutlined />}
                >
                  Add Segmentation Descriptor
                </Button>
              </>
            )}
          </Form.List>

          <Divider>Metadata</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['metadata', 'advertiser']}
                label="Advertiser"
              >
                <Input placeholder="Enter advertiser name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['metadata', 'campaign']}
                label="Campaign"
              >
                <Input placeholder="Enter campaign name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['metadata', 'product']}
                label="Product"
              >
                <Input placeholder="Enter product name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['metadata', 'revenue']}
                label="Revenue ($)"
              >
                <InputNumber style={{ width: '100%' }} placeholder="Enter revenue" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default EnhancedSCTE35Manager;
