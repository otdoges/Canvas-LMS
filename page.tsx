'use client'

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Book, Calendar, ChevronDown, FileText, Home, Search, X, Moon, Sun, ArrowLeft, RefreshCw, UserPlus, Mail, Settings, Plus, Trash2, Save, LogOut, Eye, Building, UserX, EyeOff } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Link from 'next/link'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

// Types
interface User {
  id: number;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  schoolId?: number;
  districtId?: number;
}

interface School {
  id: number;
  name: string;
  domain: string;
  districtId: number;
}

interface District {
  id: number;
  name: string;
  code: string;
}

interface Class {
  id: number;
  name: string;
  code: string;
  teacherId: number;
  schoolId: number;
  color: string;
  newAssignments: number;
  description: string;
}

interface Grade {
  id: number;
  studentId: number;
  classId: number;
  assignmentId: number;
  score: number;
}

interface Todo {
  id: number;
  userId: number;
  classId: number;
  task: string;
  dueDate: string;
}

interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  subject: string;
  content: string;
  date: string;
}

interface CourseData {
  id: number;
  name: string;
  code: string;
  assignments: Array<{
    id: number;
    name: string;
    dueDate: string;
    grade: number | null;
  }>;
  announcements: Array<{
    id: number;
    title: string;
    content: string;
  }>;
  resources: Array<{
    id: number;
    name: string;
    url: string;
  }>;
}

