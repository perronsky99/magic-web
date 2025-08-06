
import React from 'react';
import './App.css';
import logo from './assets/image.png';
import ChatApp from './chat/ChatApp';
import { API_URL } from './chat/api';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import { AuthProvider, useAuth } from './chat/AuthContext.jsx';

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
        // Simulación de subida de imagen (debería ser un endpoint real)
        // Aquí solo se usa un FileReader para previsualización, pero deberías subir la imagen al backend
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
        maxWidth: 350,
        minWidth: 260,
        minHeight: 320,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1.5px solid #23263a',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#3a8dde', zIndex: 2, lineHeight: 1 }} title="Cerrar">×</button>
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 260, padding: '32px 18px 24px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontWeight: 800, letterSpacing: 1, marginBottom: 18, fontSize: 22, color: '#eaf2ff', textShadow: '0 2px 8px #3a8dde22' }}>Iniciar sesión</h2>
          <input type="email" placeholder="Email" value={login.email} onChange={e => setLogin(l => ({ ...l, email: e.target.value }))} style={{ width: '100%', maxWidth: 224, marginBottom: 14, padding: 10, borderRadius: 10, border: '1.5px solid #2e3650', background: '#23263a', color: '#eaf2ff', fontSize: 15, outline: 'none', transition: 'border .2s' }} required />
          <input type="password" placeholder="Contraseña" value={login.password} onChange={e => setLogin(l => ({ ...l, password: e.target.value }))} style={{ width: '100%', maxWidth: 224, marginBottom: 18, padding: 10, borderRadius: 10, border: '1.5px solid #2e3650', background: '#23263a', color: '#eaf2ff', fontSize: 15, outline: 'none', transition: 'border .2s' }} required />
          <button type="submit" style={{ width: '100%', maxWidth: 224, padding: 12, borderRadius: 10, background: 'linear-gradient(90deg,#3a8dde 60%,#6a9cff 100%)', color: '#fff', fontWeight: 700, border: 'none', boxShadow: '0 1px 8px #3a8dde22', marginBottom: 8, letterSpacing: 1, fontSize: 16, transition: 'background .2s' }} disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <span style={{ color: '#eaf2ff', fontSize: 14 }}>¿No tienes cuenta? </span>
            <button type="button" style={{ background: 'none', border: 'none', color: '#3a8dde', fontWeight: 700, cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }} onClick={() => navigate('/register')}>Clickea aquí</button>
          </div>
          {error && <div style={{ color: '#ff4d4f', marginTop: 10, fontWeight: 600, fontSize: 14 }}>{error}</div>}
        </form>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <Routes>
      {/* Landing pública */}
      <Route path="/" element={
        <div className="app">
          <header className="header">
            <div className="logo-container">
              <img src={logo} alt="Logo de Magic2k" className="logo" />
            </div>
            <nav className="nav">
              <a href="#features">Características</a>
            </nav>
          </header>
          <main className="hero">
            <h1>Conectate con <br /> el mundo</h1>
            <p className="subtitle">Explorá el futuro de la comunicación en línea.</p>
            <div className="hero-buttons">
              <button className="btn primary" onClick={() => navigate('/login')}>Empezar ahora</button>
              <button className="btn secondary">Saber más</button>
            </div>
          </main>
          <section className="about">
            <h2>Sobre nosotros</h2>
            <p>Nos apasiona construir experiencias simples, privadas y potentes para que chatear vuelva a ser algo mágico.</p>
          </section>
          <section className="features" id="features">
            <div className="feature">
              <div className="icon green">⚡</div>
              <h3>Mensajería instantánea</h3>
              <p>Chateá en tiempo real con tus amigos, sin interrupciones ni complicaciones.</p>
            </div>
            <div className="feature">
              <div className="icon purple">🎥</div>
              <h3>Llamadas de voz y video</h3>
              <p>Conectate como si estuvieras ahí, con audio y video de alta calidad.</p>
            </div>
            <div className="feature">
              <div className="icon blue">🛡️</div>
              <h3>Privacidad y seguridad</h3>
              <p>Tu información es solo tuya. Protegemos cada mensaje y cada llamada.</p>
            </div>
          </section>
          <footer className="footer">
            <p>Hecho con 💙 por vos. Proyecto en desarrollo.</p>
          </footer>
        </div>
      } />

      {/* Login */}
      <Route path="/login" element={
        <LoginModal onClose={() => navigate('/')} />
      } />
      {/* Registro */}
      <Route path="/register" element={
        <RegisterModal onClose={() => navigate('/')} />
      } />

      {/* Home protegida */}
      <Route path="/home" element={
        <ProtectedRoute isAuth={!!auth.token && !!auth.user}>
          <div style={{
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
          }}>
            <ChatApp token={auth.token} user={auth.user} onLogout={logout} />
          </div>
        </ProtectedRoute>
      } />

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