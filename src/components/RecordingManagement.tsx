import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  message,
  Tabs,
  Row,
  Col,
  InputNumber,
  Progress,
  Tooltip,
  Alert,
  Statistic,
} from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  PlusOutlined,
  ReloadOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  FileOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import { OMEApiService } from '../services/omeApi';
import type { StreamRecord, StreamRecorded } from '../types/index';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

export const RecordingManagement: React.FC = () => {
  const [recordings, setRecordings] = useState<StreamRecorded[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecording, setEditingRecording] = useState<StreamRecord | null>(null);
  const [form] = Form.useForm();
  
  const { omeHost, omePort, omeUsername, omePassword, currentVHost, currentApp } = useStore();
  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  const loadRecordings = useCallback(async () => {
    if (!currentVHost || !currentApp) return;
    
    setLoading(true);
    try {
      const recordings = await omeApi.getRecordingStatus(currentVHost, currentApp);
      setRecordings(recordings);
    } catch (error) {
      message.error('Failed to load recordings');
      console.error('Error loading recordings:', error);
    } finally {
      setLoading(false);
    }
  }, [currentVHost, currentApp, omeApi]);

  const handleStartRecording = async (values: { id: string; streamName: string; variantNames?: string; outputPath: string; format: string; duration?: number; scheduleStart?: string; scheduleEnd?: string }) => {
    if (!currentVHost || !currentApp) {
      message.error('Please select a virtual host and application');
      return;
    }

    try {
      const recordData: StreamRecord = {
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

      await omeApi.startRecording(currentVHost, currentApp, recordData);
      message.success('Recording started successfully');
      setModalVisible(false);
      form.resetFields();
      loadRecordings();
    } catch (error) {
      message.error('Failed to start recording');
      console.error('Error starting recording:', error);
    }
  };

  const handleStopRecording = async (recordId: string) => {
    if (!currentVHost || !currentApp) return;

    try {
      await omeApi.stopRecording(currentVHost, currentApp, recordId);
      message.success('Recording stopped successfully');
      loadRecordings();
    } catch (error) {
      message.error('Failed to stop recording');
      console.error('Error stopping recording:', error);
    }
  };

  const getRecordingStatusColor = (state: string) => {
    switch (state) {
      case 'ready': return 'blue';
      case 'started': return 'green';
      case 'stopping': return 'orange';
      case 'stopped': return 'gray';
      case 'error': return 'red';
      default: return 'default';
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

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text code>{id}</Text>
      ),
    },
    {
      title: 'Stream',
      dataIndex: 'stream',
      key: 'stream',
      render: (stream: { name: string }) => (
        <Space>
          <VideoCameraOutlined />
          <Text strong>{stream.name}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'state',
      key: 'state',
      render: (state: string) => (
        <Tag color={getRecordingStatusColor(state)}>
          {state.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (record: StreamRecorded) => {
        if (record.state === 'started') {
          const progress = record.totalRecordTime > 0 ? (record.recordTime / record.totalRecordTime) * 100 : 0;
          return (
            <Progress
              percent={Math.round(progress)}
              size="small"
              status={record.state === 'error' ? 'exception' : 'active'}
            />
          );
        }
        return '-';
      },
    },
    {
      title: 'Duration',
      dataIndex: 'recordTime',
      key: 'duration',
      render: (recordTime: number) => formatDuration(recordTime),
    },
    {
      title: 'Size',
      dataIndex: 'recordBytes',
      key: 'size',
      render: (recordBytes: number) => formatBytes(recordBytes),
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (startTime: string) => dayjs(startTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: StreamRecorded) => (
        <Space>
          {record.state === 'started' && (
            <Tooltip title="Stop Recording">
              <Button
                type="text"
                danger
                icon={<StopOutlined />}
                onClick={() => handleStopRecording(record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="Download">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              href={`file://${record.outputFilePath}`}
              target="_blank"
            />
          </Tooltip>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() => {
                setEditingRecording(record);
                setModalVisible(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const getTotalStats = () => {
    const activeRecordings = recordings.filter(r => r.state === 'started');
    const totalSize = recordings.reduce((sum, r) => sum + r.recordBytes, 0);
    const totalDuration = recordings.reduce((sum, r) => sum + r.recordTime, 0);
    
    return {
      active: activeRecordings.length,
      total: recordings.length,
      totalSize,
      totalDuration,
    };
  };

  const stats = getTotalStats();

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            <VideoCameraOutlined /> Recording Management
          </Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadRecordings}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRecording(null);
                setModalVisible(true);
              }}
            >
              Start Recording
            </Button>
          </Space>
        </div>

        {!currentVHost || !currentApp ? (
          <Alert
            message="Please select a virtual host and application"
            type="warning"
            showIcon
          />
        ) : (
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
                    prefix={<FileOutlined />}
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

            <Table
              columns={columns}
              dataSource={recordings}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
            />
          </>
        )}
      </Card>

      <Modal
        title={editingRecording ? 'Recording Details' : 'Start Recording'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRecording(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleStartRecording}
          initialValues={editingRecording}
        >
          <Tabs defaultActiveKey="basic">
            <TabPane tab="Basic" key="basic">
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
            </TabPane>

            <TabPane tab="Schedule" key="schedule">
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
            </TabPane>
          </Tabs>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              {!editingRecording && (
                <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />}>
                  Start Recording
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
