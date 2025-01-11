import { handler } from './build/handler.js';
import express from 'express';
import request from 'request';

const app = express();

app.use('/proxy', (req, res) => {
  const url = 'https://vatglasses.uk/';
  request(url).pipe(res);
});

app.use(handler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});