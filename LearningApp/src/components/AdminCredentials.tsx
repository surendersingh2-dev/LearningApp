import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Copy, Shield, Key, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';

interface AdminCredentialsProps {
  onBack: () => void;
}

export const AdminCredentials: React.FC<AdminCredentialsProps> = ({ onBack }) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [copyError, setCopyError] = React.useState<string | null>(null);

  const adminCredential = {
    email: 'admin@company.com',
    password: 'admin123',
    role: 'System Administrator',
    description: 'Full system access with user management, group creation, and analytics capabilities'
  };

  // Fallback copy method using document.execCommand
  const fallbackCopyTextToClipboard = (text: string): boolean => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    setCopyError(null);
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        return;
      }
    } catch (err) {
      console.log('Clipboard API failed, trying fallback method');
    }
    
    // Fallback to execCommand method
    try {
      const success = fallbackCopyTextToClipboard(text);
      if (success) {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      } else {
        setCopyError('Copy failed - please select and copy manually');
        setTimeout(() => setCopyError(null), 3000);
      }
    } catch (err) {
      setCopyError('Copy not supported - please select and copy manually');
      setTimeout(() => setCopyError(null), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-weight-medium flex items-center justify-center gap-2">
              <Shield className="w-6 h-6" />
              Admin Credentials
            </CardTitle>
            <CardDescription>
              Default administrator login information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Back Button */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>

            {/* Copy Error Alert */}
            {copyError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">{copyError}</span>
              </div>
            )}

            {/* Admin Account Info */}
            <div className="space-y-4">
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    Administrator
                  </Badge>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-weight-medium">Email Address</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-sm font-mono select-all">
                      {adminCredential.email}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(adminCredential.email, 'email')}
                      className="shrink-0"
                    >
                      {copiedField === 'email' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-weight-medium">Password</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-sm font-mono select-all">
                      {adminCredential.password}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(adminCredential.password, 'password')}
                      className="shrink-0"
                    >
                      {copiedField === 'password' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Manual Copy Instructions */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    {adminCredential.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    💡 If copy buttons don't work, click on the credential fields to select all text, then use Ctrl+C (or Cmd+C on Mac) to copy.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Login Button */}
            <Button 
              className="w-full"
              onClick={onBack}
            >
              Use These Credentials to Login
            </Button>
          </CardContent>
        </Card>

        {/* Admin Portal Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Admin Portal Features</CardTitle>
            <CardDescription>What you can do with admin access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Create and manage user accounts</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Bulk user creation via Excel upload</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Create and manage learning groups</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Send messages and MCQ questions</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">View response analytics and reports</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Password management and regeneration</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Security Notice:</strong> These are default credentials for demonstration purposes.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              In a production environment, ensure to change the default admin password immediately after first login.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};