import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createMenuItem, getMenuItemById, updateMenuItem } from '../../api/menuItemService';
import Input from '../../components/Input';
import Checkbox from '../../components/Checkbox';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import styles from './MenuItemFormPage.module.css';
import VariantManager from './VariantManager';
import AddonManager from './AddonManager';
import ImageUpload from '../../components/ImageUpload';
import { uploadMenuItemPicture } from '../../api/uploadService';
import { cloudinaryResize } from '../../utils/image';

function MenuItemFormPage() {
  const { id, menuItemId } = useParams();
  const isEditMode = Boolean(menuItemId);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [imageUrl, setImageUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [stockQuantity, setStockQuantity] = useState('');
  const [isStockUnlimited, setIsStockUnlimited] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  const [variants, setVariants] = useState([]);
  const [addons, setAddons] = useState([]);

  useEffect(() => {
    if (isEditMode) loadItem();
  }, [menuItemId]);

  async function loadItem() {
    try {
      const response = await getMenuItemById(menuItemId);
      const item = response.data;
      setName(item.name);
      setDescription(item.description || '');
      setPrice(item.price);
      setCategory(item.category || '');
      setIsVeg(item.isVeg);
      setStockQuantity(item.stockQuantity ?? '');
      setIsStockUnlimited(item.isStockUnlimited);
      setIsAvailable(item.isAvailable);
      setVariants(item.variants);
      setAddons(item.addons);
      setImageUrl(item.imageUrl || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const data = {
      name,
      description,
      price: Number(price),
      category,
      isVeg,
      isStockUnlimited,
      stockQuantity: isStockUnlimited ? null : Number(stockQuantity),
    };
    if (isEditMode) data.isAvailable = isAvailable;

    try {
      if (isEditMode) {
        await updateMenuItem(menuItemId, data);
      } else {
        await createMenuItem(id, data);
      }
      navigate(`/restaurant/${id}/menu`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleVariantAdded(newVariant) { setVariants([...variants, newVariant]); }
  function handleAddonAttached(newAddon) { setAddons([...addons, newAddon]); }
  function handleVariantUpdated(updated) { setVariants(variants.map((v) => (v.id === updated.id ? updated : v))); }
  function handleVariantDeleted(variantId) { setVariants(variants.filter((v) => v.id !== variantId)); }
  function handleAddonUpdated(updated) { setAddons(addons.map((a) => (a.id === updated.id ? updated : a))); }
  function handleAddonDetached(addonId) { setAddons(addons.filter((a) => a.id !== addonId)); }

  if (loading) return <p className={styles.loading}>Loading menu item...</p>;

  return (
    <div className={styles.wrapper}>
      <Link to={`/restaurant/${id}/menu`} className={styles.back}>← Back to menu</Link>

      <header className={styles.header}>
        <h1 className={styles.title}>{isEditMode ? 'Edit Menu Item' : 'Add Menu Item'}</h1>
        {isEditMode && <p className={styles.subtitle}>Update details, then manage variants and add-ons</p>}
      </header>

      <div className={isEditMode ? styles.layout : undefined}>
        {isEditMode && (
          <aside className={styles.sidebar}>
            {imageUrl ? (
              <img src={cloudinaryResize(imageUrl, 300)} alt={name} className={styles.sidebarImage} />
            ) : (
              <div className={styles.sidebarFallback} aria-hidden="true">🍽️</div>
            )}

            <p className={styles.sidebarName}>{name || 'Untitled item'}</p>
            <p className={styles.sidebarPrice}>₹{price || '0'}</p>

            <div className={styles.sidebarMetaRow}>
              <span className={`${styles.sidebarBadge} ${isVeg ? styles.metaVeg : styles.metaNonVeg}`}>
                {isVeg ? 'Veg' : 'Non-Veg'}
              </span>
              <span className={`${styles.sidebarBadge} ${isAvailable ? styles.metaAvailable : styles.metaUnavailable}`}>
                {isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>

            <div className={styles.sidebarStats}>
              <span><strong>{category || 'Uncategorised'}</strong></span>
              <span><strong>{variants.length}</strong> {variants.length === 1 ? 'variant' : 'variants'}</span>
              <span><strong>{addons.length}</strong> {addons.length === 1 ? 'add-on' : 'add-ons'}</span>
            </div>
          </aside>
        )}

        <div className={isEditMode ? styles.main : undefined}>
          <section className={styles.card}>
            <ErrorMessage message={error} />

            <form onSubmit={handleSubmit} className={styles.form}>
              {isEditMode && (
                <ImageUpload
                  variant="inline"
                  currentImageUrl={imageUrl}
                  uploadFn={(file) => uploadMenuItemPicture(menuItemId, file)}
                  onUploaded={(updated) => setImageUrl(updated.imageUrl)}
                />
              )}

              <Input label="Name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="Description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />

              <div className={styles.fieldRow}>
                <Input label="Price" name="price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
                <Input label="Category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Pizza" />
              </div>

              <Checkbox
                label="Unlimited stock"
                name="isStockUnlimited"
                checked={isStockUnlimited}
                onChange={(e) => setIsStockUnlimited(e.target.checked)}
              />

              {!isStockUnlimited && (
                <Input
                  label="Stock Quantity"
                  name="stockQuantity"
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  required
                />
              )}

              <Checkbox label="Vegetarian" name="isVeg" checked={isVeg} onChange={(e) => setIsVeg(e.target.checked)} />

              {isEditMode && (
                <Checkbox label="Available" name="isAvailable" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
              )}

              <Button loading={submitting} loadingText="Saving...">
                {isEditMode ? 'Save Changes' : 'Add Item'}
              </Button>
            </form>
          </section>

          {isEditMode && (
            <>
              <VariantManager
                menuItemId={menuItemId}
                variants={variants}
                onVariantAdded={handleVariantAdded}
                onVariantUpdated={handleVariantUpdated}
                onVariantDeleted={handleVariantDeleted}
              />
              <AddonManager
                restaurantId={id}
                menuItemId={menuItemId}
                attachedAddons={addons}
                onAddonAttached={handleAddonAttached}
                onAddonUpdated={handleAddonUpdated}
                onAddonDetached={handleAddonDetached}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MenuItemFormPage;