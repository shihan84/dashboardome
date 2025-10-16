import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Form, Input, Button, Space, Alert, Typography } from 'antd';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;

export const ClusterManagement: React.FC = () => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  const vhost = 'default';
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [originsForm] = Form.useForm();
  const [mapStoreForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const origins = await omeApi.getOrigins(vhost).catch(() => undefined);
      const mapStore = await omeApi.getOriginMapStore(vhost).catch(() => undefined);

      if (origins?.origin?.length) {
        const first = origins.origin[0];
        originsForm.setFieldsValue({
          location: first.location || '',
          schema: first.pass?.schema || 'http',
          urls: (first.pass?.urls?.url || []).join(', '),
        });
      }
      if (mapStore?.redisServer) {
        mapStoreForm.setFieldsValue({
          originHostName: mapStore.originHostName || '',
          redisHost: mapStore.redisServer.host || '',
          redisAuth: mapStore.redisServer.auth || '',
        });
      }
      setMessage('Loaded cluster configuration');
    } catch (e: any) {
      setError('Failed to load cluster configuration');
    } finally {
      setLoading(false);
    }
  }, [omeApi, originsForm, mapStoreForm]);

  useEffect(() => { load(); }, [load]);

  const saveOrigins = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const values = originsForm.getFieldsValue();
      await omeApi.setOrigins(vhost, {
        origin: [{
          location: values.location || 'edge',
          pass: {
            schema: values.schema || 'http',
            urls: { url: values.urls ? values.urls.split(',').map((s: string) => s.trim()).filter(Boolean) : [] },
          }
        }]
      });
      setMessage('Origins saved');
    } catch (e: any) {
      setError('Failed to save origins');
    } finally {
      setLoading(false);
    }
  };

  const saveMapStore = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const values = mapStoreForm.getFieldsValue();
      await omeApi.setOriginMapStore(vhost, {
        originHostName: values.originHostName || '',
        redisServer: {
          host: values.redisHost || '127.0.0.1:6379',
          auth: values.redisAuth || '',
        }
      });
      setMessage('Origin Map Store saved');
    } catch (e: any) {
      setError('Failed to save origin map store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {message && <Alert type="success" message={message} showIcon />}
      {error && <Alert type="error" message={error} showIcon />}

      <Card loading={loading} title={<Title level={4} style={{ margin: 0 }}>Origins (for Edge)</Title>}>
        <Form form={originsForm} layout="vertical">
          <Form.Item label="Location" name="location">
            <Input placeholder="edge" />
          </Form.Item>
          <Form.Item label="Schema" name="schema">
            <Input placeholder="http" />
          </Form.Item>
          <Form.Item label="Origin URLs (comma-separated)" name="urls">
            <Input placeholder="http://origin1:3333, http://origin2:3333" />
          </Form.Item>
          <Space>
            <Button type="primary" onClick={saveOrigins}>Save</Button>
            <Button onClick={load}>Reload</Button>
          </Space>
        </Form>
      </Card>

      <Card loading={loading} title={<Title level={4} style={{ margin: 0 }}>Origin Map Store (Redis)</Title>}>
        <Form form={mapStoreForm} layout="vertical">
          <Form.Item label="Origin Host Name" name="originHostName">
            <Input placeholder="origin.example.com" />
          </Form.Item>
          <Form.Item label="Redis Host" name="redisHost">
            <Input placeholder="127.0.0.1:6379" />
          </Form.Item>
          <Form.Item label="Redis Auth (optional)" name="redisAuth">
            <Input.Password placeholder="" />
          </Form.Item>
          <Space>
            <Button type="primary" onClick={saveMapStore}>Save</Button>
            <Button onClick={load}>Reload</Button>
          </Space>
        </Form>
      </Card>

      <Text type="secondary">Virtual Host: {vhost} • Server: {omeHost}:{omePort}</Text>
    </Space>
  );
};


