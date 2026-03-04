import React, { useState, useEffect, createContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const ChatContext = createContext();

const backendUrl = import.meta.env.VITE_BACKEND_URL || ""; // fallback to same origin if not defined

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
         // connect right away using the fetched user (don't rely on stale state)
         connectSocket(data.user);
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
    if (!user) {
      console.warn("connectSocket called without user");
      return; // nothing to do if we don't have a user id
    }

    if (socket) {
      console.debug("disconnecting previous socket");
      socket.disconnect();
    }

    console.debug("attempting socket connection to", backendUrl, "for user", user._id);
    const newSocket = io(backendUrl, {
      withCredentials: true,
      // `auth` is supported by socket.io >=4 and is more reliable than query
      auth: {
        userId: user._id,
      },
      // keep query for backwards compatibility
      query: {
        userId: user._id,
      },
    });

    newSocket.on("connect", () => {
      console.log("socket connected with id", newSocket.id);
    });
    newSocket.on("connect_error", (err) => {
      console.error("socket connect error:", err);
    });
    newSocket.on("disconnect", (reason) => {
      console.log("socket disconnected:", reason);
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
        // immediately establish socket with returned user object
        connectSocket(res.data.user);
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

  // whenever authUser becomes available we need to (re)connect the socket
  useEffect(() => {
    if (authUser) {
      connectSocket(authUser);
    } else {
      // user logged out / not authenticated anymore
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setOnlineUsers([]);
    }
  }, [authUser]);

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