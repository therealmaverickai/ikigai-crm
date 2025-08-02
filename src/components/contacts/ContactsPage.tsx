import { useState } from 'react';
import type { Contact } from '../../types/crm';
import { useCrmStore } from '../../stores/crmStoreDb';
import ContactList from './ContactList';
import ContactForm from './ContactForm';
import Modal from '../ui/Modal';

const ContactsPage = () => {
  const { addContact, updateContact } = useCrmStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddContact = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleViewContact = (contact: Contact) => {
    // For now, just edit. Later we can create a detailed view
    handleEditContact(contact);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const handleSubmitContact = async (formData: any) => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingContact) {
        updateContact(editingContact.id, formData);
      } else {
        addContact(formData);
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ContactList
        onAddContact={handleAddContact}
        onEditContact={handleEditContact}
        onViewContact={handleViewContact}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingContact ? 'Edit Contact' : 'Add New Contact'}
        size="lg"
      >
        <ContactForm
          contact={editingContact || undefined}
          onSubmit={handleSubmitContact}
          onCancel={handleCloseModal}
          isLoading={isLoading}
        />
      </Modal>
    </>
  );
};

export default ContactsPage;