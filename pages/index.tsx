import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-10">
        <Image
          src="/HippoPolkaLogo_Words.png"
          alt="Hippo and Dog Logo with Words"
          width={260}
          height={260}
          priority
        />
        <div className="flex gap-8 mt-2">
          <Link href="/login" legacyBehavior>
            <a className="text-black text-xl font-semibold underline hover:opacity-70 transition-opacity">Log In</a>
          </Link>
          <button
            className="text-black text-xl font-semibold underline opacity-70 cursor-not-allowed"
            disabled
          >
            Join Waitlist
          </button>
        </div>
      </div>
    </div>
  );
} 