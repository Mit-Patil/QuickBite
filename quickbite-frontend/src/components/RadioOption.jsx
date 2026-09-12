import styles from './RadioOption.module.css';

function RadioOption({ label, name, value, checked, onChange }) {
  return (
    <label className={styles.wrapper}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

export default RadioOption;