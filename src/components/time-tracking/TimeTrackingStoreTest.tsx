import React from 'react';
import { useCrmStore } from '../../stores/crmStoreDb';

const TimeTracking = () => {
  console.log('TimeTracking component rendering...');
  
  try {
    const store = useCrmStore();
    console.log('Store accessed successfully:', {
      projects: store.projects?.length,
      companies: store.companies?.length,
      timeEntries: store.timeEntries?.length
    });

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">Time Tracking Store Test</h1>
        <p className="mt-2 text-gray-600">Testing store connection...</p>
        
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-green-800">✅ Component rendered successfully</p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">📊 Store Data:</p>
            <ul className="mt-2 text-sm text-blue-700">
              <li>Projects: {store.projects?.length || 0}</li>
              <li>Companies: {store.companies?.length || 0}</li>
              <li>Time Entries: {store.timeEntries?.length || 0}</li>
            </ul>
          </div>

          {store.projects && store.projects.length > 0 && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-purple-800">🚀 Sample Project:</p>
              <p className="text-sm text-purple-700 mt-1">
                {store.projects[0].title} - {store.projects[0].status}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in TimeTracking component:', error);
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-800">Time Tracking Error</h1>
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <p className="text-red-800">❌ Error occurred:</p>
          <pre className="text-sm text-red-700 mt-2 bg-white p-2 rounded border">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    );
  }
};

export default TimeTracking;