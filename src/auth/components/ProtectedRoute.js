import React, { useEffect, useState, useRef } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Компонент для защиты маршрутов, требующих авторизации
 * Перенаправляет неавторизованных пользователей на страницу входа
 */
const ProtectedRoute = ({ redirectPath = '/login' }) => {
  const { loading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Упрощенный лоадер (можно использовать старый, если он не вызывает проблем)
  const LoadingScreen = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#0f0f14' // Простой фон
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '50%',
        borderTopColor: '#ff66c4',
        animation: 'spin 1s ease-in-out infinite'
      }} />
      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );

  if (loading) {
    console.log(`ProtectedRoute(${location.pathname}): Контекст еще загружается...`);
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    console.log(`ProtectedRoute(${location.pathname}): Не авторизован, перенаправление на ${redirectPath}`);
    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }

  console.log(`ProtectedRoute(${location.pathname}): Авторизован, доступ разрешен. Пользователь:`, user?.id);
  return <Outlet />;
};

export default ProtectedRoute; 