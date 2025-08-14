"use client";
import React, { useState, useEffect } from 'react';
import { useChatbot } from '../lib/chatbot-context';
import { Recommendation } from '../types/ResearchData';
import styles from './TaskTracker.module.css';

interface TaskTrackerProps {
  recommendations: Recommendation[];
  category: 'food' | 'movement' | 'mindfulness';
}

const TaskTracker: React.FC<TaskTrackerProps> = ({ recommendations, category }) => {
  const { showChatbot } = useChatbot();
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [taskOrder, setTaskOrder] = useState<string[]>([]);

  // Initialize task order when recommendations change
  useEffect(() => {
    const newTaskOrder = recommendations.map(rec => rec.id);
    setTaskOrder(newTaskOrder);
  }, [recommendations]);

  // Check if all tasks are completed in order
  useEffect(() => {
    if (completedTasks.length === taskOrder.length && taskOrder.length > 0) {
      const completedInOrder = taskOrder.every((taskId, index) => 
        completedTasks[index] === taskId
      );
      
      if (completedInOrder) {
        // Trigger celebration flow
        setTimeout(() => {
          showChatbot('celebration');
        }, 1000); // Small delay for better UX
      }
    }
  }, [completedTasks, taskOrder, showChatbot]);

  const handleTaskToggle = (taskId: string) => {
    setCompletedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        // Add to completed tasks in order
        const newCompleted = [...prev];
        const taskIndex = taskOrder.indexOf(taskId);
        
        // Find the correct position to insert
        let insertIndex = 0;
        for (let i = 0; i < newCompleted.length; i++) {
          const completedTaskIndex = taskOrder.indexOf(newCompleted[i]);
          if (taskIndex > completedTaskIndex) {
            insertIndex = i + 1;
          }
        }
        
        newCompleted.splice(insertIndex, 0, taskId);
        return newCompleted;
      }
    });
  };

  const getTaskStatus = (taskId: string) => {
    if (completedTasks.includes(taskId)) {
      return 'completed';
    }
    return 'pending';
  };

  const getProgressPercentage = () => {
    if (taskOrder.length === 0) return 0;
    return (completedTasks.length / taskOrder.length) * 100;
  };

  return (
    <div className={styles.taskTracker}>
      <div className={styles.trackerHeader}>
        <h3 className={styles.trackerTitle}>
          {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)} Progress
        </h3>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
        <div className={styles.progressText}>
          {completedTasks.length} of {taskOrder.length} tasks completed
        </div>
      </div>
      
      <div className={styles.taskList}>
        {recommendations.map((recommendation, index) => (
          <div 
            key={recommendation.id}
            className={`${styles.taskItem} ${styles[getTaskStatus(recommendation.id)]}`}
          >
            <div className={styles.taskCheckbox}>
              <input
                type="checkbox"
                id={recommendation.id}
                checked={completedTasks.includes(recommendation.id)}
                onChange={() => handleTaskToggle(recommendation.id)}
                className={styles.checkbox}
              />
              <label htmlFor={recommendation.id} className={styles.checkboxLabel}>
                <span className={styles.taskNumber}>{index + 1}</span>
                <span className={styles.taskTitle}>{recommendation.title}</span>
              </label>
            </div>
            
            {getTaskStatus(recommendation.id) === 'completed' && (
              <div className={styles.completionBadge}>
                ✓ Completed
              </div>
            )}
          </div>
        ))}
      </div>
      
      {completedTasks.length > 0 && (
        <div className={styles.completionSummary}>
          <div className={styles.summaryText}>
            Great progress! You've completed {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} today.
          </div>
          {completedTasks.length === taskOrder.length && (
            <div className={styles.celebrationText}>
              🎉 All tasks completed! Amazing job!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'food': return '🍽️';
    case 'movement': return '🏃‍♀️';
    case 'mindfulness': return '🧘‍♀️';
    default: return '💡';
  }
};

export default TaskTracker; 