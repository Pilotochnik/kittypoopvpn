import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

const Container = styled.div`
  width: 100%;
  background-color: var(--card-background);
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const Title = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--text-color);
  text-align: center;
  
  span {
    color: ${props => {
      if (props.status === 'completed') return 'var(--success-color)';
      if (props.status === 'expired') return 'var(--error-color)';
      return 'var(--primary-color)';
    }};
  }
`;

const StatusBadge = styled.div`
  display: inline-block;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 25px;
  background-color: ${props => {
    if (props.status === 'completed') return 'rgba(80, 250, 123, 0.2)';
    if (props.status === 'expired') return 'rgba(255, 85, 85, 0.2)';
    return 'rgba(80, 120, 255, 0.15)';
  }};
  color: ${props => {
    if (props.status === 'completed') return 'var(--success-color)';
    if (props.status === 'expired') return 'var(--error-color)';
    return 'var(--primary-color)';
  }};
`;

const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 10px;
`;

const InfoLabel = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const InfoValue = styled.div`
  color: var(--text-color);
  font-weight: 500;
  font-size: 0.9rem;
  word-break: break-all;
  text-align: right;
  max-width: 70%;
`;

const PaymentQRContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 30px 0;
`;

const QRCodeWrapper = styled.div`
  background-color: white;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 15px;
`;

const WalletAddress = styled.div`
  font-family: monospace;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 10px 15px;
  border-radius: 10px;
  margin-bottom: 10px;
  word-break: break-all;
  text-align: center;
  font-size: 0.9rem;
  max-width: 100%;
`;

const CopyButton = styled(motion.button)`
  background-color: rgba(255, 255, 255, 0.05);
  border: none;
  padding: 8px 15px;
  border-radius: 8px;
  color: var(--text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  
  svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const TimerContainer = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 20px;
  padding-top: 20px;
  text-align: center;
`;

const TimerLabel = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 10px;
`;

const TimerValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => {
    if (props.almostExpired) return 'var(--error-color)';
    return 'var(--text-color)';
  }};
`;

const Button = styled(motion.button)`
  width: 100%;
  padding: 15px 0;
  background: ${props => props.confirm ? 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))' : 'transparent'};
  border: ${props => props.confirm ? 'none' : '2px solid var(--accent-color)'};
  border-radius: 10px;
  color: ${props => props.confirm ? 'white' : 'var(--accent-color)'};
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.confirm ? '0 10px 20px rgba(140, 82, 255, 0.3)' : 'none'};
    background: ${props => props.confirm ? 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))' : 'rgba(51, 204, 255, 0.1)'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;
`;

const KeyContainer = styled(motion.div)`
  background-color: rgba(80, 250, 123, 0.1);
  border: 1px solid var(--success-color);
  border-radius: 12px;
  padding: 20px;
  margin-top: 30px;
`;

const KeyTitle = styled.h4`
  font-size: 1.2rem;
  color: var(--success-color);
  margin-bottom: 15px;
  text-align: center;
`;

