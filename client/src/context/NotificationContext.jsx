import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCount = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/notifications/count");
      setCount(res.data.count);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider value={{ count, refresh: fetchCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}