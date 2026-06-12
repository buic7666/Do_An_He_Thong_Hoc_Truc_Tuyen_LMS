import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <Link to="/" className="text-lg font-semibold text-gray-900">
        LMS
      </Link>
      <div className="flex gap-4">
        <Link to="/dashboard" className="text-gray-700 hover:text-gray-900">
          Dashboard
        </Link>
        <Link to="/login" className="text-gray-700 hover:text-gray-900">
          Login
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;