import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createMenuItem, getMenuItemById, updateMenuItem } from '../../api/menuItemService';
import Input from '../../components/Input';
import Checkbox from '../../components/Checkbox';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import styles from '../../styles/ProfilePage.module.css';

function MenuItemFormPage() {
  const { id, menuItemId } = useParams();
  const isEditMode = Boolean(menuItemId);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [stockQuantity, setStockQuantity] = useState('');
  const [isStockUnlimited, setIsStockUnlimited] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

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

  if (loading) return <p>Loading menu item...</p>;

  return (
    <div className={styles.wrapper}>
      <h1>{isEditMode ? 'Edit Menu Item' : 'Add Menu Item'}</h1>
      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input label="Name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input label="Price" name="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <Input label="Category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} />

        <Checkbox
          label="Unlimited Stock"
          name="isStockUnlimited"
          checked={isStockUnlimited}
          onChange={(e) => setIsStockUnlimited(e.target.checked)}
        />

        {!isStockUnlimited && (
          <Input
            label="Stock Quantity"
            name="stockQuantity"
            type="number"
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
    </div>
  );
}

export default MenuItemFormPage;