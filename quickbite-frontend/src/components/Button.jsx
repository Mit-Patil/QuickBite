import styles from './Button.module.css';

function Button({children, loading = false, loadingText = 'Loading...', type = 'submit', className = '', onClick }){
    return (
        <button type={type} disabled={loading} onClick={onClick} className={`${styles.button} ${className}`}>
            {loading ? loadingText : children}
        </button>
    );
}

export default Button;