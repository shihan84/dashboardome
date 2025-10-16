import React from 'react';
import { Card, Result, Button, Space, Typography } from 'antd';
import { RocketOutlined, ClockCircleOutlined, ToolOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ComingSoonProps {
  feature: string;
  description?: string;
  estimatedDate?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ 
  feature, 
  description = "This feature is currently under development and will be available soon.",
  estimatedDate 
}) => {
  return (
    <Card>
      <Result
        icon={<RocketOutlined style={{ color: '#1890ff' }} />}
        title={
          <Title level={3}>
            {feature} - Coming Soon
          </Title>
        }
        subTitle={
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 16 }}>
              {description}
            </Text>
            {estimatedDate && (
              <Space>
                <ClockCircleOutlined />
                <Text strong>Estimated Release: {estimatedDate}</Text>
              </Space>
            )}
            <Space>
              <ToolOutlined />
              <Text type="secondary">
                This feature is part of our professional dashboard upgrade to match industry standards.
              </Text>
            </Space>
          </Space>
        }
        extra={
          <Space>
            <Button type="primary" icon={<RocketOutlined />}>
              Notify Me When Ready
            </Button>
            <Button>
              View Documentation
            </Button>
          </Space>
        }
      />
    </Card>
  );
};

export default ComingSoon;
