import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  /* :root {
    --primary-color: #ff66c4;
    --secondary-color: #8a64ff;
    --accent-color: #7f66ff;
    --background-dark: #111827;
    --background-light: #1a202c;
    --text-color: #FFFFFF;
    --text-secondary: rgba(255, 255, 255, 0.7);
    --error-color: #ff5555;
    --success-color: #4ade80;
    --card-background: rgba(26, 32, 44, 0.7);
    --tg-color: #229ED9;
  } */

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    /* background-color: var(--background-dark); */
    color: var(--text-color);
    line-height: 1.5;
    overflow-x: hidden;
    min-height: 100vh;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Montserrat', sans-serif;
    font-weight: 700;
  }

  a {
    color: var(--accent-color);
    text-decoration: none;
  }

  button, input, select, textarea {
    font-family: 'Montserrat', sans-serif;
  }
  
  /* Стили для загрузочного спиннера */
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: var(--primary-color);
    animation: spin 1s ease-in-out infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Toast стили для оповещений */
  .Toastify__toast {
    background-color: var(--background-light) !important;
    color: var(--text-color) !important;
    border-radius: 8px !important;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
  }
  
  .Toastify__toast--success {
    border-left: 4px solid var(--success-color) !important;
  }
  
  .Toastify__toast--error {
    border-left: 4px solid var(--error-color) !important;
  }
  
  .Toastify__progress-bar {
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color)) !important;
  }
`;

export default GlobalStyle; 