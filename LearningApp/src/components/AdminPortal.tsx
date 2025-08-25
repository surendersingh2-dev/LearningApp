import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Users, MessageSquare, UserPlus, Users2, FileText, LogOut, Upload, Download, CheckCircle, XCircle, AlertCircle, Key, RotateCcw, Trash2, Info, Send, Plus, X, BarChart3, TrendingUp } from 'lucide-react';
import { PasswordDisplayDialog, PasswordRegenerateDialog, generateSimplePassword, generateSecurePassword } from './PasswordGenerator';
import * as XLSX from 'xlsx';

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

interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
  createdBy: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'mcq';
  timestamp: Date;
  groupId: string;
}

interface MCQResponse {
  id: string;
  messageId: string;
  userId: string;
  userName: string;
  userEmail: string;
  groupId: string;
  selectedAnswer: string;
  timestamp: Date;
  isCorrect: boolean;
}

interface BulkUploadResult {
  success: User[];
  errors: { row: number; error: string; data: any }[];
  passwords: { userId: string; userName: string; email: string; password: string }[];
}

interface GeneratedPassword {
  userId: string;
  userName: string;
  email: string;
  password: string;
}

export const AdminPortal: React.FC = () => {
  const { 
    user, 
    logout, 
    updateUserPassword, 
    getAllUsers, 
    addUser, 
    addUsers, 
    updateUser, 
    deleteUser,
    getUserByEmail,
    getUserByEmployeeId
  } = useAuth();

  // Get users from centralized auth system
  const allSystemUsers = getAllUsers();
  const users = allSystemUsers.filter(u => u.id !== user?.id); // Exclude current admin from user list
  
  const [groups, setGroups] = useState<Group[]>(() => {
    const savedGroups = localStorage.getItem('systemGroups');
    try {
      return savedGroups ? JSON.parse(savedGroups) : [];
    } catch {
      return [];
    }
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = localStorage.getItem('systemMessages');
    try {
      return savedMessages ? JSON.parse(savedMessages).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })) : [];
    } catch {
      return [];
    }
  });

  const [mcqResponses, setMcqResponses] = useState<MCQResponse[]>(() => {
    const savedResponses = localStorage.getItem('systemMCQResponses');
    try {
      return savedResponses ? JSON.parse(savedResponses).map((resp: any) => ({
        ...resp,
        timestamp: new Date(resp.timestamp)
      })) : [];
    } catch {
      return [];
    }
  });

  // Save groups to localStorage
  useEffect(() => {
    localStorage.setItem('systemGroups', JSON.stringify(groups));
    console.log('Groups saved to localStorage:', groups);
  }, [groups]);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('systemMessages', JSON.stringify(messages));
    console.log('Messages saved to localStorage:', messages);
  }, [messages]);

  // Load MCQ responses periodically
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const savedResponses = localStorage.getItem('systemMCQResponses');
        if (savedResponses) {
          const parsedResponses = JSON.parse(savedResponses).map((resp: any) => ({
            ...resp,
            timestamp: new Date(resp.timestamp)
          }));
          setMcqResponses(parsedResponses);
        }
      } catch (error) {
        console.error('Error loading MCQ responses:', error);
      }
    }, 3000); // Check every 3 seconds for new responses

    return () => clearInterval(interval);
  }, []);

  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    phone: '',
    employeeId: '',
    location: '',
    isAdmin: false
  });

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  });

  // Chat states
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  // MCQ states
  const [selectedMCQGroup, setSelectedMCQGroup] = useState<string | null>(null);
  const [mcqQuestion, setMcqQuestion] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['', '', '', '']);
  const [mcqCorrectAnswer, setMcqCorrectAnswer] = useState('');

  // Response analytics states
  const [selectedResponseGroup, setSelectedResponseGroup] = useState<string | null>(null);

  // Bulk upload states
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Password management states
  const [generatedPasswords, setGeneratedPasswords] = useState<GeneratedPassword[]>([]);
  const [passwordRegenerateDialog, setPasswordRegenerateDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    userEmail: string;
  }>({
    open: false,
    userId: '',
    userName: '',
    userEmail: ''
  });
  const [passwordType, setPasswordType] = useState<'simple' | 'secure'>('simple');
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  const handleCreateUser = () => {
    // Validate for duplicates
    const existingUser = getUserByEmail(newUser.email) || getUserByEmployeeId(newUser.employeeId);
    if (existingUser) {
      alert('User with this email or employee ID already exists!');
      return;
    }

    const password = passwordType === 'secure' ? generateSecurePassword() : generateSimplePassword();
    const newUserData: User = {
      ...newUser,
      id: Date.now().toString(),
      groups: [],
      password,
      passwordGeneratedAt: new Date(),
      createdBy: user?.id || 'unknown'
    };
    
    addUser(newUserData);
    console.log('User created successfully:', newUserData.email, 'Password:', password);
    
    // Show generated password
    setGeneratedPasswords([{
      userId: newUserData.id,
      userName: newUserData.name,
      email: newUserData.email,
      password
    }]);
    
    // Reset form
    setNewUser({
      email: '',
      name: '',
      phone: '',
      employeeId: '',
      location: '',
      isAdmin: false
    });
    setAddUserDialogOpen(false);
  };

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      alert('Group name is required');
      return;
    }

    const group: Group = {
      ...newGroup,
      id: Date.now().toString(),
      members: [],
      createdBy: user?.id || ''
    };
    setGroups([...groups, group]);
    setNewGroup({ name: '', description: '' });
    console.log('Group created:', group);
  };

  const handleAddUserToGroup = (userId: string, groupId: string) => {
    // Update user's groups
    const currentUser = allSystemUsers.find(u => u.id === userId);
    if (currentUser && !currentUser.groups?.includes(groupId)) {
      updateUser(userId, { 
        groups: [...(currentUser.groups || []), groupId]
      });
    }
    
    // Update group's members
    setGroups(groups.map(g => 
      g.id === groupId && !g.members.includes(userId)
        ? { ...g, members: [...g.members, userId] }
        : g
    ));
    
    console.log('User', userId, 'added to group', groupId);
  };

  const handleRemoveUserFromGroup = (userId: string, groupId: string) => {
    // Update user's groups
    const currentUser = allSystemUsers.find(u => u.id === userId);
    if (currentUser) {
      updateUser(userId, { 
        groups: (currentUser.groups || []).filter(gId => gId !== groupId)
      });
    }
    
    // Update group's members
    setGroups(groups.map(g => 
      g.id === groupId 
        ? { ...g, members: g.members.filter(m => m !== userId) }
        : g
    ));
    
    console.log('User', userId, 'removed from group', groupId);
  };

  const handleSendChatMessage = () => {
    if (!chatMessage.trim() || !selectedChat || !user) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      content: chatMessage,
      type: 'text',
      timestamp: new Date(),
      groupId: selectedChat
    };

    setMessages([...messages, message]);
    setChatMessage('');
    console.log('Chat message sent to group', selectedChat);
  };

  const handleSendMCQ = () => {
    if (!mcqQuestion.trim() || !selectedMCQGroup || !user) return;
    if (mcqOptions.some(opt => !opt.trim())) {
      alert('Please fill all MCQ options');
      return;
    }
    if (!mcqCorrectAnswer.trim()) {
      alert('Please specify the correct answer');
      return;
    }

    const mcqData = {
      question: mcqQuestion,
      options: mcqOptions.filter(opt => opt.trim()),
      correctAnswer: mcqCorrectAnswer
    };

    const message: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      content: JSON.stringify(mcqData),
      type: 'mcq',
      timestamp: new Date(),
      groupId: selectedMCQGroup
    };

    setMessages([...messages, message]);
    
    // Reset MCQ form
    setMcqQuestion('');
    setMcqOptions(['', '', '', '']);
    setMcqCorrectAnswer('');
    setSelectedMCQGroup(null);
    
    console.log('MCQ sent to group', selectedMCQGroup);
  };

  const getGroupMessages = (groupId: string) => {
    return messages.filter(m => m.groupId === groupId);
  };

  const getMCQMessages = () => {
    return messages.filter(m => m.type === 'mcq');
  };

  const getResponsesForMessage = (messageId: string) => {
    return mcqResponses.filter(r => r.messageId === messageId);
  };

  const getGroupResponses = (groupId: string) => {
    return mcqResponses.filter(r => r.groupId === groupId);
  };

  const calculateMCQStats = (messageId: string) => {
    const responses = getResponsesForMessage(messageId);
    const totalResponses = responses.length;
    const correctResponses = responses.filter(r => r.isCorrect).length;
    const accuracy = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0;
    
    return {
      totalResponses,
      correctResponses,
      incorrectResponses: totalResponses - correctResponses,
      accuracy: Math.round(accuracy)
    };
  };

  const handlePasswordRegenerate = (userId: string, newPassword: string) => {
    updateUserPassword(userId, newPassword);
    
    const userData = allSystemUsers.find(u => u.id === userId);
    if (userData) {
      setGeneratedPasswords([{
        userId,
        userName: userData.name,
        email: userData.email,
        password: newPassword
      }]);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      // Remove user from all groups
      setGroups(groups.map(g => ({
        ...g,
        members: g.members.filter(m => m !== userId)
      })));
      
      // Delete the user
      deleteUser(userId);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Name': 'John Doe',
        'Email': 'john.doe@company.com',
        'Phone': '+1234567890',
        'Employee ID': 'EMP001',
        'Location': 'New York',
        'Is Admin': 'FALSE'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users Template');
    XLSX.writeFile(wb, 'users_template.xlsx');
  };

  const downloadResponsesReport = () => {
    if (mcqResponses.length === 0) {
      alert('No responses to download');
      return;
    }

    const reportData = mcqResponses.map(response => {
      const message = messages.find(m => m.id === response.messageId);
      const group = groups.find(g => g.id === response.groupId);
      const mcqData = message ? JSON.parse(message.content) : { question: 'Unknown' };

      return {
        'User Name': response.userName,
        'Email': response.userEmail,
        'Group': group?.name || 'Unknown',
        'Question': mcqData.question,
        'Selected Answer': response.selectedAnswer,
        'Correct Answer': mcqData.correctAnswer,
        'Is Correct': response.isCorrect ? 'Yes' : 'No',
        'Submitted At': response.timestamp.toLocaleString()
      };
    });

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MCQ Responses');
    XLSX.writeFile(wb, `mcq_responses_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const validateUserData = (userData: any, rowIndex: number) => {
    const errors: string[] = [];

    if (!userData['Name'] || userData['Name'].trim() === '') {
      errors.push('Name is required');
    }

    if (!userData['Email'] || userData['Email'].trim() === '') {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData['Email'])) {
      errors.push('Invalid email format');
    }

    if (!userData['Employee ID'] || userData['Employee ID'].toString().trim() === '') {
      errors.push('Employee ID is required');
    }

    if (!userData['Phone'] || userData['Phone'].toString().trim() === '') {
      errors.push('Phone is required');
    }

    if (!userData['Location'] || userData['Location'].trim() === '') {
      errors.push('Location is required');
    }

    // Check for duplicate email and employee ID
    const existingUser = getUserByEmail(userData['Email']) || getUserByEmployeeId(userData['Employee ID']?.toString());
    
    if (existingUser) {
      errors.push('Email or Employee ID already exists');
    }

    return errors;
  };

  const processBulkUpload = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      const data = await uploadFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const result: BulkUploadResult = {
        success: [],
        errors: [],
        passwords: []
      };

      for (let i = 0; i < jsonData.length; i++) {
        setUploadProgress(((i + 1) / jsonData.length) * 100);
        
        const userData = jsonData[i] as any;
        const validationErrors = validateUserData(userData, i + 2);

        if (validationErrors.length > 0) {
          result.errors.push({
            row: i + 2,
            error: validationErrors.join(', '),
            data: userData
          });
          continue;
        }

        const password = passwordType === 'secure' ? generateSecurePassword() : generateSimplePassword();
        
        const newUser: User = {
          id: Date.now().toString() + '_' + i,
          name: userData['Name']?.toString().trim() || '',
          email: userData['Email']?.toString().trim().toLowerCase() || '',
          phone: userData['Phone']?.toString().trim() || '',
          employeeId: userData['Employee ID']?.toString().trim() || '',
          location: userData['Location']?.toString().trim() || '',
          isAdmin: userData['Is Admin']?.toString().toLowerCase() === 'true',
          groups: [],
          password,
          passwordGeneratedAt: new Date(),
          createdBy: user?.id || 'bulk-upload'
        };

        result.success.push(newUser);
        result.passwords.push({
          userId: newUser.id,
          userName: newUser.name,
          email: newUser.email,
          password
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Add successful users to the system
      addUsers(result.success);
      setUploadResult(result);

      // Show generated passwords
      if (result.passwords.length > 0) {
        setGeneratedPasswords(result.passwords);
      }

    } catch (error) {
      console.error('Error processing file:', error);
      setUploadResult({
        success: [],
        errors: [{
          row: 0,
          error: 'Failed to process file. Please ensure it\'s a valid Excel file.',
          data: {}
        }],
        passwords: []
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const resetBulkUpload = () => {
    setUploadFile(null);
    setUploadProgress(0);
    setUploadResult(null);
    setIsUploading(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const updateMcqOption = (index: number, value: string) => {
    const newOptions = [...mcqOptions];
    newOptions[index] = value;
    setMcqOptions(newOptions);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-weight-medium">Admin Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
            <Badge variant="outline">
              <Key className="w-3 h-3 mr-1" />
              Admin
            </Badge>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users2 className="w-4 h-4" />
              Groups ({groups.length})
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="mcq" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              MCQ
            </TabsTrigger>
            <TabsTrigger value="responses" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Responses ({mcqResponses.length})
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-weight-medium">User Management</h2>
              <div className="flex gap-2">
                <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Bulk User Upload</DialogTitle>
                      <DialogDescription>
                        Upload an Excel file to create multiple users at once. Passwords will be automatically generated and users can log in immediately.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      {!uploadFile && !uploadResult && (
                        <>
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              Created users will be able to log in immediately with their email and generated password. They'll be routed to the appropriate portal based on their admin status.
                            </AlertDescription>
                          </Alert>
                          
                          <div className="space-y-4">
                            <div>
                              <Label>Password Type for All Users</Label>
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
                              <Label>Download Template</Label>
                              <p className="text-sm text-muted-foreground mb-2">
                                Download the Excel template with the required columns
                              </p>
                              <Button variant="outline" onClick={downloadTemplate} className="w-full">
                                <Download className="w-4 h-4 mr-2" />
                                Download Excel Template
                              </Button>
                            </div>
                            <div>
                              <Label htmlFor="bulk-upload">Upload Excel File</Label>
                              <p className="text-sm text-muted-foreground mb-2">
                                Select an Excel file (.xlsx, .xls) with user data
                              </p>
                              <Input
                                id="bulk-upload"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setUploadFile(file);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {uploadFile && !uploadResult && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-weight-medium">Selected file: {uploadFile.name}</span>
                            <Button variant="outline" size="sm" onClick={resetBulkUpload}>
                              Cancel
                            </Button>
                          </div>
                          
                          {isUploading && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Creating users with login access...</span>
                                <span>{Math.round(uploadProgress)}%</span>
                              </div>
                              <Progress value={uploadProgress} />
                            </div>
                          )}

                          <Button 
                            onClick={processBulkUpload} 
                            disabled={isUploading}
                            className="w-full"
                          >
                            {isUploading ? 'Processing...' : 'Create Users with Login Access'}
                          </Button>
                        </div>
                      )}

                      {uploadResult && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Card>
                              <CardContent className="p-4 text-center">
                                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                <p className="font-weight-medium">{uploadResult.success.length}</p>
                                <p className="text-sm text-muted-foreground">Users Created</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                                <p className="font-weight-medium">{uploadResult.errors.length}</p>
                                <p className="text-sm text-muted-foreground">Errors</p>
                              </CardContent>
                            </Card>
                          </div>

                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              All successfully created users can now log in with their email and generated password. Share the login credentials securely with each user.
                            </AlertDescription>
                          </Alert>

                          {uploadResult.errors.length > 0 && (
                            <div className="space-y-2">
                              <Label>Errors Found</Label>
                              <div className="max-h-48 overflow-y-auto space-y-2">
                                {uploadResult.errors.map((error, index) => (
                                  <Alert key={index} variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                      <span className="font-weight-medium">Row {error.row}:</span> {error.error}
                                    </AlertDescription>
                                  </Alert>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                resetBulkUpload();
                                setBulkUploadOpen(false);
                              }}
                              className="flex-1"
                            >
                              Done
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={resetBulkUpload}
                              className="flex-1"
                            >
                              Upload Another File
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Add a new user to the system. They will be able to log in immediately with their email and generated password.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          The user will be able to log in with their email and generated password, and will be routed to the appropriate portal based on their role.
                        </AlertDescription>
                      </Alert>
                      
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
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email (Login Username)</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          placeholder="user@company.com"
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          This will be their login username
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="employeeId">Employee ID</Label>
                        <Input
                          id="employeeId"
                          value={newUser.employeeId}
                          onChange={(e) => setNewUser({...newUser, employeeId: e.target.value})}
                          placeholder="EMP001"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={newUser.phone}
                          onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                          placeholder="+1234567890"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={newUser.location}
                          onChange={(e) => setNewUser({...newUser, location: e.target.value})}
                          placeholder="New York"
                          required
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isAdmin"
                          checked={newUser.isAdmin}
                          onCheckedChange={(checked) => setNewUser({...newUser, isAdmin: checked})}
                        />
                        <Label htmlFor="isAdmin">Admin Access</Label>
                        <p className="text-xs text-muted-foreground">
                          Allow user to access admin portal
                        </p>
                      </div>
                      
                      <Button onClick={handleCreateUser} className="w-full">
                        Create User & Generate Login
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Users ({users.length})</CardTitle>
                <CardDescription>Manage system users and their permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Groups</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.employeeId}</TableCell>
                        <TableCell>{user.location}</TableCell>
                        <TableCell>
                          <Badge variant={user.isAdmin ? 'default' : 'secondary'}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(user.groups || []).map(groupId => {
                              const group = groups.find(g => g.id === groupId);
                              return group ? (
                                <Badge key={groupId} variant="outline" className="text-xs">
                                  {group.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPasswordRegenerateDialog({
                                open: true,
                                userId: user.id,
                                userName: user.name,
                                userEmail: user.email
                              })}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-weight-medium">Group Management</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                    <DialogDescription>
                      Create a learning group to organize users and send messages/MCQs
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="groupName">Group Name</Label>
                      <Input
                        id="groupName"
                        value={newGroup.name}
                        onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                        placeholder="Development Team"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="groupDescription">Description</Label>
                      <Textarea
                        id="groupDescription"
                        value={newGroup.description}
                        onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                        placeholder="Group for software development team members"
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleCreateGroup} className="w-full">
                      Create Group
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {groups.map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {group.name}
                      <Badge variant="outline">{group.members.length} members</Badge>
                    </CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-weight-medium">Members</Label>
                      <div className="mt-2 space-y-2">
                        {group.members.map(memberId => {
                          const member = allSystemUsers.find(u => u.id === memberId);
                          return member ? (
                            <div key={memberId} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <p className="text-sm font-weight-medium">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveUserFromGroup(memberId, group.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-weight-medium">Add Members</Label>
                      <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                        {users
                          .filter(user => !group.members.includes(user.id))
                          .map(user => (
                            <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <p className="text-sm font-weight-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddUserToGroup(user.id, group.id)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div>
              <h2 className="text-2xl font-weight-medium mb-4">Group Chat</h2>
              <p className="text-muted-foreground mb-6">Send messages to groups. Messages will be visible to all group members.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Select Group</CardTitle>
                  <CardDescription>Choose a group to send messages to</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groups.map((group) => (
                    <Button
                      key={group.id}
                      variant={selectedChat === group.id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedChat(group.id)}
                    >
                      <Users2 className="w-4 h-4 mr-2" />
                      <div className="text-left">
                        <div className="font-weight-medium">{group.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {group.members.length} members
                        </div>
                      </div>
                    </Button>
                  ))}
                  
                  {groups.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Users2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No groups created</p>
                      <p className="text-xs">Create a group first to send messages</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Send Message</CardTitle>
                  <CardDescription>
                    {selectedChat 
                      ? `Sending to: ${groups.find(g => g.id === selectedChat)?.name}`
                      : 'Select a group to send messages'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Type your message here..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    rows={4}
                    disabled={!selectedChat}
                  />
                  <Button 
                    onClick={handleSendChatMessage} 
                    disabled={!selectedChat || !chatMessage.trim()}
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>

                  {selectedChat && (
                    <div className="mt-6">
                      <Label className="text-sm font-weight-medium">Recent Messages</Label>
                      <div className="mt-2 max-h-48 overflow-y-auto space-y-2 border rounded p-2">
                        {getGroupMessages(selectedChat).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
                        ) : (
                          getGroupMessages(selectedChat).slice(-5).map(message => (
                            <div key={message.id} className="text-sm p-2 border rounded">
                              <div className="flex items-center justify-between">
                                <span className="font-weight-medium">{message.senderName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimestamp(message.timestamp)}
                                </span>
                              </div>
                              <p className="mt-1">{message.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* MCQ Tab */}
          <TabsContent value="mcq" className="space-y-6">
            <div>
              <h2 className="text-2xl font-weight-medium mb-4">MCQ Questions</h2>
              <p className="text-muted-foreground mb-6">Create and send multiple choice questions to groups for learning assessments.</p>
            </div>

            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Create MCQ Question</CardTitle>
                <CardDescription>Create a multiple choice question and send it to a group</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="mcqGroup">Select Group</Label>
                  <Select value={selectedMCQGroup || ''} onValueChange={setSelectedMCQGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} ({group.members.length} members)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mcqQuestion">Question</Label>
                  <Textarea
                    id="mcqQuestion"
                    placeholder="Enter your question here..."
                    value={mcqQuestion}
                    onChange={(e) => setMcqQuestion(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Options</Label>
                  <div className="space-y-2 mt-2">
                    {mcqOptions.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm font-weight-medium w-8">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <Input
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          value={option}
                          onChange={(e) => updateMcqOption(index, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="correctAnswer">Correct Answer</Label>
                  <Select value={mcqCorrectAnswer} onValueChange={setMcqCorrectAnswer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {mcqOptions.map((option, index) => 
                        option.trim() ? (
                          <SelectItem key={index} value={option}>
                            {String.fromCharCode(65 + index)}. {option}
                          </SelectItem>
                        ) : null
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleSendMCQ} 
                  disabled={!selectedMCQGroup || !mcqQuestion.trim() || mcqOptions.some(opt => !opt.trim()) || !mcqCorrectAnswer}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send MCQ Question
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Responses Tab */}
          <TabsContent value="responses" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-weight-medium">MCQ Responses</h2>
                <p className="text-muted-foreground">View and analyze user responses to MCQ questions</p>
              </div>
              <Button onClick={downloadResponsesReport} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </div>

            {/* Response Analytics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="font-weight-medium">{getMCQMessages().length}</p>
                  <p className="text-sm text-muted-foreground">Questions Sent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-weight-medium">{mcqResponses.length}</p>
                  <p className="text-sm text-muted-foreground">Total Responses</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-weight-medium">{mcqResponses.filter(r => r.isCorrect).length}</p>
                  <p className="text-sm text-muted-foreground">Correct Answers</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <BarChart3 className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <p className="font-weight-medium">
                    {mcqResponses.length > 0 
                      ? Math.round((mcqResponses.filter(r => r.isCorrect).length / mcqResponses.length) * 100)
                      : 0
                    }%
                  </p>
                  <p className="text-sm text-muted-foreground">Overall Accuracy</p>
                </CardContent>
              </Card>
            </div>

            {/* MCQ Questions with Responses */}
            <div className="space-y-6">
              {getMCQMessages().length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No MCQ Questions</h3>
                    <p className="text-muted-foreground">Create and send MCQ questions to start collecting responses</p>
                  </CardContent>
                </Card>
              ) : (
                getMCQMessages().map(message => {
                  const mcqData = JSON.parse(message.content);
                  const responses = getResponsesForMessage(message.id);
                  const stats = calculateMCQStats(message.id);
                  const group = groups.find(g => g.id === message.groupId);

                  return (
                    <Card key={message.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{mcqData.question}</CardTitle>
                            <CardDescription>
                              Sent to: {group?.name} • {formatDate(message.timestamp)}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {responses.length}/{group?.members.length || 0} responses
                            </Badge>
                            <Badge variant={stats.accuracy >= 70 ? "default" : "destructive"}>
                              {stats.accuracy}% accuracy
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Question Options with Response Count */}
                        <div className="space-y-2">
                          <Label className="text-sm font-weight-medium">Answer Distribution</Label>
                          {mcqData.options.map((option: string, index: number) => {
                            const optionResponses = responses.filter(r => r.selectedAnswer === option);
                            const percentage = responses.length > 0 ? (optionResponses.length / responses.length) * 100 : 0;
                            const isCorrect = option === mcqData.correctAnswer;

                            return (
                              <div key={index} className={`p-3 border rounded ${isCorrect ? 'border-green-200 bg-green-50' : ''}`}>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-weight-medium">
                                    {String.fromCharCode(65 + index)}. {option}
                                    {isCorrect && <Badge className="ml-2">Correct</Badge>}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {optionResponses.length} responses ({Math.round(percentage)}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-blue-500'}`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Individual Responses */}
                        {responses.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-weight-medium">Individual Responses</Label>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                              {responses.map(response => (
                                <div key={response.id} className="flex items-center justify-between p-2 border rounded text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="font-weight-medium">{response.userName}</span>
                                    <span className="text-muted-foreground">({response.userEmail})</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span>{response.selectedAnswer}</span>
                                    <Badge variant={response.isCorrect ? "default" : "destructive"} className="text-xs">
                                      {response.isCorrect ? "Correct" : "Incorrect"}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatTimestamp(response.timestamp)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Password Dialogs */}
      <PasswordDisplayDialog 
        passwords={generatedPasswords}
        onClose={() => setGeneratedPasswords([])}
      />
      
      <PasswordRegenerateDialog
        open={passwordRegenerateDialog.open}
        onClose={() => setPasswordRegenerateDialog({
          open: false,
          userId: '',
          userName: '',
          userEmail: ''
        })}
        userId={passwordRegenerateDialog.userId}
        userName={passwordRegenerateDialog.userName}
        userEmail={passwordRegenerateDialog.userEmail}
        onRegenerate={handlePasswordRegenerate}
      />
    </div>
  );
};