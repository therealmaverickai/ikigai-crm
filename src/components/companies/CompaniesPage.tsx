import { useState, useEffect } from 'react';
import type { Company } from '../../types/crm';
import { useCrmStore } from '../../stores/crmStoreDb';
import CompanyList from './CompanyList';
import CompanyForm from './CompanyForm';
import Modal from '../ui/Modal';

interface CompaniesPageProps {
  forceOpenModal?: boolean;
  onModalStateChange?: (isOpen: boolean) => void;
}

const CompaniesPage = ({ forceOpenModal = false, onModalStateChange }: CompaniesPageProps) => {
  const { addCompany, updateCompany } = useCrmStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle forced modal opening from parent component
  useEffect(() => {
    if (forceOpenModal && !isModalOpen) {
      handleAddCompany();
    }
  }, [forceOpenModal]);

  // Notify parent when modal state changes
  useEffect(() => {
    onModalStateChange?.(isModalOpen);
  }, [isModalOpen, onModalStateChange]);

  const handleAddCompany = () => {
    setEditingCompany(null);
    setIsModalOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleViewCompany = (company: Company) => {
    // For now, just edit. Later we can create a detailed view
    handleEditCompany(company);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
  };

  const handleSubmitCompany = async (formData: any) => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingCompany) {
        updateCompany(editingCompany.id, formData);
      } else {
        addCompany(formData);
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Error saving company:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CompanyList
        onAddCompany={handleAddCompany}
        onEditCompany={handleEditCompany}
        onViewCompany={handleViewCompany}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCompany ? 'Edit Company' : 'Add New Company'}
        size="lg"
      >
        <CompanyForm
          company={editingCompany || undefined}
          onSubmit={handleSubmitCompany}
          onCancel={handleCloseModal}
          isLoading={isLoading}
        />
      </Modal>
    </>
  );
};

export default CompaniesPage;