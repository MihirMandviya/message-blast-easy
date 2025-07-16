import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Eye, UserPlus, Settings, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface ClientUser {
  id: string;
  email: string;
  business_name: string;
  phone_number: string;
  whatsapp_api_key: string | null;
  whatsapp_number: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
  subscription_plan: string;
  subscription_expires_at: string | null;
}

const ClientManagement = () => {
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientUser | null>(null);
  const [newClient, setNewClient] = useState({
    email: '',
    business_name: '',
    phone_number: '',
    whatsapp_api_key: '',
    whatsapp_number: '',
    subscription_plan: 'basic'
  });
  const { toast } = useToast();
  const { admin } = useAdminAuth();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('client_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const generateApiKey = () => {
    return 'wh_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleCreateClient = async () => {
    if (!admin) return;

    const password = generatePassword();
    const apiKey = generateApiKey();

    try {
      const { error } = await supabase
        .from('client_users')
        .insert([{
          email: newClient.email,
          password_hash: '$2b$10$' + btoa(password), // In production, use proper hashing
          business_name: newClient.business_name,
          phone_number: newClient.phone_number,
          whatsapp_api_key: apiKey,
          whatsapp_number: newClient.whatsapp_number,
          subscription_plan: newClient.subscription_plan,
          created_by: admin.id
        }]);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_logs').insert([{
        admin_id: admin.id,
        action: 'CREATE_CLIENT',
        target_type: 'client',
        details: { client_email: newClient.email, generated_password: password, api_key: apiKey }
      }]);

      toast({
        title: "Success",
        description: `Client created successfully. Password: ${password}`,
        duration: 10000
      });

      setIsCreateDialogOpen(false);
      setNewClient({
        email: '',
        business_name: '',
        phone_number: '',
        whatsapp_api_key: '',
        whatsapp_number: '',
        subscription_plan: 'basic'
      });
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive"
      });
    }
  };

  const handleUpdateClient = async () => {
    if (!editingClient || !admin) return;

    try {
      const { error } = await supabase
        .from('client_users')
        .update({
          business_name: editingClient.business_name,
          phone_number: editingClient.phone_number,
          whatsapp_api_key: editingClient.whatsapp_api_key,
          whatsapp_number: editingClient.whatsapp_number,
          subscription_plan: editingClient.subscription_plan,
          is_active: editingClient.is_active
        })
        .eq('id', editingClient.id);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_logs').insert([{
        admin_id: admin.id,
        action: 'UPDATE_CLIENT',
        target_type: 'client',
        target_id: editingClient.id,
        details: { client_email: editingClient.email }
      }]);

      toast({
        title: "Success",
        description: "Client updated successfully"
      });

      setEditingClient(null);
      fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!admin) return;

    if (confirm('Are you sure you want to delete this client?')) {
      try {
        const { error } = await supabase
          .from('client_users')
          .delete()
          .eq('id', clientId);

        if (error) throw error;

        // Log admin action
        await supabase.from('admin_logs').insert([{
          admin_id: admin.id,
          action: 'DELETE_CLIENT',
          target_type: 'client',
          target_id: clientId
        }]);

        toast({
          title: "Success",
          description: "Client deleted successfully"
        });

        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        toast({
          title: "Error",
          description: "Failed to delete client",
          variant: "destructive"
        });
      }
    }
  };

  const resetPassword = async (clientId: string, email: string) => {
    if (!admin) return;

    const newPassword = generatePassword();
    
    try {
      const { error } = await supabase
        .from('client_users')
        .update({
          password_hash: '$2b$10$' + btoa(newPassword) // In production, use proper hashing
        })
        .eq('id', clientId);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_logs').insert([{
        admin_id: admin.id,
        action: 'RESET_PASSWORD',
        target_type: 'client',
        target_id: clientId,
        details: { client_email: email, new_password: newPassword }
      }]);

      toast({
        title: "Success",
        description: `Password reset successfully. New password: ${newPassword}`,
        duration: 10000
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive"
      });
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Client Management</h2>
          <p className="text-muted-foreground">Manage your WhatsApp business clients</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
              <DialogDescription>
                Add a new client to the system. Password and API key will be generated automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  value={newClient.business_name}
                  onChange={(e) => setNewClient({ ...newClient, business_name: e.target.value })}
                  placeholder="Business Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={newClient.phone_number}
                  onChange={(e) => setNewClient({ ...newClient, phone_number: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                <Input
                  id="whatsapp_number"
                  value={newClient.whatsapp_number}
                  onChange={(e) => setNewClient({ ...newClient, whatsapp_number: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscription_plan">Subscription Plan</Label>
                <Select value={newClient.subscription_plan} onValueChange={(value) => setNewClient({ ...newClient, subscription_plan: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateClient} className="w-full">
                Create Client
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            Total clients: {clients.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.business_name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone_number}</TableCell>
                  <TableCell>
                    <Badge variant={client.subscription_plan === 'enterprise' ? 'default' : 'secondary'}>
                      {client.subscription_plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.is_active ? 'default' : 'destructive'}>
                      {client.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {client.last_login ? new Date(client.last_login).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingClient(client)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetPassword(client.id, client.email)}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClient(client.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Client Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information
            </DialogDescription>
          </DialogHeader>
          {editingClient && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_business_name">Business Name</Label>
                <Input
                  id="edit_business_name"
                  value={editingClient.business_name}
                  onChange={(e) => setEditingClient({ ...editingClient, business_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone_number">Phone Number</Label>
                <Input
                  id="edit_phone_number"
                  value={editingClient.phone_number}
                  onChange={(e) => setEditingClient({ ...editingClient, phone_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_whatsapp_number">WhatsApp Number</Label>
                <Input
                  id="edit_whatsapp_number"
                  value={editingClient.whatsapp_number || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, whatsapp_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_subscription_plan">Subscription Plan</Label>
                <Select value={editingClient.subscription_plan} onValueChange={(value) => setEditingClient({ ...editingClient, subscription_plan: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleUpdateClient} className="w-full">
                Update Client
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientManagement;