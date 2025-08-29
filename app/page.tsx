import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Reviewly
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered review collection platform for businesses
        </p>
        <div className="space-x-4">
          <Link 
            href="/sushi-grill" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-lg transition-colors"
          >
            Try Demo
          </Link>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          <p>Each business gets their own URL: reviewly.store/business-name</p>
        </div>
      </div>
    </div>
  );
}