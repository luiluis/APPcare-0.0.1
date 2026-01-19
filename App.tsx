
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.tsx';
import { useData } from './contexts/DataContext.tsx';
import { MainLayout } from './components/layout/MainLayout.tsx';
import { Loader2 } from 'lucide-react';

// Páginas
import { DashboardPage } from './pages/DashboardPage.tsx';
import { RoutinePage } from './pages/RoutinePage.tsx';
import { ResidentsListPage } from './pages/ResidentsListPage.tsx';
import { ResidentProfilePage } from './pages/ResidentProfilePage.tsx';
import { FinancePage } from './pages/FinancePage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';

// Placeholder Imports para RH
const StaffListPage = () => <div className="p-10 text-center text-gray-500">Módulo de Equipe (Em Construção)</div>;
const StaffProfilePage = () => <div className="p-10 text-center text-gray-500">Perfil do Colaborador (Em Construção)</div>;

function App() {
  const { isAuthenticated } = useAuth();
  
  // Componente interno para acessar o useData apenas se autenticado
  const AuthenticatedRoutes = () => {
    const { isLoading } = useData();

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <div className="flex flex-col items-center">
             <h3 className="text-gray-900 font-bold text-lg">Iniciando AppCare ERP</h3>
             <p className="text-gray-500 text-sm">Sincronizando dados...</p>
          </div>
        </div>
      );
    }

    return (
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/rotina" element={<RoutinePage />} />
          
          {/* Residentes */}
          <Route path="/residentes" element={<ResidentsListPage />} />
          <Route path="/residentes/:id" element={<ResidentProfilePage />} />
          
          {/* Financeiro */}
          <Route path="/financeiro" element={<FinancePage />} />
          
          {/* RH / Equipe */}
          <Route path="/rh" element={<StaffListPage />} />
          <Route path="/rh/:id" element={<StaffProfilePage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );
  };

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return <AuthenticatedRoutes />;
}

export default App;
