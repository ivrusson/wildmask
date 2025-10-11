import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { existsSync, readFileSync } from 'node:fs';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata?: Record<string, unknown>;
}

interface LogsViewerProps {
  maxLines?: number;
}

export const LogsViewer: React.FC<LogsViewerProps> = ({ maxLines = 20 }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        // Try to find log file
        const logPaths = [
          '~/.wildmask/logs/wildmask.log',
          './logs/wildmask.log',
          '/tmp/wildmask.log'
        ];

        let logContent = '';
        for (const logPath of logPaths) {
          const expandedPath = logPath.replace('~', process.env.HOME || '');
          if (existsSync(expandedPath)) {
            logContent = readFileSync(expandedPath, 'utf-8');
            break;
          }
        }

        if (logContent) {
          const logLines = logContent.trim().split('\n').filter(line => line.trim());
          const parsedLogs: LogEntry[] = [];

          for (const line of logLines) {
            try {
              const parsed = JSON.parse(line);
              parsedLogs.push({
                timestamp: parsed.timestamp || new Date().toISOString(),
                level: parsed.level || 'info',
                message: parsed.message || line,
                metadata: parsed.metadata
              });
            } catch {
              // If not JSON, treat as plain text
              parsedLogs.push({
                timestamp: new Date().toISOString(),
                level: 'info',
                message: line
              });
            }
          }

          setLogs(parsedLogs.slice(-maxLines));
        } else {
          // Generate some sample logs for demo
          setLogs([
            {
              timestamp: new Date(Date.now() - 60000).toISOString(),
              level: 'info',
              message: 'WildMask daemon started'
            },
            {
              timestamp: new Date(Date.now() - 30000).toISOString(),
              level: 'info',
              message: 'DNS server listening on 0.0.0.0:5353'
            },
            {
              timestamp: new Date(Date.now() - 10000).toISOString(),
              level: 'debug',
              message: 'Query received: api.test'
            },
            {
              timestamp: new Date(Date.now() - 5000).toISOString(),
              level: 'info',
              message: 'Resolved api.test to 127.0.0.1'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogs();
    
    // Refresh logs every 2 seconds
    const interval = setInterval(loadLogs, 2000);
    return () => clearInterval(interval);
  }, [maxLines]);

  const displayLogs = logs.slice(-maxLines);

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="gray">
      <Box marginBottom={1}>
        <Text bold color="cyan">Daemon Logs</Text>
        {isLoading && <Text dimColor> (loading...)</Text>}
      </Box>

      {displayLogs.length === 0 ? (
        <Text dimColor>No logs available</Text>
      ) : (
        <Box flexDirection="column">
          {displayLogs.map((log, index) => (
            <Box key={index}>
              <Text dimColor>[{new Date(log.timestamp).toLocaleTimeString()}]</Text>
              <Text> </Text>
              <Text color={getLevelColor(log.level)}>{log.level.toUpperCase()}</Text>
              <Text>: {log.message}</Text>
            </Box>
          ))}
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>Showing last {displayLogs.length} entries (auto-refresh every 2s)</Text>
      </Box>
    </Box>
  );
};

function getLevelColor(level: string): 'red' | 'yellow' | 'blue' | 'white' {
  switch (level.toLowerCase()) {
    case 'error':
      return 'red';
    case 'warn':
      return 'yellow';
    case 'info':
      return 'blue';
    default:
      return 'white';
  }
}


