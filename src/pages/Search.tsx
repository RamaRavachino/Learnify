import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search as SearchIcon, Download, Star, Filter, FileText, Coins, Crown } from 'lucide-react';
import Fuse from 'fuse.js';

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userCredits, setUserCredits] = useState(45); // Ejemplo de créditos del usuario
  const [filters, setFilters] = useState({
    subject: '',
    university: '',
    fileType: '',
    rating: '',
  });

  // Ejemplos de resúmenes premium que cuestan créditos
  const premiumSummaries = [
    {
      id: 'premium-1',
      title: 'Resumen Completo: Análisis Numérico - Métodos de Interpolación',
      description: 'Resumen completo de 25 páginas que cubre todos los métodos de interpolación: Lagrange, Newton, splines cúbicos y aplicaciones prácticas.',
      credits: 20,
      pages: 25,
      subjects: { name: 'Matemáticas' },
      profiles: { first_name: 'Dr. Carlos', last_name: 'Rodríguez', university: 'UBA' },
      file_type: 'PDF',
      average_rating: 4.8,
      download_count: 156,
      tags: ['interpolación', 'métodos numéricos', 'matemáticas'],
      isPremium: true
    },
    {
      id: 'premium-2', 
      title: 'Guía Premium: Cálculo Integral Avanzado',
      description: 'Resumen detallado de 30 páginas con ejercicios resueltos, teoremas principales y aplicaciones en física e ingeniería.',
      credits: 25,
      pages: 30,
      subjects: { name: 'Cálculo' },
      profiles: { first_name: 'Dra. Ana', last_name: 'Martínez', university: 'UTN' },
      file_type: 'PDF',
      average_rating: 4.9,
      download_count: 203,
      tags: ['integrales', 'cálculo', 'ejercicios'],
      isPremium: true
    },
    {
      id: 'premium-3',
      title: 'Resumen Ejecutivo: Programación en Python - Estructuras de Datos',
      description: 'Compilación de 22 páginas con ejemplos prácticos, algoritmos optimizados y mejores prácticas para estructuras de datos.',
      credits: 18,
      pages: 22,
      subjects: { name: 'Programación' },
      profiles: { first_name: 'Ing. Miguel', last_name: 'López', university: 'UADE' },
      file_type: 'PDF',
      average_rating: 4.7,
      download_count: 89,
      tags: ['python', 'estructuras de datos', 'algoritmos'],
      isPremium: true
    }
  ];

  const fuse = new Fuse(notes, {
    keys: ['title', 'description', 'tags', 'subjects.name', 'profiles.first_name', 'profiles.last_name'],
    threshold: 0.3,
  });

  useEffect(() => {
    fetchNotes();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      handleSearch();
    } else {
      setFilteredNotes(notes);
    }
  }, [searchQuery, notes, filters]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          profiles:uploaded_by(first_name, last_name, university),
          subjects(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleSearch = () => {
    let results = notes;

    if (searchQuery.trim()) {
      const fuseResults = fuse.search(searchQuery);
      results = fuseResults.map(result => result.item);
    }

    // Apply filters
    if (filters.subject) {
      results = results.filter(note => note.subject_id === filters.subject);
    }
    if (filters.university) {
      results = results.filter(note => note.university?.toLowerCase().includes(filters.university.toLowerCase()));
    }
    if (filters.fileType) {
      results = results.filter(note => note.file_type === filters.fileType);
    }
    if (filters.rating) {
      const minRating = parseFloat(filters.rating);
      results = results.filter(note => (note.average_rating || 0) >= minRating);
    }

    setFilteredNotes(results);
    if (searchQuery !== searchParams.get('q')) {
      setSearchParams({ q: searchQuery });
    }
  };

  const handleDownload = async (note: any) => {
    try {
      // Download file
      const { data, error } = await supabase.storage
        .from('notes')
        .download(note.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = note.title;
      a.click();
      URL.revokeObjectURL(url);

      // Update download count
      await supabase
        .from('notes')
        .update({ download_count: (note.download_count || 0) + 1 })
        .eq('id', note.id);

      // Refresh notes
      fetchNotes();
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      subject: '',
      university: '',
      fileType: '',
      rating: '',
    });
    setSearchQuery('');
    setSearchParams({});
  };

  const handlePremiumDownload = (summary: any) => {
    if (userCredits >= summary.credits) {
      setUserCredits(prev => prev - summary.credits);
      // Aquí iría la lógica de descarga real
      alert(`¡Descarga exitosa! Te han sido descontados ${summary.credits} créditos.`);
    } else {
      alert(`Necesitas ${summary.credits - userCredits} créditos más para descargar este resumen.`);
    }
  };

  // Combinar todas las notas y resúmenes para la búsqueda
  const allResults = searchQuery.trim() 
    ? [...filteredNotes, ...premiumSummaries.filter(summary => 
        summary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        summary.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        summary.subjects.name.toLowerCase().includes(searchQuery.toLowerCase())
      )]
    : [...filteredNotes, ...premiumSummaries];

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-primary to-primary-hover rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Search Study Materials</h1>
            <p className="text-white/90">Find notes, documents, and resources shared by students</p>
          </div>
          <div className="flex items-center bg-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
            <Coins className="h-5 w-5 text-yellow-300 mr-2" />
            <span className="text-lg font-semibold">{userCredits} créditos</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for notes, subjects, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 bg-white text-foreground"
            />
          </div>
          <Button onClick={handleSearch} variant="secondary">
            Search
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select value={filters.subject} onValueChange={(value) => setFilters(prev => ({ ...prev, subject: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subjects</SelectItem>
                  {subjects.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">University</label>
              <Input
                placeholder="University name"
                value={filters.university}
                onChange={(e) => setFilters(prev => ({ ...prev, university: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">File Type</label>
              <Select value={filters.fileType} onValueChange={(value) => setFilters(prev => ({ ...prev, fileType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">Word Document</SelectItem>
                  <SelectItem value="pptx">PowerPoint</SelectItem>
                  <SelectItem value="jpg">Image</SelectItem>
                  <SelectItem value="png">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Min Rating</label>
              <Select value={filters.rating} onValueChange={(value) => setFilters(prev => ({ ...prev, rating: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any rating</SelectItem>
                  <SelectItem value="4">4+ stars</SelectItem>
                  <SelectItem value="3">3+ stars</SelectItem>
                  <SelectItem value="2">2+ stars</SelectItem>
                  <SelectItem value="1">1+ stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {loading ? 'Searching...' : `${allResults.length} results found`}
          </h2>
        </div>

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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allResults.map((item: any) => (
              <Card key={item.id} className={`hover:shadow-lg transition-shadow ${item.isPremium ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 flex items-center">
                        {item.isPremium && <Crown className="h-4 w-4 text-amber-500 mr-1 flex-shrink-0" />}
                        {item.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        by {item.profiles?.first_name} {item.profiles?.last_name}
                      </CardDescription>
                      <CardDescription className="text-xs">
                        {item.profiles?.university}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary">{item.subjects?.name}</Badge>
                      {item.isPremium && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Premium
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {item.description}
                  </p>
                  
                  {item.tags && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.tags.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        {item.average_rating?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <Download className="h-4 w-4 mr-1" />
                        {item.download_count || 0}
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        {item.file_type?.toUpperCase()}
                        {item.isPremium && ` (${item.pages}p)`}
                      </div>
                    </div>
                    
                    {item.isPremium ? (
                      <Button 
                        size="sm" 
                        onClick={() => handlePremiumDownload(item)}
                        variant={userCredits >= item.credits ? "default" : "outline"}
                        disabled={userCredits < item.credits}
                      >
                        <Coins className="h-4 w-4 mr-1" />
                        {item.credits} créditos
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleDownload(item)}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && allResults.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};