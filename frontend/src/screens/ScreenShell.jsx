import { Link } from 'react-router-dom';

function ScreenShell({ role, title, description = 'Man hinh dang o trang thai khoi tao.' }) {
  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{role}</p>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        <Link className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" to="/">
          Ve Home
        </Link>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-gray-700">{description}</p>
      </section>
    </main>
  );
}

export default ScreenShell;
