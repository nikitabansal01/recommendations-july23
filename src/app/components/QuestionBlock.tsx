import React from 'react';
import styles from './QuestionBlock.module.css';

interface QuestionBlockProps {
  question: string;
  children: React.ReactNode;
  questionNumber?: number;
  totalQuestions?: number;
}

const QuestionBlock: React.FC<QuestionBlockProps> = ({
  question,
  children,
  questionNumber,
  totalQuestions
}) => {
  return (
    <div className={styles.container}>
      {questionNumber && totalQuestions && (
        <div className={styles.questionCounter}>
          Question {questionNumber} of {totalQuestions}
        </div>
      )}
      <h2 className={styles.question}>{question}</h2>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default QuestionBlock; 