import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import userRouter from './routes/userRoute.js';

const app= express();

app.use(express.json());

dotenv.config();

const connection = process.env.MONGODB_URL;

const PORT=3000;

app.get('/', (req, res) => {
  res.send('Welcome to the Cosmetics API!');
});

app.listen(PORT, () => {
  console.log(`Server is Running on ${PORT}`);
});

mongoose.connect(connection).then(
  ()=>{
    console.log("Database connected successfully");
  }
).catch(
  ()=>{
    console.log("Database connection failed");
  }
)

app.use("/api/users", userRouter);

export default app;








