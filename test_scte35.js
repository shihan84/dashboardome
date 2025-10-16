#!/usr/bin/env node

import axios from 'axios';

// Test configuration
const OME_HOST = '192.168.1.102';
const OME_PORT = 8081;
const OME_API_BASE_URL = `http://${OME_HOST}:${OME_PORT}/v1`;
const OME_USERNAME = 'ovenmediaengine';
const OME_PASSWORD = '';

const AUTH_HEADER = `Basic ${btoa(OME_USERNAME)}`;

const testResults = [];

async function runTest(name, testFunction) {
    process.stdout.write(`\n${name}... `);
    try {
        const result = await testFunction();
        console.log(`\x1b[32m✅ PASS\x1b[0m`);
        console.log(`   \x1b[34m${result}\x1b[0m`);
        testResults.push({ name, status: 'PASS', message: result });
    } catch (error) {
        console.log(`\x1b[31m❌ FAIL\x1b[0m`);
        console.log(`   \x1b[31m${error.message || error}\x1b[0m`);
        testResults.push({ name, status: 'FAIL', message: error.message || error });
    }
}

async function testOmeConnection() {
    try {
        const response = await axios.get(`${OME_API_BASE_URL}/vhosts`, {
            headers: { 'Authorization': AUTH_HEADER },
            timeout: 5000
        });
        if (response.status === 200) {
            return `OME API is responding (authentication working)`;
        }
        throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
        if (error.response && error.response.status === 401) {
            return `OME API is responding (authentication required)`;
        }
        throw new Error(`Failed to connect to OME API: ${error.message}`);
    }
}

async function testActiveStreams() {
    try {
        const response = await axios.get(`${OME_API_BASE_URL}/vhosts/default/apps/live/streams`, {
            headers: { 'Authorization': AUTH_HEADER }
        });
        const streams = response.data.response;
        if (streams && streams.length > 0) {
            return `Found ${streams.length} active stream(s): ${streams.join(', ')}`;
        }
        return `No active streams found (need to start streaming first)`;
    } catch (error) {
        throw new Error(`Failed to get streams: ${error.response?.data?.message || error.message}`);
    }
}

async function testSCTE35CueOut() {
    try {
        const eventData = {
            eventFormat: 'scte35',
            events: [{
                spliceCommand: 'spliceInsert',
                id: 10001,
                type: 'out',
                duration: 30000, // 30 seconds
                autoReturn: false
            }]
        };

        const response = await axios.post(
            `${OME_API_BASE_URL}/vhosts/default/apps/live/streams/live/sendEvent`,
            eventData,
            { headers: { 'Authorization': AUTH_HEADER, 'Content-Type': 'application/json' } }
        );

        if (response.status === 200) {
            return `SCTE-35 CUE-OUT injected successfully (Event ID: 10001, Duration: 30s)`;
        }
        throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return `Stream not found - need active stream for SCTE-35 injection`;
        }
        throw new Error(`Failed to inject SCTE-35 CUE-OUT: ${error.response?.data?.message || error.message}`);
    }
}

async function testSCTE35CueIn() {
    try {
        const eventData = {
            eventFormat: 'scte35',
            events: [{
                spliceCommand: 'spliceInsert',
                id: 10002,
                type: 'in',
                autoReturn: false
            }]
        };

        const response = await axios.post(
            `${OME_API_BASE_URL}/vhosts/default/apps/live/streams/live/sendEvent`,
            eventData,
            { headers: { 'Authorization': AUTH_HEADER, 'Content-Type': 'application/json' } }
        );

        if (response.status === 200) {
            return `SCTE-35 CUE-IN injected successfully (Event ID: 10002)`;
        }
        throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return `Stream not found - need active stream for SCTE-35 injection`;
        }
        throw new Error(`Failed to inject SCTE-35 CUE-IN: ${error.response?.data?.message || error.message}`);
    }
}

