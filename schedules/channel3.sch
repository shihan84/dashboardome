<?xml version="1.0" encoding="UTF-8"?>
<Schedule>
    <Stream>
        <Name>channel3</Name>
        <BypassTranscoder>false</BypassTranscoder>
        <VideoTrack>true</VideoTrack>
        <AudioTrack>true</AudioTrack>
    </Stream>

    <!-- Fallback Program - Always available content -->
    <FallbackProgram>
        <Item url="file://fallback.mp4" start="0" duration="600000" />
    </FallbackProgram>

    <!-- 24/7 Mixed Content Channel with Advanced Failover -->
    <Program name="mixed_content" scheduled="2025-10-15T00:00:00.000+00:00" repeat="true">
        <!-- Primary: External HLS Stream -->
        <Item url="stream://default/live/external_hls" duration="3600000" />
        <!-- Secondary: Local RTMP Stream -->
        <Item url="stream://default/live/live" duration="3600000" />
        <!-- Tertiary: Local Content -->
        <Item url="file://morning_content.mp4" start="0" duration="3600000" />
    </Program>

    <!-- News Hour (Every 2 hours) -->
    <Program name="news_hour" scheduled="2025-10-15T06:00:00.000+00:00" repeat="true">
        <Item url="file://news_update.mp4" start="0" duration="3600000" />
    </Program>

    <Program name="news_hour" scheduled="2025-10-15T08:00:00.000+00:00" repeat="true">
        <Item url="file://news_update.mp4" start="0" duration="3600000" />
    </Program>

    <Program name="news_hour" scheduled="2025-10-15T10:00:00.000+00:00" repeat="true">
        <Item url="file://news_update.mp4" start="0" duration="3600000" />
    </Program>

    <Program name="news_hour" scheduled="2025-10-15T12:00:00.000+00:00" repeat="true">
        <Item url="file://news_update.mp4" start="0" duration="3600000" />
    </Program>

    <Program name="news_hour" scheduled="2025-10-15T14:00:00.000+00:00" repeat="true">
        <Item url="file://news_update.mp4" start="0" duration="3600000" />
    </Program>

    <Program name="news_hour" scheduled="2025-10-15T16:00:00.000+00:00" repeat="true">
        <Item url="file://news_update.mp4" start="0" duration="3600000" />
    </Program>

    <Program name="news_hour" scheduled="2025-10-15T18:00:00.000+00:00" repeat="true">
        <Item url="file://news_update.mp4" start="0" duration="3600000" />
    </Program>

    <Program name="news_hour" scheduled="2025-10-15T20:00:00.000+00:00" repeat="true">
        <Item url="file://news_update.mp4" start="0" duration="3600000" />
    </Program>

    <Program name="news_hour" scheduled="2025-10-15T22:00:00.000+00:00" repeat="true">
        <Item url="file://news_update.mp4" start="0" duration="3600000" />
    </Program>

    <!-- Commercial Breaks (Every 30 minutes) -->
    <Program name="commercial_break" scheduled="2025-10-15T06:30:00.000+00:00" repeat="true">
        <Item url="file://commercial1.mp4" start="0" duration="180000" />
    </Program>

    <Program name="commercial_break" scheduled="2025-10-15T07:00:00.000+00:00" repeat="true">
        <Item url="file://commercial2.mp4" start="0" duration="180000" />
    </Program>

    <Program name="commercial_break" scheduled="2025-10-15T07:30:00.000+00:00" repeat="true">
        <Item url="file://commercial3.mp4" start="0" duration="180000" />
    </Program>

    <Program name="commercial_break" scheduled="2025-10-15T08:00:00.000+00:00" repeat="true">
        <Item url="file://commercial1.mp4" start="0" duration="180000" />
    </Program>

    <Program name="commercial_break" scheduled="2025-10-15T08:30:00.000+00:00" repeat="true">
        <Item url="file://commercial2.mp4" start="0" duration="180000" />
    </Program>

    <Program name="commercial_break" scheduled="2025-10-15T09:00:00.000+00:00" repeat="true">
        <Item url="file://commercial3.mp4" start="0" duration="180000" />
    </Program>

    <!-- Special Events (Weekly) -->
    <Program name="weekly_special" scheduled="2025-10-15T21:00:00.000+00:00" repeat="true">
        <Item url="file://weekly_special.mp4" start="0" duration="3600000" />
    </Program>
</Schedule>
