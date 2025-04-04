import express from 'express';

const app= express();

const PORT=3000;

app.get('/', (req, res) => {
  res.send('Welcome to the Cosmetics API!');
});

app.listen(PORT, () => {
  console.log(`Server is Running on ${PORT}`);
});

export default app;



