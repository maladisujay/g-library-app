import React, { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LibraryProvider, useLibrary } from './store/LibraryContext';
import { ToastProvider } from './components/Toasts';
import Layout from './components/Layout';
import Login from './pages/Login';
import StudentDashboard from './pages/student/Dashboard';
import Catalog from './pages/student/Catalog';
import BookDetail from './pages/BookDetail';
import Recommendations from './pages/student/Recommendations';
import ExamPrep from './pages/student/ExamPrep';
import MyBooks from './pages/student/MyBooks';
import Profile from './pages/student/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import Circulation from './pages/admin/Circulation';
import Books from './pages/admin/Books';
import Stacks from './pages/admin/Stacks';
import Members from './pages/admin/Members';
import MemberDetail from './pages/admin/MemberDetail';
import Holds from './pages/admin/Holds';
import Fines from './pages/admin/Fines';
import Academics from './pages/admin/Academics';
import Engine from './pages/admin/Engine';
import Settings from './pages/admin/Settings';

function RequireRole({ role, children }) {
  const { role: current, user } = useLibrary();
  if (!user || current !== role) return <Navigate to="/" replace />;
  return children;
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <LibraryProvider>
      <ToastProvider>
        <HashRouter>
          <ScrollTop />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/student" element={<RequireRole role="student"><Layout role="student" /></RequireRole>}>
              <Route index element={<StudentDashboard />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="book/:id" element={<BookDetail />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="exams" element={<ExamPrep />} />
              <Route path="my-books" element={<MyBooks />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="/admin" element={<RequireRole role="librarian"><Layout role="librarian" /></RequireRole>}>
              <Route index element={<AdminDashboard />} />
              <Route path="circulation" element={<Circulation />} />
              <Route path="books" element={<Books />} />
              <Route path="book/:id" element={<BookDetail admin />} />
              <Route path="stacks" element={<Stacks />} />
              <Route path="members" element={<Members />} />
              <Route path="members/:id" element={<MemberDetail />} />
              <Route path="holds" element={<Holds />} />
              <Route path="fines" element={<Fines />} />
              <Route path="academics" element={<Academics />} />
              <Route path="recommender" element={<Engine />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </LibraryProvider>
  );
}
