import Image from 'next/image';

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-10">
        <Image
          src="/HippoPolkaLogo.png"
          alt="Hippo and Dog Logo"
          width={180}
          height={180}
          priority
        />
        <h1 className="text-3xl font-bold text-black">Dashboard</h1>
      </div>
    </div>
  );
} 