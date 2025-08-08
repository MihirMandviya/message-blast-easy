import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from './useClientAuth';

interface TemplateContent {
  buttons1_type?: string;
  footer?: string;
  buttons1_title?: string;
  header?: string;
  body?: string;
}

interface TemplateItem {
  template: TemplateContent;
  creationTime: number;
  templateName: string;
  whatsAppStatus: string;
  systemStatus: string;
  mediaType: string;
  language: string;
  category: string;
}

interface DatabaseTemplate {
  id: string;
  user_id: string;
  client_id: string | null;
  template_name: string;
  creation_time: number;
  whatsapp_status: string;
  system_status: string;
  media_type: string;
  language: string;
  category: string;
  template_body: string | null;
  template_header: string | null;
  template_footer: string | null;
  buttons1_type: string | null;
  buttons1_title: string | null;
  created_at: string;
  updated_at: string;
}

export const useTemplates = () => {
  const { client } = useClientAuth();
  const [templates, setTemplates] = useState<DatabaseTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchTemplatesFromAPI = useCallback(async () => {
    console.log('Client data for templates:', client);
    console.log('User ID:', client?.user_id);
    console.log('WhatsApp API Key:', client?.whatsapp_api_key ? 'Present' : 'Missing');
    console.log('WhatsApp Number:', client?.whatsapp_number);
    
    // If user_id is not available, try to get it from the database
    let userId = client?.user_id;
    let apiKey = client?.whatsapp_api_key;
    let wabaNumber = client?.whatsapp_number;
    
    if (!userId || !apiKey || !wabaNumber) {
      if (client?.id) {
        try {
          const { data, error } = await supabase
            .from('client_users')
            .select('user_id, whatsapp_api_key, whatsapp_number')
            .eq('id', client.id)
            .single();
          
          if (!error && data) {
            userId = data.user_id;
            apiKey = data.whatsapp_api_key;
            wabaNumber = data.whatsapp_number;
            console.log('Retrieved credentials from database:', { 
              userId, 
              apiKey: apiKey ? 'Present' : 'Missing', 
              wabaNumber 
            });
          }
        } catch (error) {
          console.error('Error fetching credentials:', error);
        }
      }
    }
    
    if (!userId || !apiKey || !wabaNumber) {
      setError(`API credentials not available. User ID: ${!!userId}, API Key: ${!!apiKey}, WABA Number: ${!!wabaNumber}`);
      return null;
    }

    try {
      // Use proxy server to bypass CORS
      console.log('Making templates API call through proxy');
      
      const response = await fetch('/api/fetch-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          apiKey: apiKey,
          wabaNumber: wabaNumber
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Proxy response data for templates:', data);
      
      if (data.success && data.templates) {
        console.log('Returning templates data:', data.templates);
        return data.templates;
      } else {
        // Check if it's an invalid credentials error
        if (data.error && data.error.includes('Invalid credentials')) {
          throw new Error('Invalid API credentials. Please contact your administrator to update your WhatsApp Business API credentials.');
        }
        throw new Error(data.error || 'Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates from API:', error);
      throw error;
    }
  }, [client?.user_id, client?.whatsapp_api_key, client?.whatsapp_number]);

  const syncTemplatesWithDatabase = useCallback(async () => {
    if (!client) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch templates from API
      const apiTemplates = await fetchTemplatesFromAPI();
      console.log('API Templates received:', apiTemplates);
      if (!apiTemplates) return;

      // Clear existing templates for this user
      await supabase
        .from('templates')
        .delete()
        .eq('user_id', client.id);

      // Insert new templates data
      const templatesToInsert = apiTemplates.map((item: TemplateItem) => ({
        user_id: client.id,
        client_id: client.id,
        template_name: item.templateName,
        creation_time: item.creationTime,
        whatsapp_status: item.whatsAppStatus,
        system_status: item.systemStatus,
        media_type: item.mediaType,
        language: item.language,
        category: item.category,
        template_body: item.template.body || null,
        template_header: item.template.header || null,
        template_footer: item.template.footer || null,
        buttons1_type: item.template.buttons1_type || null,
        buttons1_title: item.template.buttons1_title || null
      }));

      const { data, error } = await supabase
        .from('templates')
        .insert(templatesToInsert)
        .select();

      if (error) {
        throw error;
      }

      console.log('Database insert result for templates:', data);
      setTemplates(data || []);
      setLastSync(new Date());
    } catch (error) {
      console.error('Error syncing templates:', error);
      setError(error instanceof Error ? error.message : 'Failed to sync templates');
    } finally {
      setIsLoading(false);
    }
  }, [client, fetchTemplatesFromAPI]);

  const loadTemplatesFromDatabase = useCallback(async () => {
    if (!client) return;

    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', client.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('Loaded templates from database:', data);
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates from database:', error);
      setError(error instanceof Error ? error.message : 'Failed to load templates');
    }
  }, [client]);

  // Initial load and sync
  useEffect(() => {
    if (client) {
      loadTemplatesFromDatabase();
      syncTemplatesWithDatabase();
    }
  }, [client, loadTemplatesFromDatabase, syncTemplatesWithDatabase]);

  // Debug effect to log client data
  useEffect(() => {
    if (client) {
      console.log('Client loaded in useTemplates:', {
        id: client.id,
        email: client.email,
        user_id: client.user_id || 'Missing',
        whatsapp_api_key: client.whatsapp_api_key ? 'Present' : 'Missing',
        whatsapp_number: client.whatsapp_number || 'Missing'
      });
    }
  }, [client]);

  // Debug effect to log templates state changes
  useEffect(() => {
    console.log('Templates state updated:', {
      count: templates.length,
      templates: templates
    });
  }, [templates]);

  // Set up 30-minute interval for syncing (30 minutes = 30 * 60 * 1000 = 1,800,000 ms)
  useEffect(() => {
    if (!client) return;

    const interval = setInterval(() => {
      syncTemplatesWithDatabase();
    }, 1800000); // 30 minutes

    return () => clearInterval(interval);
  }, [client, syncTemplatesWithDatabase]);

  const getTemplatesByCategory = useCallback((category: string) => {
    return templates.filter(item => item.category === category);
  }, [templates]);

  const getTemplatesByLanguage = useCallback((language: string) => {
    return templates.filter(item => item.language === language);
  }, [templates]);

  const getTemplatesByMediaType = useCallback((mediaType: string) => {
    return templates.filter(item => item.media_type === mediaType);
  }, [templates]);

  const getTemplateByName = useCallback((templateName: string) => {
    return templates.find(item => item.template_name === templateName);
  }, [templates]);

  return {
    templates,
    isLoading,
    error,
    lastSync,
    syncTemplatesWithDatabase,
    getTemplatesByCategory,
    getTemplatesByLanguage,
    getTemplatesByMediaType,
    getTemplateByName,
    refresh: syncTemplatesWithDatabase
  };
}; 