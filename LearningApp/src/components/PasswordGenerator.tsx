import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Copy, RefreshCw, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface GeneratedPassword {
  userId: string;
  userName: string;
  email: string;
  password: string;
}

interface PasswordDisplayProps {
  passwords: GeneratedPassword[];
  onClose: () => void;
  title: string;
  description: string;
}

// Password generation utility
export const generateSecurePassword = (length: number = 12): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export const generateSimplePassword = (): string => {
  const adjectives = ['Happy', 'Smart', 'Bright', 'Quick', 'Swift', 'Bold', 'Calm', 'Cool'];
  const nouns = ['Tiger', 'Eagle', 'Lion', 'Bear', 'Wolf', 'Fox', 'Hawk', 'Star'];
  const numbers = Math.floor(Math.random() * 999) + 100;
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${numbers}`;
};

export const PasswordDisplayDialog: React.FC<PasswordDisplayProps> = ({
  passwords,
  onClose,
  title,
  description
}) => {
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [copiedPasswords, setCopiedPasswords] = useState<{[key: string]: boolean}>({});

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const copyPassword = async (password: string, userId: string) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedPasswords(prev => ({ ...prev, [userId]: true }));
      toast.success('Password copied to clipboard');
      
      setTimeout(() => {
        setCopiedPasswords(prev => ({ ...prev, [userId]: false }));
      }, 2000);
    } catch (err) {
      toast.error('Failed to copy password');
    }
  };

  const copyAllPasswords = async () => {
    const passwordText = passwords.map(p => 
      `${p.userName} (${p.email}): ${p.password}`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(passwordText);
      toast.success('All passwords copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy passwords');
    }
  };

  return (
    <Dialog open={passwords.length > 0} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Important:</strong> Save these passwords securely and share them with the users immediately. They won't be shown again for security reasons. Users can log in right away with their email and password.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-between items-center">
            <Label>Generated Passwords ({passwords.length} users)</Label>
            <Button variant="outline" size="sm" onClick={copyAllPasswords}>
              <Copy className="w-4 h-4 mr-2" />
              Copy All
            </Button>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-3">
            {passwords.map((userPassword) => (
              <div key={userPassword.userId} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{userPassword.userName}</p>
                    <p className="text-sm text-muted-foreground">{userPassword.email}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type={showPasswords[userPassword.userId] ? 'text' : 'password'}
                      value={userPassword.password}
                      readOnly
                      className="pr-20"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => togglePasswordVisibility(userPassword.userId)}
                      >
                        {showPasswords[userPassword.userId] ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyPassword(userPassword.password, userPassword.userId)}
                      >
                        {copiedPasswords[userPassword.userId] ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end">
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface PasswordRegenerateProps {
  userId: string;
  userName: string;
  userEmail: string;
  onPasswordRegenerated: (userId: string, newPassword: string) => void;
}

export const PasswordRegenerateDialog: React.FC<PasswordRegenerateProps & {
  open: boolean;
  onClose: () => void;
}> = ({ userId, userName, userEmail, onPasswordRegenerated, open, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [passwordType, setPasswordType] = useState<'secure' | 'simple'>('simple');

  const generateNewPassword = () => {
    const password = passwordType === 'secure' 
      ? generateSecurePassword() 
      : generateSimplePassword();
    setNewPassword(password);
  };

  const handleRegenerate = () => {
    if (newPassword) {
      onPasswordRegenerated(userId, newPassword);
      onClose();
      setNewPassword('');
    }
  };

  React.useEffect(() => {
    if (open) {
      generateNewPassword();
    }
  }, [open, passwordType]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Generate a new password for {userName} ({userEmail})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Password Type</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={passwordType === 'simple' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPasswordType('simple')}
              >
                Simple
              </Button>
              <Button
                variant={passwordType === 'secure' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPasswordType('secure')}
              >
                Secure
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {passwordType === 'simple' 
                ? 'Easy to remember (e.g., HappyTiger123)' 
                : 'High security with special characters'
              }
            </p>
          </div>
          
          <div>
            <Label>New Password</Label>
            <div className="flex gap-2 mt-2">
              <Input value={newPassword} readOnly />
              <Button variant="outline" size="icon" onClick={generateNewPassword}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleRegenerate}>
              Update Password
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};