"use client";
import React, { useState } from 'react';
import styles from './FeedbackPopup.module.css';

interface FeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => void;
  submitting: boolean;
}

export interface FeedbackData {
  understanding: string;        // Yes, Kind of, Not really
  helpfulPart: string;          // What part felt most helpful
  unclearPart: string;          // What was unclear/confusing
  wouldShare: string;           // Yes, Maybe, No
}

const FeedbackPopup: React.FC<FeedbackPopupProps> = ({ isOpen, onClose, onSubmit, submitting }) => {
  const [understanding, setUnderstanding] = useState('');
  const [helpfulPart, setHelpfulPart] = useState('');
  const [unclearPart, setUnclearPart] = useState('');
  const [wouldShare, setWouldShare] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!understanding) {
      alert('Please answer the first question');
      return;
    }
    onSubmit({
      understanding,
      helpfulPart,
      unclearPart,
      wouldShare
    });
  };

  const handleClose = () => {
    setUnderstanding('');
    setHelpfulPart('');
    setUnclearPart('');
    setWouldShare('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <h2 className={styles.title}>Share Your Feedback</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>
              Did this help you understand what might be going on in your body? *
            </label>
            <div className={styles.radioGroup}>
              {['Yes', 'Kind of', 'Not really'].map((option) => (
                <label key={option} className={styles.radioOption}>
                  <input
                    type="radio"
                    name="understanding"
                    value={option}
                    checked={understanding === option}
                    onChange={(e) => setUnderstanding(e.target.value)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioLabel}>{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              What part felt most helpful or accurate? (Optional)
            </label>
            <textarea
              value={helpfulPart}
              onChange={(e) => setHelpfulPart(e.target.value)}
              className={styles.textarea}
              placeholder="Something that stood out, felt true, or made you think…"
              rows={3}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Was anything unclear, confusing, or hard to trust? (Optional)
            </label>
            <textarea
              value={unclearPart}
              onChange={(e) => setUnclearPart(e.target.value)}
              className={styles.textarea}
              placeholder="We want to earn your trust — what didn't sit right?"
              rows={3}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Would you share this with a friend going through something similar?
            </label>
            <div className={styles.radioGroup}>
              {['Yes', 'Maybe', 'No'].map((option) => (
                <label key={option} className={styles.radioOption}>
                  <input
                    type="radio"
                    name="wouldShare"
                    value={option}
                    checked={wouldShare === option}
                    onChange={(e) => setWouldShare(e.target.value)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioLabel}>{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleClose}
              disabled={submitting}
            >
              Maybe Later
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting || !understanding}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackPopup;
