import { useState } from 'react';
import { useCrmStore } from '../../stores/crmStoreDb';
import Card from '../ui/Card';
import Button from '../ui/Button';

const TimeTracking = () => {
  const { projects, companies, timeEntries } = useCrmStore();
  const [error, setError] = useState<string | null>(null);

  try {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Time Tracking</h1>
            <p className="text-gray-500 mt-1">Track time, monitor project progress, and analyze productivity.</p>
          </div>
        </div>

        {/* Debug Info */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Debug Information</h3>
          <div className="space-y-2 text-sm">
            <div>Projects loaded: {projects?.length || 0}</div>
            <div>Companies loaded: {companies?.length || 0}</div>
            <div>Time entries loaded: {timeEntries?.length || 0}</div>
            {error && (
              <div className="text-red-600 bg-red-50 p-3 rounded">
                Error: {error}
              </div>
            )}
          </div>
        </Card>

        {/* Simple Timer */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Simple Timer</h3>
          <div className="text-center">
            <div className="text-4xl font-mono font-bold mb-4 text-gray-400">
              00:00:00
            </div>
            <Button variant="primary" disabled>
              Timer functionality loading...
            </Button>
          </div>
        </Card>

        {/* Projects List */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Projects</h3>
          {projects && projects.length > 0 ? (
            <div className="space-y-2">
              {projects.slice(0, 5).map((project) => {
                const company = companies?.find(c => c.id === project.companyId);
                return (
                  <div key={project.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-800">{project.title}</div>
                    <div className="text-sm text-gray-600">{company?.name || 'Unknown Company'}</div>
                    <div className="text-xs text-gray-500">Status: {project.status}</div>
                  </div>
                );
              })}
              {projects.length > 5 && (
                <div className="text-sm text-gray-500 text-center">
                  ... and {projects.length - 5} more projects
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No projects found.</p>
              <p className="text-sm mt-1">Create some projects first to start tracking time.</p>
            </div>
          )}
        </Card>
      </div>
    );
  } catch (err) {
    console.error('TimeTracking component error:', err);
    return (
      <div className="space-y-6">
        <div className="text-red-600 bg-red-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Time Tracking Error</h2>
          <p>There was an error loading the time tracking component.</p>
          <pre className="text-sm mt-4 bg-white p-3 rounded border overflow-auto">
            {err instanceof Error ? err.message : String(err)}
          </pre>
        </div>
      </div>
    );
  }
};

export default TimeTracking;