import React from 'react';
import './App.css';
import logo from './assets/image.png';
import bgChat from './assets/bg-chat.jpeg';

// Partículas
import Particles from 'react-tsparticles';

import ChatApp from './chat/ChatApp';
import { API_URL } from './chat/api';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import { AuthProvider, useAuth } from './chat/AuthContext.jsx';

// Header responsive con menú hamburguesa
function HeaderResponsive() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close);
    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close);
    };
  }, []);

  return (
    <header className="header">
      <div className="logo-container">
        <img src={logo} alt="Logo de Magic2k" className="logo" />
      </div>

      <button
        className="nav-toggle"
        aria-label="Abrir menú"
        onClick={() => setMenuOpen(o => !o)}
      >
        <span style={{ display: 'block', width: 28, height: 28 }}>
          <svg width="28" height="28" viewBox="0 0 28 28">
            <rect y="4" width="28" height="3" rx="1.5" fill="#3a8dde" />
            <rect y="12.5" width="28" height="3" rx="1.5" fill="#3a8dde" />
            <rect y="21" width="28" height="3" rx="1.5" fill="#3a8dde" />
          </svg>
        </span>
      </button>

      <nav className={menuOpen ? 'nav open' : 'nav'} onClick={() => setMenuOpen(false)}>
        {/* <a href="#features">Features</a> */}
        <a href="/login">Iniciar Sesión</a>
      </nav>
    </header>
  );
}

