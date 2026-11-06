const ROLE_HOME = {
  CUSTOMER: '/customer',
  RESTAURANT_OWNER: '/restaurant',
  DELIVERY_PARTNER: '/delivery',
  ADMIN: '/admin',
};

export const homePathForRole = (role) => ROLE_HOME[role] ?? '/login';