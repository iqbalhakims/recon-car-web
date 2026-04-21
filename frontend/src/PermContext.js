import { createContext, useContext } from 'react';

export const PermContext = createContext({
  role: 'staff',
  perms: { view: true, create: false, edit: false, delete: false },
});

export const usePerms = () => useContext(PermContext);
