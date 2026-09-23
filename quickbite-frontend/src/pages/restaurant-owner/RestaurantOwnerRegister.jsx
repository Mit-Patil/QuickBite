import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerRestaurantOwner } from '../../api/userService';
import Input from '../../components/Input';
import ErrorMessage from '../../components/ErrorMessage';
import styles from '../../styles/AuthForm.module.css';
import Button from '../../components/Button';

function RestaurantOwnerRegister() {
  const [businessName, setBusinessName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerRestaurantOwner({ businessName, fullName, email, phone, password });
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className={styles.title}>List your restaurant</h2>
      <p className={styles.subtitle}>Reach customers and manage orders online</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <ErrorMessage message={error} />

        <Input label="Business Name" name="businessName" value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="e.g. Spice Garden" autoComplete="organization" required />

        <Input label="Full Name" name="fullName" value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name" autoComplete="name" required />

        <Input label="Email" name="email" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com" autoComplete="email" required />

        <Input label="Phone" name="phone" type="tel" value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Mobile number" autoComplete="tel" required />

        <Input label="Password" name="password" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters" autoComplete="new-password" required />

        <Button loading={loading} loadingText="Creating account...">Create Restaurant Account</Button>
      </form>
    </>
  );
}

export default RestaurantOwnerRegister;