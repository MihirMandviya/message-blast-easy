import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Edit, Trash2, Search, Mail, Phone, UserPlus, Import, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useClientData } from '@/hooks/useClientData';
import { useClientAuth } from '@/hooks/useClientAuth';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

const ContactManagement = () => {
  const { client } = useClientAuth();
  const { 
    contacts, 
    loading, 
    error, 
    addContact, 
    updateContact, 
    deleteContact, 
    refreshData 
  } = useClientData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    tags: '',
    notes: ''
  });
  const { toast } = useToast();

  // Show error if exists
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleCreateContact = async () => {
    if (!client) return;

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

    const contactData = {
      name: newContact.name.trim(),
      phone: newContact.phone.trim(),
      email: newContact.email.trim() || null,
      tags: newContact.tags ? newContact.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      notes: newContact.notes.trim() || null
    };

    const { error } = await addContact(contactData);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Contact created successfully",
      });
      setNewContact({ name: '', phone: '', email: '', tags: '', notes: '' });
      setIsCreateDialogOpen(false);
    }
  };

  const handleUpdateContact = async () => {
    if (!editingContact || !client) return;

    const updates = {
      name: editingContact.name,
      phone: editingContact.phone,
      email: editingContact.email || null,
      tags: editingContact.tags,
      notes: editingContact.notes || null
    };

    const { error } = await updateContact(editingContact.id, updates);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
      setEditingContact(null);
    }
  };

  const handleDeleteContact = async (id: string) => {
    const { error } = await deleteContact(id);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
    }
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-success via-success/90 to-success/80 -mx-6 -mt-6 px-6 py-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold">Contact Management</h2>
        </div>
        <p className="text-white/90 text-lg">
          Manage your customer contacts and organize them with tags and notes
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Import className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline">
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
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>
                  Create a new contact in your database
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-enhanced">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Total Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{contacts.length}</div>
          </CardContent>
        </Card>
        
        <Card className="card-enhanced">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-success" />
              With Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {contacts.filter(c => c.email).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-enhanced">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-info" />
              Active Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-info">
              {contacts.filter(c => 
                new Date(c.updated_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
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
              : 'Add your first contact to get started'}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Contact
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
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

export default ContactManagement;