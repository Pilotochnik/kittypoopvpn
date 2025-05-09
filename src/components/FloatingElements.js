import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const FloatingElementWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
`;

const Element = styled(motion.div)`
  position: absolute;
  font-size: ${props => props.size || '40px'};
  opacity: ${props => props.opacity || '0.6'};
  filter: blur(${props => props.blur || '0'}px);
  z-index: ${props => props.zIndex || '0'};
  user-select: none;
`;

const getRandomPosition = () => {
  return {
    x: Math.random() * 100,
    y: Math.random() * 100
  };
};

const FloatingElements = () => {
  // Создаем массив элементов (эмодзи какашек и кошек)
  const elements = [
    { emoji: '💩', size: '40px', opacity: 0.7, blur: 0, zIndex: 0 },
    { emoji: '💩', size: '30px', opacity: 0.5, blur: 1, zIndex: 0 },
    { emoji: '💩', size: '50px', opacity: 0.6, blur: 0, zIndex: 0 },
    { emoji: '💩', size: '35px', opacity: 0.4, blur: 2, zIndex: 0 },
    { emoji: '💩', size: '25px', opacity: 0.5, blur: 1, zIndex: 0 },
    { emoji: '🐱', size: '45px', opacity: 0.7, blur: 0, zIndex: 0 },
    { emoji: '🐱', size: '35px', opacity: 0.6, blur: 1, zIndex: 0 }
  ];

  return (
    <FloatingElementWrapper>
      {elements.map((element, index) => {
        const startPos = getRandomPosition();
        return (
          <Element
            key={index}
            size={element.size}
            opacity={element.opacity}
            blur={element.blur}
            zIndex={element.zIndex}
            initial={{ 
              x: `${startPos.x}vw`, 
              y: `${startPos.y}vh` 
            }}
            animate={{ 
              x: [`${startPos.x}vw`, `${(startPos.x + 20) % 100}vw`, `${(startPos.x - 10 + 100) % 100}vw`, `${startPos.x}vw`],
              y: [`${startPos.y}vh`, `${(startPos.y - 20 + 100) % 100}vh`, `${(startPos.y + 15) % 100}vh`, `${startPos.y}vh`],
              rotate: [0, 30, -40, 0]
            }}
            transition={{ 
              duration: 20 + Math.random() * 40,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.33, 0.66, 1]
            }}
          >
            {element.emoji}
          </Element>
        );
      })}
    </FloatingElementWrapper>
  );
};

export default FloatingElements; 