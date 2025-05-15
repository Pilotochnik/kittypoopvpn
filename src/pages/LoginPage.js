import React from 'react';
import styled from 'styled-components';
import TelegramLoginButton from '../components/TelegramLoginButton';
import { motion } from 'framer-motion';
import { getAuthDebugLogs, clearAuthDebugLogs } from '../utils/authDebugLogger';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
`;

const FormContainer = styled(motion.div)`
  width: 100%;
  max-width: 400px;
  padding: 30px;
  background: rgba(15, 15, 25, 0.7);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Logo = styled.div`
  margin-bottom: 30px;
  text-align: center;
  
  h1 {
    color: #fff;
    font-size: 2rem;
    margin: 0;
    font-weight: 700;
  }
  
  p {
    color: rgba(255, 255, 255, 0.6);
    margin: 10px 0 0;
    font-size: 0.9rem;
  }
`;

const LoginPage = () => {
  const downloadLogs = () => {
    const logs = getAuthDebugLogs();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auth_debug_log.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    clearAuthDebugLogs();
    alert('Логи очищены!');
  };

  return (
    <PageContainer>
      <FormContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo>
          <h1>KittyPoopVPN</h1>
          <p>Безопасный доступ в интернет с заботой о вас</p>
        </Logo>
        
        <TelegramLoginButton />

        {/* Кнопки для отладки (только для разработки) */}
        {process.env.NODE_ENV !== 'production' && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button onClick={downloadLogs} style={{ marginRight: 12, padding: '8px 16px', borderRadius: 6, background: '#eee', color: '#333', border: '1px solid #ccc', cursor: 'pointer' }}>
              Скачать логи авторизации
            </button>
            <button onClick={handleClearLogs} style={{ padding: '8px 16px', borderRadius: 6, background: '#eee', color: '#333', border: '1px solid #ccc', cursor: 'pointer' }}>
              Очистить логи
            </button>
          </div>
        )}
      </FormContainer>
    </PageContainer>
  );
};

export default LoginPage; 