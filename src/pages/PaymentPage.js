import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import CryptoPaymentSelector from '../components/CryptoPaymentSelector';
import CryptoPaymentDetails from '../components/CryptoPaymentDetails';
import QRCodeModal from '../components/QRCodeModal';
import TelegramLoginButton from '../components/TelegramLoginButton';
import { createPayment, getPayment, confirmPayment, confirmManualPayment } from '../utils/cryptoPaymentService';
import { useAuth } from '../context/AuthContext';

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 100px;
  padding-bottom: 50px;
`;

const Content = styled.div`
  max-width: 700px;
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
  max-width: 600px;
  margin: 0 auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 50px 0;
`;

const Spinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--primary-color);
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  background-color: rgba(255, 85, 85, 0.2);
  border: 1px solid var(--error-color);
  border-radius: 12px;
  padding: 20px;
  margin: 30px 0;
  text-align: center;
`;

const ErrorTitle = styled.h3`
  color: var(--error-color);
  margin-bottom: 10px;
`;

const ErrorMessage = styled.p`
  color: var(--text-secondary);
  margin-bottom: 15px;
`;

const Button = styled(motion.button)`
  padding: 12px 25px;
  background: transparent;
  border: 2px solid var(--accent-color);
  border-radius: 10px;
  color: var(--accent-color);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(51, 204, 255, 0.1);
  }
`;

// Новые стили для авторизации
const AuthContainer = styled(motion.div)`
  width: 100%;
  background-color: var(--card-background);
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const AuthTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--text-color);
  text-align: center;
`;

