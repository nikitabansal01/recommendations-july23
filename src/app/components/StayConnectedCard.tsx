import React from 'react';
import styles from './StayConnectedCard.module.css';

const StayConnectedCard: React.FC = () => {
  const socialLinks = [
    {
      name: 'Follow us on Instagram',
      href: 'https://www.instagram.com/myauvra/',
      icon: '📸',
      color: 'hover:border-pink-300 hover:bg-pink-50'
    },
    {
      name: 'Connect with us on LinkedIn',
      href: 'https://www.linkedin.com/company/hormone-insight/',
      icon: '💼',
      color: 'hover:border-blue-300 hover:bg-blue-50'
    },
    {
      name: 'Share Your Feedback',
      href: 'mailto:nbansal@hormoneinsight.ai',
      icon: '✉️',
      color: 'hover:border-green-300 hover:bg-green-50'
    }
  ];

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Stay Connected</h3>
      </div>

      {/* Social Links */}
      <div className={styles.socialLinks}>
        {socialLinks.map((link, index) => (
          <a
            key={index}
            href={link.href}
            target={link.href.startsWith('mailto:') ? '_self' : '_blank'}
            rel={link.href.startsWith('mailto:') ? '' : 'noopener noreferrer'}
            className={`${styles.socialLink} ${
              link.name.includes('Instagram') ? styles.instagram :
              link.name.includes('LinkedIn') ? styles.linkedin :
              styles.email
            }`}
          >
            <span className={styles.socialIcon}>{link.icon}</span>
            <span className={styles.socialText}>{link.name}</span>
            <span className={styles.socialTextShort}>{link.name.split(' ')[0]}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default StayConnectedCard;
