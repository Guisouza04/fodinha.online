import { PLAYER_COLORS } from '@fodinha/shared';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ColorPicker from '../components/ColorPicker';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { createRoom, setError } = useGame();
  const [name, setName] = useState('');
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('fodinha_player_name') ?? ''
  );
  const [color, setColor] = useState(PLAYER_COLORS[0]);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [initialLives, setInitialLives] = useState(5);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    localStorage.setItem('fodinha_player_name', playerName);

    try {
      await createRoom(playerName, color, {
        name,
        maxPlayers,
        initialLives,
      });
      navigate('/sala');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Criar Sala">
      <form className="form-card" onSubmit={handleSubmit}>
        <label>
          Nome da Sala
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Mesa dos amigos"
            required
            maxLength={30}
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

        <label>
          Máximo de Jogadores
          <select
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
          >
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} jogadores
              </option>
            ))}
          </select>
        </label>

        <label>
          Vidas Iniciais
          <input
            type="number"
            min={1}
            max={20}
            value={initialLives}
            onChange={(e) => setInitialLives(Number(e.target.value))}
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Criando...' : 'Criar Sala'}
        </button>
      </form>
    </Layout>
  );
}
