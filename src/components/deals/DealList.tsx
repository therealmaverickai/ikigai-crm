import { useState } from 'react';
import type { Deal, DealFilters } from '../../types/crm';
import { useCrmStore } from '../../stores/crmStoreDb';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import ProjectForm from '../projects/ProjectForm';

interface DealListProps {
  onAddDeal: () => void;
  onEditDeal: (deal: Deal) => void;
  onViewDeal: (deal: Deal) => void;
}

const DealList = ({ onAddDeal, onEditDeal, onViewDeal }: DealListProps) => {
  const { getFilteredDeals, deleteDeal, companies, getCompanyById } = useCrmStore();
  
  const [filters, setFilters] = useState<DealFilters>({
    search: '',
    companyId: undefined,
    stage: undefined,
    priority: undefined,
    status: undefined,
  });

  const [viewMode, setViewMode] = useState<'cards' | 'converted'>('cards');
  const [convertingDealId, setConvertingDealId] = useState<string | null>(null);

  const allDeals = getFilteredDeals(filters);
  
  // Filter deals based on view mode
  const deals = viewMode === 'converted' 
    ? allDeals.filter(deal => deal.convertedToProject)
    : allDeals.filter(deal => !deal.convertedToProject);


  const handleDeleteDeal = async (deal: Deal) => {
    const company = getCompanyById(deal.companyId);
    const companyName = company ? ` from ${company.name}` : '';
    
    if (window.confirm(`Are you sure you want to delete "${deal.title}"${companyName}?`)) {
      try {
        await deleteDeal(deal.id);
      } catch (error) {
        console.error('Failed to delete deal:', error);
        alert('Failed to delete deal. Please try again.');
      }
    }
  };

  const getStageColor = (stage: Deal['stage']) => {
    switch (stage) {
      case 'prospecting':
        return 'bg-gray-100 text-gray-700';
      case 'qualification':
        return 'bg-blue-100 text-blue-700';
      case 'proposal':
        return 'bg-yellow-100 text-yellow-700';
      case 'negotiation':
        return 'bg-orange-100 text-orange-700';
      case 'closed-won':
        return 'bg-green-100 text-green-700';
      case 'closed-lost':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: Deal['priority']) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-700';
      case 'medium':
        return 'bg-blue-100 text-blue-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'critical':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stageOptions = [
    { value: '', label: 'All Stages' },
    { value: 'prospecting', label: 'Prospecting' },
    { value: 'qualification', label: 'Qualification' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'closed-won', label: 'Closed Won' },
    { value: 'closed-lost', label: 'Closed Lost' },
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
    { value: 'on-hold', label: 'On Hold' },
  ];

  const companyOptions = [
    { value: '', label: 'All Companies' },
    ...companies.map(company => ({
      value: company.id,
      label: company.name
    }))
  ];


  const totalPipelineValue = allDeals
    .filter(deal => !['closed-won', 'closed-lost'].includes(deal.stage))
    .reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);

  const totalWonValue = allDeals
    .filter(deal => deal.stage === 'closed-won')
    .reduce((sum, deal) => sum + deal.value, 0);
    
  const convertedDealsCount = allDeals.filter(d => d.convertedToProject).length;
  const totalConvertedValue = allDeals
    .filter(deal => deal.convertedToProject)
    .reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Deals</h1>
          <p className="text-gray-500 mt-1">Manage your sales pipeline</p>
        </div>
        <div className="flex space-x-3">
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === 'cards'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('converted')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === 'converted'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Converted
            </button>
          </div>
          <Button onClick={onAddDeal}>+ Add Deal</Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input
            placeholder="Search deals..."
            value={filters.search || ''}
            onChange={(value) => setFilters({ ...filters, search: value })}
          />
          
          <Select
            value={filters.companyId || ''}
            onChange={(value) => setFilters({ ...filters, companyId: value || undefined })}
            options={companyOptions}
          />
          
          <Select
            value={filters.stage || ''}
            onChange={(value) => setFilters({ ...filters, stage: value as Deal['stage'] || undefined })}
            options={stageOptions}
          />
          
          <Select
            value={filters.priority || ''}
            onChange={(value) => setFilters({ ...filters, priority: value as Deal['priority'] || undefined })}
            options={priorityOptions}
          />
          
          <Select
            value={filters.status || ''}
            onChange={(value) => setFilters({ ...filters, status: value as Deal['status'] || undefined })}
            options={statusOptions}
          />
        </div>
      </Card>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {viewMode === 'converted' ? convertedDealsCount : deals.length}
            </div>
            <div className="text-sm text-gray-500">
              {viewMode === 'converted' ? 'Converted Deals' : 'Total Deals'}
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${Math.round(viewMode === 'converted' ? totalConvertedValue : totalPipelineValue).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              {viewMode === 'converted' ? 'Converted Value' : 'Pipeline Value'}
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${Math.round(totalWonValue).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Won Deals</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {allDeals.filter(d => d.status === 'active').length}
            </div>
            <div className="text-sm text-gray-500">Active Deals</div>
          </div>
        </Card>
      </div>

      {/* Content - Cards View */}
      {deals.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {viewMode === 'converted' ? 'No converted deals found' : 'No deals found'}
            </h3>
            <p className="text-gray-400 mb-4">
              {viewMode === 'converted' 
                ? 'Convert some closed-won deals to projects to see them here.'
                : Object.values(filters).some(f => f) 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by adding your first deal.'}
            </p>
            {viewMode !== 'converted' && (
              <Button onClick={onAddDeal}>+ Add Your First Deal</Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => {
              const company = getCompanyById(deal.companyId);
              const expectedRevenue = Math.round(deal.value * (deal.probability / 100));
              
              return (
                <Card key={deal.id} hover className="relative">
                  <div className="space-y-4">
                    {/* Header */}
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800 truncate">
                          {deal.title}
                        </h3>
                        <div className="flex flex-col space-y-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStageColor(deal.stage)}`}>
                            {deal.stage.replace('-', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(deal.priority)}`}>
                            {deal.priority}
                          </span>
                          {deal.convertedToProject && (
                            <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                              → Project
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {company && (
                        <p className="text-sm font-medium text-primary-600 mb-1">
                          {company.name}
                        </p>
                      )}
                      
                      {deal.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {deal.description}
                        </p>
                      )}
                    </div>

                    {/* Financial Info */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Deal Value:</span>
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(deal.value, deal.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Probability:</span>
                        <span className="font-semibold text-gray-800">{deal.probability}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Expected:</span>
                        <span className="font-semibold text-primary-600">
                          {formatCurrency(expectedRevenue, deal.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-1">
                      {deal.convertedToProject && deal.convertedToProjectAt ? (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Converted to Project:</span>
                          <span className="text-green-600 font-medium">
                            {deal.convertedToProjectAt.toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Expected Close:</span>
                            <span className="text-gray-800">
                              {deal.expectedCloseDate ? deal.expectedCloseDate.toLocaleDateString() : 'Not set'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Days Left:</span>
                            <span className={`font-medium ${
                              deal.expectedCloseDate && Math.ceil((deal.expectedCloseDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) < 7
                                ? 'text-error'
                                : 'text-gray-800'
                            }`}>
                              {deal.expectedCloseDate 
                                ? Math.ceil((deal.expectedCloseDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                : 'N/A'
                              }
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Tags */}
                    {deal.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {deal.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                        {deal.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                            +{deal.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDeal(deal)}
                        className="text-xs"
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditDeal(deal)}
                        className="text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConvertingDealId(deal.id)}
                        className="text-xs text-purple-600 hover:bg-purple-50"
                        disabled={deal.stage === 'closed-lost' || deal.convertedToProject}
                      >
                        {deal.convertedToProject ? 'Already Converted' : 'Convert to Project'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDeal(deal)}
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
        )
      }

      {/* Project Conversion Modal */}
      <ProjectForm
        isOpen={!!convertingDealId}
        onClose={() => setConvertingDealId(null)}
        dealId={convertingDealId || undefined}
      />
    </div>
  );
};

export default DealList;