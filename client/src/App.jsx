import { useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

function App() {
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to socket server');
    });
  }, []);

  return (
    <div className="App">
      <h1>Welcome to Apna Ghar</h1>
    </div>
  );
}

export default App;
