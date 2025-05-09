import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

const ModalOverlay = styled(motion.div)`
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

const ModalContainer = styled(motion.div)`
  background-color: var(--card-background);
  border-radius: 16px;
  padding: 30px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
`;

const Title = styled.h3`
  font-size: 24px;
  margin-bottom: 20px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const QRCodeContainer = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  display: inline-block;
  margin-bottom: 20px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    background-image: url('https://telegram.org/img/t_logo.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    opacity: 0.15;
    pointer-events: none;
  }
`;

const Description = styled.p`
  color: var(--text-secondary);
  margin-bottom: 20px;
  font-size: 16px;
  line-height: 1.5;
`;

const Button = styled(motion.button)`
  padding: 12px 24px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(140, 82, 255, 0.3);
  }
`;

const TimerContainer = styled.div`
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(0, 0, 0, 0.2);
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 14px;
  color: var(--text-secondary);
`;

const RefreshButton = styled(motion.button)`
  background: none;
  border: none;
  color: var(--accent-color);
  font-size: 14px;
  margin-left: 10px;
  cursor: pointer;
  
  &:hover {
    color: var(--primary-color);
    text-decoration: underline;
  }
`;

const QRCodeModal = ({ isOpen, onClose, qrValue, title, description, onRefresh }) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 минут в секундах
  
  // Форматирование времени в минуты:секунды
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Обратный отсчет таймера
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(interval);
      setTimeLeft(300); // Сброс таймера при закрытии
    };
  }, [isOpen, onClose]);
  
  // Обновление QR-кода
  const handleRefresh = () => {
    setTimeLeft(300); // Сброс таймера
    if (onRefresh) onRefresh();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <ModalContainer
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <Title>{title || 'QR-код'}</Title>
        
        <TimerContainer>
          {formatTime(timeLeft)}
          <RefreshButton onClick={handleRefresh}>Обновить</RefreshButton>
        </TimerContainer>
        
        <Description>{description || 'Отсканируйте QR-код для продолжения'}</Description>
        
        <QRCodeContainer>
          <QRCodeSVG 
            value={qrValue || 'https://telegram.org/'}
            size={220}
            bgColor="#ffffff"
            fgColor="#000000"
            level="L"
            includeMargin={false}
          />
        </QRCodeContainer>
        
        <Button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
        >
          Закрыть
        </Button>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default QRCodeModal; 