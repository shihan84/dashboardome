import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Table, Image, Button, Space, Typography, Alert, Tag, Descriptions, Row, Col, Statistic, Tabs } from 'antd';
import { PlayCircleOutlined, StopOutlined, EyeOutlined, CopyOutlined, SendOutlined } from '@ant-design/icons';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';
import { SCTE35StreamControls } from '../../streaming/scte35';
import { SRTDistributorConfig } from '../../streaming/srt';

const { Title, Text } = Typography;

interface StreamInfo {
  vhost: string;
  app: string;
  stream: any;
  thumbnailUrl: string;
  hlsUrl: string;
  webrtcUrl: string;
  stats?: any;
}

export const StreamMonitor: React.FC = () => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  const [loading, setLoading] = useState(false);
  const [streams, setStreams] = useState<StreamInfo[]>([]);
  const [selectedStream, setSelectedStream] = useState<StreamInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStreams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allStreams = await omeApi.getAllStreams();
      const streamInfos: StreamInfo[] = allStreams.map(({ vhost, app, stream }) => ({
        vhost,
        app,
        stream,
        thumbnailUrl: omeApi.getThumbnailUrl(vhost, app, stream.name),
        hlsUrl: omeApi.getHLSPlaylistUrl(vhost, app, stream.name),
        webrtcUrl: omeApi.getWebRTCUrl(vhost, app, stream.name),
      }));

      // Load stats for each stream
      const streamsWithStats = await Promise.all(
        streamInfos.map(async (info) => {
          try {
            const stats = await omeApi.getStreamStats(info.vhost, info.app, info.stream.name);
            return { ...info, stats };
          } catch {
            return info;
          }
        })
      );

      setStreams(streamsWithStats);
    } catch (e: any) {
      setError('Failed to load streams');
    } finally {
      setLoading(false);
    }
  }, [omeApi]);

  useEffect(() => {
    loadStreams();
    const interval = setInterval(loadStreams, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [loadStreams]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const columns = [
    {
      title: 'Thumbnail',
      dataIndex: 'thumbnailUrl',
      key: 'thumbnail',
      width: 120,
      render: (url: string, record: StreamInfo) => (
        <Image
          width={80}
          height={45}
          src={url}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
          style={{ objectFit: 'cover' }}
        />
      ),
    },
    {
      title: 'Stream Name',
      dataIndex: ['stream', 'name'],
      key: 'name',
      render: (name: string, record: StreamInfo) => (
        <Button type="link" onClick={() => setSelectedStream(record)}>
          {name}
        </Button>
      ),
    },
    {
      title: 'VHost',
      dataIndex: 'vhost',
      key: 'vhost',
    },
    {
      title: 'App',
      dataIndex: 'app',
      key: 'app',
    },
    {
      title: 'State',
      dataIndex: ['stream', 'state'],
      key: 'state',
      render: (state: string) => (
        <Tag color={state === 'streaming' ? 'green' : state === 'ready' ? 'blue' : 'red'}>
          {state}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: StreamInfo) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => setSelectedStream(record)}
          >
            Details
          </Button>
          <Button
            icon={<CopyOutlined />}
            size="small"
            onClick={() => copyToClipboard(record.hlsUrl)}
          >
            Copy HLS
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {error && <Alert type="error" message={error} showIcon />}
      
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Streams"
              value={streams.length}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Streams"
              value={streams.filter(s => s.stream.state === 'streaming').length}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Ready Streams"
              value={streams.filter(s => s.stream.state === 'ready').length}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Stopped Streams"
              value={streams.filter(s => s.stream.state === 'stopped').length}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<Title level={4} style={{ margin: 0 }}>Live Streams Monitor</Title>}
        extra={
          <Button onClick={loadStreams} loading={loading}>
            Refresh
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={streams}
          loading={loading}
          rowKey={(record) => `${record.vhost}-${record.app}-${record.stream.name}`}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {selectedStream && (
        <Card
          title={
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                Stream Details: {selectedStream.stream.name}
              </Title>
              <Button onClick={() => setSelectedStream(null)}>Close</Button>
            </Space>
          }
        >
          <Tabs defaultActiveKey="details" size="small">
            <Tabs.TabPane tab="Stream Details" key="details">
              <Row gutter={16}>
                <Col span={12}>
                  <Image
                    width="100%"
                    height={200}
                    src={selectedStream.thumbnailUrl}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                    style={{ objectFit: 'cover' }}
                  />
                </Col>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="VHost">{selectedStream.vhost}</Descriptions.Item>
                    <Descriptions.Item label="App">{selectedStream.app}</Descriptions.Item>
                    <Descriptions.Item label="State">
                      <Tag color={selectedStream.stream.state === 'streaming' ? 'green' : 'red'}>
                        {selectedStream.stream.state}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="HLS URL">
                      <Space>
                        <Text code style={{ fontSize: '12px' }}>{selectedStream.hlsUrl}</Text>
                        <Button
                          icon={<CopyOutlined />}
                          size="small"
                          onClick={() => copyToClipboard(selectedStream.hlsUrl)}
                        />
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="WebRTC URL">
                      <Space>
                        <Text code style={{ fontSize: '12px' }}>{selectedStream.webrtcUrl}</Text>
                        <Button
                          icon={<CopyOutlined />}
                          size="small"
                          onClick={() => copyToClipboard(selectedStream.webrtcUrl)}
                        />
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Tabs.TabPane>
            
            <Tabs.TabPane 
              tab={
                <Space>
                  <SendOutlined />
                  <span>SCTE-35 Controls</span>
                </Space>
              } 
              key="scte35"
            >
              <SCTE35StreamControls
                vhost={selectedStream.vhost}
                app={selectedStream.app}
                stream={selectedStream.stream.name}
              />
            </Tabs.TabPane>

            <Tabs.TabPane 
              tab={
                <Space>
                  <VideoCameraOutlined />
                  <span>SRT Distributor</span>
                </Space>
              } 
              key="srt"
            >
              <SRTDistributorConfig
                vhost={selectedStream.vhost}
                app={selectedStream.app}
                stream={selectedStream.stream.name}
              />
            </Tabs.TabPane>
          </Tabs>
        </Card>
      )}
    </Space>
  );
};
