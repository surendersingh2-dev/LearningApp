import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarContent, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { MessageSquare, Users2, FileText, LogOut, Send, Paperclip, RefreshCw, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

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

interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
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

export const UserPortal: React.FC = () => {
  const { user, logout, getAllUsers } = useAuth();
  
  // Load groups from localStorage (shared with AdminPortal)
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [responses, setResponses] = useState<MCQResponse[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Load data from localStorage on component mount and when groups change
  useEffect(() => {
    loadGroupsFromStorage();
    loadMessagesFromStorage();
    loadResponsesFromStorage();
    
    // Set up periodic refresh to catch new messages
    const interval = setInterval(() => {
      loadMessagesFromStorage();
      loadResponsesFromStorage();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const loadGroupsFromStorage = () => {
    try {
      const savedGroups = localStorage.getItem('systemGroups');
      if (savedGroups) {
        const parsedGroups = JSON.parse(savedGroups);
        console.log('Loaded groups from storage:', parsedGroups);
        setGroups(parsedGroups);
      }
    } catch (error) {
      console.error('Error loading groups from storage:', error);
    }
  };

  const loadMessagesFromStorage = () => {
    try {
      const savedMessages = localStorage.getItem('systemMessages');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        console.log('Loaded messages from storage:', parsedMessages);
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error('Error loading messages from storage:', error);
    }
  };

  const loadResponsesFromStorage = () => {
    try {
      const savedResponses = localStorage.getItem('systemMCQResponses');
      if (savedResponses) {
        const parsedResponses = JSON.parse(savedResponses).map((resp: any) => ({
          ...resp,
          timestamp: new Date(resp.timestamp)
        }));
        console.log('Loaded responses from storage:', parsedResponses);
        setResponses(parsedResponses);
      }
    } catch (error) {
      console.error('Error loading responses from storage:', error);
    }
  };

  const saveMessagesToStorage = (newMessages: Message[]) => {
    try {
      localStorage.setItem('systemMessages', JSON.stringify(newMessages));
      console.log('Messages saved to storage');
    } catch (error) {
      console.error('Error saving messages to storage:', error);
    }
  };

  const saveResponsesToStorage = (newResponses: MCQResponse[]) => {
    try {
      localStorage.setItem('systemMCQResponses', JSON.stringify(newResponses));
      console.log('MCQ responses saved to storage');
    } catch (error) {
      console.error('Error saving responses to storage:', error);
    }
  };

  // Get groups where current user is a member
  const userGroups = groups.filter(group => 
    group.members.includes(user?.id || '') || group.createdBy === user?.id
  );

  console.log('User groups for', user?.name, ':', userGroups);
  console.log('All groups:', groups);
  console.log('User ID:', user?.id);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedGroup || !user) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      content: newMessage,
      type: 'text',
      timestamp: new Date(),
      groupId: selectedGroup
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    saveMessagesToStorage(updatedMessages);
    setNewMessage('');
  };

  const handleMCQAnswer = (messageId: string, selectedOption: string, mcqData: MCQQuestion) => {
    if (!user) return;

    // Check if user has already answered this question
    const existingResponse = responses.find(r => r.messageId === messageId && r.userId === user.id);
    if (existingResponse) {
      console.log('User has already answered this question');
      return;
    }

    const isCorrect = selectedOption === mcqData.correctAnswer;
    
    const response: MCQResponse = {
      id: Date.now().toString(),
      messageId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      groupId: selectedGroup || '',
      selectedAnswer: selectedOption,
      timestamp: new Date(),
      isCorrect
    };

    const updatedResponses = [...responses, response];
    setResponses(updatedResponses);
    saveResponsesToStorage(updatedResponses);

    console.log('MCQ answer submitted:', response);
  };

  const hasUserAnswered = (messageId: string): boolean => {
    return responses.some(r => r.messageId === messageId && r.userId === user?.id);
  };

  const getUserResponse = (messageId: string): MCQResponse | undefined => {
    return responses.find(r => r.messageId === messageId && r.userId === user?.id);
  };

  const getGroupMessages = (groupId: string) => {
    return messages.filter(m => m.groupId === groupId);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: Message) => {
    const isOwn = message.senderId === user?.id;

    if (message.type === 'mcq') {
      const mcqData: MCQQuestion = JSON.parse(message.content);
      const userResponse = getUserResponse(message.id);
      const hasAnswered = hasUserAnswered(message.id);

      return (
        <div key={message.id} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs">
                {message.senderName[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{message.senderName}</span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(message.timestamp)}
            </span>
            {hasAnswered && (
              <Badge variant={userResponse?.isCorrect ? "default" : "destructive"} className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                {userResponse?.isCorrect ? "Correct" : "Incorrect"}
              </Badge>
            )}
          </div>
          
          <Card className="max-w-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">MCQ Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium">{mcqData.question}</p>
              
              {hasAnswered ? (
                <div className="space-y-2">
                  <Alert className={userResponse?.isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">
                          Your answer: {userResponse?.selectedAnswer}
                        </p>
                        <p className="text-sm">
                          {userResponse?.isCorrect ? "Correct! Well done." : `Incorrect. Correct answer: ${mcqData.correctAnswer}`}
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">All options:</p>
                    {mcqData.options.map((option, index) => (
                      <div
                        key={index}
                        className={`w-full p-2 border rounded text-left text-sm ${
                          option === userResponse?.selectedAnswer
                            ? userResponse.isCorrect
                              ? 'border-green-500 bg-green-100 text-green-800'
                              : 'border-red-500 bg-red-100 text-red-800'
                            : option === mcqData.correctAnswer
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                        }`}
                      >
                        {String.fromCharCode(65 + index)}. {option}
                        {option === mcqData.correctAnswer && option !== userResponse?.selectedAnswer && (
                          <span className="ml-2 text-green-600 font-medium">(Correct)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Select your answer:</p>
                  {mcqData.options.map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleMCQAnswer(message.id, option, mcqData)}
                    >
                      {String.fromCharCode(65 + index)}. {option}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div key={message.id} className={`mb-4 flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-1' : 'order-2'}`}>
          {!isOwn && (
            <div className="flex items-center gap-2 mb-1">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs">
                  {message.senderName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{message.senderName}</span>
            </div>
          )}
          <div
            className={`rounded-lg px-3 py-2 ${
              isOwn
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <p className="text-sm">{message.content}</p>
            <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
              {formatTimestamp(message.timestamp)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const refreshData = () => {
    console.log('Manual refresh triggered by user');
    loadGroupsFromStorage();
    loadMessagesFromStorage();
    loadResponsesFromStorage();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-semibold">Learning Chat</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
            {user?.isAdmin && (
              <Badge variant="outline">Admin Access</Badge>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Groups */}
        <div className="w-80 border-r bg-card">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <Users2 className="w-4 h-4" />
              My Groups ({userGroups.length})
            </h2>
          </div>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {userGroups.map((group) => (
                <Button
                  key={group.id}
                  variant={selectedGroup === group.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedGroup(group.id)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{group.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {group.description}
                    </div>
                  </div>
                </Button>
              ))}
              
              {userGroups.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Users2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No groups assigned</p>
                  <p className="text-xs">Contact admin to join groups</p>
                  <Button variant="outline" size="sm" onClick={refreshData} className="mt-4">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check for updates
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedGroup ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {userGroups.find(g => g.id === selectedGroup)?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {userGroups.find(g => g.id === selectedGroup)?.members.length} members
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <FileText className="w-3 h-3 mr-1" />
                      Learning Group
                    </Badge>
                    <Button variant="outline" size="sm" onClick={refreshData}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {getGroupMessages(selectedGroup).length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs">Start the conversation!</p>
                    </div>
                  ) : (
                    getGroupMessages(selectedGroup).map(renderMessage)
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t bg-card">
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a group to start chatting</h3>
                <p className="text-sm">Choose a group from the sidebar to view messages and participate in discussions</p>
                {userGroups.length === 0 && (
                  <Button variant="outline" size="sm" onClick={refreshData} className="mt-4">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check for new groups
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};