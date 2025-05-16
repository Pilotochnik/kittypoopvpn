import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import UserProfile from '../auth/components/UserProfile';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 40px 20px;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
`;

const ContentContainer = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const Header = styled(motion.header)`
  width: 100%;
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    color: #fff;
    font-size: 2.5rem;
    margin: 0;
    font-weight: 700;
    background: linear-gradient(90deg, #ff66c4, #8a64ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p {
    color: rgba(255, 255, 255, 0.6);
    margin: 10px 0 0;
    font-size: 1rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  width: 100%;
  
  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #ff66c4;
    animation: spin 1s ease-in-out infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ProfilePage = () => {
  const { loading, user } = useAuth();
  const navigate = useNavigate();
  
  // Показываем индикатор загрузки, пока загружаются данные профиля
  if (loading) {
    return (
      <PageContainer>
        <ContentContainer>
          <Header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1>Ваш профиль</h1>
            <p>Загрузка данных...</p>
          </Header>
          <LoadingContainer>
            <div className="loading-spinner"></div>
          </LoadingContainer>
        </ContentContainer>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <ContentContainer>
        <Header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Ваш профиль</h1>
          <p>Управление аккаунтом и настройками</p>
        </Header>
        {user && user.isAdmin && (
          <button
            style={{
              background: '#229ED9',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '18px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(34,158,217,0.12)'
            }}
            onClick={() => navigate('/admin/keys')}
          >
            Управление ключами (админ)
          </button>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <UserProfile />
        </motion.div>
      </ContentContainer>
    </PageContainer>
  );
};

export default ProfilePage; 