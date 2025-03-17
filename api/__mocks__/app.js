import express from 'express';

// Create a mock Express app
const app = express();

// Mock the basic routes that your tests need
app.get('/api/posts', (req, res) => {
  res.status(200).json([
    {
      id: 1,
      city: 'New York',
      type: 'buy',
      user: { username: 'John Doe' },
      isSaved: req.cookies?.token ? true : false,
    },
  ]);
});

app.post('/api/posts', (req, res) => {
  if (req.headers.authorization) {
    res.status(201).json({
      id: 1,
      city: 'New York',
      type: 'buy',
      postDetail: { description: 'Beautiful apartment' },
    });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

app.put('/api/posts/:id', (req, res) => {
  if (req.params.id === '999') {
    res.status(404).json({ message: 'Post not found' });
  } else {
    res.status(200).json({
      id: 1,
      city: 'New York',
      postDetail: { description: 'Updated description' },
    });
  }
});

app.delete('/api/posts/:id', (req, res) => {
  if (req.params.id === '999') {
    res.status(404).json({ message: 'Post not found!' });
  } else {
    res.status(200).json({ message: 'Post deleted successfully' });
  }
});

app.patch('/api/posts/:id/sold', (req, res) => {
  res.status(200).json({ id: 1, isSold: true });
});

app.patch('/api/posts/:id/rented', (req, res) => {
  res.status(200).json({ id: 1, isRented: true });
});

export default app;
