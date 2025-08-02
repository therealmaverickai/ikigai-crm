import { useState, useEffect } from 'react';
import { useCrmStore } from '../../stores/crmStoreDb';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import Timer from './Timer';
import TimeEntriesList from './TimeEntriesList';
import WeeklyReport from './WeeklyReport';
import TimeEntryForm from './TimeEntryForm';
import type { TimeEntryFilters } from '../../types/crm';

const TimeTracking = () => {
  const { 
    projects,
    companies,
    getTimeEntriesForWeek,
    getWeeklyTimeReport,
    getFilteredTimeEntries,
    formatDuration
  } = useCrmStore();

  const [selectedTab, setSelectedTab] = useState<'timer' | 'entries' | 'reports'>('timer');
  const [showTimeEntryForm, setShowTimeEntryForm] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekStart());
  const [filters, setFilters] = useState<TimeEntryFilters>({});

  // Get current week start (Monday)
  function getCurrentWeekStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  const weekEntries = getTimeEntriesForWeek(selectedWeek);
  const weeklyReport = getWeeklyTimeReport(selectedWeek);
  const filteredEntries = getFilteredTimeEntries(filters);

  const weekTotalHours = weekEntries.reduce((sum, entry) => sum + (entry.duration / 60), 0);
  const weekBillableHours = weekEntries
    .filter(entry => entry.billable)
    .reduce((sum, entry) => sum + (entry.duration / 60), 0);

  const formatWeekRange = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const formatDate = (date: Date) => 
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(getCurrentWeekStart());
  };

  const tabs = [
    { key: 'timer', label: 'Timer', icon: '⏱️' },
    { key: 'entries', label: 'Time Entries', icon: '📋' },
    { key: 'reports', label: 'Reports', icon: '📊' },
  ] as const;

  const projectOptions = projects.map(project => {
    const company = companies.find(c => c.id === project.companyId);
    return {
      value: project.id,
      label: `${project.title} (${company?.name || 'Unknown'})`
    };
  });

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
          onClick={() => setShowTimeEntryForm(true)}
        >
          + Add Time Entry
        </Button>
      </div>

      {/* Week Navigation */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              ← Previous Week
            </Button>
            <h2 className="text-xl font-semibold text-gray-800">
              {formatWeekRange(selectedWeek)}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              Next Week →
            </Button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={goToCurrentWeek}
          >
            Current Week
          </Button>
        </div>

        {/* Week Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {formatDuration(Math.round(weekTotalHours * 60))}
            </div>
            <div className="text-sm text-blue-700">Total Hours</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatDuration(Math.round(weekBillableHours * 60))}
            </div>
            <div className="text-sm text-green-700">Billable Hours</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              ${Math.round(weeklyReport.totalRevenue).toLocaleString()}
            </div>
            <div className="text-sm text-purple-700">Revenue</div>
          </div>
        </div>
      </Card>

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
          <Timer />
          
          {/* Recent entries for current week */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">This Week's Entries</h3>
            <TimeEntriesList 
              entries={weekEntries.slice(0, 10)}
              showProject
              compact
            />
            {weekEntries.length > 10 && (
              <div className="text-center mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTab('entries')}
                >
                  View All {weekEntries.length} Entries
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {selectedTab === 'entries' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Search"
                value={filters.search || ''}
                onChange={(value) => setFilters({ ...filters, search: value })}
                placeholder="Search descriptions or tags..."
              />
              
              <Select
                label="Project"
                value={filters.projectId || ''}
                onChange={(value) => setFilters({ ...filters, projectId: value || undefined })}
                options={[{ value: '', label: 'All Projects' }, ...projectOptions]}
              />
              
              <Select
                label="Billable"
                value={filters.billable === undefined ? '' : filters.billable.toString()}
                onChange={(value) => setFilters({ 
                  ...filters, 
                  billable: value === '' ? undefined : value === 'true' 
                })}
                options={[
                  { value: '', label: 'All' },
                  { value: 'true', label: 'Billable Only' },
                  { value: 'false', label: 'Non-Billable Only' },
                ]}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                label="From Date"
                type="date"
                value={filters.dateFrom?.toISOString().split('T')[0] || ''}
                onChange={(value) => setFilters({ 
                  ...filters, 
                  dateFrom: value ? new Date(value) : undefined 
                })}
              />
              
              <Input
                label="To Date"
                type="date"
                value={filters.dateTo?.toISOString().split('T')[0] || ''}
                onChange={(value) => setFilters({ 
                  ...filters, 
                  dateTo: value ? new Date(value) : undefined 
                })}
              />
            </div>
            
            {Object.keys(filters).some(key => filters[key as keyof TimeEntryFilters] !== undefined) && (
              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({})}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </Card>

          {/* Time Entries List */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Time Entries ({filteredEntries.length})
              </h3>
              <div className="text-sm text-gray-500">
                Total: {formatDuration(filteredEntries.reduce((sum, entry) => sum + entry.duration, 0))}
              </div>
            </div>
            <TimeEntriesList entries={filteredEntries} showProject />
          </Card>
        </div>
      )}

      {selectedTab === 'reports' && (
        <WeeklyReport 
          weekStart={selectedWeek}
          onWeekChange={setSelectedWeek}
        />
      )}

      {/* Time Entry Form Modal */}
      <Modal
        isOpen={showTimeEntryForm}
        onClose={() => setShowTimeEntryForm(false)}
        title="Add Time Entry"
      >
        <TimeEntryForm
          onSuccess={() => {
            setShowTimeEntryForm(false);
          }}
          onCancel={() => setShowTimeEntryForm(false)}
        />
      </Modal>
    </div>
  );
};

export default TimeTracking;