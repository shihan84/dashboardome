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
  Typography,
  Progress,
  Timeline,
  Switch
} from 'antd';
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  LockOutlined,
  UnlockOutlined,
  GlobalOutlined,
  CalendarOutlined,
  KeyOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useStore } from '../../store/useStore';
import { OMEApiService } from '../../services/omeApi';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface SSLCertificate {
  id: string;
  domain: string;
  issuer: string;
  status: 'valid' | 'expired' | 'expiring' | 'invalid';
  validFrom: string;
  validTo: string;
  daysUntilExpiry: number;
  keySize: number;
  algorithm: string;
  certificatePath: string;
  privateKeyPath: string;
  autoRenewal: boolean;
  lastRenewed?: string;
}

interface CertificateFormData {
  domain: string;
  certificatePath: string;
  privateKeyPath: string;
  autoRenewal: boolean;
}

const SSLCertificateManager: React.FC = () => {
  const { omeHost, omePort } = useStore();
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState<SSLCertificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<SSLCertificate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<SSLCertificate | null>(null);
  const [form] = Form.useForm();

  // Mock data for demonstration - in real implementation, this would come from OME API
  const mockCertificates: SSLCertificate[] = [
    {
      id: '1',
      domain: 'yourdomain.com',
      issuer: 'Let\'s Encrypt',
      status: 'valid',
      validFrom: '2024-01-01',
      validTo: '2024-04-01',
      daysUntilExpiry: 45,
      keySize: 2048,
      algorithm: 'RSA',
      certificatePath: '/etc/letsencrypt/live/yourdomain.com/fullchain.pem',
      privateKeyPath: '/etc/letsencrypt/live/yourdomain.com/privkey.pem',
      autoRenewal: true,
      lastRenewed: '2024-01-01'
    },
    {
      id: '2',
      domain: 'stream.yourdomain.com',
      issuer: 'Let\'s Encrypt',
      status: 'expiring',
      validFrom: '2023-12-01',
      validTo: '2024-03-01',
      daysUntilExpiry: 15,
      keySize: 2048,
      algorithm: 'RSA',
      certificatePath: '/etc/letsencrypt/live/stream.yourdomain.com/fullchain.pem',
      privateKeyPath: '/etc/letsencrypt/live/stream.yourdomain.com/privkey.pem',
      autoRenewal: true,
      lastRenewed: '2023-12-01'
    }
  ];

  const loadCertificates = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call OME API to get certificate information
      // For now, using mock data
      setTimeout(() => {
        setCertificates(mockCertificates);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load certificates:', error);
      message.error('Failed to load certificates');
      setLoading(false);
    }
  };

  const handleCreateCertificate = async (values: CertificateFormData) => {
    try {
      // In a real implementation, this would call OME API to create/configure certificate
      const newCertificate: SSLCertificate = {
        id: Date.now().toString(),
        domain: values.domain,
        issuer: 'Let\'s Encrypt',
        status: 'valid',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        daysUntilExpiry: 90,
        keySize: 2048,
        algorithm: 'RSA',
        certificatePath: values.certificatePath,
        privateKeyPath: values.privateKeyPath,
        autoRenewal: values.autoRenewal
      };
      
      setCertificates(prev => [...prev, newCertificate]);
      message.success('Certificate configuration updated successfully');
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Failed to create certificate:', error);
      message.error('Failed to create certificate');
    }
  };

  const handleRenewCertificate = async (certificateId: string) => {
    try {
      // In a real implementation, this would trigger certificate renewal
      message.success('Certificate renewal initiated');
      loadCertificates();
    } catch (error) {
      console.error('Failed to renew certificate:', error);
      message.error('Failed to renew certificate');
    }
  };

  const handleTestCertificate = async (certificateId: string) => {
    try {
      // In a real implementation, this would test the certificate
      message.success('Certificate test completed successfully');
    } catch (error) {
      console.error('Certificate test failed:', error);
      message.error('Certificate test failed');
    }
  };

  const openCreateModal = () => {
    setEditingCertificate(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (certificate: SSLCertificate) => {
    setEditingCertificate(certificate);
    form.setFieldsValue({
      domain: certificate.domain,
      certificatePath: certificate.certificatePath,
      privateKeyPath: certificate.privateKeyPath,
      autoRenewal: certificate.autoRenewal
    });
    setModalVisible(true);
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'success';
      case 'expiring': return 'warning';
      case 'expired': return 'error';
      case 'invalid': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'valid': return 'Valid';
      case 'expiring': return 'Expiring Soon';
      case 'expired': return 'Expired';
      case 'invalid': return 'Invalid';
      default: return 'Unknown';
    }
  };

  const columns = [
    {
      title: 'Domain',
      dataIndex: 'domain',
      key: 'domain',
      render: (text: string) => (
        <Space>
          <GlobalOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Issuer',
      dataIndex: 'issuer',
      key: 'issuer',
      render: (issuer: string) => (
        <Tag color="blue">{issuer}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={getStatusColor(status)} text={getStatusText(status)} />
      ),
    },
    {
      title: 'Expires',
      dataIndex: 'validTo',
      key: 'validTo',
      render: (validTo: string, record: SSLCertificate) => (
        <Space direction="vertical" size="small">
          <Text>{validTo}</Text>
          <Text type="secondary">({record.daysUntilExpiry} days)</Text>
        </Space>
      ),
    },
    {
      title: 'Auto Renewal',
      dataIndex: 'autoRenewal',
      key: 'autoRenewal',
      render: (autoRenewal: boolean) => (
        <Tag color={autoRenewal ? 'green' : 'default'}>
          {autoRenewal ? 'Enabled' : 'Disabled'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: SSLCertificate) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<InfoCircleOutlined />}
              onClick={() => setSelectedCertificate(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Test Certificate">
            <Button
              icon={<CheckCircleOutlined />}
              onClick={() => handleTestCertificate(record.id)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Renew Certificate">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => handleRenewCertificate(record.id)}
              size="small"
              disabled={record.status === 'valid' && record.daysUntilExpiry > 30}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
              size="small"
            />
          </Tooltip>
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
              <SafetyCertificateOutlined /> SSL Certificate Management
            </Title>
            <Text type="secondary">Manage SSL/TLS certificates for secure streaming</Text>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadCertificates}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Configure Certificate
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Certificates"
                value={certificates.length}
                prefix={<SafetyCertificateOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Valid Certificates"
                value={certificates.filter(c => c.status === 'valid').length}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Expiring Soon"
                value={certificates.filter(c => c.status === 'expiring').length}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Auto Renewal"
                value={certificates.filter(c => c.autoRenewal).length}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {certificates.filter(c => c.status === 'expiring' || c.status === 'expired').length > 0 && (
          <Alert
            message="Certificate Alert"
            description={`${certificates.filter(c => c.status === 'expiring' || c.status === 'expired').length} certificate(s) need attention. Please renew them to avoid service interruption.`}
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="SSL Certificates" size="small">
              <Table
                columns={columns}
                dataSource={certificates}
                rowKey="id"
                loading={loading}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            {selectedCertificate ? (
              <Card title="Certificate Details" size="small">
                <Tabs defaultActiveKey="general" size="small">
                  <TabPane tab="General" key="general">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Domain">
                        <Text code>{selectedCertificate.domain}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Issuer">
                        <Tag color="blue">{selectedCertificate.issuer}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Badge status={getStatusColor(selectedCertificate.status)} text={getStatusText(selectedCertificate.status)} />
                      </Descriptions.Item>
                      <Descriptions.Item label="Valid From">
                        <Text>{selectedCertificate.validFrom}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Valid To">
                        <Text>{selectedCertificate.validTo}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Days Until Expiry">
                        <Text type={selectedCertificate.daysUntilExpiry < 30 ? 'danger' : 'secondary'}>
                          {selectedCertificate.daysUntilExpiry} days
                        </Text>
                      </Descriptions.Item>
                    </Descriptions>
                  </TabPane>
                  
                  <TabPane tab="Technical" key="technical">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Key Size">
                        <Text>{selectedCertificate.keySize} bits</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Algorithm">
                        <Text>{selectedCertificate.algorithm}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Certificate Path">
                        <Text code>{selectedCertificate.certificatePath}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Private Key Path">
                        <Text code>{selectedCertificate.privateKeyPath}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Auto Renewal">
                        <Tag color={selectedCertificate.autoRenewal ? 'green' : 'default'}>
                          {selectedCertificate.autoRenewal ? 'Enabled' : 'Disabled'}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </TabPane>
                  
                  <TabPane tab="Timeline" key="timeline">
                    <Timeline size="small">
                      <Timeline.Item color="green">
                        Certificate issued
                      </Timeline.Item>
                      {selectedCertificate.lastRenewed && (
                        <Timeline.Item color="blue">
                          Last renewed: {selectedCertificate.lastRenewed}
                        </Timeline.Item>
                      )}
                      <Timeline.Item color="gray">
                        Expires: {selectedCertificate.validTo}
                      </Timeline.Item>
                    </Timeline>
                  </TabPane>
                </Tabs>
              </Card>
            ) : (
              <Card title="Select a Certificate" size="small">
                <Text type="secondary">Click on a certificate to view details</Text>
              </Card>
            )}
          </Col>
        </Row>
      </Card>

      <Modal
        title={editingCertificate ? 'Edit Certificate Configuration' : 'Configure SSL Certificate'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingCertificate(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateCertificate}
          initialValues={{
            autoRenewal: true
          }}
        >
          <Form.Item
            name="domain"
            label="Domain Name"
            rules={[{ required: true, message: 'Please enter domain name' }]}
          >
            <Input placeholder="e.g., yourdomain.com" />
          </Form.Item>
          
          <Form.Item
            name="certificatePath"
            label="Certificate File Path"
            rules={[{ required: true, message: 'Please enter certificate path' }]}
          >
            <Input placeholder="/etc/letsencrypt/live/yourdomain.com/fullchain.pem" />
          </Form.Item>
          
          <Form.Item
            name="privateKeyPath"
            label="Private Key File Path"
            rules={[{ required: true, message: 'Please enter private key path' }]}
          >
            <Input placeholder="/etc/letsencrypt/live/yourdomain.com/privkey.pem" />
          </Form.Item>
          
          <Form.Item
            name="autoRenewal"
            label="Enable Auto Renewal"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Alert
            message="Certificate Setup"
            description="Make sure the certificate files exist and are readable by the OME process. Use Let's Encrypt for free SSL certificates."
            type="info"
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingCertificate ? 'Update' : 'Configure'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SSLCertificateManager;
