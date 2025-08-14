"use client";
import React from 'react';
import { useChatbot } from '../lib/chatbot-context';
import styles from './FloatingChatbotButton.module.css';

const FloatingChatbotButton: React.FC = () => {
  const { showChatbot, state } = useChatbot();

  const handleClick = () => {
    if (!state.isVisible) {
      showChatbot('feedback');
    }
  };

  return (
    <div className={styles.floatingButton} onClick={handleClick}>
      {/* Replace this with your company logo */}
      <div className={styles.logoContainer}>
        {/* Company logo */}
        <img 
          src="/Auvra.svg" 
          alt="Auvra Logo" 
          className={styles.companyLogo}
          onError={(e) => {
            // Fallback to text if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove(styles.hidden);
          }}
        />
        <div className={`${styles.logoText} ${styles.hidden}`}>
          Auvra
        </div>
      </div>
      
      {/* Notification dot if chatbot is not visible */}
      {!state.isVisible && (
        <div className={styles.notificationDot}></div>
      )}
      
      {/* Tooltip */}
      <div className={styles.tooltip}>
        Click to chat with your personal hormone guide! 💬
      </div>
    </div>
  );
};

export default FloatingChatbotButton; 