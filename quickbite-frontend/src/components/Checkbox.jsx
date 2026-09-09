import styles from './Checkbox.module.css';

function Checkbox({ label, name, checked, onChange, className = '' }) {
  return (
    <label htmlFor={name} className={`${styles.wrapper} ${className}`}>
      <input type="checkbox" id={name} name={name} checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

export default Checkbox;