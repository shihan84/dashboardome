import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Form, Input, Button, Space, Typography, Alert, Divider } from 'antd';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';

const { Title, Text } = Typography;

export const AccessControl: React.FC = () => {
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = useMemo(() => new OMEApiService(omeHost, omePort, omeUsername, omePassword), [omeHost, omePort, omeUsername, omePassword]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Using default vhost unless UI supports selecting others
  const vhost = 'default';

  const [signedPolicyForm] = Form.useForm();
  const [webhookForm] = Form.useForm();

  const loadCurrent = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const sp = await omeApi.getSignedPolicy(vhost).catch(() => undefined);
      const aw = await omeApi.getAdmissionWebhooks(vhost).catch(() => undefined);
      if (sp) {
        signedPolicyForm.setFieldsValue({
          providers: sp.enables?.providers ?? '',
          publishers: sp.enables?.publishers ?? '',
          policyQueryKeyName: sp.policyQueryKeyName ?? '',
          signatureQueryKeyName: sp.signatureQueryKeyName ?? '',
          secretKey: sp.secretKey ?? '',
        });
      }
      if (aw) {
        webhookForm.setFieldsValue({
          controlServerUrl: aw.controlServerUrl ?? '',
          secretKey: aw.secretKey ?? '',
          timeout: aw.timeout ?? 3000,
          providers: aw.enables?.providers ?? '',
          publishers: aw.enables?.publishers ?? '',
        });
      }
      setMessage('Loaded current Access Control configuration');
    } catch (e: any) {
      setError('Failed to load current configuration');
    } finally {
      setLoading(false);
    }
  }, [omeApi, signedPolicyForm, webhookForm]);

  useEffect(() => {
    loadCurrent();
  }, [loadCurrent]);

  const saveSignedPolicy = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const values = signedPolicyForm.getFieldsValue();
      await omeApi.setSignedPolicy(vhost, {
        enables: {
          providers: values.providers || 'all',
          publishers: values.publishers || 'all',
        },
        policyQueryKeyName: values.policyQueryKeyName || 'policy',
        signatureQueryKeyName: values.signatureQueryKeyName || 'signature',
        secretKey: values.secretKey || '',
      });
      setMessage('Signed Policy saved');
    } catch (e: any) {
      setError('Failed to save Signed Policy');
    } finally {
      setLoading(false);
    }
  };

  const saveWebhooks = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const values = webhookForm.getFieldsValue();
      await omeApi.setAdmissionWebhooks(vhost, {
        controlServerUrl: values.controlServerUrl || '',
        secretKey: values.secretKey || '',
        timeout: Number(values.timeout) || 3000,
        enables: {
          providers: values.providers || 'all',
          publishers: values.publishers || 'all',
        },
      });
      setMessage('Admission Webhooks saved');
    } catch (e: any) {
      setError('Failed to save Admission Webhooks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {message && <Alert type="success" message={message} showIcon />}
      {error && <Alert type="error" message={error} showIcon />}

      <Card loading={loading} title={<Title level={4} style={{ margin: 0 }}>Signed Policy</Title>}>
        <Form form={signedPolicyForm} layout="vertical">
          <Form.Item label="Providers (e.g., all|webrtc|rtmp|srt|llhls|thumbnail)" name="providers">
            <Input placeholder="all" />
          </Form.Item>
          <Form.Item label="Publishers (e.g., all|webrtc|llhls|ovt|file|push|srt)" name="publishers">
            <Input placeholder="all" />
          </Form.Item>
          <Form.Item label="Policy Query Key Name" name="policyQueryKeyName">
            <Input placeholder="policy" />
          </Form.Item>
          <Form.Item label="Signature Query Key Name" name="signatureQueryKeyName">
            <Input placeholder="signature" />
          </Form.Item>
          <Form.Item label="Secret Key" name="secretKey">
            <Input.Password placeholder="" />
          </Form.Item>
          <Space>
            <Button type="primary" onClick={saveSignedPolicy}>Save</Button>
            <Button onClick={loadCurrent}>Reload</Button>
          </Space>
        </Form>
      </Card>

      <Card loading={loading} title={<Title level={4} style={{ margin: 0 }}>Admission Webhooks</Title>}>
        <Form form={webhookForm} layout="vertical">
          <Form.Item label="Control Server URL" name="controlServerUrl">
            <Input placeholder="https://your-control.example.com/webhook" />
          </Form.Item>
          <Form.Item label="Secret Key" name="secretKey">
            <Input.Password placeholder="" />
          </Form.Item>
          <Form.Item label="Timeout (ms)" name="timeout">
            <Input placeholder="3000" />
          </Form.Item>
          <Divider />
          <Form.Item label="Providers" name="providers">
            <Input placeholder="all" />
          </Form.Item>
          <Form.Item label="Publishers" name="publishers">
            <Input placeholder="all" />
          </Form.Item>
          <Space>
            <Button type="primary" onClick={saveWebhooks}>Save</Button>
            <Button onClick={loadCurrent}>Reload</Button>
          </Space>
        </Form>
      </Card>

      <Text type="secondary">Virtual Host: {vhost} • Server: {omeHost}:{omePort}</Text>
    </Space>
  );
};


