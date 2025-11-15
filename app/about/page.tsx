// app/about/page.jsx
import Link from 'next/link';
import { Bot, ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="mr-4 rounded-full p-2 hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <h1 className="ml-2 text-xl font-semibold text-slate-800">About</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-slate-900">About AI Chatbot</h1>
          
          <div className="mt-6 space-y-6 text-slate-700">
            <p>
              This AI Chatbot is built using Next.js and integrates with OpenAI&apos;s powerful language models
              to provide an intelligent conversational experience.
            </p>
            
            <h2 className="text-2xl font-semibold text-slate-900">Features</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Natural language conversations with AI</li>
              <li>Markdown support for formatted responses</li>
              <li>Message history saved in your browser</li>
              <li>Clean, modern UI with smooth animations</li>
              <li>Fast and responsive design</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-slate-900">Technology</h2>
            <p>
              Built with modern web technologies including:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Next.js for the framework</li>
              <li>React for the UI components</li>
              <li>Tailwind CSS for styling</li>
              <li>OpenAI API for AI capabilities</li>
              <li>Framer Motion for animations</li>
            </ul>
            
            <div className="mt-8 flex justify-center">
              <Link 
                href="/chat"
                className="rounded-full bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Start Chatting
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-slate-200 bg-white py-6 px-6">
        <div className="mx-auto max-w-3xl text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} AI Chatbot. All rights reserved.
        </div>
      </footer>
    </div>
  );
}