import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { QRCodeSVG } from 'qrcode.react';

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

const TrialKeyGenerator = () => {
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [expiryTime, setExpiryTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // Основная функция генерации ключа
  const handleGenerateKey = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/vpn/trial-key/anonymous', { method: 'POST' });
      const data = await response.json();
      
      if (data.key) {
        setGeneratedKey(data.key.config);
        setExpiryTime(new Date(data.key.expires));
      } else if (data.error) {
        setError(data.error);
      } else if (data.message) {
        setError(data.message);
      } else {
        setError('😢 Не удалось получить тестовый ключ. Пожалуйста, попробуйте позже!');
      }
    } catch (err) {
      setError('😢 Не удалось получить тестовый ключ. Пожалуйста, попробуйте позже!');
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
        Ключ будет активен только в течение 1 часа с момента генерации. Один пробный ключ на пользователя (повторная выдача возможна через 24 часа).
      </WarningText>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {!generatedKey ? (
        <GenerateButton
          onClick={handleGenerateKey}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
        >
          Получить пробный ключ
        </GenerateButton>
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