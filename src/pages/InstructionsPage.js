import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 100px;
  padding-bottom: 50px;
`;

const Content = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 20px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto 30px;
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  gap: 10px;
  flex-wrap: wrap;
`;

const Tab = styled.button`
  background-color: ${props => props.active ? 'var(--accent-color)' : 'transparent'};
  border: 2px solid var(--accent-color);
  border-radius: 30px;
  padding: 10px 20px;
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.active ? 'white' : 'var(--accent-color)'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${props => props.active ? 'var(--accent-color)' : 'rgba(51, 204, 255, 0.1)'};
  }
`;

const TabContent = styled(motion.div)`
  display: ${props => props.active ? 'block' : 'none'};
  background-color: var(--card-background);
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const StepTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--text-color);
`;

const StepsList = styled.ol`
  padding-left: 20px;
  margin-bottom: 30px;
  
  li {
    margin-bottom: 15px;
    color: var(--text-secondary);
    line-height: 1.6;
    
    strong {
      color: var(--text-color);
    }
    
    pre, code {
      background-color: rgba(0, 0, 0, 0.2);
      padding: 10px;
      border-radius: 8px;
      display: block;
      margin: 10px 0;
      font-family: monospace;
      color: var(--accent-color);
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
`;

const ImportantNote = styled.div`
  background-color: rgba(80, 250, 123, 0.1);
  border-left: 3px solid var(--success-color);
  padding: 15px;
  margin-bottom: 30px;
  border-radius: 4px;
  color: var(--text-secondary);
  
  strong {
    color: var(--success-color);
  }
`;

const AppLink = styled.a`
  color: var(--accent-color);
  text-decoration: none;
  font-weight: 600;
  
  &:hover {
    text-decoration: underline;
  }
`;

const DownloadSection = styled.div`
  margin-top: 30px;
  background-color: rgba(51, 204, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  
  h3 {
    color: var(--accent-color);
    margin-bottom: 15px;
  }
  
  ul {
    list-style: none;
    padding: 0;
  }
  
  li {
    margin-bottom: 10px;
  }
`;

