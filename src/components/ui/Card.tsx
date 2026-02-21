import React from 'react';

export const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string, key?: any }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden ${className}`}>
        {children}
    </div>
);
