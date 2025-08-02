import { useState, useEffect } from 'react';
import type { InvoiceFormData, InvoiceLineItem } from '../../types/crm';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface InvoiceFormProps {
  projectId: string;
  projectTitle: string;
  companyName: string;
  initialData?: Partial<InvoiceFormData>;
  onSubmit: (invoiceData: InvoiceFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const InvoiceForm = ({ 
  projectId, 
  projectTitle, 
  companyName,
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: InvoiceFormProps) => {
  const [invoice, setInvoice] = useState<InvoiceFormData>({
    projectId,
    description: `Invoice for ${projectTitle}`,
    issueDate: new Date(),
    lineItems: [
      {
        description: projectTitle,
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        category: 'fixed'
      }
    ],
    taxRate: 0,
    ...initialData
  });

  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Calculate totals whenever line items or tax rate changes
  useEffect(() => {
    const newSubtotal = invoice.lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const newTaxAmount = newSubtotal * (invoice.taxRate / 100);
    const discountAmount = invoice.discountAmount || 0;
    const newTotal = newSubtotal + newTaxAmount - discountAmount;
    
    setSubtotal(newSubtotal);
    setTaxAmount(newTaxAmount);
    setTotalAmount(newTotal);
  }, [invoice.lineItems, invoice.taxRate, invoice.discountAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(invoice);
  };

  const addLineItem = () => {
    setInvoice(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          category: 'fixed'
        }
      ]
    }));
  };

  const updateLineItem = (index: number, updates: Partial<Omit<InvoiceLineItem, 'id'>>) => {
    setInvoice(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, ...updates };
          // Recalculate total price
          updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const removeLineItem = (index: number) => {
    if (invoice.lineItems.length > 1) {
      setInvoice(prev => ({
        ...prev,
        lineItems: prev.lineItems.filter((_, i) => i !== index)
      }));
    }
  };

  const categoryOptions = [
    { value: 'time', label: 'Time/Hours' },
    { value: 'expense', label: 'Expense' },
    { value: 'fixed', label: 'Fixed Price' },
    { value: 'milestone', label: 'Milestone' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Invoice Header */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📄 Invoice Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <div className="p-3 bg-gray-50 rounded-md text-gray-800 font-medium">
              {companyName}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <div className="p-3 bg-gray-50 rounded-md text-gray-600">
              {projectTitle}
            </div>
          </div>
          
          <Input
            label="Invoice Description"
            value={invoice.description}
            onChange={(value) => setInvoice({ ...invoice, description: value })}
            placeholder="Description for this invoice"
            required
          />
          
          <Input
            label="Issue Date"
            type="date"
            value={invoice.issueDate.toISOString().split('T')[0]}
            onChange={(value) => setInvoice({ ...invoice, issueDate: new Date(value) })}
            required
          />
          
          {invoice.dueDate && (
            <Input
              label="Due Date (Optional)"
              type="date"
              value={invoice.dueDate.toISOString().split('T')[0]}
              onChange={(value) => setInvoice({ ...invoice, dueDate: new Date(value) })}
            />
          )}
        </div>
      </Card>

      {/* Line Items */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">📋 Line Items</h3>
          <Button
            type="button"
            variant="outline"
            onClick={addLineItem}
            disabled={isLoading}
          >
            + Add Item
          </Button>
        </div>
        
        <div className="space-y-4">
          {invoice.lineItems.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                <div className="md:col-span-2">
                  <Input
                    label="Description"
                    value={item.description}
                    onChange={(value) => updateLineItem(index, { description: value })}
                    placeholder="Item description"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={item.category}
                    onChange={(e) => updateLineItem(index, { category: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Input
                    label="Quantity"
                    type="number"
                    value={item.quantity.toString()}
                    onChange={(value) => updateLineItem(index, { quantity: parseFloat(value) || 1 })}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                
                <div>
                  <Input
                    label="Unit Price ($)"
                    type="number"
                    value={item.unitPrice.toString()}
                    onChange={(value) => updateLineItem(index, { unitPrice: parseFloat(value) || 0 })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="flex items-end space-x-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total
                    </label>
                    <div className="p-2 bg-gray-50 rounded-md text-gray-800 font-medium">
                      ${item.totalPrice.toFixed(2)}
                    </div>
                  </div>
                  
                  {invoice.lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      disabled={isLoading}
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Invoice Totals */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Invoice Totals</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Tax Rate (%)"
            type="number"
            value={invoice.taxRate.toString()}
            onChange={(value) => setInvoice({ ...invoice, taxRate: parseFloat(value) || 0 })}
            min="0"
            max="100"
            step="0.01"
          />
          
          <Input
            label="Discount Amount ($)"
            type="number"
            value={invoice.discountAmount?.toString() || ''}
            onChange={(value) => setInvoice({ ...invoice, discountAmount: parseFloat(value) || undefined })}
            min="0"
            step="0.01"
          />
        </div>
        
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="space-y-2 text-right">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            
            {invoice.taxRate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({invoice.taxRate}%):</span>
                <span className="font-medium">${taxAmount.toFixed(2)}</span>
              </div>
            )}
            
            {invoice.discountAmount && invoice.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-green-600">-${invoice.discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
              <span>Total:</span>
              <span className="text-primary-600">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Notes */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📝 Notes</h3>
        <textarea
          value={invoice.notes || ''}
          onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
          placeholder="Additional notes for this invoice..."
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        />
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || totalAmount <= 0}
        >
          {isLoading ? 'Creating...' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
};

export default InvoiceForm;