const AuthDescription = styled.p`
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 25px;
  text-align: center;
  line-height: 1.5;
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: var(--text-secondary);
  
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  span {
    padding: 0 15px;
    font-size: 0.9rem;
  }
`;

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('auth'); // Начинаем с авторизации
  const [payment, setPayment] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrValue, setQrValue] = useState('');
  
  const searchParams = new URLSearchParams(location.search);
  const planParam = searchParams.get('plan') || 'standard';
  const periodParam = searchParams.get('period') || 'monthly';
  const paymentIdParam = searchParams.get('paymentId');
  
  useEffect(() => {
    // Если пользователь уже авторизован, переходим к выбору криптовалюты
    if (user) {
      setStep('select-currency');
    }
    
    // Если есть ID платежа в URL, загружаем информацию о нем
    if (paymentIdParam) {
      loadPayment(paymentIdParam);
    }
  }, [paymentIdParam, user]);
  
  const loadPayment = async (paymentId) => {
    try {
      setLoading(true);
      setError(null);
      
      const paymentData = await getPayment(paymentId);
      setPayment(paymentData);
      
      // Если платеж найден, переходим к отображению деталей
      setStep('payment-details');
    } catch (error) {
      console.error('Ошибка при загрузке платежа:', error);
      setError(error.message || 'Не удалось загрузить информацию о платеже');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCurrencySelect = async (currency) => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем ID пользователя из объекта пользователя или используем anonymous-user
      const userId = user?.id || 'anonymous-user';
      
      const paymentData = {
        userId,
        plan: planParam,
        currency,
        period: periodParam
      };
      
      const newPayment = await createPayment(paymentData);
      setPayment(newPayment);
      
      // Обновляем URL, чтобы можно было вернуться к платежу
      navigate(`/payment?paymentId=${newPayment.paymentId}`, { replace: true });
      
      // Переходим к шагу с отображением деталей платежа
      setStep('payment-details');
    } catch (error) {
      console.error('Ошибка при создании платежа:', error);
      setError(error.message || 'Не удалось создать платеж');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePaymentConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Определяем, какой тип платежа используется
      const isManualTinkoffPayment = payment.currency === 'manual_tinkoff';
      
      // Используем соответствующую функцию подтверждения в зависимости от типа платежа
      let confirmedPayment;
      if (isManualTinkoffPayment) {
        confirmedPayment = await confirmManualPayment(payment.paymentId);
      } else {
        confirmedPayment = await confirmPayment(payment.paymentId);
      }
      
      setPayment(confirmedPayment);
      
      if (confirmedPayment.status === 'completed') {
        // В реальном приложении здесь можно добавить отправку уведомления пользователю
        console.log('Платеж успешно подтвержден!');
        
        // Если у пользователя есть email, отправляем инструкции и ключ
        if (user && user.email) {
          // В реальном приложении здесь будет отправка email
          console.log(`Отправляем ключ и инструкции на email: ${user.email}`);
        }
        
        // Если у пользователя есть Telegram ID, отправляем инструкции и ключ
        if (user && user.id && user.id !== 'anonymous-user') {
          // В реальном приложении здесь будет отправка в Telegram
          console.log(`Отправляем ключ и инструкции в Telegram ID: ${user.id}`);
        }
      } else if (confirmedPayment.status === 'waiting_confirmation') {
        // Платеж отправлен на подтверждение администратором
        console.log('Платеж отправлен на подтверждение администратором');
      }
    } catch (error) {
      console.error('Ошибка при подтверждении платежа:', error);
      setError(error.message || 'Не удалось подтвердить платеж');
    } finally {
      setLoading(false);
    }
  };
  
  const handleShowQRCode = (value) => {
    setQrValue(value);
    setShowQRModal(true);
  };
  
  const handleBack = () => {
    if (step === 'payment-details') {
      // Возвращаемся к выбору криптовалюты
      setStep('select-currency');
      // Удаляем параметр paymentId из URL
      navigate('/payment', { replace: true });
    } else {
      // Возвращаемся на страницу тарифов
      navigate('/pricing');
    }
  };
  
  const getStepTitle = () => {
    switch (step) {
      case 'auth':
        return 'Авторизация перед оплатой';
      case 'select-currency':
        return 'Оплата криптовалютой';
      case 'payment-details':
        return 'Детали платежа';
      default:
        return 'Оплата';
    }
  };
  
  const getStepDescription = () => {
    switch (step) {
      case 'auth':
        return 'Авторизуйтесь через Telegram для получения VPN-ключа после оплаты или продолжите без авторизации.';
      case 'select-currency':
        return 'Выберите криптовалюту для оплаты выбранного тарифного плана.';
      case 'payment-details':
        if (payment && payment.status === 'completed') {
          return 'Ваш платеж успешно обработан! Ваш VPN-ключ готов к использованию.';
        }
        return 'Отправьте точную сумму на указанный адрес кошелька. После подтверждения транзакции в сети ваш ключ будет активирован.';
      default:
        return '';
    }
  };
  
  // Компонент авторизации перед оплатой
  const renderAuthStep = () => {
    return (
      <AuthContainer>
        <AuthTitle>Авторизация перед оплатой</AuthTitle>
        <AuthDescription>
          Для получения VPN-ключа после оплаты, вам рекомендуется авторизоваться через Telegram.
          Это позволит нам отправить вам ключ напрямую в мессенджер.
          <br/>
          Вы также можете продолжить без авторизации.
        </AuthDescription>
        
        <TelegramLoginButton />
        
        <OrDivider>
          <span>или</span>
        </OrDivider>
        
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Button 
            onClick={() => setStep('select-currency')} 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Продолжить без авторизации
          </Button>
        </div>
      </AuthContainer>
    );
  };
  
  return (
    <PageContainer>
      <Content>
        <HeaderSection>
          <Title>{getStepTitle()}</Title>
          <Description>{getStepDescription()}</Description>
        </HeaderSection>
        
        {loading && step !== 'auth' ? (
          <LoadingContainer>
            <Spinner />
            <p>Пожалуйста, подождите...</p>
          </LoadingContainer>
        ) : error ? (
          <ErrorContainer>
            <ErrorTitle>Произошла ошибка</ErrorTitle>
            <ErrorMessage>{error}</ErrorMessage>
            <Button 
              onClick={handleBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Вернуться назад
            </Button>
          </ErrorContainer>
        ) : (
          <>
            {step === 'auth' && renderAuthStep()}
            
            {step === 'select-currency' && (
              <CryptoPaymentSelector
                onCurrencySelect={handleCurrencySelect}
                onContinue={handleCurrencySelect}
              />
            )}
            
            {step === 'payment-details' && payment && (
              <CryptoPaymentDetails
                payment={payment}
                onConfirm={handlePaymentConfirm}
                onBack={handleBack}
                onCheckQR={handleShowQRCode}
              />
            )}
          </>
        )}
      </Content>
      
      {showQRModal && (
        <QRCodeModal
          value={qrValue}
          title="VPN Ключ"
          onClose={() => setShowQRModal(false)}
        />
      )}
    </PageContainer>
  );
};

export default PaymentPage;