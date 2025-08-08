import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, Eye, EyeOff, Shield, Users, ArrowRight } from 'lucide-react';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import authHero from '@/assets/auth-hero.jpg';

type LoginType = 'client' | 'admin';

const Auth = () => {
  const [loginType, setLoginType] = useState<LoginType>('client');
  const [userIdentifier, setUserIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn: signInClient } = useClientAuth();
  const { signIn: signInAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let result;
      
      if (loginType === 'client') {
        // For client login, use user_id and password
        result = await signInClient(userIdentifier, password);
      } else {
        // For admin login, use email and password
        result = await signInAdmin(userIdentifier, password);
      }
      
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        // Navigate based on login type
        navigate(loginType === 'client' ? '/' : '/admin');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const switchLoginType = (type: LoginType) => {
    setLoginType(type);
    setUserIdentifier('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Hero Image */}
        <div className="hidden lg:block">
          <div className="relative">
            <img 
              src={authHero} 
              alt="WhatsApp Business Hub" 
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <h2 className="text-3xl font-bold mb-2">WhatsApp Business Hub</h2>
              <p className="text-lg opacity-90">Manage your WhatsApp campaigns with ease</p>
            </div>
          </div>
        </div>

        {/* Right side - Login Options */}
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-lg text-gray-600">Choose your login type to continue</p>
          </div>

          {/* Login Type Selector */}
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                loginType === 'client' 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => switchLoginType('client')}
            >
              <CardContent className="p-6 text-center">
                <div className={`p-3 rounded-full mb-4 mx-auto w-fit ${
                  loginType === 'client' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Users className={`h-6 w-6 ${
                    loginType === 'client' ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">Client Login</h3>
                <p className="text-sm text-gray-600">Access your business dashboard</p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                loginType === 'admin' 
                  ? 'ring-2 ring-purple-500 bg-purple-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => switchLoginType('admin')}
            >
              <CardContent className="p-6 text-center">
                <div className={`p-3 rounded-full mb-4 mx-auto w-fit ${
                  loginType === 'admin' ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  <Shield className={`h-6 w-6 ${
                    loginType === 'admin' ? 'text-purple-600' : 'text-gray-600'
                  }`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">Admin Login</h3>
                <p className="text-sm text-gray-600">Manage system and clients</p>
              </CardContent>
            </Card>
          </div>

          {/* Login Form */}
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className={`flex items-center justify-center mb-4 ${
                loginType === 'client' ? 'text-blue-600' : 'text-purple-600'
              }`}>
                <div className={`p-3 rounded-full ${
                  loginType === 'client' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  {loginType === 'client' ? (
                    <Users className="h-6 w-6" />
                  ) : (
                    <Shield className="h-6 w-6" />
                  )}
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">
                {loginType === 'client' ? 'Client Login' : 'Admin Login'}
              </CardTitle>
              <CardDescription>
                {loginType === 'client' 
                  ? 'Sign in with your User ID and password' 
                  : 'Sign in with your email and password'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Test Account Info */}
              {loginType === 'client' && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 mb-2 font-medium">Test Client Account:</p>
                  <p className="text-xs text-blue-600">User ID: nandlal</p>
                  <p className="text-xs text-blue-600">Password: password123</p>
                </div>
              )}
              
              {loginType === 'admin' && (
                <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800 mb-2 font-medium">Test Admin Account:</p>
                  <p className="text-xs text-purple-600">Email: admin@whatsapp-hub.com</p>
                  <p className="text-xs text-purple-600">Password: admin123</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">
                    {loginType === 'client' ? 'User ID' : 'Email'}
                  </Label>
                  <Input
                    id="identifier"
                    type={loginType === 'client' ? 'text' : 'email'}
                    value={userIdentifier}
                    onChange={(e) => setUserIdentifier(e.target.value)}
                    placeholder={loginType === 'client' ? 'Enter your User ID' : 'Enter your email'}
                    required
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="h-12 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    'Signing In...'
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center text-sm text-muted-foreground">
                {loginType === 'client' ? (
                  <p>Don't have an account? Contact your administrator to get access.</p>
                ) : (
                  <p>Need help? Contact the system administrator.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;