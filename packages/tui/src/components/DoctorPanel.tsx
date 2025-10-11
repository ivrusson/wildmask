import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
import type { DiagnosticReport } from '@wildmask/types';

interface DoctorPanelProps {
  report: DiagnosticReport | null;
  isLoading: boolean;
}

export const DoctorPanel: React.FC<DoctorPanelProps> = ({ report, isLoading }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  useInput((input, key) => {
    if (input === 'f' && !key.ctrl) {
      setShowSuggestions(!showSuggestions);
    }
  });

  if (isLoading) {
    return (
      <Box padding={1} flexDirection="column">
        <Text color="cyan">🔍 Running diagnostics...</Text>
        <Text dimColor>
          Checking daemon status, port availability, DNS configuration...
        </Text>
      </Box>
    );
  }

  if (!report) {
    return (
      <Box padding={1}>
        <Text dimColor>No diagnostics available. Press [ctrl+d] to run.</Text>
      </Box>
    );
  }

  const failedChecks = report.checks.filter(check => check.status === 'fail');
  const warningChecks = report.checks.filter(check => check.status === 'warn');

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan">
      <Box marginBottom={1}>
        <Text bold color="cyan">🩺 System Diagnostics</Text>
        <Text dimColor> - {new Date().toLocaleString()}</Text>
      </Box>

      {report.checks.map((check, index) => {
        let icon: string;
        let color: 'green' | 'red' | 'yellow';

        switch (check.status) {
          case 'pass':
            icon = '✅';
            color = 'green';
            break;
          case 'fail':
            icon = '❌';
            color = 'red';
            break;
          case 'warn':
            icon = '⚠️';
            color = 'yellow';
            break;
        }

        return (
          <Box key={index} marginBottom={1}>
            <Text color={color}>{icon}</Text>
            <Text> </Text>
            <Text bold>{check.name}</Text>
            <Text dimColor> - {check.message}</Text>
            {(check as any).suggestion && (
              <Text color="blue" dimColor> ({(check as any).suggestion})</Text>
            )}
          </Box>
        );
      })}

      <Box marginTop={1} borderStyle="single" borderColor="gray" padding={1}>
        <Text>
          <Text color="green">✅ {report.summary.passed} passed</Text>
          <Text> · </Text>
          <Text color="red">❌ {report.summary.failed} failed</Text>
          <Text> · </Text>
          <Text color="yellow">⚠️ {report.summary.warnings} warnings</Text>
        </Text>
      </Box>

      {showSuggestions && (failedChecks.length > 0 || warningChecks.length > 0) && (
        <Box marginTop={1} borderStyle="single" borderColor="yellow" padding={1}>
          <Text bold color="yellow">🔧 Suggested Fixes:</Text>
          {failedChecks.concat(warningChecks).map((check, index) => (
            <Box key={index} marginTop={1}>
              <Text color="yellow">• {check.name}:</Text>
              <Text> {(check as any).suggestion || 'Check configuration and try again'}</Text>
            </Box>
          ))}
          <Text dimColor>
            Run 'wildmask doctor --fix' from CLI for automatic fixes
          </Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>
          Press [f] to {showSuggestions ? 'hide' : 'show'} suggestions • [Esc] to go back
        </Text>
      </Box>
    </Box>
  );
};


