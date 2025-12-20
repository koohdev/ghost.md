import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Editor } from './components/Editor';
import { Viewer } from './components/Viewer';
import { Toaster } from './components/ui';

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

// View Route (Read-only)
const ViewPage = () => {
  return (
    <Viewer />
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