import { useState } from 'react';
import Button from './Button';
import ErrorMessage from './ErrorMessage';
import styles from './ImageUpload.module.css';

function ImageUpload({ currentImageUrl, uploadFn, onUploaded }) {
  const [preview, setPreview] = useState(currentImageUrl || null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className={styles.wrapper}>
      {preview && <img src={preview} alt="Preview" className={styles.preview} />}
      <ErrorMessage message={error} />
      <input type="file" accept="image/*" onChange={handleFileSelect} />
      {file && (
        <Button type="button" loading={uploading} loadingText="Uploading..." onClick={handleUpload}>
          Upload
        </Button>
      )}
    </div>
  );
}

export default ImageUpload;