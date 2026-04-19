import Link from 'next/link'

export default function AccessRequestPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-sm p-8 md:p-10">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl mb-5">
          !
        </div>

        <h1 className="text-2xl font-bold text-slate-900">Access approval required</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This account is signed in successfully, but it has not been assigned to a bank workspace or SME profile yet.
          For production safety, BizReady no longer grants bank administrator access automatically.
        </p>

        <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-900">What to do next</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc list-inside">
            <li>Ask a platform administrator to assign your account to the correct tenant and role.</li>
            <li>If you expected SME access, make sure your email matches the business record created during diagnostic submission.</li>
            <li>After access is granted, sign in again and you will be routed into the right workspace.</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Back to sign in
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  )
}
