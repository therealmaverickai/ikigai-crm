import { useState } from 'react';
import type { Deal } from '../../types/crm';
import { useCrmStore } from '../../stores/crmStoreDb';
import DealList from './DealList';
import DealForm from './DealForm';
import DealDetailModal from './DealDetailModal';
import Modal from '../ui/Modal';

const DealsPage = () => {
  const { addDeal, updateDeal } = useCrmStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [viewingDeal, setViewingDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddDeal = () => {
    setEditingDeal(null);
    setIsModalOpen(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setIsModalOpen(true);
  };

  const handleViewDeal = (deal: Deal) => {
    setViewingDeal(deal);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDeal(null);
  };

  const handleCloseDetailModal = () => {
    setViewingDeal(null);
  };

  const handleSubmitDeal = async (formData: any) => {
    setIsLoading(true);
    
    try {
      if (editingDeal) {
        await updateDeal(editingDeal.id, formData);
      } else {
        await addDeal(formData);
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Error saving deal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DealList
        onAddDeal={handleAddDeal}
        onEditDeal={handleEditDeal}
        onViewDeal={handleViewDeal}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDeal ? 'Edit Deal' : 'Add New Deal'}
        size="xl"
      >
        <DealForm
          deal={editingDeal || undefined}
          onSubmit={handleSubmitDeal}
          onCancel={handleCloseModal}
          isLoading={isLoading}
        />
      </Modal>

      {viewingDeal && (
        <DealDetailModal
          isOpen={true}
          onClose={handleCloseDetailModal}
          deal={viewingDeal}
        />
      )}
    </>
  );
};

export default DealsPage;