// --- RegisterModal ---
function RegisterModal({ onClose }) {
  const [form, setForm] = React.useState({
    firstName: '', lastName: '', nickname: '', email: '', password: '', repeatPassword: '', avatar: null
  });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { login: doLogin } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = React.useRef();

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === 'avatar' && files && files[0]) {
      setForm(f => ({ ...f, avatar: files[0] }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  }

  function getInitials() {
    return ((form.firstName[0] || '') + (form.lastName[0] || '')).toUpperCase();
  }

  function validate() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.nickname.trim() || !form.email.trim() || !form.password.trim() || !form.repeatPassword.trim()) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('Correo inválido');
      return false;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (form.password !== form.repeatPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    setError('');
    return true;
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      let avatarUrl = '';
      if (form.avatar) {
        avatarUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(form.avatar);
        });
      }

      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          nickname: form.nickname,
          email: form.email,
          password: form.password,
          avatar: avatarUrl || getInitials()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Error de registro');

      doLogin(data);
      setLoading(false);
      navigate('/home');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(20,22,34,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', animation: 'fadeIn .2s'
    }}>
      <div style={{
        background: 'rgba(32,36,54,0.98)',
        borderRadius: 22,
        boxShadow: '0 8px 32px #0005',
        padding: '0',
        position: 'relative',
        width: '100%',
        maxWidth: 370,
        minWidth: 260,
        minHeight: 420,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1.5px solid #23263a',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#3a8dde', zIndex: 2, lineHeight: 1 }} title="Cerrar">×</button>
        <form onSubmit={handleRegister} style={{ width: '100%', maxWidth: 260, padding: '32px 18px 18px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontWeight: 800, letterSpacing: 1, marginBottom: 18, fontSize: 22, color: '#eaf2ff', textShadow: '0 2px 8px #3a8dde22' }}>Crear cuenta</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            {form.avatar ? (
              <img src={URL.createObjectURL(form.avatar)} alt="avatar" style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover', border: '2px solid #3a8dde' }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 24, background: 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, border: '2px solid #3a8dde' }}>{getInitials()}</div>
            )}
            <button type="button" style={{ marginLeft: 12, background: 'none', border: 'none', color: '#3a8dde', fontWeight: 600, cursor: 'pointer', fontSize: 14 }} onClick={() => fileInputRef.current.click()}>{form.avatar ? 'Cambiar imagen' : 'Subir imagen'}</button>
            <input ref={fileInputRef} type="file" name="avatar" accept="image/*" style={{ display: 'none' }} onChange={handleChange} />
          </div>
          <input type="text" name="firstName" placeholder="Nombre" value={form.firstName} onChange={handleChange} style={{ width: '100%', marginBottom: 10, padding: 10, borderRadius: 10, border: '1.5px solid #2e3650', background: '#23263a', color: '#eaf2ff', fontSize: 15 }} required />
          <input type="text" name="lastName" placeholder="Apellido" value={form.lastName} onChange={handleChange} style={{ width: '100%', marginBottom: 10, padding: 10, borderRadius: 10, border: '1.5px solid #2e3650', background: '#23263a', color: '#eaf2ff', fontSize: 15 }} required />
          <input type="text" name="nickname" placeholder="Apodo" value={form.nickname} onChange={handleChange} style={{ width: '100%', marginBottom: 10, padding: 10, borderRadius: 10, border: '1.5px solid #2e3650', background: '#23263a', color: '#eaf2ff', fontSize: 15 }} required />
          <input type="email" name="email" placeholder="Correo electrónico" value={form.email} onChange={handleChange} style={{ width: '100%', marginBottom: 10, padding: 10, borderRadius: 10, border: '1.5px solid #2e3650', background: '#23263a', color: '#eaf2ff', fontSize: 15 }} required />
          <input type="password" name="password" placeholder="Contraseña" value={form.password} onChange={handleChange} style={{ width: '100%', marginBottom: 10, padding: 10, borderRadius: 10, border: '1.5px solid #2e3650', background: '#23263a', color: '#eaf2ff', fontSize: 15 }} required />
          <input type="password" name="repeatPassword" placeholder="Confirmar contraseña" value={form.repeatPassword} onChange={handleChange} style={{ width: '100%', marginBottom: 14, padding: 10, borderRadius: 10, border: '1.5px solid #2e3650', background: '#23263a', color: '#eaf2ff', fontSize: 15 }} required />
          <button type="submit" style={{ width: '100%', padding: 12, borderRadius: 10, background: 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)', color: '#fff', fontWeight: 700, border: 'none', boxShadow: '0 1px 8px #3a8dde22', marginBottom: 8, letterSpacing: 1, fontSize: 16, transition: 'background .2s' }} disabled={loading}>{loading ? 'Creando...' : 'Crear cuenta'}</button>
          {error && <div style={{ color: '#ff4d4f', marginTop: 10, fontWeight: 600, fontSize: 14 }}>{error}</div>}
        </form>
      </div>
    </div>
  );
}

function LoginModal({ onClose }) {
  const [login, setLogin] = React.useState({ email: '', password: '' });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { login: doLogin } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(login)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Error de login');
      setLoading(false);
      doLogin(data);
      navigate('/home');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
  <div className="mm-login">
    {/* Fondo: imagen + overlay + partículas */}
    <div
      className="mm-login-bg"
      style={{ backgroundImage: `url(${bgChat})` }}
      aria-hidden="true"
    />

    <Particles
      className="mm-login-particles"
      id="tsparticles-login"
      options={{
        fullScreen: { enable: false },
        background: { color: "transparent" },
        particles: {
          number: { value: 46, density: { enable: true, value_area: 900 } },
          color: { value: ["#00cfff", "#7c3aed", "#ffffff"] },
          shape: { type: "circle" },
          opacity: { value: 0.18, random: true },
          size: { value: 3, random: true },
          move: { enable: true, speed: 0.9, direction: "none", out_mode: "out" },
          links: { enable: true, color: "#3a8dde", opacity: 0.08, width: 1 },
        },
        interactivity: {
          events: { onHover: { enable: true, mode: "repulse" }, resize: true },
          modes: { repulse: { distance: 90, duration: 0.35 } },
        },
        detectRetina: true,
      }}
    />

    <div className="mm-login-card">
      <button className="mm-login-close" onClick={onClose} title="Cerrar" aria-label="Cerrar">
        ×
      </button>

      <div className="mm-login-header">
        <img src={logo} alt="Magic2k" className="mm-login-logo" />
        <div className="mm-login-title">Iniciar sesión</div>
        <div className="mm-login-sub">
          Volvé a chatear como antes. <span className="mm-login-sub2">Mejor que antes.</span>
        </div>
      </div>

      <form className="mm-login-form" onSubmit={handleLogin}>
        <label className="mm-login-label">
          <span>Email</span>
          <div className="mm-login-field">
            <span className="mm-login-ico">✉️</span>
            <input
              type="email"
              placeholder="tu@email.com"
              value={login.email}
              onChange={e => setLogin(l => ({ ...l, email: e.target.value }))}
              required
            />
          </div>
        </label>

        <label className="mm-login-label">
          <span>Contraseña</span>
          <div className="mm-login-field">
            <span className="mm-login-ico">🔒</span>
            <input
              type="password"
              placeholder="••••••••"
              value={login.password}
              onChange={e => setLogin(l => ({ ...l, password: e.target.value }))}
              required
            />
          </div>
        </label>

        <button className="mm-login-btn" type="submit" disabled={loading}>
          <span className="mm-login-btn-glow" aria-hidden="true" />
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {error && <div className="mm-login-error">{error}</div>}

        <div className="mm-login-footer">
          <span>¿No tenés cuenta?</span>
          <button
            type="button"
            className="mm-login-link"
            onClick={() => navigate("/register")}
          >
            Creala acá ✨
          </button>
        </div>
      </form>
    </div>
  </div>
);
}

