import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import toast from 'react-hot-toast';
import { Users, Plus, Search, Lock, Globe, Calendar, MessageCircle } from 'lucide-react';

export const StudyGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    university: '',
    isPrivate: false,
  });

  useEffect(() => {
    fetchGroups();
    fetchMyGroups();
  }, [user]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select(`
          *,
          profiles:created_by(first_name, last_name)
        `)
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchMyGroups = async () => {
    if (!user) return;
    
    try {
      // Get groups where user is a member or creator
      const { data, error } = await supabase
        .from('study_groups')
        .select(`
          *,
          profiles:created_by(first_name, last_name)
        `)
        .or(`created_by.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyGroups(data || []);
    } catch (error) {
      console.error('Error fetching my groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!newGroup.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('study_groups')
        .insert({
          name: newGroup.name,
          description: newGroup.description,
          university: newGroup.university,
          is_private: newGroup.isPrivate,
          created_by: user?.id,
          member_count: 1,
        });

      if (error) throw error;

      toast.success('Study group created successfully!');
      setCreateGroupOpen(false);
      setNewGroup({ name: '', description: '', university: '', isPrivate: false });
      fetchGroups();
      fetchMyGroups();
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error(error.message || 'Failed to create group');
    }
  };

  const joinGroup = async (groupId: string) => {
    try {
      // For now, just update member count (in a real app, you'd have a junction table)
      const group = groups.find(g => g.id === groupId);
      if (!group) return;

      const { error } = await supabase
        .from('study_groups')
        .update({ member_count: group.member_count + 1 })
        .eq('id', groupId);

      if (error) throw error;

      toast.success('Joined study group!');
      fetchGroups();
      fetchMyGroups();
    } catch (error: any) {
      console.error('Error joining group:', error);
      toast.error(error.message || 'Failed to join group');
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.university?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-hover rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Study Groups</h1>
        <p className="text-white/90 mb-4">Join or create study groups to collaborate with peers</p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search study groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white text-foreground"
            />
          </div>
          <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Study Group</DialogTitle>
                <DialogDescription>
                  Start a new study group to collaborate with other students
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    placeholder="e.g., Calculus Study Group"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groupDescription">Description</Label>
                  <Textarea
                    id="groupDescription"
                    placeholder="Describe the purpose and focus of your study group..."
                    value={newGroup.description}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groupUniversity">University (Optional)</Label>
                  <Input
                    id="groupUniversity"
                    placeholder="University name"
                    value={newGroup.university}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, university: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="private"
                    checked={newGroup.isPrivate}
                    onCheckedChange={(checked) => setNewGroup(prev => ({ ...prev, isPrivate: checked }))}
                  />
                  <Label htmlFor="private">Make group private</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={createGroup} className="flex-1">
                    Create Group
                  </Button>
                  <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* My Groups */}
      {myGroups.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">My Study Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGroups.map((group: any) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center space-x-2">
                        <span>{group.name}</span>
                        {group.is_private ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        Created by {group.profiles?.first_name} {group.profiles?.last_name}
                      </CardDescription>
                      {group.university && (
                        <CardDescription className="text-xs">
                          {group.university}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {group.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {group.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {group.member_count} members
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(group.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Open Group
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Groups */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Study Groups</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group: any) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center space-x-2">
                        <span>{group.name}</span>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      </CardTitle>
                      <CardDescription>
                        Created by {group.profiles?.first_name} {group.profiles?.last_name}
                      </CardDescription>
                      {group.university && (
                        <CardDescription className="text-xs">
                          {group.university}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {group.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {group.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {group.member_count} members
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(group.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => joinGroup(group.id)}
                    disabled={group.created_by === user?.id}
                  >
                    {group.created_by === user?.id ? 'Your Group' : 'Join Group'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No study groups found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Try adjusting your search terms or create a new group."
                  : "Be the first to create a study group for your peers!"
                }
              </p>
              <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Group
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};