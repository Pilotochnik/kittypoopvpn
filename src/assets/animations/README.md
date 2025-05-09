# Анимации для VPN-сервиса

В этой папке хранятся анимации, используемые на сайте VPN-сервиса.

## Файлы анимаций:

- `earth-night-1918_256.gif` - анимация вращающейся планеты для главной страницы
- `planet-animation.gif` - заглушка (не используется)
- ... (добавьте другие анимации по мере необходимости)

## Рекомендации по анимациям:

1. Оптимизируйте размер файлов анимаций для быстрой загрузки
2. Предпочтительно использовать анимации с прозрачным фоном (PNG или GIF с прозрачностью)
3. Для сложных анимаций лучше использовать Lottie или встраивать SVG-анимации
4. Старайтесь делать размер файлов не более 500KB

## Импорт анимаций в компоненты:

```jsx
import animationName from '../assets/animations/animation-file.gif';

// Использование в компоненте
<img src={animationName} alt="Animation description" />
``` 