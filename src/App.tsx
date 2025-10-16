import React from 'react';
import { ConfigProvider } from 'antd';
import { ErrorBoundary } from './components';
import ProfessionalDashboard from './components/core/layout/ProfessionalDashboard';
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
        <ProfessionalDashboard />
      </ErrorBoundary>
    </ConfigProvider>
  );
}

export default App;