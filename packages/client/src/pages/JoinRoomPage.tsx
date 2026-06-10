import { PLAYER_COLORS } from '@fodinha/shared';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ColorPicker from '../components/ColorPicker';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';

export default function JoinRoomPage() {
  const navigate = useNavigate();
  const { joinRoom, setError } = useGame();
  const [code, setCode] = useState('');
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('fodinha_player_name') ?? ''
  );
  const [color, setColor] = useState(PLAYER_COLORS[1]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    localStorage.setItem('fodinha_player_name', playerName);

    try {
      await joinRoom(code.trim().toUpperCase(), playerName, color);
      navigate('/sala');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Entrar em Sala">
      <form className="form-card" onSubmit={handleSubmit}>
        <label>
          Código da Sala
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            required
            maxLength={6}
            className="code-input"
          />
        </label>

        <label>
          Seu Nome
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Seu apelido"
            required
            maxLength={20}
          />
        </label>

        <label>
          Sua Cor
          <ColorPicker value={color} onChange={setColor} />
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </Layout>
  );
}
