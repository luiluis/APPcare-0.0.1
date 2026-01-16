
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.tsx';
import { MainLayout } from './components/layout/MainLayout.tsx';

// Páginas
import { DashboardPage } from './pages/DashboardPage.tsx';
import { RoutinePage } from './pages/RoutinePage.tsx';
import { ResidentsListPage } from './pages/ResidentsListPage.tsx';
import { ResidentProfilePage } from './pages/ResidentProfilePage.tsx';
import { FinancePage } from './pages/FinancePage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';

function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/rotina" element={<RoutinePage />} />
        <Route path="/residentes" element={<ResidentsListPage />} />
        <Route path="/residentes/:id" element={<ResidentProfilePage />} />
        <Route path="/financeiro" element={<FinancePage />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
