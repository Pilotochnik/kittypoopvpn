import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import KeyGenerator from '../components/KeyGenerator';
import TrialKeyGenerator from '../components/TrialKeyGenerator';

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 80px;
`;

const HeroSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 100px 20px 50px;
  background: radial-gradient(circle at center, #1a1a2e 0%, #0f0f14 80%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 200%;
    height: 200%;
    background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%233b3b5c' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
    top: -50%;
    left: -50%;
    z-index: 0;
    animation: moveBackground 30s linear infinite;
  }

  @keyframes moveBackground {
    0% {
      transform: translateY(0) rotate(0deg);
    }
    100% {
      transform: translateY(100px) rotate(5deg);
    }
  }
`;

const HeroTitle = styled(motion.h1)`
  font-size: 4rem;
  margin-bottom: 20px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 1.5rem;
  color: var(--text-secondary);
  max-width: 700px;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const ButtonGroup = styled(motion.div)`
  display: flex;
  gap: 20px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const PrimaryButton = styled(Link)`
  padding: 15px 30px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  color: white;
  border-radius: 50px;
  font-weight: 600;
  font-size: 18px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(140, 82, 255, 0.3);
  }
`;

const SecondaryButton = styled(Link)`
  padding: 15px 30px;
  background: transparent;
  color: var(--primary-color);
  border-radius: 50px;
  font-weight: 600;
  font-size: 18px;
  border: 2px solid var(--primary-color);
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  
  &:hover {
    background-color: rgba(255, 102, 196, 0.1);
    transform: translateY(-2px);
  }
`;

const FloatingElement = styled(motion.div)`
  position: absolute;
  z-index: 0;
  opacity: 0.6;
  filter: blur(2px);
`;

const SectionContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 20px;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 40px;
  text-align: center;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 60px;
`;

const FeatureCard = styled(motion.div)`
  background-color: var(--card-background);
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 102, 196, 0.3);
  }
`;

const FeatureIcon = styled.div`
  font-size: 40px;
  margin-bottom: 20px;
  color: var(--primary-color);
`;

const FeatureTitle = styled.h3`
  font-size: 22px;
  margin-bottom: 15px;
  color: var(--text-color);
`;

const FeatureDescription = styled.p`
  color: var(--text-secondary);
  line-height: 1.6;
`;

const FloatingPoop = styled(motion.div)`
  position: absolute;
  font-size: ${props => props.size || '30px'};
  z-index: 2;
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.7));
  opacity: ${props => props.opacity || 1};
  transform-origin: center;
`;

const FloatingEmoji = styled(motion.div)`
  position: absolute;
  font-size: ${props => props.size || '30px'};
  z-index: 2;
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.7));
  opacity: ${props => props.opacity || 1};
  transform-origin: center;
