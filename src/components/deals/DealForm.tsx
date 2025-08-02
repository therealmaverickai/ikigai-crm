import { useState } from 'react';
import type { Deal, DealFormData } from '../../types/crm';
import { useCrmStore } from '../../stores/crmStoreDb';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';

interface DealFormProps {
  deal?: Deal;
  onSubmit: (data: DealFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  preselectedCompanyId?: string;
}

const DealForm = ({ 
  deal, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  preselectedCompanyId
}: DealFormProps) => {
  const { companies } = useCrmStore();

  const [formData, setFormData] = useState<DealFormData>({
    companyId: deal?.companyId || preselectedCompanyId || '',
    title: deal?.title || '',
    description: deal?.description || '',
    value: deal?.value || 0,
    currency: deal?.currency || 'USD',
    probability: deal?.probability || 50,
    stage: deal?.stage || 'prospecting',
    priority: deal?.priority || 'medium',
    source: deal?.source || 'website',
    expectedCloseDate: deal?.expectedCloseDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    valueSource: deal?.valueSource || 'manual',
    tags: deal?.tags || [],
    notes: deal?.notes || '',
    status: deal?.status || 'active',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof DealFormData, string>>>({});
  const [tagInput, setTagInput] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof DealFormData, string>> = {};

    if (!formData.companyId) {
      newErrors.companyId = 'Company is required';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Deal title is required';
    }

    if (formData.value <= 0) {
      newErrors.value = 'Deal value must be greater than 0';
    }

    if (formData.probability < 0 || formData.probability > 100) {
      newErrors.probability = 'Probability must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const updateField = <K extends keyof DealFormData>(
    field: K,
    value: DealFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
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


  const companyOptions = companies.map(company => ({
    value: company.id,
    label: company.name
  }));

  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' },
  ];

  const stageOptions = [
    { value: 'prospecting', label: 'Prospecting' },
    { value: 'qualification', label: 'Qualification' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'closed-won', label: 'Closed Won' },
    { value: 'closed-lost', label: 'Closed Lost' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const sourceOptions = [
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Referral' },
    { value: 'cold-call', label: 'Cold Call' },
    { value: 'email', label: 'Email Campaign' },
    { value: 'social-media', label: 'Social Media' },
    { value: 'event', label: 'Event/Conference' },
    { value: 'other', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
    { value: 'on-hold', label: 'On Hold' },
  ];

  const selectedCompany = companies.find(c => c.id === formData.companyId);
  const expectedRevenue = Math.round(formData.value * (formData.probability / 100));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Selection */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <Select
          label="Company"
          value={formData.companyId}
          onChange={(value) => updateField('companyId', value)}
          options={companyOptions}
          placeholder="Select a company"
          required
          error={errors.companyId}
        />
        {selectedCompany && (
          <div className="mt-2 text-sm text-gray-600">
            <p>{selectedCompany.email} • {selectedCompany.phone}</p>
            {selectedCompany.industry && (
              <p>Industry: {selectedCompany.industry}</p>
            )}
          </div>
        )}
      </div>

      {/* Basic Deal Information */}
      <div className="space-y-4">
        <Input
          label="Deal Title"
          value={formData.title}
          onChange={(value) => updateField('title', value)}
          placeholder="e.g., Enterprise Software License"
          required
          error={errors.title}
        />
        
        <Textarea
          label="Description"
          value={formData.description || ''}
          onChange={(value) => updateField('description', value)}
          placeholder="Describe the deal details..."
          rows={3}
        />
      </div>

      {/* Financial Information */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-800">Financial Details</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Deal Value <span className="text-error">*</span>
              </label>
            </div>
            <div className="flex">
              <Select
                value={formData.currency}
                onChange={(value) => updateField('currency', value as DealFormData['currency'])}
                options={currencyOptions}
                className="w-24 mr-2"
              />
              <Input
                type="number"
                value={formData.value.toString()}
                onChange={(value) => updateField('value', parseFloat(value) || 0)}
                placeholder="0"
                required
                error={errors.value}
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Probability (%) <span className="text-error">*</span>
            </label>
            <Input
              type="number"
              value={formData.probability.toString()}
              onChange={(value) => updateField('probability', parseInt(value) || 0)}
              placeholder="50"
              min="0"
              max="100"
              required
              error={errors.probability}
            />
            <p className="text-xs text-gray-500">
              Expected revenue: {formData.currency} {expectedRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Deal Stage and Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Deal Stage"
          value={formData.stage}
          onChange={(value) => updateField('stage', value as DealFormData['stage'])}
          options={stageOptions}
          required
        />
        
        <Select
          label="Priority"
          value={formData.priority}
          onChange={(value) => updateField('priority', value as DealFormData['priority'])}
          options={priorityOptions}
          required
        />
      </div>

      {/* Source and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Lead Source"
          value={formData.source}
          onChange={(value) => updateField('source', value as DealFormData['source'])}
          options={sourceOptions}
          required
        />
        
        <Select
          label="Status"
          value={formData.status}
          onChange={(value) => updateField('status', value as DealFormData['status'])}
          options={statusOptions}
          required
        />
      </div>

      {/* Expected Close Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Expected Close Date <span className="text-error">*</span>
        </label>
        <input
          type="date"
          value={formData.expectedCloseDate.toISOString().split('T')[0]}
          onChange={(e) => updateField('expectedCloseDate', new Date(e.target.value))}
          required
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

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

      <Textarea
        label="Notes"
        value={formData.notes}
        onChange={(value) => updateField('notes', value)}
        placeholder="Additional notes about this deal..."
        rows={4}
      />

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : deal ? 'Update Deal' : 'Create Deal'}
        </Button>
      </div>
    </form>
  );
};

export default DealForm;