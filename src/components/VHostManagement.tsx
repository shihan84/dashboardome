import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Select,
  Space,
  Typography,
  Tag,
  Popconfirm,
  message,
  Tabs,
  Row,
  Col,
  Divider,
  Alert,
  Tooltip,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  SecurityScanOutlined,
  GlobalOutlined,
  SettingOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import { OMEApiService } from '../services/omeApi';
import type { OMEVHostDetailed, SignedPolicy, AdmissionWebhooks } from '../types/index';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

export const VHostManagement: React.FC = () => {
  const [vhosts, setVHosts] = useState<string[]>([]);
  const [vhostDetails, setVHostDetails] = useState<OMEVHostDetailed[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVHost, setEditingVHost] = useState<OMEVHostDetailed | null>(null);
  const [form] = Form.useForm();
  
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  useEffect(() => {
    loadVHosts();
  }, [omeHost, omePort]);

  const loadVHosts = async () => {
    setLoading(true);
    try {
      const vhostList = await omeApi.getVHosts();
      setVHosts(vhostList);
      
      // Load detailed information for each vhost
      const details = await Promise.all(
        vhostList.map(async (vhost) => {
          try {
            return await omeApi.getVHostDetailed(vhost);
          } catch (error) {
            console.error(`Failed to load details for vhost ${vhost}:`, error);
            return null;
          }
        })
      );
      
      setVHostDetails(details.filter(Boolean) as OMEVHostDetailed[]);
    } catch (error) {
      message.error('Failed to load virtual hosts');
      console.error('Error loading vhosts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVHost = async (values: any) => {
    try {
      const vhostData: OMEVHostDetailed = {
        name: values.name,
        distribution: values.distribution,
        host: values.hostNames ? {
          names: values.hostNames.split(',').map((name: string) => name.trim()),
          tls: values.tlsEnabled ? {
            certPath: values.certPath,
            chainCertPath: values.chainCertPath,
            keyPath: values.keyPath,
          } : undefined,
        } : undefined,
        signedPolicy: values.signedPolicyEnabled ? {
          enables: {
            providers: values.providersEnabled ? 'on' : 'off',
            publishers: values.publishersEnabled ? 'on' : 'off',
          },
          policyQueryKeyName: values.policyQueryKeyName,
          secretKey: values.secretKey,
          signatureQueryKeyName: values.signatureQueryKeyName,
        } : undefined,
        admissionWebhooks: values.admissionWebhooksEnabled ? {
          controlServerUrl: values.controlServerUrl,
          secretKey: values.webhookSecretKey,
          timeout: values.webhookTimeout,
          enables: {
            providers: values.webhookProvidersEnabled ? 'on' : 'off',
            publishers: values.webhookPublishersEnabled ? 'on' : 'off',
          },
        } : undefined,
        origins: values.originsEnabled ? {
          origin: values.origins.map((origin: any) => ({
            location: origin.location,
            pass: {
              schema: origin.schema,
              urls: {
                url: origin.urls.split(',').map((url: string) => url.trim()),
              },
            },
          })),
        } : undefined,
        originMapStore: values.originMapStoreEnabled ? {
          originHostName: values.originHostName,
          redisServer: {
            host: values.redisHost,
            auth: values.redisAuth,
          },
        } : undefined,
      };

      await omeApi.createVHost(vhostData);
      message.success('Virtual host created successfully');
      setModalVisible(false);
      form.resetFields();
      loadVHosts();
    } catch (error) {
      message.error('Failed to create virtual host');
      console.error('Error creating vhost:', error);
    }
  };

  const handleDeleteVHost = async (vhostName: string) => {
    try {
      await omeApi.deleteVHost(vhostName);
      message.success('Virtual host deleted successfully');
      loadVHosts();
    } catch (error) {
      message.error('Failed to delete virtual host');
      console.error('Error deleting vhost:', error);
    }
  };

  const getVHostStatus = (vhost: OMEVHostDetailed) => {
    const hasTLS = vhost.host?.tls;
    const hasSignedPolicy = vhost.signedPolicy;
    const hasAdmissionWebhooks = vhost.admissionWebhooks;
    const hasOrigins = vhost.origins;
    
    return {
      tls: hasTLS,
      security: hasSignedPolicy || hasAdmissionWebhooks,
      origins: hasOrigins,
    };
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <CloudServerOutlined />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Distribution',
      dataIndex: 'distribution',
      key: 'distribution',
      render: (distribution: string) => distribution || 'default',
    },
    {
      title: 'Host Names',
      dataIndex: 'host',
      key: 'hostNames',
      render: (host: any) => (
        <div>
          {host?.names?.map((name: string, index: number) => (
            <Tag key={index} color="blue">{name}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: OMEVHostDetailed) => {
        const status = getVHostStatus(record);
        return (
          <Space>
            {status.tls && <Tag color="green" icon={<SecurityScanOutlined />}>TLS</Tag>}
            {status.security && <Tag color="orange" icon={<SecurityScanOutlined />}>Security</Tag>}
            {status.origins && <Tag color="purple" icon={<GlobalOutlined />}>Origins</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Applications',
      dataIndex: 'applications',
      key: 'applications',
      render: (applications: any) => (
        <Badge count={applications?.application?.length || 0} showZero color="blue" />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: OMEVHostDetailed) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() => {
                setEditingVHost(record);
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingVHost(record);
                setModalVisible(true);
              }}
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
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            <CloudServerOutlined /> Virtual Host Management
          </Title>
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
              onClick={() => {
                setEditingVHost(null);
                setModalVisible(true);
              }}
            >
              Create VHost
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={vhostDetails}
          rowKey="name"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
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
          onFinish={handleCreateVHost}
          initialValues={editingVHost}
        >
          <Tabs defaultActiveKey="basic">
            <TabPane tab="Basic" key="basic">
              <Form.Item
                name="name"
                label="Virtual Host Name"
                rules={[{ required: true, message: 'Please enter virtual host name' }]}
              >
                <Input placeholder="e.g., default" />
              </Form.Item>

              <Form.Item
                name="distribution"
                label="Distribution"
              >
                <Select placeholder="Select distribution">
                  <Option value="default">Default</Option>
                  <Option value="origin">Origin</Option>
                  <Option value="edge">Edge</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="hostNames"
                label="Host Names (comma-separated)"
              >
                <Input placeholder="e.g., localhost, example.com" />
              </Form.Item>
            </TabPane>

            <TabPane tab="TLS" key="tls">
              <Form.Item name="tlsEnabled" valuePropName="checked">
                <Switch /> Enable TLS
              </Form.Item>

              <Form.Item
                name="certPath"
                label="Certificate Path"
                dependencies={['tlsEnabled']}
              >
                <Input placeholder="/path/to/cert.pem" />
              </Form.Item>

              <Form.Item
                name="chainCertPath"
                label="Chain Certificate Path"
                dependencies={['tlsEnabled']}
              >
                <Input placeholder="/path/to/chain.pem" />
              </Form.Item>

              <Form.Item
                name="keyPath"
                label="Private Key Path"
                dependencies={['tlsEnabled']}
              >
                <Input placeholder="/path/to/key.pem" />
              </Form.Item>
            </TabPane>

            <TabPane tab="Security" key="security">
              <Title level={5}>Signed Policy</Title>
              <Form.Item name="signedPolicyEnabled" valuePropName="checked">
                <Switch /> Enable Signed Policy
              </Form.Item>

              <Form.Item
                name="policyQueryKeyName"
                label="Policy Query Key Name"
                dependencies={['signedPolicyEnabled']}
              >
                <Input placeholder="policy" />
              </Form.Item>

              <Form.Item
                name="secretKey"
                label="Secret Key"
                dependencies={['signedPolicyEnabled']}
              >
                <Input.Password placeholder="Enter secret key" />
              </Form.Item>

              <Form.Item
                name="signatureQueryKeyName"
                label="Signature Query Key Name"
                dependencies={['signedPolicyEnabled']}
              >
                <Input placeholder="signature" />
              </Form.Item>

              <Divider />

              <Title level={5}>Admission Webhooks</Title>
              <Form.Item name="admissionWebhooksEnabled" valuePropName="checked">
                <Switch /> Enable Admission Webhooks
              </Form.Item>

              <Form.Item
                name="controlServerUrl"
                label="Control Server URL"
                dependencies={['admissionWebhooksEnabled']}
              >
                <Input placeholder="http://localhost:8080/webhook" />
              </Form.Item>

              <Form.Item
                name="webhookSecretKey"
                label="Webhook Secret Key"
                dependencies={['admissionWebhooksEnabled']}
              >
                <Input.Password placeholder="Enter webhook secret" />
              </Form.Item>

              <Form.Item
                name="webhookTimeout"
                label="Webhook Timeout (ms)"
                dependencies={['admissionWebhooksEnabled']}
              >
                <Input type="number" placeholder="5000" />
              </Form.Item>
            </TabPane>

            <TabPane tab="Origins" key="origins">
              <Form.Item name="originsEnabled" valuePropName="checked">
                <Switch /> Enable Origins
              </Form.Item>

              <Form.Item
                name="originMapStoreEnabled"
                label="Origin Map Store"
                valuePropName="checked"
              >
                <Switch /> Enable Origin Map Store
              </Form.Item>

              <Form.Item
                name="redisHost"
                label="Redis Host"
                dependencies={['originMapStoreEnabled']}
              >
                <Input placeholder="localhost:6379" />
              </Form.Item>

              <Form.Item
                name="redisAuth"
                label="Redis Auth"
                dependencies={['originMapStoreEnabled']}
              >
                <Input.Password placeholder="Redis password" />
              </Form.Item>
            </TabPane>
          </Tabs>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingVHost ? 'Update' : 'Create'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
