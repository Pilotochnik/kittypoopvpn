import React from 'react';
import styled from 'styled-components';
import TelegramLoginButton from '../components/TelegramLoginButton';
import { motion } from 'framer-motion';
import { getAuthDebugLogs, clearAuthDebugLogs } from '../utils/authDebugLogger';

const InfoBox = styled.div`
  margin: 0 auto 28px auto;
  max-width: 440px;
  background: linear-gradient(120deg, #e3f0ff 0%, #b3e0ff 100%);
  border-left: 5px solid #229ED9;
  border-radius: 14px;
  padding: 22px 28px 20px 24px;
  color: #1a2a3a;
  font-size: 1.13rem;
  line-height: 1.8;
  text-align: center;
  box-shadow: 0 4px 24px 0 rgba(34, 158, 217, 0.10), 0 2px 8px rgba(0,0,0,0.07);
  display: flex;
  align-items: flex-start;
  gap: 14px;
  border-top: 1.5px solid #b3e0ff;
  border-bottom: 1.5px solid #b3e0ff;
`;

const InfoEmoji = styled.span`
  font-size: 2.1rem;
  margin-right: 8px;
  margin-top: 2px;
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  padding: 20px;
  margin-bottom: auto;
`;

const FormContainer = styled(motion.div)`
  width: 100%;
  max-width: 600px;
  padding: 45px;
  background: rgba(15, 15, 25, 0.85);
  border-radius: 24px;
  box-shadow: 0 12px 48px 0 rgba(140, 82, 255, 0.25), 0 2px 8px rgba(0,0,0,0.15);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  margin-top: 0;
  position: relative;
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

const AnimatedEmoji = styled(motion.div)`
  position: absolute;
  font-size: 3.2rem;
  z-index: 10;
  pointer-events: none;
  filter: drop-shadow(0 0 16px rgba(140, 82, 255, 0.25));
`;

const TelegramButton = styled(motion.button)`
  width: 100%;
  padding: 16px 0;
  background: linear-gradient(90deg, #229ED9 0%, #60cfff 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1.15rem;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  margin: 18px 0 0 0;
  box-shadow: 0 4px 16px 0 rgba(34, 158, 217, 0.13);
  letter-spacing: 0.5px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  &:hover {
    background: linear-gradient(90deg, #60cfff 0%, #229ED9 100%);
    box-shadow: 0 6px 24px 0 rgba(34, 158, 217, 0.18);
    transform: translateY(-2px) scale(1.03);
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatedEmoji
          initial={{ x: -60, y: -40, rotate: -10 }}
          animate={{ x: 0, y: 0, rotate: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          style={{ top: -30, left: -30 }}
        >😺</AnimatedEmoji>
        <AnimatedEmoji
          initial={{ x: 60, y: -40, rotate: 10 }}
          animate={{ x: 0, y: 0, rotate: 0 }}
          transition={{ duration: 1.7, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          style={{ top: -30, right: -30 }}
        >💩</AnimatedEmoji>
        <AnimatedEmoji
          initial={{ y: 40, scale: 1 }}
          animate={{ y: 60, scale: 1.2 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          style={{ bottom: -30, left: 40 }}
        >🔒</AnimatedEmoji>
        <AnimatedEmoji
          initial={{ y: 60, scale: 1 }}
          animate={{ y: 40, scale: 1.1 }}
          transition={{ duration: 2.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          style={{ bottom: -30, right: 40 }}
        >🐾</AnimatedEmoji>
        <AnimatedEmoji
          initial={{ x: -30, y: 0, scale: 1 }}
          animate={{ x: 10, y: 10, scale: 1.1 }}
          transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          style={{ top: 80, left: -40 }}
        >😻</AnimatedEmoji>
        <AnimatedEmoji
          initial={{ x: 30, y: 0, scale: 1 }}
          animate={{ x: -10, y: 10, scale: 1.1 }}
          transition={{ duration: 2.8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          style={{ top: 80, right: -40 }}
        >💩</AnimatedEmoji>
        <Logo>
          <h1>KittyPoopVPN</h1>
          <p>Безопасный доступ в интернет с заботой о вас</p>
        </Logo>
        <InfoBox>
          <InfoEmoji>🔒</InfoEmoji>
          <div>
            <b style={{color:'#229ED9', fontSize:'1.08em'}}>Авторизация через Telegram полностью безопасна!</b> <br/>
            <span style={{color: '#1a2a3a'}}>Вам не нужно повторно входить в аккаунт — просто напишите нашему боту 😺 и следуйте инструкции.<br/>Ваши данные защищены, мы не получаем доступ к переписке <span role="img" aria-label="замок">🔐</span></span>
          </div>
        </InfoBox>
        <TelegramLoginButton />
      </FormContainer>
    </PageContainer>
  );
};

export default LoginPage; 