import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { generateVlessKey } from '../utils/vpnUtils';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';

const GeneratorContainer = styled.div`
  background-color: var(--card-background);
  border-radius: 16px;
  padding: 30px;
  margin: 40px 0;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  border: 2px solid var(--primary-color);
  position: relative;
  overflow: hidden;
  
  &::after {
    content: 'TRIAL';
    position: absolute;
    top: 10px;
    right: -15px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    color: white;
    padding: 5px 30px;
    font-size: 12px;
    font-weight: bold;
    transform: rotate(45deg);
    z-index: 1;
  }
`;

const Title = styled.h2`
  font-size: 24px;
  margin-bottom: 10px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  margin-bottom: 20px;
  font-size: 15px;
`;

const WarningText = styled.p`
  color: #ffcc00;
  font-size: 14px;
  padding: 10px 15px;
  background-color: rgba(255, 204, 0, 0.1);
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  
  &::before {
    content: '⚠️';
    margin-right: 10px;
    font-size: 16px;
  }
`;

const GenerateButton = styled(motion.button)`
  width: 100%;
  padding: 15px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(140, 82, 255, 0.3);
  }
`;

const TelegramAuthButton = styled(motion.button)`
  width: 100%;
  padding: 15px;
  background: linear-gradient(90deg, #0088cc, #0099ff);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 136, 204, 0.3);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ResultContainer = styled.div`
  margin-top: 30px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 20px;
  position: relative;
`;

const KeyDisplay = styled.div`
  font-family: 'Courier New', monospace;
  word-break: break-all;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  font-size: 12px;
`;

const CopyButton = styled(motion.button)`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 4px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const QRCodeContainer = styled.div`
  width: 180px;
  height: 180px;
  margin: 0 auto;
  background-color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 8px;
`;

const TimerBox = styled.div`
  display: inline-block;
  padding: 8px 15px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 8px;
  color: white;
  font-weight: bold;
  margin-top: 15px;
`;

const ExpiryText = styled.p`
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 10px;
`;

const ErrorMessage = styled.div`
  background-color: rgba(255, 0, 0, 0.1);
  color: #ff6b6b;
  padding: 12px 15px;
  border-radius: 8px;
  margin-top: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  
  &::before {
    content: '⚠️';
    margin-right: 10px;
    font-size: 16px;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  border-radius: 16px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const FaqButton = styled(Link)`
  display: inline-block;
  padding: 12px 24px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  color: white;
  border-radius: 50px;
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  margin-top: 20px;
  transition: all 0.3s ease;
  text-align: center;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(140, 82, 255, 0.3);
  }
`;

const InfoBlock = styled.div`
  background-color: rgba(140, 82, 255, 0.1);
  border-left: 4px solid var(--primary-color);
  padding: 15px;
  margin: 20px 0;
  border-radius: 4px;
