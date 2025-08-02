import { useState, useEffect } from 'react';
import { useCrmStore } from '../../stores/crmStoreDb';
import type { ProjectFormData, ProjectResourceFormData, ProjectExpenseFormData } from '../../types/crm';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  dealId?: string;
}

const ProjectForm = ({ isOpen, onClose, dealId }: ProjectFormProps) => {
  const { 
    companies, 
    addProject, 
    convertDealToProject, 
    getDealById,
    calculateProjectBudget 
  } = useCrmStore();

  const deal = dealId ? getDealById(dealId) : null;
  const company = deal ? companies.find(c => c.id === deal.companyId) : null;

  const getInitialFormData = (): ProjectFormData => ({
    dealId: dealId || '',
    companyId: deal?.companyId || '',
    title: deal?.title || '',
    description: deal?.description || '',
    projectManager: '',
    status: 'planning',
    priority: deal?.priority || 'medium',
    type: 'development',
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    budget: {
      totalRevenue: deal?.value || 0,
      resources: [],
      expenses: [],
      contingencyPercentage: 10,
      currency: deal?.currency || 'USD',
    },
    progressPercentage: 0,
    tags: deal?.tags || [],
    notes: deal?.notes || '',
  });

  const [formData, setFormData] = useState<ProjectFormData>(getInitialFormData);

  // Update form data when deal changes
  useEffect(() => {
    if (dealId && deal) {
      setFormData({
        dealId: dealId || '',
        companyId: deal?.companyId || '',
        title: deal?.title || '',
        description: deal?.description || '',
        projectManager: '',
        status: 'planning',
        priority: deal?.priority || 'medium',
        type: 'development',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        budget: {
          totalRevenue: deal?.value || 0,
          resources: [],
          expenses: [],
          contingencyPercentage: 10,
          currency: deal?.currency || 'USD',
        },
        progressPercentage: 0,
        tags: deal?.tags || [],
        notes: deal?.notes || '',
      });
    }
  }, [dealId, deal]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingResourceIndex, setEditingResourceIndex] = useState<number | null>(null);
  const [editingExpenseIndex, setEditingExpenseIndex] = useState<number | null>(null);

  const [resourceForm, setResourceForm] = useState<ProjectResourceFormData>({
    name: '',
    type: 'internal',
    role: '',
    rateType: 'hourly',
    hourlyRate: 0,
    dailyRate: 0,
    currency: 'USD',
    hoursAllocated: 0,
    daysAllocated: 0,
    startDate: new Date(),
    endDate: new Date(),
    skills: [],
    notes: '',
  });

  const [expenseForm, setExpenseForm] = useState<ProjectExpenseFormData>({
    category: 'software',
    description: '',
    plannedCost: 0,
    currency: 'USD',
    status: 'planned',
    vendor: '',
    notes: '',
  });

  const calculatedBudget = calculateProjectBudget(formData.budget);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.companyId) newErrors.companyId = 'Company is required';
    if (formData.budget.totalRevenue <= 0) newErrors.totalRevenue = 'Revenue must be greater than 0';
    if (formData.startDate >= formData.endDate) newErrors.endDate = 'End date must be after start date';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      if (dealId) {
        convertDealToProject(dealId, formData);
      } else {
        addProject(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddResource = () => {
    const updatedResources = [...formData.budget.resources];
    if (editingResourceIndex !== null) {
      updatedResources[editingResourceIndex] = { ...resourceForm, id: updatedResources[editingResourceIndex].id };
    } else {
      updatedResources.push({ ...resourceForm, id: Math.random().toString(36).substr(2, 9) });
    }
    
    setFormData({
      ...formData,
      budget: { ...formData.budget, resources: updatedResources }
    });
    
    setShowResourceModal(false);
    setEditingResourceIndex(null);
    setResourceForm({
      name: '',
      type: 'internal',
      role: '',
      rateType: 'hourly',
      hourlyRate: 0,
      dailyRate: 0,
      currency: 'USD',
      hoursAllocated: 0,
      daysAllocated: 0,
      startDate: new Date(),
      endDate: new Date(),
      skills: [],
      notes: '',
    });
  };

  const handleEditResource = (index: number) => {
    const resource = formData.budget.resources[index];
    setResourceForm({ ...resource });
    setEditingResourceIndex(index);
    setShowResourceModal(true);
  };

  const handleRemoveResource = (index: number) => {
    const updatedResources = formData.budget.resources.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      budget: { ...formData.budget, resources: updatedResources }
    });
  };

  const handleAddExpense = () => {
    const updatedExpenses = [...formData.budget.expenses];
    if (editingExpenseIndex !== null) {
      updatedExpenses[editingExpenseIndex] = { ...expenseForm, id: updatedExpenses[editingExpenseIndex].id };
    } else {
      updatedExpenses.push({ ...expenseForm, id: Math.random().toString(36).substr(2, 9) });
    }
    
    setFormData({
      ...formData,
      budget: { ...formData.budget, expenses: updatedExpenses }
    });
    
    setShowExpenseModal(false);
    setEditingExpenseIndex(null);
    setExpenseForm({
      category: 'software',
      description: '',
      plannedCost: 0,
      currency: 'USD',
      status: 'planned',
      vendor: '',
      notes: '',
    });
  };

  const handleEditExpense = (index: number) => {
    const expense = formData.budget.expenses[index];
    setExpenseForm({ ...expense });
    setEditingExpenseIndex(index);
    setShowExpenseModal(true);
  };

  const handleRemoveExpense = (index: number) => {
    const updatedExpenses = formData.budget.expenses.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      budget: { ...formData.budget, expenses: updatedExpenses }
    });
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={dealId ? `Convert Deal to Project: ${deal?.title}` : 'Create New Project'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Details */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Details</h3>
            
            {dealId && company && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  Converting deal from <strong>{company.name}</strong> • Value: <strong>${deal?.value.toLocaleString()}</strong>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Project Title"
                value={formData.title}
                onChange={(value) => setFormData({ ...formData, title: value })}
                error={errors.title}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  required
                  disabled={!!dealId}
                  className={`
                    block w-full px-3 py-2 border rounded-md shadow-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                    ${errors.companyId ? 'border-red-500' : 'border-gray-300'}
                  `}
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {errors.companyId && (
                  <p className="text-sm text-red-500 mt-1">{errors.companyId}</p>
                )}
              </div>

              <Input
                label="Project Manager"
                value={formData.projectManager || ''}
                onChange={(value) => setFormData({ ...formData, projectManager: value })}
              />

              <Select
                label="Project Type"
                value={formData.type}
                onChange={(value) => setFormData({ ...formData, type: value as ProjectFormData['type'] })}
              >
                <option value="development">Development</option>
                <option value="consulting">Consulting</option>
                <option value="implementation">Implementation</option>
                <option value="support">Support</option>
                <option value="other">Other</option>
              </Select>

              <Select
                label="Status"
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value as ProjectFormData['status'] })}
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>

              <Select
                label="Priority"
                value={formData.priority}
                onChange={(value) => setFormData({ ...formData, priority: value as ProjectFormData['priority'] })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>

              <Input
                label="Start Date"
                type="date"
                value={formData.startDate.toISOString().split('T')[0]}
                onChange={(value) => setFormData({ ...formData, startDate: new Date(value) })}
              />

              <Input
                label="End Date"
                type="date"
                value={formData.endDate.toISOString().split('T')[0]}
                onChange={(value) => setFormData({ ...formData, endDate: new Date(value) })}
                error={errors.endDate}
              />
            </div>

            <Textarea
              label="Description"
              value={formData.description || ''}
              onChange={(value) => setFormData({ ...formData, description: value })}
              rows={3}
              className="mt-4"
            />
          </Card>

          {/* Budget Section */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget Management</h3>
            
            {/* Budget Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ${calculatedBudget.totalRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-green-700">Total Revenue</div>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  ${calculatedBudget.totalCost.toLocaleString()}
                </div>
                <div className="text-sm text-red-700">Total Cost</div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  ${calculatedBudget.grossMargin.toLocaleString()}
                </div>
                <div className="text-sm text-blue-700">Gross Margin</div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {calculatedBudget.marginPercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-purple-700">Margin %</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Input
                label="Total Revenue"
                type="number"
                value={formData.budget.totalRevenue.toString()}
                onChange={(value) => setFormData({
                  ...formData,
                  budget: { ...formData.budget, totalRevenue: parseFloat(value) || 0 }
                })}
                error={errors.totalRevenue}
                required
              />

              <Input
                label="Contingency %"
                type="number"
                value={formData.budget.contingencyPercentage.toString()}
                onChange={(value) => setFormData({
                  ...formData,
                  budget: { ...formData.budget, contingencyPercentage: parseFloat(value) || 0 }
                })}
                min="0"
                max="50"
              />
            </div>

            {/* Resources Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-700">Project Resources</h4>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowResourceModal(true)}
                >
                  + Add Resource
                </Button>
              </div>

              {formData.budget.resources.length > 0 ? (
                <div className="space-y-3">
                  {formData.budget.resources.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800">{resource.name}</div>
                        <div className="text-sm text-gray-600">
                          {resource.role} • 
                          {resource.rateType === 'daily' ? (
                            <>
                              ${resource.dailyRate}/day • {resource.daysAllocated} days
                            </>
                          ) : (
                            <>
                              ${resource.hourlyRate}/hr • {resource.hoursAllocated}h
                            </>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Total: ${resource.rateType === 'daily' 
                            ? ((resource.dailyRate || 0) * (resource.daysAllocated || 0)).toLocaleString()
                            : (resource.hourlyRate * resource.hoursAllocated).toLocaleString()
                          }
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditResource(index)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveResource(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No resources added yet. Click "Add Resource" to get started.
                </div>
              )}
            </div>

            {/* Expenses Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-700">Project Expenses</h4>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowExpenseModal(true)}
                >
                  + Add Expense
                </Button>
              </div>

              {formData.budget.expenses.length > 0 ? (
                <div className="space-y-3">
                  {formData.budget.expenses.map((expense, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800">{expense.description}</div>
                        <div className="text-sm text-gray-600">
                          {expense.category} • ${expense.plannedCost.toLocaleString()}
                        </div>
                        {expense.vendor && (
                          <div className="text-sm text-gray-500">Vendor: {expense.vendor}</div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditExpense(index)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExpense(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No expenses added yet. Click "Add Expense" to get started.
                </div>
              )}
            </div>
          </Card>

          {/* Additional Details */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Details</h3>
            
            <Input
              label="Tags (comma-separated)"
              value={formData.tags.join(', ')}
              onChange={(value) => setFormData({
                ...formData,
                tags: value.split(',').map(tag => tag.trim()).filter(tag => tag)
              })}
              className="mb-4"
            />

            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(value) => setFormData({ ...formData, notes: value })}
              rows={3}
            />
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : dealId ? 'Convert to Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Resource Modal */}
      <Modal
        isOpen={showResourceModal}
        onClose={() => {
          setShowResourceModal(false);
          setEditingResourceIndex(null);
        }}
        title={editingResourceIndex !== null ? 'Edit Resource' : 'Add Resource'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Resource Name"
              value={resourceForm.name}
              onChange={(value) => setResourceForm({ ...resourceForm, name: value })}
              required
            />

            <Select
              label="Type"
              value={resourceForm.type}
              onChange={(value) => setResourceForm({ ...resourceForm, type: value as any })}
            >
              <option value="internal">Internal</option>
              <option value="external">External</option>
              <option value="contractor">Contractor</option>
            </Select>

            <Input
              label="Role"
              value={resourceForm.role}
              onChange={(value) => setResourceForm({ ...resourceForm, role: value })}
              required
            />

            <Select
              label="Rate Type"
              value={resourceForm.rateType}
              onChange={(value) => {
                const newRateType = value as 'hourly' | 'daily';
                setResourceForm({ 
                  ...resourceForm, 
                  rateType: newRateType,
                  // Auto-calculate when switching
                  ...(newRateType === 'daily' && resourceForm.hourlyRate > 0 ? {
                    daysAllocated: Math.ceil(resourceForm.hoursAllocated / 8),
                    dailyRate: resourceForm.hourlyRate * 8
                  } : {}),
                  ...(newRateType === 'hourly' && (resourceForm.dailyRate ?? 0) > 0 ? {
                    hoursAllocated: (resourceForm.daysAllocated || 0) * 8,
                    hourlyRate: (resourceForm.dailyRate ?? 0) / 8
                  } : {})
                });
              }}
            >
              <option value="hourly">Hourly Rate</option>
              <option value="daily">Daily Rate</option>
            </Select>

            {resourceForm.rateType === 'hourly' ? (
              <>
                <Input
                  label="Hourly Rate"
                  type="number"
                  value={resourceForm.hourlyRate.toString()}
                  onChange={(value) => setResourceForm({ ...resourceForm, hourlyRate: parseFloat(value) || 0 })}
                  required
                />

                <Input
                  label="Hours Allocated"
                  type="number"
                  value={resourceForm.hoursAllocated.toString()}
                  onChange={(value) => setResourceForm({ ...resourceForm, hoursAllocated: parseFloat(value) || 0 })}
                  required
                />
              </>
            ) : (
              <>
                <Input
                  label="Daily Rate"
                  type="number"
                  value={resourceForm.dailyRate?.toString() || ''}
                  onChange={(value) => setResourceForm({ 
                    ...resourceForm, 
                    dailyRate: parseFloat(value) || 0,
                    // Auto-calculate hourly rate (8 hours per day)
                    hourlyRate: (parseFloat(value) || 0) / 8
                  })}
                  required
                />

                <Input
                  label="Days Allocated"
                  type="number"
                  value={resourceForm.daysAllocated?.toString() || ''}
                  onChange={(value) => setResourceForm({ 
                    ...resourceForm, 
                    daysAllocated: parseFloat(value) || 0,
                    // Auto-calculate hours (8 hours per day)
                    hoursAllocated: (parseFloat(value) || 0) * 8
                  })}
                  required
                />
              </>
            )}

            <Select
              label="Currency"
              value={resourceForm.currency}
              onChange={(value) => setResourceForm({ ...resourceForm, currency: value })}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
            </Select>

            <Input
              label="Start Date"
              type="date"
              value={resourceForm.startDate.toISOString().split('T')[0]}
              onChange={(value) => setResourceForm({ ...resourceForm, startDate: new Date(value) })}
            />

            <Input
              label="End Date"
              type="date"
              value={resourceForm.endDate.toISOString().split('T')[0]}
              onChange={(value) => setResourceForm({ ...resourceForm, endDate: new Date(value) })}
            />
          </div>

          {/* Rate conversion display */}
          {resourceForm.rateType === 'daily' && (resourceForm.dailyRate ?? 0) > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <div>Daily rate of ${resourceForm.dailyRate} = ${((resourceForm.dailyRate ?? 0) / 8).toFixed(2)}/hour (8 hours/day)</div>
              {(resourceForm.daysAllocated ?? 0) > 0 && (
                <div>{resourceForm.daysAllocated} days = {(resourceForm.daysAllocated ?? 0) * 8} hours</div>
              )}
            </div>
          )}

          {resourceForm.rateType === 'hourly' && resourceForm.hourlyRate > 0 && resourceForm.hoursAllocated > 0 && (
            <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
              <div>{resourceForm.hoursAllocated} hours at ${resourceForm.hourlyRate}/hour = ${(resourceForm.hoursAllocated * resourceForm.hourlyRate).toLocaleString()} total</div>
            </div>
          )}

          <Input
            label="Skills (comma-separated)"
            value={resourceForm.skills.join(', ')}
            onChange={(value) => setResourceForm({
              ...resourceForm,
              skills: value.split(',').map(skill => skill.trim()).filter(skill => skill)
            })}
          />

          <Textarea
            label="Notes"
            value={resourceForm.notes || ''}
            onChange={(value) => setResourceForm({ ...resourceForm, notes: value })}
            rows={2}
          />

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowResourceModal(false);
                setEditingResourceIndex(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAddResource}
            >
              {editingResourceIndex !== null ? 'Update Resource' : 'Add Resource'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Expense Modal */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingExpenseIndex(null);
        }}
        title={editingExpenseIndex !== null ? 'Edit Expense' : 'Add Expense'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={expenseForm.category}
              onChange={(value) => setExpenseForm({ ...expenseForm, category: value as any })}
            >
              <option value="software">Software</option>
              <option value="hardware">Hardware</option>
              <option value="travel">Travel</option>
              <option value="materials">Materials</option>
              <option value="licenses">Licenses</option>
              <option value="other">Other</option>
            </Select>

            <Input
              label="Planned Cost"
              type="number"
              value={expenseForm.plannedCost.toString()}
              onChange={(value) => setExpenseForm({ ...expenseForm, plannedCost: parseFloat(value) || 0 })}
              required
            />

            <Select
              label="Currency"
              value={expenseForm.currency}
              onChange={(value) => setExpenseForm({ ...expenseForm, currency: value })}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
            </Select>

            <Select
              label="Status"
              value={expenseForm.status}
              onChange={(value) => setExpenseForm({ ...expenseForm, status: value as any })}
            >
              <option value="planned">Planned</option>
              <option value="approved">Approved</option>
              <option value="ordered">Ordered</option>
              <option value="received">Received</option>
              <option value="paid">Paid</option>
            </Select>

            <Input
              label="Due Date"
              type="date"
              value={expenseForm.dueDate?.toISOString().split('T')[0] || ''}
              onChange={(value) => setExpenseForm({ 
                ...expenseForm, 
                dueDate: value ? new Date(value) : undefined 
              })}
            />

            <Input
              label="Vendor"
              value={expenseForm.vendor || ''}
              onChange={(value) => setExpenseForm({ ...expenseForm, vendor: value })}
            />
          </div>

          <Input
            label="Description"
            value={expenseForm.description}
            onChange={(value) => setExpenseForm({ ...expenseForm, description: value })}
            required
          />

          <Textarea
            label="Notes"
            value={expenseForm.notes || ''}
            onChange={(value) => setExpenseForm({ ...expenseForm, notes: value })}
            rows={2}
          />

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowExpenseModal(false);
                setEditingExpenseIndex(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAddExpense}
            >
              {editingExpenseIndex !== null ? 'Update Expense' : 'Add Expense'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProjectForm;