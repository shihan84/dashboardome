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
  Tabs,
  Descriptions,
  message,
  Tooltip,
  Popconfirm,
  Badge,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  CopyOutlined,
  LinkOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface HLSConfig {
  enabled: boolean;
  chunkDuration: number;
  partHoldBack: number;
  enablePreloadHint: boolean;
  drm?: {
    enable: boolean;
    infoFile: string;
  };
}

interface HLSPlaylist {
  id: string;
  streamName: string;
  type: 'master' | 'media';
  url: string;
  duration: number;
  segments: number;
  lastModified: number;
  size: number;
}

interface HLSSegment {
  id: string;
  streamName: string;
  sequence: number;
  duration: number;
  size: number;
  url: string;
  timestamp: number;
}

export const HLSManager: React.FC = () => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<HLSPlaylist[]>([]);
  const [segments, setSegments] = useState<HLSSegment[]>([]);
  const [config, setConfig] = useState<HLSConfig>({
    enabled: true,
    chunkDuration: 2,
    partHoldBack: 1,
    enablePreloadHint: true,
    drm: {
      enable: false,
      infoFile: '',
    },
  });
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<HLSPlaylist | null>(null);
  const [selectedVHost, setSelectedVHost] = useState<string>('default');
  const [selectedApp, setSelectedApp] = useState<string>('app');
  const [vhosts, setVhosts] = useState<string[]>([]);
  const [applications, setApplications] = useState<string[]>([]);

  const [configForm] = Form.useForm();

  useEffect(() => {
    loadVHosts();
    loadHLSConfig();
    loadPlaylists();
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

  const loadHLSConfig = async () => {
    setLoading(true);
    try {
      // This would be a real API call to get HLS configuration
      setConfig({
        enabled: true,
        chunkDuration: 2,
        partHoldBack: 1,
        enablePreloadHint: true,
        drm: {
          enable: false,
          infoFile: '',
        },
      });
    } catch (error) {
      message.error('Failed to load HLS configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      // This would be a real API call to get HLS playlists
      const mockPlaylists: HLSPlaylist[] = [
        {
          id: '1',
          streamName: 'test_stream',
          type: 'master',
          url: `http://${omeHost}:8080/${selectedApp}/test_stream/playlist.m3u8`,
          duration: 0,
          segments: 0,
          lastModified: Date.now(),
          size: 1024,
        },
        {
          id: '2',
          streamName: 'test_stream_720p',
          type: 'media',
          url: `http://${omeHost}:8080/${selectedApp}/test_stream_720p/playlist.m3u8`,
          duration: 120,
          segments: 60,
          lastModified: Date.now() - 30000,
          size: 2048,
        },
      ];
      setPlaylists(mockPlaylists);
    } catch (error) {
      message.error('Failed to load HLS playlists');
    } finally {
      setLoading(false);
    }
  };

  const loadSegments = async (playlist: HLSPlaylist) => {
    setLoading(true);
    try {
      // This would be a real API call to get HLS segments
      const mockSegments: HLSSegment[] = Array.from({ length: playlist.segments }, (_, i) => ({
        id: `${playlist.id}_${i}`,
        streamName: playlist.streamName,
        sequence: i,
        duration: playlist.duration / playlist.segments,
        size: Math.floor(Math.random() * 50000) + 10000,
        url: `${playlist.url.replace('playlist.m3u8', '')}segment_${i}.ts`,
        timestamp: Date.now() - (playlist.segments - i) * 2000,
      }));
      setSegments(mockSegments);
    } catch (error) {
      message.error('Failed to load HLS segments');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSubmit = async (values: HLSConfig) => {
    try {
      setConfig(values);
      setConfigModalVisible(false);
      message.success('HLS configuration updated successfully');
    } catch (error) {
      message.error('Failed to update HLS configuration');
    }
  };

  const handleViewPlaylist = (playlist: HLSPlaylist) => {
    setSelectedPlaylist(playlist);
    setPlaylistModalVisible(true);
    loadSegments(playlist);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    message.success('URL copied to clipboard');
  };

  const handleDeletePlaylist = async (id: string) => {
    try {
      setPlaylists(playlists.filter(p => p.id !== id));
      message.success('Playlist deleted successfully');
    } catch (error) {
      message.error('Failed to delete playlist');
    }
  };

  const playlistColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'master' ? 'blue' : 'green'}>
          {type === 'master' ? 'Master' : 'Media'}
        </Tag>
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
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => duration > 0 ? `${duration}s` : 'Live',
    },
    {
      title: 'Segments',
      dataIndex: 'segments',
      key: 'segments',
      render: (segments: number) => (
        <Badge count={segments} style={{ backgroundColor: '#52c41a' }} />
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => `${(size / 1024).toFixed(1)} KB`,
    },
    {
      title: 'Last Modified',
      dataIndex: 'lastModified',
      key: 'lastModified',
      render: (timestamp: number) => new Date(timestamp).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: HLSPlaylist) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewPlaylist(record)}
            />
          </Tooltip>
          <Tooltip title="Copy URL">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCopyUrl(record.url)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete playlist?"
            description="This action cannot be undone."
            onConfirm={() => handleDeletePlaylist(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<PauseCircleOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const segmentColumns = [
    {
      title: 'Sequence',
      dataIndex: 'sequence',
      key: 'sequence',
      width: 80,
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => `${duration.toFixed(1)}s`,
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => `${(size / 1024).toFixed(1)} KB`,
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: HLSSegment) => (
        <Space>
          <Tooltip title="Copy URL">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCopyUrl(record.url)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <ThunderboltOutlined />
            <Title level={4} style={{ margin: 0 }}>HLS/LLHLS Management</Title>
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
              onClick={loadPlaylists}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <Alert
          message="HLS/LLHLS Streaming"
          description={
            <div>
              <p>Manage HLS and LLHLS playlists and segments for your streams.</p>
              <p><strong>Status:</strong> {config.enabled ? 'Enabled' : 'Disabled'}</p>
              {config.enabled && (
                <p>
                  <strong>Configuration:</strong> {config.chunkDuration}s chunks, 
                  {config.partHoldBack} part holdback, 
                  {config.enablePreloadHint ? 'Preload hints enabled' : 'Preload hints disabled'}
                </p>
              )}
            </div>
          }
          type={config.enabled ? 'success' : 'info'}
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={playlistColumns}
          dataSource={playlists}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          locale={{
            emptyText: 'No HLS playlists found. Start streaming to generate playlists.',
          }}
        />
      </Card>

      {/* Configuration Modal */}
      <Modal
        title="HLS Configuration"
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
            label="Enable HLS/LLHLS"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="chunkDuration"
                label="Chunk Duration (seconds)"
                rules={[{ required: true, message: 'Please enter chunk duration' }]}
              >
                <Input type="number" min={1} max={10} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="partHoldBack"
                label="Part Holdback (seconds)"
                rules={[{ required: true, message: 'Please enter part holdback' }]}
              >
                <Input type="number" min={0} max={5} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="enablePreloadHint"
            label="Enable Preload Hints"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={['drm', 'enable']}
            label="Enable DRM"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={['drm', 'infoFile']}
            label="DRM Info File Path"
            dependencies={[['drm', 'enable']]}
          >
            <Input placeholder="/path/to/drm/info.json" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Playlist Details Modal */}
      <Modal
        title={`Playlist Details - ${selectedPlaylist?.streamName}`}
        open={playlistModalVisible}
        onCancel={() => setPlaylistModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPlaylistModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={1000}
      >
        {selectedPlaylist && (
          <Tabs defaultActiveKey="info">
            <TabPane tab="Playlist Info" key="info">
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Stream Name">{selectedPlaylist.streamName}</Descriptions.Item>
                <Descriptions.Item label="Type">{selectedPlaylist.type}</Descriptions.Item>
                <Descriptions.Item label="URL">
                  <Space>
                    <Text code>{selectedPlaylist.url}</Text>
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyUrl(selectedPlaylist.url)}
                    />
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Duration">{selectedPlaylist.duration}s</Descriptions.Item>
                <Descriptions.Item label="Segments">{selectedPlaylist.segments}</Descriptions.Item>
                <Descriptions.Item label="Size">{(selectedPlaylist.size / 1024).toFixed(1)} KB</Descriptions.Item>
                <Descriptions.Item label="Last Modified">
                  {new Date(selectedPlaylist.lastModified).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>
            <TabPane tab="Segments" key="segments">
              <Table
                columns={segmentColumns}
                dataSource={segments}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 20 }}
                scroll={{ x: 600 }}
                size="small"
              />
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};
