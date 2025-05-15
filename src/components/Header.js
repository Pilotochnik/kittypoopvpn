import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: rgba(15, 15, 25, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Logo = styled(Link)`
  color: #ff66c4;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const NavLink = styled(Link)`
  color: #fff;
  text-decoration: none;
  padding: 5px 10px;
  border-radius: 5px;
  transition: background-color 0.3s;
  
  &:hover, &.active {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const LoginButton = styled(Link)`
  padding: 8px 16px;
  background-color: #ff66c4;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  font-weight: bold;
`;

const Header = ({ toggleSidebar = () => {} }) => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  
  return (
    <HeaderContainer>
      <Logo to="/">Kitty Poop VPN</Logo>
      
      <Navigation>
        <NavLink 
          to="/" 
          className={location.pathname === '/' ? 'active' : ''}
        >
          Главная
        </NavLink>
        <NavLink 
          to="/pricing" 
          className={location.pathname === '/pricing' ? 'active' : ''}
        >
          Тарифы
        </NavLink>
        <NavLink 
          to="/about" 
          className={location.pathname === '/about' ? 'active' : ''}
        >
          О нас
        </NavLink>
        
        {isAuthenticated ? (
          <>
            <NavLink 
              to="/profile" 
              className={location.pathname === '/profile' ? 'active' : ''}
            >
              Профиль
            </NavLink>
            <NavLink 
              to="/faq" 
              className={location.pathname === '/faq' ? 'active' : ''}
            >
              FAQ по настройке
            </NavLink>
            <NavLink 
              to="/login" 
              onClick={(e) => {
                e.preventDefault();
                logout();
              }}
            >
              Выйти
            </NavLink>
          </>
        ) : (
          <>
            <NavLink 
              to="/faq" 
              className={location.pathname === '/faq' ? 'active' : ''}
            >
              FAQ по настройке
            </NavLink>
            <LoginButton to="/login">Войти</LoginButton>
          </>
        )}
      </Navigation>
    </HeaderContainer>
  );
};

export default Header; 