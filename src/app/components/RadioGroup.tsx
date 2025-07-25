import React from 'react';
import styles from './RadioGroup.module.css';

interface RadioGroupProps {
  options: string[];
  selectedValue: string;
  onChange: (value: string) => void;
  name: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  selectedValue,
  onChange,
  name
}) => {
  return (
    <div className={styles.container}>
      {options.map((option, index) => (
        <label key={index} className={styles.radioOption}>
          <input
            type="radio"
            name={name}
            value={option}
            checked={selectedValue === option}
            onChange={(e) => onChange(e.target.value)}
          />
          <span className={styles.radioLabel}>{option}</span>
        </label>
      ))}
    </div>
  );
};

export default RadioGroup; 