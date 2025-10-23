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
  rating: number;
  comments: string;
  experience: string;
  improvements: string;
}

const FeedbackPopup: React.FC<FeedbackPopupProps> = ({ isOpen, onClose, onSubmit, submitting }) => {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [experience, setExperience] = useState('');
  const [improvements, setImprovements] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    onSubmit({
      rating,
      comments,
      experience,
      improvements
    });
  };

  const handleClose = () => {
    setRating(0);
    setComments('');
    setExperience('');
    setImprovements('');
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
              How would you rate your overall experience? *
            </label>
            <div className={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`${styles.star} ${star <= rating ? styles.starActive : ''}`}
                  onClick={() => setRating(star)}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              What was your overall experience with the assessment?
            </label>
            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className={styles.textarea}
              placeholder="Tell us about your experience..."
              rows={3}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Any specific comments or suggestions?
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className={styles.textarea}
              placeholder="Share your thoughts..."
              rows={3}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              What could we improve?
            </label>
            <textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              className={styles.textarea}
              placeholder="Help us make it better..."
              rows={3}
            />
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
              disabled={submitting || rating === 0}
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
