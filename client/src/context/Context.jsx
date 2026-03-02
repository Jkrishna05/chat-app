import React, { useState, useEffect, createContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const ChatContext = createContext();

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Axios global setup
axios.defaults.baseURL = backendUrl;
axios.defaults.withCredentials = true;

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

const Context = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

 
  // 🔐 CHECK AUTH

  const checkAuthentication = async () => {
    try {
      const { data } = await axios.get("/user/checkAuth");
      if (data.success) {
         setAuthUser(data.user);
         if(authUser){
           connectSocket();
         }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setAuthUser(null);
      } else {
        console.error(error);
      }
    }
  };

  
  // CONNECT SOCKET (JWT Based)
 
  const connectSocket = (user) => {
    if (socket) socket.disconnect();

    const newSocket = io(backendUrl, {
      withCredentials: true,
         query: {
        userId: user?._id,
      }, 
    });

    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });
  };

  // LOGIN / SIGNUP
  
  const login = async (state, credentials) => {
    try {
      const res = await axios.post(`/user/${state}`, credentials);

      if (res.data.success) {
        setAuthUser(res.data.user);
        if(authUser){
           connectSocket(res.data.user);
         }
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

 
  //  UPDATE PROFILE
  
  const updateProfile = async (profileData) => {
    try {
      const { data } = await axios.put("/user/updateProfile", profileData);
      if (data.success) {
        setAuthUser(data.user);
        toast.success(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  
  //  LOGOUT
  
  const logout = async () => {
    try {
      await axios.post("/user/logout", {});
    } catch (error) {
      console.error(error);
    }

    setAuthUser(null);
    setOnlineUsers([]);

    if (socket) socket.disconnect();

    toast.success("Logged out successfully");
  };

  
  //  AXIOS AUTO REFRESH INTERCEPTOR
 
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          !originalRequest._retry
        ) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then(() => axios(originalRequest))
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const res = await axios.post("/refresh");

            if (res.data.success) {
              processQueue(null);
              return axios(originalRequest);
            } else {
              processQueue(error);
              logout();
              return Promise.reject(error);
            }
          } catch (err) {
            processQueue(err);
            logout();
            return Promise.reject(err);
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  
  // RUN AUTH CHECK ON LOAD
  
  useEffect(() => {
    checkAuthentication();
  }, []);

  const value = {
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default Context;