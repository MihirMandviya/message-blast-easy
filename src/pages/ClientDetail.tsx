import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, 
  ArrowLeft,
  Users,
  MessageSquare,
  FileText,
  Image,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Settings,
  Activity,
  Eye,
  Plus,
  Trash2,
  Edit,
  ExternalLink
} from 'lucide-react';

interface Client {
  id: string;
  org_id: string;
  business_name: string;
  email: string;
  phone_no: string;
  wt_business_no: string;
  api_key: string;
  user_id: string;
  password: string;
  is_active: boolean;
  subscription_plan: string;
  subscription_start_date: string;
  subscription_end_date: string;
  max_users: number;
  max_contacts: number;
  max_campaigns: number;
  created_at: string;
  updated_at: string;
}

interface ClientUser {
  id: string;
  name: string;
  email: string;
  mem_password: string;
  user_id: string;
  password: string;
  whatsapp_api_key: string;
  whatsapp_number: string;
  business_name: string;
  phone_number: string;
  is_active: boolean;
  is_primary_user: boolean;
  client_id: string;
  created_at: string;
  updated_at: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  message_content: string;
  message_type: string;
  status: string;
  scheduled_for: string;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  client_id: string;
  group_id: string;
  template_id: string;
}

interface Template {
  id: string;
  template_name: string;
  template_body: string;
  template_header: string;
  template_footer: string;
  whatsapp_status: string;
  system_status: string;
  media_type: string;
  language: string;
  category: string;
  creation_time: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  client_id: string;
}

interface Media {
  id: string;
  name: string;
  description: string;
  media_type: string;
  media_id: string;
  status: string;
  creation_time: number;
  waba_number: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  client_id: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  tags: string[];
  custom_fields: any;
  notes: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  client_id: string;
  group_id: string;
}

interface ContactList {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  client_id: string;
}

