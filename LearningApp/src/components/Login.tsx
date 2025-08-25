import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { LogIn, Shield } from 'lucide-react';

interface LoginProps {
  onShowCredentials: () => void;
}

export const Login: React.FC<LoginProps> = ({ onShowCredentials }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password. Please check your credentials and try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-weight-medium flex items-center justify-center gap-2">
              <LogIn className="w-6 h-6" />
              Welcome Back
            </CardTitle>
            <CardDescription>
              Sign in to access your learning chat portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            
            {/* Admin Credentials Link */}
            <div className="mt-6 pt-6 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onShowCredentials}
              >
                <Shield className="w-4 h-4 mr-2" />
                View Admin Credentials
              </Button>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have login credentials?
              </p>
              <p className="text-sm text-muted-foreground">
                Contact your system administrator to get access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};