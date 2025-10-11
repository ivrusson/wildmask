import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard.js';
import { ConfigManager, MappingManager, CONFIG_FILE } from '@wildmask/core';
import { HealthChecker, Diagnostics } from '@wildmask/health';
import type { Mapping, DaemonStatus, MappingHealth, DiagnosticReport } from '@wildmask/types';

export const App: React.FC = () => {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [daemonStatus, setDaemonStatus] = useState<DaemonStatus>({ running: false });
  const [healthStatus, setHealthStatus] = useState<Map<string, MappingHealth>>(new Map());
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const [domain, setDomain] = useState('test');

  const configManager = new ConfigManager();
  const mappingManager = new MappingManager(configManager);
  const healthChecker = new HealthChecker();
  const diagnostics = new Diagnostics();

  const loadData = async () => {
    try {
      const config = configManager.load();
      setMappings(config.mappings);
      setDomain(config.domain);

      // Check daemon status using PID file
      const { existsSync, readFileSync } = await import('node:fs');
      const pidFile = process.env.HOME + '/.wildmask/daemon.pid';
      
      if (existsSync(pidFile)) {
        try {
          const pidContent = readFileSync(pidFile, 'utf-8').trim();
          const pid = parseInt(pidContent, 10);
          
          if (!isNaN(pid) && pid > 0) {
            // Check if process exists
            process.kill(pid, 0);
            setDaemonStatus({ running: true, pid });
          } else {
            setDaemonStatus({ running: false });
          }
        } catch (err) {
          // Process doesn't exist or permission denied
          setDaemonStatus({ running: false });
        }
      } else {
        setDaemonStatus({ running: false });
      }

      // Run health checks for enabled mappings
      const enabledMappings = config.mappings.filter((m) => m.enabled && m.health?.enabled);
      Promise.all(
        enabledMappings.map(async (mapping) => {
          const result = await healthChecker.check(mapping);
          return {
            mappingId: mapping.id,
            host: mapping.host,
            result,
          };
        })
      ).then((results) => {
        const newHealthStatus = new Map<string, MappingHealth>();
        for (const result of results) {
          newHealthStatus.set(result.mappingId, result);
        }
        setHealthStatus(newHealthStatus);
      });
    } catch (error) {
      // Config not initialized yet
      console.error('Failed to load data:', error);
    }
  };

  useEffect(() => {
    loadData();

    // Refresh every 5 seconds
    const interval = setInterval(loadData, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAddMapping = (data: Partial<Mapping>) => {
    try {
      mappingManager.add(data as Omit<Mapping, 'id'>);
      loadData();
    } catch (error) {
      console.error('Failed to add mapping:', error);
    }
  };

  const handleEditMapping = (id: string, data: Partial<Mapping>) => {
    try {
      mappingManager.update(id, data);
      loadData();
    } catch (error) {
      console.error('Failed to edit mapping:', error);
    }
  };

  const handleDeleteMapping = (id: string) => {
    try {
      mappingManager.remove(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete mapping:', error);
    }
  };

  const handleRunDiagnostics = async () => {
    try {
      const config = configManager.load();
      const { DAEMON_PID_FILE } = await import('@wildmask/core');
      const report = await diagnostics.runAll({
        pidFile: DAEMON_PID_FILE,
        port: config.resolver.port,
        domain: config.domain,
        configPath: CONFIG_FILE,
      });
      setDiagnosticReport(report);
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
    }
  };

  const handleDaemonToggle = async () => {
    try {
      const { spawn } = await import('node:child_process');
      
      const cliPath = process.cwd() + '/packages/cli/dist/cli.js';
      const command = daemonStatus.running ? 'down' : 'up';
      
      const child = spawn('node', [cliPath, command], { 
        stdio: 'pipe',
        detached: false 
      });
      
      let output = '';
      child.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          // Refresh data after successful toggle
          setTimeout(loadData, 1000);
        } else {
          console.error('Daemon toggle failed:', output);
          setTimeout(loadData, 500);
        }
      });
      
      child.on('error', (error) => {
        console.error('Failed to toggle daemon:', error);
        setTimeout(loadData, 500);
      });
    } catch (error) {
      console.error('Failed to toggle daemon:', error);
    }
  };

  return (
    <Dashboard
      version="0.1.0"
      domain={domain}
      mappings={mappings}
      daemonStatus={daemonStatus}
      healthStatus={healthStatus}
      diagnosticReport={diagnosticReport}
      onAddMapping={handleAddMapping}
      onEditMapping={handleEditMapping}
      onDeleteMapping={handleDeleteMapping}
      onRefresh={loadData}
      onRunDiagnostics={handleRunDiagnostics}
      onDaemonToggle={handleDaemonToggle}
    />
  );
};


