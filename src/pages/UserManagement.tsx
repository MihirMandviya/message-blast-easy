import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Plus, Phone, Key } from 'lucide-react';

export default function UserManagement() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappApiKey, setWhatsappApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          business_name: businessName || 'My Business'
        }
      });

      if (error) {
        throw error;
      }

      // Update the profile with WhatsApp details
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            whatsapp_number: whatsappNumber,
            whatsapp_api_key: whatsappApiKey,
            business_name: businessName || 'My Business'
          })
          .eq('user_id', data.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }

      toast({
        title: "Client Created Successfully",
        description: `Client ${email} has been created with WhatsApp integration`,
      });

      // Clear form
      setEmail('');
      setPassword('');
      setBusinessName('');
      setWhatsappNumber('');
      setWhatsappApiKey('');

    } catch (error: any) {
      toast({
        title: "Error Creating User",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestUser = async () => {
    setEmail('client@test.com');
    setPassword('password123');
    setBusinessName('Test Business');
    setWhatsappNumber('+1234567890');
    setWhatsappApiKey('test-api-key-123');
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Client Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name (Optional)</Label>
              <Input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Business Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappNumber" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                WhatsApp Number
              </Label>
              <Input
                id="whatsappNumber"
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g., +1234567890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappApiKey" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                WhatsApp API Key
              </Label>
              <Input
                id="whatsappApiKey"
                type="password"
                value={whatsappApiKey}
                onChange={(e) => setWhatsappApiKey(e.target.value)}
                placeholder="Enter WhatsApp API key"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Client
                    </>
                  )}
              </Button>
              
              <Button type="button" variant="outline" onClick={createTestUser}>
                Fill Test Data
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Test Client</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            For quick testing, you can create a client with these credentials:
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <p><strong>Email:</strong> client@test.com</p>
            <p><strong>Password:</strong> password123</p>
            <p><strong>WhatsApp Number:</strong> +1234567890</p>
            <p><strong>API Key:</strong> test-api-key-123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}