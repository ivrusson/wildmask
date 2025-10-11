import React from 'react';
import { Box, Text } from 'ink';
import type { DaemonStatus } from '@wildmask/types';

interface HelpBarProps {
  mode: 'dashboard' | 'form' | 'logs' | 'doctor';
  daemonStatus?: DaemonStatus;
  isDaemonToggling?: boolean;
}

export const HelpBar: React.FC<HelpBarProps> = ({ mode, daemonStatus, isDaemonToggling }) => {
  const getShortcuts = () => {
    switch (mode) {
      case 'dashboard':
        const daemonAction = daemonStatus?.running ? '[s] Stop' : '[s] Start';
        const daemonText = isDaemonToggling ? '[s] Starting...' : daemonAction;
        return `[n] New [e] Edit [d] Delete [r] Refresh [l] Logs [ctrl+d] Doctor ${daemonText} [↑↓] Navigate [q] Quit`;
      case 'form':
        return '[Enter] Next/Submit [Esc] Cancel';
      case 'logs':
        return '[Esc] Back to Dashboard';
      case 'doctor':
        return '[Esc] Back to Dashboard [f] Fix Issues';
      default:
        return '';
    }
  };

  return (
    <Box marginTop={1} borderStyle="single" borderColor="gray" padding={1}>
      <Text dimColor>{getShortcuts()}</Text>
    </Box>
  );
};


