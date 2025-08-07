import React, { useState, useMemo } from 'react';
import { useMedia } from '@/hooks/useMedia';
import { useClientAuth } from '@/hooks/useClientAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Search, Image, Video, FileText, Music, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

const MediaManagement: React.FC = () => {
  const { media, isLoading, error, lastSync, syncMediaWithDatabase, getMediaByType } = useMedia();
  const { client } = useClientAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredMedia = useMemo(() => {
    let filtered = media;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.media_type === selectedType);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    return filtered;
  }, [media, searchTerm, selectedType, selectedStatus]);

  const mediaByType = {
    image: getMediaByType('image'),
    video: getMediaByType('video'),
    doc: getMediaByType('doc'),
    audio: getMediaByType('audio')
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'doc':
        return <FileText className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
  };

  const handleSyncMedia = async () => {
    await syncMediaWithDatabase();
  };

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert>
          <AlertDescription>Please log in to access media management.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Management</h1>
          <p className="text-muted-foreground">
            Manage your WhatsApp media files and attachments
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSyncMedia} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isLoading ? 'Syncing...' : 'Sync Media'}
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>Total Media: {media.length}</span>
          <span>Images: {mediaByType.image.length}</span>
          <span>Videos: {mediaByType.video.length}</span>
          <span>Documents: {mediaByType.doc.length}</span>
          <span>Audio: {mediaByType.audio.length}</span>
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
            placeholder="Search media by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="doc">Documents</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Media Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Media ({filteredMedia.length})</TabsTrigger>
          <TabsTrigger value="image">Images ({mediaByType.image.length})</TabsTrigger>
          <TabsTrigger value="video">Videos ({mediaByType.video.length})</TabsTrigger>
          <TabsTrigger value="doc">Documents ({mediaByType.doc.length})</TabsTrigger>
          <TabsTrigger value="audio">Audio ({mediaByType.audio.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <MediaGrid media={filteredMedia} />
        </TabsContent>
        <TabsContent value="image" className="space-y-4">
          <MediaGrid media={mediaByType.image} />
        </TabsContent>
        <TabsContent value="video" className="space-y-4">
          <MediaGrid media={mediaByType.video} />
        </TabsContent>
        <TabsContent value="doc" className="space-y-4">
          <MediaGrid media={mediaByType.doc} />
        </TabsContent>
        <TabsContent value="audio" className="space-y-4">
          <MediaGrid media={mediaByType.audio} />
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {filteredMedia.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Image className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No media found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Your media files will appear here once synced.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface MediaGridProps {
  media: any[];
}

const MediaGrid: React.FC<MediaGridProps> = ({ media }) => {
  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'doc':
        return <FileText className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {media.map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getMediaIcon(item.media_type)}
                <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                  {item.status}
                </Badge>
              </div>
              <Badge variant="outline" className="text-xs">
                {item.media_type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="font-semibold text-sm truncate" title={item.name}>
                {item.name}
              </h3>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2" title={item.description}>
                  {item.description}
                </p>
              )}
            </div>
            
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Created: {formatDate(item.creation_time)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>ID: {item.media_id}</span>
              </div>
              {item.waba_number && (
                <div className="flex items-center space-x-1">
                  <span>WABA: {item.waba_number}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MediaManagement; 