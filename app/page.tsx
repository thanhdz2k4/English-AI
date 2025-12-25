import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col items-center gap-8 p-8 max-w-2xl">
        <div className="w-full flex justify-end gap-3 text-sm">
          <Link
            href="/login"
            className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create account
          </Link>
        </div>
        <h1 className="text-5xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          English AI
        </h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-300">
          Improve your English writing skills with AI-powered feedback
        </p>
        
        <div className="flex flex-col gap-4 w-full mt-8">
          <Link 
            href="/writing"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-center transition-colors"
          >
            Start Writing Practice
          </Link>

          <Link
            href="/fill-blank"
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-center transition-colors"
          >
            Fill in the Blank Exercise
          </Link>

          <Link
            href="/practice"
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-center transition-colors"
          >
            Practice Mistakes by Topic
          </Link>

          <Link
            href="/flashcards"
            className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-center transition-colors"
          >
            Flashcards
          </Link>

          <Link
            href="/goals"
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-center transition-colors"
          >
            Personalized Goals
          </Link>
          
          <Link 
            href="/history"
            className="px-8 py-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-semibold text-center transition-colors"
          >
            View Mistakes History
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-2">✍️ Practice Writing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Write sentences on any topic and get instant feedback
            </p>
          </div>
          
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-2">🤖 AI Feedback</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get grammar corrections and improvement suggestions
            </p>
          </div>
          
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-2">📚 Learn from Mistakes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review your errors to improve over time
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
