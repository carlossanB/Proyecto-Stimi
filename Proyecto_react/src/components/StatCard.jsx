import React from 'react';

export default function StatCard({ 
  icon: Icon, 
  title, 
  value, 
  subtext, 
  subtextClass = "text-gray-400 dark:text-gray-500",
  iconBgClass = "bg-blue-50 dark:bg-blue-950/40", 
  iconColorClass = "text-blue-600 dark:text-blue-400" 
}) {
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl shrink-0 ${iconBgClass} ${iconColorClass} flex items-center justify-center`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        {subtext && (
          <p className={`text-xs block mt-0.5 ${subtextClass}`}>{subtext}</p>
        )}
      </div>
    </div>
  );
}