`;

// Фиксированный UUID, который работает на сервере
const WORKING_UUID = '62bc8aba-1979-4918-85ca-0e2eea1df559';

// Хук для локального хранилища
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
};

const TrialKeyGenerator = () => {
  const { isAuthenticated, user } = useAuth();
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [expiryTime, setExpiryTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trialKeys, setTrialKeys] = useLocalStorage('trialKeys', []);
  const navigate = useNavigate();

  // Обновление таймера каждую секунду
  useEffect(() => {
    let timer;
    if (expiryTime) {
      timer = setInterval(() => {
        const now = new Date();
        const diffMs = expiryTime - now;
        
        if (diffMs <= 0) {
          setTimeLeft('Ключ истек');
          clearInterval(timer);
        } else {
          const diffMins = Math.floor(diffMs / 60000);
          const diffSecs = Math.floor((diffMs % 60000) / 1000);
          setTimeLeft(`${diffMins}:${diffSecs < 10 ? '0' + diffSecs : diffSecs}`);
        }
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [expiryTime]);

  // Проверка наличия пробного ключа при загрузке
  useEffect(() => {
    if (isAuthenticated && trialKeys.length > 0) {
      const userKeys = trialKeys.filter(k => k.userId === user.id);
      
      if (userKeys.length > 0) {
        const lastKey = userKeys[userKeys.length - 1];
        const expiry = new Date(lastKey.expires);
        const now = new Date();
        
        if (expiry > now) {
          setGeneratedKey(lastKey.key);
          setExpiryTime(expiry);
        } else {
          // Удаляем истекшие ключи
          setTrialKeys(prev => prev.filter(k => new Date(k.expires) > now));
        }
      }
    }
  }, [trialKeys, setTrialKeys, isAuthenticated, user]);

  // Перенаправление на авторизацию через Telegram
  const redirectToTelegramAuth = () => {
    navigate('/auth/telegram', { state: { returnTo: '/' } });
  };

  // Основная функция генерации ключа
  const handleGenerateKey = () => {
    if (!isAuthenticated) {
      // Если пользователь не авторизован, предлагаем авторизоваться
      redirectToTelegramAuth();
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Проверяем, есть ли у пользователя уже действующий ключ
      const userKeys = trialKeys.filter(k => k.userId === user.id);
      const activeKey = userKeys.find(k => new Date(k.expires) > new Date());
      
      if (activeKey) {
        setGeneratedKey(activeKey.key);
        setExpiryTime(new Date(activeKey.expires));
        setLoading(false);
        return;
      }
      
      // Используем предустановленный UUID вместо генерации нового
      const uuid = WORKING_UUID;
      
      // Генерируем время истечения
      const now = new Date();
      const expiry = new Date(now.getTime() + 60 * 60 * 1000); // +1 час
      setExpiryTime(expiry);
      
      const formattedExpiry = expiry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const keyName = `KittyPoopVPN_Trial_1h_${formattedExpiry}`;
      
      // Настройки для пробного ключа
      const keyConfig = {
        name: keyName,
        uuid: uuid, // Используем рабочий UUID
        serverDomain: 'pilotochnik.duckdns.org',
        port: 443,
        encryption: 'none',
        security: 'tls',
        type: 'ws',
        path: '/vless'
      };
      
      // Генерируем ключ
      const key = generateVlessKey(keyConfig);
      setGeneratedKey(key);
      
      // Сохраняем ключ в локальном хранилище
      setTrialKeys(prev => [...prev, {
        userId: user.id,
        uuid,
        key,
        created: now.toISOString(),
        expires: expiry.toISOString()
      }]);
      
    } catch (err) {
      console.error('Ошибка при генерации пробного ключа:', err);
      setError('Произошла ошибка при генерации пробного ключа. Пожалуйста, попробуйте снова позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GeneratorContainer>
      {loading && (
        <LoadingOverlay>
          <LoadingSpinner />
        </LoadingOverlay>
      )}
      
      <Title>Пробный ключ на 1 час</Title>
      <Subtitle>Хотите попробовать наш VPN перед покупкой? Получите бесплатный ключ на 1 час!</Subtitle>
      
      <WarningText>
        Для получения пробного ключа требуется авторизация через Telegram. Ключ будет активен только в течение 1 часа с момента генерации.
      </WarningText>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {!generatedKey ? (
        isAuthenticated ? (
          <GenerateButton
            onClick={handleGenerateKey}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
          >
            Получить пробный ключ
          </GenerateButton>
        ) : (
          <TelegramAuthButton
            onClick={redirectToTelegramAuth}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24">
              <path d="M9.78 18.65L10.06 14.42L17.74 7.5C18.08 7.19 17.67 7.04 17.22 7.31L7.74 13.3L3.64 12C2.76 11.75 2.75 11.14 3.84 10.7L19.81 4.54C20.54 4.21 21.24 4.72 20.96 5.84L18.24 18.65C18.05 19.56 17.5 19.78 16.74 19.36L12.6 16.3L10.61 18.23C10.38 18.46 10.19 18.65 9.78 18.65Z" />
            </svg>
            Авторизоваться через Telegram
          </TelegramAuthButton>
        )
      ) : (
        <ResultContainer>
          <h3>Ваш пробный VLESS ключ:</h3>
          <KeyDisplay>
            {generatedKey}
            <CopyToClipboard text={generatedKey} onCopy={handleCopy}>
              <CopyButton whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {copied ? "Скопировано! ✓" : "Копировать"}
              </CopyButton>
            </CopyToClipboard>
          </KeyDisplay>
          
          <TimerBox>
            Осталось времени: {timeLeft}
          </TimerBox>
          
          <ExpiryText>
            Ключ будет действителен до {expiryTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ExpiryText>
          
          <p>Отсканируйте QR-код в вашем VPN-приложении:</p>
          <QRCodeContainer>
            <QRCodeSVG 
              value={generatedKey}
              size={160}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"L"}
              includeMargin={false}
            />
          </QRCodeContainer>
          
          <InfoBlock>
            <p>Не знаете, как использовать ключ? Перейдите в раздел FAQ для получения подробных инструкций по настройке VPN на вашем устройстве.</p>
            <FaqButton to="/faq">Инструкция по настройке</FaqButton>
          </InfoBlock>
          
          <p style={{ marginTop: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            * После истечения пробного периода, вы можете приобрести полную версию в разделе "Тарифы".
          </p>
        </ResultContainer>
      )}
    </GeneratorContainer>
  );
};

export default TrialKeyGenerator; 