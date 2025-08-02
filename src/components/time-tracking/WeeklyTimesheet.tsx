import { useState, useEffect } from 'react';
import { useCrmStore } from '../../stores/crmStoreDb';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Input from '../ui/Input';

interface DayEntry {
  date: Date;
  hours: string;
  timeEntryId?: string;
}

interface WeekData {
  [key: string]: DayEntry; // Monday, Tuesday, etc.
}

const WeeklyTimesheet = () => {
  const { projects, companies, addTimeEntry, updateTimeEntry, timeEntries } = useCrmStore();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedResourceName, setSelectedResourceName] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [weekData, setWeekData] = useState<WeekData>({});
  const [isLoading, setIsLoading] = useState(false);

  // Get Monday of current week
  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  // Get all days of the week
  function getWeekDays(weekStart: Date): DayEntry[] {
    const days: DayEntry[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push({
        date,
        hours: '',
        timeEntryId: undefined
      });
    }
    return days;
  }

  const weekDays = getWeekDays(currentWeekStart);
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Get selected project and resources
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const availableResources = selectedProject?.budget.resources || [];
  const selectedResource = availableResources.find(r => r.name === selectedResourceName);

  // Load existing time entries for the current week
  useEffect(() => {
    if (!selectedProjectId || !selectedResourceName) return;

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);

    const existingEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entry.projectId === selectedProjectId &&
             entry.resourceName === selectedResourceName &&
             entryDate >= currentWeekStart &&
             entryDate <= weekEnd;
    });

    const newWeekData: WeekData = {};
    weekDays.forEach((day, index) => {
      const dayName = dayNames[index];
      const existingEntry = existingEntries.find(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.toDateString() === day.date.toDateString();
      });

      newWeekData[dayName] = {
        date: day.date,
        hours: existingEntry ? (existingEntry.duration / 60).toString() : '',
        timeEntryId: existingEntry?.id
      };
    });

    setWeekData(newWeekData);
  }, [selectedProjectId, selectedResourceName, currentWeekStart, timeEntries]);

  const handleHoursChange = (dayName: string, hours: string) => {
    setWeekData(prev => ({
      ...prev,
      [dayName]: {
        ...prev[dayName],
        hours: hours
      }
    }));
  };

  const handleSaveWeek = async () => {
    if (!selectedProjectId || !selectedResourceName || !selectedResource) {
      alert('Please select a project and resource first');
      return;
    }

    setIsLoading(true);
    try {
      for (const [dayName, dayData] of Object.entries(weekData)) {
        const hours = parseFloat(dayData.hours);
        
        if (isNaN(hours) || hours <= 0) {
          // If hours is 0 or empty, skip or delete existing entry
          continue;
        }

        const timeEntryData = {
          projectId: selectedProjectId,
          resourceName: selectedResourceName,
          description: `${dayName} work`,
          startTime: new Date(dayData.date.getTime() + 9 * 60 * 60 * 1000), // 9 AM
          duration: Math.round(hours * 60), // Convert to minutes
          date: dayData.date,
          tags: [],
          billable: true,
          hourlyRate: selectedResource.hourlyRate,
          currency: selectedResource.currency
        };

        if (dayData.timeEntryId) {
          // Update existing entry
          await updateTimeEntry(dayData.timeEntryId, timeEntryData);
        } else {
          // Create new entry
          await addTimeEntry(timeEntryData);
        }
      }

      alert('✅ Timesheet saved successfully!');
    } catch (error) {
      console.error('Failed to save timesheet:', error);
      alert('❌ Failed to save timesheet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newWeekStart);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTotalHours = (): number => {
    return Object.values(weekData).reduce((total, day) => {
      const hours = parseFloat(day.hours) || 0;
      return total + hours;
    }, 0);
  };

  const getTotalCost = (): number => {
    if (!selectedResource) return 0;
    return getTotalHours() * selectedResource.hourlyRate;
  };

  const projectOptions = projects.map(project => {
    const company = companies.find(c => c.id === project.companyId);
    return {
      value: project.id,
      label: `${project.title} (${company?.name || 'Unknown Company'})`
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Weekly Timesheet</h1>
          <p className="text-gray-500 mt-1">Track your hours for the week</p>
        </div>
      </div>

      {/* Project and Resource Selection */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Project & Resource</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Project"
            value={selectedProjectId}
            onChange={setSelectedProjectId}
            options={[{ value: '', label: 'Select a project...' }, ...projectOptions]}
            required
          />

          {selectedProject && availableResources.length > 0 && (
            <Select
              label="Resource"
              value={selectedResourceName}
              onChange={setSelectedResourceName}
              options={[
                { value: '', label: 'Select a resource...' },
                ...availableResources.map(resource => ({
                  value: resource.name,
                  label: `${resource.name} (${resource.role}) - $${resource.hourlyRate}/hr`
                }))
              ]}
              required
            />
          )}
        </div>

        {selectedProject && availableResources.length === 0 && (
          <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700 mt-4">
            <div className="font-medium">⚠️ No resources found in project budget</div>
            <div>Please add resources to the project budget first.</div>
          </div>
        )}

        {selectedResource && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm">
            <div className="font-medium text-green-800">{selectedResource.name}</div>
            <div className="text-green-700">
              {selectedResource.role} • ${selectedResource.hourlyRate}/hour
            </div>
          </div>
        )}
      </Card>

      {/* Week Navigation */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigateWeek('prev')}>
              ← Previous Week
            </Button>
            <Button variant="ghost" size="sm" onClick={goToCurrentWeek}>
              Current Week
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigateWeek('next')}>
              Next Week →
            </Button>
          </div>
          <div className="text-lg font-semibold text-gray-800">
            Week of {formatDate(currentWeekStart)} - {formatDate(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000))}
          </div>
        </div>

        {/* Timesheet Grid */}
        {selectedProjectId && selectedResourceName ? (
          <div className="space-y-4">
            {/* Days Headers */}
            <div className="grid grid-cols-8 gap-4">
              <div className="font-medium text-gray-700">Day</div>
              {dayNames.map((day, index) => (
                <div key={day} className={`font-medium text-center ${
                  index >= 5 ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  {day.substring(0, 3)}
                </div>
              ))}
            </div>

            {/* Date Row */}
            <div className="grid grid-cols-8 gap-4">
              <div className="text-sm text-gray-500">Date</div>
              {weekDays.map((day, index) => (
                <div key={index} className={`text-sm text-center ${
                  index >= 5 ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {formatDate(day.date)}
                </div>
              ))}
            </div>

            {/* Hours Input Row */}
            <div className="grid grid-cols-8 gap-4">
              <div className="flex items-center text-sm font-medium text-gray-700">Hours</div>
              {dayNames.map((dayName, index) => (
                <div key={dayName}>
                  <Input
                    type="number"
                    value={weekData[dayName]?.hours || ''}
                    onChange={(value) => handleHoursChange(dayName, value)}
                    placeholder="0"
                    min="0"
                    max="24"
                    step="0.25"
                    className={`text-center ${
                      index >= 5 ? 'bg-gray-50 text-gray-400 placeholder-gray-300' : ''
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Cost Calculation Row */}
            {selectedResource && (
              <div className="grid grid-cols-8 gap-4 pt-2 border-t">
                <div className="text-sm font-medium text-gray-700">Cost</div>
                {dayNames.map((dayName, index) => {
                  const hours = parseFloat(weekData[dayName]?.hours || '0');
                  const cost = hours * selectedResource.hourlyRate;
                  return (
                    <div key={dayName} className={`text-sm text-center ${
                      index >= 5 ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {cost > 0 ? `$${cost.toFixed(0)}` : '-'}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total Row */}
            <div className="grid grid-cols-8 gap-4 pt-4 border-t bg-blue-50 rounded-lg p-4">
              <div className="font-bold text-blue-900">Total</div>
              <div className="col-span-6 text-center">
                <span className="font-bold text-blue-900">{getTotalHours().toFixed(1)} hours</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-blue-900">${getTotalCost().toFixed(0)}</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveWeek}
                disabled={isLoading || getTotalHours() === 0}
                variant="primary"
              >
                {isLoading ? 'Saving...' : 'Save Timesheet'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📅</div>
            <p>Select a project and resource to start tracking time</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default WeeklyTimesheet;