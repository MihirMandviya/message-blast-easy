import { MessageSquare, Users, BarChart3, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();

  const features = [
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Organize and manage all your customer communications',
      action: () => navigate('/contacts'),
      color: 'text-white'
    },
    {
      icon: Zap,
      title: 'Instant Messaging',
      description: 'Send messages instantly to your customers',
      action: () => navigate('/send'),
      color: 'text-white'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Track your messaging performance and engagement',
      action: () => navigate('/messages'),
      color: 'text-white'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security for your business',
      action: () => navigate('/settings'),
      color: 'text-white'
    }
  ];

  return (
    <div className="min-h-screen purple-gradient-bg">
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              WhatsApp Business Hub
            </h1>
          </div>
          
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Transform Your Business
            <br />
            Communication
          </h2>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Connect, engage, and grow your business with our
            <br />
            powerful WhatsApp messaging platform.
          </p>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button 
              onClick={() => navigate('/send')} 
              size="lg"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm text-lg px-8 py-6 h-auto"
            >
              <Zap className="mr-2 h-5 w-5" />
              Send Message
            </Button>
            
            {isAdmin && (
              <Button 
                onClick={() => navigate('/admin/clients')} 
                variant="outline" 
                size="lg"
                className="bg-transparent hover:bg-white/10 text-white border-white/30 backdrop-blur-sm text-lg px-8 py-6 h-auto"
              >
                <Users className="mr-2 h-5 w-5" />
                Manage Clients
              </Button>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="feature-card cursor-pointer group"
              onClick={feature.action}
            >
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-all">
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-white/90 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-white/80 group-hover:text-white/70 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to get started?
            </h3>
            <p className="text-white/80 mb-6">
              Start sending messages and connecting with your customers today.
            </p>
            <Button 
              onClick={() => navigate('/send')} 
              size="lg"
              className="bg-white text-purple-600 hover:bg-white/90 text-lg px-8 py-6 h-auto font-semibold"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;