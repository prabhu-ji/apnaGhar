import dotenv from 'dotenv';
dotenv.config();

console.log('Environment variables:', {
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT,
});

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoute from './routes/auth.route.js';
import postRoute from './routes/post.route.js';
import userRoute from './routes/user.route.js';
import chatRoute from './routes/chat.route.js';
import messageRoute from './routes/message.route.js';
import visitRoute from './routes/visit.route.js';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/posts', postRoute);
app.use('/api/chats', chatRoute);
app.use('/api/messages', messageRoute);
app.use('/api/visits', visitRoute);


app.listen(3000, () => {
  console.log('Server is running on port 3000!');
});
