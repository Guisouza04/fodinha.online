import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function HomePage() {
  return (
    <Layout
      title="Online"
      subtitle="Palpite. Sobreviva. Vença."
    >
      <div className="home-actions">
        <Link to="/criar" className="btn btn-primary btn-lg">
          Criar Sala
        </Link>
        <Link to="/entrar" className="btn btn-secondary btn-lg">
          Entrar em Sala
        </Link>
      </div>
      <div className="rules-summary">
        <h3>Como funciona</h3>
        <ul>
          <li>Cada jogador palpita quantas mãos vai ganhar na rodada</li>
          <li>Quem errar perde vidas — o último sobrevivente vence</li>
          <li>Manilha móvel no estilo Truco Paulista</li>
        </ul>
      </div>
    </Layout>
  );
}
