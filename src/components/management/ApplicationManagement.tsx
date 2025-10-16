import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Popconfirm,
  message,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
  Divider,
  Tabs,
  Switch,
  InputNumber,
  Typography,
  Descriptions,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  VideoCameraOutlined,
  SoundOutlined,
  WifiOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';
import { useStore } from '../../store/useStore';
import { OMEApiService } from '../../services/omeApi';
import type { OMEApplication, OMEApplicationDetailed } from '../../types';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface ApplicationFormData {
  name: string;
  type: 'live' | 'vod' | 'file';
  providers: {
    rtmp: boolean;
    srt: boolean;
    webrtc: boolean;
    rtsp: boolean;
  };
  publishers: {
    llhls: boolean;
    webrtc: boolean;
    hls: boolean;
    dash: boolean;
  };
  outputProfiles: any[];
  recording: {
    enable: boolean;
    path: string;
    infoPath: string;
    filePath: string;
    scheduledPath: string;
  };
  dvr: {
    enable: boolean;
    maxDuration: number;
    maxSegments: number;
  };
}

const ApplicationManagement: React.FC = () => {
  const { omeHost, omePort } = useStore();
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<OMEApplication[]>([]);
  const [vhosts, setVHosts] = useState<string[]>([]);
  const [selectedVHost, setSelectedVHost] = useState<string>('default');
  const [selectedApplication, setSelectedApplication] = useState<OMEApplicationDetailed | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingApplication, setEditingApplication] = useState<OMEApplicationDetailed | null>(null);
  const [form] = Form.useForm();

  const loadVHosts = async () => {
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const response = await omeApi.getVHosts();
      if (response.success) {
        const vhostNames = response.data.map(v => v.name);
        setVHosts(vhostNames);
        if (vhostNames.length > 0 && !selectedVHost) {
          setSelectedVHost(vhostNames[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load vhosts:', error);
    }
  };

  const loadApplications = async () => {
    if (!selectedVHost) return;
    
    setLoading(true);
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const response = await omeApi.getApplications(selectedVHost);
      if (response.success) {
        setApplications(response.data);
      } else {
        message.error('Failed to load applications');
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
      message.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const loadApplicationDetails = async (appName: string) => {
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const details = await omeApi.getApplicationDetailed(selectedVHost, appName);
      setSelectedApplication(details);
    } catch (error) {
      console.error('Failed to load application details:', error);
      message.error('Failed to load application details');
    }
  };

  const handleCreateApplication = async (values: ApplicationFormData) => {
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const appData: OMEApplicationDetailed = {
        name: values.name,
        type: values.type,
        providers: {
          rtmp: values.providers.rtmp,
          srt: values.providers.srt,
          webrtc: values.providers.webrtc,
          rtsp: values.providers.rtsp
        },
        publishers: {
          llhls: values.publishers.llhls,
          webrtc: values.publishers.webrtc,
          hls: values.publishers.hls,
          dash: values.publishers.dash
        },
        outputProfiles: values.outputProfiles,
        recording: values.recording,
        dvr: values.dvr
      };
      
      await omeApi.createApplication(selectedVHost, appData);
      message.success('Application created successfully');
      setModalVisible(false);
      form.resetFields();
      loadApplications();
    } catch (error) {
      console.error('Failed to create application:', error);
      message.error('Failed to create application');
    }
  };

  const handleUpdateApplication = async (values: ApplicationFormData) => {
    if (!editingApplication) return;
    
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const appData: OMEApplicationDetailed = {
        name: values.name,
        type: values.type,
        providers: {
          rtmp: values.providers.rtmp,
          srt: values.providers.srt,
          webrtc: values.providers.webrtc,
          rtsp: values.providers.rtsp
        },
        publishers: {
          llhls: values.publishers.llhls,
          webrtc: values.publishers.webrtc,
          hls: values.publishers.hls,
          dash: values.publishers.dash
        },
        outputProfiles: values.outputProfiles,
        recording: values.recording,
        dvr: values.dvr
      };
      
      await omeApi.updateApplication(selectedVHost, editingApplication.name, appData);
      message.success('Application updated successfully');
      setModalVisible(false);
      setEditingApplication(null);
      form.resetFields();
      loadApplications();
      if (selectedApplication?.name === editingApplication.name) {
        loadApplicationDetails(editingApplication.name);
      }
    } catch (error) {
      console.error('Failed to update application:', error);
      message.error('Failed to update application');
    }
  };

  const handleDeleteApplication = async (appName: string) => {
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      await omeApi.deleteApplication(selectedVHost, appName);
      message.success('Application deleted successfully');
      loadApplications();
      if (selectedApplication?.name === appName) {
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Failed to delete application:', error);
      message.error('Failed to delete application');
    }
  };

  const openCreateModal = () => {
    setEditingApplication(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (app: OMEApplication) => {
    loadApplicationDetails(app.name);
    setEditingApplication(null); // Will be set after details load
    setModalVisible(true);
  };

  useEffect(() => {
    loadVHosts();
  }, []);

  useEffect(() => {
    if (selectedVHost) {
      loadApplications();
    }
  }, [selectedVHost]);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <AppstoreOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'live' ? 'green' : type === 'vod' ? 'blue' : 'orange'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Providers',
      key: 'providers',
      render: (_, record: OMEApplication) => (
        <Space wrap>
          {record.providers?.rtmp && <Tag icon={<VideoCameraOutlined />}>RTMP</Tag>}
          {record.providers?.srt && <Tag icon={<WifiOutlined />}>SRT</Tag>}
          {record.providers?.webrtc && <Tag icon={<CloudUploadOutlined />}>WebRTC</Tag>}
          {record.providers?.rtsp && <Tag icon={<PlayCircleOutlined />}>RTSP</Tag>}
        </Space>
      ),
    },
    {
      title: 'Publishers',
      key: 'publishers',
      render: (_, record: OMEApplication) => (
        <Space wrap>
          {record.publishers?.llhls && <Tag color="blue">LLHLS</Tag>}
          {record.publishers?.webrtc && <Tag color="green">WebRTC</Tag>}
          {record.publishers?.hls && <Tag color="orange">HLS</Tag>}
          {record.publishers?.dash && <Tag color="purple">DASH</Tag>}
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: () => (
        <Badge status="success" text="Active" />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: OMEApplication) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<InfoCircleOutlined />}
              onClick={() => loadApplicationDetails(record.name)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this application?"
            onConfirm={() => handleDeleteApplication(record.name)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                icon={<DeleteOutlined />}
                danger
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <AppstoreOutlined /> Application Management
            </Title>
            <Text type="secondary">Manage streaming applications and their configurations</Text>
          </div>
          <Space>
            <Select
              value={selectedVHost}
              onChange={setSelectedVHost}
              style={{ width: 200 }}
              placeholder="Select Virtual Host"
            >
              {vhosts.map(vhost => (
                <Option key={vhost} value={vhost}>{vhost}</Option>
              ))}
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadApplications}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Create Application
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Applications"
                value={applications.length}
                prefix={<AppstoreOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Live Applications"
                value={applications.filter(a => a.type === 'live').length}
                prefix={<PlayCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="VOD Applications"
                value={applications.filter(a => a.type === 'vod').length}
                prefix={<VideoCameraOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Active Applications"
                value={applications.length}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title={`Applications in ${selectedVHost}`} size="small">
              <Table
                columns={columns}
                dataSource={applications}
                rowKey="name"
                loading={loading}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            {selectedApplication ? (
              <Card title="Application Details" size="small">
                <Tabs defaultActiveKey="general" size="small">
                  <TabPane tab="General" key="general">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Name">
                        <Text code>{selectedApplication.name}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Type">
                        <Tag color={selectedApplication.type === 'live' ? 'green' : 'blue'}>
                          {selectedApplication.type.toUpperCase()}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Badge status="success" text="Active" />
                      </Descriptions.Item>
                    </Descriptions>
                  </TabPane>
                  
                  <TabPane tab="Providers" key="providers">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Input Protocols</Text>
                        <br />
                        <Space wrap>
                          {selectedApplication.providers?.rtmp && <Tag icon={<VideoCameraOutlined />}>RTMP</Tag>}
                          {selectedApplication.providers?.srt && <Tag icon={<WifiOutlined />}>SRT</Tag>}
                          {selectedApplication.providers?.webrtc && <Tag icon={<CloudUploadOutlined />}>WebRTC</Tag>}
                          {selectedApplication.providers?.rtsp && <Tag icon={<PlayCircleOutlined />}>RTSP</Tag>}
                        </Space>
                      </div>
                    </Space>
                  </TabPane>
                  
                  <TabPane tab="Publishers" key="publishers">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Output Protocols</Text>
                        <br />
                        <Space wrap>
                          {selectedApplication.publishers?.llhls && <Tag color="blue">LLHLS</Tag>}
                          {selectedApplication.publishers?.webrtc && <Tag color="green">WebRTC</Tag>}
                          {selectedApplication.publishers?.hls && <Tag color="orange">HLS</Tag>}
                          {selectedApplication.publishers?.dash && <Tag color="purple">DASH</Tag>}
                        </Space>
                      </div>
                    </Space>
                  </TabPane>
                  
                  <TabPane tab="Recording" key="recording">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Recording</Text>
                        <br />
                        <Tag color={selectedApplication.recording?.enable ? 'green' : 'default'}>
                          {selectedApplication.recording?.enable ? 'Enabled' : 'Disabled'}
                        </Tag>
                      </div>
                      {selectedApplication.recording?.enable && (
                        <div>
                          <Text strong>Path</Text>
                          <br />
                          <Text code>{selectedApplication.recording.path}</Text>
                        </div>
                      )}
                    </Space>
                  </TabPane>
                  
                  <TabPane tab="DVR" key="dvr">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>DVR</Text>
                        <br />
                        <Tag color={selectedApplication.dvr?.enable ? 'green' : 'default'}>
                          {selectedApplication.dvr?.enable ? 'Enabled' : 'Disabled'}
                        </Tag>
                      </div>
                      {selectedApplication.dvr?.enable && (
                        <>
                          <div>
                            <Text strong>Max Duration</Text>
                            <br />
                            <Text>{selectedApplication.dvr.maxDuration}s</Text>
                          </div>
                          <div>
                            <Text strong>Max Segments</Text>
                            <br />
                            <Text>{selectedApplication.dvr.maxSegments}</Text>
                          </div>
                        </>
                      )}
                    </Space>
                  </TabPane>
                </Tabs>
              </Card>
            ) : (
              <Card title="Select an Application" size="small">
                <Text type="secondary">Click on an application to view details</Text>
              </Card>
            )}
          </Col>
        </Row>
      </Card>

      <Modal
        title={editingApplication ? 'Edit Application' : 'Create Application'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingApplication(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingApplication ? handleUpdateApplication : handleCreateApplication}
          initialValues={{
            type: 'live',
            providers: {
              rtmp: true,
              srt: false,
              webrtc: false,
              rtsp: false
            },
            publishers: {
              llhls: true,
              webrtc: true,
              hls: false,
              dash: false
            },
            recording: {
              enable: false,
              path: '/tmp/records',
              infoPath: '/tmp/records/info',
              filePath: '/tmp/records/files',
              scheduledPath: '/tmp/records/scheduled'
            },
            dvr: {
              enable: false,
              maxDuration: 3600,
              maxSegments: 10
            }
          }}
        >
          <Tabs defaultActiveKey="general">
            <TabPane tab="General" key="general">
              <Form.Item
                name="name"
                label="Application Name"
                rules={[{ required: true, message: 'Please enter application name' }]}
              >
                <Input placeholder="e.g., live" disabled={!!editingApplication} />
              </Form.Item>
              
              <Form.Item
                name="type"
                label="Application Type"
                rules={[{ required: true, message: 'Please select application type' }]}
              >
                <Select>
                  <Option value="live">Live</Option>
                  <Option value="vod">Video on Demand</Option>
                  <Option value="file">File</Option>
                </Select>
              </Form.Item>
            </TabPane>
            
            <TabPane tab="Providers" key="providers">
              <Card title="Input Providers" size="small">
                <Form.Item
                  name={['providers', 'rtmp']}
                  label="RTMP"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name={['providers', 'srt']}
                  label="SRT"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name={['providers', 'webrtc']}
                  label="WebRTC"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name={['providers', 'rtsp']}
                  label="RTSP"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Card>
            </TabPane>
            
            <TabPane tab="Publishers" key="publishers">
              <Card title="Output Publishers" size="small">
                <Form.Item
                  name={['publishers', 'llhls']}
                  label="LLHLS"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name={['publishers', 'webrtc']}
                  label="WebRTC"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name={['publishers', 'hls']}
                  label="HLS"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name={['publishers', 'dash']}
                  label="DASH"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Card>
            </TabPane>
            
            <TabPane tab="Recording" key="recording">
              <Card title="Recording Configuration" size="small">
                <Form.Item
                  name={['recording', 'enable']}
                  label="Enable Recording"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name={['recording', 'path']}
                  label="Recording Path"
                >
                  <Input placeholder="/tmp/records" />
                </Form.Item>
                
                <Form.Item
                  name={['recording', 'infoPath']}
                  label="Info Path"
                >
                  <Input placeholder="/tmp/records/info" />
                </Form.Item>
                
                <Form.Item
                  name={['recording', 'filePath']}
                  label="File Path"
                >
                  <Input placeholder="/tmp/records/files" />
                </Form.Item>
                
                <Form.Item
                  name={['recording', 'scheduledPath']}
                  label="Scheduled Path"
                >
                  <Input placeholder="/tmp/records/scheduled" />
                </Form.Item>
              </Card>
            </TabPane>
            
            <TabPane tab="DVR" key="dvr">
              <Card title="DVR Configuration" size="small">
                <Form.Item
                  name={['dvr', 'enable']}
                  label="Enable DVR"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name={['dvr', 'maxDuration']}
                  label="Max Duration (seconds)"
                >
                  <InputNumber min={1} max={86400} placeholder="3600" />
                </Form.Item>
                
                <Form.Item
                  name={['dvr', 'maxSegments']}
                  label="Max Segments"
                >
                  <InputNumber min={1} max={100} placeholder="10" />
                </Form.Item>
              </Card>
            </TabPane>
          </Tabs>
          
          <Divider />
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingApplication ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ApplicationManagement;