// API functions
const api = {
  async login(email: string, password: string): Promise<User | null> {
    const response = await fetch('/backend/login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  },

  async register(email: string, password: string, name: string, role: 'student' | 'teacher'): Promise<User | null> {
    const response = await fetch('/backend/register.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name, role }),
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  },

  async createClass(teacherId: number, name: string, code: string, description: string): Promise<Class> {
    const response = await fetch('/backend/create_class.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ teacherId, name, code, description }),
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to create class');
  },

  async getClasses(userId: number, role: string): Promise<Class[]> {
    const response = await fetch(`/backend/get_classes.php?userId=${userId}&role=${role}`);
    if (response.ok) {
      return await response.json();
    }
    return [];
  },

  async registerStudents(schoolId: number, students: { email: string; name: string; password: string }[]): Promise<User[]> {
    const response = await fetch('/backend/register_students.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ schoolId, students }),
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to register students');
  },

  async getGrades(userId: number): Promise<Grade[]> {
    const response = await fetch(`/backend/get_grades.php?userId=${userId}`);
    if (response.ok) {
      return await response.json();
    }
    return [];
  },

  async getTodos(userId: number): Promise<Todo[]> {
    const response = await fetch(`/backend/get_todos.php?userId=${userId}`);
    if (response.ok) {
      return await response.json();
    }
    return [];
  },

  async getMessages(userId: number): Promise<Message[]> {
    const response = await fetch(`/backend/get_messages.php?userId=${userId}`);
    if (response.ok) {
      return await response.json();
    }
    return [];
  },

  async getCourseData(courseId: number): Promise<CourseData> {
    const response = await fetch(`/backend/get_course_data.php?courseId=${courseId}`);
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch course data');
  },

  async joinDistrict(code: string): Promise<District | null> {
    const response = await fetch('/backend/join_district.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  },

  async getUsers(): Promise<User[]> {
    const response = await fetch('/backend/get_users.php');
    if (response.ok) {
      return await response.json();
    }
    return [];
  },

  async removeUserFromDistrict(userId: number): Promise<boolean> {
    const response = await fetch('/backend/remove_user_from_district.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    return response.ok;
  },
};

export default function CanvasApp() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showGrades, setShowGrades] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showJoinClassDialog, setShowJoinClassDialog] = useState(false);
  const [joinClassCode, setJoinClassCode] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Class | null>(null);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showCreateClassDialog, setShowCreateClassDialog] = useState(false);
  const [showBulkRegisterDialog, setShowBulkRegisterDialog] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [showJoinDistrictDialog, setShowJoinDistrictDialog] = useState(false);
  const [joinDistrictCode, setJoinDistrictCode] = useState("");
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showStudentCodeDialog, setShowStudentCodeDialog] = useState(false);
  const [studentCode, setStudentCode] = useState("");
  const [showTeacherWelcomeDialog, setShowTeacherWelcomeDialog] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerRole, setRegisterRole] = useState<'student' | 'teacher'>('student');

  // Create class form state
  const [newClassName, setNewClassName] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");

  // Bulk register students form state
  const [bulkRegisterData, setBulkRegisterData] = useState("");

  useEffect(() => {
    if (user || isPreview) {
      const loadData = async () => {
        try {
          setLoading(true);
          const [classesData, gradesData, todosData, messagesData] = await Promise.all([
            api.getClasses(user?.id || 0, user?.role || 'student'),
            api.getGrades(user?.id || 0),
            api.getTodos(user?.id || 0),
            api.getMessages(user?.id || 0)
          ]);
          setClasses(classesData);
          setGrades(gradesData);
          setTodos(todosData);
          setMessages(messagesData);
        } catch (error) {
          console.error("Error fetching data:", error);
          setError("Failed to load data. Please try again later.");
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [user, isPreview]);

  useEffect(() => {
    if (selectedCourse) {
      const loadCourseData = async () => {
        try {
          setLoading(true);
          const data = await api.getCourseData(selectedCourse.id);
          setCourseData(data);
        } catch (error) {
          console.error("Error fetching course data:", error);
          setError("Failed to load course data. Please try again later.");
        } finally {
          setLoading(false);
        }
      };
      loadCourseData();
    }
  }, [selectedCourse]);

  const filteredClasses = useMemo(() => {
    return classes.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, classes]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCourseClick = useCallback(() => {
    setShowCourseDialog(true);
  }, []);

  const handleCourseSelect = useCallback((course: Class) => {
    setShowCourseDialog(false);
    setSelectedCourse(course);
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      setLoading(true);
      const loggedInUser = await api.login(loginEmail, loginPassword);
      if (loggedInUser) {
        setUser(loggedInUser);
        setShowLoginDialog(false);
        toast.success("Logged in successfully!");
      } else {
        toast.error("Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  }, [loginEmail, loginPassword]);

  const handleRegister = useCallback(async () => {
    try {
      setLoading(true);
      const newUser = await api.register(registerEmail, registerPassword, registerName, registerRole);
      if (newUser) {
        setUser(newUser);
        setShowRegisterDialog(false);
        if (newUser.role === 'student') {
          setShowStudentCodeDialog(true);
        } else if (newUser.role === 'teacher') {
          setShowTeacherWelcomeDialog(true);
        }
        toast.success("Registered successfully!");
      } else {
        toast.error("Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An error occurred during registration");
    } finally {
      setLoading(false);
    }
  }, [registerEmail, registerPassword, registerName, registerRole]);

  const handleCreateClass = useCallback(async () => {
    if (!user || user.role !== 'teacher') {
      toast.error("Only teachers can create classes");
      return;
    }
    try {
      setLoading(true);
      const newClass = await api.createClass(user.id, newClassName, newClassCode, newClassDescription);
      setClasses(prevClasses => [...prevClasses, newClass]);
      setShowCreateClassDialog(false);
      toast.success("Class created successfully!");
    } catch (error) {
      console.error("Class creation error:", error);
      toast.error("An error occurred while creating the class");
    } finally {
      setLoading(false);
    }
  }, [user, newClassName, newClassCode, newClassDescription]);

  const handleBulkRegisterStudents =   useCallback(async () => {
    if (!user || user.role !== 'admin' || !user.schoolId) {
      toast.error("Only school admins can bulk register students");
      return;
    }
    try {
      setLoading(true);
      const students = bulkRegisterData.split('\n').map(line => {
        const [email, name, password] = line.split(',');
        return { email: email.trim(), name: name.trim(), password: password.trim() };
      });
      const registeredStudents = await api.registerStudents(user.schoolId, students);
      setShowBulkRegisterDialog(false);
      toast.success(`${registeredStudents.length} students registered successfully!`);
    } catch (error) {
      console.error("Bulk registration error:", error);
      toast.error("An error occurred during bulk registration");
    } finally {
      setLoading(false);
    }
  }, [user, bulkRegisterData]);

  const handleLogout = useCallback(() => {
    setUser(null);
    setClasses([]);
    setGrades([]);
    setTodos([]);
    setMessages([]);
    setSelectedCourse(null);
    setCourseData(null);
    setIsPreview(false);
    setShowAdminDashboard(false);
    toast.success("Logged out successfully");
  }, []);

  const handlePreview = useCallback(() => {
    setIsPreview(true);
    setUser({
      id: 0,
      email: 'preview@example.com',
      name: 'Preview User',
      role: 'student'
    });
    setClasses([
      { id: 1, name: "Mathematics 101", code: "MATH101", teacherId: 1, schoolId: 1, color: "bg-blue-500", newAssignments: 2, description: "Introduction to Mathematics" },
      { id: 2, name: "History 101", code: "HIST101", teacherId: 2, schoolId: 1, color: "bg-green-500", newAssignments: 1, description: "World History" },
      { id: 3, name: "Science 101", code: "SCI101", teacherId: 3, schoolId: 1, color: "bg-yellow-500", newAssignments: 3, description: "Introduction to Science" },
    ]);
    setGrades([
      { id: 1, studentId: 0, classId: 1, assignmentId: 1, score: 85 },
      { id: 2, studentId: 0, classId: 2, assignmentId: 2, score: 92 },
      { id: 3, studentId: 0, classId: 3, assignmentId: 3, score: 78 },
    ]);
    setTodos([
      { id: 1, userId: 0, classId: 1, task: "Complete Math homework", dueDate: "2023-06-15" },
      { id: 2, userId: 0, classId: 2, task: "Read History chapter 5", dueDate: "2023-06-16" },
      { id: 3, userId: 0, classId: 3, task: "Prepare for Science quiz", dueDate: "2023-06-17" },
    ]);
    setMessages([
      { id: 1, senderId: 1, recipientId: 0, subject: "Welcome to Mathematics 101", content: "Welcome to the class! Here's some important information...", date: "2023-06-10" },
      { id: 2, senderId: 2, recipientId: 0, subject: "History assignment due date", content: "Just a reminder that your history assignment is due next week.", date: "2023-06-11" },
      { id: 3, senderId: 3, recipientId: 0, subject: "Science lab partners", content: "Please check the updated lab partner list for this semester.", date: "2023-06-12" },
    ]);
    toast.info("You are now in preview mode");
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const handleJoinDistrict = useCallback(async () => {
    try {
      setLoading(true);
      const district = await api.joinDistrict(joinDistrictCode);
      if (district) {
        toast.success(`Joined district: ${district.name}`);
        setShowJoinDistrictDialog(false);
      } else {
        toast.error("Invalid district code");
      }
    } catch (error) {
      console.error("Join district error:", error);
      toast.error("An error occurred while joining the district");
    } finally {
      setLoading(false);
    }
  }, [joinDistrictCode]);

  const handleOpenAdminDashboard = useCallback(async () => {
    if (user?.role !== 'admin') {
      toast.error("Only administrators can access the dashboard");
      return;
    }
    try {
      setLoading(true);
      const fetchedUsers = await api.getUsers();
      setUsers(fetchedUsers);
      setShowAdminDashboard(true);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users for the admin dashboard");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleRemoveUserFromDistrict = useCallback(async (userId: number) => {
    try {
      setLoading(true);
      const success = await api.removeUserFromDistrict(userId);
      if (success) {
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
        toast.success("User removed from district successfully");
      } else {
        toast.error("Failed to remove user from district");
      }
    } catch (error) {
      console.error("Error removing user from district:", error);
      toast.error("An error occurred while removing the user from the district");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStudentCodeSubmit = useCallback(async () => {
    try {
      setLoading(true);
      // Here you would typically send the code to your backend to validate and associate with the student
      // For now, we'll just simulate a successful join
      toast.success("Successfully joined with code: " + studentCode);
      setShowStudentCodeDialog(false);
    } catch (error) {
      console.error("Error joining with code:", error);
      toast.error("Failed to join with the provided code");
    } finally {
      setLoading(false);
    }
  }, [studentCode]);

  const handleTeacherWelcome = useCallback((startCourse: boolean) => {
    setShowTeacherWelcomeDialog(false);
    if (startCourse) {
      // Here you would typically navigate to the course creation page
      // For now, we'll just show a toast message
      toast.info("Navigating to course creation...");
    }
  }, []);

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  if (!user && !isPreview) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-gray-100'}`}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`p-8 rounded-lg shadow-lg ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
        >
          <h1 className="text-3xl font-bold mb-6 text-center">Welcome to Canvas</h1>
          <div className="space-y-4">
            <Button onClick={() => setShowLoginDialog(true)} className={`w-full ${darkMode ? 'bg-black text-white hover:bg-gray-900' : ''}`}>
              Login
            </Button>
            <Button onClick={() => setShowRegisterDialog(true)} variant="outline" className={`w-full ${darkMode ? 'bg-black text-white hover:bg-gray-900' : ''}`}>
              Register
            </Button>
            <Button onClick={handlePreview} variant="secondary" className={`w-full ${darkMode ? 'bg-black text-white hover:bg-gray-900' : ''}`}>
              <Eye className="mr-2 h-4 w-4" />
              Preview Dashboard
            </Button>
            <Button onClick={() => setShowJoinDistrictDialog(true)} variant="outline" className={`w-full ${darkMode ? 'bg-black text-white hover:bg-gray-900' : ''}`}>
              <Building className="mr-2 h-4 w-4" />
              Join District
            </Button>
          </div>
          <Button onClick={toggleDarkMode} variant="ghost" className={`mt-4 w-full ${darkMode ? 'text-white hover:bg-gray-900' : ''}`}>
            {darkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </motion.div>

        {/* Login Dialog */}
        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
          <DialogContent className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white'} p-0`}>
            <div className={`min-h-[80vh] flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-gray-700 to-gray-900' : 'bg-gradient-to-br from-blue-500 to-purple-600'} p-4`}>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-xl p-8 w-full max-w-md`}
              >
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`text-3xl font-bold text-center mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}
                >
                  Welcome to Canvas
                </motion.h1>
                <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email" className={darkMode ? 'text-gray-200' : ''}>Email</Label>
                    <Input
                      type="email"
                      id="login-email"
                      placeholder="Enter your email"
                      required
                      className={`w-full ${darkMode ? 'bg-gray-800 text-white border-gray-700' : ''}`}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password" className={darkMode ? 'text-gray-200' : ''}>Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        id="login-password"
                        placeholder="Enter your password"
                        required
                        className={`w-full pr-10 ${darkMode ? 'bg-gray-800 text-white border-gray-700' : ''}`}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />
                        ) : (
                          <Eye className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />
                        )}
                      </button>
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button type="submit" className={`w-full ${darkMode ? 'bg-black text-white hover:bg-gray-900' : ''}`}>
                      Log In
                    </Button>
                  </motion.div>
                </form>
                <div className="mt-6 text-center">
                  <Link href="/forgot-password" className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'}`}>
                    Forgot password?
                  </Link>
                </div>
                <div className="mt-8">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setShowLoginDialog(false); handlePreview(); }}
                    className={`${darkMode ? 'bg-gray-900 text-gray-200 hover:bg-gray-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} py-2 px-4 rounded-md text-center cursor-pointer transition-colors`}
                  >
                    Preview Dashboard
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Register Dialog */}
        <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
          <DialogContent className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
            <DialogHeader>
              <DialogTitle>Register</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="register-email">Email</Label>
                <Input 
                  id="register-email" 
                  type="email" 
                  value={registerEmail} 
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className={darkMode ? 'bg-gray-800 text-white border-gray-700' : ''}
                />
              </div>
              <div>
                <Label htmlFor="register-password">Password</Label>
                <Input 
                  id="register-password" 
                  type="password" 
                  value={registerPassword} 
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className={darkMode ? 'bg-gray-800 text-white border-gray-700' : ''}
                />
              </div>
              <div>
                <Label htmlFor="register-name">Name</Label>
                <Input 
                  id="register-name" 
                  value={registerName} 
                  onChange={(e) => setRegisterName(e.target.value)}
                  className={darkMode ? 'bg-gray-800 text-white border-gray-700' : ''}
                />
              </div>
              <div>
                <Label htmlFor="register-role">Role</Label>
                <Select value={registerRole} onValueChange={(value: 'student' | 'teacher') => setRegisterRole(value)}>
                  <SelectTrigger className={darkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleRegister} className={`${darkMode ? 'bg-black text-white hover:bg-gray-900' : ''}`}>Register</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Join District Dialog */}
        <Dialog open={showJoinDistrictDialog} onOpenChange={setShowJoinDistrictDialog}>
          <DialogContent className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
            <DialogHeader>
              <DialogTitle>Join District</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="join-district-code">District Code</Label>
                <Input
                  id="join-district-code"
                  value={joinDistrictCode}
                  onChange={(e) => setJoinDistrictCode(e.target.value)}
                  placeholder="Enter district code"
                  className={darkMode ? 'bg-gray-800 text-white border-gray-700' : ''}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleJoinDistrict} className={`${darkMode ? 'bg-black text-white hover:bg-gray-900' : ''}`}>Join District</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Student Code Dialog */}
        <Dialog open={showStudentCodeDialog} onOpenChange={setShowStudentCodeDialog}>
          <DialogContent className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
            <DialogHeader>
              <DialogTitle>Join Your School or District</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Do you have a district join code or school code?</p>
              <Input
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="Enter your code"
                className={darkMode ? 'bg-gray-800 text-white border-gray-700' : ''}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleStudentCodeSubmit} className={`${darkMode ? 'bg-black text-white hover:bg-gray-900' : ''}`}>
                Join
              </Button>
              <Button onClick={() => setShowStudentCodeDialog(false)} variant="outline">
                Skip for now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Teacher Welcome Dialog */}
        <Dialog open={showTeacherWelcomeDialog} onOpenChange={setShowTeacherWelcomeDialog}>
          <DialogContent className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
            <DialogHeader>
              <DialogTitle>Welcome to Canvas!</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Would you like to start creating your course on Canvas?</p>
            </div>
            <DialogFooter>
              <Button onClick={() => handleTeacherWelcome(true)} className={`${darkMode ? 'bg-black text-white hover:bg-gray-900' : ''}`}>
                Yes, let's get started
              </Button>
              <Button onClick={() => handleTeacherWelcome(false)} variant="outline">
                Maybe later
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (showAdminDashboard) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-gray-100'}`}>
        <header className={`flex justify-between items-center p-4 ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow`}>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button onClick={() => setShowAdminDashboard(false)} className={`${darkMode ? 'bg-black text-white hover:bg-gray-900' : ''}`}>Back to Main Dashboard</Button>
        </header>
        <main className="container mx-auto mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Users in District</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveUserFromDistrict(user.id)}
                          className={`${darkMode ? 'bg-black text-white hover:bg-gray-900' : ''}`}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Remove from District
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        key="dashboard"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className={`flex h-screen ${darkMode ? 'bg-black text-white' : 'bg-gray-100'}`}
      >
        {isPreview && (
          <div className={`fixed top-0 left-0 right-0 p-2 text-center ${darkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-200 text-yellow-800'}`}>
            Preview Mode - Click on elements to interact
          </div>
        )}

        {/* Sidebar */}
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`w-64 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-r'}`}
        >
          <div className={`p-4 ${darkMode ? 'border-gray-800' : 'border-b'}`}>
            <h2 className="text-2xl font-semibold text-blue-600">Canvas</h2>
          </div>
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <a href="#" className={`flex items-center space-x-3 p-2 rounded-lg font-medium ${darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-200'} bg-gray-200 focus:shadow-outline`}>
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </a>
              </li>
              <li>
                <button onClick={handleCourseClick} className={`w-full flex items-center space-x-3 p-2 rounded-lg font-medium ${darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-200'} focus:shadow-outline`}>
                  <Book className="h-5 w-5" />
                  <span>Courses</span>
                </button>
              </li>
              {(user?.role === 'teacher' || isPreview) && (
                <li>
                  <button onClick={() => setShowCreateClassDialog(true)} className={`w-full flex items-center space-x-3 p-2 rounded-lg font-medium ${darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-200'} focus:shadow-outline`}>
                    <Plus className="h-5 w-5" />
                    <span>Create Class</span>
                  </button>
                </li>
              )}
              {(user?.role === 'admin' || isPreview) && (
                <li>
                  <button onClick={() => setShowBulkRegisterDialog(true)} className={`w-full flex items-center space-x-3 p-2 rounded-lg font-medium ${darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-200'} focus:shadow-outline`}>
                    <UserPlus className="h-5 w-5" />
                    <span>Bulk Register Students</span>
                  </button>
                </li>
              )}
              <li>
                <button onClick={() => setShowCalendar(!showCalendar)} className={`w-full flex items-center space-x-3 p-2 rounded-lg font-medium ${darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-200'} focus:shadow-outline`}>
                  <Calendar className="h-5 w-5" />
                  <span>Calendar</span>
                </button>
              </li>
              <li>
                <button onClick={() => setShowInbox(!showInbox)} className={`w-full flex items-center space-x-3 p-2 rounded-lg font-medium ${darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-200'} focus:shadow-outline`}>
                  <Mail className="h-5 w-5" />
                  <span>Inbox</span>
                </button>
              </li>
              <li>
                <button onClick={() => setShowGrades(!showGrades)} className={`w-full flex items-center space-x-3 p-2 rounded-lg font-medium ${darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-200'} focus:shadow-outline`}>
                  <FileText className="h-5 w-5" />
                  <span>Grades</span>
                </button>
              </li>
              <li>
                <button onClick={() => setShowJoinDistrictDialog(true)} className={`w-full flex items-center space-x-3 p-2 rounded-lg font-medium ${darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-200'} focus:shadow-outline`}>
                  <Building className="h-5 w-5" />
                  <span>Join District</span>
                </button>
              </li>
              {(user?.role === 'admin' || isPreview) && (
                <li>
                  <button onClick={handleOpenAdminDashboard} className={`w-full flex items-center space-x-3 p-2 rounded-lg font-medium ${darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-200'} focus:shadow-outline`}>
                    <Settings className="h-5 w-5" />
                    <span>Admin Dashboard</span>
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className={`flex justify-between items-center p-4 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-b'}`}
          >
            <div className="flex items-center space-x-4">
              <span className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search courses..."
                  className={`w-64 px-4 py-2 rounded-full focus:outline-none focus:ring ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-700'}`}
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <button className="absolute right-0 top-0 mt-3 mr-4">
                  <Search className={`h-4 w-4 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />
                </button>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`relative p-2 hover:bg-gray-100 focus:bg-gray-100 rounded-full ${darkMode ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-800 focus:bg-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                aria-label="Notifications"
              >
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleDarkMode}
                className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className={`flex items-center space-x-2 ${darkMode ? 'text-gray-200 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'} focus:outline-none`}
              >
                <img
                  src="/placeholder.svg?height=32&width=32"
                  alt="User avatar"
                  className="rounded-full" 
                  width={32}
                  height={32}
                />
                <span className="text-sm font-medium">{user ? user.name : 'Preview User'}</span>
                <ChevronDown className="h-4 w-4" />
              </motion.button>
              {!isPreview && (
                <Button onClick={handleLogout} variant="ghost" className={`${darkMode ? 'text-white hover:bg-gray-900' : ''}`}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              )}
              {isPreview && (
                <Button onClick={() => setIsPreview(false)} variant="ghost" className={`${darkMode ? 'text-white hover:bg-gray-900' : ''}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Exit Preview
                </Button>
              )}
            </div>
          </motion.header>

          {/* Dashboard Content */}
          <main className={`flex-1 overflow-x-hidden overflow-y-auto ${darkMode ? 'bg-black' : 'bg-gray-100'}`}>
            <div className="container mx-auto px-6 py-8">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`${darkMode ? 'text-gray-100' : 'text-gray-700'} text-3xl font-medium`}
              >
                Welcome back, {user ? user.name : 'Preview User'}!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} mt-2`}
              >
                Here's what's happening in your courses.
              </motion.p>

              {/* Classes Grid */}
              {loading ? (
                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-md overflow-hidden animate-pulse`}
                    >
                      <div className="h-2 bg-gray-300" />
                      <div className="p-6">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-300 rounded w-1/2" />
                        <div className="mt-4 flex justify-between items-center">
                          <div className="h-3 bg-gray-300 rounded w-1/4" />
                          <div className="h-3 bg-gray-300 rounded w-1/4" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : filteredClasses.length > 0 ? (
                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredClasses.map((classItem, index) => (
                    <motion.div
                      key={classItem.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-md overflow-hidden`}
                    >
                      <div className={`h-2 ${classItem.color}`} />
                      <div className="p-6">
                        <h4 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{classItem.name}</h4>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>{classItem.code}</p>
                        <div className="mt-4 flex justify-between items-center">
                          <button onClick={() => handleCourseSelect(classItem)} className={`text-blue-600 hover:text-blue-800 text-sm font-medium ${darkMode ? 'bg-black text-white hover:bg-gray-900' : ''}`}>
                            View Course
                          </button>
                          <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {classItem.newAssignments} new assignment{classItem.newAssignments !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className={`mt-8 text-center ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>No classes found matching your search.</div>
              )}

              {/* To-Do Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-12"
              >
                <h4 className={`${darkMode ? 'text-gray-200' : 'text-gray-600'} text-lg font-medium mb-4`}>To-Do List</h4>
                <DragDropContext onDragEnd={() => {}}>
                  <Droppable droppableId="todos">
                    {(provided) => (
                      <ul {...provided.droppableProps} ref={provided.innerRef} className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-md p-6`}>
                        {todos.map((todo, index) => (
                          <Draggable key={todo.id} draggableId={todo.id.toString()} index={index}>
                            {(provided) => (
                              <motion.li
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className={`mb-2 p-3 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100'} rounded-md`}
                              >
                                <div className="flex justify-between items-center">
                                  <span>{todo.task}</span>
                                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{todo.dueDate}</span>
                                </div>
                              </motion.li>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </ul>
                    )}
                  </Droppable>
                </DragDropContext>
              </motion.div>

              {/* Grades Section */}
              <AnimatePresence>
                {showGrades && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-12"
                  >
                    <h4 className={`${darkMode ? 'text-gray-200' : 'text-gray-600'} text-lg font-medium mb-4`}>Your Grades</h4>
                    <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-md p-6`}>
                      {grades.map((grade, index) => (
                        <motion.div
                          key={grade.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="mb-4 last:mb-0"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>{grade.classId}</span>
                            <span className={`font-bold ${grade.score >= 90 ? 'text-green-500' : grade.score >= 80 ? 'text-blue-500' : grade.score >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                              {grade.score}%
                            </span>
                          </div>
                          <div className="relative pt-1">
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                              <motion.div
                                style={{ width: `${grade.score}%` }}
                                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${grade.score >= 90 ? 'bg-green-500' : grade.score >= 80 ? 'bg-blue-500' : grade.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${grade.score}%` }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                              ></motion.div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Calendar Section */}
              <AnimatePresence>
                {showCalendar && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-12"
                  >
                    <h4 className={`${darkMode ? 'text-gray-200' : 'text-gray-600'} text-lg font-medium mb-4`}>Calendar</h4>
                    <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-md p-6`}>
                      {/* Calendar component would go here */}
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Calendar functionality coming soon!</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inbox Section */}
              <AnimatePresence>
                {showInbox && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-12"
                  >
                    <h4 className={`${darkMode ? 'text-gray-200' : 'text-gray-600'} text-lg font-medium mb-4`}>Inbox</h4>
                    <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-md p-6`}>
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`mb-4 p-4 rounded-md ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                        >
                          <h5 className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{message.subject}</h5>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{message.content}</p>
                          <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-400'}`}>{message.date}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* Course Selection Dialog */}
        <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select a Course</DialogTitle>
            </DialogHeader>
            <Input
              type="text"
              placeholder="Search courses..."
              className={`w-full px-4 py-2 mb-4 rounded-md ${darkMode ? 'bg-gray-800 text-white' : ''}`}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredClasses.map((course) => (
                <motion.button
                  key={course.id}
                  onClick={() => handleCourseSelect(course)}
                  className={`w-full text-left p-2 rounded-md transition duration-150 ease-in-out ${
                    darkMode
                      ? 'hover:bg-gray-800 text-gray-200'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-medium">{course.name}</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'} ml-2`}>({course.code})</span>
                </motion.button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Class Dialog */}
        <Dialog open={showCreateClassDialog} onOpenChange={setShowCreateClassDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Class</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-class-name">Class Name</Label>
                <Input
                  id="new-class-name"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Enter class name"
                />
              </div>
              <div>
                <Label htmlFor="new-class-code">Class Code</Label>
                <Input
                  id="new-class-code"
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value)}
                  placeholder="Enter class code"
                />
              </div>
              <div>
                <Label htmlFor="new-class-description">Description</Label>
                <Input
                  id="new-class-description"
                  value={newClassDescription}
                  onChange={(e) => setNewClassDescription(e.target.value)}
                  placeholder="Enter class description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateClass} className={`${darkMode ? 'bg-black text-white hover:bg-gray-900' : ''}`}>Create Class</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Register Students Dialog */}
        <Dialog open={showBulkRegisterDialog} onOpenChange={setShowBulkRegisterDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Register Students</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Label htmlFor="bulk-register-data">Student Data (CSV format: email,name,password)</Label>
              <Input
                id="bulk-register-data"
                value={bulkRegisterData}
                onChange={(e) => setBulkRegisterData(e.target.value)}
                placeholder="Enter student data (one per line)"
                className="h-40"
                multiple
              />
            </div>
            <DialogFooter>
              <Button onClick={handleBulkRegisterStudents} className={`${darkMode ? 'bg-black text-white hover:bg-gray-900' : ''}`}>Register Students</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Join District Dialog */}
        <Dialog open={showJoinDistrictDialog} onOpenChange={setShowJoinDistrictDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join District</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="join-district-code">District Code</Label>
                <Input
                  id="join-district-code"
                  value={joinDistrictCode}
                  onChange={(e) => setJoinDistrictCode(e.target.value)}
                  placeholder="Enter district code"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleJoinDistrict} className={`${darkMode ? 'bg-black text-white hover:bg-gray-900' : ''}`}>Join District</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ToastContainer />
      </motion.div>
    </AnimatePresence>
  );
}