import { useState, useEffect } from 'react';
import { useCrmStore } from '../../stores/crmStoreDb';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import type { TimeEntry, TimeEntryFormData } from '../../types/crm';

interface TimeEntryFormProps {
  entry?: TimeEntry;
  onSuccess: () => void;
  onCancel: () => void;
  preselectedProjectId?: string;
}

const TimeEntryForm = ({ entry, onSuccess, onCancel, preselectedProjectId }: TimeEntryFormProps) => {
  const { 
    projects, 
    companies,
    addTimeEntry,
    updateTimeEntry,
    formatDuration
  } = useCrmStore();

  const [formData, setFormData] = useState<TimeEntryFormData>({
    projectId: entry?.projectId || preselectedProjectId || '',
    resourceName: entry?.resourceName || '',
    description: entry?.description || '',
    startTime: entry?.startTime || new Date(),
    endTime: entry?.endTime || new Date(),
    duration: entry?.duration,
    date: entry?.date || new Date(),
    tags: entry?.tags || [],
    billable: entry?.billable ?? true,
    hourlyRate: entry?.hourlyRate,
    currency: entry?.currency || 'USD',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TimeEntryFormData, string>>>({});
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useEndTime, setUseEndTime] = useState(!!entry?.endTime);

  // Calculate duration when start/end times change
  useEffect(() => {
    if (useEndTime && formData.startTime && formData.endTime) {
      const duration = Math.round((formData.endTime.getTime() - formData.startTime.getTime()) / (1000 * 60));
      if (duration > 0) {
        setFormData(prev => ({ ...prev, duration }));
      }
    }
  }, [formData.startTime, formData.endTime, useEndTime]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TimeEntryFormData, string>> = {};

    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }

    // Check if project has resources and require resource selection
    const selectedProject = projects.find(p => p.id === formData.projectId);
    const availableResources = selectedProject?.budget.resources || [];
    
    if (availableResources.length > 0 && !formData.resourceName) {
      newErrors.resourceName = 'Resource selection is required for cost calculation';
    }

    if (availableResources.length === 0) {
      newErrors.projectId = 'Selected project must have resources in budget to track time';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (useEndTime) {
      if (!formData.endTime) {
        newErrors.endTime = 'End time is required when using time range';
      } else if (formData.endTime <= formData.startTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    } else {
      if (!formData.duration || formData.duration <= 0) {
        newErrors.duration = 'Duration must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Ensure billable status and rate are set based on resource
      const resource = availableResources.find(r => r.name === formData.resourceName);
      
      const submitData = {
        ...formData,
        endTime: useEndTime ? formData.endTime : undefined,
        duration: useEndTime ? undefined : formData.duration,
        billable: !!resource, // Always billable if resource is selected
        hourlyRate: resource ? resource.hourlyRate : undefined,
        currency: resource ? resource.currency : formData.currency,
      };

      if (entry) {
        await updateTimeEntry(entry.id, submitData);
      } else {
        await addTimeEntry(submitData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Failed to save time entry:', error);
      alert('Failed to save time entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = <K extends keyof TimeEntryFormData>(
    field: K,
    value: TimeEntryFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateField('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateField('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const projectOptions = projects.map(project => {
    const company = companies.find(c => c.id === project.companyId);
    return {
      value: project.id,
      label: `${project.title} (${company?.name || 'Unknown Company'})`
    };
  });

  const selectedProject = projects.find(p => p.id === formData.projectId);
  const selectedCompany = selectedProject ? 
    companies.find(c => c.id === selectedProject.companyId) : null;

  // Get available resources from selected project
  const availableResources = selectedProject?.budget.resources || [];
  const selectedResource = availableResources.find(r => r.name === formData.resourceName);

  // Auto-inherit hourly rate when resource is selected
  const handleResourceSelection = (resourceName: string) => {
    const resource = availableResources.find(r => r.name === resourceName);
    if (resource) {
      setFormData(prev => ({
        ...prev,
        resourceName,
        hourlyRate: resource.hourlyRate,
        currency: resource.currency,
        billable: true // All resource-based time entries are billable
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        resourceName,
        hourlyRate: undefined,
        billable: false
      }));
    }
  };

  // Format duration for display
  const durationDisplay = formData.duration ? formatDuration(formData.duration) : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Selection */}
      <div>
        <Select
          label="Project"
          value={formData.projectId}
          onChange={(value) => updateField('projectId', value)}
          options={[{ value: '', label: 'Select a project...' }, ...projectOptions]}
          required
          error={errors.projectId}
        />
        
        {selectedProject && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="font-medium text-gray-800">{selectedProject.title}</div>
            <div className="text-gray-600">{selectedCompany?.name}</div>
            <div className="text-gray-500 mt-1">
              Status: <span className="capitalize">{selectedProject.status}</span> • 
              Progress: {selectedProject.progressPercentage}%
            </div>
          </div>
        )}
      </div>

      {/* Resource Selection - Now Required */}
      {selectedProject && availableResources.length > 0 && (
        <div>
          <Select
            label="Resource"
            value={formData.resourceName || ''}
            onChange={handleResourceSelection}
            options={[
              { value: '', label: 'Select a resource...' },
              ...availableResources.map(resource => ({
                value: resource.name,
                label: `${resource.name} (${resource.role}) - ${resource.rateType === 'daily' ? `$${resource.dailyRate}/day` : `$${resource.hourlyRate}/hr`}`
              }))
            ]}
            required
            error={errors.resourceName}
          />
          
          {selectedResource && (
            <div className="mt-2 p-3 bg-green-50 rounded-lg text-sm">
              <div className="font-medium text-green-800">{selectedResource.name}</div>
              <div className="text-green-700">
                {selectedResource.role} • 
                {selectedResource.rateType === 'daily' 
                  ? `$${selectedResource.dailyRate}/day ($${selectedResource.hourlyRate}/hr)`
                  : `$${selectedResource.hourlyRate}/hr`
                }
              </div>
              <div className="text-green-600 mt-1">
                Costs will be calculated automatically based on resource rate
              </div>
            </div>
          )}
        </div>
      )}

      {selectedProject && availableResources.length === 0 && (
        <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
          <div className="font-medium">⚠️ No resources found in project budget</div>
          <div>You need to add resources to the project budget before tracking time. Time entries require resource selection for cost calculation.</div>
        </div>
      )}

      {/* Description */}
      <Textarea
        label="Description"
        value={formData.description}
        onChange={(value) => updateField('description', value)}
        placeholder="What were you working on?"
        rows={3}
        required
        error={errors.description}
      />

      {/* Date */}
      <Input
        label="Date"
        type="date"
        value={formData.date.toISOString().split('T')[0]}
        onChange={(value) => updateField('date', new Date(value))}
        required
      />

      {/* Time Input Method */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              checked={useEndTime}
              onChange={() => setUseEndTime(true)}
              className="text-primary-600"
            />
            <span className="text-sm font-medium text-gray-700">Time Range</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              checked={!useEndTime}
              onChange={() => setUseEndTime(false)}
              className="text-primary-600"
            />
            <span className="text-sm font-medium text-gray-700">Duration</span>
          </label>
        </div>

        {useEndTime ? (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="datetime-local"
              value={formData.startTime.toISOString().slice(0, 16)}
              onChange={(value) => updateField('startTime', new Date(value))}
              required
              error={errors.startTime}
            />
            <Input
              label="End Time"
              type="datetime-local"
              value={formData.endTime?.toISOString().slice(0, 16) || ''}
              onChange={(value) => updateField('endTime', value ? new Date(value) : undefined)}
              required
              error={errors.endTime}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="datetime-local"
              value={formData.startTime.toISOString().slice(0, 16)}
              onChange={(value) => updateField('startTime', new Date(value))}
              required
              error={errors.startTime}
            />
            <div>
              <Input
                label="Duration (minutes)"
                type="number"
                value={formData.duration?.toString() || ''}
                onChange={(value) => updateField('duration', value ? parseInt(value) : undefined)}
                min="1"
                placeholder="60"
                required
                error={errors.duration}
              />
              {formData.duration && (
                <div className="text-xs text-gray-500 mt-1">
                  {durationDisplay}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Duration display for time range */}
        {useEndTime && formData.duration && (
          <div className="text-sm text-gray-600">
            Duration: {durationDisplay}
          </div>
        )}
      </div>

      {/* Automatic Cost Calculation */}
      {selectedResource && formData.duration && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            <div className="font-medium text-blue-900 mb-2">💰 Automatic Cost Calculation</div>
            <div className="space-y-1">
              <div>
                <span className="font-medium">Resource:</span> {selectedResource.name} ({selectedResource.role})
              </div>
              <div>
                <span className="font-medium">Time:</span> {(formData.duration / 60).toFixed(2)} hours
              </div>
              <div>
                <span className="font-medium">Rate:</span> ${selectedResource.hourlyRate}/hour 
                {selectedResource.rateType === 'daily' && (
                  <span className="text-blue-600"> (${selectedResource.dailyRate}/day)</span>
                )}
              </div>
              <div className="border-t border-blue-300 pt-2 mt-2">
                <span className="font-medium text-blue-900">Total Cost:</span> 
                <span className="font-bold text-lg ml-2 text-blue-900">
                  ${((formData.duration / 60) * selectedResource.hourlyRate).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedResource && selectedProject && availableResources.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 text-center">
          Select a resource above to see automatic cost calculation
        </div>
      )}

      {/* Tags */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 text-primary-500 hover:text-primary-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a tag..."
            className="block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-primary-600 text-white rounded-r-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Add
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button 
          variant="ghost" 
          onClick={onCancel} 
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : entry ? 'Update Entry' : 'Add Entry'}
        </Button>
      </div>
    </form>
  );
};

export default TimeEntryForm;