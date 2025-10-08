import React, { useState } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Alert,
  Tabs,
  Collapse,
} from 'antd';
import {
  CodeOutlined,
  CopyOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { OutputProfileConfig } from '../types/index';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

export const ConfigurationGenerator: React.FC = () => {
  const [form] = Form.useForm();
  const [generatedConfig, setGeneratedConfig] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const generateOutputProfile = (values: OutputProfileConfig): string => {
    return `<!-- Distributor Compliant Output Profile for SRT Stream -->
<OutputProfile>
    <Name>${values.name}</Name>
    <OutputStreamName>distributor_srt</OutputStreamName>
    
    <!-- Video Encoding Configuration -->
    <Encodes>
        <Video>
            <Codec>h264</Codec>
            <Width>${values.resolution.split('x')[0]}</Width>
            <Height>${values.resolution.split('x')[1]}</Height>
            <Bitrate>${values.videoBitrate}</Bitrate>
            <BitrateString>${Math.round(values.videoBitrate / 1000000)}M</BitrateString>
            <Profile>high</Profile>
            <Preset>medium</Preset>
            <Bframes>${values.bframes}</Bframes>
            <KeyFrameInterval>${values.gop}</KeyFrameInterval>
            <RcMode>cbr</RcMode>
            <ThreadCount>0</ThreadCount>
        </Video>
        
        <!-- Audio Encoding Configuration with Loudness Normalization -->
        <Audio>
            <Codec>aac</Codec>
            <Bitrate>${values.audioBitrate}</Bitrate>
            <BitrateString>${Math.round(values.audioBitrate / 1000)}k</BitrateString>
            <Samplerate>48000</Samplerate>
            <Channel>2</Channel>
            <AudioProcessor>
                <LoudnessNormalizer>
                    <TargetLKFS>${values.loudness}</TargetLKFS>
                </LoudnessNormalizer>
            </AudioProcessor>
        </Audio>
    </Encodes>
    
    <!-- MPEG-TS Container Configuration -->
    <Encoders>
        <Encoder>
            <Name>mpegts</Name>
            <Type>mpegts</Type>
            <ThreadCount>0</ThreadCount>
            <Options>
                <Option>
                    <Key>mpegts_m2ts_mode</Key>
                    <Value>1</Value>
                </Option>
                <Option>
                    <Key>mpegts_copyts</Key>
                    <Value>1</Value>
                </Option>
                <Option>
                    <Key>mpegts_start_pcr</Key>
                    <Value>1</Value>
                </Option>
                <Option>
                    <Key>mpegts_pcr_period</Key>
                    <Value>20</Value>
                </Option>
                <!-- SCTE-35 Data on PID 500 -->
                <Option>
                    <Key>mpegts_pmt_start_pid</Key>
                    <Value>500</Value>
                </Option>
                <Option>
                    <Key>mpegts_start_pid</Key>
                    <Value>500</Value>
                </Option>
            </Options>
        </Encoder>
    </Encoders>
    
    <!-- SRT Push Configuration -->
    <Publishers>
        <SRT>
            <Port>9999</Port>
            <Latency>2000</Latency>
            <RecvLatency>2000</RecvLatency>
            <PeerLatency>2000</PeerLatency>
            <Backlog>5</Backlog>
            <SendBufferSize>65536</SendBufferSize>
            <RecvBufferSize>65536</RecvBufferSize>
            <UdpRecvBufferSize>65536</UdpRecvBufferSize>
            <UdpSendBufferSize>65536</UdpSendBufferSize>
            <Maxbw>0</Maxbw>
            <Inputbw>0</Inputbw>
            <Oheadbw>25</Oheadbw>
            <Congestion>0</Congestion>
            <Tsbpd>1</Tsbpd>
            <Tlpktdrop>1</Tlpktdrop>
            <Sndbuf>0</Sndbuf>
            <Rcvbuf>0</Rcvbuf>
            <Lossmaxttl>0</Lossmaxttl>
            <Minversion>0x010000</Minversion>
            <Streamid></Streamid>
            <Smoother>live</Smoother>
            <Messageapi>1</Messageapi>
            <PayloadSize>1316</PayloadSize>
            <SrtEnc>0</SrtEnc>
            <Srtpbkeylen>0</Srtpbkeylen>
            <Srtpassphrase></Srtpassphrase>
            <Srtkmrefreshrate>0</Srtkmrefreshrate>
            <Srtkmstate>0</Srtkmstate>
            <Srtkmpreannounce>0</Srtkmpreannounce>
            <Srtkmr>0</Srtkmr>
            <Srtkmx>0</Srtkmx>
            <Srtkmy>0</Srtkmy>
            <Srtkmz>0</Srtkmz>
            <Srtkmw>0</Srtkmw>
            <Srtkmv>0</Srtkmv>
            <Srtkmu>0</Srtkmu>
            <Srtkmt>0</Srtkmt>
            <Srtkms>0</Srtkms>
            <Srtkmq>0</Srtkmq>
            <Srtkmp>0</Srtkmp>
            <Srtkmo>0</Srtkmo>
            <Srtkmn>0</Srtkmn>
            <Srtkml>0</Srtkml>
            <Srtkmk>0</Srtkmk>
            <Srtkmj>0</Srtkmj>
            <Srtkmi>0</Srtkmi>
            <Srtkmh>0</Srtkmh>
            <Srtkmg>0</Srtkmg>
            <Srtkmf>0</Srtkmf>
            <Srtkme>0</Srtkme>
            <Srtkmd>0</Srtkmd>
            <Srtkmc>0</Srtkmc>
            <Srtkmb>0</Srtkmb>
            <Srtkma>0</Srtkma>
            <Srtkm9>0</Srtkm9>
            <Srtkm8>0</Srtkm8>
            <Srtkm7>0</Srtkm7>
            <Srtkm6>0</Srtkm6>
            <Srtkm5>0</Srtkm5>
            <Srtkm4>0</Srtkm4>
            <Srtkm3>0</Srtkm3>
            <Srtkm2>0</Srtkm2>
            <Srtkm1>0</Srtkm1>
            <Srtkm0>0</Srtkm0>
        </SRT>
    </Publishers>
</OutputProfile>`;
  };

  const handleGenerate = (values: OutputProfileConfig) => {
    const config = generateOutputProfile(values);
    setGeneratedConfig(config);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedConfig);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedConfig], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output-profile.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const presetConfigs = {
    distributor: {
      name: 'DistributorCompliantSRT',
      videoBitrate: 5000000,
      audioBitrate: 128000,
      resolution: '1920x1080',
      gop: 12,
      bframes: 5,
      loudness: -20,
    },
    highQuality: {
      name: 'HighQualitySRT',
      videoBitrate: 8000000,
      audioBitrate: 256000,
      resolution: '1920x1080',
      gop: 12,
      bframes: 5,
      loudness: -20,
    },
    lowLatency: {
      name: 'LowLatencySRT',
      videoBitrate: 3000000,
      audioBitrate: 128000,
      resolution: '1280x720',
      gop: 6,
      bframes: 2,
      loudness: -20,
    },
  };

  const applyPreset = (preset: keyof typeof presetConfigs) => {
    form.setFieldsValue(presetConfigs[preset]);
  };

  return (
    <Card
      title={
        <Space>
          <CodeOutlined />
          <span>OME Configuration Generator</span>
        </Space>
      }
    >
      <Alert
        message="Configuration Generator"
        description="Generate compliant OME Server.xml OutputProfile configurations. Use presets for common scenarios or customize parameters for specific requirements."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={24}>
        <Col span={12}>
          <Card title="Configuration Parameters" size="small">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleGenerate}
              initialValues={presetConfigs.distributor}
            >
              <Form.Item
                name="name"
                label="Profile Name"
                rules={[{ required: true, message: 'Please enter profile name' }]}
              >
                <Input placeholder="DistributorCompliantSRT" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="videoBitrate"
                    label="Video Bitrate (bps)"
                    rules={[{ required: true, message: 'Please enter video bitrate' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="5000000"
                      min={1000000}
                      max={50000000}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="audioBitrate"
                    label="Audio Bitrate (bps)"
                    rules={[{ required: true, message: 'Please enter audio bitrate' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="128000"
                      min={64000}
                      max={512000}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="resolution"
                label="Resolution"
                rules={[{ required: true, message: 'Please select resolution' }]}
              >
                <Input placeholder="1920x1080" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="gop"
                    label="GOP Size"
                    rules={[{ required: true, message: 'Please enter GOP size' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="12"
                      min={1}
                      max={60}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="bframes"
                    label="B-Frames"
                    rules={[{ required: true, message: 'Please enter B-frames count' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="5"
                      min={0}
                      max={16}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="loudness"
                label="Audio Loudness (LKFS)"
                rules={[{ required: true, message: 'Please enter loudness target' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="-20"
                  min={-30}
                  max={-10}
                  step={0.1}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<CodeOutlined />}>
                    Generate Config
                  </Button>
                  <Button onClick={() => applyPreset('distributor')}>
                    Distributor Preset
                  </Button>
                  <Button onClick={() => applyPreset('highQuality')}>
                    High Quality
                  </Button>
                  <Button onClick={() => applyPreset('lowLatency')}>
                    Low Latency
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Generated Configuration" size="small">
            {generatedConfig ? (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    icon={<CopyOutlined />}
                    onClick={handleCopy}
                  >
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                  >
                    Download XML
                  </Button>
                </Space>
                <TextArea
                  value={generatedConfig}
                  readOnly
                  rows={20}
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                />
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <InfoCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">
                    Configure parameters and click "Generate Config" to create your OME OutputProfile XML.
                  </Text>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Divider />

      <Collapse>
        <Panel header="Configuration Details" key="1">
          <Row gutter={16}>
            <Col span={8}>
              <Title level={5}>Video Settings</Title>
              <Paragraph>
                <Text code>Codec:</Text> H.264 (High Profile)
                <br />
                <Text code>Resolution:</Text> Configurable (1920x1080 recommended)
                <br />
                <Text code>Bitrate:</Text> Configurable (5 Mbps recommended)
                <br />
                <Text code>GOP:</Text> Configurable (12 recommended)
                <br />
                <Text code>B-Frames:</Text> Configurable (5 recommended)
              </Paragraph>
            </Col>
            <Col span={8}>
              <Title level={5}>Audio Settings</Title>
              <Paragraph>
                <Text code>Codec:</Text> AAC-LC
                <br />
                <Text code>Bitrate:</Text> Configurable (128 Kbps recommended)
                <br />
                <Text code>Sample Rate:</Text> 48 kHz
                <br />
                <Text code>Channels:</Text> Stereo (2)
                <br />
                <Text code>Loudness:</Text> Configurable (-20 LKFS recommended)
              </Paragraph>
            </Col>
            <Col span={8}>
              <Title level={5}>Container & SRT</Title>
              <Paragraph>
                <Text code>Container:</Text> MPEG-TS
                <br />
                <Text code>SCTE-35 PID:</Text> 500
                <br />
                <Text code>SRT Latency:</Text> 2000ms
                <br />
                <Text code>Port:</Text> 9999
                <br />
                <Text code>Mode:</Text> Push
              </Paragraph>
            </Col>
          </Row>
        </Panel>
      </Collapse>
    </Card>
  );
};
