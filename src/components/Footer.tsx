import React from 'react';
import { Layout, Typography, Space, Divider } from 'antd';
import { 
  CopyrightOutlined, 
  GlobalOutlined, 
  MailOutlined,
  PhoneOutlined 
} from '@ant-design/icons';

const { Footer: AntFooter } = Layout;
const { Text, Link } = Typography;

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <AntFooter 
      style={{ 
        background: '#f0f2f5',
        padding: '24px 50px',
        textAlign: 'center',
        borderTop: '1px solid #d9d9d9'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {/* Main Footer Content */}
          <Space size="large" wrap>
            <Space direction="vertical" align="start" size="small">
              <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                IBS Itassist Broadcast Solutions
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Professional OvenMediaEngine Compliance Dashboard
              </Text>
            </Space>
            
            <Divider type="vertical" style={{ height: '60px' }} />
            
            <Space direction="vertical" align="start" size="small">
              <Text strong>Features</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                SCTE-35 Injection • Stream Validation • Compliance Monitoring
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Recording Management • Push Publishing • Statistics Dashboard
              </Text>
            </Space>
            
            <Divider type="vertical" style={{ height: '60px' }} />
            
            <Space direction="vertical" align="start" size="small">
              <Text strong>Contact</Text>
              <Space size="small">
                <MailOutlined />
                <Link href="mailto:support@ibs-itassist.com">support@ibs-itassist.com</Link>
              </Space>
              <Space size="small">
                <PhoneOutlined />
                <Text type="secondary">+1 (555) 123-4567</Text>
              </Space>
              <Space size="small">
                <GlobalOutlined />
                <Link href="https://www.ibs-itassist.com" target="_blank">www.ibs-itassist.com</Link>
              </Space>
            </Space>
          </Space>
          
          <Divider style={{ margin: '16px 0' }} />
          
          {/* Copyright and Legal */}
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space size="large" wrap>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <CopyrightOutlined /> {currentYear} IBS Itassist Broadcast Solutions. All rights reserved.
              </Text>
              <Link href="#" style={{ fontSize: '12px' }}>Privacy Policy</Link>
              <Link href="#" style={{ fontSize: '12px' }}>Terms of Service</Link>
              <Link href="#" style={{ fontSize: '12px' }}>Support</Link>
            </Space>
            
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Built with React, TypeScript, Ant Design, and OvenMediaEngine API
            </Text>
            
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Version 1.0.0 • Last updated: {new Date().toLocaleDateString()}
            </Text>
          </Space>
        </Space>
      </div>
    </AntFooter>
  );
};
