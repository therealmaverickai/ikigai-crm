import { useState } from 'react';
import type { Company, CompanyFormData } from '../../types/crm';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';

interface CompanyFormProps {
  company?: Company;
  onSubmit: (data: CompanyFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CompanyForm = ({ company, onSubmit, onCancel, isLoading = false }: CompanyFormProps) => {
  const [formData, setFormData] = useState<CompanyFormData>({
    name: company?.name || '',
    email: company?.email || '',
    phone: company?.phone || '',
    website: company?.website || '',
    address: company?.address || '',
    city: company?.city || '',
    state: company?.state || '',
    zipCode: company?.zipCode || '',
    country: company?.country || '',
    industry: company?.industry || '',
    size: company?.size || undefined,
    notes: company?.notes || '',
    status: company?.status || 'prospect',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CompanyFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }

    // Only validate email format if email is provided
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
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

  const updateField = <K extends keyof CompanyFormData>(
    field: K,
    value: CompanyFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const industryOptions = [
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'education', label: 'Education' },
    { value: 'retail', label: 'Retail' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'other', label: 'Other' },
  ];

  const sizeOptions = [
    { value: 'startup', label: 'Startup (1-10)' },
    { value: 'small', label: 'Small (11-50)' },
    { value: 'medium', label: 'Medium (51-200)' },
    { value: 'large', label: 'Large (201-1000)' },
    { value: 'enterprise', label: 'Enterprise (1000+)' },
  ];

  const statusOptions = [
    { value: 'prospect', label: 'Prospect' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Company Name"
          value={formData.name}
          onChange={(value) => updateField('name', value)}
          placeholder="Enter company name"
          required
          error={errors.name}
        />
        
        <Select
          label="Status"
          value={formData.status}
          onChange={(value) => updateField('status', value as CompanyFormData['status'])}
          options={statusOptions}
        />
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(value) => updateField('email', value)}
          placeholder="company@example.com"
          error={errors.email}
        />
        
        <Input
          label="Phone"
          type="tel"
          value={formData.phone}
          onChange={(value) => updateField('phone', value)}
          placeholder="+1 (555) 123-4567"
          error={errors.phone}
        />
      </div>

      <Input
        label="Website"
        type="url"
        value={formData.website || ''}
        onChange={(value) => updateField('website', value)}
        placeholder="https://company.com"
      />

      {/* Address Information */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-800">Address Information</h4>
        
        <Input
          label="Address"
          value={formData.address || ''}
          onChange={(value) => updateField('address', value)}
          placeholder="123 Business Street"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="City"
            value={formData.city || ''}
            onChange={(value) => updateField('city', value)}
            placeholder="New York"
          />
          
          <Input
            label="State/Province"
            value={formData.state || ''}
            onChange={(value) => updateField('state', value)}
            placeholder="NY"
          />
          
          <Input
            label="ZIP/Postal Code"
            value={formData.zipCode || ''}
            onChange={(value) => updateField('zipCode', value)}
            placeholder="10001"
          />
        </div>
        
        <Input
          label="Country"
          value={formData.country || ''}
          onChange={(value) => updateField('country', value)}
          placeholder="United States"
        />
      </div>

      {/* Company Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Industry"
          value={formData.industry || ''}
          onChange={(value) => updateField('industry', value)}
          options={industryOptions}
          placeholder="Select industry"
        />
        
        <Select
          label="Company Size"
          value={formData.size || ''}
          onChange={(value) => updateField('size', value as CompanyFormData['size'])}
          options={sizeOptions}
          placeholder="Select company size"
        />
      </div>

      <Textarea
        label="Notes"
        value={formData.notes}
        onChange={(value) => updateField('notes', value)}
        placeholder="Additional notes about this company..."
        rows={4}
      />

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : company ? 'Update Company' : 'Create Company'}
        </Button>
      </div>
    </form>
  );
};

export default CompanyForm;