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
    flexDirection: 'column',
    color: '#ffffff'
  }}>
    <style>
      {`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .skeleton {
          background-color: #2a2b2c;
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }
        .skeleton::after {
          content: "";
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(255, 255, 255, 0.05) 20%,
            rgba(255, 255, 255, 0.1) 60%,
            rgba(255, 255, 255, 0)
          );
          animation: shimmer 1.5s infinite linear;
        }
      `}
    </style>
    
    <header style={{
      backgroundColor: '#0f1011',
      borderBottom: '2px solid #2a2b2c',
      padding: '1.5rem 2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
          <div className="skeleton" style={{ width: '220px', height: '28px' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="skeleton" style={{ width: '100px', height: '42px', borderRadius: '8px' }} />
          <div className="skeleton" style={{ width: '160px', height: '42px', borderRadius: '8px' }} />
          <div className="skeleton" style={{ width: '120px', height: '42px', borderRadius: '8px' }} />
        </div>
      </div>
    </header>

    <main style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '2rem 1rem', flex: 1 }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div className="skeleton" style={{ flex: 1, minWidth: '250px', maxWidth: '400px', height: '44px', borderRadius: '8px' }} />
        <div className="skeleton" style={{ width: '160px', height: '44px', borderRadius: '8px', marginLeft: 'auto' }} />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ backgroundColor: '#242526', borderRadius: '16px', padding: '1.5rem', border: '1px solid #3a3b3c' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="skeleton" style={{ width: '160px', height: '20px' }} />
                <div className="skeleton" style={{ width: '100px', height: '14px' }} />
              </div>
              <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <div className="skeleton" style={{ width: '100%', height: '48px' }} />
               <div className="skeleton" style={{ width: '100%', height: '48px' }} />
            </div>
          </div>
        ))}
      </div>
    </main>
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

  // 2. Não autenticado ou sem perfil → Login
  if (!user || !profile) return <LoginPage />;

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