const InstructionsPage = () => {
  const [activeTab, setActiveTab] = useState('windows');
  
  return (
    <PageContainer>
      <Content>
        <HeaderSection>
          <Title>Инструкции по настройке VPN</Title>
          <Description>
            Следуйте этим инструкциям, чтобы настроить VPN на вашем устройстве. Выберите вашу операционную систему ниже.
          </Description>
          
          <TabsContainer>
            <Tab 
              active={activeTab === 'windows'} 
              onClick={() => setActiveTab('windows')}
            >
              Windows
            </Tab>
            <Tab 
              active={activeTab === 'macos'} 
              onClick={() => setActiveTab('macos')}
            >
              macOS
            </Tab>
            <Tab 
              active={activeTab === 'android'} 
              onClick={() => setActiveTab('android')}
            >
              Android
            </Tab>
            <Tab 
              active={activeTab === 'ios'} 
              onClick={() => setActiveTab('ios')}
            >
              iOS
            </Tab>
            <Tab 
              active={activeTab === 'linux'} 
              onClick={() => setActiveTab('linux')}
            >
              Linux
            </Tab>
          </TabsContainer>
        </HeaderSection>
        
        <TabContent 
          active={activeTab === 'windows'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ImportantNote>
            <strong>Важно:</strong> Для устройств Windows рекомендуется использовать клиент v2rayN, который обеспечивает наилучшую совместимость и производительность с нашим сервисом.
          </ImportantNote>

          <StepTitle>Настройка VPN на Windows через v2rayN</StepTitle>
          <StepsList>
            <li>Скачайте и установите клиент <strong>v2rayN</strong> с <AppLink href="https://github.com/2dust/v2rayN/releases" target="_blank">GitHub</AppLink></li>
            <li>Распакуйте архив и запустите приложение v2rayN.exe</li>
            <li>В личном кабинете на нашем сайте скопируйте VLESS-ключ или скачайте QR-код</li>
            <li>В клиенте v2rayN нажмите на кнопку <strong>Добавить</strong> ➔ <strong>Добавить VLESS сервер</strong> или используйте опцию <strong>Сканировать QR-код</strong></li>
            <li>Если вы выбрали ручное добавление, введите параметры сервера из полученной конфигурации</li>
            <li>Сохраните конфигурацию и выберите её в списке</li>
            <li>Нажмите правой кнопкой на добавленную конфигурацию и выберите <strong>Установить как активный сервер</strong></li>
            <li>Проверьте, что в системном трее появился значок v2rayN</li>
            <li>Нажмите на значок и выберите <strong>Включить V2Ray</strong></li>
          </StepsList>
        </TabContent>
        
        <TabContent 
          active={activeTab === 'macos'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ImportantNote>
            <strong>Важно:</strong> Для устройств macOS рекомендуется использовать приложение V2rayU, которое обеспечивает удобный интерфейс для управления VPN-соединениями VLESS.
          </ImportantNote>

          <StepTitle>Настройка VPN на macOS через V2rayU</StepTitle>
          <StepsList>
            <li>Скачайте и установите <strong>V2rayU</strong> для macOS с <AppLink href="https://github.com/yanue/V2rayU/releases" target="_blank">GitHub</AppLink></li>
            <li>Откройте приложение V2rayU (при первом запуске могут потребоваться разрешения системы)</li>
            <li>В личном кабинете на нашем сайте скопируйте VLESS-ключ</li>
            <li>Нажмите на значок V2rayU в строке меню, затем выберите <strong>Import</strong> → <strong>Import from clipboard</strong></li>
            <li>После успешного импорта в меню появится новая конфигурация</li>
            <li>Выберите импортированную конфигурацию и нажмите <strong>Connect</strong></li>
            <li>При первом подключении система запросит разрешение на установку VPN-конфигурации. Введите пароль администратора macOS</li>
            <li>После успешного подключения, значок V2rayU в строке меню станет активным</li>
          </StepsList>
        </TabContent>
        
        <TabContent 
          active={activeTab === 'android'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ImportantNote>
            <strong>Важно:</strong> Для устройств Android вы можете использовать приложение V2rayNG, доступное в Google Play. Убедитесь, что у вас установлена последняя версия.
          </ImportantNote>

          <StepTitle>Настройка VPN на Android через V2rayNG</StepTitle>
          <StepsList>
            <li>Скачайте приложение <strong>V2rayNG</strong> из <AppLink href="https://play.google.com/store/apps/details?id=com.v2ray.ang" target="_blank">Google Play</AppLink></li>
            <li>Откройте приложение V2rayNG</li>
            <li>На главном экране нажмите на значок <strong>+</strong> (обычно в правом нижнем углу)</li>
            <li>Выберите метод импорта "<strong>Сканировать QR-код</strong>" или "<strong>Импорт конфигурации из буфера обмена</strong>"</li>
            <li>Отсканируйте QR-код вашего VPN-ключа или вставьте скопированный VLESS-ключ</li>
            <li>После успешного импорта будет добавлен новый профиль с именем "<strong>KittyPoopVPN_Trial</strong>"</li>
            <li>Выберите добавленный профиль, коснувшись его в списке (должен быть выделен)</li>
            <li>Нажмите кнопку <strong>V</strong> (обычно в правом нижнем углу) для подключения</li>
            <li>В первый раз потребуется разрешить создание VPN-соединения. Нажмите "<strong>OK</strong>" в появившемся диалоговом окне</li>
            <li>Когда VPN подключен, в верхней части экрана должен появиться значок VPN</li>
          </StepsList>
        </TabContent>
        
        <TabContent 
          active={activeTab === 'ios'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ImportantNote>
            <strong>Важно:</strong> Для iOS устройств вам потребуется приложение Shadowrocket или V2Box, доступные в App Store. Убедитесь, что у вас установлена последняя версия.
          </ImportantNote>

          <StepTitle>Настройка VPN на iPhone/iPad через Shadowrocket</StepTitle>
          <StepsList>
            <li>Скачайте приложение <strong>Shadowrocket</strong> из <AppLink href="https://apps.apple.com/us/app/shadowrocket/id932747118" target="_blank">App Store</AppLink></li>
            <li>Откройте приложение Shadowrocket</li>
            <li>На главном экране нажмите на кнопку <strong>+</strong> (обычно в правом верхнем углу)</li>
            <li>Выберите метод импорта "<strong>Сканировать QR-код</strong>" или вставьте скопированную ссылку в соответствующее поле</li>
            <li>Отсканируйте QR-код вашего VPN-ключа</li>
            <li>После успешного сканирования будет добавлен новый профиль с именем "<strong>KittyPoopVPN_Trial</strong>"</li>
            <li>Теперь выберите созданный профиль из списка</li>
            <li>Нажмите кнопку <strong>Подключить</strong> для установки соединения</li>
            <li>В первый раз потребуется разрешить доступ к VPN-конфигурации. Нажмите "<strong>Разрешить</strong>" в появившемся системном диалоговом окне</li>
            <li>Когда VPN подключен, в статус-баре появится значок VPN</li>
          </StepsList>
        </TabContent>
        
        <TabContent 
          active={activeTab === 'linux'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ImportantNote>
            <strong>Важно:</strong> В Linux есть несколько способов настройки v2ray, включая графические клиенты и командную строку. Мы рекомендуем официальный клиент v2ray-core.
          </ImportantNote>

          <StepTitle>Настройка VPN на Linux через v2ray-core</StepTitle>
          <StepsList>
            <li>Установите v2ray-core через терминал:
              <code>curl -O https://raw.githubusercontent.com/v2fly/fhs-install-v2ray/master/install-release.sh</code>
              <code>sudo bash install-release.sh</code>
            </li>
            <li>Создайте конфигурационный файл:
              <code>sudo nano /usr/local/etc/v2ray/config.json</code>
            </li>
            <li>В личном кабинете на нашем сайте скопируйте VLESS-ключ</li>
            <li>Преобразуйте VLESS-ключ в формат config.json (можно использовать онлайн-конвертеры или скопировать готовую конфигурацию из личного кабинета)</li>
            <li>Вставьте конфигурацию в файл config.json и сохраните его</li>
            <li>Запустите сервис v2ray:
              <code>sudo systemctl start v2ray</code>
            </li>
            <li>Проверьте статус:
              <code>sudo systemctl status v2ray</code>
            </li>
            <li>Для автозапуска при загрузке системы:
              <code>sudo systemctl enable v2ray</code>
            </li>
          </StepsList>
        </TabContent>
        
        <DownloadSection>
          <h3>Рекомендуемые приложения для VPN</h3>
          <ul>
            <li><AppLink href="https://github.com/2dust/v2rayN/releases" target="_blank">v2rayN для Windows</AppLink></li>
            <li><AppLink href="https://github.com/yanue/V2rayU/releases" target="_blank">V2rayU для macOS</AppLink></li>
            <li><AppLink href="https://play.google.com/store/apps/details?id=com.v2ray.ang" target="_blank">V2rayNG для Android</AppLink></li>
            <li><AppLink href="https://apps.apple.com/us/app/shadowrocket/id932747118" target="_blank">Shadowrocket для iOS</AppLink></li>
            <li><AppLink href="https://github.com/v2fly/v2ray-core/releases" target="_blank">v2ray-core для Linux</AppLink></li>
          </ul>
        </DownloadSection>
      </Content>
    </PageContainer>
  );
};

export default InstructionsPage; 