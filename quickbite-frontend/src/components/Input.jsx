import styles from './Input.module.css';

function Input({label, type = 'text', value, onChange, required=false, name}){
    return (
        <div className={styles.field}>
            <label htmlFor={name} className={styles.label}>
                {label}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                className={styles.input}
            />    
        </div>
    );
}

export default Input;