import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Navigation from './components/Navigation';
import StudentsPage from './pages/Students';
import ProgressPage from './pages/Progress';
import HistoryPage from './pages/History';
import ExercisesPage from './pages/Exercises';
import { Dumbbell } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState('students');
  const [students, setStudents] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [progressRecords, setProgressRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .order('name');
    
    const { data: exercisesData } = await supabase
      .from('exercises')
      .select('*')
      .order('name');
    
    const { data: progressData } = await supabase
      .from('progress_records')
      .select('*')
      .order('recorded_at', { ascending: false });
    
    setStudents(studentsData || []);
    setExercises(exercisesData || []);
    setProgressRecords(progressData || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#1a1b1c', 
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Dumbbell size={64} color="#f9ab2d" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#f9ab2d', fontSize: '1.25rem' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1b1c', color: '#ffffff' }}>
      <header style={{ 
        backgroundColor: '#0f1011', 
        borderBottom: '2px solid #f9ab2d',
        padding: '1.5rem 2rem'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Dumbbell size={32} color="#f9ab2d" />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f9ab2d', margin: 0 }}>
              Betânia Log App
            </h1>
          </div>
          
          <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        {currentPage === 'students' && (
          <StudentsPage 
            students={students} 
            exercises={exercises} 
            onUpdate={loadData} 
          />
        )}
        
        {currentPage === 'progress' && (
          <ProgressPage 
            students={students} 
            exercises={exercises} 
            onUpdate={loadData}
          />
        )}
        
        {currentPage === 'history' && (
          <HistoryPage
            students={students}
            exercises={exercises}
            progressRecords={progressRecords}
          />
        )}

        {currentPage === 'exercises' && (
          <ExercisesPage />
        )}
      </main>
    </div>
  );
}

export default App;