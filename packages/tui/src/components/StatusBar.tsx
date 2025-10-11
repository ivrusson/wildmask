import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { DaemonStatus } from '@wildmask/types';

interface StatusBarProps {
  version: string;
  daemonStatus: DaemonStatus;
  domain: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ version, daemonStatus, domain }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const statusIcon = daemonStatus.running ? '🟢' : '🔴';
  const statusText = daemonStatus.running ? 'Running' : 'Stopped';
  const statusColor = daemonStatus.running ? 'green' : 'red';

  return (
    <Box flexDirection="column" marginBottom={1} borderStyle="round" borderColor="gray" padding={1}>
      <Box justifyContent="space-between">
        <Box>
          <Text bold color="cyan">
            🎭 WildMask
          </Text>
          <Text dimColor> v{version}</Text>
          <Text> · </Text>
          <Text color={statusColor}>
            {statusIcon} {statusText}
          </Text>
          {daemonStatus.pid && (
            <Text dimColor> (PID: {daemonStatus.pid})</Text>
          )}
          <Text> · </Text>
          <Text dimColor>*.{domain}</Text>
        </Box>
        
        <Box>
          <Text dimColor>
            {currentTime.toLocaleTimeString()}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};


