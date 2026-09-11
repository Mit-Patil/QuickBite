import { useEffect, useState } from 'react';
import { getAddonsForRestaurant, createAddon, attachAddon, updateAddon, detachAddon } from '../../api/menuItemService';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import styles from '../../styles/ProfilePage.module.css';

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
    try {
      await detachAddon(menuItemId, addonId);
      onAddonDetached(addonId);
    } catch (err) {
      setAttachError(err.message);
    }
  }

  if (loading) return <p>Loading addons...</p>;

  const attachable = restaurantAddons.filter(
    (a) => !attachedAddons.some((attached) => attached.id === a.id)
  );

  return (
    <div>
      <h2>Addons</h2>
      <ul>
        {attachedAddons.map((a) =>
          editingId === a.id ? (
            <li key={a.id}>
              <form onSubmit={handleUpdate} className={styles.form}>
                <ErrorMessage message={editError} />
                <Input label="Name" name="editAddonName" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                <Input label="Price" name="editAddonPrice" type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
                <Button loading={editSubmitting} loadingText="Saving...">Save</Button>
                <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
              </form>
            </li>
          ) : (
            <li key={a.id}>
              {a.name} — ₹{a.price}
              <button onClick={() => startEdit(a)}>Edit</button>
              <button onClick={() => handleDetach(a.id)}>Remove from this item</button>
            </li>
          )
        )}
      </ul>

      {attachable.length > 0 && (
        <form onSubmit={handleAttach} className={styles.form}>
          <ErrorMessage message={attachError} />
          <Select
            label="Attach Existing Addon"
            name="selectedAddon"
            value={selectedAddonId}
            onChange={(e) => setSelectedAddonId(e.target.value)}
            options={[
              { value: '', label: 'Select an addon' },
              ...attachable.map((a) => ({ value: a.id, label: `${a.name} (₹${a.price})` })),
            ]}
          />
          <Button loading={attaching} loadingText="Attaching...">Attach</Button>
        </form>
      )}

      <h3>Or create a new addon for this restaurant</h3>
      <form onSubmit={handleCreate} className={styles.form}>
        <ErrorMessage message={createError} />
        <Input label="Addon Name (e.g. Extra Cheese)" name="addonName" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Price" name="addonPrice" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <Button loading={creating} loadingText="Creating...">Create Addon</Button>
      </form>
    </div>
  );
}

export default AddonManager;