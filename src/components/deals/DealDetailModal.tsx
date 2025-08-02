import { useState } from 'react';
import type { Deal } from '../../types/crm';
import { useCrmStore } from '../../stores/crmStoreDb';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface DealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
}

const DealDetailModal = ({ isOpen, onClose, deal }: DealDetailModalProps) => {
  const { getCompanyById, getDealById } = useCrmStore();
  const [activeTab, setActiveTab] = useState<'details'>('details');
  
  // Get fresh deal data
  const currentDeal: Deal = getDealById(deal.id) || deal;
  const company = getCompanyById(currentDeal.companyId);
  
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getStageColor = (stage: string) => {
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

  const getPriorityColor = (priority: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'won':
        return 'bg-green-100 text-green-700';
      case 'lost':
        return 'bg-red-100 text-red-700';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Deal: ${currentDeal.title}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Deal Details
              </button>
            </nav>
          </div>
          {/* Tab Content */}
          {activeTab === 'details' && (
            <>
              {/* Deal Overview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Company</h3>
                    <p className="text-gray-600">{company?.name || 'Unknown Company'}</p>
                    {company?.email && <p className="text-sm text-gray-500">{company.email}</p>}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Deal Value</h3>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(currentDeal.value, currentDeal.currency)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Expected: {formatCurrency(currentDeal.value * (currentDeal.probability / 100), currentDeal.currency)} ({currentDeal.probability}%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Deal Details */}
              <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStageColor(currentDeal.stage)}`}>
                  {currentDeal.stage.replace('-', ' ').toUpperCase()}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(currentDeal.priority)}`}>
                  {currentDeal.priority.toUpperCase()}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentDeal.status)}`}>
                  {currentDeal.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <p className="text-gray-600">{currentDeal.source.replace('-', ' ')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
                <p className="text-gray-600">{currentDeal.expectedCloseDate.toLocaleDateString()}</p>
                {currentDeal.actualCloseDate && (
                  <p className="text-sm text-gray-500">
                    Actual: {currentDeal.actualCloseDate.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {currentDeal.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-600">{currentDeal.description}</p>
              </div>
            )}

            {currentDeal.tags && currentDeal.tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {currentDeal.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {currentDeal.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <p className="text-gray-600 whitespace-pre-wrap">{currentDeal.notes}</p>
              </div>
            )}

                {/* Metadata */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Created: {currentDeal.createdAt.toLocaleDateString()}</span>
                    <span>Updated: {currentDeal.updatedAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}


          {/* Actions */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DealDetailModal;