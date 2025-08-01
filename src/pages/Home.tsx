import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Search, 
  Upload, 
  MessageCircle,
  Star,
  Download
} from 'lucide-react';

export const Home = () => {
  const { user } = useAuth();
  const [recentNotes, setRecentNotes] = useState([]);
  const [stats, setStats] = useState({ notes: 0, users: 0, downloads: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRecentNotes();
    fetchStats();
  }, []);

  const fetchRecentNotes = async () => {
    try {
    const { data, error } = await (supabase as any)
      .from('notes')
      .select(`
        *,
        profiles:uploaded_by(first_name, last_name),
        subjects(name)
      `)
      .order('created_at', { ascending: false })
      .limit(6);

      if (error) throw error;
      setRecentNotes(data || []);
    } catch (error) {
      console.error('Error fetching recent notes:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [notesCount, usersCount, downloadsSum] = await Promise.all([
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('notes').select('download_count'),
      ]);

      const totalDownloads = downloadsSum.data?.reduce((sum, note) => sum + (note.download_count || 0), 0) || 0;

      setStats({
        notes: notesCount.count || 0,
        users: usersCount.count || 0,
        downloads: totalDownloads,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-accent">
          <div className="container mx-auto px-4 py-24 relative z-10">
            <div className="text-center text-white">
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                Learn. Share. Excel.
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
                Join thousands of students sharing knowledge and accelerating their academic success through collaborative learning.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-primary">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Everything you need to succeed</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover, share, and discuss study materials with students from your university and beyond.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center p-6">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Smart Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Find exactly what you need with powerful search and filtering by subject, university, and document type.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Study Groups</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Create or join study groups, share resources privately, and collaborate with your peers.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Discussion Forums</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Ask questions, share insights, and participate in subject-specific discussions with your academic community.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">{stats.notes.toLocaleString()}+</div>
                <div className="text-muted-foreground">Study Materials</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">{stats.users.toLocaleString()}+</div>
                <div className="text-muted-foreground">Students</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">{stats.downloads.toLocaleString()}+</div>
                <div className="text-muted-foreground">Downloads</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-hover rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-white/90 mb-6">Ready to discover new study materials or share your knowledge?</p>
        
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <Input
            placeholder="Search for notes, subjects, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white text-foreground"
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/upload">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Upload className="h-6 w-6 text-primary mr-3" />
              <CardTitle className="text-lg">Upload Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Share your study materials with the community</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link to="/study-groups">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Users className="h-6 w-6 text-primary mr-3" />
              <CardTitle className="text-lg">Study Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Collaborate with peers in focused study sessions</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link to="/forums">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <MessageCircle className="h-6 w-6 text-primary mr-3" />
              <CardTitle className="text-lg">Forums</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Join discussions and ask questions</CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Notes */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recently Added Notes</h2>
          <Link to="/search">
            <Button variant="outline">View All</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentNotes.map((note: any) => (
            <Card key={note.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
                    <CardDescription className="mt-1">
                      by {note.profiles?.first_name} {note.profiles?.last_name}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{note.subjects?.name}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {note.description}
                </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      {note.average_rating || 0}
                    </div>
                    <div className="flex items-center">
                      <Download className="h-4 w-4 mr-1" />
                      {note.download_count || 0}
                    </div>
                  </div>
                  <Badge variant="outline">{note.file_type}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Platform Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Platform Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{stats.notes}</div>
              <div className="text-sm text-muted-foreground">Total Notes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{stats.users}</div>
              <div className="text-sm text-muted-foreground">Active Students</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{stats.downloads}</div>
              <div className="text-sm text-muted-foreground">Total Downloads</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};