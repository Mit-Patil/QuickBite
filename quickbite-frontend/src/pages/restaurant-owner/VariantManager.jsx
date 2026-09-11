import { useState } from 'react';
import { addVariant, updateVariant, deleteVariant } from '../../api/menuItemService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import styles from '../../styles/ProfilePage.module.css';

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
    try {
      await deleteVariant(menuItemId, variantId);
      onVariantDeleted(variantId);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Variants</h2>
      <ul>
        {variants.map((v) =>
          editingId === v.id ? (
            <li key={v.id}>
              <form onSubmit={handleUpdate} className={styles.form}>
                <ErrorMessage message={editError} />
                <Input label="Name" name="editVariantName" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                <Input label="Price" name="editVariantPrice" type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
                <Button loading={editSubmitting} loadingText="Saving...">Save</Button>
                <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
              </form>
            </li>
          ) : (
            <li key={v.id}>
              {v.name} — ₹{v.price} {v.isDefault && '(default)'}
              <button onClick={() => startEdit(v)}>Edit</button>
              <button onClick={() => handleDelete(v.id)}>Delete</button>
            </li>
          )
        )}
      </ul>

      <ErrorMessage message={error} />
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input label="Variant Name (e.g. Large)" name="variantName" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Price" name="variantPrice" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <Button loading={submitting} loadingText="Adding...">Add Variant</Button>
      </form>
    </div>
  );
}

export default VariantManager;