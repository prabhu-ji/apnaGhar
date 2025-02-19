const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is working!');
});

app.listen(3000, () => {
  console.log('API server running on http://localhost:3000');
});