export default function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin } = useAdminAuth();
  
  const [client, setClient] = useState<Client | null>(null);
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      
      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // First fetch users, then fetch related data
      await fetchUsers();
      
      // Now fetch related data that depends on users
      await Promise.all([
        fetchCampaigns(),
        fetchTemplates(),
        fetchMedia(),
        fetchContacts(),
        fetchContactLists()
      ]);

    } catch (error) {
      console.error('Error fetching client data:', error);
      toast({
        title: "Error",
        description: "Failed to load client data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('client_users')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (!error) setUsers(data || []);
  };

  const fetchCampaigns = async () => {
    // Get campaigns using user_id from client_users
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .in('user_id', users.map(u => u.id))
      .order('created_at', { ascending: false });

    if (!error) setCampaigns(data || []);
  };

  const fetchTemplates = async () => {
    // Get templates using user_id from client_users
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .in('user_id', users.map(u => u.id))
      .order('created_at', { ascending: false });

    if (!error) setTemplates(data || []);
  };

  const fetchMedia = async () => {
    // Get media using user_id from client_users
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .in('user_id', users.map(u => u.id))
      .order('created_at', { ascending: false });

    if (!error) setMedia(data || []);
  };

  const fetchContacts = async () => {
    // Get contacts using user_id from client_users
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .in('user_id', users.map(u => u.id))
      .order('created_at', { ascending: false });

    if (!error) setContacts(data || []);
  };

  const fetchContactLists = async () => {
    // Get contact lists using user_id from client_users
    const { data, error } = await supabase
      .from('contact_lists')
      .select('*')
      .in('user_id', users.map(u => u.id))
      .order('created_at', { ascending: false });

    if (!error) setContactLists(data || []);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('client_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully"
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Client not found</h2>
          <Button onClick={() => navigate('/admin/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              {client.business_name}
            </h1>
            <p className="text-muted-foreground mt-2">
              Client ID: {client.user_id}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Client
          </Button>
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            View as Client
          </Button>
        </div>
      </div>

      {/* Client Info Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-card/80 to-card shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span>{client.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Phone:</span>
                <span>{client.phone_no || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Created:</span>
                <span>{new Date(client.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Plan:</span>
                <Badge variant="outline">{client.subscription_plan}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Status:</span>
                <Badge className={client.is_active ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}>
                  {client.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">WhatsApp:</span>
                <span>{client.wt_business_no || 'Not set'}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium mb-2">Limits</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="font-medium">{client.max_users}</div>
                    <div className="text-xs text-muted-foreground">Users</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="font-medium">{client.max_contacts}</div>
                    <div className="text-xs text-muted-foreground">Contacts</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="font-medium">{client.max_campaigns}</div>
                    <div className="text-xs text-muted-foreground">Campaigns</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="media">Media ({media.length})</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  {users.filter(u => u.is_active).length} active
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-500/20 bg-gradient-to-br from-green-500/10 to-green-500/5 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
                <MessageSquare className="h-4 w-4 text-green-500" />
              </CardHeader>
                             <CardContent>
                 <div className="text-2xl font-bold text-green-600">{campaigns.length}</div>
                 <p className="text-xs text-muted-foreground">
                   {campaigns.filter(c => c.status === 'active').length} active
                 </p>
               </CardContent>
             </Card>

             <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-500/5 shadow-lg">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">Templates</CardTitle>
                 <FileText className="h-4 w-4 text-purple-500" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-purple-600">{templates.length}</div>
                 <p className="text-xs text-muted-foreground">
                   {templates.filter(t => t.whatsapp_status === 'APPROVED').length} approved
                 </p>
              </CardContent>
            </Card>

            <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-500/5 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contacts</CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{contacts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {contactLists.length} contact lists
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-primary/20 bg-gradient-to-br from-card/80 to-card shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">Campaign created</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="border-primary/20 bg-gradient-to-br from-card/80 to-card shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Client Users
                </CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge className={user.is_active ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {user.is_primary_user && (
                          <Badge variant="outline">Primary</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {users.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No users found</h3>
                    <p className="text-muted-foreground">This client has no users yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card className="border-primary/20 bg-gradient-to-br from-card/80 to-card shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Campaigns
                </CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={campaign.status === 'active' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'}>
                          {campaign.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {campaigns.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
                    <p className="text-muted-foreground">This client has no campaigns yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card className="border-primary/20 bg-gradient-to-br from-card/80 to-card shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Templates
                </CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                                 {templates.map((template) => (
                   <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                     <div className="flex-1">
                       <h3 className="font-semibold">{template.template_name}</h3>
                       <p className="text-sm text-muted-foreground line-clamp-2">{template.template_body}</p>
                       <div className="flex items-center gap-2 mt-2">
                         <Badge className={template.whatsapp_status === 'APPROVED' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'}>
                           {template.whatsapp_status}
                         </Badge>
                         <span className="text-sm text-muted-foreground">
                           {new Date(template.created_at).toLocaleDateString()}
                         </span>
                       </div>
                     </div>
                     <div className="flex gap-2">
                       <Button variant="outline" size="sm">
                         <Eye className="h-4 w-4" />
                       </Button>
                       <Button variant="outline" size="sm">
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="destructive" size="sm">
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                 ))}
                
                {templates.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                    <p className="text-muted-foreground">This client has no templates yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card className="border-primary/20 bg-gradient-to-br from-card/80 to-card shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  Media Files
                </CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Media
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {media.map((item) => (
                   <div key={item.id} className="border rounded-lg p-4">
                     <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                       <Image className="h-8 w-8 text-muted-foreground" />
                     </div>
                     <h3 className="font-semibold text-sm">{item.name}</h3>
                     <p className="text-xs text-muted-foreground">{item.media_type}</p>
                     <div className="flex gap-2 mt-3">
                       <Button variant="outline" size="sm" className="flex-1">
                         <Eye className="h-4 w-4" />
                       </Button>
                       <Button variant="destructive" size="sm">
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                 ))}
                
                {media.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No media files found</h3>
                    <p className="text-muted-foreground">This client has no media files yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card className="border-primary/20 bg-gradient-to-br from-card/80 to-card shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Contacts
                </CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                                 {contacts.map((contact) => (
                   <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                     <div className="flex-1">
                       <h3 className="font-semibold">{contact.name}</h3>
                       <div className="flex items-center gap-4 text-sm text-muted-foreground">
                         <span>{contact.phone}</span>
                         {contact.email && <span>{contact.email}</span>}
                         <span>{new Date(contact.created_at).toLocaleDateString()}</span>
                       </div>
                     </div>
                     <div className="flex gap-2">
                       <Button variant="outline" size="sm">
                         <Eye className="h-4 w-4" />
                       </Button>
                       <Button variant="outline" size="sm">
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="destructive" size="sm">
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                 ))}
                
                {contacts.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
                    <p className="text-muted-foreground">This client has no contacts yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
