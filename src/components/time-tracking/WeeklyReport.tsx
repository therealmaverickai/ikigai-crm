import { useState } from 'react';
import { useCrmStore } from '../../stores/crmStoreDb';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface WeeklyReportProps {
  weekStart: Date;
  onWeekChange: (date: Date) => void;
}

const WeeklyReport = ({ weekStart, onWeekChange }: WeeklyReportProps) => {
  const { 
    getWeeklyTimeReport,
    getProjectTimeStats,
    formatDuration
  } = useCrmStore();

  const [selectedView, setSelectedView] = useState<'summary' | 'projects' | 'trends'>('summary');

  const report = getWeeklyTimeReport(weekStart);
  
  const formatWeekRange = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const formatDate = (date: Date) => 
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(weekStart);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    onWeekChange(newWeek);
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    onWeekChange(monday);
  };

  // Calculate daily breakdown
  const dailyBreakdown = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    
    const dayEntries = report.entries.filter(entry => 
      entry.date.toDateString() === date.toDateString()
    );
    
    const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.duration / 60), 0);
    const billableHours = dayEntries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + (entry.duration / 60), 0);
    
    return {
      date,
      totalHours,
      billableHours,
      entries: dayEntries.length,
    };
  });

  const averageHoursPerDay = report.totalHours / 7;
  const utilizationRate = report.totalHours > 0 ? (report.billableHours / report.totalHours) * 100 : 0;

  const views = [
    { key: 'summary', label: 'Summary', icon: '📊' },
    { key: 'projects', label: 'By Project', icon: '📁' },
    { key: 'trends', label: 'Daily Trends', icon: '📈' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              ← Previous Week
            </Button>
            <h2 className="text-2xl font-bold text-gray-800">
              Weekly Report: {formatWeekRange(weekStart)}
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

        {/* Week Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">
              {formatDuration(Math.round(report.totalHours * 60))}
            </div>
            <div className="text-sm text-blue-700">Total Hours</div>
            <div className="text-xs text-gray-500 mt-1">
              {averageHoursPerDay.toFixed(1)}h/day avg
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">
              {formatDuration(Math.round(report.billableHours * 60))}
            </div>
            <div className="text-sm text-green-700">Billable Hours</div>
            <div className="text-xs text-gray-500 mt-1">
              {utilizationRate.toFixed(1)}% utilization
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">
              ${Math.round(report.totalRevenue).toLocaleString()}
            </div>
            <div className="text-sm text-purple-700">Revenue</div>
            <div className="text-xs text-gray-500 mt-1">
              ${(report.billableHours > 0 ? report.totalRevenue / report.billableHours : 0).toFixed(0)}/hr avg
            </div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-3xl font-bold text-orange-600">
              {report.projectBreakdown.length}
            </div>
            <div className="text-sm text-orange-700">Projects</div>
            <div className="text-xs text-gray-500 mt-1">
              {report.entries.length} entries
            </div>
          </div>
        </div>
      </Card>

      {/* View Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {views.map((view) => (
            <button
              key={view.key}
              onClick={() => setSelectedView(view.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                selectedView === view.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{view.icon}</span>
              <span>{view.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* View Content */}
      {selectedView === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Projects */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Projects This Week</h3>
            <div className="space-y-3">
              {report.projectBreakdown
                .sort((a, b) => b.hours - a.hours)
                .slice(0, 5)
                .map((project, index) => (
                  <div key={project.projectId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{project.projectTitle}</div>
                      <div className="text-sm text-gray-600">{project.companyName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-800">
                        {formatDuration(Math.round(project.hours * 60))}
                      </div>
                      <div className="text-sm text-green-600">
                        ${Math.round(project.revenue).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          {/* Time Distribution */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Time Distribution</h3>
            <div className="space-y-4">
              {report.projectBreakdown.map((project) => {
                const percentage = report.totalHours > 0 ? (project.hours / report.totalHours) * 100 : 0;
                const billablePercentage = project.hours > 0 ? (project.billableHours / project.hours) * 100 : 0;
                
                return (
                  <div key={project.projectId}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-gray-700">{project.projectTitle}</div>
                      <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full relative"
                        style={{ width: `${percentage}%` }}
                      >
                        <div 
                          className="bg-green-500 h-2 rounded-full absolute top-0 left-0"
                          style={{ width: `${billablePercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDuration(Math.round(project.billableHours * 60))} billable of {formatDuration(Math.round(project.hours * 60))} total
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {selectedView === 'projects' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Billable Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilization
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.projectBreakdown.map((project) => {
                  const utilization = project.hours > 0 ? (project.billableHours / project.hours) * 100 : 0;
                  
                  return (
                    <tr key={project.projectId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{project.projectTitle}</div>
                          <div className="text-sm text-gray-500">{project.companyName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(Math.round(project.hours * 60))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(Math.round(project.billableHours * 60))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${Math.round(project.revenue).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{utilization.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selectedView === 'trends' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Breakdown</h3>
          <div className="space-y-4">
            {dailyBreakdown.map((day) => {
              const dayName = day.date.toLocaleDateString('en-US', { weekday: 'long' });
              const dayDate = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const maxHours = Math.max(...dailyBreakdown.map(d => d.totalHours), 8); // At least 8 hours for scale
              const totalPercentage = (day.totalHours / maxHours) * 100;
              const billablePercentage = day.totalHours > 0 ? (day.billableHours / day.totalHours) * 100 : 0;
              
              return (
                <div key={day.date.toDateString()} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-800">{dayName}</div>
                      <div className="text-sm text-gray-500">{dayDate}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-800">
                        {formatDuration(Math.round(day.totalHours * 60))}
                      </div>
                      <div className="text-sm text-gray-500">{day.entries} entries</div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 relative">
                    <div 
                      className="bg-blue-600 h-3 rounded-full relative"
                      style={{ width: `${totalPercentage}%` }}
                    >
                      <div 
                        className="bg-green-500 h-3 rounded-full absolute top-0 left-0"
                        style={{ width: `${billablePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <div>
                      {formatDuration(Math.round(day.billableHours * 60))} billable
                    </div>
                    <div>
                      {day.totalHours > 0 ? `${(day.billableHours / day.totalHours * 100).toFixed(0)}% utilization` : '0% utilization'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default WeeklyReport;