import { browserDb } from '../browserDatabase';
import type { 
  TimeEntry, 
  TimeEntryFormData,
  WeeklyTimeReport,
  ProjectTimeStats,
  DailyTimeEntry
} from '../../types/crm';

export class TimeTrackingService {
  private tableName = 'timeEntries';

  findAll(): TimeEntry[] {
    return browserDb.timeEntries.findAll();
  }

  findById(id: string): TimeEntry | null {
    return browserDb.timeEntries.findById(id);
  }

  findByProject(projectId: string): TimeEntry[] {
    return browserDb.timeEntries.findAll()
      .filter(entry => entry.projectId === projectId);
  }

  findByDateRange(startDate: Date, endDate: Date): TimeEntry[] {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return browserDb.timeEntries.findAll()
      .filter((entry: TimeEntry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= start && entryDate <= end;
      })
      .sort((a: TimeEntry, b: TimeEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  findByDate(date: Date): TimeEntry[] {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return browserDb.timeEntries.findAll()
      .filter((entry: TimeEntry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= targetDate && entryDate < nextDay;
      })
      .sort((a: TimeEntry, b: TimeEntry) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  create(data: TimeEntryFormData): TimeEntry {
    const now = new Date();
    const timeEntry: TimeEntry = {
      id: `time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId: data.projectId,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      duration: data.duration || (data.endTime ? 
        Math.round((data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60)) : 0),
      isRunning: !data.endTime,
      date: data.date,
      tags: data.tags,
      billable: data.billable,
      hourlyRate: data.hourlyRate,
      currency: data.currency,
      createdAt: now,
      updatedAt: now,
    };

    return browserDb.timeEntries.create(timeEntry) as TimeEntry;
  }

  update(id: string, data: Partial<TimeEntryFormData>): TimeEntry | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updatedEntry: TimeEntry = {
      ...existing,
      ...data,
      // Recalculate duration if start/end times changed
      duration: data.endTime && data.startTime ? 
        Math.round((data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60)) :
        data.duration !== undefined ? data.duration : existing.duration,
      isRunning: data.endTime ? false : existing.isRunning,
      updatedAt: new Date(),
    };

    return browserDb.timeEntries.update(id, updatedEntry);
  }

  delete(id: string): boolean {
    return browserDb.timeEntries.delete(id);
  }

  stopRunningEntry(id: string, endTime: Date): TimeEntry | null {
    const entry = this.findById(id);
    if (!entry || !entry.isRunning) return null;

    const duration = Math.round((endTime.getTime() - entry.startTime.getTime()) / (1000 * 60));
    
    return this.update(id, {
      endTime,
      duration,
    });
  }

  getRunningEntry(): TimeEntry | null {
    return browserDb.timeEntries.findAll()
      .find((entry: TimeEntry) => entry.isRunning) || null;
  }

  // Reporting functions
  getWeeklyReport(weekStart: Date): WeeklyTimeReport {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekEntries = this.findByDateRange(weekStart, weekEnd);
    
    const totalHours = weekEntries.reduce((sum, entry) => sum + (entry.duration / 60), 0);
    const billableHours = weekEntries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + (entry.duration / 60), 0);
    
    const totalRevenue = weekEntries
      .filter(entry => entry.billable && entry.hourlyRate)
      .reduce((sum, entry) => sum + ((entry.duration / 60) * (entry.hourlyRate || 0)), 0);

    // Group by project
    const projectMap = new Map<string, {
      projectId: string;
      hours: number;
      billableHours: number;
      revenue: number;
    }>();

    weekEntries.forEach(entry => {
      const existing = projectMap.get(entry.projectId) || {
        projectId: entry.projectId,
        hours: 0,
        billableHours: 0,
        revenue: 0,
      };

      existing.hours += entry.duration / 60;
      if (entry.billable) {
        existing.billableHours += entry.duration / 60;
        existing.revenue += (entry.duration / 60) * (entry.hourlyRate || 0);
      }

      projectMap.set(entry.projectId, existing);
    });

    // Get project and company names (would need to access other services)
    const projectBreakdown = Array.from(projectMap.values()).map(item => ({
      ...item,
      projectTitle: `Project ${item.projectId}`, // Placeholder
      companyName: 'Unknown Company', // Placeholder
      revenue: item.revenue,
    }));

    return {
      weekStart,
      weekEnd,
      totalHours,
      billableHours,
      totalRevenue,
      entries: weekEntries,
      projectBreakdown,
    };
  }

  getProjectStats(projectId: string): ProjectTimeStats {
    const entries = this.findByProject(projectId);
    
    const totalTrackedHours = entries.reduce((sum, entry) => sum + (entry.duration / 60), 0);
    const totalBillableHours = entries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + (entry.duration / 60), 0);
    
    const totalRevenue = entries
      .filter(entry => entry.billable && entry.hourlyRate)
      .reduce((sum, entry) => sum + ((entry.duration / 60) * (entry.hourlyRate || 0)), 0);

    const budgetedHours = 160; // Placeholder - would come from project budget
    const remainingHours = Math.max(0, budgetedHours - totalTrackedHours);
    const hoursUtilization = budgetedHours > 0 ? (totalTrackedHours / budgetedHours) * 100 : 0;
    
    const billableEntries = entries.filter(entry => entry.billable && entry.hourlyRate);
    const averageHourlyRate = billableEntries.length > 0 ?
      billableEntries.reduce((sum, entry) => sum + (entry.hourlyRate || 0), 0) / billableEntries.length : 0;

    const lastActivity = entries.length > 0 ?
      new Date(Math.max(...entries.map(entry => entry.updatedAt.getTime()))) :
      new Date();

    return {
      projectId,
      totalTrackedHours,
      totalBillableHours,
      totalRevenue,
      budgetedHours,
      remainingHours,
      hoursUtilization,
      averageHourlyRate,
      lastActivity,
    };
  }

  getDailyEntries(date: Date): DailyTimeEntry {
    const entries = this.findByDate(date);
    const totalHours = entries.reduce((sum, entry) => sum + (entry.duration / 60), 0);
    const billableHours = entries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + (entry.duration / 60), 0);

    return {
      date,
      totalHours,
      billableHours,
      entries,
    };
  }

  // Utility functions
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }

  // Get current week start (Monday)
  getCurrentWeekStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
}

export const browserTimeTrackingService = new TimeTrackingService();