import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { BookOpen, Brain, CreditCard, BarChart3, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const location = useLocation();

  const navItems = [
  { path: '/StudyMaterial', icon: BookOpen, label: 'Study Material' },
  { path: '/Quiz', icon: Brain, label: 'Quiz' },
  { path: '/Flashcards', icon: CreditCard, label: 'Flashcards' },
  { path: '/AITutor', icon: Brain, label: 'AI Tutor' },
  { path: '/Analytics', icon: BarChart3, label: 'Analytics' }];


  const handleLogout = async () => {
    try {
      await base44.auth.logout('/');
    } catch (error) {
      window.location.href = '/';
    }
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              StudySpark AI
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive ?
                  'bg-purple-100 text-purple-700' :
                  'text-gray-600 hover:bg-gray-100'}`
                  }>

                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>);

            })}
          </div>

          



        </div>
      </div>
    </nav>);

}
