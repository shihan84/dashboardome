#!/usr/bin/env node

import axios from 'axios';

const OME_HOST = '192.168.1.102';
const OME_PORT = 8081;
const ACCESS_TOKEN = 'ovenmediaengine';

// Test OME API connection
async function testOMEConnection() {
  try {
    const auth = btoa(ACCESS_TOKEN);
    const response = await axios.get(`http://${OME_HOST}:${OME_PORT}/v1/vhosts`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ OME API Connection: SUCCESS');
    console.log('📊 Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ OME API Connection: FAILED');
    console.log('Error:', error.message);
    return false;
  }
}

// Test Dashboard connection
async function testDashboardConnection() {
  try {
    const response = await axios.get(`http://${OME_HOST}:5176/`);
    console.log('✅ Dashboard Connection: SUCCESS');
    console.log('📊 Status:', response.status);
    return true;
  } catch (error) {
    console.log('❌ Dashboard Connection: FAILED');
    console.log('Error:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🔌 Testing Dashboard and OME Connections...\n');
  
  const omeConnected = await testOMEConnection();
  const dashboardConnected = await testDashboardConnection();
  
  console.log('\n📊 Test Results:');
  console.log(`OME API: ${omeConnected ? '✅ Connected' : '❌ Disconnected'}`);
  console.log(`Dashboard: ${dashboardConnected ? '✅ Connected' : '❌ Disconnected'}`);
  
  if (omeConnected && dashboardConnected) {
    console.log('\n🎉 All systems are connected and ready!');
    console.log('🌐 Dashboard URL: http://192.168.1.102:5176/');
  } else {
    console.log('\n⚠️ Some systems are not connected. Check the errors above.');
  }
}

runTests().catch(console.error);
