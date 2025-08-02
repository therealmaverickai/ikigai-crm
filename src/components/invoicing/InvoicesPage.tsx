import { useState } from 'react';
import { useCrmStore } from '../../stores/crmStoreDb';
import type { Invoice, InvoiceFormData } from '../../types/crm';
import InvoicesList from './InvoicesList';
import InvoiceForm from './InvoiceForm';
import Modal from '../ui/Modal';

const InvoicesPage = () => {
  const { projects, companies, getCompanyById, getProjectById } = useCrmStore();
  
  // Mock invoices data - in real app this would come from the store
  const [invoices] = useState<Invoice[]>([
    {
      id: '1',
      projectId: projects[0]?.id || '1',
      companyId: projects[0]?.companyId || '1',
      invoiceNumber: 'INV-2024-001',
      description: 'Website Development Project - Final Invoice',
      subtotal: 45000,
      taxRate: 10,
      taxAmount: 4500,
      totalAmount: 49500,
      currency: 'USD',
      issueDate: new Date('2024-01-15'),
      dueDate: new Date('2024-03-15'),
      status: 'sent',
      paymentStatus: 'pending',
      lineItems: [
        {
          id: '1',
          description: 'Frontend Development',
          quantity: 200,
          unitPrice: 150,
          totalPrice: 30000,
          category: 'time'
        },
        {
          id: '2',
          description: 'Backend Development', 
          quantity: 100,
          unitPrice: 150,
          totalPrice: 15000,
          category: 'time'
        }
      ],
      payments: [],
      remindersSent: [
        {
          id: '1',
          invoiceId: '1',
          type: 'due-soon',
          sentDate: new Date('2024-03-10'),
          method: 'telegram',
          status: 'sent',
          daysFromDue: 5
        }
      ],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      projectId: projects[1]?.id || '2',
      companyId: projects[1]?.companyId || '2', 
      invoiceNumber: 'INV-2024-002',
      description: 'CRM System Development - Milestone 1',
      subtotal: 25000,
      taxRate: 10,
      taxAmount: 2500,
      totalAmount: 27500,
      currency: 'USD',
      issueDate: new Date('2024-02-01'),
      dueDate: new Date('2024-01-20'), // Overdue
      status: 'overdue',
      paymentStatus: 'pending',
      lineItems: [
        {
          id: '3',
          description: 'Project Setup & Planning',
          quantity: 1,
          unitPrice: 25000,
          totalPrice: 25000,
          category: 'milestone'
        }
      ],
      payments: [],
      remindersSent: [
        {
          id: '2',
          invoiceId: '2',
          type: 'overdue',
          sentDate: new Date('2024-01-25'),
          method: 'telegram',
          status: 'sent',
          daysFromDue: -5
        }
      ],
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01')
    }
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateInvoice = () => {
    if (projects.length === 0) {
      alert('Please create a project first before generating invoices.');
      return;
    }
    setSelectedProject(projects[0].id);
    setIsCreateModalOpen(true);
  };

  const handleSubmitInvoice = async (invoiceData: InvoiceFormData) => {
    setIsLoading(true);
    try {
      // In real app, this would create the invoice via the store
      console.log('Creating invoice:', invoiceData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Invoice created successfully!');
      setIsCreateModalOpen(false);
      setSelectedProject('');
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    console.log('Viewing invoice:', invoice);
    // In real app, this would open invoice detail modal
    alert(`Viewing invoice ${invoice.invoiceNumber}`);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    console.log('Editing invoice:', invoice);
    // In real app, this would open edit modal
    alert(`Editing invoice ${invoice.invoiceNumber}`);
  };

  const handleMarkPaid = async (invoiceId: string, amount: number) => {
    console.log('Marking invoice as paid:', invoiceId, amount);
    // In real app, this would update the invoice payment status
    alert(`Marked invoice as paid: $${amount.toLocaleString()}`);
  };

  const handleSendReminder = async (invoiceId: string) => {
    console.log('Sending reminder for invoice:', invoiceId);
    // In real app, this would send a reminder via Telegram/email
    alert('Payment reminder sent successfully!');
  };

  const getSelectedProjectDetails = () => {
    if (!selectedProject) return null;
    const project = getProjectById(selectedProject);
    if (!project) return null;
    const company = getCompanyById(project.companyId);
    return {
      project,
      company
    };
  };

  const projectDetails = getSelectedProjectDetails();

  return (
    <>
      <InvoicesList
        invoices={invoices}
        onCreateInvoice={handleCreateInvoice}
        onViewInvoice={handleViewInvoice}
        onEditInvoice={handleEditInvoice}
        onMarkPaid={handleMarkPaid}
        onSendReminder={handleSendReminder}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Invoice"
        size="xl"
      >
        {projectDetails && (
          <InvoiceForm
            projectId={projectDetails.project.id}
            projectTitle={projectDetails.project.title}
            companyName={projectDetails.company?.name || 'Unknown Company'}
            onSubmit={handleSubmitInvoice}
            onCancel={() => setIsCreateModalOpen(false)}
            isLoading={isLoading}
          />
        )}
      </Modal>
    </>
  );
};

export default InvoicesPage;