import styles from './Select.module.css';

function Select({label, name, value, onChange, options, required = false, className = ''}){

    return (
        <div className={styles.field}>
            <label htmlFor={name} className={styles.label}>
                {label}
            </label>
            <select id={name} name={name} value={value} onChange={onChange} required={required} className={`${styles.select} ${className}`}>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default Select;

