import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import toast from 'react-hot-toast';
import { Shield, Trash2, Eye, AlertTriangle, Users, MessageCircle, BookOpen } from 'lucide-react';

export const Moderation = () => {
  const { user, isModerator, isAdmin } = useAuth();
  const [notes, setNotes] = useState([]);
  const [forumTopics, setForumTopics] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isModerator || isAdmin) {
      fetchModerationData();
    }
  }, [user, isModerator, isAdmin]);

  const fetchModerationData = async () => {
    try {
      const [notesData, topicsData, usersData] = await Promise.all([
        (supabase as any)
          .from('notes')
          .select(`
            *,
            profiles:uploaded_by(first_name, last_name, email),
            subjects(name)
          `)
          .order('created_at', { ascending: false })
          .limit(50),
        
        (supabase as any)
          .from('forum_topics')
          .select(`
            *,
            profiles:created_by(first_name, last_name, email),
            subjects(name)
          `)
          .order('created_at', { ascending: false })
          .limit(50),
        
        isAdmin ? (supabase as any)
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100) : { data: [], error: null }
      ]);

      if (notesData.error) throw notesData.error;
      if (topicsData.error) throw topicsData.error;
      if (usersData.error) throw usersData.error;

      setNotes(notesData.data || []);
      setForumTopics(topicsData.data || []);
      setUsers(usersData.data || []);
    } catch (error) {
      console.error('Error fetching moderation data:', error);
      toast.error('Failed to load moderation data');
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast.success('Note deleted successfully');
      fetchModerationData();
    } catch (error: any) {
      console.error('Error deleting note:', error);
      toast.error(error.message || 'Failed to delete note');
    }
  };

  const lockTopic = async (topicId: string, isLocked: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('forum_topics')
        .update({ is_locked: isLocked })
        .eq('id', topicId);

      if (error) throw error;

      toast.success(`Topic ${isLocked ? 'locked' : 'unlocked'} successfully`);
      fetchModerationData();
    } catch (error: any) {
      console.error('Error updating topic:', error);
      toast.error(error.message || 'Failed to update topic');
    }
  };

  const deleteTopic = async (topicId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('forum_topics')
        .delete()
        .eq('id', topicId);

      if (error) throw error;

      toast.success('Topic deleted successfully');
      fetchModerationData();
    } catch (error: any) {
      console.error('Error deleting topic:', error);
      toast.error(error.message || 'Failed to delete topic');
    }
  };

  const suspendUser = async (userId: string) => {
    try {
      // In a real app, you'd have a suspended field or separate table
      toast.success('User suspension functionality would be implemented here');
    } catch (error: any) {
      console.error('Error suspending user:', error);
      toast.error(error.message || 'Failed to suspend user');
    }
  };

  const getTimeSince = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInDays = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays} days ago`;
  };

  if (!isModerator && !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center py-12">
          <CardContent>
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to access the moderation panel.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse"></div>
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
          <Shield className="h-8 w-8 mr-3" />
          Moderation Panel
        </h1>
        <p className="text-white/90">
          Monitor and manage community content to maintain a safe learning environment
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notes.length}</div>
            <p className="text-xs text-muted-foreground">
              Study materials uploaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forum Topics</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forumTopics.length}</div>
            <p className="text-xs text-muted-foreground">
              Discussion threads created
            </p>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                Registered students
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Moderation Tabs */}
      <Tabs defaultValue="notes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notes">Notes Review</TabsTrigger>
          <TabsTrigger value="forums">Forum Management</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">User Management</TabsTrigger>}
        </TabsList>

        <TabsContent value="notes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map((note: any) => (
              <Card key={note.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
                      <CardDescription>
                        by {note.profiles?.first_name} {note.profiles?.last_name}
                      </CardDescription>
                      <CardDescription className="text-xs">
                        {note.profiles?.email}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{note.subjects?.name}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {note.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {note.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      Uploaded {getTimeSince(note.created_at)}
                    </div>
                    <Badge variant="outline">{note.file_type.toUpperCase()}</Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Note</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{note.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteNote(note.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="forums" className="space-y-4">
          <div className="space-y-4">
            {forumTopics.map((topic: any) => (
              <Card key={topic.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2">{topic.title}</CardTitle>
                      <CardDescription>
                        by {topic.profiles?.first_name} {topic.profiles?.last_name}
                      </CardDescription>
                      <CardDescription className="text-xs">
                        {topic.profiles?.email}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col space-y-2">
                      {topic.subjects?.name && (
                        <Badge variant="secondary">{topic.subjects.name}</Badge>
                      )}
                      {topic.is_locked && (
                        <Badge variant="destructive">Locked</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {topic.content}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      Created {getTimeSince(topic.created_at)} • {topic.reply_count} replies
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => lockTopic(topic.id, !topic.is_locked)}
                    >
                      {topic.is_locked ? 'Unlock' : 'Lock'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Topic</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this topic and all its replies? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTopic(topic.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="space-y-4">
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
                            {user.university}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant={user.role === 'admin' ? 'default' : user.role === 'moderator' ? 'secondary' : 'outline'}>
                        {user.role}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-4">
                      Joined {getTimeSince(user.created_at)}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                      {user.role === 'student' && (
                        <Button variant="destructive" size="sm" onClick={() => suspendUser(user.id)}>
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};