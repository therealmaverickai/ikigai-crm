import { useState, useEffect } from 'react';
import { useCrmStore } from '../../stores/crmStoreDb';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';

const Timer = () => {
  const { 
    projects, 
    companies,
    timer,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    updateTimerDescription,
    getTimerElapsed,
    formatDuration
  } = useCrmStore();

  const [selectedProject, setSelectedProject] = useState('');
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number | undefined>();
  const [billable, setBillable] = useState(true);
  const [displayTime, setDisplayTime] = useState(0);

  // Update display time every second when timer is running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timer.isRunning) {
      interval = setInterval(() => {
        setDisplayTime(getTimerElapsed());
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, getTimerElapsed]);

  // Initialize display time and description from current timer state
  useEffect(() => {
    setDisplayTime(timer.elapsedTime);
    if (timer.currentEntry) {
      setDescription(timer.currentEntry.description);
      setSelectedProject(timer.currentEntry.projectId);
      setBillable(timer.currentEntry.billable);
      setHourlyRate(timer.currentEntry.hourlyRate);
    }
  }, [timer]);

  const handleStart = () => {
    if (!selectedProject || !description.trim()) {
      alert('Please select a project and enter a description');
      return;
    }

    startTimer(selectedProject, description.trim(), billable, hourlyRate);
  };

  const handleStop = async () => {
    const savedEntry = await stopTimer();
    if (savedEntry) {
      // Reset form
      setDescription('');
      setSelectedProject('');
      setHourlyRate(undefined);
      setBillable(true);
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (timer.isRunning) {
      updateTimerDescription(value);
    }
  };

  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const projectOptions = projects.map(project => {
    const company = companies.find(c => c.id === project.companyId);
    return {
      value: project.id,
      label: `${project.title} (${company?.name || 'Unknown Company'})`
    };
  });

  const selectedProjectData = projects.find(p => p.id === selectedProject);
  const selectedCompany = selectedProjectData ? 
    companies.find(c => c.id === selectedProjectData.companyId) : null;

  return (
    <Card>
      <div className="space-y-6">
        {/* Timer Display */}
        <div className="text-center">
          <div className={`text-6xl font-mono font-bold mb-4 ${
            timer.isRunning ? 'text-green-600' : 'text-gray-400'
          }`}>
            {formatElapsedTime(displayTime)}
          </div>
          
          <div className="flex justify-center space-x-3">
            {!timer.isRunning ? (
              <Button
                variant="primary"
                size="lg"
                onClick={handleStart}
                disabled={!selectedProject || !description.trim()}
                className="px-8"
              >
                ▶️ Start Timer
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={pauseTimer}
                  className="px-6"
                >
                  ⏸️ Pause
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStop}
                  className="px-6"
                >
                  ⏹️ Stop
                </Button>
              </>
            )}
          </div>
          
          {timer.isRunning && timer.currentEntry && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-700">
                <div className="font-medium">Currently tracking:</div>
                <div>{timer.currentEntry.description}</div>
                <div className="text-xs mt-1">
                  Project: {selectedProjectData?.title} • 
                  Company: {selectedCompany?.name} • 
                  {timer.currentEntry.billable ? 'Billable' : 'Non-billable'}
                  {timer.currentEntry.hourlyRate && ` • $${timer.currentEntry.hourlyRate}/hr`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timer Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Selection */}
          <div className="space-y-4">
            <Select
              label="Project"
              value={selectedProject}
              onChange={setSelectedProject}
              options={[{ value: '', label: 'Select a project...' }, ...projectOptions]}
              required
              disabled={timer.isRunning}
            />
            
            {selectedProjectData && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="font-medium text-gray-800">{selectedProjectData.title}</div>
                <div className="text-gray-600">{selectedCompany?.name}</div>
                <div className="text-gray-500 mt-1">
                  Status: <span className="capitalize">{selectedProjectData.status}</span> • 
                  Progress: {selectedProjectData.progressPercentage}%
                </div>
              </div>
            )}
          </div>

          {/* Time Entry Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={billable}
                  onChange={(e) => setBillable(e.target.checked)}
                  disabled={timer.isRunning}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Billable</span>
              </label>
              
              {billable && (
                <Input
                  label="Hourly Rate ($)"
                  type="number"
                  value={hourlyRate?.toString() || ''}
                  onChange={(value) => setHourlyRate(value ? parseFloat(value) : undefined)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={timer.isRunning}
                />
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <Textarea
          label="What are you working on?"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Describe what you're working on..."
          rows={3}
          required
        />

        {/* Quick Actions */}
        {!timer.isRunning && (
          <div className="border-t pt-4">
            <div className="text-sm text-gray-600 mb-3">Quick Start:</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {projects.slice(0, 3).map(project => {
                const company = companies.find(c => c.id === project.companyId);
                return (
                  <Button
                    key={project.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedProject(project.id);
                      setDescription(`Working on ${project.title}`);
                    }}
                    className="text-left p-3 h-auto"
                  >
                    <div className="font-medium text-gray-800">{project.title}</div>
                    <div className="text-xs text-gray-500">{company?.name}</div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Current Status */}
        {timer.isRunning && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                Started: {timer.currentEntry?.startTime.toLocaleTimeString()}
              </div>
              <div className="text-gray-600">
                Estimated revenue: ${((displayTime / 3600) * (hourlyRate || 0)).toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default Timer;