import { useState } from 'react';
import { useCrmStore } from '../../stores/crmStoreDb';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import TimeEntryForm from './TimeEntryForm';
import type { TimeEntry } from '../../types/crm';

interface TimeEntriesListProps {
  entries: TimeEntry[];
  showProject?: boolean;
  compact?: boolean;
}

const TimeEntriesList = ({ entries, showProject = false, compact = false }: TimeEntriesListProps) => {
  const { 
    projects, 
    companies,
    deleteTimeEntry,
    formatDuration
  } = useCrmStore();

  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setShowEditForm(true);
  };

  const handleDelete = async (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      try {
        await deleteTimeEntry(entryId);
      } catch (error) {
        alert('Failed to delete time entry. Please try again.');
      }
    }
  };

  const handleCloseEdit = () => {
    setEditingEntry(null);
    setShowEditForm(false);
  };

  const groupEntriesByDate = (entries: TimeEntry[]) => {
    const groups: { [key: string]: TimeEntry[] } = {};
    
    entries.forEach(entry => {
      const dateKey = entry.date.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, entries]) => ({
        date: new Date(date),
        entries: entries.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      }));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-4">⏰</div>
        <p>No time entries found.</p>
        <p className="text-sm mt-1">Start tracking time to see entries here.</p>
      </div>
    );
  }

  const groupedEntries = groupEntriesByDate(entries);

  return (
    <>
      <div className="space-y-6">
        {groupedEntries.map(({ date, entries: dayEntries }) => {
          const dayTotal = dayEntries.reduce((sum, entry) => sum + entry.duration, 0);
          const dayBillable = dayEntries
            .filter(entry => entry.billable)
            .reduce((sum, entry) => sum + entry.duration, 0);

          return (
            <div key={date.toDateString()}>
              {!compact && (
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">{formatDate(date)}</h4>
                  <div className="text-sm text-gray-500">
                    {formatDuration(dayTotal)} total • {formatDuration(dayBillable)} billable
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {dayEntries.map((entry) => {
                  const project = projects.find(p => p.id === entry.projectId);
                  const company = project ? companies.find(c => c.id === project.companyId) : null;
                  const revenue = entry.billable && entry.hourlyRate ? 
                    (entry.duration / 60) * entry.hourlyRate : 0;

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        entry.isRunning ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                      } hover:shadow-sm transition-shadow`}
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {entry.isRunning && (
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              )}
                              <p className="font-medium text-gray-800">{entry.description}</p>
                              {entry.billable && (
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                                  Billable
                                </span>
                              )}
                            </div>
                            
                            {(showProject || compact) && project && (
                              <p className="text-sm text-gray-600 mt-1">
                                {project.title} {company && `• ${company.name}`}
                              </p>
                            )}

                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>
                                {formatTime(entry.startTime)}
                                {entry.endTime && ` - ${formatTime(entry.endTime)}`}
                              </span>
                              
                              {entry.tags.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  {entry.tags.map((tag, index) => (
                                    <span key={index} className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right ml-4">
                            <div className="font-medium text-gray-800">
                              {formatDuration(entry.duration)}
                            </div>
                            {revenue > 0 && (
                              <div className="text-sm text-green-600">
                                ${revenue.toFixed(2)}
                              </div>
                            )}
                            {entry.hourlyRate && (
                              <div className="text-xs text-gray-500">
                                ${entry.hourlyRate}/hr
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {!compact && !entry.isRunning && (
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Time Entry Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={handleCloseEdit}
        title="Edit Time Entry"
      >
        {editingEntry && (
          <TimeEntryForm
            entry={editingEntry}
            onSuccess={handleCloseEdit}
            onCancel={handleCloseEdit}
          />
        )}
      </Modal>
    </>
  );
};

export default TimeEntriesList;