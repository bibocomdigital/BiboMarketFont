"use client";

import React from 'react';
import { Clock, MessageCircle, ShoppingBag } from 'lucide-react';
import { getUserErrorMessage } from '@domain/errors/app-error';
import { useInboxMessagesQuery } from '@/hooks/queries/use-messages-query';

const DashboardMessages = () => {
  const { data, isPending, isError, error: queryError } = useInboxMessagesQuery();
  const messages = data?.messages ?? [];
  const loading = isPending && !data;
  const error = isError && !data ? getUserErrorMessage(queryError) : null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center h-dvh">
      <div className="animate-spin text-orange-500">
        <Clock size={48} />
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      {error}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-orange-500 text-white p-6 flex items-center">
          <MessageCircle className="mr-4" size={36} />
          <h1 className="text-2xl font-bold">Mes Messages</h1>
        </div>
        
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageCircle size={48} className="mx-auto mb-4 text-orange-300" />
            <p>Vous n'avez pas encore de messages</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className="p-6 hover:bg-gray-50 transition-colors duration-300 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{message.subject}</h3>
                    <p className="text-gray-600 mt-2 line-clamp-2">{message.message}</p>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <ShoppingBag size={16} className="mr-2 text-orange-500" />
                      <span>{message.shop.name}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(message.createdAt)}</span>
                    </div>
                  </div>
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-bold 
                    ${message.status === 'UNREAD' 
                      ? 'bg-orange-100 text-orange-600' 
                      : 'bg-green-100 text-green-600'
                    }
                  `}>
                    {message.status === 'UNREAD' ? 'Non lu' : 'Lu'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardMessages;