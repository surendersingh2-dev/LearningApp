import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  employeeId: string;
  location: string;
  isAdmin: boolean;
  groups: string[];
  password?: string;
  passwordGeneratedAt?: Date;
  createdBy?: string;
  createdAt?: Date;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  updateUserPassword: (userId: string, newPassword: string) => void;
  getAllUsers: () => User[];
  addUser: (user: User) => void;
  addUsers: (users: User[]) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  getUserByEmail: (email: string) => User | undefined;
  getUserByEmployeeId: (employeeId: string) => User | undefined;
  refreshUserData: () => void;
  clearAllData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Initial system users
const initialUsers: User[] = [
  {
    id: '1',
    email: 'admin@company.com',
    name: 'System Admin',
    phone: '+1234567890',
    employeeId: 'ADMIN001',
    location: 'Head Office',
    isAdmin: true,
    groups: [],
    password: 'admin123',
    passwordGeneratedAt: new Date(),
    createdBy: 'system',
    createdAt: new Date()
  }
];

// Helper function to load users from localStorage
const loadUsersFromStorage = (): User[] => {
  try {
    const savedUsers = localStorage.getItem('systemUsers');
    console.log('Raw localStorage data:', savedUsers);
    
    if (savedUsers) {
      const parsed = JSON.parse(savedUsers);
      console.log('Parsed users from storage:', parsed.length, 'users');
      
      // Ensure dates are properly parsed
      const processedUsers = parsed.map((user: any) => ({
        ...user,
        passwordGeneratedAt: user.passwordGeneratedAt ? new Date(user.passwordGeneratedAt) : undefined,
        createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
      }));
      
      console.log('Processed users:', processedUsers.map(u => ({
        email: u.email,
        hasPassword: !!u.password,
        password: u.password
      })));
      
      return processedUsers;
    }
    
    console.log('No users in storage, returning initial users');
    return initialUsers;
  } catch (error) {
    console.error('Error loading users from storage:', error);
    return initialUsers;
  }
};

// Helper function to save users to localStorage
const saveUsersToStorage = (users: User[]) => {
  try {
    localStorage.setItem('systemUsers', JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users to storage:', error);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>(() => loadUsersFromStorage());

  // Save users to localStorage whenever allUsers changes
  useEffect(() => {
    saveUsersToStorage(allUsers);
    console.log('Users updated in storage:', allUsers.length, 'users');
  }, [allUsers]);

  // Load current user session
  useEffect(() => {
    const loadCurrentUser = () => {
      try {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          // Verify the user still exists in the system
          const currentUser = allUsers.find(u => u.id === parsedUser.id);
          if (currentUser) {
            setUser({ ...currentUser, password: undefined });
          } else {
            // User was deleted, clear session
            localStorage.removeItem('currentUser');
          }
        }
      } catch (error) {
        console.error('Error loading current user:', error);
        localStorage.removeItem('currentUser');
      }
      setIsLoading(false);
    };

    loadCurrentUser();
  }, [allUsers]);

  // Function to refresh user data from storage
  const refreshUserData = useCallback(() => {
    const freshUsers = loadUsersFromStorage();
    setAllUsers(freshUsers);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Always get the freshest user data
      const currentUsers = loadUsersFromStorage();
      console.log('=== LOGIN DEBUG ===');
      console.log('Login attempt for:', email);
      console.log('Password provided:', password);
      console.log('Total users in storage:', currentUsers.length);
      console.log('All users:', currentUsers.map(u => ({ 
        id: u.id,
        email: u.email, 
        hasPassword: !!u.password,
        actualPassword: u.password,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt
      })));
      
      // Find user by email (case insensitive)
      const foundUser = currentUsers.find(u => 
        u.email.toLowerCase() === email.toLowerCase()
      );

      console.log('Found user for email', email, ':', foundUser ? {
        id: foundUser.id,
        email: foundUser.email,
        hasPassword: !!foundUser.password,
        storedPassword: foundUser.password,
        passwordMatch: foundUser.password === password,
        isAdmin: foundUser.isAdmin
      } : 'No user found');

      if (foundUser && foundUser.password === password) {
        // Create user object without password for session storage
        const userForStorage = { ...foundUser };
        delete userForStorage.password;
        
        setUser(userForStorage);
        localStorage.setItem('currentUser', JSON.stringify(userForStorage));
        console.log('✅ Login successful for:', foundUser.email);
        setIsLoading(false);
        return true;
      }
      
      if (foundUser) {
        console.log('❌ Password mismatch for:', email);
        console.log('Expected:', foundUser.password);
        console.log('Provided:', password);
        console.log('Match:', foundUser.password === password);
      } else {
        console.log('❌ No user found with email:', email);
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('currentUser');
  }, []);

  const updateUserPassword = useCallback((userId: string, newPassword: string) => {
    setAllUsers(prevUsers => {
      const updatedUsers = prevUsers.map(u => 
        u.id === userId 
          ? { ...u, password: newPassword, passwordGeneratedAt: new Date() }
          : u
      );
      console.log('Password updated for user:', userId);
      return updatedUsers;
    });
  }, []);

  const getAllUsers = useCallback(() => {
    return allUsers;
  }, [allUsers]);

  const addUser = useCallback((newUser: User) => {
    setAllUsers(prevUsers => {
      // Check for duplicates
      const exists = prevUsers.some(u => 
        u.email.toLowerCase() === newUser.email.toLowerCase() ||
        u.employeeId === newUser.employeeId
      );
      
      if (exists) {
        console.warn('User with this email or employee ID already exists');
        return prevUsers;
      }
      
      const userWithDate = { ...newUser, createdAt: new Date() };
      console.log('=== USER CREATION DEBUG ===');
      console.log('Adding new user:', {
        id: userWithDate.id,
        email: userWithDate.email,
        password: userWithDate.password,
        isAdmin: userWithDate.isAdmin,
        createdAt: userWithDate.createdAt
      });
      
      const updatedUsers = [...prevUsers, userWithDate];
      console.log('Total users after addition:', updatedUsers.length);
      
      // Immediately save to storage to ensure persistence
      setTimeout(() => {
        saveUsersToStorage(updatedUsers);
        console.log('User saved to localStorage immediately');
      }, 100);
      
      return updatedUsers;
    });
  }, []);

  const addUsers = useCallback((newUsers: User[]) => {
    setAllUsers(prevUsers => {
      const validUsers = newUsers.filter(newUser => {
        // Check if user already exists
        return !prevUsers.some(u => 
          u.email.toLowerCase() === newUser.email.toLowerCase() ||
          u.employeeId === newUser.employeeId
        );
      });
      
      const usersWithDates = validUsers.map(u => ({ ...u, createdAt: new Date() }));
      console.log('Adding bulk users:', usersWithDates.length, 'users');
      return [...prevUsers, ...usersWithDates];
    });
  }, []);

  const updateUser = useCallback((userId: string, updates: Partial<User>) => {
    setAllUsers(prevUsers => 
      prevUsers.map(u => 
        u.id === userId ? { ...u, ...updates } : u
      )
    );
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setAllUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    
    // If the deleted user is currently logged in, log them out
    if (user?.id === userId) {
      logout();
    }
  }, [user?.id, logout]);

  const getUserByEmail = useCallback((email: string) => {
    return allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  }, [allUsers]);

  const getUserByEmployeeId = useCallback((employeeId: string) => {
    return allUsers.find(u => u.employeeId === employeeId);
  }, [allUsers]);

  const clearAllData = useCallback(() => {
    localStorage.removeItem('systemUsers');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('systemGroups');
    setAllUsers(initialUsers);
    setUser(null);
    console.log('All data cleared, reset to initial state');
  }, []);

  const contextValue = {
    user, 
    login, 
    logout, 
    isLoading, 
    updateUserPassword,
    getAllUsers,
    addUser,
    addUsers,
    updateUser,
    deleteUser,
    getUserByEmail,
    getUserByEmployeeId,
    refreshUserData,
    clearAllData
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};