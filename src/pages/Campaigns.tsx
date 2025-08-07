import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Users, MessageSquare, Target, Calendar, Send, Eye, Edit, Trash2, RotateCcw, RefreshCw, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClientAuth } from "@/hooks/useClientAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  description: string;
  message_content: string;
  message_type: string;
  target_groups: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  scheduled_for?: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  group_id?: string;
  template_id?: string;
  variable_mappings?: {[key: string]: string};
  groups?: {
    name: string;
  };
  templates?: {
    name: string;
    content: string;
  };
}

interface Group {
  id: string;
  name: string;
  description: string;
  contact_count: number;
}

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_id: '',
    template_id: '',
    scheduled_for: null as Date | null,
    campaign_type: 'draft' as 'draft' | 'scheduled' | 'send_now'
  });
  const [variableMappings, setVariableMappings] = useState<{[key: string]: string}>({});
  const [sendingCampaigns, setSendingCampaigns] = useState<Set<string>>(new Set());
  const [overdueCampaigns, setOverdueCampaigns] = useState<number>(0);

  const { toast } = useToast();
  const { client } = useClientAuth();

  // Function to check if campaign can be retried/resent
  const canRetryCampaign = (campaign: Campaign) => {
    return campaign.status === 'sent' && campaign.failed_count > 0;
  };

  const canResendCampaign = (campaign: Campaign) => {
    return campaign.status === 'sent' && campaign.sent_count > 0;
  };

  // Function to manually process scheduled campaigns
  const processScheduledCampaigns = async () => {
    try {
      toast({
        title: "Processing Scheduled Campaigns...",
        description: "Please wait while we process overdue campaigns",
      });

      // Call the edge function to process scheduled campaigns
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/process-scheduled-campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Scheduled campaigns processed successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to process scheduled campaigns",
          variant: "destructive",
        });
      }

      // Reload campaigns to update the UI
      loadData();
      
      // Reset overdue campaigns count
      setOverdueCampaigns(0);

    } catch (error) {
      console.error('Error processing scheduled campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to process scheduled campaigns",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadData();
    
    // Check for scheduled campaigns that need to be processed
    const checkScheduledCampaigns = async () => {
      try {
        const currentUTCTime = new Date().toISOString();
        console.log(`Checking for overdue campaigns at: ${currentUTCTime} (UTC)`);
        
        const { data: overdueCampaigns } = await supabase
          .from('campaigns')
          .select('id, name, scheduled_for')
          .eq('status', 'scheduled')
          .lte('scheduled_for', currentUTCTime);
        
        setOverdueCampaigns(overdueCampaigns?.length || 0);
        
        if (overdueCampaigns && overdueCampaigns.length > 0) {
          console.log(`Found ${overdueCampaigns.length} overdue scheduled campaigns:`);
          overdueCampaigns.forEach(campaign => {
            console.log(`- ${campaign.name}: scheduled for ${campaign.scheduled_for} (UTC)`);
          });
          // Process them automatically
          await processScheduledCampaigns();
        }
      } catch (error) {
        console.error('Error checking scheduled campaigns:', error);
      }
    };
    
    // Check immediately and then every 5 minutes
    checkScheduledCampaigns();
    const interval = setInterval(checkScheduledCampaigns, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load campaigns with related data
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
          *,
          groups(name),
          templates(name, content)
        `)
        .eq('client_id', client?.id)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      // Load groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*, contacts(count)')
        .eq('client_id', client?.id);

      if (groupsError) throw groupsError;

      // Load templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('templates')
        .select('*')
        .or(`client_id.eq.${client?.id},client_id.is.null`);

      if (templatesError) throw templatesError;

      setCampaigns(campaignsData || []);
      setGroups(groupsData || []);
      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load campaigns data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      // Add to sending state to show loading
      setSendingCampaigns(prev => new Set(prev).add('creating'));
      
      if (!formData.name || !formData.group_id || !formData.template_id) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields: Campaign Name, Contact List, and Message Template",
          variant: "destructive",
        });
        return;
      }

      // Show confirmation for "Send Now" campaigns
      if (formData.campaign_type === 'send_now') {
        const selectedGroup = groups.find(g => g.id === formData.group_id);
        
        // Get actual contact count from database to ensure accuracy
        const { data: actualContacts, error: contactCountError } = await supabase
          .from('contacts')
          .select('id', { count: 'exact' })
          .eq('group_id', formData.group_id)
          .eq('user_id', client?.id);
        
        const actualContactCount = actualContacts?.length || 0;
        
        if (contactCountError) {
          console.error('Error getting contact count:', contactCountError);
        }
        
        const confirmed = window.confirm(
          `Are you sure you want to immediately send this campaign to ${actualContactCount} contacts?\n\nThis action cannot be undone.`
        );
        
        if (!confirmed) {
          return;
        }
      }

      // Check if all variables are mapped
      if (selectedTemplate) {
        const variables = extractVariables(selectedTemplate.content);
        const unmappedVariables = variables.filter(variable => !variableMappings[variable]);
        
        if (unmappedVariables.length > 0) {
          toast({
            title: "Validation Error",
            description: `Please map all template variables: ${unmappedVariables.map(v => `{{${v}}}`).join(', ')}`,
            variant: "destructive",
          });
          return;
        }
      }

      // Validate scheduled date for scheduled campaigns
      if (formData.campaign_type === 'scheduled' && !formData.scheduled_for) {
        toast({
          title: "Validation Error",
          description: "Please select a date and time for scheduled campaigns",
          variant: "destructive",
        });
        return;
      }

      if (!client?.id) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }

      // Determine campaign status based on campaign type
      let campaignStatus: 'draft' | 'scheduled' | 'sending' | 'sent';
      
      if (formData.campaign_type === 'send_now') {
        campaignStatus = 'sending';
      } else if (formData.campaign_type === 'scheduled') {
        campaignStatus = 'scheduled';
      } else {
        campaignStatus = 'draft';
      }
      
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          name: formData.name,
          description: formData.description,
          message_content: selectedTemplate?.content || '',
          message_type: 'text',
          target_groups: [formData.group_id],
          client_id: client?.id,
          user_id: client?.id, // Add user_id which is required
          group_id: formData.group_id, // Add group_id for direct reference
          template_id: formData.template_id, // Add template_id for direct reference
          status: campaignStatus,
          scheduled_for: formData.scheduled_for ? formData.scheduled_for.toISOString() : null,
          variable_mappings: variableMappings // Store variable mappings
        })
        .select()
        .single();

      if (error) throw error;

      // If campaign type is "send_now", immediately send the campaign
      if (formData.campaign_type === 'send_now') {
        toast({
          title: "Campaign Created",
          description: "Campaign created and sending started...",
        });
        
        // Start sending the campaign immediately
        await sendCampaign(data.id);
      } else {
        toast({
          title: "Success",
          description: formData.campaign_type === 'scheduled' 
            ? "Campaign scheduled successfully" 
            : "Campaign created successfully",
        });
      }

      setFormData({ name: '', description: '', group_id: '', template_id: '', scheduled_for: null, campaign_type: 'draft' });
      setVariableMappings({});
      setShowCreateForm(false);
      setSelectedTemplate(null);
      setSelectedGroup(null);
      loadData();
          } catch (error) {
        console.error('Error creating campaign:', error);
        toast({
          title: "Error",
          description: "Failed to create campaign",
          variant: "destructive",
        });
      } finally {
        // Remove from sending state
        setSendingCampaigns(prev => {
          const newSet = new Set(prev);
          newSet.delete('creating');
          return newSet;
        });
      }
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    setFormData(prev => ({ ...prev, template_id: templateId }));
    
    // Reset variable mappings when template changes
    if (template) {
      const variables = extractVariables(template.content);
      const newMappings: {[key: string]: string} = {};
      variables.forEach(variable => {
        newMappings[variable] = '';
      });
      setVariableMappings(newMappings);
    } else {
      setVariableMappings({});
    }
  };

  const handleGroupChange = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    setSelectedGroup(group || null);
    setFormData(prev => ({ ...prev, group_id: groupId }));
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

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      scheduled: "default",
      sending: "secondary",
      sent: "success"
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status === 'sending' ? 'Sending...' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const contactFieldOptions = [
    { value: 'name', label: 'Contact Name' },
    { value: 'email', label: 'Email Address' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'company', label: 'Company' },
    { value: 'position', label: 'Position' },
    { value: 'address', label: 'Address' },
    { value: 'city', label: 'City' },
    { value: 'state', label: 'State' },
    { value: 'country', label: 'Country' },
    { value: 'postal_code', label: 'Postal Code' },
    { value: 'notes', label: 'Notes' }
  ];

  const getPreviewContent = (content: string): string => {
    let previewContent = content;
    extractVariables(content).forEach(variable => {
      const mappedField = variableMappings[variable];
      if (mappedField) {
        const fieldLabel = contactFieldOptions.find(option => option.value === mappedField)?.label || mappedField;
        previewContent = previewContent.replace(
          new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), 
          `[${fieldLabel}]`
        );
      }
    });
    return previewContent;
  };

  const sendCampaign = async (campaignId: string) => {
    try {
      // Add campaign to sending state
      setSendingCampaigns(prev => new Set(prev).add(campaignId));
      
      // Show sending notification
      toast({
        title: "Sending Campaign...",
        description: "Please wait while we send your messages",
      });

      // Test edge function connectivity
      console.log('Testing edge function connectivity...');
      console.log('Supabase URL:', supabase.supabaseUrl);
      
      // Get client session from localStorage
      const storedSession = localStorage.getItem('client_session');
      const clientSession = storedSession ? JSON.parse(storedSession) : null;
      const clientToken = clientSession?.token;
      
      console.log('Client session:', clientSession ? 'Present' : 'Missing');
      console.log('Client token:', clientToken ? 'Present' : 'Missing');
      console.log('Client ID:', client?.id);

      // Check if client token is available
      if (!clientToken) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to send campaigns",
          variant: "destructive",
        });
        return;
      }

      // Get campaign details from local state first
      let campaign = campaigns.find(c => c.id === campaignId);
      
      // If not found in local state, try to fetch from database
      if (!campaign) {
        console.log('Campaign not found in local state, fetching from database...');
        const { data: dbCampaign, error: dbError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .single();
        
        if (dbError || !dbCampaign) {
          console.error('Database campaign lookup error:', dbError);
          toast({
            title: "Error",
            description: "Campaign not found in database",
            variant: "destructive",
          });
          return;
        }
        
        campaign = dbCampaign;
        console.log('Campaign found in database:', campaign);
      }

      console.log('Campaign found:', campaign);
      console.log('Campaign group_id:', campaign.group_id);
      console.log('Campaign client_id:', campaign.client_id);
      console.log('Current client?.id:', client?.id);

      // Get contacts from the target group with proper user context
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('group_id', campaign.group_id)
        .eq('user_id', campaign.client_id); // Use campaign's client_id to match RLS policy

      console.log('Contacts query result:', { contacts, contactsError });

      if (contactsError) {
        console.error('Contacts error:', contactsError);
        toast({
          title: "Error",
          description: "Failed to load contacts",
          variant: "destructive",
        });
        return;
      }

      if (!contacts || contacts.length === 0) {
        console.log('No contacts found for group:', campaign.group_id);
        console.log('User ID:', client?.id);
        
        // Try alternative query without user_id filter to debug
        const { data: allContacts, error: allContactsError } = await supabase
          .from('contacts')
          .select('*')
          .eq('group_id', campaign.group_id);
        
        console.log('All contacts in group (without user filter):', allContacts);
        console.log('Alternative query error:', allContactsError);
        
        toast({
          title: "No Contacts",
          description: "No contacts found in the selected group",
          variant: "destructive",
        });
        return;
      }

      console.log('Found contacts:', contacts.length);

      // Get template details
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', campaign.template_id)
        .single();

      if (templateError) {
        toast({
          title: "Error",
          description: "Failed to load template",
          variant: "destructive",
        });
        return;
      }

      // Update campaign status to 'sending'
      await supabase
        .from('campaigns')
        .update({ status: 'sending' })
        .eq('id', campaignId);

      let successCount = 0;
      let failureCount = 0;

      // Send messages to each contact
      for (const contact of contacts) {
        try {
          // Replace variables in message content
          let messageContent = template.content;
          if (campaign.variable_mappings) {
            Object.keys(campaign.variable_mappings).forEach(variable => {
              const fieldName = campaign.variable_mappings[variable];
              const fieldValue = contact[fieldName as keyof typeof contact] || '';
              messageContent = messageContent.replace(new RegExp(variable, 'g'), fieldValue);
            });
          }

          // Call the edge function to send the message
          console.log('Sending message to:', contact.phone);
          console.log('Message content:', messageContent);
          console.log('Template name:', template.name);
          
          const response = await fetch(`${supabase.supabaseUrl}/functions/v1/send-whatsapp-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${clientToken}`,
            },
            body: JSON.stringify({
              recipient_phone: contact.phone,
              message_content: messageContent,
              message_type: 'text',
              template_name: template.name,
              campaign_id: campaignId
            })
          });

          console.log('Response status:', response.status);
          const result = await response.json();
          console.log('Response result:', result);
          
          if (result.success) {
            successCount++;
            console.log('Message sent successfully to:', contact.phone);
          } else {
            failureCount++;
            console.error('Failed to send message to', contact.phone, result.error);
            console.error('Full error details:', result);
          }

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          failureCount++;
          console.error('Error sending message to', contact.phone, error);
        }
      }

      // Update campaign status and counts
      await supabase
        .from('campaigns')
        .update({ 
          status: 'sent',
          sent_count: successCount,
          failed_count: failureCount
        })
        .eq('id', campaignId);

      // Remove campaign from sending state
      setSendingCampaigns(prev => {
        const newSet = new Set(prev);
        newSet.delete(campaignId);
        return newSet;
      });

      // Show final result
      const totalContacts = contacts.length;
      toast({
        title: "Campaign Sent",
        description: `Successfully sent ${successCount} messages to ${totalContacts} contacts${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
        variant: failureCount > 0 ? "destructive" : "default",
      });

      // Reload campaigns to update the UI
      loadData();

    } catch (error) {
      console.error('Error sending campaign:', error);
      
      // Remove campaign from sending state
      setSendingCampaigns(prev => {
        const newSet = new Set(prev);
        newSet.delete(campaignId);
        return newSet;
      });

      toast({
        title: "Error",
        description: "Failed to send campaign",
        variant: "destructive",
      });
    }
  };

    // Function to retry failed messages only
    const retryFailedMessages = async (campaignId: string) => {
      try {
        // Add campaign to sending state
        setSendingCampaigns(prev => new Set(prev).add(campaignId));
        
        // Show retry notification
        toast({
          title: "Retrying Failed Messages...",
          description: "Please wait while we retry sending failed messages",
        });

        // Get client session from localStorage
        const storedSession = localStorage.getItem('client_session');
        const clientSession = storedSession ? JSON.parse(storedSession) : null;
        const clientToken = clientSession?.token;
        
        // Check if client token is available
        if (!clientToken) {
          toast({
            title: "Authentication Error",
            description: "Please log in again to retry campaigns",
            variant: "destructive",
          });
          return;
        }

        // Get campaign details
        const campaign = campaigns.find(c => c.id === campaignId);
        if (!campaign) {
          toast({
            title: "Error",
            description: "Campaign not found",
            variant: "destructive",
          });
          return;
        }

        // Get failed messages for this campaign
        const { data: failedMessages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('status', 'failed');

        if (messagesError) {
          toast({
            title: "Error",
            description: "Failed to load failed messages",
            variant: "destructive",
          });
          return;
        }

        if (!failedMessages || failedMessages.length === 0) {
          toast({
            title: "No Failed Messages",
            description: "No failed messages found to retry",
            variant: "destructive",
          });
          return;
        }

        // Get template details
        const { data: template, error: templateError } = await supabase
          .from('templates')
          .select('*')
          .eq('id', campaign.template_id)
          .single();

        if (templateError) {
          toast({
            title: "Error",
            description: "Failed to load template",
            variant: "destructive",
          });
          return;
        }

        // Update campaign status to 'sending'
        await supabase
          .from('campaigns')
          .update({ status: 'sending' })
          .eq('id', campaignId);

        let successCount = 0;
        let failureCount = 0;

        // Retry each failed message
        for (const message of failedMessages) {
          try {
            // Get contact details
            const { data: contact, error: contactError } = await supabase
              .from('contacts')
              .select('*')
              .eq('id', message.contact_id)
              .single();

            if (contactError || !contact) {
              failureCount++;
              continue;
            }

            // Replace variables in message content
            let messageContent = template.content;
            if (campaign.variable_mappings) {
              Object.keys(campaign.variable_mappings).forEach(variable => {
                const fieldName = campaign.variable_mappings[variable];
                const fieldValue = contact[fieldName as keyof typeof contact] || '';
                messageContent = messageContent.replace(new RegExp(variable, 'g'), fieldValue);
              });
            }

            // Call the edge function to send the message
            console.log('Retrying message to:', contact.phone);
            console.log('Message content:', messageContent);
            console.log('Template name:', template.name);
            
            const response = await fetch(`${supabase.supabaseUrl}/functions/v1/send-whatsapp-message`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientToken}`,
              },
              body: JSON.stringify({
                recipient_phone: contact.phone,
                message_content: messageContent,
                message_type: 'text',
                template_name: template.name,
                campaign_id: campaignId
              })
            });

            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response result:', result);
            
            if (result.success) {
              successCount++;
              console.log('Message retried successfully to:', contact.phone);
              
              // Update message status to sent
              await supabase
                .from('messages')
                .update({ 
                  status: 'sent',
                  sent_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', message.id);
            } else {
              failureCount++;
              console.error('Failed to retry message to', contact.phone, result.error);
              
              // Update message with new error
              await supabase
                .from('messages')
                .update({ 
                  error_message: result.error || 'Retry failed',
                  updated_at: new Date().toISOString()
                })
                .eq('id', message.id);
            }

            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (error) {
            failureCount++;
            console.error('Error retrying message to', contact?.phone, error);
          }
        }

        // Update campaign with final status and counts
        const currentCampaign = campaigns.find(c => c.id === campaignId);
        const newSentCount = (currentCampaign?.sent_count || 0) + successCount;
        const newFailedCount = Math.max(0, (currentCampaign?.failed_count || 0) - successCount);

        await supabase
          .from('campaigns')
          .update({ 
            status: 'sent',
            sent_count: newSentCount,
            failed_count: newFailedCount
          })
          .eq('id', campaignId);

        toast({
          title: "Retry Complete!",
          description: `Successfully retried ${successCount} messages. ${failureCount} still failed.`,
        });

        // Reload campaigns to show updated status
        loadData();

      } catch (error) {
        console.error('Campaign retry error:', error);
        toast({
          title: "Error",
          description: "Failed to retry campaign",
          variant: "destructive",
        });

        // Reset campaign status to sent on error
        await supabase
          .from('campaigns')
          .update({ status: 'sent' })
          .eq('id', campaignId);
      } finally {
        // Remove campaign from sending state
        setSendingCampaigns(prev => {
          const newSet = new Set(prev);
          newSet.delete(campaignId);
          return newSet;
        });
      }
    };

    // Function to resend entire campaign
    const resendCampaign = async (campaignId: string) => {
      try {
        // Add campaign to sending state
        setSendingCampaigns(prev => new Set(prev).add(campaignId));
        
        // Show resend notification
        toast({
          title: "Resending Campaign...",
          description: "Please wait while we resend the entire campaign",
        });

        // Get client session from localStorage
        const storedSession = localStorage.getItem('client_session');
        const clientSession = storedSession ? JSON.parse(storedSession) : null;
        const clientToken = clientSession?.token;
        
        // Check if client token is available
        if (!clientToken) {
          toast({
            title: "Authentication Error",
            description: "Please log in again to resend campaigns",
            variant: "destructive",
          });
          return;
        }

        // Get campaign details
        const campaign = campaigns.find(c => c.id === campaignId);
        if (!campaign) {
          toast({
            title: "Error",
            description: "Campaign not found",
            variant: "destructive",
          });
          return;
        }

        // Get all contacts from the target group
        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('*')
          .eq('group_id', campaign.group_id);

        if (contactsError) {
          toast({
            title: "Error",
            description: "Failed to load contacts",
            variant: "destructive",
          });
          return;
        }

        if (!contacts || contacts.length === 0) {
          toast({
            title: "No Contacts",
            description: "No contacts found in the selected group",
            variant: "destructive",
          });
          return;
        }

        // Get template details
        const { data: template, error: templateError } = await supabase
          .from('templates')
          .select('*')
          .eq('id', campaign.template_id)
          .single();

        if (templateError) {
          toast({
            title: "Error",
            description: "Failed to load template",
            variant: "destructive",
          });
          return;
        }

        // Update campaign status to 'sending'
        await supabase
          .from('campaigns')
          .update({ status: 'sending' })
          .eq('id', campaignId);

        let successCount = 0;
        let failureCount = 0;

        // Send messages to each contact
        for (const contact of contacts) {
          try {
            // Replace variables in message content
            let messageContent = template.content;
            if (campaign.variable_mappings) {
              Object.keys(campaign.variable_mappings).forEach(variable => {
                const fieldName = campaign.variable_mappings[variable];
                const fieldValue = contact[fieldName as keyof typeof contact] || '';
                messageContent = messageContent.replace(new RegExp(variable, 'g'), fieldValue);
              });
            }

            // Call the edge function to send the message
            console.log('Resending message to:', contact.phone);
            console.log('Message content:', messageContent);
            console.log('Template name:', template.name);
            
            const response = await fetch(`${supabase.supabaseUrl}/functions/v1/send-whatsapp-message`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientToken}`,
              },
              body: JSON.stringify({
                recipient_phone: contact.phone,
                message_content: messageContent,
                message_type: 'text',
                template_name: template.name,
                campaign_id: campaignId
              })
            });

            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response result:', result);
            
            if (result.success) {
              successCount++;
              console.log('Message resent successfully to:', contact.phone);
            } else {
              failureCount++;
              console.error('Failed to resend message to', contact.phone, result.error);
            }

            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (error) {
            failureCount++;
            console.error('Error resending message to', contact.phone, error);
          }
        }

        // Update campaign with final status and counts
        await supabase
          .from('campaigns')
          .update({ 
            status: 'sent',
            sent_count: successCount,
            failed_count: failureCount
          })
          .eq('id', campaignId);

        toast({
          title: "Campaign Resent!",
          description: `Successfully resent ${successCount} messages. ${failureCount} failed.`,
        });

        // Reload campaigns to show updated status
        loadData();

      } catch (error) {
        console.error('Campaign resend error:', error);
        toast({
          title: "Error",
          description: "Failed to resend campaign",
          variant: "destructive",
        });

        // Reset campaign status to sent on error
        await supabase
          .from('campaigns')
          .update({ status: 'sent' })
          .eq('id', campaignId);
      } finally {
        // Remove campaign from sending state
        setSendingCampaigns(prev => {
          const newSet = new Set(prev);
          newSet.delete(campaignId);
          return newSet;
        });
      }
    };

    const handleDeleteCampaign = async (campaignId: string) => {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) return;

      // Show confirmation dialog
      const confirmed = window.confirm(
        `Are you sure you want to delete the campaign "${campaign.name}"?\n\n` +
        `This will also delete all associated messages and cannot be undone.`
      );

      if (!confirmed) return;

      try {
        // Delete the campaign (messages will be automatically deleted due to CASCADE)
        const { error } = await supabase
          .from('campaigns')
          .delete()
          .eq('id', campaignId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Campaign deleted successfully",
        });

        // Reload campaigns
        loadData();
      } catch (error) {
        console.error('Error deleting campaign:', error);
        toast({
          title: "Error",
          description: "Failed to delete campaign",
          variant: "destructive",
        });
      }
    };

    if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <p className="text-muted-foreground">Create and manage your WhatsApp campaigns</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Create and manage your WhatsApp campaigns</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Create Campaign Form */}
      {showCreateForm && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Create New Campaign
            </CardTitle>
            <CardDescription>
              Set up your WhatsApp campaign with target audience and message template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Campaign Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter campaign name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the campaign"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            {/* Contact List Selection */}
            <div className="space-y-2">
              <Label>Select Contact List *</Label>
              <Select value={formData.group_id} onValueChange={handleGroupChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a contact list" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{group.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {group.contact_count} contacts
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedGroup && (
                <div className="text-sm text-muted-foreground">
                  Selected: {selectedGroup.name} ({selectedGroup.contact_count} contacts)
                </div>
              )}
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Select Message Template *</Label>
              <Select value={formData.template_id} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a message template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{template.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {template.category}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

                         {/* Variable Mapping */}
             {selectedTemplate && extractVariables(selectedTemplate.content).length > 0 && (
               <div className="space-y-4">
                 <Label>Map Template Variables to Contact Fields</Label>
                 <div className="space-y-3">
                   {extractVariables(selectedTemplate.content).map((variable) => (
                     <div key={variable} className="flex items-center gap-3 p-3 border rounded-lg">
                       <div className="flex-1">
                         <Label className="text-sm font-medium">
                           Variable: <code className="bg-muted px-1 rounded text-xs">{`{{${variable}}}`}</code>
                         </Label>
                       </div>
                       <Select 
                         value={variableMappings[variable] || ''} 
                         onValueChange={(value) => setVariableMappings(prev => ({ ...prev, [variable]: value }))}
                       >
                         <SelectTrigger className="w-48">
                           <SelectValue placeholder="Select contact field" />
                         </SelectTrigger>
                         <SelectContent>
                           {contactFieldOptions.map((option) => (
                             <SelectItem key={option.value} value={option.value}>
                               {option.label}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                       {variableMappings[variable] && (
                         <Badge variant="success" className="text-xs">
                           ✓ Mapped
                         </Badge>
                       )}
                     </div>
                   ))}
                 </div>
                 <p className="text-sm text-muted-foreground">
                   These variables will be replaced with actual contact data when the campaign is sent.
                 </p>
               </div>
             )}

             {/* Message Preview */}
             {selectedTemplate && (
               <div className="space-y-2">
                 <Label>Message Preview</Label>
                 <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-sm">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                       <span className="text-white text-xs font-bold">WA</span>
                     </div>
                     <div>
                       <div className="text-sm font-medium text-green-800">WhatsApp Business</div>
                       <div className="text-xs text-green-600">Now</div>
                     </div>
                   </div>
                   <div className="bg-white rounded-lg p-3 shadow-sm">
                     <div className="text-sm text-gray-800 whitespace-pre-wrap">
                       {getPreviewContent(selectedTemplate.content)}
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {/* Campaign Action Type */}
             <div className="space-y-4">
               <Label className="text-base font-medium">Campaign Action</Label>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {/* Draft Option */}
                 <div 
                   className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                     formData.campaign_type === 'draft' 
                       ? 'border-primary bg-primary/5' 
                       : 'border-muted hover:border-primary/50'
                   }`}
                   onClick={() => setFormData(prev => ({ 
                     ...prev, 
                     campaign_type: 'draft',
                     scheduled_for: null 
                   }))}
                 >
                   <div className="flex items-center gap-3 mb-2">
                     <input
                       type="radio"
                       checked={formData.campaign_type === 'draft'}
                       onChange={() => {}}
                       className="w-4 h-4 text-primary"
                     />
                     <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                       <Edit className="h-4 w-4 text-blue-600" />
                     </div>
                   </div>
                   <h4 className="font-medium text-sm mb-1">Save as Draft</h4>
                   <p className="text-xs text-muted-foreground">
                     Create campaign and save for later editing or sending
                   </p>
                 </div>

                 {/* Schedule Option */}
                 <div 
                   className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                     formData.campaign_type === 'scheduled' 
                       ? 'border-primary bg-primary/5' 
                       : 'border-muted hover:border-primary/50'
                   }`}
                   onClick={() => setFormData(prev => ({ 
                     ...prev, 
                     campaign_type: 'scheduled',
                     scheduled_for: prev.scheduled_for || new Date()
                   }))}
                 >
                   <div className="flex items-center gap-3 mb-2">
                     <input
                       type="radio"
                       checked={formData.campaign_type === 'scheduled'}
                       onChange={() => {}}
                       className="w-4 h-4 text-primary"
                     />
                     <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                       <Clock className="h-4 w-4 text-orange-600" />
                     </div>
                   </div>
                   <h4 className="font-medium text-sm mb-1">Schedule</h4>
                   <p className="text-xs text-muted-foreground">
                     Schedule campaign to be sent at a specific date and time
                   </p>
                 </div>

                 {/* Send Now Option */}
                 <div 
                   className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                     formData.campaign_type === 'send_now' 
                       ? 'border-primary bg-primary/5' 
                       : 'border-muted hover:border-primary/50'
                   }`}
                   onClick={() => setFormData(prev => ({ 
                     ...prev, 
                     campaign_type: 'send_now',
                     scheduled_for: null 
                   }))}
                 >
                   <div className="flex items-center gap-3 mb-2">
                     <input
                       type="radio"
                       checked={formData.campaign_type === 'send_now'}
                       onChange={() => {}}
                       className="w-4 h-4 text-primary"
                     />
                     <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                       <Send className="h-4 w-4 text-green-600" />
                     </div>
                   </div>
                   <h4 className="font-medium text-sm mb-1">Send Now</h4>
                   <p className="text-xs text-muted-foreground">
                     Create and immediately send the campaign to all contacts
                   </p>
                 </div>
               </div>
               
               {/* Schedule Date & Time (only show for scheduled campaigns) */}
               {formData.campaign_type === 'scheduled' && (
                 <div className="mt-4 space-y-2">
                   <Label>Schedule Date & Time</Label>
                   <DateTimePicker
                     value={formData.scheduled_for}
                     onChange={(date) => setFormData(prev => ({ ...prev, scheduled_for: date }))}
                     placeholder="Pick a date and time"
                   />
                   <p className="text-sm text-muted-foreground">
                     Campaign will be automatically sent at the scheduled time.
                   </p>
                   <p className="text-xs text-muted-foreground">
                     Time shown in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                   </p>
                 </div>
               )}
             </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleCreateCampaign} 
                className={`flex items-center gap-2 ${
                  formData.campaign_type === 'send_now' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : formData.campaign_type === 'scheduled'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : ''
                }`}
                disabled={sendingCampaigns.has('creating')}
              >
                {sendingCampaigns.has('creating') ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {formData.campaign_type === 'send_now' ? 'Creating & Sending...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {formData.campaign_type === 'draft' && <Edit className="h-4 w-4" />}
                    {formData.campaign_type === 'scheduled' && <Clock className="h-4 w-4" />}
                    {formData.campaign_type === 'send_now' && <Send className="h-4 w-4" />}
                    {formData.campaign_type === 'draft' && 'Save as Draft'}
                    {formData.campaign_type === 'scheduled' && 'Schedule Campaign'}
                    {formData.campaign_type === 'send_now' && 'Create & Send Now'}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ name: '', description: '', group_id: '', template_id: '', scheduled_for: null, campaign_type: 'draft' });
                  setSelectedTemplate(null);
                  setSelectedGroup(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaigns List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Campaigns</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={processScheduledCampaigns}
              size="sm"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Process Scheduled
              {overdueCampaigns > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {overdueCampaigns}
                </Badge>
              )}
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              Create Campaign
            </Button>
          </div>
        </div>
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first campaign to start sending WhatsApp messages to your contacts
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                Create Your First Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{campaign.name}</h3>
                        {getStatusBadge(campaign.status)}
                        {campaign.scheduled_for && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Scheduled
                          </Badge>
                        )}
                      </div>
                      {campaign.description && (
                        <p className="text-muted-foreground mb-3">{campaign.description}</p>
                      )}
                                             <div className="flex items-center gap-4 text-sm text-muted-foreground">
                         <div className="flex items-center gap-1">
                           <Users className="h-4 w-4" />
                           <span>{campaign.groups?.name || 'Unknown List'}</span>
                         </div>
                         <div className="flex items-center gap-1">
                           <MessageSquare className="h-4 w-4" />
                           <span>{campaign.templates?.name || 'Custom Message'}</span>
                         </div>
                         {campaign.variable_mappings && Object.keys(campaign.variable_mappings).length > 0 && (
                           <div className="flex items-center gap-1">
                             <Badge variant="outline" className="text-xs">
                               {Object.keys(campaign.variable_mappings).length} variables mapped
                             </Badge>
                           </div>
                         )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                        </div>
                        {campaign.scheduled_for && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Scheduled: {format(new Date(campaign.scheduled_for), "MMM d, HH:mm")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                                         <div className="flex items-center gap-2">
                       {campaign.status === 'draft' && (
                         <Button 
                           onClick={() => sendCampaign(campaign.id)}
                           size="sm"
                           disabled={sendingCampaigns.has(campaign.id)}
                           className="bg-green-600 hover:bg-green-700"
                         >
                           {sendingCampaigns.has(campaign.id) ? (
                             <>
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                               Sending...
                             </>
                           ) : (
                             <>
                               <Send className="h-4 w-4" />
                               Send
                             </>
                           )}
                         </Button>
                       )}
                       {campaign.status === 'scheduled' && (
                         <Button 
                           onClick={() => sendCampaign(campaign.id)}
                           size="sm"
                           disabled={sendingCampaigns.has(campaign.id)}
                           className="bg-orange-600 hover:bg-orange-700"
                         >
                           {sendingCampaigns.has(campaign.id) ? (
                             <>
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                               Sending...
                             </>
                           ) : (
                             <>
                               <Send className="h-4 w-4" />
                               Send Now
                             </>
                           )}
                         </Button>
                       )}
                       {campaign.status === 'sent' && (
                         <>
                           <div className="flex items-center gap-2 text-sm">
                             <Badge variant="success" className="text-xs">
                               {campaign.sent_count} sent
                             </Badge>
                             {campaign.failed_count > 0 && (
                               <Badge variant="destructive" className="text-xs">
                                 {campaign.failed_count} failed
                               </Badge>
                             )}
                           </div>
                           
                           {/* Retry Failed Messages Button */}
                           {canRetryCampaign(campaign) && (
                             <Button 
                               onClick={() => retryFailedMessages(campaign.id)}
                               size="sm"
                               disabled={sendingCampaigns.has(campaign.id)}
                               variant="outline"
                               className="border-orange-200 text-orange-700 hover:bg-orange-50"
                             >
                               {sendingCampaigns.has(campaign.id) ? (
                                 <>
                                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2" />
                                   Retrying...
                                 </>
                               ) : (
                                 <>
                                   <RotateCcw className="h-4 w-4" />
                                   Retry Failed
                                 </>
                               )}
                             </Button>
                           )}
                           
                           {/* Resend Campaign Button */}
                           {canResendCampaign(campaign) && (
                             <Button 
                               onClick={() => resendCampaign(campaign.id)}
                               size="sm"
                               disabled={sendingCampaigns.has(campaign.id)}
                               variant="outline"
                               className="border-blue-200 text-blue-700 hover:bg-blue-50"
                             >
                               {sendingCampaigns.has(campaign.id) ? (
                                 <>
                                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                                   Resending...
                                 </>
                               ) : (
                                 <>
                                   <RefreshCw className="h-4 w-4" />
                                   Resend All
                                 </>
                               )}
                             </Button>
                           )}
                         </>
                       )}
                       <Button variant="outline" size="sm">
                         <Eye className="h-4 w-4" />
                       </Button>
                       <Button variant="outline" size="sm">
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => handleDeleteCampaign(campaign.id)}
                         className="border-red-200 text-red-700 hover:bg-red-50"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 