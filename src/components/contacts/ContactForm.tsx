import { useState } from 'react';
import type { Contact, ContactFormData } from '../../types/crm';
import { useCrmStore } from '../../stores/crmStoreDb';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (data: ContactFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  preselectedCompanyId?: string;
}

const ContactForm = ({ 
  contact, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  preselectedCompanyId
}: ContactFormProps) => {
  const { companies } = useCrmStore();

  const [formData, setFormData] = useState<ContactFormData>({
    companyId: contact?.companyId || preselectedCompanyId || '',
    firstName: contact?.firstName || '',
    lastName: contact?.lastName || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    jobTitle: contact?.jobTitle || '',
    department: contact?.department || '',
    isPrimary: contact?.isPrimary || false,
    notes: contact?.notes || '',
    status: contact?.status || 'active',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ContactFormData, string>> = {};

    if (!formData.companyId) {
      newErrors.companyId = 'Company is required';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
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

  const updateField = <K extends keyof ContactFormData>(
    field: K,
    value: ContactFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const companyOptions = companies.map(company => ({
    value: company.id,
    label: company.name
  }));

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const departmentOptions = [
    { value: 'executive', label: 'Executive' },
    { value: 'sales', label: 'Sales' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'technology', label: 'Technology' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'operations', label: 'Operations' },
    { value: 'support', label: 'Customer Support' },
    { value: 'other', label: 'Other' },
  ];

  const selectedCompany = companies.find(c => c.id === formData.companyId);

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
          </div>
        )}
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={formData.firstName}
          onChange={(value) => updateField('firstName', value)}
          placeholder="John"
          required
          error={errors.firstName}
        />
        
        <Input
          label="Last Name"
          value={formData.lastName}
          onChange={(value) => updateField('lastName', value)}
          placeholder="Doe"
          required
          error={errors.lastName}
        />
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(value) => updateField('email', value)}
          placeholder="john.doe@company.com"
          required
          error={errors.email}
        />
        
        <Input
          label="Phone"
          type="tel"
          value={formData.phone}
          onChange={(value) => updateField('phone', value)}
          placeholder="+1 (555) 123-4567"
          required
          error={errors.phone}
        />
      </div>

      {/* Professional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Job Title"
          value={formData.jobTitle || ''}
          onChange={(value) => updateField('jobTitle', value)}
          placeholder="e.g., Marketing Director"
        />
        
        <Select
          label="Department"
          value={formData.department || ''}
          onChange={(value) => updateField('department', value)}
          options={departmentOptions}
          placeholder="Select department"
        />
      </div>

      {/* Status and Primary Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Status"
          value={formData.status}
          onChange={(value) => updateField('status', value as ContactFormData['status'])}
          options={statusOptions}
          required
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Contact Type
          </label>
          <div className="flex items-center space-x-3 pt-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPrimary}
                onChange={(e) => updateField('isPrimary', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Primary Contact</span>
            </label>
          </div>
          <p className="text-xs text-gray-500">
            Primary contacts are the main point of contact for their company
          </p>
        </div>
      </div>

      <Textarea
        label="Notes"
        value={formData.notes || ''}
        onChange={(value) => updateField('notes', value)}
        placeholder="Additional notes about this contact..."
        rows={3}
      />

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
        </Button>
      </div>
    </form>
  );
};

export default ContactForm;