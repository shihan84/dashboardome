import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Card, Typography, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', minHeight: '100vh', background: '#f5f5f5' }}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ color: '#ff4d4f' }}>
                Dashboard Error
              </Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                {this.state.error?.message || 'An unexpected error occurred'}
              </Text>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => window.location.reload()}
              >
                Reload Dashboard
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
