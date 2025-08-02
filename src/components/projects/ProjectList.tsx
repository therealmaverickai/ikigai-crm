import { useState } from 'react';
import { useCrmStore } from '../../stores/crmStoreDb';
import type { ProjectFilters } from '../../types/crm';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import ProjectForm from './ProjectForm';

const ProjectList = () => {
  const { 
    projects, 
    companies, 
    getFilteredProjects, 
    setSelectedProject,
    deleteProject 
  } = useCrmStore();

  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    companyId: undefined,
    status: undefined,
    priority: undefined,
    type: undefined,
    projectManager: '',
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const filteredProjects = getFilteredProjects(filters);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'planning': return 'bg-blue-100 text-blue-700';
      case 'on-hold': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const handleDeleteProject = (projectId: string, projectTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${projectTitle}"? This action cannot be undone.`)) {
      deleteProject(projectId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
          <p className="text-gray-500 mt-1">Manage your project portfolio and budgets</p>
        </div>
        <div className="flex space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'cards' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              Cards
            </Button>
            <Button
              variant={viewMode === 'table' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              Table
            </Button>
          </div>
          <Button variant="primary" onClick={() => setIsFormOpen(true)}>
            + New Project
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <Input
            placeholder="Search projects..."
            value={filters.search || ''}
            onChange={(value) => setFilters({ ...filters, search: value })}
          />

          <Select
            value={filters.companyId || ''}
            onChange={(value) => setFilters({ ...filters, companyId: value || undefined })}
          >
            <option value="">All Companies</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </Select>

          <Select
            value={filters.status || ''}
            onChange={(value) => setFilters({ ...filters, status: (value || undefined) as ProjectFilters['status'] })}
          >
            <option value="">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          <Select
            value={filters.priority || ''}
            onChange={(value) => setFilters({ ...filters, priority: (value || undefined) as ProjectFilters['priority'] })}
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>

          <Select
            value={filters.type || ''}
            onChange={(value) => setFilters({ ...filters, type: (value || undefined) as ProjectFilters['type'] })}
          >
            <option value="">All Types</option>
            <option value="development">Development</option>
            <option value="consulting">Consulting</option>
            <option value="implementation">Implementation</option>
            <option value="support">Support</option>
            <option value="other">Other</option>
          </Select>

          <Input
            placeholder="Project Manager"
            value={filters.projectManager || ''}
            onChange={(value) => setFilters({ ...filters, projectManager: value })}
          />
        </div>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hover>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">{projects.length}</div>
            <div className="text-sm text-gray-500 mt-1">Total Projects</div>
            <div className="text-xs text-green-600 mt-2">
              {projects.filter(p => p.status === 'active').length} active
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(projects.reduce((sum, p) => sum + p.budget.totalRevenue, 0))}
            </div>
            <div className="text-sm text-gray-500 mt-1">Total Revenue</div>
            <div className="text-xs text-green-600 mt-2">Across all projects</div>
          </div>
        </Card>

        <Card hover>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(projects.reduce((sum, p) => sum + p.budget.grossMargin, 0))}
            </div>
            <div className="text-sm text-gray-500 mt-1">Total Margin</div>
            <div className="text-xs text-blue-600 mt-2">Gross profit</div>
          </div>
        </Card>

        <Card hover>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {projects.length > 0 
                ? ((projects.reduce((sum, p) => sum + p.budget.marginPercentage, 0) / projects.length).toFixed(1)) + '%'
                : '0%'
              }
            </div>
            <div className="text-sm text-gray-500 mt-1">Avg Margin</div>
            <div className="text-xs text-purple-600 mt-2">Average percentage</div>
          </div>
        </Card>
      </div>

      {/* Projects Display */}
      {viewMode === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => {
              const company = companies.find(c => c.id === project.companyId);
              
              return (
                <Card key={project.id} hover className="cursor-pointer">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {project.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {company?.name || 'Unknown Company'}
                        </p>
                        {project.createdFromDeal && (
                          <span className="inline-flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full mt-1">
                            Converted from Deal
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{project.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-gray-100">
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(project.budget.totalRevenue)}
                        </div>
                        <div className="text-xs text-gray-500">Revenue</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {formatCurrency(project.budget.grossMargin)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Margin ({project.budget.marginPercentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>

                    {/* Timeline & Manager */}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Timeline:</span>
                        <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                      </div>
                      {project.projectManager && (
                        <div className="flex items-center justify-between">
                          <span>Manager:</span>
                          <span>{project.projectManager}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span>Resources:</span>
                        <span>{project.budget.resources.length} resources</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{project.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2 pt-3 border-t border-gray-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProject(project)}
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProject(project.id, project.title)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full">
              <Card>
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No projects found</h3>
                  <p className="text-gray-500 mb-6">
                    {projects.length === 0 
                      ? "Get started by creating your first project or converting a deal."
                      : "Try adjusting your filters to see more results."
                    }
                  </p>
                  <Button variant="primary" onClick={() => setIsFormOpen(true)}>
                    Create New Project
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeline
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => {
                    const company = companies.find(c => c.id === project.companyId);
                    
                    return (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {project.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {project.type} • {project.projectManager || 'No manager'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {company?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(project.priority)}`}>
                              {project.priority}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(project.budget.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(project.budget.grossMargin)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {project.budget.marginPercentage.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full"
                                style={{ width: `${project.progressPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{project.progressPercentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{formatDate(project.startDate)}</div>
                          <div>{formatDate(project.endDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProject(project)}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProject(project.id, project.title)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-gray-400 text-4xl mb-4">📊</div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No projects found</h3>
                      <p className="text-gray-500 mb-6">
                        {projects.length === 0 
                          ? "Get started by creating your first project or converting a deal."
                          : "Try adjusting your filters to see more results."
                        }
                      </p>
                      <Button variant="primary" onClick={() => setIsFormOpen(true)}>
                        Create New Project
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Project Form Modal */}
      <ProjectForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
};

export default ProjectList;