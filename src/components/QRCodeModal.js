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
`;

const Button = styled(motion.button)`
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
  width: 100%;
`;

const TimerContainer = styled.div`
  font-size: 18px;
  color: var(--text-secondary);
  margin-bottom: 15px;
`;

const Description = styled.p`
  color: var(--text-secondary);
  margin-bottom: 20px;
  font-size: 16px;
  line-height: 1.5;
`;

const QRCodeModal = ({ isOpen, onClose, qrValue, title, description }) => {
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

  if (!isOpen) return null;

  return (
    <ModalOverlay
      data-testid="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <ModalContainer
        data-testid="modal-content"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <Title>{title || 'QR-код'}</Title>
        
        <TimerContainer>
          {formatTime(timeLeft)}
        </TimerContainer>
        
        <Description>{description || 'Отсканируйте QR-код для подключения'}</Description>
        
        <QRCodeContainer>
          <QRCodeSVG
            value={qrValue}
            size={220}
            level="H"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#000000"
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