import React from 'react';

export const Input = ({
    label,
    value,
    onChange,
    type = 'text',
    placeholder = "",
    required = false,
    className = "",
    name,
    defaultValue
}: {
    label: string,
    value?: string | number,
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void,
    type?: string,
    placeholder?: string,
    required?: boolean,
    className?: string,
    name?: string,
    defaultValue?: string | number
}) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}{required && '*'}</label>
        {type === 'textarea' ? (
            <textarea
                name={name}
                value={value}
                defaultValue={defaultValue}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all min-h-[100px]"
            />
        ) : (
            <input
                name={name}
                type={type}
                value={value}
                defaultValue={defaultValue}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
            />
        )}
    </div>
);
