import React from 'react';
import { Box, Text } from 'ink';
import type { Mapping, MappingHealth } from '@wildmask/types';

interface MappingsListProps {
  mappings: Mapping[];
  healthStatus: Map<string, MappingHealth>;
  selectedIndex: number;
  defaultDomain?: string;
}

export const MappingsList: React.FC<MappingsListProps> = ({
  mappings,
  healthStatus,
  selectedIndex,
  defaultDomain = 'test',
}) => {
  if (mappings.length === 0) {
    return (
      <Box padding={2} borderStyle="round" borderColor="gray" flexDirection="column" alignItems="center">
        <Text color="yellow">📋 No mappings configured</Text>
        <Text dimColor>
          Press [n] to add your first mapping
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" padding={1}>
      {/* Header */}
      <Box marginBottom={1} borderStyle="single" borderColor="gray" padding={1}>
        <Box width={3}>
          <Text bold color="cyan">#</Text>
        </Box>
        <Box width={30}>
          <Text bold color="cyan">FQDN</Text>
        </Box>
        <Box width={20}>
          <Text bold color="cyan">Target</Text>
        </Box>
        <Box width={8}>
          <Text bold color="cyan">Port</Text>
        </Box>
        <Box width={10}>
          <Text bold color="cyan">Protocol</Text>
        </Box>
        <Box width={10}>
          <Text bold color="cyan">Status</Text>
        </Box>
        <Box width={8}>
          <Text bold color="cyan">Health</Text>
        </Box>
      </Box>

      {/* Mappings */}
      {mappings.map((mapping, index) => {
        const isSelected = index === selectedIndex;
        const health = healthStatus.get(mapping.id);
        const healthIcon = getHealthIcon(health?.result.status);
        const healthColor = getHealthColor(health?.result.status);

        // Build FQDN
        const fqdn = mapping.domain ? `${mapping.host}.${mapping.domain}` : `${mapping.host}.${defaultDomain}`;
        const displayFqdn = mapping.host.includes('*') ? `🌐 ${fqdn}` : `🔗 ${fqdn}`;

        return (
          <Box 
            key={mapping.id} 
            padding={1}
          >
            <Box width={3}>
              <Text color={isSelected ? 'white' : 'dimColor'}>
                {isSelected ? '▶' : index + 1}
              </Text>
            </Box>
            <Box width={30}>
              <Text 
                color={isSelected ? 'greenBright' : 'cyan'}
                bold={isSelected}
                inverse={isSelected}
              >
                {displayFqdn}
              </Text>
            </Box>
            <Box width={20}>
              <Text color={isSelected ? 'white' : undefined}>
                {mapping.target}
              </Text>
            </Box>
            <Box width={8}>
              <Text color={isSelected ? 'white' : undefined}>
                {mapping.port}
              </Text>
            </Box>
            <Box width={10}>
              <Text color={isSelected ? 'white' : 'dimColor'}>
                {mapping.protocol.toUpperCase()}
              </Text>
            </Box>
            <Box width={10}>
              <Text color={mapping.enabled ? 'green' : 'gray'}>
                {mapping.enabled ? '✅ Active' : '⏸️ Disabled'}
              </Text>
            </Box>
            <Box width={8}>
              <Text color={healthColor}>
                {healthIcon}
              </Text>
            </Box>
          </Box>
        );
      })}

      {/* Summary */}
      <Box marginTop={1} borderStyle="single" borderColor="gray" padding={1}>
        <Text dimColor>
          {mappings.length} mapping{mappings.length !== 1 ? 's' : ''} configured • 
          {mappings.filter(m => m.enabled).length} active • 
          Use ↑↓ to navigate • [e] to edit • [d] to delete
        </Text>
      </Box>
    </Box>
  );
};

function getHealthIcon(status?: string): string {
  switch (status) {
    case 'healthy':
      return '🟢';
    case 'degraded':
      return '🟡';
    case 'unhealthy':
      return '🔴';
    default:
      return '⚪';
  }
}

function getHealthColor(status?: string): 'green' | 'yellow' | 'red' | 'gray' {
  switch (status) {
    case 'healthy':
      return 'green';
    case 'degraded':
      return 'yellow';
    case 'unhealthy':
      return 'red';
    default:
      return 'gray';
  }
}


