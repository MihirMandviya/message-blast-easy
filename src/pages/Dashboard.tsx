import { MessageSquare, Users, BarChart3, Send, Settings, Clock, FileText, HelpCircle, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useClientData } from '@/hooks/useClientData';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const { client } = useClientAuth();
  const { admin } = useAdminAuth();
  const { getStats, loading: dataLoading } = useClientData();

  const currentUser = admin || client;
  const userName = admin ? admin.full_name : client?.business_name;
  const stats = getStats();

  const quickActions = [
    {
      title: 'Send Message',
      description: 'Send instant messages to your customers',
      icon: Send,
      action: () => navigate('/send'),
      color: 'bg-blue-500',
      textColor: 'text-white'
    },
    {
      title: 'View Messages',
      description: 'Check your message history and analytics',
      icon: BarChart3,
      action: () => navigate('/messages'),
      color: 'bg-green-500',
      textColor: 'text-white'
    },
    {
      title: 'Manage Contacts',
      description: 'Organize your customer contacts',
      icon: Users,
      action: () => navigate('/contacts'),
      color: 'bg-purple-500',
      textColor: 'text-white'
    },
    {
      title: 'Templates',
      description: 'Create and manage message templates',
      icon: FileText,
      action: () => navigate('/templates'),
      color: 'bg-orange-500',
      textColor: 'text-white'
    }
  ];

  const adminActions = [
    {
      title: 'Client Management',
      description: 'Manage all client accounts',
      icon: Users,
      action: () => navigate('/admin/clients'),
      color: 'bg-red-500',
      textColor: 'text-white'
    },
    {
      title: 'User Management',
      description: 'Create and manage users',
      icon: Settings,
      action: () => navigate('/users'),
      color: 'bg-indigo-500',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-blue-500 rounded-full">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isAdmin ? 'Admin Portal' : 'WhatsApp Business Hub'}
                </h1>
                <p className="text-gray-600">
                  Welcome back, {userName}!
                </p>
              </div>
            </div>
            <p className="text-gray-700">
              {isAdmin 
                ? 'Manage your clients and system settings' 
                : 'Manage your business communications efficiently'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(isAdmin ? adminActions : quickActions).map((action, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-full ${action.color}`}>
                    <action.icon className={`h-5 w-5 ${action.textColor}`} />
                  </div>
                  <h3 className="font-medium">{action.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                <Button onClick={action.action} size="sm" className="w-full">
                  Open
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest messaging activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Messages sent successfully</span>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">New template created</span>
                </div>
                <span className="text-sm text-gray-500">5 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Contacts updated</span>
                </div>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Getting Started
            </CardTitle>
            <CardDescription>
              Quick tips to get the most out of your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Send Your First Message</h4>
                <p className="text-xs text-gray-600">
                  Start by sending a message to your customers using the Send Message feature.
                </p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Organize Your Contacts</h4>
                <p className="text-xs text-gray-600">
                  Import and organize your customer contacts for better management.
                </p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Create Templates</h4>
                <p className="text-xs text-gray-600">
                  Save time by creating message templates for common communications.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold">
                  {dataLoading ? '...' : stats.totalMessages}
                </p>
              </div>
              <Send className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Contacts</p>
                <p className="text-2xl font-bold">
                  {dataLoading ? '...' : stats.totalContacts}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Templates</p>
                <p className="text-2xl font-bold">
                  {dataLoading ? '...' : stats.totalTemplates}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold">
                  {dataLoading ? '...' : stats.messagesDelivered}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;