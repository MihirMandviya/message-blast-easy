import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from './useClientAuth';

interface MediaItem {
  identifier: string;
  creationTime: number;
  description: string;
  mediaType: 'image' | 'video' | 'doc' | 'audio';
  mediaId: string;
  wabaNumber: number;
  status: string;
}

interface MediaResponse {
  status: string;
  mediaList: string;
  statusCode: string;
  reason: string;
}

interface DatabaseMedia {
  id: string;
  user_id: string;
  client_id: string | null;
  name: string;
  creation_time: number;
  description: string | null;
  media_type: string;
  media_id: string;
  status: string;
  waba_number: number | null;
  created_at: string;
  updated_at: string;
}

export const useMedia = () => {
  const { client } = useClientAuth();
  const [media, setMedia] = useState<DatabaseMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchMediaFromAPI = useCallback(async () => {
    console.log('Client data:', client);
    console.log('WhatsApp API Key:', client?.whatsapp_api_key);
    console.log('User ID:', client?.user_id);
    
    // If user_id is not available, try to get it from the database
    let userId = client?.user_id;
    if (!userId && client?.id) {
      try {
        const { data, error } = await supabase
          .from('client_users')
          .select('user_id')
          .eq('id', client.id)
          .single();
        
        if (!error && data?.user_id) {
          userId = data.user_id;
          console.log('Retrieved user_id from database:', userId);
          
          // Update the client data in localStorage with the missing user_id
          const storedSession = localStorage.getItem('client_session');
          if (storedSession) {
            const parsedSession = JSON.parse(storedSession);
            if (parsedSession.client) {
              parsedSession.client.user_id = userId;
              localStorage.setItem('client_session', JSON.stringify(parsedSession));
              console.log('Updated client session with user_id');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user_id:', error);
      }
    }
    
    if (!client?.whatsapp_api_key || !userId) {
      setError(`API credentials not available. API Key: ${!!client?.whatsapp_api_key}, User ID: ${!!userId}`);
      return null;
    }

    try {
      // Use proxy server to bypass CORS
      console.log('Making media API call through proxy');
      
      const response = await fetch('/api/fetch-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          apiKey: client.whatsapp_api_key
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Proxy response data:', data);
      
      if (data.success && data.media) {
        console.log('Returning media data:', data.media);
        return data.media;
      } else {
        // Check if it's an invalid credentials error
        if (data.error && data.error.includes('Invalid credentials')) {
          throw new Error('Invalid API credentials. Please contact your administrator to update your WhatsApp Business API credentials.');
        }
        throw new Error(data.error || 'Failed to fetch media');
      }
    } catch (error) {
      console.error('Error fetching media from API:', error);
      throw error;
    }
  }, [client?.whatsapp_api_key, client?.user_id]);

  const syncMediaWithDatabase = useCallback(async () => {
    if (!client) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch media from API
      const apiMedia = await fetchMediaFromAPI();
      console.log('API Media received:', apiMedia);
      if (!apiMedia) return;

      // Clear existing media for this user
      await supabase
        .from('media')
        .delete()
        .eq('user_id', client.id);

      // Insert new media data
      const mediaToInsert = apiMedia.map(item => ({
        user_id: client.id,
        client_id: client.id,
        name: item.identifier,
        creation_time: item.creationTime,
        description: item.description,
        media_type: item.mediaType,
        media_id: item.mediaId,
        status: item.status,
        waba_number: item.wabaNumber
      }));

      const { data, error } = await supabase
        .from('media')
        .insert(mediaToInsert)
        .select();

      if (error) {
        throw error;
      }

      console.log('Database insert result:', data);
      setMedia(data || []);
      setLastSync(new Date());
    } catch (error) {
      console.error('Error syncing media:', error);
      setError(error instanceof Error ? error.message : 'Failed to sync media');
    } finally {
      setIsLoading(false);
    }
  }, [client, fetchMediaFromAPI]);

  const loadMediaFromDatabase = useCallback(async () => {
    if (!client) return;

    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', client.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('Loaded media from database:', data);
      setMedia(data || []);
    } catch (error) {
      console.error('Error loading media from database:', error);
      setError(error instanceof Error ? error.message : 'Failed to load media');
    }
  }, [client]);

  // Initial load and sync
  useEffect(() => {
    if (client) {
      loadMediaFromDatabase();
      syncMediaWithDatabase();
    }
  }, [client, loadMediaFromDatabase, syncMediaWithDatabase]);

  // Debug effect to log client data
  useEffect(() => {
    if (client) {
      console.log('Client loaded in useMedia:', {
        id: client.id,
        email: client.email,
        whatsapp_api_key: client.whatsapp_api_key ? 'Present' : 'Missing',
        user_id: client.user_id || 'Missing'
      });
    }
  }, [client]);

  // Debug effect to log media state changes
  useEffect(() => {
    console.log('Media state updated:', {
      count: media.length,
      media: media
    });
  }, [media]);

  // Set up 30-second interval for syncing
  useEffect(() => {
    if (!client) return;

    const interval = setInterval(() => {
      syncMediaWithDatabase();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [client, syncMediaWithDatabase]);

  const getMediaByType = useCallback((type: string) => {
    return media.filter(item => item.media_type === type);
  }, [media]);

  const getMediaById = useCallback((mediaId: string) => {
    return media.find(item => item.media_id === mediaId);
  }, [media]);



  return {
    media,
    isLoading,
    error,
    lastSync,
    syncMediaWithDatabase,
    getMediaByType,
    getMediaById,
    refresh: syncMediaWithDatabase
  };
}; 