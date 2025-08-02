import { useState } from 'react';
import type { Invoice, InvoiceFilters } from '../../types/crm';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface InvoicesListProps {
  invoices: Invoice[];
  onCreateInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onMarkPaid: (invoiceId: string, amount: number) => void;
  onSendReminder: (invoiceId: string) => void;
  isLoading?: boolean;
}

const InvoicesList = ({
  invoices,
  onCreateInvoice,
  onViewInvoice,
  onEditInvoice,
  onMarkPaid,
  onSendReminder,
  isLoading = false
}: InvoicesListProps) => {
  const [filters, setFilters] = useState<InvoiceFilters>({
    search: '',
    status: undefined,
    paymentStatus: undefined,
    overdue: undefined
  });

  // Filter invoices based on current filters
  const filteredInvoices = invoices.filter(invoice => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (
        !invoice.invoiceNumber.toLowerCase().includes(searchLower) &&
        !invoice.description.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    
    if (filters.status && invoice.status !== filters.status) {
      return false;
    }
    
    if (filters.paymentStatus && invoice.paymentStatus !== filters.paymentStatus) {
      return false;
    }
    
    if (filters.overdue) {
      const isOverdue = invoice.status === 'overdue' || 
        (invoice.paymentStatus !== 'paid' && new Date() > invoice.dueDate);
      if (!isOverdue) {
        return false;
      }
    }
    
    return true;
  });

  // Calculate summary statistics
  const summary = {
    total: invoices.length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.paymentStatus === 'paid').length,
    overdue: invoices.filter(i => 
      i.status === 'overdue' || 
      (i.paymentStatus !== 'paid' && new Date() > i.dueDate)
    ).length,
    totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
    paidAmount: invoices.reduce((sum, i) => 
      sum + i.payments.reduce((pSum, p) => pSum + p.amount, 0), 0
    ),
    overdueAmount: invoices
      .filter(i => i.status === 'overdue' || (i.paymentStatus !== 'paid' && new Date() > i.dueDate))
      .reduce((sum, i) => sum + (i.totalAmount - i.payments.reduce((pSum, p) => pSum + p.amount, 0)), 0)
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'sent': return 'bg-blue-100 text-blue-700';
      case 'viewed': return 'bg-yellow-100 text-yellow-700';
      case 'partial': return 'bg-orange-100 text-orange-700';
      case 'paid': return 'bg-green-100 text-green-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusColor = (status: Invoice['paymentStatus']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'partial': return 'bg-orange-100 text-orange-700';
      case 'paid': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDaysOverdue = (invoice: Invoice) => {
    if (invoice.paymentStatus === 'paid') return 0;
    const today = new Date();
    const diffTime = today.getTime() - invoice.dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'viewed', label: 'Viewed' },
    { value: 'partial', label: 'Partial' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const paymentStatusOptions = [
    { value: '', label: 'All Payment Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'partial', label: 'Partial' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Invoices</h1>
          <p className="text-gray-500 mt-1">Manage project invoices and payments</p>
        </div>
        <Button onClick={onCreateInvoice} disabled={isLoading}>
          + Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{summary.total}</div>
            <div className="text-sm text-gray-500">Total Invoices</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${summary.paidAmount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Paid Amount</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${(summary.totalAmount - summary.paidAmount).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Outstanding</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              ${summary.overdueAmount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Overdue ({summary.overdue})</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search invoices..."
            value={filters.search || ''}
            onChange={(value) => setFilters({ ...filters, search: value })}
          />
          
          <Select
            value={filters.status || ''}
            onChange={(value) => setFilters({ ...filters, status: value as any || undefined })}
            options={statusOptions}
          />
          
          <Select
            value={filters.paymentStatus || ''}
            onChange={(value) => setFilters({ ...filters, paymentStatus: value as any || undefined })}
            options={paymentStatusOptions}
          />
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.overdue || false}
              onChange={(e) => setFilters({ ...filters, overdue: e.target.checked || undefined })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Show only overdue</span>
          </label>
        </div>
      </Card>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No invoices found</h3>
          <p className="text-gray-400 mb-4">
            {Object.values(filters).some(f => f) 
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by creating your first invoice.'}
          </p>
          <Button onClick={onCreateInvoice}>+ Create Your First Invoice</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInvoices.map((invoice) => {
            const daysOverdue = getDaysOverdue(invoice);
            const isOverdue = daysOverdue > 0;
            const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
            const outstandingAmount = invoice.totalAmount - paidAmount;
            
            return (
              <Card key={invoice.id} hover className={`relative ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
                <div className="space-y-4">
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {invoice.invoiceNumber}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {invoice.description}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-1 items-end">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status.replace('-', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                          {invoice.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total Amount:</span>
                      <span className="font-semibold text-gray-800">
                        ${invoice.totalAmount.toLocaleString()}
                      </span>
                    </div>
                    
                    {paidAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Paid:</span>
                        <span className="font-semibold text-green-600">
                          ${paidAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {outstandingAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Outstanding:</span>
                        <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                          ${outstandingAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Issue Date:</span>
                      <span className="text-gray-800">
                        {invoice.issueDate.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Due Date:</span>
                      <span className={`${isOverdue ? 'text-red-600 font-medium' : 'text-gray-800'}`}>
                        {invoice.dueDate.toLocaleDateString()}
                        {isOverdue && ` (${daysOverdue} days overdue)`}
                      </span>
                    </div>
                    {invoice.paidDate && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Paid Date:</span>
                        <span className="text-green-600 font-medium">
                          {invoice.paidDate.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewInvoice(invoice)}
                      className="text-xs"
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditInvoice(invoice)}
                      className="text-xs"
                      disabled={invoice.status === 'paid'}
                    >
                      Edit
                    </Button>
                    
                    {invoice.paymentStatus !== 'paid' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMarkPaid(invoice.id, outstandingAmount)}
                          className="text-xs text-green-600 hover:bg-green-50"
                        >
                          Mark Paid
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSendReminder(invoice.id)}
                          className="text-xs text-blue-600 hover:bg-blue-50"
                          disabled={invoice.status === 'draft'}
                        >
                          Send Reminder
                        </Button>
                      </>
                    )}
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

export default InvoicesList;