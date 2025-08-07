import React, { useState, useMemo } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import { useClientAuth } from '@/hooks/useClientAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Search, MessageSquare, FileText, Image, Video, Music, Calendar, Clock, Globe, Tag } from 'lucide-react';
import { format } from 'date-fns';

const TemplateManagement: React.FC = () => {
  const { templates, isLoading, error, lastSync, syncTemplatesWithDatabase, getTemplatesByCategory, getTemplatesByLanguage, getTemplatesByMediaType } = useTemplates();
  const { client } = useClientAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('all');

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.template_body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.template_header?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.template_footer?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by language
    if (selectedLanguage !== 'all') {
      filtered = filtered.filter(item => item.language === selectedLanguage);
    }

    // Filter by media type
    if (selectedMediaType !== 'all') {
      filtered = filtered.filter(item => item.media_type === selectedMediaType);
    }

    return filtered;
  }, [templates, searchTerm, selectedCategory, selectedLanguage, selectedMediaType]);

  const templatesByCategory = {
    marketing: getTemplatesByCategory('MARKETING'),
    utility: getTemplatesByCategory('UTILITY'),
    authentication: getTemplatesByCategory('AUTHENTICATION')
  };

  const templatesByLanguage = {
    english: getTemplatesByLanguage('en'),
    marathi: getTemplatesByLanguage('mr'),
    hindi: getTemplatesByLanguage('hi')
  };

  const templatesByMediaType = {
    text: getTemplatesByMediaType('text'),
    media: getTemplatesByMediaType('media'),
    image: getTemplatesByMediaType('image'),
    video: getTemplatesByMediaType('video'),
    audio: getTemplatesByMediaType('audio')
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <MessageSquare className="h-4 w-4" />;
      case 'media':
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getLanguageName = (code: string) => {
    switch (code) {
      case 'en':
        return 'English';
      case 'mr':
        return 'Marathi';
      case 'hi':
        return 'Hindi';
      default:
        return code.toUpperCase();
    }
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
  };

  const handleSyncTemplates = async () => {
    await syncTemplatesWithDatabase();
  };

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert>
          <AlertDescription>Please log in to access template management.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template Management</h1>
          <p className="text-muted-foreground">
            Manage your WhatsApp message templates
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSyncTemplates} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isLoading ? 'Syncing...' : 'Sync Templates'}
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>Total Templates: {templates.length}</span>
          <span>Marketing: {templatesByCategory.marketing.length}</span>
          <span>Utility: {templatesByCategory.utility.length}</span>
          <span>English: {templatesByLanguage.english.length}</span>
          <span>Marathi: {templatesByLanguage.marathi.length}</span>
        </div>
        {lastSync && (
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Last synced: {format(lastSync, 'MMM dd, yyyy HH:mm:ss')}</span>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search templates by name or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="MARKETING">Marketing</SelectItem>
            <SelectItem value="UTILITY">Utility</SelectItem>
            <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="mr">Marathi</SelectItem>
            <SelectItem value="hi">Hindi</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedMediaType} onValueChange={setSelectedMediaType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by media type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Templates ({filteredTemplates.length})</TabsTrigger>
          <TabsTrigger value="marketing">Marketing ({templatesByCategory.marketing.length})</TabsTrigger>
          <TabsTrigger value="utility">Utility ({templatesByCategory.utility.length})</TabsTrigger>
          <TabsTrigger value="english">English ({templatesByLanguage.english.length})</TabsTrigger>
          <TabsTrigger value="marathi">Marathi ({templatesByLanguage.marathi.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <TemplateGrid templates={filteredTemplates} />
        </TabsContent>
        <TabsContent value="marketing" className="space-y-4">
          <TemplateGrid templates={templatesByCategory.marketing} />
        </TabsContent>
        <TabsContent value="utility" className="space-y-4">
          <TemplateGrid templates={templatesByCategory.utility} />
        </TabsContent>
        <TabsContent value="english" className="space-y-4">
          <TemplateGrid templates={templatesByLanguage.english} />
        </TabsContent>
        <TabsContent value="marathi" className="space-y-4">
          <TemplateGrid templates={templatesByLanguage.marathi} />
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {filteredTemplates.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || selectedCategory !== 'all' || selectedLanguage !== 'all' || selectedMediaType !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Your templates will appear here once synced.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface TemplateGridProps {
  templates: any[];
}

const TemplateGrid: React.FC<TemplateGridProps> = ({ templates }) => {
  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <MessageSquare className="h-4 w-4" />;
      case 'media':
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getLanguageName = (code: string) => {
    switch (code) {
      case 'en':
        return 'English';
      case 'mr':
        return 'Marathi';
      case 'hi':
        return 'Hindi';
      default:
        return code.toUpperCase();
    }
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card key={template.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getMediaTypeIcon(template.media_type)}
                <Badge variant={template.whatsapp_status === 'enabled' ? 'default' : 'secondary'}>
                  {template.whatsapp_status}
                </Badge>
                <Badge variant={template.system_status === 'enabled' ? 'default' : 'secondary'}>
                  {template.system_status}
                </Badge>
              </div>
              <Badge variant="outline" className="text-xs">
                {template.media_type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="font-semibold text-sm truncate" title={template.template_name}>
                {template.template_name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{getLanguageName(template.language)}</span>
                <Tag className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{template.category}</span>
              </div>
            </div>
            
            {/* Template Content Preview */}
            <div className="space-y-2">
              {template.template_header && (
                <div className="text-xs text-muted-foreground">
                  <strong>Header:</strong> {template.template_header}
                </div>
              )}
              {template.template_body && (
                <div className="text-xs text-muted-foreground">
                  <strong>Body:</strong> {template.template_body.length > 100 
                    ? `${template.template_body.substring(0, 100)}...` 
                    : template.template_body}
                </div>
              )}
              {template.template_footer && (
                <div className="text-xs text-muted-foreground">
                  <strong>Footer:</strong> {template.template_footer}
                </div>
              )}
              {template.buttons1_title && (
                <div className="text-xs text-muted-foreground">
                  <strong>Button:</strong> {template.buttons1_title} ({template.buttons1_type})
                </div>
              )}
            </div>
            
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Created: {formatDate(template.creation_time)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TemplateManagement;