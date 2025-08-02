import { useState } from 'react';
import { useCrmStore } from '../../stores/crmStoreDb';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';

const TimeTracking = () => {
  const { projects, companies, timeEntries } = useCrmStore();
  const [selectedTab, setSelectedTab] = useState<'timer' | 'entries' | 'reports'>('timer');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [description, setDescription] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Simple timer functionality
  const handleStartTimer = () => {
    if (!selectedProject || !description.trim()) {
      alert('Please select a project and enter a description');
      return;
    }
    
    setTimerRunning(true);
    setStartTime(new Date());
    setElapsedSeconds(0);
    
    // Simple interval for demo
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    
    // Store interval ID for cleanup
    (window as any).timerInterval = interval;
  };

  const handleStopTimer = () => {
    if ((window as any).timerInterval) {
      clearInterval((window as any).timerInterval);
    }
    setTimerRunning(false);
    
    // Here you would normally save the time entry
    alert(`Timer stopped! ${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s tracked`);
    
    // Reset
    setStartTime(null);
    setElapsedSeconds(0);
    setDescription('');
    setSelectedProject('');
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const projectOptions = projects.map(project => {
    const company = companies.find(c => c.id === project.companyId);
    return {
      value: project.id,
      label: `${project.title} (${company?.name || 'Unknown'})`
    };
  });

  const tabs = [
    { key: 'timer', label: 'Timer', icon: '⏱️' },
    { key: 'entries', label: 'Time Entries', icon: '📋' },
    { key: 'reports', label: 'Reports', icon: '📊' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Time Tracking</h1>
          <p className="text-gray-500 mt-1">Track time, monitor project progress, and analyze productivity.</p>
        </div>
        <Button 
          variant="primary"
          onClick={() => setShowAddForm(true)}
        >
          + Add Time Entry
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                selectedTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'timer' && (
        <div className="space-y-6">
          {/* Timer */}
          <Card>
            <div className="space-y-6">
              {/* Timer Display */}
              <div className="text-center">
                <div className={`text-6xl font-mono font-bold mb-4 ${
                  timerRunning ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {formatTime(elapsedSeconds)}
                </div>
                
                <div className="flex justify-center space-x-3">
                  {!timerRunning ? (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleStartTimer}
                      disabled={!selectedProject || !description.trim()}
                      className="px-8"
                    >
                      ▶️ Start Timer
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleStopTimer}
                      className="px-6"
                    >
                      ⏹️ Stop Timer
                    </Button>
                  )}
                </div>
                
                {timerRunning && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-700">
                      <div className="font-medium">Currently tracking:</div>
                      <div>{description}</div>
                      <div className="text-xs mt-1">
                        Started at: {startTime?.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Timer Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Select
                    label="Project"
                    value={selectedProject}
                    onChange={setSelectedProject}
                    options={[{ value: '', label: 'Select a project...' }, ...projectOptions]}
                    required
                    disabled={timerRunning}
                  />
                </div>

                <div>
                  <Input
                    label="What are you working on?"
                    value={description}
                    onChange={setDescription}
                    placeholder="Describe what you're working on..."
                    required
                    disabled={timerRunning}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">⏰</div>
              <p>No time entries yet.</p>
              <p className="text-sm mt-1">Start tracking time to see entries here.</p>
            </div>
          </Card>
        </div>
      )}

      {selectedTab === 'entries' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Time Entries</h3>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📋</div>
            <p>Time entries feature coming soon!</p>
            <p className="text-sm mt-1">Time entries: {timeEntries?.length || 0}</p>
          </div>
        </Card>
      )}

      {selectedTab === 'reports' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Reports</h3>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📊</div>
            <p>Reports feature coming soon!</p>
            <p className="text-sm mt-1">Track time to generate reports.</p>
          </div>
        </Card>
      )}

      {/* Add Time Entry Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add Time Entry"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Manual time entry form coming soon!</p>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setShowAddForm(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TimeTracking;