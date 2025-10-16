import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Switch,
  Select,
  Row,
  Col,
  Alert,
  Image,
  Spin,
  message,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  CameraOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;
const { Option } = Select;

interface ThumbnailConfig {
  enabled: boolean;
  interval: number;
  width: number;
  height: number;
  quality: number;
  format: string;
  crossDomains?: {
    urls?: string[];
    headers?: Array<{ key: string; value: string }>;
  };
}

interface Thumbnail {
  id: string;
  streamName: string;
  timestamp: number;
  url: string;
  size: number;
  width: number;
  height: number;
}

export const ThumbnailManager: React.FC = () => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  const [loading, setLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [config, setConfig] = useState<ThumbnailConfig>({
    enabled: false,
    interval: 10,
    width: 320,
    height: 240,
    quality: 80,
    format: 'jpeg',
  });
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [selectedVHost, setSelectedVHost] = useState<string>('default');
  const [selectedApp, setSelectedApp] = useState<string>('app');
  const [vhosts, setVhosts] = useState<string[]>([]);
  const [applications, setApplications] = useState<string[]>([]);

  const [configForm] = Form.useForm();

  useEffect(() => {
    loadVHosts();
    loadThumbnailConfig();
    loadThumbnails();
  }, [selectedVHost, selectedApp]);

  const loadVHosts = async () => {
    try {
      const response = await omeApi.getVHosts();
      if (response.success) {
        setVhosts(response.data);
        if (response.data.length > 0 && !selectedVHost) {
          setSelectedVHost(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load virtual hosts:', error);
    }
  };

  const loadApplications = async (vhost: string) => {
    try {
      const response = await omeApi.getApplications(vhost);
      if (response.success) {
        setApplications(response.data);
        if (response.data.length > 0 && !selectedApp) {
          setSelectedApp(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  };

  const loadThumbnailConfig = async () => {
    setLoading(true);
    try {
      // This would be a real API call to get thumbnail configuration
      // For now, we'll use the default config
      setConfig({
        enabled: false,
        interval: 10,
        width: 320,
        height: 240,
        quality: 80,
        format: 'jpeg',
      });
    } catch (error) {
      message.error('Failed to load thumbnail configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadThumbnails = async () => {
    setLoading(true);
    try {
      // This would be a real API call to get thumbnails
      // For now, we'll simulate some data
      const mockThumbnails: Thumbnail[] = [
        {
          id: '1',
          streamName: 'test_stream',
          timestamp: Date.now() - 60000,
          url: 'https://via.placeholder.com/320x240/FF6B6B/FFFFFF?text=Thumbnail+1',
          size: 15420,
          width: 320,
          height: 240,
        },
        {
          id: '2',
          streamName: 'test_stream',
          timestamp: Date.now() - 30000,
          url: 'https://via.placeholder.com/320x240/4ECDC4/FFFFFF?text=Thumbnail+2',
          size: 16230,
          width: 320,
          height: 240,
        },
      ];
      setThumbnails(mockThumbnails);
    } catch (error) {
      message.error('Failed to load thumbnails');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSubmit = async (values: ThumbnailConfig) => {
    try {
      // This would be a real API call to update thumbnail configuration
      setConfig(values);
      setConfigModalVisible(false);
      message.success('Thumbnail configuration updated successfully');
    } catch (error) {
      message.error('Failed to update thumbnail configuration');
    }
  };

  const handleDeleteThumbnail = async (id: string) => {
    try {
      // This would be a real API call to delete thumbnail
      setThumbnails(thumbnails.filter(t => t.id !== id));
      message.success('Thumbnail deleted successfully');
    } catch (error) {
      message.error('Failed to delete thumbnail');
    }
  };

  const handlePreviewThumbnail = (thumbnail: Thumbnail) => {
    setPreviewImage(thumbnail.url);
    setPreviewModalVisible(true);
  };

  const handleDownloadThumbnail = (thumbnail: Thumbnail) => {
    const link = document.createElement('a');
    link.href = thumbnail.url;
    link.download = `thumbnail_${thumbnail.streamName}_${thumbnail.timestamp}.${config.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: 'Thumbnail',
      dataIndex: 'url',
      key: 'thumbnail',
      width: 100,
      render: (url: string, record: Thumbnail) => (
        <Image
          src={url}
          alt={`Thumbnail ${record.id}`}
          width={60}
          height={45}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          preview={false}
        />
      ),
    },
    {
      title: 'Stream Name',
      dataIndex: 'streamName',
      key: 'streamName',
      render: (name: string) => (
        <Space>
          <PlayCircleOutlined />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp).toLocaleString(),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => `${(size / 1024).toFixed(1)} KB`,
    },
    {
      title: 'Dimensions',
      key: 'dimensions',
      render: (record: Thumbnail) => `${record.width}x${record.height}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Thumbnail) => (
        <Space>
          <Tooltip title="Preview">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreviewThumbnail(record)}
            />
          </Tooltip>
          <Tooltip title="Download">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadThumbnail(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete thumbnail?"
            description="This action cannot be undone."
            onConfirm={() => handleDeleteThumbnail(record.id)}
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
      <Card
        title={
          <Space>
            <CameraOutlined />
            <Title level={4} style={{ margin: 0 }}>Thumbnail Management</Title>
          </Space>
        }
        extra={
          <Space>
            <Select
              style={{ width: 150 }}
              value={selectedVHost}
              onChange={(value) => {
                setSelectedVHost(value);
                loadApplications(value);
              }}
            >
              {vhosts.map(vhost => (
                <Option key={vhost} value={vhost}>{vhost}</Option>
              ))}
            </Select>
            <Select
              style={{ width: 150 }}
              value={selectedApp}
              onChange={setSelectedApp}
            >
              {applications.map(app => (
                <Option key={app} value={app}>{app}</Option>
              ))}
            </Select>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setConfigModalVisible(true)}
            >
              Configure
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadThumbnails}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <Alert
          message="Thumbnail Generation"
          description={
            <div>
              <p>Configure automatic thumbnail generation for your streams.</p>
              <p><strong>Current Status:</strong> {config.enabled ? 'Enabled' : 'Disabled'}</p>
              {config.enabled && (
                <p>
                  <strong>Settings:</strong> {config.width}x{config.height} @ {config.interval}s intervals, 
                  {config.quality}% quality, {config.format.toUpperCase()} format
                </p>
              )}
            </div>
          }
          type={config.enabled ? 'success' : 'info'}
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={thumbnails}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          locale={{
            emptyText: 'No thumbnails found. Enable thumbnail generation to start capturing thumbnails.',
          }}
        />
      </Card>

      {/* Configuration Modal */}
      <Modal
        title="Thumbnail Configuration"
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        onOk={() => configForm.submit()}
        width={600}
      >
        <Form
          form={configForm}
          layout="vertical"
          initialValues={config}
          onFinish={handleConfigSubmit}
        >
          <Form.Item
            name="enabled"
            label="Enable Thumbnail Generation"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="interval"
                label="Capture Interval (seconds)"
                rules={[{ required: true, message: 'Please enter capture interval' }]}
              >
                <Input type="number" min={1} max={300} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="format"
                label="Image Format"
                rules={[{ required: true, message: 'Please select format' }]}
              >
                <Select>
                  <Option value="jpeg">JPEG</Option>
                  <Option value="png">PNG</Option>
                  <Option value="webp">WebP</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="width"
                label="Width (pixels)"
                rules={[{ required: true, message: 'Please enter width' }]}
              >
                <Input type="number" min={64} max={1920} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="height"
                label="Height (pixels)"
                rules={[{ required: true, message: 'Please enter height' }]}
              >
                <Input type="number" min={64} max={1080} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="quality"
            label="Quality (%)"
            rules={[{ required: true, message: 'Please enter quality' }]}
          >
            <Input type="number" min={1} max={100} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title="Thumbnail Preview"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        <div style={{ textAlign: 'center' }}>
          <Image
            src={previewImage}
            alt="Thumbnail Preview"
            style={{ maxWidth: '100%', maxHeight: '500px' }}
          />
        </div>
      </Modal>
    </div>
  );
};