`;

const HomePage = () => {
  return (
    <PageContainer>
      <HeroSection>
        <FloatingElement
          initial={{ x: -100, y: -50 }}
          animate={{ 
            x: [-100, 100, -100],
            y: [-50, 100, -50]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ top: '20%', left: '20%' }}
        >
          🔒
        </FloatingElement>
        
        <FloatingElement
          initial={{ x: 100, y: 100 }}
          animate={{ 
            x: [100, -100, 100],
            y: [100, -100, 100]
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ bottom: '20%', right: '20%' }}
        >
          🌐
        </FloatingElement>
        
        <FloatingElement
          initial={{ x: 0, y: 0 }}
          animate={{ 
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0]
          }}
          transition={{ 
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ top: '40%', right: '30%' }}
        >
          🐱
        </FloatingElement>

        <HeroTitle
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Kitty Poop VPN
        </HeroTitle>
        
        <HeroSubtitle
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Безопасный и быстрый VPN-сервис для анонимного серфинга в интернете
        </HeroSubtitle>
        
        <ButtonGroup
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <PrimaryButton to="/pricing">Купить VPN</PrimaryButton>
          <SecondaryButton to="/faq">Узнать больше</SecondaryButton>
        </ButtonGroup>
      </HeroSection>

      <SectionContainer>
        <SectionTitle>Попробуйте бесплатно на 1 час</SectionTitle>
        <TrialKeyGenerator />
      </SectionContainer>

      <SectionContainer>
        <SectionTitle>Почему выбирают нас</SectionTitle>
        
        <FeaturesGrid>
          <FeatureCard
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <FeatureIcon>🔒</FeatureIcon>
            <FeatureTitle>Высокий уровень безопасности</FeatureTitle>
            <FeatureDescription>
              Мы используем современные протоколы шифрования для обеспечения полной анонимности ваших данных.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <FeatureIcon>⚡</FeatureIcon>
            <FeatureTitle>Высокая скорость соединения</FeatureTitle>
            <FeatureDescription>
              Наши серверы расположены по всему миру, что позволяет обеспечить максимальную скорость для любого местоположения.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <FeatureIcon>🌐</FeatureIcon>
            <FeatureTitle>Доступ к любым сайтам</FeatureTitle>
            <FeatureDescription>
              Обходите географические ограничения и получайте доступ к заблокированным сайтам и сервисам.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <FeatureIcon>🤝</FeatureIcon>
            <FeatureTitle>Удобство использования</FeatureTitle>
            <FeatureDescription>
              Простой процесс установки и настройки, интуитивно понятный интерфейс для пользователей любого уровня.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <FeatureIcon>💸</FeatureIcon>
            <FeatureTitle>Гибкая система оплаты</FeatureTitle>
            <FeatureDescription>
              Различные варианты оплаты, включая криптовалюты для сохранения вашей анонимности.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <FeatureIcon>🐱</FeatureIcon>
            <FeatureTitle>Уникальный стиль</FeatureTitle>
            <FeatureDescription>
              Яркий молодежный дизайн сервиса делает использование VPN не только безопасным, но и приятным.
            </FeatureDescription>
          </FeatureCard>
        </FeaturesGrid>
      </SectionContainer>

      <SectionContainer>
        <SectionTitle>Наша VPN-сеть</SectionTitle>
        <div style={{ 
          padding: '20px', 
          maxWidth: '1000px', 
          margin: '0 auto',
          borderRadius: '20px',
        }}>
          <PlanetAnimation />
          <div style={{
            textAlign: 'center',
            color: 'var(--text-color)',
            maxWidth: '800px',
            margin: '30px auto 0',
            fontSize: '1.2rem',
            lineHeight: '1.8',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '25px',
            borderRadius: '15px',
            border: '1px solid rgba(255, 102, 196, 0.3)',
            boxShadow: '0 0 25px rgba(255, 102, 196, 0.2)'
          }}>
            <span style={{ 
              fontWeight: 'bold', 
              color: 'var(--primary-color)', 
              fontSize: '1.4rem',
              display: 'block',
              marginBottom: '15px' 
            }}>
              Глобальная сеть серверов Kitty Poop VPN
            </span>
            Наша сеть VPN серверов расположена в более чем <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>20 странах мира</span>, 
            что обеспечивает стабильное соединение с высокой скоростью передачи данных. 
            Все серверы оснащены современными технологиями шифрования для обеспечения 
            максимальной безопасности ваших данных.
          </div>
        </div>
      </SectionContainer>
    </PageContainer>
  );
}

const PlanetAnimation = () => {
  return (
    <StyleBox>
      <GlowingCircle>
        <ServerPoints>
          {serverLocations.map((server, index) => (
            <ServerPoint 
              key={index}
              x={server.x}
              y={server.y}
              whileHover={{ scale: 1.5 }}
            >
              <ServerTooltip>
                {server.location}
              </ServerTooltip>
            </ServerPoint>
          ))}
        </ServerPoints>
        <NetworkLines>
          {serverLocations.map((server, index) => 
            serverLocations.slice(index + 1).map((target, targetIndex) => (
              <NetworkLine 
                key={`${index}-${targetIndex}`}
                x1={server.x}
                y1={server.y}
                x2={target.x}
                y2={target.y}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 1.5, delay: (index + targetIndex) * 0.1 }}
              />
            ))
          )}
        </NetworkLines>
      </GlowingCircle>
    </StyleBox>
  );
};

// Массив серверных точек 
const serverLocations = [
  { x: '50%', y: '25%', location: 'Северная Америка' },
  { x: '80%', y: '35%', location: 'Восточная Азия' },
  { x: '65%', y: '60%', location: 'Австралия' },
  { x: '45%', y: '40%', location: 'Европа' },
  { x: '40%', y: '55%', location: 'Южная Америка' },
  { x: '55%', y: '45%', location: 'Центральная Азия' },
  { x: '60%', y: '30%', location: 'Восточная Европа' },
  { x: '30%', y: '35%', location: 'Западная Европа' },
];

const StyleBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  margin: 20px 0;
`;

const GlowingCircle = styled.div`
  position: relative;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    rgba(140, 82, 255, 0.1) 0%,
    rgba(255, 102, 196, 0.05) 70%,
    transparent 100%
  );
  box-shadow: 0 0 30px rgba(140, 82, 255, 0.2);
  overflow: visible;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(255, 102, 196, 0.2);
`;

const ServerPoints = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const ServerPoint = styled(motion.div)`
  position: absolute;
  left: ${props => props.x};
  top: ${props => props.y};
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
  box-shadow: 0 0 10px var(--primary-color);
  z-index: 3;
  transform: translate(-50%, -50%);
  cursor: pointer;
  
  &:hover > div {
    opacity: 1;
    transform: translateY(-30px) scale(1);
  }
`;

const ServerTooltip = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%) translateY(-20px) scale(0.8);
  background: rgba(30, 30, 40, 0.9);
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: all 0.2s ease;
  pointer-events: none;
  z-index: 10;
  border: 1px solid var(--primary-color);
  box-shadow: 0 0 10px rgba(140, 82, 255, 0.5);
`;

const NetworkLines = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
`;

const NetworkLine = styled(motion.line)`
  stroke: var(--primary-color);
  stroke-width: 1;
  opacity: 0.3;
`;

export default HomePage; 