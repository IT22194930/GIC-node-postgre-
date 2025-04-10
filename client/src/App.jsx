import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/Router';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