function AppRoutes() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const particlesOptions = {
    fullScreen: { enable: false },
    background: { color: 'transparent' },
    particles: {
      number: { value: 60, density: { enable: true, value_area: 800 } },
      color: { value: ['#00cfff', '#5f4cff', '#caff87', '#fff'] },
      shape: { type: 'circle' },
      opacity: { value: 0.20, random: true },
      size: { value: 3, random: true },
      move: { enable: true, speed: 1.0, direction: 'none', out_mode: 'out' },
      links: { enable: true, color: '#3a8dde', opacity: 0.10, width: 1 },
    },
    interactivity: {
      events: { onHover: { enable: true, mode: 'repulse' }, resize: true },
      modes: { repulse: { distance: 80, duration: 0.4 } },
    },
    detectRetina: true,
  };

  return (
    <Routes>
      {/* Landing pública */}
      <Route
        path="/"
        element={
          <div className="app magic-landing">
            <Particles className="magic-particles" id="tsparticles" options={particlesOptions} />

            <HeaderResponsive />

            <main className="hero">
              <div className="hero-grid">
                {/* IZQUIERDA */}
                <div className="hero-left">
                  <div className="hero-badge">
                    <span>⚡</span>
                    <span>Real-time • tics • notas de voz</span>
                  </div>

                  <h1 className="magic-title">
                    Volvé a chatear como antes.<br />
                    <span className="magic-gradient">Mejor que antes.</span>
                  </h1>

                  <p className="subtitle">
                    Magic 2K trae la nostalgia de los 2000 con una experiencia moderna:
                    mensajes en tiempo real, tics de entrega/lectura y notas de voz.
                  </p>

                  <div className="hero-buttons">
                    <button className="btn primary" onClick={() => navigate('/login')}>
                      Iniciar sesión
                    </button>
                    <button className="btn secondary" onClick={() => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' })}>
                      Descargar
                    </button>
                  </div>

                  <div className="download-row" id="download">
                    <div className="store-btn disabled">
                      <div className="store-ico">🤖</div>
                      <div className="store-text">
                        <div className="store-title">Descargar en Android</div>
                        <div className="store-sub">Próximamente</div>
                      </div>
                    </div>

                    <div className="store-btn disabled">
                      <div className="store-ico">🍏</div>
                      <div className="store-text">
                        <div className="store-title">Descargar en iOS</div>
                        <div className="store-sub">Próximamente</div>
                      </div>
                    </div>
                  </div>

                  <div className="download-note">
                    *Si todavía no está publicada en tu tienda, vas a ver “Próximamente”.
                  </div>

                  <div className="hero-chips">
                    <div className="hero-chip">⚡ Socket real-time</div>
                    <div className="hero-chip">✓✓ Tics de estado</div>
                    <div className="hero-chip">🎙️ Notas de voz</div>
                    <div className="hero-chip">✨ Estilo 2K sin copiar</div>
                  </div>
                </div>

                {/* DERECHA: CELULAR */}
                <div className="hero-right">
                  <div className="phone">
                    <div className="phone-top">
                      <div className="phone-back">‹</div>
                      <div className="phone-app">
                        <span className="phone-app-icon">M</span>
                        <span className="phone-app-name">Magic 2K</span>
                      </div>
                      <div className="phone-actions">
                        <span>📞</span>
                        <span>⚙️</span>
                      </div>
                    </div>

                    <div className="phone-screen">
                      <div className="msg other">
                        <div className="bubble">Bro, ¿ya quedó andando el deploy?</div>
                        <div className="time">22:10</div>
                      </div>

                      <div className="msg me">
                        <div className="bubble">Quedó hermoso 😎 ✓✓</div>
                        <div className="time">22:11</div>
                      </div>

                      <div className="msg other">
                        <div className="bubble">Probemos las notas de voz.</div>
                        <div className="time">22:11</div>
                      </div>
                    </div>

                    <div className="phone-input">
                      <div className="phone-input-left">🔎</div>
                      <div className="phone-placeholder">Escribí un mensaje…</div>
                      <div className="phone-input-right">
                        <span className="round">🎤</span>
                        <span className="round">➤</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>

            <section className="features magic-features" id="features">
              <div className="magic-feature">
                <h3>⚡ Mensajes en tiempo real</h3>
                <p>Chat fluido con sockets.</p>
              </div>
              <div className="magic-feature">
                <h3>✓✓ Tics de estado</h3>
                <p>Entrega y lectura claras.</p>
              </div>
              <div className="magic-feature">
                <h3>🎙️ Notas de voz</h3>
                <p>Audios fáciles y rápidos.</p>
              </div>
              <div className="magic-feature">
                <h3>✨ Estilo 2K sin copiar</h3>
                <p>Clásico pero moderno.</p>
              </div>
            </section>

            <footer className="footer magic-footer">
              <div className="footer-inner">
                <div>Magic 2K © {new Date().getFullYear()}</div>
                <div className="footer-links">
                  <a href="#" onClick={(e) => e.preventDefault()}>Privacidad</a>
                  <a href="#" onClick={(e) => e.preventDefault()}>Términos</a>
                  <a href="#" onClick={(e) => e.preventDefault()}>Contacto</a>
                </div>
              </div>
            </footer>
          </div>
        }
      />

      {/* Login */}
      <Route path="/login" element={<LoginModal onClose={() => navigate('/')} />} />

      {/* Registro */}
      <Route path="/register" element={<RegisterModal onClose={() => navigate('/')} />} />

      {/* Home protegida */}
      <Route
        path="/home"
        element={
          <ProtectedRoute isAuth={!!auth.token && !!auth.user}>
            <div
              style={{
                minHeight: '100vh',
                height: '100vh',
                width: '100vw',
                background: '#181a22',
                margin: 0,
                padding: 0,
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 100,
                overflow: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChatApp
                token={auth.token}
                user={auth.user}
                onLogout={logout}
                onUserUpdate={updatedUser => setAuth(a => ({ ...a, user: updatedUser }))}
              />
            </div>
          </ProtectedRoute>
        }
      />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;