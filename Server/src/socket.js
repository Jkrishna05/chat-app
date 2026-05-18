    let io;
let onlineUsers = {};

const setIo = (socketIo) => {
  io = socketIo;
};

export { io, onlineUsers, setIo };