import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { FaApple, FaAndroid, FaWindows, FaLinux } from 'react-icons/fa';

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
  padding: 80px 20px 40px;
  background: radial-gradient(circle at center, #1a1a2e 0%, #0f0f14 80%);
  position: relative;
  overflow: hidden;
`;

const HeroTitle = styled(motion.h1)`
  font-size: 3.5rem;
  margin-bottom: 20px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 1.2rem;
  color: var(--text-secondary);
  max-width: 700px;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const ContentSection = styled.section`
  max-width: 900px;
  margin: 0 auto;
  padding: 60px 20px;
`;

const SectionTitle = styled.h2`
  font-size: 2.2rem;
  margin-bottom: 40px;
  text-align: center;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const FaqContainer = styled.div`
  margin-bottom: 60px;
`;

const FaqItem = styled.div`
  background-color: var(--card-background);
  border-radius: 16px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const FaqQuestion = styled.div`
  padding: 20px 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 18px;
  transition: all 0.3s ease;
  color: var(--text-color);
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const FaqAnswer = styled(motion.div)`
  padding: 0;
  height: 0;
  overflow: hidden;
`;

const FaqAnswerContent = styled.div`
  padding: 0 25px 20px;
  color: var(--text-secondary);
  line-height: 1.6;
`;

const StepTitle = styled.h3`
  font-size: 1.2rem;
  margin: 20px 0 10px;
  color: var(--text-color);
`;

const StepsList = styled.ol`
  counter-reset: steps;
  list-style-type: none;
  padding-left: 0;
  margin-top: 20px;
  
  & li {
    position: relative;
    padding-left: 35px;
    margin-bottom: 15px;
    line-height: 1.6;
    
    &:before {
      counter-increment: steps;
      content: counter(steps);
      position: absolute;
      left: 0;
      top: -2px;
      width: 25px;
      height: 25px;
      background: var(--primary-color);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }
  }
  
  & code {
    display: block;
    background: rgba(0, 0, 0, 0.3);
    padding: 12px;
    margin: 10px 0;
    border-radius: 5px;
    border-left: 3px solid var(--primary-color);
    font-family: "Courier New", monospace;
    overflow-x: auto;
    color: #e4e4e4;
  }
  
  & pre {
    background: rgba(0, 0, 0, 0.3);
    padding: 15px;
    margin: 10px 0;
    border-radius: 5px;
    border-left: 3px solid var(--primary-color);
    font-family: "Courier New", monospace;
    overflow-x: auto;
    white-space: pre-wrap;
    color: #e4e4e4;
    line-height: 1.4;
  }
`;

const UnorderedList = styled.ul`
  padding-left: 20px;
  margin-top: 10px;
  list-style-type: none;
  
  & li {
    position: relative;
    padding-left: 25px;
    margin-bottom: 10px;
    line-height: 1.6;
    
    &:before {
      content: "•";
      position: absolute;
      left: 0;
      top: 0;
      color: var(--primary-color);
      font-size: 18px;
    }
  }
  
  & code {
    background: rgba(0, 0, 0, 0.3);
    padding: 3px 6px;
    border-radius: 3px;
    font-family: "Courier New", monospace;
    font-size: 0.9em;
    color: #e4e4e4;
  }
`;

// Компонент закомментирован, так как не используется
// const CodeBlock = styled.div`
//   background-color: rgba(0, 0, 0, 0.3);
//   padding: 15px;
//   border-radius: 8px;
//   margin: 15px 0;
//   font-family: 'Courier New', monospace;
//   overflow-x: auto;
//   white-space: pre;
//   
//   code {
//     color: var(--text-secondary);
//   }
// `;

const ImportantNote = styled.div`
  border-left: 4px solid var(--primary-color);
  padding: 15px;
  background-color: rgba(140, 82, 255, 0.1);
  margin: 20px 0;
  border-radius: 4px;
`;

const TabSelector = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
`;

const Tab = styled.button`
  padding: 12px 25px;
  background-color: ${props => props.active ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.07)'};
  color: ${props => props.active ? 'white' : 'var(--text-secondary)'};
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  margin: 0 10px;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${props => props.active ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const TabContent = styled.div`
  display: ${props => props.active ? 'block' : 'none'};
`;

// Компонент закомментирован, так как не используется
// const ImageContainer = styled.div`
//   margin: 20px 0;
//   text-align: center;
//   
//   img {
//     max-width: 100%;
//     border-radius: 8px;
//     box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
//   }
// `;

const DownloadButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

const DownloadButton = styled.a`
  padding: 12px 25px;
  background-color: ${props => props.active ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.07)'};
  color: ${props => props.active ? 'white' : 'var(--text-secondary)'};
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  margin: 0 10px;
  transition: all 0.3s ease;
  text-decoration: none;
  
  &:hover {
    background-color: ${props => props.active ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const FAQPage = () => {
  const [activeTab, setActiveTab] = useState('ios'); // ios или android
  const [openIndex, setOpenIndex] = useState(0);

  const handleToggle = (index) => {
    if (openIndex === index) {
      setOpenIndex(null);
    } else {
      setOpenIndex(index);
    }
  };

  return (
    <PageContainer>
      <HeroSection>
        <HeroTitle
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Вопросы и ответы
        </HeroTitle>
        
        <HeroSubtitle
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Здесь вы найдете подробные инструкции по настройке VPN и ответы на часто задаваемые вопросы
        </HeroSubtitle>
      </HeroSection>

      <ContentSection>
        <SectionTitle>Как настроить VPN на вашем устройстве</SectionTitle>
        
        <TabSelector>
          <Tab 
            active={activeTab === 'ios'} 
            onClick={() => setActiveTab('ios')}
          >
            iOS (iPhone/iPad)
          </Tab>
          <Tab 
            active={activeTab === 'android'} 
            onClick={() => setActiveTab('android')}
          >
            Android
          </Tab>
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
            active={activeTab === 'linux'} 
            onClick={() => setActiveTab('linux')}
          >
            Linux
          </Tab>
        </TabSelector>

        <DownloadButtonsContainer>
          <DownloadButton 
            href="https://apps.apple.com/us/app/v2raytun/id1501776752" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FaApple /> Скачать V2rayTUN для iOS
          </DownloadButton>
          <DownloadButton 
            href="https://play.google.com/store/apps/details?id=com.v2ray.ang" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FaAndroid /> Скачать V2rayNG для Android
          </DownloadButton>
          <DownloadButton 
            href="https://github.com/2dust/v2rayN/releases" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FaWindows /> Скачать v2rayN для Windows
          </DownloadButton>
          <DownloadButton 
            href="https://github.com/yanue/V2rayU/releases" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FaApple /> Скачать V2rayU для macOS
          </DownloadButton>
          <DownloadButton 
            href="https://github.com/v2fly/v2ray-core" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FaLinux /> Скачать v2ray для Linux
          </DownloadButton>
        </DownloadButtonsContainer>

        <TabContent active={activeTab === 'ios'}>
          <ImportantNote>
            <strong>Важно:</strong> Для iOS устройств вам потребуется приложение V2rayTUN, доступное в App Store. Убедитесь, что у вас установлена последняя версия.
          </ImportantNote>

          <StepTitle>Настройка VPN на iPhone/iPad через V2rayTUN</StepTitle>
          <StepsList>
            <li>Скачайте приложение <strong>V2rayTUN</strong> из App Store</li>
            <li>Откройте приложение V2rayTUN</li>
            <li>На главном экране нажмите на кнопку <strong>+</strong> (обычно в правом верхнем углу)</li>
            <li>Выберите метод импорта "<strong>Сканировать QR-код</strong>"</li>
            <li>Отсканируйте QR-код вашего VPN-ключа</li>
            <li>После успешного сканирования будет добавлен новый профиль с именем "<strong>KittyPoopVPN_Trial</strong>"</li>
            <li>Теперь выберите созданный профиль из списка</li>
            <li>Нажмите кнопку <strong>Подключить</strong> для установки соединения</li>
            <li>В первый раз потребуется разрешить доступ к VPN-конфигурации. Нажмите "<strong>Разрешить</strong>" в появившемся системном диалоговом окне</li>
            <li>Когда VPN подключен, в статус-баре появится значок VPN</li>
          </StepsList>

          <ImportantNote>
            <strong>Альтернативный способ:</strong> Если сканирование QR-кода не работает, можно добавить профиль вручную, скопировав ваш VLESS-ключ и выбрав опцию "<strong>Импортировать из буфера обмена</strong>".
          </ImportantNote>

          <StepTitle>Решение возможных проблем на iOS</StepTitle>
          <UnorderedList>
            <li><strong>VPN не подключается:</strong> Убедитесь, что у вас достаточно заряда батареи и стабильное подключение к интернету. Иногда перезапуск приложения или устройства может решить проблему.</li>
            <li><strong>Ошибка импорта конфигурации:</strong> Убедитесь, что вы используете правильный формат VLESS-ключа или попробуйте скопировать ключ заново.</li>
            <li><strong>Медленное соединение:</strong> Попробуйте переключиться между мобильными данными и Wi-Fi для достижения оптимальной скорости.</li>
          </UnorderedList>
        </TabContent>

        <TabContent active={activeTab === 'android'}>
          <ImportantNote>
            <strong>Важно:</strong> Для устройств Android вы можете использовать приложение V2rayNG, доступное в Google Play. Убедитесь, что у вас установлена последняя версия.
          </ImportantNote>

          <StepTitle>Настройка VPN на Android через V2rayNG</StepTitle>
          <StepsList>
            <li>Скачайте приложение <strong>V2rayNG</strong> из Google Play</li>
            <li>Откройте приложение V2rayNG</li>
            <li>На главном экране нажмите на значок <strong>+</strong> (обычно в правом нижнем углу)</li>
            <li>Выберите метод импорта "<strong>Сканировать QR-код</strong>" или "<strong>Импорт конфигурации из буфера обмена</strong>"</li>
            <li>Отсканируйте QR-код вашего VPN-ключа или вставьте скопированный VLESS-ключ</li>
            <li>После успешного импорта будет добавлен новый профиль с именем "<strong>KittyPoopVPN_Trial</strong>"</li>
            <li>Выберите добавленный профиль, коснувшись его в списке (должен быть выделен)</li>
            <li>Нажмите кнопку <strong>V</strong> (обычно в правом нижнем углу) для подключения</li>
            <li>В первый раз потребуется разрешить создание VPN-соединения. Нажмите "<strong>OK</strong>" в появившемся диалоговом окне</li>
            <li>Когда VPN подключен, в статус-баре появится значок ключа</li>
          </StepsList>

          <ImportantNote>
            <strong>Проверка работы:</strong> После подключения можно проверить работу VPN, посетив сайт типа ipleak.net. Он должен показывать IP-адрес нашего сервера, а не ваш реальный IP.
          </ImportantNote>

          <StepTitle>Решение возможных проблем на Android</StepTitle>
          <UnorderedList>
            <li><strong>Ошибка подключения:</strong> Убедитесь, что у вас стабильное интернет-соединение. Попробуйте перезапустить приложение.</li>
            <li><strong>Приложение вылетает:</strong> Обновите приложение до последней версии или переустановите его.</li>
            <li><strong>Ошибка импорта:</strong> Убедитесь, что VLESS-ключ скопирован полностью, включая префикс "vless://".</li>
            <li><strong>Разрядка батареи:</strong> В настройках приложения можете включить режим энергосбережения, но это может немного снизить скорость подключения.</li>
          </UnorderedList>
        </TabContent>
        
        <TabContent active={activeTab === 'windows'}>
          <ImportantNote>
            <strong>Важно:</strong> Для устройств Windows рекомендуется использовать клиент v2rayN, который обеспечивает наилучшую совместимость и производительность с нашим сервисом.
          </ImportantNote>

          <StepTitle>Настройка VPN на Windows через v2rayN</StepTitle>
          <StepsList>
            <li>Скачайте и установите клиент <strong>v2rayN</strong> с GitHub (ссылка на скачивание выше)</li>
            <li>Распакуйте архив и запустите приложение v2rayN.exe</li>
            <li>В личном кабинете на нашем сайте скопируйте VLESS-ключ или скачайте QR-код</li>
            <li>В клиенте v2rayN нажмите на кнопку <strong>Добавить</strong> ➔ <strong>Добавить VLESS сервер</strong> или используйте опцию <strong>Сканировать QR-код</strong></li>
            <li>Если вы выбрали ручное добавление, введите параметры сервера из полученной конфигурации</li>
            <li>Сохраните конфигурацию и выберите её в списке</li>
            <li>Нажмите правой кнопкой на добавленную конфигурацию и выберите <strong>Установить как активный сервер</strong></li>
            <li>Проверьте, что в системном трее появился значок v2rayN</li>
            <li>Нажмите на значок и выберите <strong>Включить V2Ray</strong></li>
          </StepsList>

          <ImportantNote>
            <strong>Примечание:</strong> Если у вас Windows 10/11, может потребоваться запустить клиент v2rayN от имени администратора (правый клик по значку приложения → Запуск от имени администратора).
          </ImportantNote>

          <StepTitle>Решение возможных проблем на Windows</StepTitle>
          <UnorderedList>
            <li><strong>Ошибка доступа:</strong> Убедитесь, что вы запускаете приложение с правами администратора.</li>
            <li><strong>Ошибка при импорте конфигурации:</strong> Проверьте правильность формата VLESS-ключа.</li>
            <li><strong>Программа не запускается:</strong> Убедитесь, что у вас установлен .NET Framework 4.6 или выше.</li>
            <li><strong>Соединение не устанавливается:</strong> Проверьте, не блокирует ли ваш брандмауэр или антивирус соединение.</li>
          </UnorderedList>
        </TabContent>

        <TabContent active={activeTab === 'macos'}>
          <ImportantNote>
            <strong>Важно:</strong> Для устройств macOS рекомендуется использовать приложение V2rayU, которое обеспечивает удобный интерфейс для управления VPN-соединениями VLESS.
          </ImportantNote>

          <StepTitle>Настройка VPN на macOS через V2rayU</StepTitle>
          <StepsList>
            <li>Скачайте и установите <strong>V2rayU</strong> для macOS с GitHub (ссылка выше)</li>
            <li>Откройте приложение V2rayU (при первом запуске могут потребоваться разрешения системы)</li>
            <li>В личном кабинете на нашем сайте скопируйте VLESS-ключ</li>
            <li>Нажмите на значок V2rayU в строке меню, затем выберите <strong>Import</strong> → <strong>Import from clipboard</strong></li>
            <li>После успешного импорта в меню появится новая конфигурация</li>
            <li>Выберите импортированную конфигурацию и нажмите <strong>Connect</strong></li>
            <li>При первом подключении система запросит разрешение на установку VPN-конфигурации. Введите пароль администратора macOS</li>
            <li>После успешного подключения, значок V2rayU в строке меню станет активным</li>
          </StepsList>

          <ImportantNote>
            <strong>Альтернативный способ:</strong> Вы также можете использовать командную строку v2ray-core или другие клиенты, совместимые с протоколом VLESS, например Qv2ray.
          </ImportantNote>

          <StepTitle>Решение возможных проблем на macOS</StepTitle>
          <UnorderedList>
            <li><strong>Ошибка разрешений:</strong> Убедитесь, что вы предоставили приложению необходимые разрешения в Системных настройках.</li>
            <li><strong>Приложение блокируется:</strong> Если macOS блокирует запуск приложения, перейдите в Системные настройки → Безопасность и конфиденциальность, и разрешите запуск.</li>
            <li><strong>Ошибка импорта:</strong> Убедитесь, что вы скопировали полный VLESS-ключ, включая префикс "vless://".</li>
          </UnorderedList>
        </TabContent>

        <TabContent active={activeTab === 'linux'}>
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

          <ImportantNote>
            <strong>Графический клиент:</strong> Если вы предпочитаете графический интерфейс, вы можете использовать Qv2ray или другие GUI-клиенты для v2ray, совместимые с Linux.
          </ImportantNote>

          <StepTitle>Пример конфигурационного файла</StepTitle>
          <StepsList>
            <li>Базовая структура config.json:
              <pre>
{`{
  "inbounds": [],
  "outbounds": [
    {
      "protocol": "vless",
      "settings": {
        "vnext": [
          {
            "address": "ваш_сервер.kittypoopvpn.com",
            "port": 443,
            "users": [
              {
                "id": "ваш_уникальный_id",
                "encryption": "none"
              }
            ]
          }
        ]
      },
      "streamSettings": {
        "network": "tcp",
        "security": "tls"
      },
      "tag": "proxy"
    }
  ],
  "routing": {
    "rules": []
  }
}`}
              </pre>
            </li>
          </StepsList>

          <StepTitle>Решение возможных проблем на Linux</StepTitle>
          <UnorderedList>
            <li><strong>Ошибка прав доступа:</strong> Убедитесь, что вы запускаете команды с правами sudo.</li>
            <li><strong>Конфликт маршрутизации:</strong> Проверьте, нет ли конфликтов с существующими сетевыми маршрутами командой <code>ip route</code>.</li>
            <li><strong>Ошибка конфигурации:</strong> Проверьте правильность файла config.json командой <code>v2ray test -config /usr/local/etc/v2ray/config.json</code>.</li>
            <li><strong>Логи с ошибками:</strong> Проверьте логи для диагностики проблем <code>sudo journalctl -u v2ray</code>.</li>
          </UnorderedList>
        </TabContent>
        
        <SectionTitle>Часто задаваемые вопросы</SectionTitle>
        
        <FaqContainer>
          <FaqItem>
            <FaqQuestion onClick={() => handleToggle(0)}>
              Что такое VLESS-ключ и как он работает?
              {openIndex === 0 ? <FiMinus /> : <FiPlus />}
            </FaqQuestion>
            <FaqAnswer
              animate={{
                height: openIndex === 0 ? 'auto' : 0,
                opacity: openIndex === 0 ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <FaqAnswerContent>
                <p>VLESS - это современный протокол для VPN-соединений, обеспечивающий высокую скорость, надежное шифрование и эффективный обход блокировок. В отличие от традиционных VPN-протоколов, VLESS оптимизирован для работы в условиях с серьезными ограничениями доступа к интернет-ресурсам.</p>
                <p>VLESS-ключ представляет собой длинную строку, начинающуюся с "vless://", содержащую зашифрованную информацию о подключении: IP-адрес сервера, порт, уникальный идентификатор пользователя, методы шифрования и другие специальные параметры. Когда вы добавляете этот ключ в приложение V2rayTUN (для iOS) или V2rayNG (для Android), оно автоматически настраивает соединение согласно указанным параметрам.</p>
                <p>Наши VLESS-ключи используют современные методы маскировки трафика и шифрования TLS, что делает соединение максимально защищенным и трудным для обнаружения системами мониторинга.</p>
              </FaqAnswerContent>
            </FaqAnswer>
          </FaqItem>
          
          <FaqItem>
            <FaqQuestion onClick={() => handleToggle(1)}>
              Как долго действует пробный ключ?
              {openIndex === 1 ? <FiMinus /> : <FiPlus />}
            </FaqQuestion>
            <FaqAnswer
              animate={{
                height: openIndex === 1 ? 'auto' : 0,
                opacity: openIndex === 1 ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <FaqAnswerContent>
                <p>Пробный VLESS-ключ действует ровно 1 час с момента генерации. После истечения этого времени доступ автоматически прекращается. Вы можете следить за оставшимся временем в таймере, который отображается после генерации ключа.</p>
                <p>Если вам понравился наш сервис, вы можете приобрести полный доступ в разделе "Тарифы", где представлены различные планы подписки с неограниченным трафиком и длительными сроками действия.</p>
              </FaqAnswerContent>
            </FaqAnswer>
          </FaqItem>
          
          <FaqItem>
            <FaqQuestion onClick={() => handleToggle(2)}>
              Безопасно ли использовать Kitty Poop VPN?
              {openIndex === 2 ? <FiMinus /> : <FiPlus />}
            </FaqQuestion>
            <FaqAnswer
              animate={{
                height: openIndex === 2 ? 'auto' : 0,
                opacity: openIndex === 2 ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <FaqAnswerContent>
                <p>Да, Kitty Poop VPN обеспечивает высокий уровень безопасности и приватности. Мы используем современный протокол VLESS с шифрованием TLS для защиты ваших данных, что делает соединение не только быстрым, но и надежно защищенным.</p>
                <p>Наша политика конфиденциальности гарантирует, что мы не храним логи вашей активности, что обеспечивает полную анонимность при использовании нашего сервиса.</p>
                <p>Кроме того, наша инфраструктура регулярно проходит аудит безопасности для поддержания высокого уровня защиты.</p>
              </FaqAnswerContent>
            </FaqAnswer>
          </FaqItem>
          
          <FaqItem>
            <FaqQuestion onClick={() => handleToggle(3)}>
              Почему не работает VPN после подключения?
              {openIndex === 3 ? <FiMinus /> : <FiPlus />}
            </FaqQuestion>
            <FaqAnswer
              animate={{
                height: openIndex === 3 ? 'auto' : 0,
                opacity: openIndex === 3 ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <FaqAnswerContent>
                <p>Если ваше VPN-соединение не работает после успешного подключения, проверьте следующее:</p>
                <UnorderedList>
                  <li><strong>Срок действия ключа:</strong> Пробный ключ действует только 1 час. Убедитесь, что время не истекло.</li>
                  <li><strong>Подключение к интернету:</strong> Проверьте, есть ли у вас доступ к интернету без VPN.</li>
                  <li><strong>Правильность VLESS-ключа:</strong> Убедитесь, что вы скопировали полный ключ, включая префикс "vless://".</li>
                  <li><strong>Настройки приложения:</strong> В V2rayTUN или V2rayNG проверьте, активирован ли режим маршрутизации "Глобальный" или "Все трафик".</li>
                  <li><strong>Сетевые ограничения:</strong> В некоторых сетях (например, корпоративных) может быть заблокирован VPN-трафик.</li>
                </UnorderedList>
                <p>Если проблема не решается, попробуйте перезапустить приложение или создать новый пробный ключ.</p>
              </FaqAnswerContent>
            </FaqAnswer>
          </FaqItem>
          
          <FaqItem>
            <FaqQuestion onClick={() => handleToggle(4)}>
              Какую скорость соединения я могу ожидать?
              {openIndex === 4 ? <FiMinus /> : <FiPlus />}
            </FaqQuestion>
            <FaqAnswer
              animate={{
                height: openIndex === 4 ? 'auto' : 0,
                opacity: openIndex === 4 ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <FaqAnswerContent>
                <p>Kitty Poop VPN обеспечивает высокую скорость соединения благодаря нашей оптимизированной инфраструктуре и современному протоколу VLESS. VLESS более эффективен, чем традиционные протоколы VPN, что даёт следующие преимущества:</p>
                <UnorderedList>
                  <li>Меньшая задержка при установке соединения</li>
                  <li>Более высокая пропускная способность</li>
                  <li>Меньшие накладные расходы на шифрование</li>
                  <li>Лучшая работа в условиях нестабильного соединения</li>
                </UnorderedList>
                <p>В среднем, вы можете ожидать около 85-95% от вашей обычной скорости интернета при использовании нашего сервиса. Пробный ключ предоставляет тот же уровень производительности, что и премиум-подписки.</p>
              </FaqAnswerContent>
            </FaqAnswer>
          </FaqItem>
        </FaqContainer>
      </ContentSection>
    </PageContainer>
  );
};

export default FAQPage; 