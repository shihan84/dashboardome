<?xml version="1.0" encoding="UTF-8"?>
<Schedule>
    <Stream>
        <Name>channel1</Name>
        <BypassTranscoder>false</BypassTranscoder>
        <VideoTrack>true</VideoTrack>
        <AudioTrack>true</AudioTrack>
    </Stream>

    <!-- Fallback Program - Plays when no live source is available -->
    <FallbackProgram>
        <Item url="file://fallback.mp4" start="0" duration="600000" />
    </FallbackProgram>

    <!-- Morning Program (6:00 AM - 12:00 PM) -->
    <Program name="morning_show" scheduled="2025-10-15T06:00:00.000+00:00" repeat="true">
        <!-- Try live stream first, fallback to local content -->
        <Item url="stream://default/live/live" duration="21600000" />
        <Item url="file://morning_content.mp4" start="0" duration="21600000" />
    </Program>

    <!-- Afternoon Program (12:00 PM - 6:00 PM) -->
    <Program name="afternoon_show" scheduled="2025-10-15T12:00:00.000+00:00" repeat="true">
        <Item url="stream://default/live/live" duration="21600000" />
        <Item url="file://afternoon_content.mp4" start="0" duration="21600000" />
    </Program>

    <!-- Evening Program (6:00 PM - 12:00 AM) -->
    <Program name="evening_show" scheduled="2025-10-15T18:00:00.000+00:00" repeat="true">
        <Item url="stream://default/live/live" duration="21600000" />
        <Item url="file://evening_content.mp4" start="0" duration="21600000" />
    </Program>

    <!-- Night Program (12:00 AM - 6:00 AM) -->
    <Program name="night_show" scheduled="2025-10-15T00:00:00.000+00:00" repeat="true">
        <Item url="file://night_content.mp4" start="0" duration="21600000" />
    </Program>

    <!-- Commercial Breaks (every 30 minutes) -->
    <Program name="commercial_break" scheduled="2025-10-15T06:30:00.000+00:00" repeat="true">
        <Item url="file://commercial1.mp4" start="0" duration="180000" />
    </Program>

    <Program name="commercial_break" scheduled="2025-10-15T07:00:00.000+00:00" repeat="true">
        <Item url="file://commercial2.mp4" start="0" duration="180000" />
    </Program>

    <Program name="commercial_break" scheduled="2025-10-15T07:30:00.000+00:00" repeat="true">
        <Item url="file://commercial3.mp4" start="0" duration="180000" />
    </Program>

    <!-- Weekly Special Programs -->
    <Program name="weekly_special" scheduled="2025-10-15T20:00:00.000+00:00" repeat="true">
        <Item url="file://weekly_special.mp4" start="0" duration="3600000" />
    </Program>
</Schedule>
