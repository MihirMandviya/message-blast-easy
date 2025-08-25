import { useState, useCallback, useEffect } from 'react';
import { useClientAuth } from './useClientAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface CampaignReportRecord {
  msgType: string;
  deliveryTime: number;
  billingModel: string;
  channel: string;
  msgId: string;
  cause: string;
  readTime: number;
  mobileNo: number;
  uuId: number;
  wabaNumber: number;
  globalErrorCode: string;
  submitTime: string;
  waConversationId: string;
  id: number;
  campaignName: string;
  status: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  client_id?: string;
  group_id?: string;
  template_id?: string;
  reports_data?: CampaignReportRecord[];
  group_name?: string;
  template_name?: string;
  contact_count?: number;
}

export const useCampaignReports = () => {
  const { client } = useClientAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch campaigns with their report data
  const loadCampaigns = useCallback(async () => {
    if (!client?.id) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Loading campaigns for client:', client.id);

      // Try client_id first, then user_id as fallback
      let { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
          *,
          groups:group_id(name)
        `)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      // If no campaigns found with client_id, try user_id
      if (!campaignsData || campaignsData.length === 0) {
        console.log('No campaigns found with client_id, trying user_id...');
        const { data: campaignsData2, error: campaignsError2 } = await supabase
          .from('campaigns')
          .select(`
            *,
            groups:group_id(name)
          `)
          .eq('user_id', client.id)
          .order('created_at', { ascending: false });
        
        if (campaignsError2) {
          console.error('Error with user_id query:', campaignsError2);
        } else {
          campaignsData = campaignsData2;
          campaignsError = campaignsError2;
        }
      }

      if (campaignsError) throw campaignsError;

      // Get contact counts for each campaign
      const campaignsWithContactCount = await Promise.all((campaignsData || []).map(async (campaign) => {
        const { count: contactCount, error: countError } = await supabase
          .from('contact_groups')
          .select('*', { count: 'exact' })
          .eq('group_id', campaign.group_id);

        if (countError) {
          console.error(`Error counting contacts for campaign ${campaign.id}:`, countError);
        }

        return {
          ...campaign,
          group_name: campaign.groups?.name || 'Unknown Group',
          template_name: campaign.template_id ? 'Template Used' : 'No Template',
          contact_count: contactCount || 0
        };
      }));

      setCampaigns(campaignsWithContactCount);
    } catch (error: any) {
      console.error('Error loading campaigns:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to load campaigns data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [client, toast]);

  // Fetch reports for a specific campaign
  const fetchCampaignReports = useCallback(async (campaign: Campaign) => {
    if (!client) {
      console.error('Client not authenticated');
      return;
    }

    // Check if we have the required credentials
    if (!client.mem_password || !client.whatsapp_number) {
      console.error('Missing required credentials for API call');
      toast({
        title: "Error",
        description: "Missing WhatsApp credentials. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Fetching reports for campaign: ${campaign.name}`);

      // Get the latest N messages where N = contact_count
      const expectedMessageCount = campaign.sent_count > 0 ? campaign.sent_count : (campaign.contact_count || 0);
      
      if (expectedMessageCount === 0) {
        console.log('No messages expected for this campaign');
        return;
      }

      // Format dates for the API (YYYY-MM-DD HH:MM:SS format)
      const now = new Date();
      const fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 00:00:00`;
      const toDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 23:59:59`;

      const requestBody = {
        userId: client.user_id || client.id,
        fromDate: fromDate,
        toDate: toDate,
        mobileNo: '',
        pageLimit: expectedMessageCount,
        startCursor: '1'
      };

      console.log('Campaign Reports API Request Body:', requestBody);

      const response = await fetch('http://localhost:3001/api/fetch-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('Campaign Reports API Response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error('Invalid JSON response from API');
      }

      if (response.ok && data.success && data.data.records) {
        // Get the latest N messages
        const latestMessages = data.data.records
          .sort((a: CampaignReportRecord, b: CampaignReportRecord) => 
            parseInt(b.submitTime) - parseInt(a.submitTime)
          )
          .slice(0, expectedMessageCount);

        console.log(`Got ${latestMessages.length} messages for campaign ${campaign.name}`);

        // Update the campaign with the reports data
        const { error: updateError } = await supabase
          .from('campaigns')
          .update({ 
            reports_data: latestMessages,
            updated_at: new Date().toISOString()
          })
          .eq('id', campaign.id);

        if (updateError) {
          console.error('Error updating campaign with reports data:', updateError);
          throw updateError;
        }

        // Update local state
        setCampaigns(prev => prev.map(c => 
          c.id === campaign.id 
            ? { ...c, reports_data: latestMessages }
            : c
        ));

        toast({
          title: "Success",
          description: `Reports fetched for campaign "${campaign.name}"`,
        });

        return latestMessages;
      } else {
        throw new Error(data.error || 'Failed to fetch campaign reports');
      }
    } catch (error: any) {
      console.error('Error fetching campaign reports:', error);
      toast({
        title: "Error",
        description: `Failed to fetch reports for campaign "${campaign.name}": ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  }, [client, toast]);

  // Monitor campaigns for status changes and automatically fetch reports
  const monitorCampaignStatus = useCallback(async () => {
    if (!client?.id) return;

    try {
      // Get campaigns that are marked as 'sent' but don't have reports_data yet
      const { data: sentCampaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'sent')
        .is('reports_data', null)
        .eq('client_id', client.id);

      if (error) {
        console.error('Error fetching sent campaigns:', error);
        return;
      }

      // If no campaigns found with client_id, try user_id
      let campaignsToProcess = sentCampaigns;
      if (!sentCampaigns || sentCampaigns.length === 0) {
        const { data: sentCampaigns2, error: error2 } = await supabase
          .from('campaigns')
          .select('*')
          .eq('status', 'sent')
          .is('reports_data', null)
          .eq('user_id', client.id);

        if (error2) {
          console.error('Error fetching sent campaigns with user_id:', error2);
          return;
        }
        campaignsToProcess = sentCampaigns2;
      }

      if (campaignsToProcess && campaignsToProcess.length > 0) {
        console.log(`Found ${campaignsToProcess.length} sent campaigns without reports data`);
        
        // Process each campaign
        for (const campaign of campaignsToProcess) {
          try {
            await fetchCampaignReports(campaign);
            // Add a small delay between API calls to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Failed to fetch reports for campaign ${campaign.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error monitoring campaign status:', error);
    }
  }, [client, fetchCampaignReports]);

  // Load campaigns on mount
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Monitor campaign status every 30 seconds
  useEffect(() => {
    const interval = setInterval(monitorCampaignStatus, 30000);
    return () => clearInterval(interval);
  }, [monitorCampaignStatus]);

  return {
    campaigns,
    loading,
    error,
    loadCampaigns,
    fetchCampaignReports,
    monitorCampaignStatus
  };
};
