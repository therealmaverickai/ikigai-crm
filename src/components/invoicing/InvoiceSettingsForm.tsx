import { useState } from 'react';
import type { InvoiceSettingsFormData, InvoiceReminderSettings } from '../../types/crm';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface InvoiceSettingsFormProps {
  initialSettings?: InvoiceSettingsFormData;
  onSubmit: (settings: InvoiceSettingsFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const InvoiceSettingsForm = ({ 
  initialSettings, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: InvoiceSettingsFormProps) => {
  const [settings, setSettings] = useState<InvoiceSettingsFormData>(
    initialSettings || {
      invoiceOn: 'project-completion',
      paymentTermsDays: 30,
      autoGenerateInvoice: true,
      reminderSettings: {
        enabled: true,
        reminderDays: [7, 3, 1],
        overdueReminderDays: [1, 7, 14, 30],
        reminderMethod: 'telegram',
        escalationEnabled: false,
        escalationDays: 30
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(settings);
  };

  const handleReminderSettingsChange = (updates: Partial<InvoiceReminderSettings>) => {
    setSettings(prev => ({
      ...prev,
      reminderSettings: {
        ...prev.reminderSettings,
        ...updates
      }
    }));
  };

  const invoiceOnOptions = [
    { value: 'project-start', label: 'Project Start' },
    { value: 'project-milestone', label: 'Project Milestones' },
    { value: 'project-completion', label: 'Project Completion' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'custom-date', label: 'Custom Date' },
  ];

  const frequencyOptions = [
    { value: 'once', label: 'One-time' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
  ];

  const reminderMethodOptions = [
    { value: 'email', label: 'Email Only' },
    { value: 'telegram', label: 'Telegram Only' },
    { value: 'both', label: 'Email + Telegram' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📄 Invoice Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Invoice When"
            value={settings.invoiceOn}
            onChange={(value) => setSettings({ ...settings, invoiceOn: value as any })}
            options={invoiceOnOptions}
            required
          />
          
          <Input
            label="Payment Terms (Days)"
            type="number"
            value={settings.paymentTermsDays.toString()}
            onChange={(value) => setSettings({ ...settings, paymentTermsDays: parseInt(value) || 30 })}
            placeholder="30"
            required
            min="1"
            max="365"
          />
          
          {(settings.invoiceOn === 'monthly' || settings.invoiceOn === 'project-milestone') && (
            <Select
              label="Invoice Frequency"
              value={settings.invoiceFrequency || 'monthly'}
              onChange={(value) => setSettings({ ...settings, invoiceFrequency: value as any })}
              options={frequencyOptions}
            />
          )}
          
          <Input
            label="Late Fee Percentage (%)"
            type="number"
            value={settings.lateFeePercentage?.toString() || ''}
            onChange={(value) => setSettings({ ...settings, lateFeePercentage: parseFloat(value) || undefined })}
            placeholder="0"
            min="0"
            max="50"
            step="0.1"
          />
        </div>
        
        <div className="mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.autoGenerateInvoice}
              onChange={(e) => setSettings({ ...settings, autoGenerateInvoice: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Auto-generate invoices based on trigger
            </span>
          </label>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🔔 Reminder Settings</h3>
        
        <div className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.reminderSettings.enabled}
              onChange={(e) => handleReminderSettingsChange({ enabled: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Enable automatic payment reminders
            </span>
          </label>
          
          {settings.reminderSettings.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reminder Days (Before Due Date)
                </label>
                <div className="space-y-2">
                  {[1, 3, 7, 14].map(days => (
                    <label key={days} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.reminderSettings.reminderDays.includes(days)}
                        onChange={(e) => {
                          const current = settings.reminderSettings.reminderDays;
                          if (e.target.checked) {
                            handleReminderSettingsChange({ 
                              reminderDays: [...current, days].sort((a, b) => b - a) 
                            });
                          } else {
                            handleReminderSettingsChange({ 
                              reminderDays: current.filter(d => d !== days) 
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-600">{days} day{days > 1 ? 's' : ''} before</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overdue Reminders (After Due Date)
                </label>
                <div className="space-y-2">
                  {[1, 7, 14, 30].map(days => (
                    <label key={days} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.reminderSettings.overdueReminderDays.includes(days)}
                        onChange={(e) => {
                          const current = settings.reminderSettings.overdueReminderDays;
                          if (e.target.checked) {
                            handleReminderSettingsChange({ 
                              overdueReminderDays: [...current, days].sort((a, b) => a - b) 
                            });
                          } else {
                            handleReminderSettingsChange({ 
                              overdueReminderDays: current.filter(d => d !== days) 
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-600">{days} day{days > 1 ? 's' : ''} overdue</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <Select
                label="Reminder Method"
                value={settings.reminderSettings.reminderMethod}
                onChange={(value) => handleReminderSettingsChange({ reminderMethod: value as any })}
                options={reminderMethodOptions}
              />
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.reminderSettings.escalationEnabled}
                    onChange={(e) => handleReminderSettingsChange({ escalationEnabled: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable escalation
                  </span>
                </label>
                
                {settings.reminderSettings.escalationEnabled && (
                  <Input
                    label="Escalation After (Days)"
                    type="number"
                    value={settings.reminderSettings.escalationDays.toString()}
                    onChange={(value) => handleReminderSettingsChange({ escalationDays: parseInt(value) || 30 })}
                    placeholder="30"
                    min="1"
                    max="365"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Invoice Settings'}
        </Button>
      </div>
    </form>
  );
};

export default InvoiceSettingsForm;