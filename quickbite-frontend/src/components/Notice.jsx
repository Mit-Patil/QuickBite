import styles from './Notice.module.css';

const ICONS = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅',
};

function Notice({ children, variant = 'info', className = '' }) {
    return (
        <p className={`${styles.notice} ${styles[variant]} ${className}`}>
            <span aria-hidden="true">{ICONS[variant]}</span>
            {children}
        </p>
    );
}

export default Notice;