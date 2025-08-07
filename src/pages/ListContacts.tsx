import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Edit, Trash2, Search, Mail, Phone, ArrowLeft, Download, Import, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useClientAuth } from '@/hooks/useClientAuth';
import { supabase } from '@/integrations/supabase/client';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  group_id: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const ListContacts = () => {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { client } = useClientAuth();
  const { toast } = useToast();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const [importing, setImporting] = useState(false);

  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    tags: '',
    notes: ''
  });

  useEffect(() => {
    if (listId && client) {
      loadGroupAndContacts();
    }
  }, [listId, client]);

  const loadGroupAndContacts = async () => {
    if (!listId || !client) return;

    setLoading(true);
    try {
      // Load group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', listId)
        .eq('client_id', client.id)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Load contacts in this group
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('group_id', listId)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load list and contacts: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async () => {
    if (!client || !listId) return;

    // Basic validation
    if (!newContact.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a contact name",
        variant: "destructive",
      });
      return;
    }

    if (!newContact.phone.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      const contactData = {
        name: newContact.name.trim(),
        phone: newContact.phone.trim(),
        email: newContact.email.trim() || null,
        tags: newContact.tags ? newContact.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        notes: newContact.notes.trim() || null,
        user_id: client.id,
        client_id: client.id,
        group_id: listId
      };

      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert([contactData])
        .select()
        .single();

      if (contactError) throw contactError;

      toast({
        title: "Success",
        description: "Contact created successfully",
      });

      setNewContact({ name: '', phone: '', email: '', tags: '', notes: '' });
      setIsCreateDialogOpen(false);
      loadGroupAndContacts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateContact = async () => {
    if (!editingContact || !client) return;

    try {
      const updates = {
        name: editingContact.name,
        phone: editingContact.phone,
        email: editingContact.email || null,
        tags: editingContact.tags,
        notes: editingContact.notes || null
      };

      const { error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', editingContact.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact updated successfully",
      });

      setEditingContact(null);
      loadGroupAndContacts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });

      loadGroupAndContacts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Error",
        description: "Please select a valid CSV file",
        variant: "destructive",
      });
      return;
    }

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  };

  const handleImportCSV = async () => {
    if (!client || !csvContent.trim() || !listId) return;

    setImporting(true);
    try {
      const { data, error } = await supabase.rpc('import_contacts_from_csv', {
        csv_data: csvContent,
        group_id: listId,
        client_id: client.id
      });

      if (error) throw error;

      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.inserted_count} contacts. ${data.error_count} errors.`,
        duration: 5000,
      });

      setCsvContent('');
      setCsvFile(null);
      setIsImportDialogOpen(false);
      loadGroupAndContacts();
    } catch (error: any) {
      toast({
        title: "Import Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!client || !listId) return;

    try {
      const { data, error } = await supabase.rpc('export_contacts_to_csv', {
        group_id: listId,
        client_id: client.id
      });

      if (error) throw error;

      // Create and download CSV file
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts_${group?.name}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Contacts exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Export Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">List not found</h3>
        <Button onClick={() => navigate('/contacts')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contacts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-success via-success/90 to-success/80 -mx-6 -mt-6 px-6 py-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/contacts')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
          <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">{group.name}</h2>
            {group.description && (
              <p className="text-white/90 text-lg">{group.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-white/90">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {contacts.length} contacts
          </span>
          <span className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {contacts.filter(c => c.email).length} with email
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts in this list..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Import className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Contact to {group.name}</DialogTitle>
                <DialogDescription>
                  Create a new contact in this list
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={newContact.tags}
                    onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
                    placeholder="customer, vip, lead"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newContact.notes}
                    onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                    placeholder="Add any notes about this contact..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateContact}>
                    Create Contact
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContacts.map((contact) => (
          <Card key={contact.id} className="card-enhanced hover-lift">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{contact.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  {contact.email && (
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingContact(contact)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteContact(contact.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {contact.tags.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {contact.notes && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {contact.notes}
                </p>
              )}
              <div className="text-xs text-muted-foreground">
                Added {new Date(contact.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No contacts found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? 'Try adjusting your search criteria' 
              : 'Add your first contact to this list'}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Contact
          </Button>
        </div>
      )}

      {/* Import CSV Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Contacts to {group.name}</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import contacts into this list. The file should have columns: name, phone, email, tags, notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">CSV File</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-file"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('csv-file')?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose CSV File
                </Button>
              </div>
              {csvFile && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-muted rounded">
                  <span className="text-sm">{csvFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCsvFile(null);
                      setCsvContent('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {csvContent && (
              <div>
                <Label>Preview (first 5 rows)</Label>
                <div className="mt-2 p-3 bg-muted rounded text-sm font-mono max-h-32 overflow-y-auto">
                  {csvContent.split('\n').slice(0, 6).join('\n')}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleImportCSV} 
                disabled={!csvContent.trim() || importing}
              >
                {importing ? 'Importing...' : 'Import Contacts'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information
            </DialogDescription>
          </DialogHeader>
          {editingContact && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={editingContact.name}
                  onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone Number *</Label>
                <Input
                  id="edit-phone"
                  value={editingContact.phone}
                  onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingContact.email || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="edit-tags">Tags</Label>
                <Input
                  id="edit-tags"
                  value={editingContact.tags.join(', ')}
                  onChange={(e) => setEditingContact({ 
                    ...editingContact, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  placeholder="customer, vip, lead"
                />
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editingContact.notes || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, notes: e.target.value })}
                  placeholder="Add any notes about this contact..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingContact(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateContact}>
                  Update Contact
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListContacts; 