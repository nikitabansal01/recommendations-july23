import React from 'react';
import styles from './CheckboxGroup.module.css';

interface CheckboxGroupProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  name: string;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options,
  selectedValues,
  onChange,
  name
}) => {
  const handleCheckboxChange = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    onChange(newValues);
  };

  return (
    <div className={styles.container}>
      {options.map((option, index) => (
        <label key={index} className={styles.checkboxOption}>
          <input
            type="checkbox"
            name={name}
            value={option}
            checked={selectedValues.includes(option)}
            onChange={() => handleCheckboxChange(option)}
          />
          <span className={styles.checkboxLabel}>{option}</span>
        </label>
      ))}
    </div>
  );
};

export default CheckboxGroup; 