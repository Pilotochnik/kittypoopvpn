import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { QRCodeSVG } from 'qrcode.react';

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 100px;
  padding-bottom: 50px;
`;

const Content = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 15px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  max-width: 700px;
  margin: 0 auto;
`;

const KeysContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 40px;
`;

const KeyCard = styled(motion.div)`
  background-color: var(--card-background);
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
  
  ${props => props.isActive && `
    border: 1px solid var(--primary-color);
    box-shadow: 0 10px 30px rgba(255, 102, 196, 0.15);
  `}
  
  ${props => props.isExpired && `
    opacity: 0.7;
  `}
`;

const KeyType = styled.div`
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 4px 12px;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 600;
  
  ${props => props.type === 'trial' && `
    background-color: rgba(255, 204, 0, 0.2);
    color: #ffcc00;
  `}
  
  ${props => props.type === 'basic' && `
    background-color: rgba(80, 250, 123, 0.2);
    color: var(--success-color);
  `}
  
  ${props => props.type === 'premium' && `
    background-color: rgba(255, 102, 196, 0.2);
    color: var(--primary-color);
  `}
`;

const KeyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
`;

const KeyName = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 5px;
  color: var(--text-color);
`;

const KeyExpires = styled.p`
  font-size: 0.9rem;
  color: ${props => props.isExpired ? 'var(--error-color)' : 'var(--text-secondary)'};
  margin-bottom: 10px;
`;

const KeyDisplay = styled.div`
  font-family: 'Courier New', monospace;
  word-break: break-all;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
  position: relative;
  font-size: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const KeyDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 20px;
`;

const DetailItem = styled.div`
  background-color: rgba(0, 0, 0, 0.1);
  padding: 12px;
  border-radius: 8px;
  
  h4 {
    font-size: 0.9rem;
    margin-bottom: 5px;
    color: var(--text-secondary);
  }
  
  p {
    font-size: 1rem;
    color: var(--text-color);
  }
`;

const CopyButton = styled(motion.button)`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  font-size: 0.8rem;
  padding: 5px 10px;
  border-radius: 4px;
  
  &:hover {
    background-color: rgba(51, 204, 255, 0.1);
  }
`;

const QRCodeWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: 20px 0;
`;

const QRCodeContainer = styled.div`
  width: 150px;
  height: 150px;
  background-color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  background-color: var(--card-background);
  border-radius: 12px;
  margin-bottom: 30px;
  
  h3 {
    margin-bottom: 15px;
    color: var(--text-color);
  }
  
  p {
    color: var(--text-secondary);
    margin-bottom: 20px;
  }
`;

const KeyControls = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const KeyButton = styled(motion.button)`
  background: ${props => props.secondary ? 'transparent' : 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))'};
  border: ${props => props.secondary ? '1px solid var(--accent-color)' : 'none'};
  color: ${props => props.secondary ? 'var(--accent-color)' : 'white'};
  padding: 8px 15px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
`;

const InstructionBlock = styled.div`
  background-color: rgba(51, 204, 255, 0.1);
  border-left: 3px solid var(--accent-color);
  padding: 15px;
  margin: 30px 0;
  border-radius: 4px;
  
  h3 {
    margin-bottom: 10px;
    color: var(--accent-color);
  }
  
  p {
    color: var(--text-secondary);
    font-size: 0.95rem;
    margin-bottom: 10px;
  }
  
  ol, ul {
    padding-left: 20px;
    color: var(--text-secondary);
  }
  
  li {
    margin-bottom: 8px;
  }
`;

const MyKeysPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [allKeys, setAllKeys] = useState([]);
  const [copiedKeyId, setCopiedKeyId] = useState(null);
  
  // Имитация загрузки ключей пользователя
  useEffect(() => {
    if (isAuthenticated && user) {
      // В реальном приложении здесь был бы API запрос
      
      // Проверяем наличие триальных ключей в localStorage
      const trialKeysStr = localStorage.getItem('trialKeys');
      let userTrialKeys = [];
      
      if (trialKeysStr) {
        try {
          const parsedKeys = JSON.parse(trialKeysStr);
          userTrialKeys = parsedKeys.filter(key => key.userId === user.id).map(key => ({
            id: `trial-${key.uuid}`,
            type: 'trial',
            name: 'Пробный ключ',
            key: key.key,
            created: new Date(key.created),
            expires: new Date(key.expires),
            isActive: new Date(key.expires) > new Date(),
            server: 'pilotochnik.duckdns.org',
            port: 443,
            protocol: 'VLESS',
            traffic: {
              limit: '100 ГБ',
              used: '0 ГБ'
            }
          }));
        } catch (error) {
          console.error('Ошибка при чтении пробных ключей:', error);
        }
      }
      
      // Имитация купленных ключей (в реальном приложении они бы загружались с сервера)
      const purchasedKeys = [
        {
          id: 'premium-1',
          type: 'premium',
          name: 'Премиум VPN',
          key: 'vless://5c7bf8f3-5287-42c1-a983-8f98b6b29d99@pilotochnik.duckdns.org:443?encryption=none&security=tls&type=ws&path=/vless#KittyPoop_Premium',
          created: new Date(2023, 5, 15),
          expires: new Date(2024, 5, 15),
          isActive: true,
          server: 'premium.kittypoopvpn.com',
          port: 443,
          protocol: 'VLESS',
          traffic: {
            limit: 'Безлимитно',
            used: '50 ГБ'
          }
        }
      ];
      
      // Объединяем все ключи
      setAllKeys([...userTrialKeys, ...purchasedKeys]);
    }
  }, [isAuthenticated, user]);
  
  const handleCopyKey = (keyId) => {
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };
  
  // Перенаправляем неавторизованных пользователей
  if (!isAuthenticated) {
    return <Navigate to="/auth/telegram" />;
  }
  
  return (
    <PageContainer>
      <Content>
        <HeaderSection>
          <Title>Мои VPN ключи</Title>
          <Description>
            Здесь вы найдете информацию о всех ваших VPN ключах, их статусе и инструкции по настройке.
          </Description>
        </HeaderSection>
        
        {allKeys.length === 0 ? (
          <EmptyState>
            <h3>У вас пока нет VPN ключей</h3>
            <p>Вы можете получить бесплатный пробный ключ на главной странице или приобрести ключ в разделе "Тарифы".</p>
          </EmptyState>
        ) : (
          <KeysContainer>
            {allKeys.map(key => (
              <KeyCard 
                key={key.id} 
                isActive={key.isActive}
                isExpired={!key.isActive}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <KeyType type={key.type}>
                  {key.type === 'trial' ? 'Пробный' : key.type === 'basic' ? 'Базовый' : 'Премиум'}
                </KeyType>
                
                <KeyHeader>
                  <div>
                    <KeyName>{key.name}</KeyName>
                    <KeyExpires isExpired={!key.isActive}>
                      {key.isActive
                        ? `Активен до: ${key.expires.toLocaleDateString()}`
                        : `Истек: ${key.expires.toLocaleDateString()}`}
                    </KeyExpires>
                  </div>
                </KeyHeader>
                
                <KeyDisplay>
                  {key.key}
                  <CopyToClipboard text={key.key} onCopy={() => handleCopyKey(key.id)}>
                    <CopyButton>
                      {copiedKeyId === key.id ? "Скопировано! ✓" : "Копировать"}
                    </CopyButton>
                  </CopyToClipboard>
                </KeyDisplay>
                
                <QRCodeWrapper>
                  <QRCodeContainer>
                    <QRCodeSVG 
                      value={key.key}
                      size={130}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"L"}
                      includeMargin={false}
                    />
                  </QRCodeContainer>
                </QRCodeWrapper>
                
                <KeyDetails>
                  <DetailItem>
                    <h4>Сервер</h4>
                    <p>{key.server}</p>
                  </DetailItem>
                  
                  <DetailItem>
                    <h4>Порт</h4>
                    <p>{key.port}</p>
                  </DetailItem>
                  
                  <DetailItem>
                    <h4>Протокол</h4>
                    <p>{key.protocol}</p>
                  </DetailItem>
                  
                  <DetailItem>
                    <h4>Трафик</h4>
                    <p>{key.traffic.used} из {key.traffic.limit}</p>
                  </DetailItem>
                </KeyDetails>
              </KeyCard>
            ))}
          </KeysContainer>
        )}
        
        <InstructionBlock>
          <h3>Инструкция по настройке VPN</h3>
          <p>Для использования VPN выполните следующие шаги:</p>
          <ol>
            <li>Скачайте и установите клиент для вашей системы (v2rayN для Windows, v2rayNG для Android, Shadowrocket для iOS)</li>
            <li>Откройте приложение и нажмите на кнопку добавления новой конфигурации</li>
            <li>Отсканируйте QR-код или вставьте скопированную ссылку</li>
            <li>Подключитесь к серверу и наслаждайтесь безопасным соединением</li>
          </ol>
          <p>Подробную инструкцию по настройке для разных устройств можно найти в разделе FAQ.</p>
        </InstructionBlock>
      </Content>
    </PageContainer>
  );
};

export default MyKeysPage; 