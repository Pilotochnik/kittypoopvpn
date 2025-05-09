import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import TelegramLoginButton from '../components/TelegramLoginButton';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const AuthContainer = styled(motion.div)`
  width: 100%;
  max-width: 450px;
  background-color: var(--card-background);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-align: center;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 30px;
  line-height: 1.5;
`;

const TelegramInfo = styled.div`
  background-color: rgba(0, 136, 204, 0.1);
  border-radius: 10px;
  padding: 20px;
  margin: 20px 0;
  border: 1px solid rgba(0, 136, 204, 0.2);
`;

const InfoText = styled.p`
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-bottom: 10px;
  line-height: 1.5;
  
  strong {
    color: var(--text-color);
  }
`;

const StepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 20px 0;
  text-align: left;
`;

const Step = styled.div`
  display: flex;
  margin-bottom: 15px;
  align-items: flex-start;
`;

const StepNumber = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(90deg, #0088cc, #0099ff);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 15px;
  flex-shrink: 0;
  font-size: 0.9rem;
`;

const StepText = styled.p`
  color: var(--text-secondary);
  margin: 0;
  padding-top: 3px;
  font-size: 0.95rem;
  line-height: 1.5;
`;

const TelegramButtonContainer = styled.div`
  margin: 30px 0;
`;

const LoginPage = () => {
  return (
    <PageContainer>
      <AuthContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title>Авторизация</Title>
        <Subtitle>
          Для использования сервиса Kitty Poop VPN требуется авторизация через Telegram.<br/>
          Это обеспечивает дополнительную безопасность и анонимность.
        </Subtitle>
        
        <TelegramInfo>
          <InfoText>
            <strong>Почему Telegram?</strong> Авторизация через Telegram позволяет:
          </InfoText>
          <StepsContainer>
            <Step>
              <StepNumber>1</StepNumber>
              <StepText>Не хранить ваши персональные данные</StepText>
            </Step>
            <Step>
              <StepNumber>2</StepNumber>
              <StepText>Обеспечить высокий уровень безопасности</StepText>
            </Step>
            <Step>
              <StepNumber>3</StepNumber>
              <StepText>Получать уведомления и VPN-ключи прямо в Telegram</StepText>
            </Step>
          </StepsContainer>
        </TelegramInfo>
        
        <TelegramButtonContainer>
          <TelegramLoginButton />
        </TelegramButtonContainer>
        
        <InfoText>
          После авторизации наш Telegram-бот отправит вам сообщение с VPN-ключом и инструкциями по настройке.
        </InfoText>
      </AuthContainer>
    </PageContainer>
  );
};

export default LoginPage; 