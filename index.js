import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

const app= express();

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

export default app;








