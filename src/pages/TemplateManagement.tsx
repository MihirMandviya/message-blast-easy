import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Layout, Plus, Edit, Trash2, Copy, Search, Filter, MessageSquare, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

const TemplateManagement = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    category: 'general',
    variables: []
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) 
          ? template.variables.filter((v): v is string => typeof v === 'string')
          : []
      })));
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('templates')
        .insert([{
          ...newTemplate,
          user_id: user.id,
          variables: extractVariables(newTemplate.content)
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template created successfully",
      });

      setNewTemplate({ name: '', content: '', category: 'general', variables: [] });
      setIsCreateDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !user) return;

    try {
      const { error } = await supabase
        .from('templates')
        .update({
          name: editingTemplate.name,
          content: editingTemplate.content,
          category: editingTemplate.category,
          variables: extractVariables(editingTemplate.content)
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template updated successfully",
      });

      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted successfully",
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const extractVariables = (content: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1].trim())) {
        variables.push(match[1].trim());
      }
    }
    
    return variables;
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(templates.map(t => t.category))];

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
      <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 -mx-6 -mt-6 px-6 py-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
            <Layout className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold">Message Templates</h2>
        </div>
        <p className="text-white/90 text-lg">
          Create and manage reusable message templates for your WhatsApp campaigns
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a reusable message template with variables
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content">Message Content</Label>
                <Textarea
                  id="content"
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  placeholder="Enter your message template... Use {{variable}} for dynamic content"
                  rows={6}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Use double curly braces for variables: {`{{name}}, {{company}}, {{date}}`}
                </p>
              </div>
              {extractVariables(newTemplate.content).length > 0 && (
                <div>
                  <Label>Detected Variables</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {extractVariables(newTemplate.content).map(variable => (
                      <Badge key={variable} variant="secondary">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>
                  Create Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="card-enhanced hover-lift">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                    {template.variables.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {template.variables.length} variables
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                {template.content}
              </p>
              {template.variables.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Variables:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map(variable => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Layout className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || categoryFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Create your first message template to get started'}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Template
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update your message template
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editingTemplate.category} onValueChange={(value) => setEditingTemplate({ ...editingTemplate, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-content">Message Content</Label>
                <Textarea
                  id="edit-content"
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                  placeholder="Enter your message template... Use {{variable}} for dynamic content"
                  rows={6}
                />
              </div>
              {extractVariables(editingTemplate.content).length > 0 && (
                <div>
                  <Label>Detected Variables</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {extractVariables(editingTemplate.content).map(variable => (
                      <Badge key={variable} variant="secondary">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateTemplate}>
                  Update Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateManagement;