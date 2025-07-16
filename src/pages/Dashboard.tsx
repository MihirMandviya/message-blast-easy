import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Users, Send, BarChart3, TrendingUp, CheckCircle, XCircle, Clock, Plus, Phone, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface MessageStats {
  total: number;
  sent: number;
  pending: number;
  failed: number;
  deliveryRate: number;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface DailyStats {
  date: string;
  messages: number;
  success: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<MessageStats>({
    total: 0,
    sent: 0,
    pending: 0,
    failed: 0,
    deliveryRate: 0
  });
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [recentContacts, setRecentContacts] = useState<any[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickSendLoading, setQuickSendLoading] = useState(false);
  const [quickPhone, setQuickPhone] = useState('');
  const [quickMessage, setQuickMessage] = useState('');
  const [quickMessageType, setQuickMessageType] = useState('text');
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Chart colors
  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  useEffect(() => {
    if (session) {
      fetchAllData();
      setupRealtimeSubscription();
    }
  }, [session]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('dashboard-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchAllData(); // Refresh data when messages change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchStats(),
      fetchRecentMessages(),
      fetchRecentContacts(),
      fetchDailyStats()
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('status');

      if (error) throw error;

      const total = data.length;
      const sent = data.filter(m => m.status === 'sent').length;
      const pending = data.filter(m => m.status === 'pending').length;
      const failed = data.filter(m => m.status === 'failed').length;
      const deliveryRate = total > 0 ? Math.round((sent / total) * 100) : 0;

      setStats({ total, sent, pending, failed, deliveryRate });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentMessages(data || []);
    } catch (error) {
      console.error('Error fetching recent messages:', error);
    }
  };

  const fetchRecentContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('recipient_phone')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Get unique contacts
      const uniqueContacts = [...new Set(data.map(m => m.recipient_phone))].slice(0, 5);
      setRecentContacts(uniqueContacts.map(phone => ({ phone })));
    } catch (error) {
      console.error('Error fetching recent contacts:', error);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('created_at, status')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const dailyData: { [key: string]: { total: number; success: number } } = {};
      
      data.forEach(message => {
        const date = new Date(message.created_at).toLocaleDateString();
        if (!dailyData[date]) {
          dailyData[date] = { total: 0, success: 0 };
        }
        dailyData[date].total++;
        if (message.status === 'sent') {
          dailyData[date].success++;
        }
      });

      const chartData = Object.entries(dailyData).map(([date, stats]) => ({
        date,
        messages: stats.total,
        success: stats.success
      }));

      setDailyStats(chartData);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    }
  };

  const handleQuickSend = async () => {
    if (!quickPhone || !quickMessage) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setQuickSendLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          recipient_phone: quickPhone,
          message_content: quickMessage,
          message_type: quickMessageType
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Message Sent!",
          description: `Message sent to ${quickPhone}`,
        });
        setQuickPhone('');
        setQuickMessage('');
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setQuickSendLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const chartData: ChartData[] = [
    { name: 'Sent', value: stats.sent, color: '#10B981' },
    { name: 'Pending', value: stats.pending, color: '#F59E0B' },
    { name: 'Failed', value: stats.failed, color: '#EF4444' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your WhatsApp messaging activity
          </p>
        </div>
        <Button onClick={() => navigate('/send')} className="gap-2">
          <Plus className="h-4 w-4" />
          Send Message
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? `${Math.round((stats.sent/stats.total)*100)}% of total` : 'No messages yet'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Messages</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pending > 0 ? 'Awaiting delivery' : 'All messages processed'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.failed > 0 ? `${stats.failed} failed` : 'All successful'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deliveryRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? 'Success rate' : 'No data available'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Message Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Message Status Distribution</CardTitle>
            <CardDescription>Breakdown of message statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Messages sent over the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="messages" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="success" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activity data</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Send and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Send */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Send
            </CardTitle>
            <CardDescription>Send a message quickly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Phone number"
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Select value={quickMessageType} onValueChange={setQuickMessageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Message</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Your message..."
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              onClick={handleQuickSend} 
              disabled={quickSendLoading}
              className="w-full"
            >
              {quickSendLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Messages
            </CardTitle>
            <CardDescription>Your latest messages</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMessages.length > 0 ? (
              <div className="space-y-3">
                {recentMessages.map((message) => (
                  <div key={message.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.recipient_phone}</span>
                        {getStatusIcon(message.status)}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {message.message_content}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/messages')}
                  className="w-full"
                >
                  View All
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Contacts
            </CardTitle>
            <CardDescription>Frequently messaged contacts</CardDescription>
          </CardHeader>
          <CardContent>
            {recentContacts.length > 0 ? (
              <div className="space-y-3">
                {recentContacts.map((contact, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{contact.phone}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setQuickPhone(contact.phone);
                      }}
                    >
                      Message
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No contacts yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;