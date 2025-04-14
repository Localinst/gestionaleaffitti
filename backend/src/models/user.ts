import pool from '../db';
import bcrypt from 'bcrypt';

// Interfaccia utente
export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

// Interfaccia per la creazione di utenti (senza id e timestamp)
export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: string;
}

// Interfaccia per l'aggiornamento di utenti
export interface UpdateUserDto {
  email?: string;
  password?: string;
  name?: string;
  role?: string;
}

/**
 * Crea un nuovo utente
 */
export const createUser = async (userData: CreateUserDto): Promise<Omit<User, 'password'>> => {
  // Hash della password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
  
  const result = await pool.query(
    `INSERT INTO users (email, password, name, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, email, name, role, created_at, updated_at`,
    [userData.email, hashedPassword, userData.name, userData.role || 'user']
  );
  
  return result.rows[0];
};

/**
 * Trova un utente per email
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
};

/**
 * Trova un utente per ID
 */
export const findUserById = async (id: number): Promise<Omit<User, 'password'> | null> => {
  const result = await pool.query(
    'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1', 
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
};

/**
 * Verifica le credenziali di un utente
 */
export const verifyUserCredentials = async (email: string, password: string): Promise<Omit<User, 'password'> | null> => {
  const user = await findUserByEmail(email);
  
  if (!user) {
    return null;
  }
  
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    return null;
  }
  
  // Rimuovi la password dal risultato
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Aggiorna un utente
 */
export const updateUser = async (id: number, userData: UpdateUserDto): Promise<Omit<User, 'password'> | null> => {
  let query = 'UPDATE users SET ';
  const values: any[] = [];
  let valueIndex = 1;
  
  // Costruisci la query dinamicamente in base ai campi forniti
  if (userData.email) {
    query += `email = $${valueIndex}, `;
    values.push(userData.email);
    valueIndex++;
  }
  
  if (userData.password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    query += `password = $${valueIndex}, `;
    values.push(hashedPassword);
    valueIndex++;
  }
  
  if (userData.name) {
    query += `name = $${valueIndex}, `;
    values.push(userData.name);
    valueIndex++;
  }
  
  if (userData.role) {
    query += `role = $${valueIndex}, `;
    values.push(userData.role);
    valueIndex++;
  }
  
  // Aggiungi sempre updated_at
  query += `updated_at = CURRENT_TIMESTAMP WHERE id = $${valueIndex} RETURNING id, email, name, role, created_at, updated_at`;
  values.push(id);
  
  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}; 