import bcrypt from "bcryptjs";
import { query } from "./client.js";
const email = process.env.ADMIN_EMAIL || "admin@hyajaklair.org";
const password = process.env.ADMIN_PASSWORD || "ChangeMe@2026!";
const hash = await bcrypt.hash(password, 12);
await query(`INSERT INTO admins(email,password_hash) VALUES($1,$2) ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash`,[email,hash]);
console.log(`Admin ready: ${email}`);
process.exit(0);
