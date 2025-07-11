import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setResult('Invalid email or password.');
    } else {
      setResult(null);
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        <Image
          src="/HippoPolkaLogo_Words.png"
          alt="Hippo and Dog Logo with Words"
          width={180}
          height={180}
          priority
        />
        <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-black rounded-lg text-black bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black text-lg"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-black rounded-lg text-black bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black text-lg"
          />
          <button
            type="submit"
            className="w-full py-3 mt-2 bg-black text-white rounded-lg font-bold text-lg hover:bg-gray-900 transition-colors"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        {result && (
          <div className="text-black text-center mt-2 text-lg">{result}</div>
        )}
        <div className="flex flex-col items-center gap-2 mt-4">
          <button
            className="text-black underline text-base opacity-70 cursor-not-allowed"
            disabled
          >
            Join Waitlist
          </button>
          <Link href="/" legacyBehavior>
            <a className="text-black underline text-base hover:opacity-70 transition-opacity">Back to Home</a>
          </Link>
        </div>
        <Image
          src="/HippoPolkaLogo.png"
          alt="Hippo and Dog Logo"
          width={100}
          height={100}
          className="mt-8"
        />
      </div>
    </div>
  );
} 