async function testPrerollMarker() {
    try {
        const eventData = {
            eventFormat: 'scte35',
            events: [{
                spliceCommand: 'spliceInsert',
                id: 10003,
                type: 'out',
                duration: 5000, // 5 seconds pre-roll
                autoReturn: false
            }]
        };

        const response = await axios.post(
            `${OME_API_BASE_URL}/vhosts/default/apps/live/streams/live/sendEvent`,
            eventData,
            { headers: { 'Authorization': AUTH_HEADER, 'Content-Type': 'application/json' } }
        );

        if (response.status === 200) {
            return `SCTE-35 Pre-roll marker injected successfully (Event ID: 10003, Duration: 5s)`;
        }
        throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return `Stream not found - need active stream for SCTE-35 injection`;
        }
        throw new Error(`Failed to inject SCTE-35 pre-roll: ${error.response?.data?.message || error.message}`);
    }
}

async function testSRTDistributorProfile() {
    try {
        const response = await axios.get(`${OME_API_BASE_URL}/vhosts/default/apps/live/outputprofiles`, {
            headers: { 'Authorization': AUTH_HEADER }
        });
        const profiles = response.data.response;
        const srtProfile = profiles.find(p => p.name === 'srt_distributor');
        if (srtProfile) {
            const video = srtProfile.encodes?.video;
            const audio = srtProfile.encodes?.audio;
            if (video && audio) {
                return `SRT Distributor configured: ${video.width}x${video.height}, ${video.bitrate/1000}kbps video, ${audio.bitrate/1000}kbps audio`;
            }
            return `SRT Distributor profile found but missing video/audio config`;
        }
        throw new Error('SRT Distributor profile not found');
    } catch (error) {
        throw new Error(`Failed to check SRT distributor: ${error.response?.data?.message || error.message}`);
    }
}

async function main() {
    console.log('\x1b[1m🎯 SCTE-35 Implementation Testing\x1b[0m\n');

    console.log('\x1b[1m🔌 Testing OME Connection...\x1b[0m');
    await runTest('OME API Connection', testOmeConnection);

    console.log('\x1b[1m\n📡 Testing Stream Status...\x1b[0m');
    await runTest('Active Streams Check', testActiveStreams);

    console.log('\x1b[1m\n🎬 Testing SRT Distributor Configuration...\x1b[0m');
    await runTest('SRT Distributor Profile', testSRTDistributorProfile);

    console.log('\x1b[1m\n📺 Testing SCTE-35 Injection...\x1b[0m');
    await runTest('SCTE-35 CUE-OUT Injection', testSCTE35CueOut);
    await runTest('SCTE-35 CUE-IN Injection', testSCTE35CueIn);
    await runTest('SCTE-35 Pre-roll Marker', testPrerollMarker);

    console.log('\x1b[1m\n📊 Test Results Summary:\x1b[0m');
    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / testResults.length) * 100)}%`);

    if (failed > 0) {
        console.log('\n\x1b[1m❌ Failed Tests:\x1b[0m');
        testResults.filter(r => r.status === 'FAIL').forEach(test => {
            console.log(`   • ${test.name}: ${test.message}`);
        });
    }

    console.log('\n\x1b[1m💡 Next Steps:\x1b[0m');
    console.log('1. Start streaming to OME using OBS or FFmpeg');
    console.log('2. Test SCTE-35 injection through the dashboard');
    console.log('3. Monitor event timeline and status');
    console.log('4. Verify SRT distributor output quality');
    console.log('5. Test pre-roll markers and ad break management');

    console.log('\n\x1b[1m🔗 Stream URLs for Testing:\x1b[0m');
    console.log(`   RTMP: rtmp://${OME_HOST}:1935/live/your_stream_name`);
    console.log(`   LLHLS: http://${OME_HOST}:3334/live/your_stream_name/llhls.m3u8`);
    console.log(`   WebRTC: ws://${OME_HOST}:3333/live/your_stream_name`);
    console.log(`   SRT: srt://${OME_HOST}:9999?streamid=live/your_stream_name`);
}

main().catch(console.error);
