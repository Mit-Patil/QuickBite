import styles from './ErrorMessage.module.css';

function ErrorMessage({message, className = ''}){
    if(!message) return null;

    return <p className={`${styles.error} ${className}`}>{message}</p>;
    
}

export default ErrorMessage;