import React from 'react';
import { Card, Descriptions, Typography, Space, Alert } from 'antd';
import { useStore } from '../../../store/useStore';

const { Title, Text } = Typography;

export const IngressHelpers: React.FC = () => {
  const { omeHost, omePort } = useStore();
  const domain = omeHost;

  const defaultApp = 'app';
  const exampleStream = 'test';

  const items = [
    {
      label: 'RTMP Ingest',
      value: `rtmp://${domain}:1935/${defaultApp}/${exampleStream}`,
    },
    {
      label: 'SRT Listen',
      value: `srt://${domain}:4000?mode=listener&latency=2000&streamid=${defaultApp}/${exampleStream}`,
    },
    {
      label: 'RTSP Ingest',
      value: `rtsp://${domain}:5000/${defaultApp}/${exampleStream}`,
    },
    {
      label: 'WebRTC Playback (Signaling)',
      value: `ws://${domain}:3333/${defaultApp}/${exampleStream}`,
    },
    {
      label: 'LLHLS Playback',
      value: `http://${domain}:3333/${defaultApp}/${exampleStream}/llhls.m3u8`,
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert type="info" message="Use these helpers to quickly connect encoders/players. Adjust app/stream accordingly." />
      <Card title={<Title level={4} style={{ margin: 0 }}>Ingest & Playback Helpers</Title>}>
        <Descriptions column={1} bordered size="small">
          {items.map((it) => (
            <Descriptions.Item key={it.label} label={it.label}>
              <Text code>{it.value}</Text>
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>
    </Space>
  );
};


