import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Alert, 
  Tag, 
  Descriptions, 
  Row, 
  Col, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Switch, 
  Modal, 
  Tabs,
  Progress,
  message,
  Tooltip,
  Statistic
} from 'antd';
import { 
  PlayCircleOutlined, 
  StopOutlined, 
  SettingOutlined, 
  VideoCameraOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DownloadOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useStore } from '../../store/useStore';
import { OMEApiService } from '../../services/omeApi';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

interface Application {
  name: string;
  vhost: string;
}

interface Recording {
  id: string;
  streamName: string;
  startTime: string;
  endTime?: string;
  duration: number;
  filePath: string;
  fileSize: number;
  status: 'recording' | 'completed' | 'failed';
}

interface StreamInfo {
  vhost: string;
  app: string;
  stream: any;
  recordingStatus?: any;
}

export const RecordingManager: React.FC = () => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [streams, setStreams] = useState<StreamInfo[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingConfig, setRecordingConfig] = useState<any>(null);
  const [dvrConfig, setDvrConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [dvrModalVisible, setDvrModalVisible] = useState(false);
  const [recordingModalVisible, setRecordingModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [dvrForm] = Form.useForm();
  const [recordingForm] = Form.useForm();

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const vhosts = await omeApi.getVHosts();
      const allApps: Application[] = [];
      
      for (const vhost of vhosts) {
        const apps = await omeApi.getApplications(vhost.name).catch(() => []);
        for (const app of apps) {
          allApps.push({ name: app.name, vhost: vhost.name });
        }
      }
      
      setApplications(allApps);
      if (allApps.length > 0 && !selectedApp) {
        setSelectedApp(allApps[0]);
      }
    } catch (e: any) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [omeApi, selectedApp]);

  const loadStreams = useCallback(async (app: Application) => {
    if (!app) return;
    
    setLoading(true);
    try {
      const allStreams = await omeApi.getAllStreams();
      const appStreams = allStreams
        .filter(s => s.vhost === app.vhost && s.app === app.name)
        .map(({ vhost, app, stream }) => ({ vhost, app, stream }));

      // Load recording status for each stream
      const streamsWithStatus = await Promise.all(
        appStreams.map(async (streamInfo) => {
          try {
            const status = await omeApi.getRecordingStatusNew(streamInfo.vhost, streamInfo.app, streamInfo.stream.name);
            return { ...streamInfo, recordingStatus: status };
          } catch {
            return streamInfo;
          }
        })
      );

      setStreams(streamsWithStatus);
    } catch (e: any) {
      setError('Failed to load streams');
    } finally {
      setLoading(false);
    }
  }, [omeApi]);

  const loadRecordings = useCallback(async (app: Application) => {
    if (!app) return;
    
    try {
      const recordings = await omeApi.getRecordings(app.vhost, app.name);
      setRecordings(recordings);
    } catch (e: any) {
      console.warn('Failed to load recordings');
    }
  }, [omeApi]);

  const loadRecordingConfig = useCallback(async (app: Application) => {
    if (!app) return;
    
    try {
      const config = await omeApi.getRecordingConfig(app.vhost, app.name);
      setRecordingConfig(config);
    } catch (e: any) {
      console.warn('Failed to load recording config');
    }
  }, [omeApi]);

  const loadDVRConfig = useCallback(async (app: Application) => {
    if (!app) return;
    
    try {
      const config = await omeApi.getDVRConfig(app.vhost, app.name);
      setDvrConfig(config);
    } catch (e: any) {
      console.warn('Failed to load DVR config');
    }
  }, [omeApi]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    if (selectedApp) {
      loadStreams(selectedApp);
      loadRecordings(selectedApp);
      loadRecordingConfig(selectedApp);
      loadDVRConfig(selectedApp);
    }
  }, [selectedApp, loadStreams, loadRecordings, loadRecordingConfig, loadDVRConfig]);

  const handleStartRecording = async (stream: StreamInfo) => {
    try {
      await omeApi.startRecordingNew(stream.vhost, stream.app, stream.stream.name);
      message.success('Recording started');
      loadStreams(selectedApp!);
    } catch (e: any) {
      message.error('Failed to start recording');
    }
  };

  const handleStopRecording = async (stream: StreamInfo) => {
    try {
      await omeApi.stopRecordingNew(stream.vhost, stream.app, stream.stream.name);
      message.success('Recording stopped');
      loadStreams(selectedApp!);
    } catch (e: any) {
      message.error('Failed to stop recording');
    }
  };

  const handleSaveRecordingConfig = async (values: any) => {
    if (!selectedApp) return;
    
    try {
      await omeApi.updateRecordingConfig(selectedApp.vhost, selectedApp.name, values);
      message.success('Recording configuration updated');
      setConfigModalVisible(false);
      loadRecordingConfig(selectedApp);
    } catch (e: any) {
      message.error('Failed to save recording configuration');
    }
  };

  const handleSaveDVRConfig = async (values: any) => {
    if (!selectedApp) return;
    
    try {
      await omeApi.updateDVRConfig(selectedApp.vhost, selectedApp.name, values);
      message.success('DVR configuration updated');
      setDvrModalVisible(false);
      loadDVRConfig(selectedApp);
    } catch (e: any) {
      message.error('Failed to save DVR configuration');
    }
  };

  const handleCreateRecording = async (values: any) => {
    if (!selectedApp) return;
    
    try {
      const recordData = {
        id: values.id,
        stream: {
          name: values.streamName,
          variantNames: values.variantNames ? values.variantNames.split(',').map((name: string) => name.trim()) : [],
        },
        interval: values.interval,
        filePath: values.filePath,
        infoPath: values.infoPath,
        schedule: values.schedule,
        metadata: values.metadata,
        segmentationRule: values.segmentationRule,
      };

      await omeApi.startRecording(selectedApp.vhost, selectedApp.name, recordData);
      message.success('Recording created successfully');
      setRecordingModalVisible(false);
      recordingForm.resetFields();
      loadRecordings(selectedApp);
    } catch (e: any) {
      message.error('Failed to create recording');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const streamColumns = [
    {
      title: 'Stream Name',
      dataIndex: ['stream', 'name'],
      key: 'name',
    },
    {
      title: 'State',
      dataIndex: ['stream', 'state'],
      key: 'state',
      render: (state: string) => (
        <Tag color={state === 'streaming' ? 'green' : 'red'}>
          {state}
        </Tag>
      ),
    },
    {
      title: 'Recording Status',
      key: 'recording',
      render: (_, record: StreamInfo) => {
        const status = record.recordingStatus;
        if (!status) return <Tag>Not Available</Tag>;
        
        return (
          <Space>
            <Tag color={status.recording ? 'red' : 'default'}>
              {status.recording ? 'Recording' : 'Stopped'}
            </Tag>
            {status.recording && status.duration && (
              <Text type="secondary">{Math.floor(status.duration / 60)}m {status.duration % 60}s</Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: StreamInfo) => {
        const isRecording = record.recordingStatus?.recording;
        return (
          <Space>
            {isRecording ? (
              <Button
                icon={<StopOutlined />}
                size="small"
                danger
                onClick={() => handleStopRecording(record)}
              >
                Stop Recording
              </Button>
            ) : (
              <Button
                icon={<PlayCircleOutlined />}
                size="small"
                type="primary"
                onClick={() => handleStartRecording(record)}
                disabled={record.stream.state !== 'streaming'}
              >
                Start Recording
              </Button>
            )}
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                const dvrUrl = omeApi.getDVRPlaylistUrl(record.vhost, record.app, record.stream.name);
                window.open(dvrUrl, '_blank');
              }}
            >
              View DVR
            </Button>
          </Space>
        );
      },
    },
  ];

  const recordingColumns = [
    {
      title: 'Stream',
      dataIndex: 'streamName',
      key: 'streamName',
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => `${Math.floor(duration / 60)}m ${duration % 60}s`,
    },
    {
      title: 'File Size',
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (size: number) => formatBytes(size),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : status === 'recording' ? 'red' : 'default'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Recording) => (
        <Space>
          <Button
            icon={<DownloadOutlined />}
            size="small"
            onClick={() => {
              message.info('Download functionality would be implemented here');
            }}
          >
            Download
          </Button>
        </Space>
      ),
    },
  ];

  const getTotalStats = () => {
    const activeRecordings = streams.filter(s => s.recordingStatus?.recording).length;
    const totalRecordings = recordings.length;
    const totalSize = recordings.reduce((sum, r) => sum + r.fileSize, 0);
    const totalDuration = recordings.reduce((sum, r) => sum + r.duration, 0);
    
    return {
      active: activeRecordings,
      total: totalRecordings,
      totalSize,
      totalDuration,
    };
  };

  const stats = getTotalStats();

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {error && <Alert type="error" message={error} showIcon />}
      
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Recording & DVR Management</Title>}
        extra={
          <Space>
            <Select
              style={{ width: 200 }}
              placeholder="Select Application"
              value={selectedApp ? `${selectedApp.vhost}/${selectedApp.name}` : undefined}
              onChange={(value) => {
                const [vhost, name] = value.split('/');
                setSelectedApp({ vhost, name });
              }}
            >
              {applications.map(app => (
                <Option key={`${app.vhost}/${app.name}`} value={`${app.vhost}/${app.name}`}>
                  {app.vhost}/{app.name}
                </Option>
              ))}
            </Select>
            <Button
              icon={<PlusOutlined />}
              onClick={() => setRecordingModalVisible(true)}
              disabled={!selectedApp}
            >
              Create Recording
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => {
                form.setFieldsValue(recordingConfig || {});
                setConfigModalVisible(true);
              }}
              disabled={!selectedApp}
            >
              Recording Config
            </Button>
            <Button
              icon={<ClockCircleOutlined />}
              onClick={() => {
                dvrForm.setFieldsValue(dvrConfig || {});
                setDvrModalVisible(true);
              }}
              disabled={!selectedApp}
            >
              DVR Config
            </Button>
          </Space>
        }
      >
        {selectedApp && (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Active Recordings"
                    value={stats.active}
                    prefix={<PlayCircleOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Recordings"
                    value={stats.total}
                    prefix={<VideoCameraOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Size"
                    value={formatBytes(stats.totalSize)}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Duration"
                    value={formatDuration(stats.totalDuration)}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Tabs defaultActiveKey="streams">
              <TabPane tab="Live Streams" key="streams">
                <Table
                  columns={streamColumns}
                  dataSource={streams}
                  loading={loading}
                  rowKey={(record) => `${record.vhost}-${record.app}-${record.stream.name}`}
                  pagination={false}
                  size="small"
                />
              </TabPane>
              <TabPane tab="Recordings" key="recordings">
                <Table
                  columns={recordingColumns}
                  dataSource={recordings}
                  loading={loading}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              </TabPane>
              <TabPane tab="Configuration" key="config">
                <Row gutter={16}>
                  <Col span={12}>
                    <Card title="Recording Configuration" size="small">
                      {recordingConfig ? (
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Enabled">
                            <Tag color={recordingConfig.enabled ? 'green' : 'red'}>
                              {recordingConfig.enabled ? 'Yes' : 'No'}
                            </Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="Output Path">
                            {recordingConfig.outputPath || 'Default'}
                          </Descriptions.Item>
                          <Descriptions.Item label="File Format">
                            {recordingConfig.format || 'mp4'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Segment Duration">
                            {recordingConfig.segmentDuration || '10'} seconds
                          </Descriptions.Item>
                        </Descriptions>
                      ) : (
                        <Text type="secondary">No configuration available</Text>
                      )}
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="DVR Configuration" size="small">
                      {dvrConfig ? (
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Enabled">
                            <Tag color={dvrConfig.enabled ? 'green' : 'red'}>
                              {dvrConfig.enabled ? 'Yes' : 'No'}
                            </Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="Max Duration">
                            {dvrConfig.maxDuration || '3600'} seconds
                          </Descriptions.Item>
                          <Descriptions.Item label="Segment Duration">
                            {dvrConfig.segmentDuration || '10'} seconds
                          </Descriptions.Item>
                          <Descriptions.Item label="Playlist Path">
                            {dvrConfig.playlistPath || 'Default'}
                          </Descriptions.Item>
                        </Descriptions>
                      ) : (
                        <Text type="secondary">No configuration available</Text>
                      )}
                    </Card>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </>
        )}
      </Card>

      {/* Recording Configuration Modal */}
      <Modal
        title="Recording Configuration"
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveRecordingConfig}
        >
          <Form.Item
            name="enabled"
            label="Enable Recording"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="outputPath"
            label="Output Path"
          >
            <Input placeholder="/var/recordings" />
          </Form.Item>
          <Form.Item
            name="format"
            label="File Format"
          >
            <Select>
              <Option value="mp4">MP4</Option>
              <Option value="ts">TS</Option>
              <Option value="mkv">MKV</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="segmentDuration"
            label="Segment Duration (seconds)"
          >
            <InputNumber min={1} max={300} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="maxFileSize"
            label="Max File Size (MB)"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* DVR Configuration Modal */}
      <Modal
        title="DVR Configuration"
        open={dvrModalVisible}
        onCancel={() => setDvrModalVisible(false)}
        onOk={() => dvrForm.submit()}
        width={600}
      >
        <Form
          form={dvrForm}
          layout="vertical"
          onFinish={handleSaveDVRConfig}
        >
          <Form.Item
            name="enabled"
            label="Enable DVR"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="maxDuration"
            label="Max Duration (seconds)"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="segmentDuration"
            label="Segment Duration (seconds)"
          >
            <InputNumber min={1} max={300} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="playlistPath"
            label="Playlist Path"
          >
            <Input placeholder="/var/dvr" />
          </Form.Item>
          <Form.Item
            name="maxSegments"
            label="Max Segments"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Recording Modal */}
      <Modal
        title="Create Recording"
        open={recordingModalVisible}
        onCancel={() => {
          setRecordingModalVisible(false);
          recordingForm.resetFields();
        }}
        onOk={() => recordingForm.submit()}
        width={600}
      >
        <Form
          form={recordingForm}
          layout="vertical"
          onFinish={handleCreateRecording}
        >
          <Form.Item
            name="id"
            label="Recording ID"
            rules={[{ required: true, message: 'Please enter recording ID' }]}
          >
            <Input placeholder="e.g., record_001" />
          </Form.Item>

          <Form.Item
            name="streamName"
            label="Stream Name"
            rules={[{ required: true, message: 'Please enter stream name' }]}
          >
            <Input placeholder="e.g., stream_001" />
          </Form.Item>

          <Form.Item
            name="variantNames"
            label="Variant Names (comma-separated)"
            tooltip="Leave empty to record all tracks"
          >
            <Input placeholder="e.g., h264_fhd, aac" />
          </Form.Item>

          <Form.Item
            name="filePath"
            label="Output File Path"
          >
            <Input placeholder="/path/to/recordings/" />
          </Form.Item>

          <Form.Item
            name="infoPath"
            label="Info File Path"
          >
            <Input placeholder="/path/to/info/" />
          </Form.Item>

          <Form.Item
            name="metadata"
            label="Metadata"
          >
            <TextArea rows={3} placeholder="Additional metadata" />
          </Form.Item>

          <Form.Item
            name="schedule"
            label="Cron Schedule"
            tooltip="Cron expression for scheduled recording (e.g., '0 */1 *' for every hour)"
          >
            <Input placeholder="0 */1 *" />
          </Form.Item>

          <Form.Item
            name="interval"
            label="Interval (milliseconds)"
            tooltip="Recording time per file when using interval-based recording"
          >
            <InputNumber
              placeholder="60000"
              style={{ width: '100%' }}
              min={1000}
              step={1000}
            />
          </Form.Item>

          <Form.Item
            name="segmentationRule"
            label="Segmentation Rule"
          >
            <Select placeholder="Select segmentation rule">
              <Option value="discontinuity">Discontinuity</Option>
              <Option value="continuity">Continuity</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};
