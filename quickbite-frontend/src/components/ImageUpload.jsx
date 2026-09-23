import { useId, useState } from 'react';
import Button from './Button';
import ErrorMessage from './ErrorMessage';
import styles from './ImageUpload.module.css';

function ImageUpload({ currentImageUrl, uploadFn, onUploaded, variant = 'default', className = '' }) {
  const [preview, setPreview] = useState(currentImageUrl || null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputId = useId();

  function handleFileSelect(e) {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleUpload() {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const response = await uploadFn(file);
      onUploaded(response.data);
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  const variantClass = variant === 'inline' ? styles.inline : variant === 'stacked' ? styles.stacked : '';

  return (
    <div className={`${styles.wrapper} ${variantClass} ${className}`}>
      {preview && <img src={preview} alt="Preview" className={styles.preview} />}
      <div className={styles.fileRow}>
        <ErrorMessage message={error} />
        {variant === 'stacked' ? (
          <label htmlFor={inputId} className={styles.fileLabel}>
            {file ? file.name : 'Change photo'}
          </label>
        ) : null}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
        />
        {file && (
          <Button type="button" loading={uploading} loadingText="Uploading..." onClick={handleUpload}>
            Upload
          </Button>
        )}
      </div>
    </div>
  );
}

export default ImageUpload;