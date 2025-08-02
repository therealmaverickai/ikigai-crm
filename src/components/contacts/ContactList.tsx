import { useState } from 'react';
import type { Contact, ContactFilters } from '../../types/crm';
import { useCrmStore } from '../../stores/crmStoreDb';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface ContactListProps {
  onAddContact: () => void;
  onEditContact: (contact: Contact) => void;
  onViewContact: (contact: Contact) => void;
}

const ContactList = ({ onAddContact, onEditContact, onViewContact }: ContactListProps) => {
  const { getFilteredContacts, deleteContact, companies, getCompanyById } = useCrmStore();
  
  const [filters, setFilters] = useState<ContactFilters>({
    search: '',
    companyId: undefined,
    status: undefined,
  });

  const contacts = getFilteredContacts(filters);

  const handleDeleteContact = (contact: Contact) => {
    const company = getCompanyById(contact.companyId);
    const contactName = `${contact.firstName} ${contact.lastName}`;
    const companyName = company ? ` from ${company.name}` : '';
    
    if (window.confirm(`Are you sure you want to delete ${contactName}${companyName}?`)) {
      deleteContact(contact.id);
    }
  };

  const getStatusBadgeColor = (status: Contact['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const companyOptions = [
    { value: '', label: 'All Companies' },
    ...companies.map(company => ({
      value: company.id,
      label: company.name
    }))
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Contacts</h1>
          <p className="text-gray-500 mt-1">Manage your contact database</p>
        </div>
        <Button onClick={onAddContact}>+ Add Contact</Button>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search contacts..."
            value={filters.search || ''}
            onChange={(value) => setFilters({ ...filters, search: value })}
          />
          
          <Select
            value={filters.companyId || ''}
            onChange={(value) => setFilters({ ...filters, companyId: value || undefined })}
            options={companyOptions}
          />
          
          <Select
            value={filters.status || ''}
            onChange={(value) => setFilters({ ...filters, status: value as Contact['status'] || undefined })}
            options={statusOptions}
          />
        </div>
      </Card>

      {/* Contacts Grid */}
      {contacts.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No contacts found</h3>
          <p className="text-gray-400 mb-4">
            {filters.search || filters.companyId || filters.status
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by adding your first contact.'}
          </p>
          <Button onClick={onAddContact}>+ Add Your First Contact</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map((contact) => {
            const company = getCompanyById(contact.companyId);
            
            return (
              <Card key={contact.id} hover className="relative">
                <div className="space-y-4">
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {contact.firstName} {contact.lastName}
                      </h3>
                      <div className="flex space-x-1">
                        {contact.isPrimary && (
                          <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700">
                            Primary
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(contact.status)}`}>
                          {contact.status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Company & Job Title */}
                    <div className="space-y-1">
                      {company && (
                        <p className="text-sm font-medium text-primary-600">
                          {company.name}
                        </p>
                      )}
                      {contact.jobTitle && (
                        <p className="text-sm text-gray-600">{contact.jobTitle}</p>
                      )}
                      {contact.department && (
                        <p className="text-xs text-gray-500">{contact.department}</p>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4 text-gray-400">📧</span>
                      <span className="ml-2 truncate">{contact.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4 text-gray-400">📞</span>
                      <span className="ml-2">{contact.phone}</span>
                    </div>
                  </div>

                  {/* Notes Preview */}
                  {contact.notes && (
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {contact.notes}
                      </p>
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-400">
                    <span>
                      Added {new Date(contact.createdAt).toLocaleDateString()}
                    </span>
                    {contact.updatedAt.getTime() !== contact.createdAt.getTime() && (
                      <span>
                        Updated {new Date(contact.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewContact(contact)}
                      className="text-xs"
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditContact(contact)}
                      className="text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteContact(contact)}
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

export default ContactList;