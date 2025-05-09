import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { generateVlessKey } from '../utils/vpnUtils';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { QRCodeSVG } from 'qrcode.react';

const GeneratorContainer = styled.div`
  background-color: var(--card-background);
  border-radius: 16px;
  padding: 30px;
  margin: 40px 0;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
`;

const Title = styled.h2`
  font-size: 24px;
  margin-bottom: 20px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const AdvancedToggle = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  
  span {
    margin-left: 10px;
    font-size: 14px;
    color: var(--text-secondary);
  }
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #333;
    transition: .4s;
    border-radius: 34px;
    
    &:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  }
  
  input:checked + span {
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  }
  
  input:checked + span:before {
    transform: translateX(26px);
  }
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-secondary);
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 15px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-color);
  font-family: 'Montserrat', sans-serif;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 102, 196, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 15px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-color);
  font-family: 'Montserrat', sans-serif;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 102, 196, 0.2);
  }

  option {
    background-color: var(--background-color);
  }
`;

const GenerateButton = styled(motion.button)`
  grid-column: 1 / -1;
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
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
  width: 200px;
  height: 200px;
  margin: 0 auto;
  background-color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 10px;
`;

const KeyGenerator = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    name: 'KittyPoopVPN',
    serverDomain: 'pilotochnik.duckdns.org',
    port: 443,
    encryption: 'none',
    security: 'tls',
    type: 'ws',
    path: '/vless'
  });
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const key = generateVlessKey(formData);
    setGeneratedKey(key);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GeneratorContainer>
      <Title>Генератор VPN-ключей</Title>
      
      <AdvancedToggle>
        <Switch>
          <input
            type="checkbox"
            checked={showAdvanced}
            onChange={() => setShowAdvanced(!showAdvanced)}
          />
          <span></span>
        </Switch>
        <span>Расширенные настройки</span>
      </AdvancedToggle>
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Название ключа</Label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Название для вашего ключа"
          />
        </FormGroup>
        
        {showAdvanced && (
          <>
            <FormGroup>
              <Label>Сервер</Label>
              <Input
                type="text"
                name="serverDomain"
                value={formData.serverDomain}
                onChange={handleChange}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Порт</Label>
              <Input
                type="number"
                name="port"
                value={formData.port}
                onChange={handleChange}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Шифрование</Label>
              <Select name="encryption" value={formData.encryption} onChange={handleChange}>
                <option value="none">None</option>
                <option value="aes-128-gcm">AES-128-GCM</option>
                <option value="chacha20-poly1305">ChaCha20-Poly1305</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Безопасность</Label>
              <Select name="security" value={formData.security} onChange={handleChange}>
                <option value="tls">TLS</option>
                <option value="none">None</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Тип соединения</Label>
              <Select name="type" value={formData.type} onChange={handleChange}>
                <option value="ws">WebSocket</option>
                <option value="tcp">TCP</option>
                <option value="grpc">gRPC</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Путь</Label>
              <Input
                type="text"
                name="path"
                value={formData.path}
                onChange={handleChange}
              />
            </FormGroup>
          </>
        )}
        
        <GenerateButton
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Сгенерировать ключ
        </GenerateButton>
      </Form>
      
      {generatedKey && (
        <ResultContainer>
          <h3>Ваш VLESS ключ:</h3>
          <KeyDisplay>
            {generatedKey}
            <CopyToClipboard text={generatedKey} onCopy={handleCopy}>
              <CopyButton whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {copied ? "Скопировано! ✓" : "Копировать"}
              </CopyButton>
            </CopyToClipboard>
          </KeyDisplay>
          
          <p>Отсканируйте QR-код в вашем VPN-приложении:</p>
          <QRCodeContainer>
            <QRCodeSVG 
              value={generatedKey}
              size={180}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"L"}
              includeMargin={false}
            />
          </QRCodeContainer>
          
          <p style={{ marginTop: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            * Для использования сгенерированного ключа в приложении v2rayNG или других совместимых приложениях, скопируйте ключ или отсканируйте QR-код.
          </p>
        </ResultContainer>
      )}
    </GeneratorContainer>
  );
};

export default KeyGenerator; 