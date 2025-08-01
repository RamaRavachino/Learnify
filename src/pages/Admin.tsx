import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import toast from 'react-hot-toast';
import { Settings, Plus, Users, BookOpen, TrendingUp, Activity, Edit2, Trash2 } from 'lucide-react';

export const Admin = () => {
  const { user, isAdmin } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalNotes: 0,
    totalDownloads: 0,
    newUsersThisWeek: 0,
    newNotesThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [editSubjectOpen, setEditSubjectOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [newSubject, setNewSubject] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [user, isAdmin]);

  const fetchAdminData = async () => {
    try {
    const [subjectsData, usersData, notesData] = await Promise.all([
      (supabase as any).from('subjects').select('*').order('name'),
      (supabase as any).from('profiles').select('*').order('created_at', { ascending: false }),
      (supabase as any).from('notes').select('*')
    ]);

      if (subjectsData.error) throw subjectsData.error;
      if (usersData.error) throw usersData.error;
      if (notesData.error) throw notesData.error;

      setSubjects(subjectsData.data || []);
      setUsers(usersData.data || []);

      // Calculate analytics
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const newUsersThisWeek = usersData.data?.filter(user => 
        new Date(user.created_at) > weekAgo
      ).length || 0;
      
      const newNotesThisWeek = notesData.data?.filter(note => 
        new Date(note.created_at) > weekAgo
      ).length || 0;

      const totalDownloads = notesData.data?.reduce((sum, note) => 
        sum + (note.download_count || 0), 0
      ) || 0;

      setAnalytics({
        totalUsers: usersData.data?.length || 0,
        totalNotes: notesData.data?.length || 0,
        totalDownloads,
        newUsersThisWeek,
        newNotesThisWeek,
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const createSubject = async () => {
    if (!newSubject.name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('subjects')
        .insert({
          name: newSubject.name,
          description: newSubject.description,
        });

      if (error) throw error;

      toast.success('Subject created successfully!');
      setCreateSubjectOpen(false);
      setNewSubject({ name: '', description: '' });
      fetchAdminData();
    } catch (error: any) {
      console.error('Error creating subject:', error);
      toast.error(error.message || 'Failed to create subject');
    }
  };

  const updateSubject = async () => {
    if (!selectedSubject || !selectedSubject.name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('subjects')
        .update({
          name: selectedSubject.name,
          description: selectedSubject.description,
        })
        .eq('id', selectedSubject.id);

      if (error) throw error;

      toast.success('Subject updated successfully!');
      setEditSubjectOpen(false);
      setSelectedSubject(null);
      fetchAdminData();
    } catch (error: any) {
      console.error('Error updating subject:', error);
      toast.error(error.message || 'Failed to update subject');
    }
  };

  const deleteSubject = async (subjectId: string) => {
    try {
    const { error } = await (supabase as any)
      .from('subjects')
      .delete()
        .eq('id', subjectId);

      if (error) throw error;

      toast.success('Subject deleted successfully!');
      fetchAdminData();
    } catch (error: any) {
      console.error('Error deleting subject:', error);
      toast.error(error.message || 'Failed to delete subject');
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await (supabase as any)
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('User role updated successfully!');
      fetchAdminData();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error(error.message || 'Failed to update user role');
    }
  };

  const editSubject = (subject: any) => {
    setSelectedSubject({ ...subject });
    setEditSubjectOpen(true);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center py-12">
          <CardContent>
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
            <p className="text-muted-foreground">
              You don't have permission to access the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-32 bg-muted rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-hover rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Settings className="h-8 w-8 mr-3" />
          Admin Dashboard
        </h1>
        <p className="text-white/90">
          Manage platform settings, users, and monitor system performance
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.newUsersThisWeek} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalNotes}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.newNotesThisWeek} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalDownloads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All time downloads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subjects">Subject Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Subject Categories</h2>
            <Dialog open={createSubjectOpen} onOpenChange={setCreateSubjectOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Subject</DialogTitle>
                  <DialogDescription>
                    Add a new subject category for study materials
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subjectName">Subject Name</Label>
                    <Input
                      id="subjectName"
                      placeholder="e.g., Mathematics, Computer Science"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subjectDescription">Description</Label>
                    <Textarea
                      id="subjectDescription"
                      placeholder="Describe this subject category..."
                      value={newSubject.description}
                      onChange={(e) => setNewSubject(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={createSubject} className="flex-1">
                      Create Subject
                    </Button>
                    <Button variant="outline" onClick={() => setCreateSubjectOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject: any) => (
              <Card key={subject.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      {subject.description && (
                        <CardDescription className="mt-1">
                          {subject.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editSubject(subject)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteSubject(subject.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Edit Subject Dialog */}
          <Dialog open={editSubjectOpen} onOpenChange={setEditSubjectOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Subject</DialogTitle>
                <DialogDescription>
                  Update the subject category information
                </DialogDescription>
              </DialogHeader>
              {selectedSubject && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="editSubjectName">Subject Name</Label>
                    <Input
                      id="editSubjectName"
                      value={selectedSubject.name}
                      onChange={(e) => setSelectedSubject(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editSubjectDescription">Description</Label>
                    <Textarea
                      id="editSubjectDescription"
                      value={selectedSubject.description || ''}
                      onChange={(e) => setSelectedSubject(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={updateSubject} className="flex-1">
                      Update Subject
                    </Button>
                    <Button variant="outline" onClick={() => setEditSubjectOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <h2 className="text-xl font-semibold">User Management</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((user: any) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>
                        {user.first_name} {user.last_name}
                      </CardTitle>
                      <CardDescription>{user.email || user.id}</CardDescription>
                      {user.university && (
                        <CardDescription className="text-xs">
                          {user.university} • {user.degree}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'moderator' ? 'secondary' : 'outline'}>
                      {user.role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`role-${user.id}`}>Change Role</Label>
                      <Select
                        value={user.role}
                        onValueChange={(value) => updateUserRole(user.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-xl font-semibold">Platform Analytics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <p>Analytics dashboard would be implemented here</p>
                  <p className="text-sm">Charts showing user growth, note uploads, downloads, etc.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Statistics</CardTitle>
                <CardDescription>Note uploads and downloads by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4" />
                  <p>Subject popularity analytics</p>
                  <p className="text-sm">Breakdown of most popular subjects and content types</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};