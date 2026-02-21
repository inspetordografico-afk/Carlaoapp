import React from 'react';

export const Button = ({
    children,
    onClick,
    variant = 'primary',
    className = "",
    disabled = false,
    type = 'button'
}: {
    children: React.ReactNode,
    onClick?: () => void,
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'yellow' | 'red',
    className?: string,
    disabled?: boolean,
    type?: 'button' | 'submit'
}) => {
    const variants = {
        primary: 'bg-zinc-900 text-white hover:bg-zinc-800',
        secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-200',
        danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200',
        ghost: 'hover:bg-zinc-100 text-zinc-600',
        yellow: 'bg-yellow-400 text-zinc-900 hover:bg-yellow-500 font-bold',
        red: 'bg-red-600 text-white hover:bg-red-700 font-bold'
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};
