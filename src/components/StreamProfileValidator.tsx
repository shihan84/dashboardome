import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Alert,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  Divider,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import { OMEApiService } from '../services/omeApi';
import type { ComplianceCheck, StreamProfile } from '../types/index';

const { Title, Text } = Typography;

// Distributor Requirements (from the specifications)
const DISTRIBUTOR_REQUIREMENTS = {
  video: {
    codec: 'H.264',
    resolution: '1920x1080',
    bitrate: 5000000, // 5 Mbps
    profile: 'High',
    gop: 12,
    bframes: 5,
  },
  audio: {
    codec: 'AAC-LC',
    bitrate: 128000, // 128 Kbps
    sampleRate: 48000, // 48 kHz
    loudness: -20, // LKFS
  },
};

export const StreamProfileValidator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [complianceScore, setComplianceScore] = useState(0);
  
  const {
    currentStream,
    complianceChecks,
    setComplianceChecks,
    omeHost,
    omePort,
  } = useStore();

  const omeApi = new OMEApiService(omeHost, omePort);

  const validateStreamProfile = async () => {
    if (!currentStream) {
      Alert.warning('No stream selected for validation');
      return;
    }

    setLoading(true);
    
    try {
      // Fetch detailed stream information from OME
      const streamInfo = await omeApi.getStreamInfo('default', 'app', currentStream.id);
      
      // Create compliance checks
      const checks: ComplianceCheck[] = [
        {
          spec: 'Video Codec',
          current: streamInfo.profile?.codec || 'Unknown',
          required: DISTRIBUTOR_REQUIREMENTS.video.codec,
          compliant: (streamInfo.profile?.codec || '').toLowerCase().includes('h264'),
        },
        {
          spec: 'Video Resolution',
          current: streamInfo.profile?.resolution || 'Unknown',
          required: DISTRIBUTOR_REQUIREMENTS.video.resolution,
          compliant: streamInfo.profile?.resolution === DISTRIBUTOR_REQUIREMENTS.video.resolution,
        },
        {
          spec: 'Video Bitrate',
          current: `${Math.round((streamInfo.profile?.bitrate || 0) / 1000)} Kbps`,
          required: `${DISTRIBUTOR_REQUIREMENTS.video.bitrate / 1000} Kbps`,
          compliant: Math.abs((streamInfo.profile?.bitrate || 0) - DISTRIBUTOR_REQUIREMENTS.video.bitrate) < 100000, // ±100 Kbps tolerance
        },
        {
          spec: 'Audio Codec',
          current: streamInfo.profile?.audioCodec || 'Unknown',
          required: DISTRIBUTOR_REQUIREMENTS.audio.codec,
          compliant: (streamInfo.profile?.audioCodec || '').toLowerCase().includes('aac'),
        },
        {
          spec: 'Audio Bitrate',
          current: `${Math.round((streamInfo.profile?.audioBitrate || 0) / 1000)} Kbps`,
          required: `${DISTRIBUTOR_REQUIREMENTS.audio.bitrate / 1000} Kbps`,
          compliant: Math.abs((streamInfo.profile?.audioBitrate || 0) - DISTRIBUTOR_REQUIREMENTS.audio.bitrate) < 1000, // ±1 Kbps tolerance
        },
        {
          spec: 'Audio Sample Rate',
          current: `${streamInfo.profile?.audioSampleRate || 0} Hz`,
          required: `${DISTRIBUTOR_REQUIREMENTS.audio.sampleRate} Hz`,
          compliant: streamInfo.profile?.audioSampleRate === DISTRIBUTOR_REQUIREMENTS.audio.sampleRate,
        },
        {
          spec: 'Audio Loudness',
          current: `${streamInfo.profile?.loudness || 0} LKFS`,
          required: `${DISTRIBUTOR_REQUIREMENTS.audio.loudness} LKFS`,
          compliant: Math.abs((streamInfo.profile?.loudness || 0) - DISTRIBUTOR_REQUIREMENTS.audio.loudness) < 1, // ±1 LKFS tolerance
        },
      ];

      setComplianceChecks(checks);
      setLastChecked(new Date());
      
      // Calculate compliance score
      const compliantCount = checks.filter(check => check.compliant).length;
      const score = Math.round((compliantCount / checks.length) * 100);
      setComplianceScore(score);
      
    } catch (error) {
      console.error('Failed to validate stream profile:', error);
      Alert.error('Failed to fetch stream information. Check OME connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentStream) {
      validateStreamProfile();
    }
  }, [currentStream]);

  const columns = [
    {
      title: 'Specification',
      dataIndex: 'spec',
      key: 'spec',
      width: '25%',
    },
    {
      title: 'Current Value',
      dataIndex: 'current',
      key: 'current',
      width: '25%',
      render: (value: string, record: ComplianceCheck) => (
        <Text code>{value}</Text>
      ),
    },
    {
      title: 'Required Value',
      dataIndex: 'required',
      key: 'required',
      width: '25%',
      render: (value: string) => (
        <Text type="secondary">{value}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'compliant',
      key: 'compliant',
      width: '25%',
      render: (compliant: boolean) => (
        <Tag
          icon={compliant ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={compliant ? 'success' : 'error'}
        >
          {compliant ? 'Compliant' : 'Non-Compliant'}
        </Tag>
      ),
    },
  ];

  const getComplianceStatus = () => {
    if (complianceScore >= 100) {
      return { type: 'success', message: 'Fully Compliant', icon: <CheckCircleOutlined /> };
    } else if (complianceScore >= 80) {
      return { type: 'warning', message: 'Mostly Compliant', icon: <WarningOutlined /> };
    } else {
      return { type: 'error', message: 'Non-Compliant', icon: <CloseCircleOutlined /> };
    }
  };

  const status = getComplianceStatus();

  return (
    <Card
      title={
        <Space>
          <InfoCircleOutlined />
          <span>Stream Profile Validator</span>
        </Space>
      }
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={validateStreamProfile}
          loading={loading}
        >
          Refresh
        </Button>
      }
    >
      {!currentStream ? (
        <Alert
          message="No Stream Selected"
          description="Please select a stream from the dashboard to validate its profile against distributor requirements."
          type="info"
          showIcon
        />
      ) : (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Statistic
                title="Compliance Score"
                value={complianceScore}
                suffix="%"
                valueStyle={{ 
                  color: complianceScore >= 80 ? '#52c41a' : '#ff4d4f' 
                }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Compliant Specs"
                value={complianceChecks.filter(c => c.compliant).length}
                suffix={`/ ${complianceChecks.length}`}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Last Checked"
                value={lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}
              />
            </Col>
          </Row>

          <Alert
            message={status.message}
            description={`Stream "${currentStream.name}" compliance status: ${complianceScore}%`}
            type={status.type as any}
            icon={status.icon}
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Progress
            percent={complianceScore}
            strokeColor={complianceScore >= 80 ? '#52c41a' : '#ff4d4f'}
            style={{ marginBottom: 24 }}
          />

          <Table
            columns={columns}
            dataSource={complianceChecks}
            rowKey="spec"
            pagination={false}
            size="small"
          />

          {lastChecked && (
            <Divider>
              <Text type="secondary">
                Last validated: {lastChecked.toLocaleString()}
              </Text>
            </Divider>
          )}

          <Alert
            message="Distributor Requirements"
            description={
              <div>
                <Text strong>Video:</Text> H.264, 1920x1080, 5 Mbps, High Profile, GOP 12, 5 B-Frames
                <br />
                <Text strong>Audio:</Text> AAC-LC, 128 Kbps, 48kHz, -20 LKFS
                <br />
                <Text strong>Container:</Text> MPEG-TS with SCTE-35 on PID 500
              </div>
            }
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </>
      )}
    </Card>
  );
};
