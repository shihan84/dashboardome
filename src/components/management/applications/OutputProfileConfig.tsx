import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Row,
  Col,
  Button,
  Space,
  Divider,
  Typography,
  Alert,
  Collapse,
} from 'antd';
import {
  VideoCameraOutlined,
  AudioOutlined,
  CodeOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

interface OutputProfileConfigProps {
  onSave?: (profile: any) => void;
  initialValues?: any;
}

export const OutputProfileConfig: React.FC<OutputProfileConfigProps> = ({
  onSave,
  initialValues = {}
}) => {
  const [form] = Form.useForm();
  const [activeKey, setActiveKey] = useState(['video', 'audio']);

  const handleSubmit = (values: any) => {
    const profile = {
      name: values.name,
      outputStreamName: values.outputStreamName || values.name,
      encodes: {
        video: values.video ? {
          codec: values.videoCodec || 'libx264',
          width: values.videoWidth || 1920,
          height: values.videoHeight || 1080,
          bitrate: values.videoBitrate || 3000,
          bitrateString: `${values.videoBitrate || 3000}k`,
          profile: values.videoProfile || 'high',
          preset: values.videoPreset || 'medium',
          bframes: values.videoBframes || 2,
          keyFrameInterval: values.videoKeyFrameInterval || 30,
          rcMode: values.videoRcMode || 'cbr',
          threadCount: values.videoThreadCount || 0,
        } : undefined,
        audio: values.audio ? {
          codec: values.audioCodec || 'aac',
          bitrate: values.audioBitrate || 128,
          bitrateString: `${values.audioBitrate || 128}k`,
          samplerate: values.audioSampleRate || 44100,
          channel: values.audioChannels || 2,
        } : undefined,
      },
      encoders: {
        encoder: {
          name: values.encoderName || 'x264',
          type: values.encoderType || 'software',
          threadCount: values.encoderThreadCount || 0,
        }
      }
    };

    if (onSave) {
      onSave(profile);
    }
  };

  const presetProfiles = [
    {
      name: 'LLHLS - 1080p',
      values: {
        name: 'llhls_1080p',
        outputStreamName: 'llhls_1080p',
        video: true,
        videoCodec: 'libx264',
        videoWidth: 1920,
        videoHeight: 1080,
        videoBitrate: 3000,
        videoProfile: 'high',
        videoPreset: 'medium',
        videoBframes: 2,
        videoKeyFrameInterval: 30,
        videoRcMode: 'cbr',
        audio: true,
        audioCodec: 'aac',
        audioBitrate: 128,
        audioSampleRate: 44100,
        audioChannels: 2,
      }
    },
    {
      name: 'LLHLS - 720p',
      values: {
        name: 'llhls_720p',
        outputStreamName: 'llhls_720p',
        video: true,
        videoCodec: 'libx264',
        videoWidth: 1280,
        videoHeight: 720,
        videoBitrate: 1500,
        videoProfile: 'high',
        videoPreset: 'medium',
        videoBframes: 2,
        videoKeyFrameInterval: 30,
        videoRcMode: 'cbr',
        audio: true,
        audioCodec: 'aac',
        audioBitrate: 128,
        audioSampleRate: 44100,
        audioChannels: 2,
      }
    },
    {
      name: 'WebRTC - 1080p',
      values: {
        name: 'webrtc_1080p',
        outputStreamName: 'webrtc_1080p',
        video: true,
        videoCodec: 'libvpx-vp8',
        videoWidth: 1920,
        videoHeight: 1080,
        videoBitrate: 2000,
        videoProfile: 'profile0',
        videoPreset: 'realtime',
        videoBframes: 0,
        videoKeyFrameInterval: 30,
        videoRcMode: 'cbr',
        audio: true,
        audioCodec: 'libopus',
        audioBitrate: 128,
        audioSampleRate: 48000,
        audioChannels: 2,
      }
    },
    {
      name: 'HLS - 480p',
      values: {
        name: 'hls_480p',
        outputStreamName: 'hls_480p',
        video: true,
        videoCodec: 'libx264',
        videoWidth: 854,
        videoHeight: 480,
        videoBitrate: 800,
        videoProfile: 'main',
        videoPreset: 'fast',
        videoBframes: 2,
        videoKeyFrameInterval: 30,
        videoRcMode: 'cbr',
        audio: true,
        audioCodec: 'aac',
        audioBitrate: 96,
        audioSampleRate: 44100,
        audioChannels: 2,
      }
    }
  ];

  const applyPreset = (preset: any) => {
    form.setFieldsValue(preset.values);
  };

  return (
    <Card title="Output Profile Configuration" size="small">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Profile Name"
              rules={[{ required: true, message: 'Please enter profile name' }]}
            >
              <Input placeholder="e.g., llhls_1080p" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="outputStreamName"
              label="Output Stream Name"
              tooltip="Name of the output stream (defaults to profile name)"
            >
              <Input placeholder="e.g., llhls_1080p" />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Quick Presets</Divider>
        <Space wrap>
          {presetProfiles.map((preset, index) => (
            <Button
              key={index}
              size="small"
              onClick={() => applyPreset(preset)}
            >
              {preset.name}
            </Button>
          ))}
        </Space>

        <Divider>Detailed Configuration</Divider>

        <Collapse activeKey={activeKey} onChange={setActiveKey}>
          <Panel header="Video Configuration" key="video">
            <Form.Item
              name="video"
              label="Enable Video"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="videoCodec"
                  label="Video Codec"
                  initialValue="libx264"
                >
                  <Select>
                    <Option value="libx264">H.264 (libx264)</Option>
                    <Option value="libx265">H.265 (libx265)</Option>
                    <Option value="libvpx-vp8">VP8</Option>
                    <Option value="libvpx-vp9">VP9</Option>
                    <Option value="libaom-av1">AV1</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="videoWidth"
                  label="Width"
                  initialValue={1920}
                >
                  <InputNumber min={320} max={7680} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="videoHeight"
                  label="Height"
                  initialValue={1080}
                >
                  <InputNumber min={240} max={4320} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="videoBitrate"
                  label="Bitrate (kbps)"
                  initialValue={3000}
                >
                  <InputNumber min={100} max={50000} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="videoProfile"
                  label="Profile"
                  initialValue="high"
                >
                  <Select>
                    <Option value="baseline">Baseline</Option>
                    <Option value="main">Main</Option>
                    <Option value="high">High</Option>
                    <Option value="profile0">Profile 0 (VP8)</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="videoPreset"
                  label="Preset"
                  initialValue="medium"
                >
                  <Select>
                    <Option value="ultrafast">Ultrafast</Option>
                    <Option value="superfast">Superfast</Option>
                    <Option value="veryfast">Veryfast</Option>
                    <Option value="faster">Faster</Option>
                    <Option value="fast">Fast</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="slow">Slow</Option>
                    <Option value="slower">Slower</Option>
                    <Option value="veryslow">Veryslow</Option>
                    <Option value="realtime">Realtime (WebRTC)</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="videoBframes"
                  label="B-Frames"
                  initialValue={2}
                >
                  <InputNumber min={0} max={16} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="videoKeyFrameInterval"
                  label="Keyframe Interval"
                  initialValue={30}
                >
                  <InputNumber min={1} max={300} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="videoRcMode"
                  label="Rate Control"
                  initialValue="cbr"
                >
                  <Select>
                    <Option value="cbr">CBR (Constant)</Option>
                    <Option value="vbr">VBR (Variable)</Option>
                    <Option value="crf">CRF (Quality)</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Panel>

          <Panel header="Audio Configuration" key="audio">
            <Form.Item
              name="audio"
              label="Enable Audio"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="audioCodec"
                  label="Audio Codec"
                  initialValue="aac"
                >
                  <Select>
                    <Option value="aac">AAC</Option>
                    <Option value="libopus">Opus</Option>
                    <Option value="mp3">MP3</Option>
                    <Option value="ac3">AC-3</Option>
                    <Option value="eac3">E-AC-3</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="audioBitrate"
                  label="Bitrate (kbps)"
                  initialValue={128}
                >
                  <InputNumber min={32} max={512} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="audioSampleRate"
                  label="Sample Rate (Hz)"
                  initialValue={44100}
                >
                  <Select>
                    <Option value={8000}>8000</Option>
                    <Option value={16000}>16000</Option>
                    <Option value={22050}>22050</Option>
                    <Option value={44100}>44100</Option>
                    <Option value={48000}>48000</Option>
                    <Option value={96000}>96000</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="audioChannels"
                  label="Channels"
                  initialValue={2}
                >
                  <Select>
                    <Option value={1}>Mono (1)</Option>
                    <Option value={2}>Stereo (2)</Option>
                    <Option value={6}>5.1 (6)</Option>
                    <Option value={8}>7.1 (8)</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Panel>

          <Panel header="Encoder Settings" key="encoder">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="encoderName"
                  label="Encoder Name"
                  initialValue="x264"
                >
                  <Input placeholder="e.g., x264, x265, vp8" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="encoderType"
                  label="Encoder Type"
                  initialValue="software"
                >
                  <Select>
                    <Option value="software">Software</Option>
                    <Option value="hardware">Hardware</Option>
                    <Option value="gpu">GPU</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="encoderThreadCount"
                  label="Thread Count"
                  initialValue={0}
                  tooltip="0 = auto-detect"
                >
                  <InputNumber min={0} max={32} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Panel>
        </Collapse>

        <Divider />

        <Alert
          message="Multi-Output Optimization"
          description="This profile will be automatically optimized for the selected output format. LLHLS profiles are optimized for low-latency streaming, WebRTC for real-time communication, and HLS for compatibility."
          type="info"
          showIcon
        />

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => form.resetFields()}>
              Reset
            </Button>
            <Button type="primary" htmlType="submit">
              Save Profile
            </Button>
          </Space>
        </div>
      </Form>
    </Card>
  );
};
