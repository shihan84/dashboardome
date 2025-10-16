import React, { useEffect, useMemo, useState } from 'react';
import { Card, Descriptions, Alert, Typography, Space } from 'antd';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title } = Typography;

export const TLSStatus: React.FC = () => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hostInfo, setHostInfo] = useState<any>(null);

  const vhost = 'default';

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const host = await omeApi.getHostTLS(vhost);
        setHostInfo(host);
      } catch (e: any) {
        setError('Failed to load TLS status');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [omeApi]);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {error && <Alert type="error" message={error} showIcon />}
      <Card loading={loading} title={<Title level={4} style={{ margin: 0 }}>TLS Status (read-only)</Title>}>
        {hostInfo ? (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Hostnames">{(hostInfo.names || []).join(', ') || '-'}</Descriptions.Item>
            <Descriptions.Item label="Cert Path">{hostInfo.tls?.certPath || '-'}</Descriptions.Item>
            <Descriptions.Item label="Chain Cert Path">{hostInfo.tls?.chainCertPath || '-'}</Descriptions.Item>
            <Descriptions.Item label="Key Path">{hostInfo.tls?.keyPath || '-'}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Alert type="info" message="No host TLS info found on vhost 'default'" />
        )}
      </Card>
    </Space>
  );
};


