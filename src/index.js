import dotenv from 'dotenv';
dotenv.config({ path: './src/.env' });
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import userRouter from './routes/userRoute.js';
import categoryRouter from './routes/categoryRoute.js';
import productRouter from './routes/productRoute.js';

const app= express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    standardHeaders: true,
    legacyHeaders: false, 
});

app.use(limiter);
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);


const connection = process.env.MONGODB_URL;

const PORT=process.env.PORT;


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
