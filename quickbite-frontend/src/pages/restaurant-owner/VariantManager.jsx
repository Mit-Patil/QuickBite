import { useState } from 'react';
import { addVariant, updateVariant, deleteVariant } from '../../api/menuItemService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import styles from './ItemOptionManager.module.css';

function VariantManager({ menuItemId, variants, onVariantAdded, onVariantUpdated, onVariantDeleted }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await addVariant(menuItemId, { name, price: Number(price), isDefault: variants.length === 0 });
      onVariantAdded(response.data);
      setName('');
      setPrice('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(variant) {
    setEditingId(variant.id);
    setEditName(variant.name);
    setEditPrice(variant.price);
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setEditError('');
    setEditSubmitting(true);
    try {
      const response = await updateVariant(menuItemId, editingId, { name: editName, price: Number(editPrice) });
      onVariantUpdated(response.data);
      setEditingId(null);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(variantId) {
    if (!window.confirm('Delete this variant?')) return;
    try {
      await deleteVariant(menuItemId, variantId);
      onVariantDeleted(variantId);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Variants</h2>

      {variants.length === 0 ? (
        <p className={styles.emptyText}>No variants yet — this item is sold at its base price only.</p>
      ) : (
        <ul className={styles.list}>
          {variants.map((v) =>
            editingId === v.id ? (
              <li key={v.id} className={styles.editRow}>
                <form onSubmit={handleUpdate} className={styles.inlineForm}>
                  <ErrorMessage message={editError} />
                  <div className={styles.inlineFields}>
                    <Input label="Name" name="editVariantName" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                    <Input label="Price" name="editVariantPrice" type="number" min="0" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
                  </div>
                  <div className={styles.inlineActions}>
                    <Button loading={editSubmitting} loadingText="Saving..." className={styles.saveButton}>Save</Button>
                    <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={v.id} className={styles.row}>
                <span className={styles.rowLabel}>
                  {v.name} — ₹{v.price}
                  {v.isDefault && <span className={styles.defaultTag}>Default</span>}
                </span>
                <div className={styles.rowActions}>
                  <button type="button" onClick={() => startEdit(v)}>Edit</button>
                  <button type="button" className={styles.dangerButton} onClick={() => handleDelete(v.id)}>Delete</button>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      <form onSubmit={handleSubmit} className={styles.subForm}>
        <h3 className={styles.subTitle}>Add a variant</h3>
        <ErrorMessage message={error} />
        <Input label="Variant name (e.g. Large)" name="variantName" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Price" name="variantPrice" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <Button loading={submitting} loadingText="Adding..." className={styles.subButton}>Add Variant</Button>
      </form>
    </section>
  );
}

export default VariantManager;