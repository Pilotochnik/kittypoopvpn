import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { checkKeyStatus, parseVlessKey } from '../utils/vpnUtils';
import { QRCodeSVG } from 'qrcode.react';

const KeysContainer = styled.div`
  margin: 30px 0;
`;

const KeyCard = styled(motion.div)`
  background-color: var(--card-background);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const KeyName = styled.h3`
  font-size: 18px;
  margin-bottom: 15px;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 10px;
`;

const KeyStatus = styled.span`
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 50px;
  background-color: ${props => props.active ? 'var(--success-color)' : 'var(--error-color)'};
  color: var(--background-color);
  font-weight: bold;
`;

const KeyDetails = styled.div`
  margin-top: 15px;
  font-size: 14px;
  color: var(--text-secondary);
`;

const KeyValue = styled.div`
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 10px 0;
  position: relative;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.span`
  color: var(--text-secondary);
`;

const DetailValue = styled.span`
  color: var(--text-color);
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
`;

const Button = styled(motion.button)`
  background: ${props => props.secondary ? 'transparent' : 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))'};
  border: ${props => props.secondary ? '1px solid var(--primary-color)' : 'none'};
  color: ${props => props.secondary ? 'var(--primary-color)' : 'white'};
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    box-shadow: ${props => props.secondary ? 'none' : '0 4px 15px rgba(140, 82, 255, 0.3)'};
    background: ${props => props.secondary ? 'rgba(255, 102, 196, 0.1)' : 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))'};
  }
`;

const CopyButton = styled(motion.button)`
  position: absolute;
  right: 10px;
  top: 8px;
  background: none;
  border: none;
  color: var(--accent-color);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const QRCodeModal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const QRCodeContainer = styled(motion.div)`
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  max-width: 300px;
  width: 100%;
  text-align: center;
  
  h3 {
    margin-bottom: 15px;
    color: var(--background-color);
  }
  
  .qr-container {
    display: flex;
    justify-content: center;
    margin-bottom: 15px;
  }
  
  button {
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }
`;

// Фиктивные данные для демонстрации
const dummyKeys = [
  {
    id: '1',
    vlessUrl: 'vless://62bc8aba-1979-4918-85ca-0e2eea1df559@pilotochnik.duckdns.org:443?encryption=none&security=tls&type=ws&host=pilotochnik.duckdns.org&path=%2Fvless#KittyPoopVPN-1',
    purchaseDate: new Date(2023, 3, 15),
    expiryDate: new Date(2023, 6, 15),
    plan: 'Месячный'
  },
  {
    id: '2',
    vlessUrl: 'vless://a4d1c8f9-56b3-4e78-9af1-3d5c8e7b1a92@pilotochnik.duckdns.org:443?encryption=none&security=tls&type=ws&host=pilotochnik.duckdns.org&path=%2Fvless#KittyPoopVPN-2',
    purchaseDate: new Date(2023, 4, 20),
    expiryDate: new Date(2024, 4, 20),
    plan: 'Годовой'
  }
];

const KeysList = () => {
  const [keys, setKeys] = useState([]);
  const [keysStatus, setKeysStatus] = useState({});
  const [expanded, setExpanded] = useState({});
  const [copied, setCopied] = useState({});
  const [showQRCode, setShowQRCode] = useState(null);

  useEffect(() => {
    // В реальном приложении здесь был бы API запрос
    setKeys(dummyKeys);
    
    // Проверяем статус каждого ключа
    const fetchKeysStatus = async () => {
      const statusMap = {};
      
      for (const key of dummyKeys) {
        try {
          const keyData = parseVlessKey(key.vlessUrl);
          const status = await checkKeyStatus(keyData);
          statusMap[key.id] = status;
        } catch (error) {
          console.error('Ошибка при проверке статуса ключа:', error);
        }
      }
      
      setKeysStatus(statusMap);
    };
    
    fetchKeysStatus();
  }, []);

  const toggleExpand = (keyId) => {
    setExpanded(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const handleCopy = (keyId) => {
    setCopied(prev => ({
      ...prev,
      [keyId]: true
    }));
    
    setTimeout(() => {
      setCopied(prev => ({
        ...prev,
        [keyId]: false
      }));
    }, 2000);
  };

  const openQRCode = (keyId) => {
    setShowQRCode(keyId);
  };

  const closeQRCode = () => {
    setShowQRCode(null);
  };

  const getQRCodeUrl = (vlessUrl) => {
    return vlessUrl;
  };

  return (
    <KeysContainer>
      <h2>Ваши VPN-ключи</h2>
      
      {keys.map(key => {
        const keyData = parseVlessKey(key.vlessUrl);
        const status = keysStatus[key.id];
        
        return (
          <KeyCard 
            key={key.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <KeyName>
              {keyData?.name || 'VPN-ключ'}
              {status && <KeyStatus active={status.active}>{status.active ? 'Активен' : 'Неактивен'}</KeyStatus>}
            </KeyName>
            
            <KeyValue>
              {expanded[key.id] ? key.vlessUrl : `${key.vlessUrl.substring(0, 50)}...`}
              <CopyToClipboard text={key.vlessUrl} onCopy={() => handleCopy(key.id)}>
                <CopyButton whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  {copied[key.id] ? 'Скопировано!' : 'Копировать'}
                </CopyButton>
              </CopyToClipboard>
            </KeyValue>
            
            <button onClick={() => toggleExpand(key.id)}>
              {expanded[key.id] ? 'Скрыть полный ключ' : 'Показать полный ключ'}
            </button>
            
            <ActionButtons>
              <Button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                Продлить ключ
              </Button>
              <Button secondary whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openQRCode(key.id)}>
                QR-код
              </Button>
            </ActionButtons>
          </KeyCard>
        );
      })}

      {showQRCode && (
        <QRCodeModal
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeQRCode}
        >
          <QRCodeContainer
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <h3>QR-код вашего ключа</h3>
            <div className="qr-container">
              <QRCodeSVG 
                value={keys.find(key => key.id === showQRCode)?.vlessUrl}
                size={250}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"L"}
                includeMargin={false}
              />
            </div>
            <button onClick={closeQRCode}>Закрыть</button>
          </QRCodeContainer>
        </QRCodeModal>
      )}
    </KeysContainer>
  );
};

export default KeysList; 