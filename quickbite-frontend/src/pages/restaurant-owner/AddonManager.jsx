import { useEffect, useState } from 'react';
import { getAddonsForRestaurant, createAddon, attachAddon, updateAddon, detachAddon } from '../../api/menuItemService';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import styles from './ItemOptionManager.module.css';

function AddonManager({ restaurantId, menuItemId, attachedAddons, onAddonAttached, onAddonUpdated, onAddonDetached }) {
  const [restaurantAddons, setRestaurantAddons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [selectedAddonId, setSelectedAddonId] = useState('');
  const [attachError, setAttachError] = useState('');
  const [attaching, setAttaching] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    loadAddons();
  }, [restaurantId]);

  async function loadAddons() {
    try {
      const response = await getAddonsForRestaurant(restaurantId);
      setRestaurantAddons(response.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const response = await createAddon(restaurantId, { name, price: Number(price) });
      setRestaurantAddons([...restaurantAddons, response.data]);
      setName('');
      setPrice('');
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleAttach(e) {
    e.preventDefault();
    setAttachError('');
    setAttaching(true);
    try {
      await attachAddon(menuItemId, selectedAddonId);
      const attached = restaurantAddons.find((a) => a.id === selectedAddonId);
      onAddonAttached(attached);
      setSelectedAddonId('');
    } catch (err) {
      setAttachError(err.message);
    } finally {
      setAttaching(false);
    }
  }

  function startEdit(addon) {
    setEditingId(addon.id);
    setEditName(addon.name);
    setEditPrice(addon.price);
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setEditError('');
    setEditSubmitting(true);
    try {
      const response = await updateAddon(restaurantId, editingId, { name: editName, price: Number(editPrice) });
      setRestaurantAddons(restaurantAddons.map((a) => (a.id === response.data.id ? response.data : a)));
      onAddonUpdated(response.data);
      setEditingId(null);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDetach(addonId) {
    if (!window.confirm('Remove this addon from the item?')) return;
    try {
      await detachAddon(menuItemId, addonId);
      onAddonDetached(addonId);
    } catch (err) {
      setAttachError(err.message);
    }
  }

  if (loading) return <p className={styles.loading}>Loading add-ons...</p>;

  const attachable = restaurantAddons.filter(
    (a) => !attachedAddons.some((attached) => attached.id === a.id)
  );

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Add-ons</h2>

      {attachedAddons.length === 0 ? (
        <p className={styles.emptyText}>No add-ons attached to this item yet.</p>
      ) : (
        <ul className={styles.list}>
          {attachedAddons.map((a) =>
            editingId === a.id ? (
              <li key={a.id} className={styles.editRow}>
                <form onSubmit={handleUpdate} className={styles.inlineForm}>
                  <ErrorMessage message={editError} />
                  <div className={styles.inlineFields}>
                    <Input label="Name" name="editAddonName" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                    <Input label="Price" name="editAddonPrice" type="number" min="0" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
                  </div>
                  <div className={styles.inlineActions}>
                    <Button loading={editSubmitting} loadingText="Saving..." className={styles.saveButton}>Save</Button>
                    <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={a.id} className={styles.row}>
                <span className={styles.rowLabel}>{a.name} — {a.price > 0 ? `₹${a.price}` : 'Free'}</span>
                <div className={styles.rowActions}>
                  <button type="button" onClick={() => startEdit(a)}>Edit</button>
                  <button type="button" className={styles.dangerButton} onClick={() => handleDetach(a.id)}>Remove</button>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {attachable.length > 0 && (
        <form onSubmit={handleAttach} className={styles.subForm}>
          <h3 className={styles.subTitle}>Attach an existing add-on</h3>
          <ErrorMessage message={attachError} />
          <Select
            label="Restaurant add-on"
            name="selectedAddon"
            value={selectedAddonId}
            onChange={(e) => setSelectedAddonId(e.target.value)}
            options={[
              { value: '', label: 'Select an addon' },
              ...attachable.map((a) => ({ value: a.id, label: `${a.name} (₹${a.price})` })),
            ]}
          />
          <Button loading={attaching} loadingText="Attaching..." className={styles.subButton}>Attach</Button>
        </form>
      )}

      <form onSubmit={handleCreate} className={styles.subForm}>
        <h3 className={styles.subTitle}>Or create a new add-on for this restaurant</h3>
        <ErrorMessage message={createError} />
        <Input label="Add-on name (e.g. Extra Cheese)" name="addonName" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Price" name="addonPrice" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <Button loading={creating} loadingText="Creating..." className={styles.subButton}>Create Add-on</Button>
      </form>
    </section>
  );
}

export default AddonManager;