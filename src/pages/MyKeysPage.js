import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaRegCopy, FaCheck } from 'react-icons/fa';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 40px 20px;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  @media (max-width: 600px) {
    padding: 16px 4px;
  }
`;

const ContentContainer = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin-top: 60px;
  @media (max-width: 600px) {
    margin-top: 24px;
    gap: 16px;
  }
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
  @media (max-width: 600px) {
    padding: 10px 2px;
    gap: 10px;
    border-radius: 8px;
  }
`;

const KeyItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: rgba(40, 30, 70, 0.95);
  border: 1.5px solid #8a64ff;
  box-shadow: 0 4px 24px rgba(140, 82, 255, 0.10);
  border-radius: 10px;
  margin-bottom: 10px;
  width: 100%;
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    padding: 8px 4px;
    border-radius: 6px;
    margin-bottom: 6px;
  }
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

const KeyValue = styled.div`
  font-family: 'JetBrains Mono', 'Fira Mono', monospace;
  background: rgba(30, 30, 60, 0.95);
  color: #fff;
  padding: 14px 18px 14px 18px;
  border-radius: 10px;
  margin-bottom: 10px;
  font-size: 0.98rem;
  word-break: break-all;
  box-shadow: 0 2px 12px rgba(140, 82, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  width: 100%;
  @media (max-width: 600px) {
    font-size: 0.85rem;
    padding: 10px 6px 10px 10px;
    border-radius: 6px;
  }
`;

const CopyIcon = styled.span`
  margin-left: 12px;
  color: #ff66c4;
  cursor: pointer;
  font-size: 1.2em;
  transition: color 0.2s;
  &:hover {
    color: #8a64ff;
  }
  @media (max-width: 600px) {
    font-size: 1.5em;
    margin-left: 8px;
  }
`;

const DatesRow = styled.div`
  display: flex;
  gap: 24px;
  font-size: 0.92rem;
  color: #bdbddb;
  margin-top: 2px;
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 2px;
    font-size: 0.82rem;
  }
`;

const ExpandBtn = styled.button`
  background: none;
  border: none;
  color: #8a64ff;
  font-size: 0.92rem;
  cursor: pointer;
  margin-top: 4px;
  margin-left: -4px;
  &:hover {
    text-decoration: underline;
  }
  @media (max-width: 600px) {
    font-size: 0.85rem;
    margin-top: 2px;
  }
`;

const MyKeysPage = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);
  const [expanded, setExpanded] = useState({});
  
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
    navigator.clipboard.writeText(key.config)
      .then(() => {
        setCopiedKey(key.uuid || key.id);
        toast.success('Ключ скопирован!');
        setTimeout(() => setCopiedKey(null), 1200);
      })
      .catch(() => toast.error('Не удалось скопировать ключ'));
  };
  
  const toggleExpand = (keyId) => {
    setExpanded(prev => ({ ...prev, [keyId]: !prev[keyId] }));
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
                {keys.map((key) => {
                  const isExpanded = expanded[key.uuid || key.id];
                  const shortKey = key.config && key.config.length > 60 && !isExpanded
                    ? key.config.slice(0, 60) + '...'
                    : key.config;
                  return (
                    <KeyItem key={key.uuid || key.id}>
                      <KeyInfo>
                        <KeyValue>
                          <span>{shortKey}</span>
                          <CopyIcon title={copiedKey === (key.uuid || key.id) ? 'Скопировано!' : 'Скопировать'} onClick={() => handleCopyKey(key)}>
                            {copiedKey === (key.uuid || key.id) ? <FaCheck /> : <FaRegCopy />}
                          </CopyIcon>
                        </KeyValue>
                        {key.config && key.config.length > 60 && (
                          <ExpandBtn onClick={() => toggleExpand(key.uuid || key.id)}>
                            {isExpanded ? 'Скрыть' : 'Показать полностью'}
                          </ExpandBtn>
                        )}
                        <DatesRow>
                          <span>Дата покупки: {key.created ? new Date(key.created).toLocaleDateString() : '-'}</span>
                          <span>Истекает: {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : (key.expires ? new Date(key.expires).toLocaleDateString() : '-')}</span>
                        </DatesRow>
                      </KeyInfo>
                    </KeyItem>
                  );
                })}
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