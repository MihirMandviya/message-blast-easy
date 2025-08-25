import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Loader2 } from 'lucide-react';

interface AddUserFormProps {
  clientId: string;
  onUserAdded: () => void;
}

export default function AddUserForm({ clientId, onUserAdded }: AddUserFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { admin } = useAdminAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone_number: '',
    business_name: '',
    whatsapp_api_key: '',
    whatsapp_number: '',
    is_primary_user: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!admin) {
      toast({
        title: "Error",
        description: "Admin authentication required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Insert new user into client_users table
      const { data, error } = await supabase
        .from('client_users')
        .insert({
          name: formData.name,
          email: formData.email,
          password: formData.password, // In production, this should be hashed
          phone_number: formData.phone_number,
          business_name: formData.business_name,
          whatsapp_api_key: formData.whatsapp_api_key || null,
          whatsapp_number: formData.whatsapp_number || null,
          client_id: clientId,
          created_by: admin.id,
          is_primary_user: formData.is_primary_user,
          is_active: true,
          subscription_plan: 'basic'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "User added successfully"
      });

      // Reset form and close dialog
      setFormData({
        name: '',
        email: '',
        password: '',
        phone_number: '',
        business_name: '',
        whatsapp_api_key: '',
        whatsapp_number: '',
        is_primary_user: false
      });
      
      setOpen(false);
      onUserAdded();

    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Add a new user to this client organization. Fill in the required information below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name *</Label>
            <Input
              id="business_name"
              name="business_name"
              value={formData.business_name}
              onChange={handleInputChange}
              placeholder="Enter business name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp_api_key">WhatsApp API Key</Label>
              <Input
                id="whatsapp_api_key"
                name="whatsapp_api_key"
                value={formData.whatsapp_api_key}
                onChange={handleInputChange}
                placeholder="Enter WhatsApp API key"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
              <Input
                id="whatsapp_number"
                name="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={handleInputChange}
                placeholder="Enter WhatsApp number"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_primary_user"
              name="is_primary_user"
              checked={formData.is_primary_user}
              onChange={handleInputChange}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_primary_user">Primary User</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
