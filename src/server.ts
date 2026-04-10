import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs/promises';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(process.cwd(), 'users.json');
const LOGS_FILE = path.join(process.cwd(), 'logs.json');

const RETURN_URL = process.env.RETURN_URL ;
const SHOULD_HASH = process.env.PASSWORD_HASH ;

function hashPassword(password: string) {
  if (!SHOULD_HASH) return password;
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function ensureFiles() {
  try { await fs.access(USERS_FILE); } catch { await fs.writeFile(USERS_FILE, '[]'); }
  try { await fs.access(LOGS_FILE); } catch { await fs.writeFile(LOGS_FILE, '[]'); }
}

async function readJson(file: string) {
  const data = await fs.readFile(file, 'utf-8');
  return JSON.parse(data);
}

async function writeJson(file: string, data: any) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function logAction(action: any) {
  const logs = await readJson(LOGS_FILE);
  logs.push({ ...action, serverTimestamp: new Date().toISOString() });
  await writeJson(LOGS_FILE, logs);
}

async function startServer() {
  await ensureFiles();
  const app = express();
  const PORT = process.env.HOST_PORT;

  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const users = await readJson(USERS_FILE);
    if (users.find((u: any) => u.username === username)) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const storedPassword = hashPassword(password);
    users.push({ username, password: storedPassword });
    await writeJson(USERS_FILE, users);
    
    await logAction({ type: 'signup', username, status: 'success' });
    res.json({ success: true, message: 'User created' });
  });

  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const device = req.headers['user-agent'] || 'unknown';
    const timestamp = new Date().toISOString();
    const cookieId = req.cookies.session_id || Math.random().toString(36).substring(7);

    const users = await readJson(USERS_FILE);
    const hashedPassword = hashPassword(password);
    const user = users.find((u: any) => u.username === username && u.password === hashedPassword);

    if (user) {
      const response = {
        success: true,
        username,
        timestamp,
        cookie_id: cookieId,
        device,
        ip,
        return_url: RETURN_URL
      };
      await logAction({ type: 'login', ...response });
      res.cookie('session_id', cookieId, { httpOnly: true });
      return res.json(response);
    } else {
      const response = {
        success: false,
        username,
        timestamp,
        ip,
        device,
        cookie_id: cookieId,
        return_url: RETURN_URL
      };
      await logAction({ type: 'login', ...response });
      return res.status(401).json(response);
    }
  });

  app.get('/api/delete_user', async (req, res) => {
    const { Username, cookieid, timestamp } = req.query;
    
    if (!Username || !cookieid || !timestamp) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    const users = await readJson(USERS_FILE);
    const initialCount = users.length;
    const newUsers = users.filter((u: any) => u.username !== Username);

    if (newUsers.length === initialCount) {
      await logAction({ type: 'delete_user', Username, status: 'failed', reason: 'not_found' });
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await writeJson(USERS_FILE, newUsers);
    await logAction({ type: 'delete_user', Username, cookieid, timestamp, status: 'success' });
    res.json({ success: true, message: 'User deleted' });
  });

  app.get('/api/logs', async (req, res) => {
    const logs = await readJson(LOGS_FILE);
    res.json(logs);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