const KeyValue = styled.div`
  font-family: monospace;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 10px 15px;
  border-radius: 10px;
  margin-bottom: 10px;
  word-break: break-all;
  font-size: 0.8rem;
`;

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const CryptoPaymentDetails = ({ payment, onConfirm, onBack, onCheckQR }) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  useEffect(() => {
    if (payment && payment.status === 'pending') {
      const expiryTime = new Date(payment.expires).getTime();
      const now = new Date().getTime();
      const initialSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));
      
      setTimeLeft(initialSeconds);
      
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [payment]);
  
  const handleCopyAddress = () => {
    if (payment && payment.wallet) {
      navigator.clipboard.writeText(payment.wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const getCurrencyName = (code) => {
    const currencies = {
      'btc': 'Bitcoin (BTC)',
      'eth': 'Ethereum (ETH)',
      'usdt': 'USDT (TRC20)',
      'usdt_eth': 'USDT (ERC20)',
      'ton': 'TON (Toncoin)',
      'manual_tinkoff': 'Перевод на карту Тинькофф'
    };
    
    return currencies[code] || code;
  };
  
  const getStatusText = (status) => {
    const statuses = {
      'pending': 'Ожидание оплаты',
      'completed': 'Оплачено',
      'expired': 'Истекло',
      'waiting_confirmation': 'Ожидание подтверждения'
    };
    
    return statuses[status] || status;
  };
  
  if (!payment) return null;
  
  // Проверяем, является ли платеж ручным переводом на карту Тинькофф
  const isManualTinkoffPayment = payment.currency === 'manual_tinkoff';
  
  return (
    <Container>
      <Title status={payment.status}>
        {payment.status === 'completed' ? 'Оплата успешно выполнена' : 
         isManualTinkoffPayment ? 'Оплата переводом на карту' : 'Оплата криптовалютой'}
      </Title>
      
      <StatusBadge status={payment.status}>
        {getStatusText(payment.status)}
      </StatusBadge>
      
      <InfoContainer>
        <InfoRow>
          <InfoLabel>Способ оплаты</InfoLabel>
          <InfoValue>{getCurrencyName(payment.currency)}</InfoValue>
        </InfoRow>
        
        <InfoRow>
          <InfoLabel>Тариф</InfoLabel>
          <InfoValue>
            {payment.plan === 'basic' ? 'Базовый' : 
             payment.plan === 'standard' ? 'Стандартный' : 
             payment.plan === 'premium' ? 'Премиум' : payment.plan}
            {' '}
            ({payment.period === 'monthly' ? 'месяц' : 'год'})
          </InfoValue>
        </InfoRow>
        
        <InfoRow>
          <InfoLabel>Сумма</InfoLabel>
          <InfoValue>
            {isManualTinkoffPayment ? 
              `${payment.amount} ₽` : 
              `${payment.cryptoAmount} ${payment.currency === 'btc' ? 'BTC' : 
                                      payment.currency === 'eth' ? 'ETH' : 
                                      payment.currency === 'ton' ? 'TON' : 'USDT'}`
            }
          </InfoValue>
        </InfoRow>
        
        {payment.created && (
          <InfoRow>
            <InfoLabel>Дата создания</InfoLabel>
            <InfoValue>
              {new Date(payment.expiryTime).toLocaleString('ru-RU')}
            </InfoValue>
          </InfoRow>
        )}
      </InfoContainer>
      
      {payment.status === 'completed' ? (
        <KeyContainer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <KeyTitle>Ваш VPN-ключ готов!</KeyTitle>
          {payment.vpnKey && (
            <>
              <KeyValue>{payment.vpnKey.config}</KeyValue>
              <ButtonsContainer>
                <Button
                  confirm
                  onClick={() => onCheckQR(payment.vpnKey.config)}
                >
                  Показать QR-код
                </Button>
              </ButtonsContainer>
            </>
          )}
        </KeyContainer>
      ) : isManualTinkoffPayment ? (
        <>
          <PaymentQRContainer>
            <InfoRow style={{ justifyContent: 'center', textAlign: 'center', border: 'none' }}>
              <div>
                <h3 style={{ marginBottom: '15px', color: 'var(--primary-color)' }}>Инструкция по оплате</h3>
                <ol style={{ textAlign: 'left', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                  <li>Переведите точную сумму {payment.amount} ₽ на карту Тинькофф</li>
                  <li>В комментариях к платежу укажите ID платежа: <b>{payment.paymentId}</b></li>
                  <li>После перевода нажмите кнопку "Я оплатил" ниже</li>
                  <li>Администратор проверит поступление средств и активирует ваш ключ</li>
                </ol>
              </div>
            </InfoRow>
            
            <WalletAddress style={{ marginTop: '20px' }}>
              Номер карты: <b>{payment.cardNumber || '2200700774500382'}</b>
            </WalletAddress>
            
            <CopyButton 
              onClick={() => {
                navigator.clipboard.writeText(payment.cardNumber || '2200700774500382');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg viewBox="0 0 24 24">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
              </svg>
              {copied ? 'Скопировано!' : 'Копировать номер карты'}
            </CopyButton>
          </PaymentQRContainer>
          
          <TimerContainer>
            <TimerLabel>Время на оплату</TimerLabel>
            <TimerValue almostExpired={timeLeft < 60 * 10}>
              {formatTime(timeLeft)}
            </TimerValue>
          </TimerContainer>
          
          <ButtonsContainer>
            <Button
              onClick={onBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Назад
            </Button>
            
            {payment.status === 'waiting_confirmation' ? (
              <Button
                confirm
                disabled={true}
                style={{ backgroundColor: 'rgba(80, 250, 123, 0.2)', border: 'none' }}
              >
                Ожидание подтверждения платежа
              </Button>
            ) : (
              <Button
                confirm
                onClick={onConfirm}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Я оплатил
              </Button>
            )}
          </ButtonsContainer>
        </>
      ) : (
        <>
          <PaymentQRContainer>
            <QRCodeWrapper>
              <QRCodeSVG 
                value={payment.cryptoAddress}
                size={180}
                level="H"
                includeMargin={true}
                fgColor="#000"
                bgColor="#fff"
              />
            </QRCodeWrapper>
            
            <WalletAddress>
              {payment.cryptoAddress}
            </WalletAddress>
            
            <CopyButton 
              onClick={handleCopyAddress}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg viewBox="0 0 24 24">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
              </svg>
              {copied ? 'Скопировано!' : 'Копировать адрес'}
            </CopyButton>
          </PaymentQRContainer>
          
          <TimerContainer>
            <TimerLabel>Время на оплату</TimerLabel>
            <TimerValue almostExpired={timeLeft < 60 * 10}>
              {formatTime(timeLeft)}
            </TimerValue>
          </TimerContainer>
          
          <ButtonsContainer>
            <Button
              onClick={onBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Назад
            </Button>
            
            <Button
              confirm
              onClick={onConfirm}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Я оплатил
            </Button>
          </ButtonsContainer>
        </>
      )}
    </Container>
  );
};

export default CryptoPaymentDetails; 