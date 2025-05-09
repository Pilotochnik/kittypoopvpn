import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 100px;
  padding-bottom: 50px;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: 60px;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 20px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Description = styled.p`
  font-size: 1.2rem;
  color: var(--text-secondary);
  max-width: 700px;
  margin: 0 auto 40px;
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PricingCard = styled(motion.div)`
  background-color: var(--card-background);
  border-radius: 20px;
  padding: 40px 30px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  border: ${props => props.popular ? '2px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.05)'};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -100px;
    right: -100px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: ${props => props.popular ? 'radial-gradient(circle, rgba(255, 102, 196, 0.1) 0%, rgba(255, 102, 196, 0) 70%)' : 'transparent'};
  }
  
  ${props => props.popular && `
    transform: scale(1.05);
    z-index: 1;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    
    @media (max-width: 768px) {
      transform: scale(1);
      margin-top: 20px;
      margin-bottom: 20px;
    }
  `}
`;

const PopularBadge = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
`;

const PlanName = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: var(--text-color);
`;

const Price = styled.div`
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 10px;
  color: ${props => props.popular ? 'var(--primary-color)' : 'var(--text-color)'};
  display: flex;
  align-items: flex-start;
  
  span {
    font-size: 1rem;
    margin-left: 5px;
    color: var(--text-secondary);
    align-self: flex-end;
    margin-bottom: 10px;
  }
`;

const PlanDescription = styled.p`
  color: var(--text-secondary);
  margin-bottom: 30px;
  font-size: 0.9rem;
`;

const FeaturesContainer = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 30px;
  flex-grow: 1;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  color: ${props => props.included ? 'var(--text-color)' : 'var(--text-secondary)'};
  opacity: ${props => props.included ? '1' : '0.6'};
  
  &:before {
    content: ${props => props.included ? '"✓"' : '"✕"'};
    display: inline-flex;
    width: 20px;
    height: 20px;
    background-color: ${props => props.included ? 'rgba(80, 250, 123, 0.2)' : 'rgba(255, 85, 85, 0.2)'};
    color: ${props => props.included ? 'var(--success-color)' : 'var(--error-color)'};
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    font-size: 12px;
  }
`;

const Button = styled(motion.button)`
  width: 100%;
  padding: 15px 0;
  background: ${props => props.popular ? 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))' : 'transparent'};
  border: ${props => props.popular ? 'none' : '2px solid var(--accent-color)'};
  border-radius: 10px;
  color: ${props => props.popular ? 'white' : 'var(--accent-color)'};
  font-weight: 700;
  font-size: 1.1rem;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${props => props.popular ? '0 10px 20px rgba(140, 82, 255, 0.3)' : '0 10px 20px rgba(51, 204, 255, 0.15)'};
    background: ${props => props.popular ? 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))' : 'rgba(51, 204, 255, 0.1)'};
  }
`;

const FAQ = styled.div`
  margin-top: 80px;
`;

const FAQTitle = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 40px;
  text-align: center;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const FAQItem = styled(motion.div)`
  margin-bottom: 20px;
  background-color: var(--card-background);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const FAQQuestion = styled.div`
  padding: 20px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  span {
    transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0)'};
    transition: transform 0.3s ease;
  }
`;

const FAQAnswer = styled(motion.div)`
  padding: 0 20px 20px;
  color: var(--text-secondary);
  line-height: 1.6;
`;

const TrialNote = styled.div`
  background: rgba(51, 204, 255, 0.1);
  border-radius: 12px;
  padding: 15px 20px;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  border: 1px solid rgba(51, 204, 255, 0.3);
  
  svg {
    color: var(--accent-color);
    font-size: 1.5rem;
    margin-right: 15px;
    flex-shrink: 0;
  }
  
  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.5;
  }
  
  strong {
    color: var(--text-color);
  }
