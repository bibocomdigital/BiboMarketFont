"use client";

import React, { useState } from 'react';
import { Bell, Trash, CheckCircle, Clock, Users, Package, Heart, Store, AlertCircle, Info, MessageSquare } from 'lucide-react';
import { useNotificationsQuery } from '@/hooks/queries/use-user-query';
import {
  useDeleteAllNotificationsMutation,
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/hooks/mutations/use-notification-mutations';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();
  const deleteOne = useDeleteNotificationMutation();
  const deleteAll = useDeleteAllNotificationsMutation();

  const { 
    data: notifications = [], 
    isPending,
    isError,
    refetch
  } = useNotificationsQuery();
  const isLoading = isPending && notifications.length === 0;

  // Nombre de notifications non lues
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  // Grouper les notifications par date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {});

  // Marquer une notification comme lue
  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await markRead.mutateAsync(notificationId);
      toast({
        title: "Notification marquée comme lue",
        description: "La notification a été marquée comme lue avec succès.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer la notification comme lue.",
        variant: "destructive",
      });
    }
  };

  // Marquer toutes les notifications comme lues
  const handleMarkAllAsRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast({
        title: "Toutes les notifications marquées comme lues",
        description: "Toutes vos notifications ont été marquées comme lues.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer toutes les notifications comme lues.",
        variant: "destructive",
      });
    }
  };

  // Supprimer une notification
  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await deleteOne.mutateAsync(notificationId);
      toast({
        title: "Notification supprimée",
        description: "La notification a été supprimée avec succès.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la notification.",
        variant: "destructive",
      });
    }
  };

  // Supprimer toutes les notifications
  const handleDeleteAllNotifications = async () => {
    try {
      await deleteAll.mutateAsync();
      toast({
        title: "Notifications supprimées",
        description: "Toutes vos notifications ont été supprimées.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer toutes les notifications.",
        variant: "destructive",
      });
    }
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification) => {
    // Marquer comme lue
    if (!notification.isRead) {
      markRead.mutateAsync(notification.id)
        .then(() => undefined)
        .catch(error => {
          console.error('Erreur lors du marquage de la notification:', error);
        });
    }
    
    // Naviguer vers l'URL d'action si elle existe
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  // Obtenir l'icône en fonction du type de notification
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'FOLLOW':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'PRODUCT':
        return <Package className="h-5 w-5 text-green-500" />;
      case 'PRODUCT_LIKE':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'SHOP_CREATED':
        return <Store className="h-5 w-5 text-purple-500" />;
      case 'MESSAGE':
        return <MessageSquare className="h-5 w-5 text-yellow-500" />;
      case 'ALERT':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-400" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Obtenir la couleur de priorité en fonction de la priorité de la notification
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 3:
        return "bg-red-100 border-red-300";
      case 2:
        return "bg-orange-50 border-orange-200";
      case 1:
        return "bg-blue-50 border-blue-200";
      default:
        return "";
    }
  };

  return (
    <div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button 
            className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-bibocom-primary focus:ring-opacity-50"
            aria-label="Notifications"
          >
            <Bell size={20} className={unreadCount > 0 ? "text-bibocom-primary" : "text-gray-600"} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 shadow-xl rounded-lg border-bibocom-primary" align="end">
          <div className="max-h-[500px] overflow-auto">
            <div className="sticky top-0 z-10 p-4 border-b flex items-center justify-between bg-gradient-to-r from-bibocom-primary to-bibocom-accent text-white">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <h3 className="font-semibold text-lg">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="outline" className="bg-white/20 text-white border-transparent">
                    {unreadCount} non {unreadCount === 1 ? 'lue' : 'lues'}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        disabled={notifications.length === 0 || notifications.every(n => n.isRead)}
                        className="h-8 w-8 p-0 text-white hover:text-white hover:bg-white/20 transition-colors"
                      >
                        <CheckCircle size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Tout marquer comme lu</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleDeleteAllNotifications}
                        disabled={notifications.length === 0}
                        className="h-8 w-8 p-0 text-white hover:text-white hover:bg-red-500/50 transition-colors"
                      >
                        <Trash size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Supprimer toutes les notifications</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {isLoading && (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-bibocom-primary mx-auto"></div>
                <p className="text-sm text-gray-500 mt-3">Chargement des notifications...</p>
              </div>
            )}

            {isError && (
              <div className="p-6 text-center bg-red-50">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-600 font-medium mb-2">Une erreur est survenue lors du chargement des notifications.</p>
                <Button variant="outline" size="sm" className="mt-1 border-red-300 text-red-600 hover:bg-red-100" onClick={() => refetch()}>
                  Réessayer
                </Button>
              </div>
            )}

            {!isLoading && !isError && notifications.length === 0 && (
              <div className="p-10 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Vous n'avez aucune notification.</p>
                <p className="text-sm text-gray-400 mt-1">Les nouvelles notifications apparaîtront ici.</p>
              </div>
            )}

            {!isLoading && !isError && notifications.length > 0 && Object.keys(groupedNotifications).map((date) => (
              <div key={date}>
                <div className="p-2 bg-gray-50 border-b sticky top-[72px] z-10">
                  <p className="text-xs text-gray-500 font-medium">{date}</p>
                </div>
                {groupedNotifications[date].map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 border-b border-l-4 hover:bg-gray-50 flex items-start cursor-pointer transition-colors ${
                      notification.isRead 
                        ? 'bg-white border-l-transparent' 
                        : 'bg-blue-50 border-l-bibocom-primary'
                    } ${getPriorityColor(notification.priority)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="mr-3 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${notification.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center mt-1.5">
                        <Clock className="h-3 w-3 text-gray-400 mr-1" />
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
                        </p>
                        {!notification.isRead && (
                          <Badge variant="outline" className="ml-2 py-0 h-4 bg-blue-100 text-blue-600 text-[10px] border-blue-200">
                            Nouveau
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1 ml-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                            >
                              <Trash size={14} className="text-red-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>Supprimer cette notification</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {!notification.isRead && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                              >
                                <CheckCircle size={14} className="text-green-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p>Marquer comme lu</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            
            {!isLoading && !isError && notifications.length > 0 && (
              <div className="p-3 bg-gray-50 text-center border-t">
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-xs text-gray-500 hover:text-bibocom-primary"
                  onClick={() => navigate('/notifications')}
                >
                  Voir toutes les notifications
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default NotificationCenter;