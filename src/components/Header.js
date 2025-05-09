import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const HeaderContainer = styled.header`
  padding: 20px 0;
  width: 100%;
  z-index: 100;
  transition: all 0.3s ease;
  background-color: rgba(15, 15, 20, 0.8);
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  left: 0;
`;

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const Logo = styled(Link)`
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
  display: flex;
  align-items: center;

  img {
    height: 40px;
    margin-right: 10px;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 30px;

  @media (max-width: 768px) {
    display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
    flex-direction: column;
    position: absolute;
    top: 80px;
    left: 0;
    right: 0;
    background-color: var(--background-color);
    padding: 20px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const NavLink = styled(Link)`
  color: var(--text-color);
  font-weight: 600;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    width: 0;
    height: 2px;
    bottom: -5px;
    left: 0;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    transition: width 0.3s ease;
  }
  
  &:hover:after, &.active:after {
    width: 100%;
  }
`;

const AuthButtons = styled.div`
  display: flex;
  gap: 15px;
`;

const TelegramAuthButton = styled(Link)`
  padding: 8px 20px;
  border-radius: 8px;
  background: linear-gradient(90deg, #0088cc, #0099ff);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 136, 204, 0.3);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const MenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 24px;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const ProfileButton = styled.div`
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProfileImage = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
`;

const ProfileMenu = styled(motion.div)`
  position: absolute;
  top: 50px;
  right: 0;
  background-color: var(--card-background);
  border-radius: 8px;
  padding: 10px 0;
  width: 200px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 10;
`;

const ProfileMenuItem = styled(Link)`
  display: block;
  padding: 10px 20px;
  color: var(--text-color);
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--primary-color);
  }
`;

const LogoutButton = styled.button`
  width: 100%;
  text-align: left;
  padding: 10px 20px;
  background: none;
  border: none;
  color: var(--error-color);
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <HeaderContainer style={{ 
      backgroundColor: scrolled ? 'rgba(15, 15, 20, 0.9)' : 'transparent',
      boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.1)' : 'none'
    }}>
      <Nav>
        <Logo to="/">
          <motion.div
            initial={{ rotate: 0 }}
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            🐱
          </motion.div>
          Kitty Poop VPN
        </Logo>

        <MenuButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? '✕' : '☰'}
        </MenuButton>

        <NavLinks isOpen={isMenuOpen}>
          <NavLink to="/">Главная</NavLink>
          <NavLink to="/pricing">Тарифы</NavLink>
          <NavLink to="/faq">FAQ</NavLink>
          
          {isAuthenticated ? (
            <ProfileButton onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <ProfileImage>{getInitials(user?.name)}</ProfileImage>
              <span>{user?.name}</span>
              
              {showProfileMenu && (
                <ProfileMenu
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProfileMenuItem to="/dashboard">Мой профиль</ProfileMenuItem>
                  <ProfileMenuItem to="/my-keys">Мои ключи</ProfileMenuItem>
                  <ProfileMenuItem to="/orders">История покупок</ProfileMenuItem>
                  <LogoutButton onClick={handleLogout}>Выйти</LogoutButton>
                </ProfileMenu>
              )}
            </ProfileButton>
          ) : (
            <AuthButtons>
              <TelegramAuthButton to="/auth/telegram">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                  <path d="M9.78 18.65L10.06 14.42L17.74 7.5C18.08 7.19 17.67 7.04 17.22 7.31L7.74 13.3L3.64 12C2.76 11.75 2.75 11.14 3.84 10.7L19.81 4.54C20.54 4.21 21.24 4.72 20.96 5.84L18.24 18.65C18.05 19.56 17.5 19.78 16.74 19.36L12.6 16.3L10.61 18.23C10.38 18.46 10.19 18.65 9.78 18.65Z" />
                </svg>
                Авторизация через Telegram
              </TelegramAuthButton>
            </AuthButtons>
          )}
        </NavLinks>
      </Nav>
    </HeaderContainer>
  );
};

export default Header; 