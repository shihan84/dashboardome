import React from 'react';
import { ConfigProvider } from 'antd';
import { Dashboard, ErrorBoundary } from './components';
import './App.css';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <ErrorBoundary>
        <Dashboard />
      </ErrorBoundary>
    </ConfigProvider>
  );
}

export default App;