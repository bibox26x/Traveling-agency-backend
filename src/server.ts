import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import app from './app';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