`;

const PricingPage = () => {
  const [openFAQ, setOpenFAQ] = useState(null);
  
  const handleFAQToggle = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };
  
  const faqItems = [
    {
      question: 'Как работает оплата криптовалютой?',
      answer: 'После выбора тарифного плана, вы получите адрес кошелька для оплаты в выбранной криптовалюте. После подтверждения платежа в блокчейне (обычно занимает до 30 минут), ваш ключ будет активирован автоматически.'
    },
    {
      question: 'Могу ли я использовать один ключ на нескольких устройствах?',
      answer: 'Да, вы можете использовать один ключ на нескольких устройствах. Количество одновременных подключений зависит от выбранного тарифа: для тарифа "Базвичок" - 1 подключение, "Квартальный" - до 3, а "Наш слоняра" - до 10 одновременных подключений.'
    },
    {
      question: 'Что произойдет по истечении срока действия ключа?',
      answer: 'По истечении срока действия ключа, вы потеряете доступ к VPN-сервису. Вы получите уведомление о приближающемся окончании срока действия за 7 дней, чтобы успеть продлить подписку.'
    },
    {
      question: 'Какие способы оплаты вы принимаете?',
      answer: 'Мы принимаем различные криптовалюты, включая Bitcoin, Ethereum, USDT и другие. Для сохранения анонимности рекомендуем использовать криптовалюты.'
    },
    {
      question: 'Есть ли ограничения на скорость или трафик?',
      answer: 'Мы не устанавливаем ограничений на скорость. Ограничения по трафику есть только на тарифе "Базвичок" (100 ГБ). Для тарифов "Квартальный" и "Наш слоняра" предоставляется безлимитный трафик.'
    }
  ];
  
  return (
    <PageContainer>
      <Content>
        <HeaderSection>
          <Title>Выберите свой тариф</Title>
          <Description>
            Мы предлагаем тарифы для всех потребностей - от базового месячного до годового премиум-доступа. 
            Тариф "Наш слоняра" доступен только с оплатой на год.
          </Description>
        </HeaderSection>
        
        <TrialNote>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>
            <strong>Не уверены, какой тариф выбрать?</strong> Попробуйте наш бесплатный пробный период! Получите доступ к базовым функциям на 1 час, чтобы оценить качество сервиса.
          </p>
        </TrialNote>
        
        <PricingGrid>
          <PricingCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PlanName>Базвичок</PlanName>
            <Price>
              200<span>₽/месяц</span>
            </Price>
            <PlanDescription>
              Базовый доступ с ограниченным трафиком
            </PlanDescription>
            
            <FeaturesContainer>
              <FeatureItem included={true}>Доступ к серверам стандартной скорости</FeatureItem>
              <FeatureItem included={true}>100 ГБ трафика в месяц</FeatureItem>
              <FeatureItem included={true}>Поддержка через электронную почту</FeatureItem>
              <FeatureItem included={false}>Приоритетные серверы</FeatureItem>
              <FeatureItem included={false}>Одновременные подключения</FeatureItem>
            </FeaturesContainer>
            
            <Button 
              as={Link} 
              to={`/payment?plan=basic&period=monthly`}
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              Выбрать
            </Button>
          </PricingCard>
          
          <PricingCard
            popular
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <PopularBadge>Популярный</PopularBadge>
            <PlanName>Квартальный</PlanName>
            <Price popular>
              500<span>₽/3 месяца</span>
            </Price>
            <PlanDescription>
              Оптимальное решение на квартал
            </PlanDescription>
            
            <FeaturesContainer>
              <FeatureItem included={true}>Доступ ко всем серверам</FeatureItem>
              <FeatureItem included={true}>Безлимитный трафик</FeatureItem>
              <FeatureItem included={true}>Поддержка 24/7</FeatureItem>
              <FeatureItem included={true}>Приоритетные серверы</FeatureItem>
              <FeatureItem included={true}>До 3 одновременных подключений</FeatureItem>
            </FeaturesContainer>
            
            <Button 
              popular
              as={Link} 
              to={`/payment?plan=standard&period=quarterly`}
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              Выбрать
            </Button>
          </PricingCard>
          
          <PricingCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <PlanName>Наш слоняра</PlanName>
            <Price>
              1500<span>₽/год</span>
            </Price>
            <PlanDescription>
              Максимальный комфорт и безопасность на целый год
            </PlanDescription>
            
            <FeaturesContainer>
              <FeatureItem included={true}>Доступ к премиум серверам</FeatureItem>
              <FeatureItem included={true}>Безлимитный трафик</FeatureItem>
              <FeatureItem included={true}>Приоритетная поддержка 24/7</FeatureItem>
              <FeatureItem included={true}>VIP серверы с высокой скоростью</FeatureItem>
              <FeatureItem included={true}>До 10 одновременных подключений</FeatureItem>
            </FeaturesContainer>
            
            <Button 
              as={Link} 
              to={`/payment?plan=premium&period=yearly`}
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              Выбрать
            </Button>
          </PricingCard>
        </PricingGrid>
        
        <FAQ>
          <FAQTitle>Часто задаваемые вопросы</FAQTitle>
          
          {faqItems.map((item, index) => (
            <FAQItem
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <FAQQuestion 
                isOpen={openFAQ === index}
                onClick={() => handleFAQToggle(index)}
              >
                {item.question}
                <span>▼</span>
              </FAQQuestion>
              
              {openFAQ === index && (
                <FAQAnswer
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {item.answer}
                </FAQAnswer>
              )}
            </FAQItem>
          ))}
        </FAQ>
      </Content>
    </PageContainer>
  );
};

export default PricingPage; 