import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Select,
  Space,
  Typography,
  Tag,
  Popconfirm,
  message,
  Tabs,
  Row,
  Col,
  Divider,
  Alert,
  Tooltip,
  Badge,
  Collapse,
  Checkbox,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  SecurityScanOutlined,
  GlobalOutlined,
  SettingOutlined,
  CloudServerOutlined,
  AppstoreOutlined,
  PlayCircleOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  CodeOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useStore } from '../../../store/useStore';
import { OMEApiService } from '../../../services/omeApi';
import type { OMEVHostDetailed, SignedPolicy, AdmissionWebhooks } from '../../../types/index';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

export const VHostManagement: React.FC = () => {
  const [vhosts, setVHosts] = useState<any[]>([]);
  const [vhostDetails, setVHostDetails] = useState<OMEVHostDetailed[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVHost, setEditingVHost] = useState<OMEVHostDetailed | null>(null);
  const [selectedVHost, setSelectedVHost] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationModalVisible, setApplicationModalVisible] = useState(false);
  const [editingApplication, setEditingApplication] = useState<any>(null);
  const [applicationForm] = Form.useForm();
  const [form] = Form.useForm();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewApp, setPreviewApp] = useState<any>(null);
  const [previewStreamName, setPreviewStreamName] = useState<string>('live');
  const [previewProtocol, setPreviewProtocol] = useState<'llhls' | 'webrtc'>('llhls');
  const [streamStatus, setStreamStatus] = useState<{
    online: boolean;
    videoBitrateKbps?: number;
    audioBitrateKbps?: number;
    width?: number;
    height?: number;
    fps?: number;
  }>({ online: false });
  
  const { omeHost, omePort, omeUsername, omePassword } = useStore();
  const omeApi = new OMEApiService(omeHost, omePort, omeUsername, omePassword);

  useEffect(() => {
    loadVHosts();
  }, [omeHost, omePort]);

  const loadVHosts = async () => {
    setLoading(true);
    try {
          const response = await omeApi.getVHosts();
          const vhostList = response.success ? response.data : [];
          console.log('VHosts response:', response);
          console.log('VHosts list:', vhostList);
          
          // Add dynamic virtual host if it's not already in the list
          if (!vhostList.includes('dynamic' as any)) {
            vhostList.push('dynamic' as any);
          }
          
          setVHosts(vhostList);
      
      // Load detailed information for each vhost
      const details = await Promise.all(
        vhostList.map(async (vhost) => {
          try {
            // vhost is a string, so we use it directly as the name
            const vhostName = typeof vhost === 'string' ? vhost : vhost.name;
                const detailed = await omeApi.getVHostDetailed(vhostName as any);
            console.log(`Loaded details for vhost ${vhostName}:`, detailed);
            return detailed;
          } catch (error) {
            console.error(`Failed to load details for vhost ${vhost}:`, error);
            // Return basic structure if detailed info fails
            const vhostName = typeof vhost === 'string' ? vhost : vhost.name;
            return {
              name: vhostName,
              host: { names: [] },
              distribution: 'ovenmediaengine.com'
            };
          }
        })
      );
      
      setVHostDetails(details.filter(Boolean) as OMEVHostDetailed[]);
      
      // Set first vhost as selected by default
      if (vhostList.length > 0 && !selectedVHost) {
        const firstVHost = typeof vhostList[0] === 'string' ? vhostList[0] : vhostList[0].name;
        setSelectedVHost(firstVHost);
        loadApplications(firstVHost);
      }
    } catch (error) {
      message.error('Failed to load virtual hosts');
      console.error('Error loading vhosts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (vhostName: string) => {
    try {
      const appsResponse = await omeApi.getApplications(vhostName);
      const apps = appsResponse.success ? appsResponse.data : [];
      console.log(`Applications for ${vhostName}:`, appsResponse);
      
      // Load detailed information for each application
      const detailedApps = await Promise.all(
        apps.map(async (app) => {
          try {
            const appName = typeof app === 'string' ? app : app.name;
            const detailed = await omeApi.getApplicationDetailed(vhostName as any, appName);
            return detailed;
          } catch (error) {
            console.error(`Failed to load details for app ${app}:`, error);
            return {
              name: typeof app === 'string' ? app : app.name,
              type: 'app',
              dynamic: false
            };
          }
        })
      );
      
      setApplications(detailedApps);
    } catch (error) {
      console.error(`Failed to load applications for ${vhostName}:`, error);
      setApplications([]);
    }
  };

  const handleViewApplication = (app: any) => {
    Modal.info({
      title: `Application: ${app.name}`,
      width: 800,
      content: (
        <div>
          <p><strong>Type:</strong> {app.type}</p>
          <p><strong>Dynamic:</strong> {app.dynamic ? 'Yes' : 'No'}</p>
          {app.outputProfiles && (
            <div>
              <strong>Output Profiles:</strong>
              <ul>
                {app.outputProfiles.outputprofile?.map((profile: any, index: number) => (
                  <li key={index}>{profile.name} - {profile.outputStreamName}</li>
                ))}
              </ul>
            </div>
          )}
          {app.providers && (
            <div>
              <strong>Providers:</strong>
              <ul>
                {Object.keys(app.providers).map(key => (
                  <li key={key}>{key.toUpperCase()}</li>
                ))}
              </ul>
            </div>
          )}
          {app.publishers && (
            <div>
              <strong>Publishers:</strong>
              <ul>
                {Object.keys(app.publishers).map(key => (
                  <li key={key}>{key.toUpperCase()}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    });
  };

  const handlePreviewApplication = (app: any) => {
    setPreviewApp(app);
    setPreviewVisible(true);
  };

  useEffect(() => {
    let interval: any;
    const fetchStatus = async () => {
      try {
        if (!previewVisible || !previewApp || !selectedVHost || !previewStreamName) return;
        const base = `http://${omeHost}:${omePort}/v1`;
        const url = `${base}/vhosts/${selectedVHost}/apps/${encodeURIComponent(previewApp.name)}/streams/${encodeURIComponent(previewStreamName)}`;
        const auth = typeof window !== 'undefined' && (window as any).btoa ? (window as any).btoa(omeUsername) : '';
        const res = await fetch(url, {
          headers: {
            Authorization: `Basic ${auth}`
          }
        });
        if (!res.ok) {
          setStreamStatus({ online: false });
          return;
        }
        const data = await res.json();
        const resp = data.response || {};
        // Prefer output track metrics when available
        const outputs = resp.outputs || [];
        let videoBitrateKbps: number | undefined;
        let audioBitrateKbps: number | undefined;
        let width: number | undefined;
        let height: number | undefined;
        let fps: number | undefined;
        if (outputs.length > 0 && outputs[0].tracks) {
          const vTrack = outputs[0].tracks.find((t: any) => t.type === 'Video');
          const aTrack = outputs[0].tracks.find((t: any) => t.type === 'Audio');
          if (vTrack && vTrack.video) {
            width = vTrack.video.width;
            height = vTrack.video.height;
            fps = vTrack.video.framerate || vTrack.video.framerateLatest || undefined;
            const vb = vTrack.video.bitrateLatest || vTrack.video.bitrate || vTrack.video.bitrateAvg;
            videoBitrateKbps = vb ? Math.round(vb / 1000) : undefined;
          }
          if (aTrack && aTrack.audio) {
            const ab = aTrack.audio.bitrateLatest || aTrack.audio.bitrate || aTrack.audio.bitrateAvg;
            audioBitrateKbps = ab ? Math.round(ab / 1000) : undefined;
          }
        } else if (resp.input && resp.input.tracks) {
          const vIn = resp.input.tracks.find((t: any) => t.type === 'Video');
          const aIn = resp.input.tracks.find((t: any) => t.type === 'Audio');
          if (vIn && vIn.video) {
            width = vIn.video.width;
            height = vIn.video.height;
            fps = vIn.video.framerate || vIn.video.framerateAvg || undefined;
            const vb = vIn.video.bitrateLatest || vIn.video.bitrate || vIn.video.bitrateAvg;
            videoBitrateKbps = vb ? Math.round(vb / 1000) : undefined;
          }
          if (aIn && aIn.audio) {
            const ab = aIn.audio.bitrateLatest || aIn.audio.bitrate || aIn.audio.bitrateAvg;
            audioBitrateKbps = ab ? Math.round(ab / 1000) : undefined;
          }
        }
        setStreamStatus({
          online: true,
          videoBitrateKbps,
          audioBitrateKbps,
          width,
          height,
          fps
        });
      } catch (e) {
        setStreamStatus({ online: false });
      }
    };
    if (previewVisible) {
      fetchStatus();
      interval = setInterval(fetchStatus, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [previewVisible, previewApp, previewStreamName, selectedVHost, omeHost, omePort, omeUsername]);

  const handleEditApplication = (app: any) => {
    setEditingApplication(app);
    applicationForm.setFieldsValue({
      name: app.name,
      type: app.type,
      dynamic: app.dynamic,
      // Add other fields as needed
    });
    setApplicationModalVisible(true);
  };

  const handleDeleteApplication = async (app: any) => {
    if (!selectedVHost) return;
    
    try {
      const response = await omeApi.deleteApplication(selectedVHost, app.name);
      message.success(response.message || 'Application deleted successfully');
      loadApplications(selectedVHost);
    } catch (error: any) {
      let errorMessage = 'Failed to delete application';
      if (error.response) {
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`;
        console.error('Server error response:', error.response.data);
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
        console.error('No response received:', error.request);
      } else {
        errorMessage = `Request error: ${error.message}`;
        console.error('Request setup error:', error.message);
      }
      message.error(errorMessage);
      console.error('Full error object:', error);
    }
  };

  const handleTemplateChange = (template: string) => {
    // Auto-fill form based on template
    const templateConfigs = {
      basic: {
        type: 'live',
        description: 'Simple live streaming with default settings'
      },
      'multi-output': {
        type: 'live',
        description: 'Multi-format output (LLHLS + WebRTC) for maximum compatibility'
      },
      broadcast: {
        type: 'live',
        description: 'High-quality broadcast settings with multiple resolutions'
      },
      'low-latency': {
        type: 'live',
        description: 'Ultra low-latency streaming optimized for real-time applications'
      },
      custom: {
        type: 'live',
        description: 'Custom configuration - you can modify all settings'
      }
    };
    
    const config = templateConfigs[template as keyof typeof templateConfigs];
    if (config) {
      applicationForm.setFieldsValue({
        type: config.type,
        description: config.description
      });
    }
  };

  const renderTemplateConfig = (template: string) => {
    switch (template) {
      case 'basic':
        return (
          <Alert
            message="Basic Live Streaming"
            description="Simple setup with RTMP input and LLHLS output. Perfect for basic live streaming needs."
            type="info"
            showIcon
          />
        );
      
      case 'multi-output':
        return (
          <Alert
            message="Multi-Output Configuration"
            description="Supports both LLHLS (for web browsers) and WebRTC (for ultra low-latency). Best for interactive applications."
            type="success"
            showIcon
          />
        );
      
      case 'broadcast':
        return (
          <Alert
            message="Broadcast Quality"
            description="High-quality streaming with multiple resolution outputs (1080p, 720p, 480p). Ideal for professional broadcasting."
            type="warning"
            showIcon
          />
        );
      
      case 'low-latency':
        return (
          <Alert
            message="Ultra Low-Latency"
            description="Optimized for real-time applications with WebRTC and LLHLS. Perfect for gaming, live auctions, or interactive content."
            type="error"
            showIcon
          />
        );
      
      case 'custom':
        return (
          <Alert
            message="Custom Configuration"
            description="You can modify all settings after creation. Advanced users can configure providers, publishers, and output profiles manually."
            type="info"
            showIcon
          />
        );
      
      default:
        return null;
    }
  };

  const handleApplicationModalSubmit = async (values: any) => {
    if (!selectedVHost) {
      message.error('Please select a virtual host first');
      return;
    }
    
    // Check if the selected virtual host is read-only
    let targetVHost = selectedVHost;
    if (selectedVHost === 'default' || selectedVHost === 'test') {
      message.warning('The selected virtual host is read-only. Applications will be created in the "dynamic" virtual host instead.');
      // Use dynamic virtual host for creating applications
      targetVHost = 'dynamic';
    }
    
    // Validate form data
    if (!values.name || values.name.trim() === '') {
      message.error('Please enter an application name');
      return;
    }
    
    // Validate application name format
    if (!/^[a-zA-Z0-9_-]+$/.test(values.name)) {
      message.error('Application name can only contain letters, numbers, underscores, and hyphens');
      return;
    }
    
    try {
      // Create application with enhanced configuration
      const appData = {
        name: values.name,
        type: values.type || 'live'
      };
      
      // Log the configuration for debugging
      console.log(`Creating application with template: ${values.template}`);
      console.log(`Selected providers: ${values.providers || []}`);
      console.log(`Selected publishers: ${values.publishers || []}`);
      
      // Store the configuration for future reference
      const configInfo = {
        template: values.template,
        providers: values.providers || [],
        publishers: values.publishers || [],
        timestamp: new Date().toISOString()
      };
      
      // For now, we'll use the simple structure and let OME handle the defaults
      // The output configuration will be applied through OME's default settings
      // In the future, we can extend this to send specific provider/publisher configurations
      
      console.log('Creating application with data:', appData);
      console.log('Selected VHost:', selectedVHost);
      console.log('Target VHost:', targetVHost);
      
      let response;
      if (editingApplication) {
        console.log('Updating application:', editingApplication.name);
        response = await omeApi.updateApplication(targetVHost, editingApplication.name, appData);
      } else {
        console.log('Creating new application');
        response = await omeApi.createApplication(targetVHost, appData);
      }
      
      console.log('API Response:', response);
      
      // If we get here, the API call was successful
      message.success(response.message || 'Application saved successfully');
      setApplicationModalVisible(false);
      setEditingApplication(null);
      applicationForm.resetFields();
      // Refresh applications for the target virtual host
      loadApplications(targetVHost);
    } catch (error: any) {
      let errorMessage = 'Failed to save application';
      if (error.response) {
        // Server responded with error status
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`;
        console.error('Server error response:', error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
        console.error('No response received:', error.request);
      } else {
        // Something else happened
        errorMessage = `Request error: ${error.message}`;
        console.error('Request setup error:', error.message);
      }
      message.error(errorMessage);
      console.error('Full error object:', error);
    }
  };

  const handleCreateVHost = async (values: any) => {
    try {
      const vhostData: OMEVHostDetailed = {
        name: values.name,
        distribution: values.distribution,
        host: values.hostNames ? {
          names: values.hostNames.split(',').map((name: string) => name.trim()),
          tls: values.tlsEnabled ? {
            certPath: values.certPath,
            chainCertPath: values.chainCertPath,
            keyPath: values.keyPath,
          } : undefined,
        } : undefined,
        signedPolicy: values.signedPolicyEnabled ? {
          enables: {
            providers: values.providersEnabled ? 'on' : 'off',
            publishers: values.publishersEnabled ? 'on' : 'off',
          },
          policyQueryKeyName: values.policyQueryKeyName,
          secretKey: values.secretKey,
          signatureQueryKeyName: values.signatureQueryKeyName,
        } : undefined,
        admissionWebhooks: values.admissionWebhooksEnabled ? {
          controlServerUrl: values.controlServerUrl,
          secretKey: values.webhookSecretKey,
          timeout: values.webhookTimeout,
          enables: {
            providers: values.webhookProvidersEnabled ? 'on' : 'off',
            publishers: values.webhookPublishersEnabled ? 'on' : 'off',
          },
        } : undefined,
        origins: values.originsEnabled ? {
          origin: values.origins.map((origin: any) => ({
            location: origin.location,
            pass: {
              schema: origin.schema,
              urls: {
                url: origin.urls.split(',').map((url: string) => url.trim()),
              },
            },
          })),
        } : undefined,
        originMapStore: values.originMapStoreEnabled ? {
          originHostName: values.originHostName,
          redisServer: {
            host: values.redisHost,
            auth: values.redisAuth,
          },
        } : undefined,
      };

      await omeApi.createVHost(vhostData);
      message.success('Virtual host created successfully');
      setModalVisible(false);
      form.resetFields();
      loadVHosts();
    } catch (error) {
      message.error('Failed to create virtual host');
      console.error('Error creating vhost:', error);
    }
  };

  const handleDeleteVHost = async (vhostName: string) => {
    try {
      await omeApi.deleteVHost(vhostName);
      message.success('Virtual host deleted successfully');
      loadVHosts();
    } catch (error) {
      message.error('Failed to delete virtual host');
      console.error('Error deleting vhost:', error);
    }
  };

  const getVHostStatus = (vhost: OMEVHostDetailed) => {
    const hasTLS = vhost.host?.tls;
    const hasSignedPolicy = vhost.signedPolicy;
    const hasAdmissionWebhooks = vhost.admissionWebhooks;
    const hasOrigins = vhost.origins;
    
    return {
      tls: hasTLS,
      security: hasSignedPolicy || hasAdmissionWebhooks,
      origins: hasOrigins,
    };
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <CloudServerOutlined />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Distribution',
      dataIndex: 'distribution',
      key: 'distribution',
      render: (distribution: string) => distribution || 'default',
    },
    {
      title: 'Host Names',
      dataIndex: 'host',
      key: 'hostNames',
      render: (host: any) => (
        <div>
          {host?.names?.map((name: string, index: number) => (
            <Tag key={index} color="blue">{name}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: OMEVHostDetailed) => {
        const status = getVHostStatus(record);
        return (
          <Space>
            {status.tls && <Tag color="green" icon={<SecurityScanOutlined />}>TLS</Tag>}
            {status.security && <Tag color="orange" icon={<SecurityScanOutlined />}>Security</Tag>}
            {status.origins && <Tag color="purple" icon={<GlobalOutlined />}>Origins</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Applications',
      dataIndex: 'applications',
      key: 'applications',
      render: (applications: any) => (
        <Badge count={applications?.application?.length || 0} showZero color="blue" />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: OMEVHostDetailed) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() => {
                setEditingVHost(record);
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingVHost(record);
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this virtual host?"
            onConfirm={() => handleDeleteVHost(record.name)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleQuickCreate = async () => {
    if (!selectedVHost) {
      message.error('Please select a virtual host first');
      return;
    }
    
    // Check if the selected virtual host is read-only
    let targetVHost = selectedVHost;
    if (selectedVHost === 'default' || selectedVHost === 'test') {
      message.warning('The selected virtual host is read-only. Applications will be created in the "dynamic" virtual host instead.');
      targetVHost = 'dynamic';
    }
    
    try {
      // Generate a unique application name
      const timestamp = Date.now();
      const appName = `quick-app-${timestamp}`;
      
      const appData = {
        name: appName,
        type: 'live'
      };
      
      console.log('Quick creating application with data:', appData);
      const response = await omeApi.createApplication(targetVHost, appData);
      
      message.success(`Quick application "${appName}" created successfully!`);
      loadApplications(targetVHost);
    } catch (error: any) {
      let errorMessage = 'Failed to create quick application';
      if (error.response) {
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`;
      }
      message.error(errorMessage);
      console.error('Quick create error:', error);
    }
  };

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            <CloudServerOutlined /> Virtual Host Management
          </Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadVHosts}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingVHost(null);
                setModalVisible(true);
              }}
            >
              Create VHost
            </Button>
          </Space>
        </div>

        <Tabs defaultActiveKey="vhosts">
          <TabPane tab="Virtual Hosts" key="vhosts">
            <Table
              columns={columns}
              dataSource={vhostDetails.length > 0 ? vhostDetails : vhosts.map(v => ({ 
                name: typeof v === 'string' ? v : v.name, 
                host: { names: [] },
                distribution: 'ovenmediaengine.com'
              }))}
              rowKey="name"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </TabPane>
          
              <TabPane tab="Applications" key="applications">
                <Alert
                  message="Virtual Host Information"
                  description={
                    <div>
                      <p><strong>Read-only Virtual Hosts:</strong> "default" and "test" virtual hosts are read-only and cannot have applications created directly.</p>
                      <p><strong>Dynamic Virtual Host:</strong> Applications will be created in the "dynamic" virtual host, which is writable.</p>
                      <p><strong>Note:</strong> You can still view applications in read-only virtual hosts, but new applications will be created in the dynamic virtual host.</p>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <div style={{ marginBottom: 16 }}>
                  <Space>
                    <Select
                      style={{ width: 200 }}
                      placeholder="Select Virtual Host"
                      value={selectedVHost}
                      onChange={(value) => {
                        setSelectedVHost(value);
                        loadApplications(value);
                      }}
                    >
                      {vhosts.map(vhost => (
                        <Option key={vhost} value={vhost}>
                          {vhost} {vhost === 'default' || vhost === 'test' ? '(Read-only)' : vhost === 'dynamic' ? '(Writable)' : ''}
                        </Option>
                      ))}
                    </Select>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={() => setApplicationModalVisible(true)}
                      disabled={!selectedVHost}
                    >
                      Create Application
                    </Button>
                    <Button 
                      type="default" 
                      icon={<RocketOutlined />}
                      onClick={() => handleQuickCreate()}
                      disabled={!selectedVHost}
                    >
                      Quick Create
                    </Button>
                  </Space>
                </div>
                
                <Table
                  columns={[
                    {
                      title: 'Application Name',
                      dataIndex: 'name',
                      key: 'name',
                      render: (name: string, record: any) => (
                        <Space>
                          <AppstoreOutlined />
                          <div>
                            <Text strong>{name}</Text>
                            {record.dynamic && (
                              <Tag color="orange" style={{ marginLeft: 8 }}>
                                Dynamic
                              </Tag>
                            )}
                          </div>
                        </Space>
                      ),
                    },
                    {
                      title: 'Type',
                      dataIndex: 'type',
                      key: 'type',
                      render: (type: string) => (
                        <Tag color="blue">{type || 'app'}</Tag>
                      ),
                    },
                    {
                      title: 'Output Profiles',
                      dataIndex: 'outputProfiles',
                      key: 'outputProfiles',
                      render: (outputProfiles: any) => (
                        <Space wrap>
                          {outputProfiles?.outputprofile?.map((profile: any, index: number) => (
                            <Tag key={index} color="green">
                              {profile.name}
                            </Tag>
                          )) || <Tag color="default">None</Tag>}
                        </Space>
                      ),
                    },
                    {
                      title: 'Providers',
                      dataIndex: 'providers',
                      key: 'providers',
                      render: (providers: any) => (
                        <Space wrap>
                          {providers && Object.keys(providers).map(key => (
                            <Tag key={key} color="purple">
                              {key.toUpperCase()}
                            </Tag>
                          ))}
                          {!providers && <Tag color="default">None</Tag>}
                        </Space>
                      ),
                    },
                    {
                      title: 'Publishers',
                      dataIndex: 'publishers',
                      key: 'publishers',
                      render: (publishers: any) => (
                        <Space wrap>
                          {publishers && Object.keys(publishers).map(key => (
                            <Tag key={key} color="cyan">
                              {key.toUpperCase()}
                            </Tag>
                          ))}
                          {!publishers && <Tag color="default">None</Tag>}
                        </Space>
                      ),
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: (record: any) => (
                        <Space>
                          <Tooltip title="Preview Stream">
                            <Button
                              type="text"
                              icon={<EyeOutlined />}
                              onClick={() => handlePreviewApplication(record)}
                            />
                          </Tooltip>
                          <Tooltip title="View Details">
                            <Button
                              type="text"
                              icon={<InfoCircleOutlined />}
                              onClick={() => handleViewApplication(record)}
                            />
                          </Tooltip>
                          <Tooltip title="Edit Application">
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              onClick={() => handleEditApplication(record)}
                            />
                          </Tooltip>
                          <Tooltip title="Delete Application">
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteApplication(record)}
                            />
                          </Tooltip>
                        </Space>
                      ),
                    },
                  ]}
                  dataSource={applications}
                  rowKey="name"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  locale={{
                    emptyText: selectedVHost ? 'No applications found' : 'Select a virtual host to view applications'
                  }}
                />
              </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={editingVHost ? 'Edit Virtual Host' : 'Create Virtual Host'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingVHost(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateVHost}
          initialValues={editingVHost || {}}
        >
          <Tabs defaultActiveKey="basic">
            <TabPane tab="Basic" key="basic">
              <Form.Item
                name="name"
                label="Virtual Host Name"
                rules={[{ required: true, message: 'Please enter virtual host name' }]}
              >
                <Input placeholder="e.g., default" />
              </Form.Item>

              <Form.Item
                name="distribution"
                label="Distribution"
              >
                <Select placeholder="Select distribution">
                  <Option value="default">Default</Option>
                  <Option value="origin">Origin</Option>
                  <Option value="edge">Edge</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="hostNames"
                label="Host Names (comma-separated)"
              >
                <Input placeholder="e.g., localhost, example.com" />
              </Form.Item>
            </TabPane>

            <TabPane tab="TLS" key="tls">
              <Form.Item name="tlsEnabled" valuePropName="checked">
                <Switch /> Enable TLS
              </Form.Item>

              <Form.Item
                name="certPath"
                label="Certificate Path"
                dependencies={['tlsEnabled']}
              >
                <Input placeholder="/path/to/cert.pem" />
              </Form.Item>

              <Form.Item
                name="chainCertPath"
                label="Chain Certificate Path"
                dependencies={['tlsEnabled']}
              >
                <Input placeholder="/path/to/chain.pem" />
              </Form.Item>

              <Form.Item
                name="keyPath"
                label="Private Key Path"
                dependencies={['tlsEnabled']}
              >
                <Input placeholder="/path/to/key.pem" />
              </Form.Item>
            </TabPane>

            <TabPane tab="Security" key="security">
              <Title level={5}>Signed Policy</Title>
              <Form.Item name="signedPolicyEnabled" valuePropName="checked">
                <Switch /> Enable Signed Policy
              </Form.Item>

              <Form.Item
                name="policyQueryKeyName"
                label="Policy Query Key Name"
                dependencies={['signedPolicyEnabled']}
              >
                <Input placeholder="policy" />
              </Form.Item>

              <Form.Item
                name="secretKey"
                label="Secret Key"
                dependencies={['signedPolicyEnabled']}
              >
                <Input.Password placeholder="Enter secret key" />
              </Form.Item>

              <Form.Item
                name="signatureQueryKeyName"
                label="Signature Query Key Name"
                dependencies={['signedPolicyEnabled']}
              >
                <Input placeholder="signature" />
              </Form.Item>

              <Divider />

              <Title level={5}>Admission Webhooks</Title>
              <Form.Item name="admissionWebhooksEnabled" valuePropName="checked">
                <Switch /> Enable Admission Webhooks
              </Form.Item>

              <Form.Item
                name="controlServerUrl"
                label="Control Server URL"
                dependencies={['admissionWebhooksEnabled']}
              >
                <Input placeholder="http://localhost:8080/webhook" />
              </Form.Item>

              <Form.Item
                name="webhookSecretKey"
                label="Webhook Secret Key"
                dependencies={['admissionWebhooksEnabled']}
              >
                <Input.Password placeholder="Enter webhook secret" />
              </Form.Item>

              <Form.Item
                name="webhookTimeout"
                label="Webhook Timeout (ms)"
                dependencies={['admissionWebhooksEnabled']}
              >
                <Input type="number" placeholder="5000" />
              </Form.Item>
            </TabPane>

            <TabPane tab="Origins" key="origins">
              <Form.Item name="originsEnabled" valuePropName="checked">
                <Switch /> Enable Origins
              </Form.Item>

              <Form.Item
                name="originMapStoreEnabled"
                label="Origin Map Store"
                valuePropName="checked"
              >
                <Switch /> Enable Origin Map Store
              </Form.Item>

              <Form.Item
                name="redisHost"
                label="Redis Host"
                dependencies={['originMapStoreEnabled']}
              >
                <Input placeholder="localhost:6379" />
              </Form.Item>

              <Form.Item
                name="redisAuth"
                label="Redis Auth"
                dependencies={['originMapStoreEnabled']}
              >
                <Input.Password placeholder="Redis password" />
              </Form.Item>
            </TabPane>
          </Tabs>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingVHost ? 'Update' : 'Create'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Modal
        title={previewApp ? `Preview: ${previewApp.name}` : 'Preview'}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={900}
        style={{ top: 20 }}
     >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Row gutter={12}>
            <Col span={10}>
              <Input
                value={previewStreamName}
                onChange={(e) => setPreviewStreamName(e.target.value)}
                addonBefore="Stream"
                placeholder="e.g., live"
              />
            </Col>
            <Col span={8}>
              <Select
                value={previewProtocol}
                onChange={(v) => setPreviewProtocol(v)}
                style={{ width: '100%' }}
              >
                <Option value="llhls">LLHLS</Option>
                <Option value="webrtc">WebRTC</Option>
              </Select>
            </Col>
            <Col span={6}>
              <Button icon={<ReloadOutlined />} onClick={() => setPreviewVisible((v) => v)}>
                Refresh
              </Button>
            </Col>
          </Row>

          {previewApp && (
            <Card size="small">
              {(() => {
                const appName = previewApp.name;
                const host = omeHost;
                const llhlsUrl = `http://${host}:5179/${appName}/${previewStreamName}/llhls.m3u8?t=${Date.now()}`;
                const webrtcUrl = `wss://${host}:3335/${appName}/${previewStreamName}`;
                const srcDoc = `<!doctype html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/><style>html,body,#p{height:100%;margin:0;background:#000}#wrap{position:relative;padding-top:56.25%}#player{position:absolute;top:0;left:0;width:100%;height:100%;}</style></head><body><div id=\"p\"><div id=\"wrap\"><div id=\"player\"></div></div></div><script src=\"https://cdn.jsdelivr.net/npm/ovenplayer@0.10.27/dist/ovenplayer.js\"></script><script>var conf={autoStart:true,controls:true,sources:[${previewProtocol==='llhls' ? `{type:'llhls',file:'${llhlsUrl.replace(/"/g,'\\"')}'}` : `{type:'webrtc',file:'${webrtcUrl.replace(/"/g,'\\"')}'`} ]};window.addEventListener('load',function(){try{OvenPlayer.create('player',conf);}catch(e){var d=document.createElement('div');d.style.color='#fff';d.style.padding='8px';d.textContent='Failed to load player: '+e.message;document.getElementById('player').appendChild(d);}});</script></body></html>`;
                return (
                  <div>
                    <Space style={{ width: '100%', marginBottom: 8 }} wrap>
                      <Tag color={streamStatus.online ? 'green' : 'default'}>
                        {streamStatus.online ? 'Online' : 'Offline'}
                      </Tag>
                      {typeof streamStatus.videoBitrateKbps !== 'undefined' && (
                        <Tag color="blue">Video: {streamStatus.videoBitrateKbps} kbps</Tag>
                      )}
                      {typeof streamStatus.audioBitrateKbps !== 'undefined' && (
                        <Tag color="geekblue">Audio: {streamStatus.audioBitrateKbps} kbps</Tag>
                      )}
                      {(streamStatus.width && streamStatus.height) && (
                        <Tag color="purple">{streamStatus.width}x{streamStatus.height}</Tag>
                      )}
                      {streamStatus.fps && (
                        <Tag color="orange">{Math.round(streamStatus.fps)} fps</Tag>
                      )}
                    </Space>
                    <Alert
                      type="info"
                      showIcon
                      message={previewProtocol === 'llhls' ? 'LLHLS Preview' : 'WebRTC Preview'}
                      description={previewProtocol === 'llhls' ? llhlsUrl : webrtcUrl}
                      style={{ marginBottom: 8 }}
                    />
                    <iframe
                      title="stream-preview"
                      srcDoc={srcDoc}
                      sandbox="allow-scripts allow-same-origin"
                      style={{ width: '100%', height: 480, border: 0, borderRadius: 4 }}
                    />
                  </div>
                );
              })()}
            </Card>
          )}
        </Space>
      </Modal>

          {/* Organized Application Creation Modal */}
          <Modal
            title={editingApplication ? 'Edit Application' : 'Create New Application'}
            open={applicationModalVisible}
            onCancel={() => {
              setApplicationModalVisible(false);
              setEditingApplication(null);
              applicationForm.resetFields();
            }}
            onOk={() => applicationForm.submit()}
            width={900}
            okText={editingApplication ? 'Update' : 'Create Application'}
            cancelText="Cancel"
            style={{ top: 20 }}
          >
            <Form
              form={applicationForm}
              layout="vertical"
              onFinish={handleApplicationModalSubmit}
            >
              <Tabs defaultActiveKey="basic" size="small">
                {/* Basic Configuration Tab */}
                <TabPane tab="Basic Configuration" key="basic">
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <Form.Item
                        name="template"
                        label="Application Template"
                        initialValue="basic"
                        tooltip="Choose a template to quickly set up your application"
                      >
                        <Select onChange={(value) => handleTemplateChange(value)} size="large">
                          <Option value="basic">
                            <Space>
                              <PlayCircleOutlined />
                              <span>Basic Live Streaming</span>
                            </Space>
                          </Option>
                          <Option value="multi-output">
                            <Space>
                              <ThunderboltOutlined />
                              <span>Multi-Output (LLHLS + WebRTC)</span>
                            </Space>
                          </Option>
                          <Option value="broadcast">
                            <Space>
                              <VideoCameraOutlined />
                              <span>Broadcast Quality</span>
                            </Space>
                          </Option>
                          <Option value="low-latency">
                            <Space>
                              <RocketOutlined />
                              <span>Ultra Low-Latency</span>
                            </Space>
                          </Option>
                          <Option value="custom">
                            <Space>
                              <SettingOutlined />
                              <span>Custom Configuration</span>
                            </Space>
                          </Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.template !== currentValues.template}>
                    {({ getFieldValue }) => {
                      const template = getFieldValue('template');
                      return renderTemplateConfig(template);
                    }}
                  </Form.Item>

                  <Divider />

                  <Row gutter={[16, 16]}>
                    <Col span={16}>
                      <Form.Item
                        name="name"
                        label="Application Name"
                        rules={[
                          { required: true, message: 'Please enter application name' },
                          { min: 1, message: 'Application name cannot be empty' },
                          { max: 50, message: 'Application name must be less than 50 characters' },
                          { pattern: /^[a-zA-Z0-9_-]+$/, message: 'Application name can only contain letters, numbers, underscores, and hyphens' }
                        ]}
                      >
                        <Input 
                          placeholder="e.g., my-live-stream" 
                          addonBefore="rtmp://192.168.1.102:1935/"
                          addonAfter="/your-stream-name"
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="type"
                        label="Type"
                        initialValue="live"
                      >
                        <Select size="large">
                          <Option value="live">Live Streaming</Option>
                          <Option value="relay">Relay</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </TabPane>

                {/* Input/Output Configuration Tab */}
                <TabPane tab="Input & Output" key="io">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card 
                        title="Input Providers" 
                        size="small"
                        style={{ height: '100%' }}
                        extra={<Tag color="blue">Ingest</Tag>}
                      >
                        <Form.Item name="providers" initialValue={['rtmp', 'webrtc']}>
                          <Checkbox.Group>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Checkbox value="rtmp" defaultChecked>
                                <Space>
                                  <VideoCameraOutlined />
                                  <span>RTMP</span>
                                </Space>
                              </Checkbox>
                              <Checkbox value="webrtc" defaultChecked>
                                <Space>
                                  <ThunderboltOutlined />
                                  <span>WebRTC</span>
                                </Space>
                              </Checkbox>
                              <Checkbox value="srt">
                                <Space>
                                  <CloudServerOutlined />
                                  <span>SRT</span>
                                </Space>
                              </Checkbox>
                              <Checkbox value="rtsp">
                                <Space>
                                  <PlayCircleOutlined />
                                  <span>RTSP</span>
                                </Space>
                              </Checkbox>
                              <Checkbox value="file">
                                <Space>
                                  <AudioOutlined />
                                  <span>File</span>
                                </Space>
                              </Checkbox>
                              <Checkbox value="schedule">
                                <Space>
                                  <SettingOutlined />
                                  <span>Schedule</span>
                                </Space>
                              </Checkbox>
                            </Space>
                          </Checkbox.Group>
                        </Form.Item>
                      </Card>
                    </Col>
                    
                    <Col span={12}>
                      <Card 
                        title="Output Publishers" 
                        size="small"
                        style={{ height: '100%' }}
                        extra={<Tag color="green">Publish</Tag>}
                      >
                        <Form.Item name="publishers" initialValue={['llhls', 'webrtc', 'hls']}>
                          <Checkbox.Group>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Checkbox value="llhls" defaultChecked>
                                <Space>
                                  <ThunderboltOutlined />
                                  <span>LLHLS (Low-Latency HLS)</span>
                                </Space>
                              </Checkbox>
                              <Checkbox value="webrtc" defaultChecked>
                                <Space>
                                  <ThunderboltOutlined />
                                  <span>WebRTC</span>
                                </Space>
                              </Checkbox>
                              <Checkbox value="hls" defaultChecked>
                                <Space>
                                  <PlayCircleOutlined />
                                  <span>HLS</span>
                                </Space>
                              </Checkbox>
                              <Checkbox value="dash">
                                <Space>
                                  <VideoCameraOutlined />
                                  <span>DASH</span>
                                </Space>
                              </Checkbox>
                              <Checkbox value="file">
                                <Space>
                                  <AudioOutlined />
                                  <span>File Output</span>
                                </Space>
                              </Checkbox>
                              <Checkbox value="push">
                                <Space>
                                  <RocketOutlined />
                                  <span>Push Publishing</span>
                                </Space>
                              </Checkbox>
                            </Space>
                          </Checkbox.Group>
                        </Form.Item>
                      </Card>
                    </Col>
                  </Row>
                </TabPane>

                {/* Preview & JSON Tab */}
                <TabPane tab="Preview & JSON" key="preview">
                  <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => 
                    prevValues.name !== currentValues.name || 
                    prevValues.template !== currentValues.template ||
                    prevValues.providers !== currentValues.providers ||
                    prevValues.publishers !== currentValues.publishers
                  }>
                    {({ getFieldValue }) => {
                      const name = getFieldValue('name') || 'your-app-name';
                      const template = getFieldValue('template') || 'basic';
                      const providers = getFieldValue('providers') || ['rtmp', 'webrtc'];
                      const publishers = getFieldValue('publishers') || ['llhls', 'webrtc', 'hls'];
                      
                      const mediaInfo = {
                        application: {
                          name: name,
                          type: 'live',
                          template: template,
                          streamUrl: `rtmp://192.168.1.102:1935/${name}/your-stream-name`,
                          playbackUrls: {
                            llhls: publishers.includes('llhls') ? `https://192.168.1.102:3334/${name}/your-stream-name/llhls.m3u8` : null,
                            webrtc: publishers.includes('webrtc') ? `wss://192.168.1.102:3333/${name}/your-stream-name` : null,
                            hls: publishers.includes('hls') ? `https://192.168.1.102:3334/${name}/your-stream-name/playlist.m3u8` : null,
                            dash: publishers.includes('dash') ? `https://192.168.1.102:3334/${name}/your-stream-name/manifest.mpd` : null
                          },
                          providers: providers,
                          publishers: publishers,
                          features: {
                            lowLatency: publishers.includes('llhls') || publishers.includes('webrtc'),
                            multiFormat: publishers.length > 1,
                            adaptiveBitrate: publishers.includes('hls') || publishers.includes('dash')
                          }
                        }
                      };
                      
                      return (
                        <div>
                          <Alert
                            message="Quick Setup Information"
                            description={
                              <div>
                                <p><strong>Stream URL:</strong> rtmp://192.168.1.102:1935/{name}/your-stream-name</p>
                                <p><strong>Playback:</strong> Applications will be available for playback once created</p>
                                <p><strong>Note:</strong> You can modify settings later through the application management interface</p>
                              </div>
                            }
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                          />
                          
                          <Card 
                            title="Media Info (JSON Preview)" 
                            size="small"
                            extra={
                              <Button 
                                size="small" 
                                icon={<CopyOutlined />}
                                onClick={() => {
                                  navigator.clipboard.writeText(JSON.stringify(mediaInfo, null, 2));
                                  message.success('Media info copied to clipboard!');
                                }}
                              >
                                Copy JSON
                              </Button>
                            }
                          >
                            <pre style={{ 
                              background: '#f5f5f5', 
                              padding: '12px', 
                              borderRadius: '4px', 
                              fontSize: '12px',
                              maxHeight: '400px',
                              overflow: 'auto',
                              margin: 0
                            }}>
                              {JSON.stringify(mediaInfo, null, 2)}
                            </pre>
                          </Card>
                        </div>
                      );
                    }}
                  </Form.Item>
                </TabPane>
              </Tabs>
            </Form>
          </Modal>
    </div>
  );
};
