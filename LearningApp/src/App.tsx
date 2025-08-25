import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { Login } from './components/Login';
import { AdminCredentials } from './components/AdminCredentials';
import { AdminPortal } from './components/AdminPortal';
import { UserPortal } from './components/UserPortal';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [showCredentials, setShowCredentials] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Show credentials page if requested
    if (showCredentials) {
      return (
        <AdminCredentials onBack={() => setShowCredentials(false)} />
      );
    }
    
    // Show login page by default
    return (
      <Login onShowCredentials={() => setShowCredentials(true)} />
    );
  }

  // Route to appropriate portal based on user role
  return user.isAdmin ? <AdminPortal /> : <UserPortal />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}