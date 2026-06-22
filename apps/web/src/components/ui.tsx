import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';

// UI 部品ライブラリは使わず、Tailwind ユーティリティで最小限の自前部品を組む（docs/03 方針）。

export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-indigo-500 ${className}`}
      {...props}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-sm font-medium text-gray-700">{children}</label>;
}

export function FieldError({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <ul className="mt-1 space-y-0.5">
      {messages.map((m, i) => (
        <li key={i} className="text-xs text-red-600">
          {m}
        </li>
      ))}
    </ul>
  );
}
