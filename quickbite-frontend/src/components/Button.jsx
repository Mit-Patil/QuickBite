import styles from './Button.module.css';

function Button({children, loading = false, loadingText = 'Loading...', type = 'submit'}){
    return (
        <button type={type} disabled={loading} className={styles.button}>
            {loading ? loadingText : children}
        </button>
    );
}

export default Button;