import { Link } from "react-router-dom";

// NotFound page component with default export
const NotFound = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page Not Found</p>
      <Link to="/" className="text-blue-600 hover:text-blue-800 underline">
        Go back to home
      </Link>
    </div>
  </div>
);

export default NotFound;
