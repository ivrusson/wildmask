import React, { useState, useEffect } from 'react';
import { Box } from 'ink';
import { useInput } from 'ink';
import { StatusBar } from './StatusBar.js';
import { MappingsList } from './MappingsList.js';
import { MappingForm } from './MappingForm.js';
import { LogsViewer } from './LogsViewer.js';
import { DoctorPanel } from './DoctorPanel.js';
import { HelpBar } from './HelpBar.js';
import type { Mapping, DaemonStatus, MappingHealth, DiagnosticReport } from '@wildmask/types';

interface DashboardProps {
  version: string;
  domain: string;
  mappings: Mapping[];
  daemonStatus: DaemonStatus;
  healthStatus: Map<string, MappingHealth>;
  diagnosticReport: DiagnosticReport | null;
  onAddMapping: (mapping: Partial<Mapping>) => void;
  onEditMapping: (id: string, mapping: Partial<Mapping>) => void;
  onDeleteMapping: (id: string) => void;
  onRefresh: () => void;
  onRunDiagnostics: () => void;
  onDaemonToggle: () => Promise<void>;
}

type ViewMode = 'dashboard' | 'add-form' | 'edit-form' | 'logs' | 'doctor';

export const Dashboard: React.FC<DashboardProps> = ({
  version,
  domain,
  mappings,
  daemonStatus,
  healthStatus,
  diagnosticReport,
  onAddMapping,
  onEditMapping,
  onDeleteMapping,
  onRefresh,
  onRunDiagnostics,
  onDaemonToggle,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDiagnosticsLoading, setIsDiagnosticsLoading] = useState(false);
  const [isDaemonToggling, setIsDaemonToggling] = useState(false);

  useEffect(() => {
    // Reset selected index if mappings change
    if (selectedIndex >= mappings.length) {
      setSelectedIndex(Math.max(0, mappings.length - 1));
    }
  }, [mappings.length, selectedIndex]);

  const handleAddMapping = (data: Partial<Mapping>) => {
    onAddMapping(data);
    setViewMode('dashboard');
  };

  const handleEditMapping = (data: Partial<Mapping>) => {
    const selected = mappings[selectedIndex];
    if (selected) {
      onEditMapping(selected.id, data);
    }
    setViewMode('dashboard');
  };

  const handleDeleteMapping = () => {
    const selected = mappings[selectedIndex];
    if (selected) {
      onDeleteMapping(selected.id);
    }
  };

  const handleRunDiagnostics = async () => {
    setIsDiagnosticsLoading(true);
    setViewMode('doctor');
    await onRunDiagnostics();
    setIsDiagnosticsLoading(false);
  };

  const handleDaemonToggle = async () => {
    setIsDaemonToggling(true);
    await onDaemonToggle();
    setIsDaemonToggling(false);
  };

  const navigateUp = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const navigateDown = () => {
    if (selectedIndex < mappings.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  // Handle keyboard input
  useInput((input, key) => {
    // Global shortcuts that work everywhere
    if (key.ctrl && input === 'c') {
      process.exit(0);
      return;
    }

    // Escape always goes back or quits
    if (key.escape || input === 'escape') {
      if (viewMode !== 'dashboard') {
        setViewMode('dashboard');
      } else {
        process.exit(0);
      }
      return;
    }

    // Ctrl+D for diagnostics (works everywhere)
    if (key.ctrl && input === 'd') {
      handleRunDiagnostics();
      return;
    }

    // Other shortcuts only work in dashboard mode
    if (viewMode !== 'dashboard') {
      return;
    }

    switch (input) {
      case 'q':
        process.exit(0);
        break;
      
      case 'n':
        setViewMode('add-form');
        break;
      
      case 'e':
        if (mappings.length > 0) {
          setViewMode('edit-form');
        }
        break;
      
      case 'd':
        if (mappings.length > 0) {
          handleDeleteMapping();
        }
        break;
      
      case 'r':
        onRefresh();
        break;
      
      case 'l':
        setViewMode('logs');
        break;
      
      case 's':
        handleDaemonToggle();
        break;
    }

    // Navigation keys
    if (key.upArrow || input === 'k') {
      navigateUp();
    } else if (key.downArrow || input === 'j') {
      navigateDown();
    }
  });

  return (
    <Box flexDirection="column">
      <StatusBar version={version} daemonStatus={daemonStatus} domain={domain} />

      {viewMode === 'dashboard' && (
          <>
              <MappingsList
                mappings={mappings}
                healthStatus={healthStatus}
                selectedIndex={selectedIndex}
                defaultDomain={domain}
              />
              <HelpBar 
                mode="dashboard" 
                daemonStatus={daemonStatus}
                isDaemonToggling={isDaemonToggling}
              />
            </>
      )}

      {viewMode === 'add-form' && (
        <>
          <MappingForm onSubmit={handleAddMapping} onCancel={() => setViewMode('dashboard')} />
          <HelpBar mode="form" />
        </>
      )}

      {viewMode === 'edit-form' && (
        <>
          <MappingForm
            mapping={mappings[selectedIndex]}
            onSubmit={handleEditMapping}
            onCancel={() => setViewMode('dashboard')}
          />
          <HelpBar mode="form" />
        </>
      )}

      {viewMode === 'logs' && (
        <>
          <LogsViewer />
          <HelpBar mode="logs" />
        </>
      )}

      {viewMode === 'doctor' && (
        <>
          <DoctorPanel report={diagnosticReport} isLoading={isDiagnosticsLoading} />
          <HelpBar mode="doctor" />
        </>
      )}
    </Box>
  );
};


