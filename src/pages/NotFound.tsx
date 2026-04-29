import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-yellow-400 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-6xl font-bold mb-4">404</div>
        <div className="text-2xl font-semibold mb-8">Page Not Found</div>
        <Link
          to="/login"
          className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
