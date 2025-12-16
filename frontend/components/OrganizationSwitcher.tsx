'use client';

import { useState } from 'react';
import { Building2, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useOrganization } from '@/providers/OrganizationProvider';
import { cn } from '@/lib/utils';

export default function OrganizationSwitcher() {
    const { currentOrg, organizations, setCurrentOrg, isLoading } = useOrganization();
    const [isOpen, setIsOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border border-transparent rounded-xl">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-400">Loading clients...</span>
            </div>
        );
    }

    if (organizations.length === 0) {
        return (
            <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 border border-yellow-100 rounded-xl text-yellow-700">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">No clients assigned</span>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-gray-900 min-w-[200px] justify-between shadow-sm"
            >
                <div className="flex items-center space-x-2 truncate">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium truncate max-w-[140px]">
                        {currentOrg ? currentOrg.name : 'Select Client'}
                    </span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2 border-b border-gray-100 bg-gray-50">
                            <p className="text-xs font-semibold text-gray-500 px-3 py-1 uppercase tracking-wider">
                                Switch Client Context
                            </p>
                        </div>
                        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                            {organizations.map((org) => (
                                <button
                                    key={org.id}
                                    onClick={() => {
                                        setCurrentOrg(org);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group",
                                        currentOrg?.id === org.id
                                            ? "bg-blue-50 text-blue-700"
                                            : "hover:bg-gray-50 text-gray-700"
                                    )}
                                >
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                            currentOrg?.id === org.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                                        )}>
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <div className="text-left overflow-hidden">
                                            <p className="text-sm font-medium truncate">{org.name}</p>
                                        </div>
                                    </div>
                                    {currentOrg?.id === org.id && (
                                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
