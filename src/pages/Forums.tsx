import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import toast from 'react-hot-toast';
import { MessageCircle, Plus, Search, Pin, Lock, Calendar, User } from 'lucide-react';

export const Forums = () => {
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Example topics for demonstration
  const exampleTopics = [
    {
      id: 'example-1',
      title: 'Análisis numérico - Ayuda con Singularidades',
      content: '¿Alguien podría ayudarme a entender cuando se refiere a un punto donde una función o sistema se vuelve indefinido, infinito o discontinuo',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      last_reply_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      reply_count: 5,
      is_pinned: false,
      is_locked: false,
      profiles: { first_name: 'Ramiro', last_name: 'Ravachino' },
      subjects: { name: 'Matemáticas' }
    },
    {
      id: 'example-2',
      title: 'Dudas sobre integrales dobles en cálculo vectorial',
      content: 'Tengo dificultades para visualizar las regiones de integración en coordenadas polares. ¿Hay algún truco o método que me ayude a entender mejor estos conceptos?',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      last_reply_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      reply_count: 3,
      is_pinned: true,
      is_locked: false,
      profiles: { first_name: 'Bautista', last_name: 'Budano' },
      subjects: { name: 'Cálculo' }
    },
    {
      id: 'example-3',
      title: 'Recomendaciones de recursos para aprender programación',
      content: 'Soy nuevo en programación y me gustaría que me recomienden cursos, libros o cursos online que sean buenos para principiantes. Especialmente interesado en Python.',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      last_reply_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      reply_count: 8,
      is_pinned: false,
      is_locked: false,
      profiles: { first_name: 'Frabrizio', last_name: 'Perrino' },
      subjects: { name: 'Programación' }
    }
  ];
  const [searchQuery, setSearchQuery] = useState('');
  const [createTopicOpen, setCreateTopicOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({
    title: '',
    content: '',
    subjectId: '',
  });

  useEffect(() => {
    fetchTopics();
    fetchSubjects();
  }, []);

  const fetchTopics = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('forum_topics')
        .select(`
          *,
          profiles:created_by(first_name, last_name),
          subjects(name)
        `)
        .order('is_pinned', { ascending: false })
        .order('last_reply_at', { ascending: false });

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
    const { data, error } = await (supabase as any)
      .from('subjects')
      .select('*')
      .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const createTopic = async () => {
    if (!newTopic.title.trim() || !newTopic.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('forum_topics')
        .insert({
          title: newTopic.title,
          content: newTopic.content,
          subject_id: newTopic.subjectId === 'none' ? null : newTopic.subjectId || null,
          created_by: user?.id,
          is_pinned: false,
          is_locked: false,
          reply_count: 0,
          last_reply_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Topic created successfully!');
      setCreateTopicOpen(false);
      setNewTopic({ title: '', content: '', subjectId: '' });
      fetchTopics();
    } catch (error: any) {
      console.error('Error creating topic:', error);
      toast.error(error.message || 'Failed to create topic');
    }
  };

  // Combine real topics with example topics if no real topics exist
  const allTopics = topics.length > 0 ? topics : exampleTopics;
  
  const filteredTopics = allTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.subjects?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTimeSince = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-hover rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Discussion Forums</h1>
        <p className="text-white/90 mb-4">Ask questions, share knowledge, and engage with your academic community</p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white text-foreground"
            />
          </div>
          <Dialog open={createTopicOpen} onOpenChange={setCreateTopicOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Plus className="h-4 w-4 mr-2" />
                New Topic
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Topic</DialogTitle>
                <DialogDescription>
                  Start a new discussion thread for the community
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topicTitle">Title</Label>
                  <Input
                    id="topicTitle"
                    placeholder="e.g., Help with Calculus derivatives"
                    value={newTopic.title}
                    onChange={(e) => setNewTopic(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topicSubject">Subject (Optional)</Label>
                  <Select value={newTopic.subjectId} onValueChange={(value) => setNewTopic(prev => ({ ...prev, subjectId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific subject</SelectItem>
                      {subjects.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topicContent">Content</Label>
                  <Textarea
                    id="topicContent"
                    placeholder="Describe your question or topic in detail..."
                    value={newTopic.content}
                    onChange={(e) => setNewTopic(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={createTopic} className="flex-1">
                    Create Topic
                  </Button>
                  <Button variant="outline" onClick={() => setCreateTopicOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Topics List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {loading ? 'Loading...' : `${filteredTopics.length} discussions`}
          </h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
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
        ) : filteredTopics.length > 0 ? (
          <div className="space-y-4">
            {filteredTopics.map((topic: any) => (
              <Card key={topic.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center space-x-2">
                        {topic.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                        {topic.is_locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                        <span className="line-clamp-2">{topic.title}</span>
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {topic.profiles?.first_name} {topic.profiles?.last_name}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {getTimeSince(topic.created_at)}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {topic.subjects?.name && (
                        <Badge variant="secondary">{topic.subjects.name}</Badge>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {topic.reply_count} replies
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {topic.content}
                  </p>
                  {topic.last_reply_at && topic.reply_count > 0 && (
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      Last reply {getTimeSince(topic.last_reply_at)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No discussions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Try adjusting your search terms or start a new discussion."
                  : "Be the first to start a discussion in the community!"
                }
              </p>
              <Dialog open={createTopicOpen} onOpenChange={setCreateTopicOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Start Discussion
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