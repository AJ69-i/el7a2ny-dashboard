/**
 * Local (client-side) operator credentials.
 *
 * Used because Firebase Authentication can't be enabled without project-owner
 * access. Passwords are stored as SHA-256 hashes (never plaintext in source).
 * This is a pragmatic login gate, NOT strong security — anyone with the bundle can
 * read the hashes. Once you have owner access, switch back to Firebase Auth
 * (see SECURITY.md).
 *
 * To add or change an operator, generate a hash:
 *   node -e "console.log(require('crypto').createHash('sha256').update('YOUR_PASSWORD').digest('hex'))"
 */
export interface Operator {
  email: string;
  passwordHash: string;
}

/** The original operator accounts (same passwords as before, now hashed). */
export const OPERATORS: Operator[] = [
  { email: 'ahmedasemelfert@gmail.com', passwordHash: '62e5e582ee41d88855b705dcb6d20519e19e690c2c85946186fa76df8ce80f0c' },
  { email: 'ahmed@el7a2ny.com', passwordHash: '8fb944fcdd2d5bfcdf93d9cc2f4b2acc7cc4e515142db7bd2d5489c79a93b454' },
  { email: 'manager@el7a2ny.com', passwordHash: 'b9313291d4b464159dd638bdaa95eabffb4893d41dcaf5cd5c6c308db65733a0' },
  { email: 'ismail@el7a2ny.com', passwordHash: '0215454cccb0d43920b521083975327d3172dbbd8727cfbe5d294da7c75282bf' },
];

/** Set to `true` to disable the login gate entirely (open app, no sign-in).
 *  Currently ON — the app opens straight to the dashboard with no sign-in,
 *  until Firebase Authentication can be enabled by the project owner. */
export const AUTH_BYPASS = true;

/** Identity shown while the login gate is bypassed (defaults to the owner). */
export const DEFAULT_OPERATOR_EMAIL = 'ahmedasemelfert@gmail.com';

/** localStorage key for the lightweight operator session. */
export const AUTH_STORAGE_KEY = 'el7a2ny.session';
