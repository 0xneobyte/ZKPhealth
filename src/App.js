import React from 'react';
import { AuthProvider } from './components/auth/AuthContext';
import Login from './components/auth/Login';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Login />
      </div>
    </AuthProvider>
  );
}

export default App; 