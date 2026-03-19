let io;

module.exports = {
    init: (httpServer) => {
        const { Server } = require("socket.io");
        io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        return io;
    },
    getIO: () => {
        if (!io) {
            console.log("Socket.io not initialized yet.");
            return null;
        }
        return io;
    }
};
