import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Row,
  Col,
  Statistic,
  Progress,
  Badge,
  Tooltip,
  Alert,
  Divider,
  DatePicker,
  TimePicker,
  Upload,
  List,
  Avatar,
  Typography
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  FileOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  VideoCameraOutlined,
  SoundOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  SettingOutlined,
  HistoryOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';
import { OMEApiService } from '../../services/omeApi';
import { useStore } from '../../store/useStore';
import type { StreamRecord, StreamRecorded } from '../../types';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

interface RecordingSession {
  id: string;
  name: string;
  streamName: string;
  status: 'recording' | 'stopped' | 'paused' | 'error';
  startTime: string;
  endTime?: string;
  duration: string;
  fileSize: string;
  format: 'mp4' | 'ts' | 'flv' | 'mkv';
  quality: 'high' | 'medium' | 'low';
  resolution: string;
  bitrate: number;
  framerate: number;
  filePath: string;
  thumbnail?: string;
}

interface DVRSchedule {
  id: string;
  name: string;
  streamName: string;
  enabled: boolean;
  scheduleType: 'daily' | 'weekly' | 'custom';
  startTime: string;
  endTime: string;
  days: string[];
  outputFormat: 'mp4' | 'ts' | 'flv';
  quality: 'high' | 'medium' | 'low';
  autoDelete: boolean;
  retentionDays: number;
}

