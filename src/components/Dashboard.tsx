import { useCrmStore } from '../stores/crmStoreDb';
import Card from './ui/Card';
import Button from './ui/Button';

const Dashboard = () => {
  const { companies, contacts, deals, projects } = useCrmStore();
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with your business.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" size="sm">Export</Button>
          <Button variant="primary" size="sm">+ New Deal</Button>
        </div>
      </div>

      {/* Key Metrics - 4 Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Deals */}
        <Card hover className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{deals.length}</div>
            <div className="text-lg font-semibold text-gray-800 mb-1">Total Deals</div>
            <div className="text-sm text-gray-600">
              {deals.filter(d => d.status === 'active').length} active • {deals.filter(d => d.status === 'on-hold').length} on hold
            </div>
            <div className="text-xs text-blue-600 mt-2">
              ${Math.round(deals.reduce((sum, d) => sum + d.value, 0)).toLocaleString()} total value
            </div>
          </div>
        </Card>
        
        {/* Won Deals */}
        <Card hover className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {deals.filter(d => d.stage === 'closed-won').length}
            </div>
            <div className="text-lg font-semibold text-gray-800 mb-1">Won Deals</div>
            <div className="text-sm text-gray-600">
              ${Math.round(deals.filter(d => d.stage === 'closed-won').reduce((sum, d) => sum + d.value, 0)).toLocaleString()} won
            </div>
            <div className="text-xs text-green-600 mt-2">
              {deals.length > 0 ? Math.round((deals.filter(d => d.stage === 'closed-won').length / deals.length) * 100) : 0}% win rate
            </div>
          </div>
        </Card>
        
        {/* Pipeline Value */}
        <Card hover className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">
              ${Math.round(deals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage)).reduce((sum, d) => sum + (d.value * d.probability / 100), 0)).toLocaleString()}
            </div>
            <div className="text-lg font-semibold text-gray-800 mb-1">Pipeline Value</div>
            <div className="text-sm text-gray-600">
              {deals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage)).length} active deals
            </div>
            <div className="text-xs text-orange-600 mt-2">
              Expected revenue
            </div>
          </div>
        </Card>
        
        {/* Active Projects */}
        <Card hover className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {projects.filter(p => p.status === 'active').length}
            </div>
            <div className="text-lg font-semibold text-gray-800 mb-1">Active Projects</div>
            <div className="text-sm text-gray-600">
              ${Math.round(projects.filter(p => p.status === 'active').reduce((sum, p) => sum + p.budget.totalRevenue, 0)).toLocaleString()} revenue
            </div>
            <div className="text-xs text-purple-600 mt-2">
              {projects.filter(p => p.status === 'active').length > 0 ? 
                Math.round(projects.filter(p => p.status === 'active').reduce((sum, p) => sum + p.progressPercentage, 0) / projects.filter(p => p.status === 'active').length) : 0
              }% avg progress
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {/* Recent Deals */}
          {deals.slice(0, 3).map((deal) => {
            const company = companies.find(c => c.id === deal.companyId);
            const timeAgo = new Date().getTime() - deal.updatedAt.getTime();
            const hoursAgo = Math.floor(timeAgo / (1000 * 60 * 60));
            const daysAgo = Math.floor(hoursAgo / 24);
            const timeText = daysAgo > 0 ? `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago` : 
                           hoursAgo > 0 ? `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago` : 'Just now';
            
            return (
              <div key={`deal-${deal.id}`} className="flex items-start space-x-3 p-3 rounded-md bg-gray-50">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  deal.stage === 'closed-won' ? 'bg-green-500' :
                  deal.stage === 'closed-lost' ? 'bg-red-500' :
                  deal.priority === 'high' || deal.priority === 'critical' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    {deal.stage === 'closed-won' ? `Deal won: "${deal.title}"` :
                     deal.stage === 'closed-lost' ? `Deal lost: "${deal.title}"` :
                     deal.createdAt.getTime() > (Date.now() - 24 * 60 * 60 * 1000) ? `New deal created: "${deal.title}"` :
                     `Deal updated: "${deal.title}"`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {company?.name || 'Unknown Company'} • {timeText}
                  </p>
                </div>
              </div>
            );
          })}
          
          {/* Recent Contacts */}
          {contacts.slice(0, 2).map((contact) => {
            const company = companies.find(c => c.id === contact.companyId);
            const timeAgo = new Date().getTime() - contact.updatedAt.getTime();
            const hoursAgo = Math.floor(timeAgo / (1000 * 60 * 60));
            const daysAgo = Math.floor(hoursAgo / 24);
            const timeText = daysAgo > 0 ? `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago` : 
                           hoursAgo > 0 ? `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago` : 'Just now';
            
            return (
              <div key={`contact-${contact.id}`} className="flex items-start space-x-3 p-3 rounded-md bg-gray-50">
                <div className="w-2 h-2 rounded-full mt-2 bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    {contact.createdAt.getTime() > (Date.now() - 24 * 60 * 60 * 1000) ? 
                      `New contact added: ${contact.firstName} ${contact.lastName}` :
                      `Contact updated: ${contact.firstName} ${contact.lastName}`
                    }
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {company?.name || 'Unknown Company'} • {timeText}
                  </p>
                </div>
              </div>
            );
          })}
          
          {/* Recent Projects */}
          {projects.slice(0, 2).map((project) => {
            const company = companies.find(c => c.id === project.companyId);
            const timeAgo = new Date().getTime() - project.updatedAt.getTime();
            const hoursAgo = Math.floor(timeAgo / (1000 * 60 * 60));
            const daysAgo = Math.floor(hoursAgo / 24);
            const timeText = daysAgo > 0 ? `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago` : 
                           hoursAgo > 0 ? `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago` : 'Just now';
            
            return (
              <div key={`project-${project.id}`} className="flex items-start space-x-3 p-3 rounded-md bg-gray-50">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  project.status === 'completed' ? 'bg-green-500' :
                  project.status === 'active' ? 'bg-purple-500' :
                  'bg-gray-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    {project.status === 'completed' ? `Project completed: "${project.title}"` :
                     project.createdAt.getTime() > (Date.now() - 24 * 60 * 60 * 1000) ? `New project started: "${project.title}"` :
                     `Project updated: "${project.title}"`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {company?.name || 'Unknown Company'} • {timeText}
                  </p>
                </div>
              </div>
            );
          })}
          
          {/* Show message if no activities */}
          {deals.length === 0 && contacts.length === 0 && projects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity yet.</p>
              <p className="text-sm mt-1">Start by creating companies, deals, or projects to see activity here.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;