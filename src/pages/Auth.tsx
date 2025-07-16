import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Zap, Shield, BarChart3, Phone, Mail, Lock, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import heroImage from '@/assets/auth-hero.jpg';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Signed in successfully!",
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        
        {/* Overlay Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold">WhatsApp Business Hub</h1>
            </div>
            
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Transform Your Business Communication
            </h2>
            
            <p className="text-xl mb-8 text-white/90">
              Connect, engage, and grow your business with our powerful WhatsApp messaging platform.
            </p>
            
            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-success-light" />
                </div>
                <div>
                  <h3 className="font-semibold">Customer Management</h3>
                  <p className="text-sm text-white/80">Organize and manage all your customer communications</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                  <Zap className="h-5 w-5 text-success-light" />
                </div>
                <div>
                  <h3 className="font-semibold">Instant Messaging</h3>
                  <p className="text-sm text-white/80">Send messages instantly to your customers</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-success-light" />
                </div>
                <div>
                  <h3 className="font-semibold">Analytics & Insights</h3>
                  <p className="text-sm text-white/80">Track your messaging performance and engagement</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-success-light" />
                </div>
                <div>
                  <h3 className="font-semibold">Secure & Reliable</h3>
                  <p className="text-sm text-white/80">Enterprise-grade security for your business</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute bottom-32 right-32 w-12 h-12 bg-success/20 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-12 w-8 h-8 bg-warning/20 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white px-4 py-12 relative">
        {/* Admin Login Toggle */}
        <div className="absolute top-4 right-4">
          <Button
            variant={isAdminLogin ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAdminLogin(!isAdminLogin)}
            className="flex items-center gap-2"
          >
            <UserCog className="h-4 w-4" />
            {isAdminLogin ? 'Client Login' : 'Admin Login'}
          </Button>
        </div>
        
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-r from-primary to-primary/80 rounded-full shadow-lg">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold gradient-text mb-2">WhatsApp Business Hub</h1>
            <p className="text-muted-foreground">Transform your business communication</p>
          </div>
          
          <Card className="card-enhanced shadow-xl border-0">
            <CardHeader className="text-center pb-8">
              <div className="hidden lg:flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-r from-primary to-primary/80 rounded-full shadow-lg">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl gradient-text mb-2">
                {isAdminLogin ? 'Admin Login' : 'Welcome Back'}
              </CardTitle>
              <CardDescription className="text-base">
                {isAdminLogin 
                  ? 'Sign in to access the admin dashboard and manage clients' 
                  : 'Sign in to access your WhatsApp Business Dashboard'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your business email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 border-2 border-gray-200 focus:border-primary transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 border-2 border-gray-200 focus:border-primary transition-all duration-200"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg text-base font-medium transition-all duration-200" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In to Dashboard
                      <Zap className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
              
              {/* Trust Indicators */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-success" />
                    <span>Secure Login</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-success" />
                    <span>WhatsApp API</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-success" />
                    <span>Business Grade</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-info/10 rounded-lg border border-info/20">
            <h3 className="font-medium text-info mb-2">
              {isAdminLogin ? 'Admin Credentials:' : 'Demo Credentials:'}
            </h3>
            <p className="text-sm text-info/80">
              <strong>Email:</strong> admin@gmail.com<br />
              <strong>Password:</strong> admin@123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;