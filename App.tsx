import React, { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Editor } from './components/Editor';
import { Toaster } from './components/ui';

// Lazy load Viewer component - only loads when needed
const Viewer = lazy(() => import('./components/Viewer').then(m => ({ default: m.Viewer })));

// Main Layout Container
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--fg-primary)] transition-colors duration-300">
      {children}
      <Toaster />
    </div>
  );
};

// Home Route (Editor)
const Home = () => {
  return (
    <Editor />
  );
};

// View Route (Read-only) - with loading fallback
const ViewPage = () => {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center text-[var(--accent-primary)] bg-[var(--bg-primary)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
      </div>
    }>
      <Viewer />
    </Suspense>
  );
};

export default function App() {
  // Theme Management
  useEffect(() => {
    const savedTheme = localStorage.getItem('ghost-md-theme') || 'gruvbox';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/view" element={<ViewPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}