import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

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
  margin-top: 60px;
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

const KeysContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 25px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const KeyItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  margin-bottom: 10px;
`;

const KeyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const KeyName = styled.div`
  font-weight: 600;
  color: var(--text-color);
`;

const KeyExpiry = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const Button = styled(motion.button)`
  padding: 8px 15px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const EmptyStateMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
`;

const MyKeysPage = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Загрузка ключей пользователя
  useEffect(() => {
    const fetchKeys = async () => {
      try {
        setLoading(true);
        if (!user?.id) {
          setKeys([]);
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/vpn/keys/${user.id}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.keys)) {
          // Переименовываем тестовые ключи
          const keys = data.keys.map((key, idx) => ({
            ...key,
            name: key.plan === 'trial' || key.isTrial ? 'Тестовый ключ' : key.name || `Ключ #${idx + 1}`,
            expiresAt: key.expires || key.expiresAt || key.expiry || key.created || ''
          }));
          setKeys(keys);
        } else {
          setKeys([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке ключей:', error);
        toast.error('Не удалось загрузить ключи');
        setLoading(false);
      }
    };
    
    fetchKeys();
  }, [user]);
  
  // Копирование ключа в буфер обмена
  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key.uuid)
      .then(() => toast.success('Ключ скопирован в буфер обмена'))
      .catch(() => toast.error('Не удалось скопировать ключ'));
  };
  
  return (
    <PageContainer>
      <ContentContainer>
        <Header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Мои ключи</h1>
          <p>Управление ключами доступа к VPN</p>
        </Header>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <KeysContainer>
            {loading ? (
              <LoadingContainer>
                <div className="loading-spinner"></div>
              </LoadingContainer>
            ) : keys.length > 0 ? (
              <>
                {keys.map((key) => (
                  <KeyItem key={key.id}>
                    <KeyInfo>
                      <KeyName>{key.name}</KeyName>
                      <KeyExpiry>
                        Истекает: {new Date(key.expiresAt).toLocaleDateString()}
                      </KeyExpiry>
                    </KeyInfo>
                    <Button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCopyKey(key)}
                    >
                      Копировать
                    </Button>
                  </KeyItem>
                ))}
              </>
            ) : (
              <EmptyStateMessage>
                У вас пока нет ключей. Создайте ваш первый ключ!
              </EmptyStateMessage>
            )}
          </KeysContainer>
        </motion.div>
      </ContentContainer>
    </PageContainer>
  );
};

export default MyKeysPage; 