import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from './useClientAuth';

interface ClientData {
  contacts: any[];
  templates: any[];
  messages: any[];
  campaigns: any[];
  loading: boolean;
  error: string | null;
}

export const useClientData = () => {
  const { client } = useClientAuth();
  const [data, setData] = useState<ClientData>({
    contacts: [],
    templates: [],
    messages: [],
    campaigns: [],
    loading: true,
    error: null
  });

  const fetchAllData = useCallback(async () => {
    if (!client) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch all data in parallel for better performance
      const [contactsResult, templatesResult, messagesResult, campaignsResult] = await Promise.all([
        supabase
          .from('contacts')
          .select('*')
          .eq('user_id', client.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('templates')
          .select('*')
          .eq('user_id', client.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('messages')
          .select('*')
          .eq('user_id', client.id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('campaigns')
          .select('*')
          .eq('user_id', client.id)
          .order('created_at', { ascending: false })
      ]);

      // Check for errors
      if (contactsResult.error) throw contactsResult.error;
      if (templatesResult.error) throw templatesResult.error;
      if (messagesResult.error) throw messagesResult.error;
      if (campaignsResult.error) throw campaignsResult.error;

      setData({
        contacts: contactsResult.data || [],
        templates: (templatesResult.data || []).map(template => ({
          ...template,
          variables: Array.isArray(template.variables) 
            ? template.variables.filter((v): v is string => typeof v === 'string')
            : []
        })),
        messages: messagesResult.data || [],
        campaigns: campaignsResult.data || [],
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching client data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data'
      }));
    }
  }, [client]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refreshData = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  const addContact = useCallback(async (contactData: any) => {
    if (!client) return { error: 'Not authenticated' };

    try {
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert([{ ...contactData, user_id: client.id }])
        .select()
        .single();

      if (error) {
        console.error('Contact creation error:', error);
        throw error;
      }

      setData(prev => ({
        ...prev,
        contacts: [newContact, ...prev.contacts]
      }));

      return { data: newContact, error: null };
    } catch (error) {
      console.error('Add contact error:', error);
      return { error: error instanceof Error ? error.message : 'Failed to add contact' };
    }
  }, [client]);

  const updateContact = useCallback(async (id: string, updates: any) => {
    if (!client) return { error: 'Not authenticated' };

    try {
      const { data: updatedContact, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', client.id)
        .select()
        .single();

      if (error) throw error;

      setData(prev => ({
        ...prev,
        contacts: prev.contacts.map(contact => 
          contact.id === id ? updatedContact : contact
        )
      }));

      return { data: updatedContact, error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update contact' };
    }
  }, [client]);

  const deleteContact = useCallback(async (id: string) => {
    if (!client) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', client.id);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        contacts: prev.contacts.filter(contact => contact.id !== id)
      }));

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to delete contact' };
    }
  }, [client]);

  const addTemplate = useCallback(async (templateData: any) => {
    if (!client) return { error: 'Not authenticated' };

    try {
      const { data: newTemplate, error } = await supabase
        .from('templates')
        .insert([{ ...templateData, user_id: client.id }])
        .select()
        .single();

      if (error) {
        console.error('Template creation error:', error);
        throw error;
      }

      const processedTemplate = {
        ...newTemplate,
        variables: Array.isArray(newTemplate.variables) 
          ? newTemplate.variables.filter((v): v is string => typeof v === 'string')
          : []
      };

      setData(prev => ({
        ...prev,
        templates: [processedTemplate, ...prev.templates]
      }));

      return { data: processedTemplate, error: null };
    } catch (error) {
      console.error('Add template error:', error);
      return { error: error instanceof Error ? error.message : 'Failed to add template' };
    }
  }, [client]);

  const updateTemplate = useCallback(async (id: string, updates: any) => {
    if (!client) return { error: 'Not authenticated' };

    try {
      const { data: updatedTemplate, error } = await supabase
        .from('templates')
        .update(updates)
        .eq('id', id)
        .eq('user_id', client.id)
        .select()
        .single();

      if (error) throw error;

      const processedTemplate = {
        ...updatedTemplate,
        variables: Array.isArray(updatedTemplate.variables) 
          ? updatedTemplate.variables.filter((v): v is string => typeof v === 'string')
          : []
      };

      setData(prev => ({
        ...prev,
        templates: prev.templates.map(template => 
          template.id === id ? processedTemplate : template
        )
      }));

      return { data: processedTemplate, error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update template' };
    }
  }, [client]);

  const deleteTemplate = useCallback(async (id: string) => {
    if (!client) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id)
        .eq('user_id', client.id);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        templates: prev.templates.filter(template => template.id !== id)
      }));

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to delete template' };
    }
  }, [client]);

  const getStats = useCallback(() => {
    const today = new Date();
    const todayStr = today.toDateString();
    
    return {
      totalContacts: data.contacts.length,
      totalTemplates: data.templates.length,
      totalMessages: data.messages.length,
      totalCampaigns: data.campaigns.length,
      contactsWithEmail: data.contacts.filter(c => c.email).length,
      messagesDelivered: data.messages.filter(m => m.status === 'sent').length,
      messagesFailed: data.messages.filter(m => m.status === 'failed').length,
      messagesPending: data.messages.filter(m => m.status === 'pending').length,
      recentMessages: data.messages.filter(m => 
        new Date(m.created_at).toDateString() === todayStr
      ).length,
      recentContacts: data.contacts.filter(c => 
        new Date(c.created_at).toDateString() === todayStr
      ).length,
    };
  }, [data]);

  return {
    ...data,
    refreshData,
    addContact,
    updateContact,
    deleteContact,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getStats
  };
};