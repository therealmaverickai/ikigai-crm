import { useState } from 'react';
import type { Company, CompanyFilters } from '../../types/crm';
import { useCrmStore } from '../../stores/crmStoreDb';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface CompanyListProps {
  onAddCompany: () => void;
  onEditCompany: (company: Company) => void;
  onViewCompany: (company: Company) => void;
}

const CompanyList = ({ onAddCompany, onEditCompany, onViewCompany }: CompanyListProps) => {
  const { getFilteredCompanies, deleteCompany, getContactsByCompany } = useCrmStore();
  
  const [filters, setFilters] = useState<CompanyFilters>({
    search: '',
    status: undefined,
    industry: undefined,
    size: undefined,
  });

  const companies = getFilteredCompanies(filters);

  const handleDeleteCompany = (company: Company) => {
    if (window.confirm(`Are you sure you want to delete ${company.name}? This will also delete all associated contacts.`)) {
      deleteCompany(company.id);
    }
  };

  const getStatusBadgeColor = (status: Company['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      case 'prospect':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getSizeBadgeColor = (size: Company['size']) => {
    switch (size) {
      case 'startup':
        return 'bg-purple-100 text-purple-700';
      case 'small':
        return 'bg-blue-100 text-blue-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'large':
        return 'bg-orange-100 text-orange-700';
      case 'enterprise':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'prospect', label: 'Prospect' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const industryOptions = [
    { value: '', label: 'All Industries' },
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
    { value: '', label: 'All Sizes' },
    { value: 'startup', label: 'Startup (1-10)' },
    { value: 'small', label: 'Small (11-50)' },
    { value: 'medium', label: 'Medium (51-200)' },
    { value: 'large', label: 'Large (201-1000)' },
    { value: 'enterprise', label: 'Enterprise (1000+)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Companies</h1>
          <p className="text-gray-500 mt-1">Manage your company database</p>
        </div>
        <Button onClick={onAddCompany}>+ Add Company</Button>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search companies..."
            value={filters.search || ''}
            onChange={(value) => setFilters({ ...filters, search: value })}
          />
          
          <Select
            value={filters.status || ''}
            onChange={(value) => setFilters({ ...filters, status: value as Company['status'] || undefined })}
            options={statusOptions}
          />
          
          <Select
            value={filters.industry || ''}
            onChange={(value) => setFilters({ ...filters, industry: value || undefined })}
            options={industryOptions}
          />
          
          <Select
            value={filters.size || ''}
            onChange={(value) => setFilters({ ...filters, size: value as Company['size'] || undefined })}
            options={sizeOptions}
          />
        </div>
      </Card>

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No companies found</h3>
          <p className="text-gray-400 mb-4">
            {filters.search || filters.status || filters.industry || filters.size
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by adding your first company.'}
          </p>
          <Button onClick={onAddCompany}>+ Add Your First Company</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => {
            const contactCount = getContactsByCompany(company.id).length;
            
            return (
              <Card key={company.id} hover className="relative">
                <div className="space-y-4">
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        {company.name}
                      </h3>
                      <div className="flex space-x-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(company.status)}`}>
                          {company.status}
                        </span>
                      </div>
                    </div>
                    
                    {company.industry && (
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-gray-500">{company.industry}</span>
                        {company.size && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getSizeBadgeColor(company.size)}`}>
                              {company.size}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4 text-gray-400">📧</span>
                      <span className="ml-2 truncate">{company.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4 text-gray-400">📞</span>
                      <span className="ml-2">{company.phone}</span>
                    </div>
                    {company.website && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-4 text-gray-400">🌐</span>
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-primary-600 hover:text-primary-700 truncate"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                      {contactCount} contact{contactCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewCompany(company)}
                      className="text-xs"
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditCompany(company)}
                      className="text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCompany(company)}
                      className="text-xs text-error hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompanyList;