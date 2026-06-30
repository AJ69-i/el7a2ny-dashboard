/**
 * Display profiles for operator accounts (name, role, optional avatar).
 * Keyed by lowercase email. Falls back to the email + initials when missing.
 *
 * To show a photo: drop the image into `public/` and point `avatar` at it
 * (e.g. `public/operator-ahmed.jpg` → avatar: '/operator-ahmed.jpg').
 */
export interface OperatorProfile {
  name: string;
  role: string;
  avatar?: string;
}

export const OPERATOR_PROFILES: Record<string, OperatorProfile> = {
  'ahmedasemelfert@gmail.com': {
    name: 'Ahmed Asem Elfert',
    role: 'Owner',
    avatar: 'operator-ahmed.jpg',
  },
  'ahmed@el7a2ny.com': { name: 'Ahmed', role: 'Manager' },
  'manager@el7a2ny.com': { name: 'Manager', role: 'Manager' },
  'ismail@el7a2ny.com': { name: 'Ismail', role: 'Operator' },
};
