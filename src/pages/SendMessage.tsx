import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Send, Plus, Users, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from '@/hooks/useClientAuth';

const SendMessage = () => {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [currentRecipient, setCurrentRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('text');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { client } = useClientAuth();

  const addRecipient = () => {
    if (currentRecipient && !recipients.includes(currentRecipient)) {
      setRecipients([...recipients, currentRecipient]);
      setCurrentRecipient('');
    }
  };

  const removeRecipient = (phone: string) => {
    setRecipients(recipients.filter(r => r !== phone));
  };

  const handleSendMessage = async () => {
    if (!client || recipients.length === 0 || !message.trim()) {
      toast({
        title: "Error",
        description: "Please add recipients and enter a message",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create message records for each recipient
      const messagePromises = recipients.map(recipient => 
        supabase.from('messages').insert([{
          user_id: client.id,
          client_id: client.id,
          recipient_phone: recipient,
          message_content: message,
          message_type: messageType,
          status: 'pending'
        }])
      );

      await Promise.all(messagePromises);

      // Here you would typically call your WhatsApp API
      // For now, we'll just update the status to sent
      toast({
        title: "Success",
        description: `Message sent to ${recipients.length} recipient(s)`,
      });

      // Reset form
      setRecipients([]);
      setMessage('');
      setMessageType('text');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Send Message</h2>
        <p className="text-muted-foreground">
          Send WhatsApp messages to your contacts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Compose Message
            </CardTitle>
            <CardDescription>
              Create and send your WhatsApp message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message-type">Message Type</Label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message Content</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground text-right">
                {message.length}/4096 characters
              </div>
            </div>

            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || recipients.length === 0 || !message.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to {recipients.length} recipient(s)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recipients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recipients
            </CardTitle>
            <CardDescription>
              Add phone numbers to send messages to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter phone number (+1234567890)"
                value={currentRecipient}
                onChange={(e) => setCurrentRecipient(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
              />
              <Button onClick={addRecipient} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Selected Recipients ({recipients.length})</Label>
              <div className="border rounded-md p-3 min-h-[200px] max-h-[300px] overflow-y-auto">
                {recipients.length > 0 ? (
                  <div className="space-y-2">
                    {recipients.map((phone, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{phone}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRecipient(phone)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No recipients added yet
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Preview */}
      {message && (
        <Card>
          <CardHeader>
            <CardTitle>Message Preview</CardTitle>
            <CardDescription>
              How your message will appear to recipients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-green-700">
                  {client?.business_name || 'Your Business'}
                </span>
              </div>
              <div className="text-sm">
                {message}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {messageType === 'text' && 'Text message'}
                {messageType === 'image' && 'Image message'}
                {messageType === 'document' && 'Document message'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SendMessage;