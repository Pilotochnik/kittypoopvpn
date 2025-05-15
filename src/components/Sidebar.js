import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { isAuthenticated, user, logout } = useAuth();
  
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <button className="close-btn" onClick={toggleSidebar}>×</button>
        <h3>Меню</h3>
      </div>
      
      <div className="sidebar-content">
        <nav>
          <ul>
            <li><NavLink to="/" onClick={toggleSidebar}>Главная</NavLink></li>
            <li><NavLink to="/pricing" onClick={toggleSidebar}>Тарифы</NavLink></li>
            <li><NavLink to="/about" onClick={toggleSidebar}>О нас</NavLink></li>
            
            {isAuthenticated ? (
              <>
                <li><NavLink to="/profile" onClick={toggleSidebar}>Профиль</NavLink></li>
                <li><NavLink to="/my-keys" onClick={toggleSidebar}>Мои ключи</NavLink></li>
                {user?.isAdmin && (
                  <li><NavLink to="/admin" onClick={toggleSidebar}>Админ-панель</NavLink></li>
                )}
                <li><button onClick={() => {logout(); toggleSidebar();}}>Выйти</button></li>
              </>
            ) : (
              <>
                <li><NavLink to="/login" onClick={toggleSidebar}>Войти</NavLink></li>
                <li><NavLink to="/register" onClick={toggleSidebar}>Регистрация</NavLink></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar; 