import { Navigate, Route, Routes } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import CreateRoomPage from './pages/CreateRoomPage';
import GamePage from './pages/GamePage';
import HomePage from './pages/HomePage';
import JoinRoomPage from './pages/JoinRoomPage';
import LobbyPage from './pages/LobbyPage';

export default function App() {
  return (
    <GameProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/criar" element={<CreateRoomPage />} />
        <Route path="/entrar" element={<JoinRoomPage />} />
        <Route path="/sala" element={<LobbyPage />} />
        <Route path="/jogo" element={<GamePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </GameProvider>
  );
}
