/**
 * "Static notendagrunnur"
 * Notendur eru harðkóðaðir og ekkert hægt að breyta þeim.
 * Ef við notum notendagagnagrunn, t.d. í postgres, útfærum við leit að notendum
 * hér, ásamt því að passa upp á að lykilorð séu lögleg.
 */
import { query } from './db.js';
import bcrypt from 'bcrypt'; // eslint-disable-line

/**
 const records = [
  {
    id: 1,
    username: 'admin',
    name: 'Hr. admin',

    // 123
    password: '$2a$11$pgj3.zySyFOvIQEpD7W6Aund1Tw.BFarXxgLJxLbrzIv/4Nteisii',
    admin: true,
  },
  {
    id: 2,
    username: 'oli',
    name: 'Óli',

    // 123
    password: '$2a$11$pgj3.zySyFOvIQEpD7W6Aund1Tw.BFarXxgLJxLbrzIv/4Nteisii',
    admin: false,
  },
];
*/
export async function comparePasswords(password, user) {
  const ok = await bcrypt.compare(password, user.password);

  if (ok) {
    return user;
  }
  return false;
}

// Merkjum sem async þó ekki verið að nota await, þar sem þetta er notað í
// app.js gerir ráð fyrir async falli

export async function findByUsername(username) {
  const q = 'SELECT * FROM public.users WHERE username = $1';
  try {
    const result = await query(q, [username]);
    // Check if result and result.rows are not null and have length
    if (result && result.rows && result.rows.length > 0) {
      return result.rows[0]; // Return the first matching user
    }
    return null; // No user found or result is null
  } catch (err) {
    console.error('Error querying user by username', err);
    throw err;
  }
}


export async function findById(id) {
  const q = 'SELECT * FROM public.users WHERE id = $1';
  try {
    const result = await query(q, [id]);
    // Check if result and result.rows are not null and have length
    if (result && result.rows && result.rows.length > 0) {
      return result.rows[0]; // Return the first matching user
    }
    return null; // No user found or result is null
  } catch (err) {
    console.error('Error querying user by id', err);
    throw err;
  }
}



export async function createUser(username, name, password, admin = false) {
  const hashedPassword = await bcrypt.hash(password, 10); // 10 is the cost factor
  const q = 'INSERT INTO public.users (username, password, admin) VALUES ($1, $2, $3) RETURNING id';

  try {
    const result = await query(q, [username, name, hashedPassword, admin]);
    // Ensure result and result.rows are not null and have length before accessing
    if (result && result.rows && result.rows.length > 0) {
      // @ts-ignore
      return result.rows[0].id; // Return the new user's id
    }
    return null; // No rows returned or result is null
  } catch (err) {
    console.error('Error creating user', err);
    throw err;
  }
}

