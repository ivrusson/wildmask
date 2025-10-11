import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import type { Mapping } from '@wildmask/types';

interface MappingFormProps {
  mapping?: Mapping;
  onSubmit: (data: Partial<Mapping>) => void;
  onCancel: () => void;
}

type FormField = 'host' | 'domain' | 'target' | 'port' | 'protocol';

export const MappingForm: React.FC<MappingFormProps> = ({ mapping, onSubmit, onCancel }) => {
  const [currentField, setCurrentField] = useState<FormField>('host');
  const [values, setValues] = useState<{
    host: string;
    domain: string;
    target: string;
    port: string;
    protocol: string;
  }>({
    host: mapping?.host || '',
    domain: mapping?.domain || '',
    target: mapping?.target || '127.0.0.1',
    port: mapping?.port?.toString() || '3000',
    protocol: mapping?.protocol || 'http',
  });

  const fields: FormField[] = ['host', 'domain', 'target', 'port', 'protocol'];
  const currentFieldIndex = fields.indexOf(currentField);

  const [error, setError] = useState<string>('');

  const validateField = (field: FormField, value: string): boolean => {
    setError('');

    switch (field) {
      case 'host':
        if (!value.trim()) {
          setError('Host cannot be empty');
          return false;
        }
        if (!/^[a-zA-Z0-9\-\*\.]+$/.test(value)) {
          setError('Host can only contain letters, numbers, hyphens, dots, and asterisks');
          return false;
        }
        break;
      
      case 'domain':
        // Domain is optional
        if (value && !/^[a-zA-Z0-9\-]+$/.test(value)) {
          setError('Domain can only contain letters, numbers, and hyphens');
          return false;
        }
        break;
      
      case 'target':
        if (!value.trim()) {
          setError('Target IP cannot be empty');
          return false;
        }
        // Basic IP validation
        if (value !== 'localhost' && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) {
          setError('Invalid IP address (use format: 127.0.0.1)');
          return false;
        }
        break;
      
      case 'port':
        const port = parseInt(value, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
          setError('Port must be between 1 and 65535');
          return false;
        }
        break;
      
      case 'protocol':
        const proto = value.toLowerCase();
        if (!['http', 'https', 'tcp'].includes(proto)) {
          setError('Protocol must be http, https, or tcp');
          return false;
        }
        break;
    }

    return true;
  };

  const handleSubmit = (value: string) => {
    if (!validateField(currentField, value)) {
      return;
    }

    const newValues = { ...values, [currentField]: value };
    setValues(newValues);

    if (currentField === 'protocol') {
      // Last field, submit the form
      const protocol = newValues.protocol.toLowerCase();
      if (protocol === 'http' || protocol === 'https' || protocol === 'tcp') {
        onSubmit({
          host: newValues.host,
          domain: newValues.domain || undefined,
          target: newValues.target,
          port: parseInt(newValues.port, 10),
          protocol: protocol as 'http' | 'https' | 'tcp',
          enabled: true,
        });
      }
    } else {
      // Move to next field
      const nextFieldIndex = currentFieldIndex + 1;
      setCurrentField(fields[nextFieldIndex]);
    }
  };

  // Handle Escape key to cancel
  useInput((input, key) => {
    if (key.escape || input === 'escape') {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {mapping ? 'Edit Mapping' : 'New Mapping'}
        </Text>
      </Box>

      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Box width={15}>
            <Text color={currentField === 'host' ? 'cyan' : 'gray'}>Host:</Text>
          </Box>
          {currentField === 'host' ? (
            <TextInput
              value={values.host}
              onChange={(v) => setValues({ ...values, host: v })}
              onSubmit={handleSubmit}
            />
          ) : (
            <Text>{values.host}</Text>
          )}
        </Box>

        <Box marginBottom={1}>
          <Box width={15}>
            <Text color={currentField === 'domain' ? 'cyan' : 'gray'}>Domain:</Text>
          </Box>
          {currentField === 'domain' ? (
            <TextInput
              value={values.domain}
              onChange={(v) => setValues({ ...values, domain: v })}
              onSubmit={handleSubmit}
              placeholder="test (or leave empty)"
            />
          ) : (
            <Text dimColor>{values.domain || '(default)'}</Text>
          )}
        </Box>

        <Box marginBottom={1}>
          <Box width={15}>
            <Text color={currentField === 'target' ? 'cyan' : 'gray'}>Target IP:</Text>
          </Box>
          {currentField === 'target' ? (
            <TextInput
              value={values.target}
              onChange={(v) => setValues({ ...values, target: v })}
              onSubmit={handleSubmit}
            />
          ) : (
            <Text>{values.target}</Text>
          )}
        </Box>

        <Box marginBottom={1}>
          <Box width={15}>
            <Text color={currentField === 'port' ? 'cyan' : 'gray'}>Port:</Text>
          </Box>
          {currentField === 'port' ? (
            <TextInput
              value={values.port}
              onChange={(v) => setValues({ ...values, port: v })}
              onSubmit={handleSubmit}
            />
          ) : (
            <Text>{values.port}</Text>
          )}
        </Box>

        <Box marginBottom={1}>
          <Box width={15}>
            <Text color={currentField === 'protocol' ? 'cyan' : 'gray'}>Protocol:</Text>
          </Box>
          {currentField === 'protocol' ? (
            <TextInput
              value={values.protocol}
              onChange={(v) => setValues({ ...values, protocol: v })}
              onSubmit={handleSubmit}
            />
          ) : (
            <Text>{values.protocol}</Text>
          )}
        </Box>
      </Box>

      {error && (
        <Box marginTop={1}>
          <Text color="red">⚠️  {error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>[Enter] Next/Submit · [Esc] Cancel</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          {currentField === 'host' && 'Host: e.g., "api", "*.assets", "backend.v2"'}
          {currentField === 'domain' && 'Domain: Optional TLD (test, local, dev) - Leave empty for default'}
          {currentField === 'target' && 'Target: IP address or "localhost"'}
          {currentField === 'port' && 'Port: 1-65535'}
          {currentField === 'protocol' && 'Protocol: http, https, or tcp'}
        </Text>
      </Box>
    </Box>
  );
};


