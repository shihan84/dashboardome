<?xml version="1.0" encoding="UTF-8"?>
<Schedule>
    <Stream>
        <Name>channel2</Name>
        <BypassTranscoder>false</BypassTranscoder>
        <VideoTrack>true</VideoTrack>
        <AudioTrack>true</AudioTrack>
    </Stream>

    <!-- Fallback Program -->
    <FallbackProgram>
        <Item url="file://fallback2.mp4" start="0" duration="600000" />
    </FallbackProgram>

    <!-- 24/7 Music Channel with Live Stream Priority -->
    <Program name="music_channel" scheduled="2025-10-15T00:00:00.000+00:00" repeat="true">
        <!-- Primary: Live music stream -->
        <Item url="stream://default/live/music" duration="86400000" />
        <!-- Fallback: Local music playlist -->
        <Item url="file://music_playlist.mp4" start="0" duration="86400000" />
    </Program>

    <!-- News Updates (every 2 hours) -->
    <Program name="news_update" scheduled="2025-10-15T06:00:00.000+00:00" repeat="true">
        <Item url="file://news_update.mp4" start="0" duration="300000" />
    </Program>

    <Program name="news_update" scheduled="2025-10-15T08:00:00.000+00:00" repeat="true">
        <Item url="file://news_update.mp4" start="0" duration="300000" />
    </Program>

    <Program name="news_update" scheduled="2025-10-15T10:00:00.000+00:00" repeat="true">
        <Item url="file://news_update.mp4" start="0" duration="300000" />
    </Program>

    <!-- External HLS Stream Integration -->
    <Program name="external_stream" scheduled="2025-10-15T14:00:00.000+00:00" repeat="true">
        <Item url="stream://default/live/external_hls" duration="7200000" />
    </Program>
</Schedule>
