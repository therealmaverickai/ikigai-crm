import { useState } from 'react';
import { useCrmStore } from '../../stores/crmStoreDb';
import Card from '../ui/Card';
import WeeklyTimesheet from './WeeklyTimesheet';
import TimeEntriesList from './TimeEntriesList';
import type { TimeEntry } from '../../types/crm';

const TimeTracking = () => {
  const { projects, companies, timeEntries } = useCrmStore();
  const [selectedTab, setSelectedTab] = useState<'timesheet' | 'entries' | 'reports'>('timesheet');




  // Group entries by project for reports
  const getProjectReports = () => {
    const projectStats = new Map();

    // Initialize with all projects
    projects.forEach(project => {
      const company = companies.find(c => c.id === project.companyId);
      projectStats.set(project.id, {
        project,
        company,
        totalHours: 0,
        billableHours: 0,
        totalRevenue: 0,
        entries: [],
        // Budget data from project
        budgetedRevenue: project.budget?.totalRevenue || 0,
        budgetedHours: project.budget?.resources?.reduce((sum, r) => sum + r.hoursAllocated, 0) || 0,
        budgetedCosts: project.budget?.totalResourceCost || 0,
        budgetedMargin: project.budget?.grossMargin || 0
      });
    });

    // Add time entries data
    timeEntries.forEach(entry => {
      const stats = projectStats.get(entry.projectId);
      if (stats) {
        const hours = entry.duration / 60;
        stats.totalHours += hours;
        stats.entries.push(entry);
        
        if (entry.billable) {
          stats.billableHours += hours;
          if (entry.hourlyRate) {
            stats.totalRevenue += hours * entry.hourlyRate;
          }
        }
      }
    });

    // Calculate margins
    return Array.from(projectStats.values()).map(stats => {
      // Actual costs based on time entries
      const actualCosts = stats.entries.reduce((sum: number, entry: TimeEntry) => {
        if (entry.billable && entry.hourlyRate) {
          return sum + (entry.duration / 60) * entry.hourlyRate;
        }
        return sum;
      }, 0);

      // Real margin calculation
      const actualMargin = stats.budgetedRevenue - actualCosts;
      const budgetedMarginPercentage = stats.budgetedRevenue > 0 ? 
        (stats.budgetedMargin / stats.budgetedRevenue) * 100 : 0;
      const actualMarginPercentage = stats.budgetedRevenue > 0 ? 
        (actualMargin / stats.budgetedRevenue) * 100 : 0;
      
      const hoursUtilization = stats.budgetedHours > 0 ? 
        (stats.totalHours / stats.budgetedHours) * 100 : 0;

      return {
        ...stats,
        actualCosts,
        actualMargin,
        budgetedMarginPercentage,
        actualMarginPercentage,
        marginVariance: actualMargin - stats.budgetedMargin,
        hoursUtilization,
        hoursVariance: stats.totalHours - stats.budgetedHours
      };
    }).filter(stats => stats.totalHours > 0 || stats.budgetedHours > 0); // Show projects with activity or budget
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  const tabs = [
    { key: 'timesheet', label: 'Weekly Timesheet', icon: '📅' },
    { key: 'entries', label: 'Time Entries', icon: '📋' },
    { key: 'reports', label: 'Project Reports', icon: '📊' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Time Tracking</h1>
          <p className="text-gray-500 mt-1">Track hours worked and monitor project margins.</p>
        </div>
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

      {/* Weekly Timesheet Tab */}
      {selectedTab === 'timesheet' && (
        <WeeklyTimesheet />
      )}

      {/* Time Entries Tab */}
      {selectedTab === 'entries' && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Time Entries ({timeEntries.length})
            </h3>
            <div className="text-sm text-gray-500">
              Total: {formatHours(timeEntries.reduce((sum, entry) => sum + (entry.duration / 60), 0))}
            </div>
          </div>

          <TimeEntriesList 
            entries={timeEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
            showProject={true}
          />
        </Card>
      )}

      {/* Project Reports Tab */}
      {selectedTab === 'reports' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Project Margin Analysis</h3>
            
            {getProjectReports().length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Budgeted Margin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actual Margin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getProjectReports().map((report) => (
                      <tr key={report.project.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{report.project.title}</div>
                            <div className="text-sm text-gray-500">{report.company?.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatHours(report.totalHours)} / {formatHours(report.budgetedHours)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {report.hoursUtilization.toFixed(0)}% utilization
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(report.totalRevenue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            of {formatCurrency(report.budgetedRevenue)} budgeted
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(report.budgetedMargin)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {report.budgetedMarginPercentage.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            report.actualMargin >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(report.actualMargin)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {report.actualMarginPercentage.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            report.marginVariance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {report.marginVariance >= 0 ? '+' : ''}{formatCurrency(report.marginVariance)}
                          </div>
                          <div className="text-xs text-gray-500">
                            vs budget
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📊</div>
                <p>No project data available.</p>
                <p className="text-sm mt-1">Add time entries to see margin analysis.</p>
              </div>
            )}
          </Card>
        </div>
      )}

    </div>
  );
};

export default TimeTracking;