const DVRRecordingManager: React.FC = () => {
  const [recordings, setRecordings] = useState<RecordingSession[]>([]);
  const [schedules, setSchedules] = useState<DVRSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [recordingModalVisible, setRecordingModalVisible] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [editingRecording, setEditingRecording] = useState<RecordingSession | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<DVRSchedule | null>(null);
  const [recordingForm] = Form.useForm();
  const [scheduleForm] = Form.useForm();
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  useEffect(() => {
    loadRecordings();
    loadSchedules();
    const interval = setInterval(() => {
      loadRecordings();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const VHOST = 'default';
  const APP = 'live';

  const mapRecordedToSession = (rec: StreamRecorded): RecordingSession => {
    return {
      id: rec.id,
      name: rec.outputFilePath?.split('/').pop() || `${rec.stream.name}_recording`,
      streamName: rec.stream.name,
      status: rec.state === 'started' ? 'recording' : (rec.state === 'stopped' ? 'stopped' : 'paused'),
      startTime: rec.startTime,
      endTime: rec.finishTime,
      duration: `${Math.max(0, Math.floor((rec.totalRecordTime || rec.recordTime || 0) / 60))}m`,
      fileSize: rec.totalRecordBytes ? `${(rec.totalRecordBytes / (1024 * 1024)).toFixed(1)} MB` : '0 MB',
      format: 'mp4',
      quality: 'high',
      resolution: '1920x1080',
      bitrate: 2500,
      framerate: 30,
      filePath: rec.outputFilePath || ''
    };
  };

  const loadRecordings = async () => {
    setLoading(true);
    try {
      const list = await omeApi.getRecordingStatus(VHOST, APP);
      const mapped: RecordingSession[] = (list || []).map(mapRecordedToSession);
      setRecordings(mapped);
    } catch (error) {
      message.error('Failed to load recordings');
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    try {
      // Mock data - replace with actual OME API calls
      const mockSchedules: DVRSchedule[] = [
        {
          id: '1',
          name: 'Daily News Recording',
          streamName: 'shreenews',
          enabled: true,
          scheduleType: 'daily',
          startTime: '09:00',
          endTime: '11:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          outputFormat: 'mp4',
          quality: 'medium',
          autoDelete: true,
          retentionDays: 7
        },
        {
          id: '2',
          name: 'Weekly Backup',
          streamName: 'live',
          enabled: false,
          scheduleType: 'weekly',
          startTime: '20:00',
          endTime: '22:00',
          days: ['Sunday'],
          outputFormat: 'ts',
          quality: 'high',
          autoDelete: false,
          retentionDays: 30
        }
      ];
      setSchedules(mockSchedules);
    } catch (error) {
      message.error('Failed to load schedules');
    }
  };

  const handleStartRecording = async (streamName: string) => {
    try {
      const recordPayload: StreamRecord = {
        id: `${streamName}_${Date.now()}`,
        stream: { name: streamName },
        segmentationRule: 'continuity'
      };
      await omeApi.startRecording(VHOST, APP, recordPayload);
      await loadRecordings();
      message.success(`Recording started for stream: ${streamName}`);
    } catch (error) {
      message.error('Failed to start recording');
    }
  };

  const handleStopRecording = async (recordingId: string) => {
    try {
      await omeApi.stopRecording(VHOST, APP, recordingId);
      await loadRecordings();
      message.success('Recording stopped successfully');
    } catch (error) {
      message.error('Failed to stop recording');
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    try {
      setRecordings(prev => prev.filter(recording => recording.id !== recordingId));
      message.success('Recording deleted successfully');
    } catch (error) {
      message.error('Failed to delete recording');
    }
  };

  const handleDownloadRecording = async (recording: RecordingSession) => {
    try {
      // Mock download - replace with actual download logic
      message.success(`Downloading ${recording.name}...`);
    } catch (error) {
      message.error('Failed to download recording');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recording': return 'processing';
      case 'stopped': return 'success';
      case 'paused': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'green';
      case 'medium': return 'orange';
      case 'low': return 'red';
      default: return 'default';
    }
  };

  const recordingColumns = [
    {
      title: 'Recording Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: RecordingSession) => (
        <Space>
          <FileOutlined />
          <strong>{text}</strong>
          <Tag color={getQualityColor(record.quality)}>{record.quality}</Tag>
        </Space>
      )
    },
    {
      title: 'Stream',
      dataIndex: 'streamName',
      key: 'streamName',
      render: (streamName: string) => (
        <Space>
          <VideoCameraOutlined />
          {streamName}
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
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: string) => (
        <Space>
          <ClockCircleOutlined />
          {duration}
        </Space>
      )
    },
    {
      title: 'File Size',
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (size: string) => (
        <Space>
          <DatabaseOutlined />
          {size}
        </Space>
      )
    },
    {
      title: 'Quality',
      key: 'quality',
      render: (record: RecordingSession) => (
        <Space direction="vertical" size="small">
          <Text>{record.resolution}</Text>
          <Text type="secondary">{record.bitrate}kbps @ {record.framerate}fps</Text>
        </Space>
      )
    },
    {
      title: 'Format',
      dataIndex: 'format',
      key: 'format',
      render: (format: string) => <Tag color="blue">{format.toUpperCase()}</Tag>
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => (
        <Space>
          <CalendarOutlined />
          {time}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: RecordingSession) => (
        <Space>
          {record.status === 'recording' ? (
            <Tooltip title="Stop Recording">
              <Button 
                icon={<StopOutlined />} 
                danger 
                size="small"
                onClick={() => handleStopRecording(record.id)}
              />
            </Tooltip>
          ) : (
            <>
              <Tooltip title="Play Recording">
                <Button 
                  icon={<PlayCircleOutlined />} 
                  type="primary" 
                  size="small"
                />
              </Tooltip>
              <Tooltip title="Download">
                <Button 
                  icon={<DownloadOutlined />} 
                  size="small"
                  onClick={() => handleDownloadRecording(record)}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="Delete">
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
              onClick={() => handleDeleteRecording(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const scheduleColumns = [
    {
      title: 'Schedule Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: DVRSchedule) => (
        <Space>
          <HistoryOutlined />
          <strong>{text}</strong>
          <Tag color={record.enabled ? 'green' : 'red'}>
            {record.enabled ? 'Enabled' : 'Disabled'}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Stream',
      dataIndex: 'streamName',
      key: 'streamName',
      render: (streamName: string) => (
        <Space>
          <VideoCameraOutlined />
          {streamName}
        </Space>
      )
    },
    {
      title: 'Schedule',
      key: 'schedule',
      render: (record: DVRSchedule) => (
        <Space direction="vertical" size="small">
          <Text>{record.scheduleType}</Text>
          <Text type="secondary">{record.startTime} - {record.endTime}</Text>
          <Text type="secondary">{record.days.join(', ')}</Text>
        </Space>
      )
    },
    {
      title: 'Output',
      key: 'output',
      render: (record: DVRSchedule) => (
        <Space direction="vertical" size="small">
          <Tag color="blue">{record.outputFormat.toUpperCase()}</Tag>
          <Tag color={getQualityColor(record.quality)}>{record.quality}</Tag>
        </Space>
      )
    },
    {
      title: 'Retention',
      key: 'retention',
      render: (record: DVRSchedule) => (
        <Space direction="vertical" size="small">
          <Text>{record.autoDelete ? 'Auto Delete' : 'Keep Forever'}</Text>
          {record.autoDelete && (
            <Text type="secondary">{record.retentionDays} days</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: DVRSchedule) => (
        <Space>
          <Tooltip title="Edit Schedule">
            <Button 
              icon={<EditOutlined />} 
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete Schedule">
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

  const activeRecordings = recordings.filter(r => r.status === 'recording').length;
  const totalRecordings = recordings.length;
  const totalStorage = recordings.reduce((sum, r) => {
    const size = parseFloat(r.fileSize.replace(/[^\d.]/g, ''));
    return sum + (r.fileSize.includes('GB') ? size * 1024 : size);
  }, 0);

  return (
    <div>
      {/* DVR Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Recordings"
              value={activeRecordings}
              prefix={<VideoCameraOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Recordings"
              value={totalRecordings}
              prefix={<FileOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Storage Used"
              value={totalStorage.toFixed(1)}
              suffix="MB"
              prefix={<DatabaseOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* DVR Info Alert */}
      <Alert
        message="DVR & Recording Management"
        description="Record live streams with configurable quality, format, and scheduling. Supports MP4, TS, FLV formats with automatic retention policies."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Quick Actions */}
      <Card title="Quick Actions" style={{ marginBottom: 24 }}>
        <Space wrap>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setRecordingModalVisible(true)}
          >
            Start Recording
          </Button>
          <Button 
            icon={<HistoryOutlined />}
            onClick={() => setScheduleModalVisible(true)}
          >
            Create Schedule
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={loadRecordings}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </Card>

      {/* Recordings Table */}
      <Card
        title="Recording Sessions"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadRecordings}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={recordingColumns}
          dataSource={recordings}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Schedules Table */}
      <Card
        title="Recording Schedules"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setScheduleModalVisible(true)}
          >
            Add Schedule
          </Button>
        }
      >
        <Table
          columns={scheduleColumns}
          dataSource={schedules}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Start Recording Modal */}
      <Modal
        title="Start Recording"
        open={recordingModalVisible}
        onCancel={() => setRecordingModalVisible(false)}
        onOk={() => {
          const values = recordingForm.getFieldsValue();
          handleStartRecording(values.streamName);
          setRecordingModalVisible(false);
        }}
      >
        <Form form={recordingForm} layout="vertical">
          <Form.Item
            name="streamName"
            label="Stream Name"
            rules={[{ required: true, message: 'Please select stream' }]}
          >
            <Select placeholder="Select stream to record">
              <Option value="live">live</Option>
              <Option value="shreenews">shreenews</Option>
              <Option value="backup_srt">backup_srt</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="format"
            label="Output Format"
            initialValue="mp4"
          >
            <Select>
              <Option value="mp4">MP4</Option>
              <Option value="ts">TS</Option>
              <Option value="flv">FLV</Option>
              <Option value="mkv">MKV</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="quality"
            label="Quality"
            initialValue="high"
          >
            <Select>
              <Option value="high">High (1080p)</Option>
              <Option value="medium">Medium (720p)</Option>
              <Option value="low">Low (480p)</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Schedule Modal */}
      <Modal
        title="Create Recording Schedule"
        open={scheduleModalVisible}
        onCancel={() => setScheduleModalVisible(false)}
        onOk={() => {
          const values = scheduleForm.getFieldsValue();
          // Handle schedule creation
          setScheduleModalVisible(false);
        }}
        width={600}
      >
        <Form form={scheduleForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Schedule Name"
                rules={[{ required: true, message: 'Please enter schedule name' }]}
              >
                <Input placeholder="e.g., Daily News Recording" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="streamName"
                label="Stream Name"
                rules={[{ required: true, message: 'Please select stream' }]}
              >
                <Select placeholder="Select stream">
                  <Option value="live">live</Option>
                  <Option value="shreenews">shreenews</Option>
                  <Option value="backup_srt">backup_srt</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="scheduleType"
                label="Schedule Type"
                rules={[{ required: true, message: 'Please select schedule type' }]}
                initialValue="daily"
              >
                <Select>
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                  <Option value="custom">Custom</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="enabled"
                label="Enabled"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label="Start Time"
                rules={[{ required: true, message: 'Please select start time' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endTime"
                label="End Time"
                rules={[{ required: true, message: 'Please select end time' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="outputFormat"
                label="Output Format"
                initialValue="mp4"
              >
                <Select>
                  <Option value="mp4">MP4</Option>
                  <Option value="ts">TS</Option>
                  <Option value="flv">FLV</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quality"
                label="Quality"
                initialValue="medium"
              >
                <Select>
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>Retention Policy</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="autoDelete"
                label="Auto Delete"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="retentionDays"
                label="Retention Days"
                initialValue={7}
              >
                <InputNumber min={1} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default DVRRecordingManager;
