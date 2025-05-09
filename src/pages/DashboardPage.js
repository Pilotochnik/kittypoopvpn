import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import KeysList from '../components/KeysList';

const DashboardContainer = styled.div`
  min-height: 100vh;
  padding-top: 100px;
  padding-bottom: 50px;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const UserAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  font-weight: bold;
`;

const UserDetails = styled.div`
  h3 {
    font-size: 1.2rem;
    margin-bottom: 5px;
  }
  
  p {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 768px) {
    overflow-x: auto;
    padding-bottom: 5px;
    
    &::-webkit-scrollbar {
      height: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
  }
`;

const Tab = styled.button`
  padding: 12px 20px;
  background: ${props => props.active ? 'var(--card-background)' : 'transparent'};
  color: ${props => props.active ? 'var(--primary-color)' : 'var(--text-secondary)'};
  border: none;
  border-bottom: 2px solid ${props => props.active ? 'var(--primary-color)' : 'transparent'};
  border-radius: 8px 8px 0 0;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    color: var(--primary-color);
  }
`;

const Card = styled(motion.div)`
  background-color: var(--card-background);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const StatCard = styled(motion.div)`
  background-color: var(--card-background);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  
  h3 {
    font-size: 1rem;
    color: var(--text-secondary);
    margin-bottom: 10px;
  }
  
  .value {
    font-size: 2rem;
    font-weight: bold;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .change {
    margin-top: 10px;
    font-size: 0.8rem;
    color: ${props => props.isPositive ? 'var(--success-color)' : 'var(--error-color)'};
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-secondary);
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 15px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-color);
  font-family: 'Montserrat', sans-serif;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 102, 196, 0.2);
  }
`;

const Button = styled(motion.button)`
  padding: 12px 24px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(140, 82, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('keys');
  
  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };
  
  // Имитация данных для статистики
  const statsData = {
    activeKeys: 2,
    dataUsed: 45.7, // GB
    daysLeft: 24,
    lastConnected: '2 часа назад'
  };
  
  return (
    <DashboardContainer>
      <Content>
        <DashboardHeader>
          <Title>Личный кабинет</Title>
          
          <UserInfo>
            <UserAvatar>{getInitials(user.name)}</UserAvatar>
            <UserDetails>
              <h3>{user.name}</h3>
              <p>{user.email || 'Telegram пользователь'}</p>
            </UserDetails>
          </UserInfo>
        </DashboardHeader>
        
        <StatGrid>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3>Активные ключи</h3>
            <div className="value">{statsData.activeKeys}</div>
            <div className="change">
              <span>↑</span> Активно
            </div>
          </StatCard>
          
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h3>Использовано данных</h3>
            <div className="value">{statsData.dataUsed} GB</div>
            <div className="change">
              <span>↑</span> 2.3 GB за последние 24 часа
            </div>
          </StatCard>
          
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h3>Осталось дней</h3>
            <div className="value">{statsData.daysLeft}</div>
            <div className="change">
              <span>↓</span> До окончания подписки
            </div>
          </StatCard>
          
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <h3>Последнее подключение</h3>
            <div className="value">{statsData.lastConnected}</div>
            <div className="change">
              <span>↑</span> Было активно
            </div>
          </StatCard>
        </StatGrid>
        
        <Tabs>
          <Tab active={activeTab === 'keys'} onClick={() => setActiveTab('keys')}>
            Мои ключи
          </Tab>
          <Tab active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>
            Профиль
          </Tab>
          <Tab active={activeTab === 'payments'} onClick={() => setActiveTab('payments')}>
            История платежей
          </Tab>
          <Tab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
            Настройки
          </Tab>
        </Tabs>
        
        {activeTab === 'keys' && (
          <KeysList />
        )}
        
        {activeTab === 'profile' && (
          <Card
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2>Личные данные</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Эти данные используются только для идентификации вашего аккаунта.
            </p>
            
            <FormGroup>
              <Label>Имя</Label>
              <Input type="text" defaultValue={user.name} />
            </FormGroup>
            
            <FormGroup>
              <Label>Email</Label>
              <Input type="email" defaultValue={user.email} />
            </FormGroup>
            
            <Button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Сохранить изменения
            </Button>
          </Card>
        )}
        
        {activeTab === 'payments' && (
          <Card
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2>История платежей</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Ваши последние транзакции:
            </p>
            
            {/* Пример истории платежей */}
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
              <p>История платежей пуста</p>
            </div>
          </Card>
        )}
        
        {activeTab === 'settings' && (
          <Card
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2>Настройки</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Управление настройками аккаунта.
            </p>
            
            <FormGroup>
              <Label>Смена пароля</Label>
              <Input type="password" placeholder="Текущий пароль" style={{ marginBottom: '10px' }} />
              <Input type="password" placeholder="Новый пароль" style={{ marginBottom: '10px' }} />
              <Input type="password" placeholder="Подтвердите новый пароль" />
            </FormGroup>
            
            <Button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Обновить пароль
            </Button>
            
            <hr style={{ margin: '30px 0', borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <div>
              <h3 style={{ marginBottom: '15px' }}>Удаление аккаунта</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>
                Это действие необратимо. После удаления аккаунта все данные будут стерты.
              </p>
              <Button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                style={{ background: 'var(--error-color)' }}
              >
                Удалить аккаунт
              </Button>
            </div>
          </Card>
        )}
      </Content>
    </DashboardContainer>
  );
};

export default DashboardPage; 