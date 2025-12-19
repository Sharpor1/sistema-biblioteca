import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification from '../components/Notification';

const NotificationContext = createContext();

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((message, type = 'info') => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-auto max-w-xl pointer-events-none">
                <div className="flex flex-col items-center space-y-5 pointer-events-auto">
                    {notifications.map((notification) => (
                        <Notification
                            key={notification.id}
                            notification={notification}
                            onClose={removeNotification}
                        />
                    ))}
                </div>
            </div>
        </NotificationContext.Provider>
    );
}
