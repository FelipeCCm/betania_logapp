import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import FloatingTimer from './components/FloatingTimer';
import StudentsPage from './pages/Students';
import ProgressPage from './pages/Progress';
import HistoryPage from './pages/History';
import ExercisesPage from './pages/Exercises';
import LoginPage from './pages/LoginPage';
import { Dumbbell } from 'lucide-react';

const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: '#1a1b1c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div style={{ textAlign: 'center' }}>
      <Dumbbell size={64} color="#f9ab2d" style={{ margin: '0 auto 1rem', display: 'block' }} />
      <p style={{ color: '#f9ab2d', fontSize: '1.25rem' }}>Carregando...</p>
    </div>
  </div>
);

function App() {
  const { user, profile, loading: authLoading, isAdmin, isStudent } = useAuth();
  const [currentPage, setCurrentPage] = useState('students');
  const [students, setStudents] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [progressRecords, setProgressRecords] = useState([]);
  // dataLoading começa false — só ativa quando o usuário estiver logado
  const [dataLoading, setDataLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    // Só carrega dados depois que auth resolveu E há um usuário com perfil
    if (!authLoading && user && profile) {
      loadData();
    }
    // Se auth resolveu mas não há usuário, garante que não ficamos em loading
    if (!authLoading && (!user || !profile)) {
      setDataLoading(false);
      setDataReady(false);
    }
  }, [authLoading, user, profile]);

  // Se aluno, força aba students
  useEffect(() => {
    if (isStudent) setCurrentPage('students');
  }, [isStudent]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [{ data: studentsData }, { data: exercisesData }, { data: progressData }] =
        await Promise.all([
          supabase.from('students').select('*').order('name'),
          supabase.from('exercises').select('*').order('name'),
          supabase.from('progress_records').select('*').order('recorded_at', { ascending: false }),
        ]);

      setStudents(studentsData || []);
      setExercises(exercisesData || []);
      setProgressRecords(progressData || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      // Fallback pra não deixar a tela presa se uma das requisições der pane
    } finally {
      setDataLoading(false);
      setDataReady(true);
    }
  };

  // 1. Auth ainda resolvendo
  if (authLoading) return <LoadingScreen />;

  const isRecoveryLink = window.location.hash && window.location.hash.includes('type=recovery');

  // 2. Não autenticado, sem perfil ou recuperando senha → Login
  if (!user || !profile || isRecoveryLink) return <LoginPage />;

  // 3. Dados ainda carregando após login
  if (dataLoading || !dataReady) return <LoadingScreen />;

  // 4. App principal
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
            <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f9ab2d', margin: 0, flex: 1 }}>
              Betânia Log App
            </h1>
          </div>

          <Navigation
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            role={profile.role}
          />
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        {currentPage === 'students' && (
          <StudentsPage
            students={students}
            exercises={exercises}
            onUpdate={loadData}
            profile={profile}
          />
        )}

        {currentPage === 'progress' && (
          <ProgressPage
            students={isStudent
              ? students.filter(s => s.id === profile.student_id)
              : students}
            exercises={exercises}
            onUpdate={loadData}
          />
        )}

        {isAdmin && currentPage === 'history' && (
          <HistoryPage
            students={students}
            exercises={exercises}
            progressRecords={progressRecords}
          />
        )}

        {isAdmin && currentPage === 'exercises' && (
          <ExercisesPage />
        )}
      </main>

      <FloatingTimer />
    </div>
  );
}

export default App;
