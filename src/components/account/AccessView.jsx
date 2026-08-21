import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import CustomerDashboard from './CustomerDashboard';

export default function AccessView() {
  const { currentProfile } = useApp();
  const [authTab, setAuthTab] = useState('login');

  const loggedIn = !!currentProfile;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-violet-900 p-8 sm:p-10 text-white flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mb-6">
              <i className="fa-solid fa-user text-xl"></i>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Tu espacio personal</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Compra con tu cuenta</h2>
            <p className="mt-4 text-sm leading-6 text-indigo-100">Crea una cuenta para consultar tus pedidos, enviar archivos a imprimir y mantener tus datos listos al reservar productos.</p>
          </div>
          <div className="mt-8 flex items-center gap-3 text-sm text-indigo-100">
            <i className="fa-solid fa-lock text-indigo-300"></i>
            <span>Autenticacion segura preparada para Supabase.</span>
          </div>
        </div>
        <div className="p-8 sm:p-10">
          {loggedIn ? (
            <CustomerDashboard />
          ) : (
            <div className="space-y-4">
              <div className="flex rounded-2xl bg-slate-100 p-1 gap-1">
                <button type="button" onClick={() => setAuthTab('login')} className={authTab === 'login' ? 'flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all' : 'flex-1 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition-all hover:bg-slate-100'}>Iniciar sesion</button>
                <button type="button" onClick={() => setAuthTab('register')} className={authTab === 'register' ? 'flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all' : 'flex-1 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition-all hover:bg-slate-100'}>Crear cuenta</button>
              </div>

              {authTab === 'login' ? <LoginForm /> : <RegisterForm />}

              <p className="mt-4 text-xs leading-5 text-slate-400">Tus datos se guardan de forma segura con Supabase. Revisa tu correo si se solicita confirmar la cuenta.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
