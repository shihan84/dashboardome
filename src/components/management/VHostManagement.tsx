import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
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
  Alert,
  Descriptions,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CloudServerOutlined,
  SecurityScanOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  GlobalOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import { useStore } from '../../store/useStore';
import { OMEApiService } from '../../services/omeApi';
import type { OMEVHost, OMEVHostDetailed } from '../../types';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface VHostFormData {
  name: string;
  domain: string;
  tls: boolean;
  signedPolicy: {
    policyQueryKeyName: string;
    policyQueryKeyValue: string;
    secretKey: string;
    enable: boolean;
  };
  admissionWebhooks: {
    enable: boolean;
    controlServerUri: string;
    secretKey: string;
    timeout: number;
  };
  origins: {
    location: string;
    pass: string;
    failback: string;
  }[];
}

const VHostManagement: React.FC = () => {
  const { omeHost, omePort } = useStore();
  const [loading, setLoading] = useState(false);
  const [vhosts, setVHosts] = useState<OMEVHost[]>([]);
  const [selectedVHost, setSelectedVHost] = useState<OMEVHostDetailed | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVHost, setEditingVHost] = useState<OMEVHostDetailed | null>(null);
  const [form] = Form.useForm();

  const loadVHosts = async () => {
    setLoading(true);
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const response = await omeApi.getVHosts();
      if (response.success) {
        setVHosts(response.data);
      } else {
        message.error('Failed to load virtual hosts');
      }
    } catch (error) {
      console.error('Failed to load virtual hosts:', error);
      message.error('Failed to load virtual hosts');
    } finally {
      setLoading(false);
    }
  };

  const loadVHostDetails = async (vhostName: string) => {
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const details = await omeApi.getVHostDetailed(vhostName);
      setSelectedVHost(details);
    } catch (error) {
      console.error('Failed to load vhost details:', error);
      message.error('Failed to load virtual host details');
    }
  };

  const handleCreateVHost = async (values: VHostFormData) => {
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const vhostData: OMEVHostDetailed = {
        name: values.name,
        domain: values.domain,
        tls: values.tls,
        signedPolicy: values.signedPolicy,
        admissionWebhooks: values.admissionWebhooks,
        origins: values.origins
      };
      
      await omeApi.createVHost(vhostData);
      message.success('Virtual host created successfully');
      setModalVisible(false);
      form.resetFields();
      loadVHosts();
    } catch (error) {
      console.error('Failed to create virtual host:', error);
      message.error('Failed to create virtual host');
    }
  };

  const handleUpdateVHost = async (values: VHostFormData) => {
    if (!editingVHost) return;
    
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      const vhostData: Partial<OMEVHostDetailed> = {
        domain: values.domain,
        tls: values.tls,
        signedPolicy: values.signedPolicy,
        admissionWebhooks: values.admissionWebhooks,
        origins: values.origins
      };
      
      await omeApi.updateVHost(editingVHost.name, vhostData);
      message.success('Virtual host updated successfully');
      setModalVisible(false);
      setEditingVHost(null);
      form.resetFields();
      loadVHosts();
      if (selectedVHost?.name === editingVHost.name) {
        loadVHostDetails(editingVHost.name);
      }
    } catch (error) {
      console.error('Failed to update virtual host:', error);
      message.error('Failed to update virtual host');
    }
  };

  const handleDeleteVHost = async (vhostName: string) => {
    try {
      const omeApi = new OMEApiService(omeHost, omePort);
      await omeApi.deleteVHost(vhostName);
      message.success('Virtual host deleted successfully');
      loadVHosts();
      if (selectedVHost?.name === vhostName) {
        setSelectedVHost(null);
      }
    } catch (error) {
      console.error('Failed to delete virtual host:', error);
      message.error('Failed to delete virtual host');
    }
  };

  const openCreateModal = () => {
    setEditingVHost(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (vhost: OMEVHost) => {
    loadVHostDetails(vhost.name);
    setEditingVHost(null); // Will be set after details load
    setModalVisible(true);
  };

  useEffect(() => {
    loadVHosts();
  }, []);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <CloudServerOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Domain',
      dataIndex: 'domain',
      key: 'domain',
      render: (domain: string) => (
        <Space>
          <GlobalOutlined />
          <Text code>{domain || 'default'}</Text>
        </Space>
      ),
    },
    {
      title: 'TLS',
      dataIndex: 'tls',
      key: 'tls',
      render: (tls: boolean) => (
        <Tag color={tls ? 'green' : 'default'} icon={tls ? <LockOutlined /> : <UnlockOutlined />}>
          {tls ? 'Enabled' : 'Disabled'}
        </Tag>
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
      render: (_, record: OMEVHost) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<InfoCircleOutlined />}
              onClick={() => loadVHostDetails(record.name)}
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
            title="Are you sure you want to delete this virtual host?"
            onConfirm={() => handleDeleteVHost(record.name)}
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
              <CloudServerOutlined /> Virtual Host Management
            </Title>
            <Text type="secondary">Manage virtual hosts, domains, and security settings</Text>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadVHosts}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Create Virtual Host
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Total Virtual Hosts"
                value={vhosts.length}
                prefix={<CloudServerOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="TLS Enabled"
                value={vhosts.filter(v => v.tls).length}
                prefix={<LockOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Active Hosts"
                value={vhosts.length}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="Virtual Hosts" size="small">
              <Table
                columns={columns}
                dataSource={vhosts}
                rowKey="name"
                loading={loading}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            {selectedVHost ? (
              <Card title="Virtual Host Details" size="small">
                <Tabs defaultActiveKey="general" size="small">
                  <TabPane tab="General" key="general">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Name">
                        <Text code>{selectedVHost.name}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Domain">
                        <Text code>{selectedVHost.domain || 'default'}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="TLS">
                        <Tag color={selectedVHost.tls ? 'green' : 'default'}>
                          {selectedVHost.tls ? 'Enabled' : 'Disabled'}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </TabPane>
                  
                  <TabPane tab="Security" key="security">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Signed Policy</Text>
                        <br />
                        <Tag color={selectedVHost.signedPolicy?.enable ? 'green' : 'default'}>
                          {selectedVHost.signedPolicy?.enable ? 'Enabled' : 'Disabled'}
                        </Tag>
                      </div>
                      <div>
                        <Text strong>Admission Webhooks</Text>
                        <br />
                        <Tag color={selectedVHost.admissionWebhooks?.enable ? 'green' : 'default'}>
                          {selectedVHost.admissionWebhooks?.enable ? 'Enabled' : 'Disabled'}
                        </Tag>
                      </div>
                    </Space>
                  </TabPane>
                  
                  <TabPane tab="Origins" key="origins">
                    {selectedVHost.origins && selectedVHost.origins.length > 0 ? (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {selectedVHost.origins.map((origin, index) => (
                          <Card key={index} size="small">
                            <Text code>{origin.location}</Text>
                          </Card>
                        ))}
                      </Space>
                    ) : (
                      <Text type="secondary">No origins configured</Text>
                    )}
                  </TabPane>
                </Tabs>
              </Card>
            ) : (
              <Card title="Select a Virtual Host" size="small">
                <Text type="secondary">Click on a virtual host to view details</Text>
              </Card>
            )}
          </Col>
        </Row>
      </Card>

      <Modal
        title={editingVHost ? 'Edit Virtual Host' : 'Create Virtual Host'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingVHost(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingVHost ? handleUpdateVHost : handleCreateVHost}
          initialValues={{
            tls: false,
            signedPolicy: {
              enable: false,
              policyQueryKeyName: 'policy',
              policyQueryKeyValue: '',
              secretKey: '',
              timeout: 30000
            },
            admissionWebhooks: {
              enable: false,
              controlServerUri: '',
              secretKey: '',
              timeout: 30000
            },
            origins: []
          }}
        >
          <Tabs defaultActiveKey="general">
            <TabPane tab="General" key="general">
              <Form.Item
                name="name"
                label="Virtual Host Name"
                rules={[{ required: true, message: 'Please enter virtual host name' }]}
              >
                <Input placeholder="e.g., default" disabled={!!editingVHost} />
              </Form.Item>
              
              <Form.Item
                name="domain"
                label="Domain"
                rules={[{ required: true, message: 'Please enter domain' }]}
              >
                <Input placeholder="e.g., example.com" />
              </Form.Item>
              
              <Form.Item
                name="tls"
                label="Enable TLS"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </TabPane>
            
            <TabPane tab="Security" key="security">
              <Card title="Signed Policy" size="small" style={{ marginBottom: 16 }}>
                <Form.Item
                  name={['signedPolicy', 'enable']}
                  label="Enable Signed Policy"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name={['signedPolicy', 'policyQueryKeyName']}
                  label="Policy Query Key Name"
                >
                  <Input placeholder="policy" />
                </Form.Item>
                
                <Form.Item
                  name={['signedPolicy', 'secretKey']}
                  label="Secret Key"
                >
                  <Input.Password placeholder="Enter secret key" />
                </Form.Item>
              </Card>
              
              <Card title="Admission Webhooks" size="small">
                <Form.Item
                  name={['admissionWebhooks', 'enable']}
                  label="Enable Admission Webhooks"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name={['admissionWebhooks', 'controlServerUri']}
                  label="Control Server URI"
                >
                  <Input placeholder="http://example.com/webhook" />
                </Form.Item>
                
                <Form.Item
                  name={['admissionWebhooks', 'secretKey']}
                  label="Secret Key"
                >
                  <Input.Password placeholder="Enter secret key" />
                </Form.Item>
                
                <Form.Item
                  name={['admissionWebhooks', 'timeout']}
                  label="Timeout (ms)"
                >
                  <Input type="number" placeholder="30000" />
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
                {editingVHost ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VHostManagement;
