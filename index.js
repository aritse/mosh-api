const express = require("express");
const cors = require("cors");
const expresssession = require("express-session");
const socketio = require("socket.io");
const http = require("http");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");
const sharedsession = require("express-socket.io-session");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 8080;

const session = expresssession({ secret: "something secret here", resave: true, saveUninitialized: true, cookie: { maxAge: 7200000 } });
app.use(session);

const io = socketio(server);
io.use(sharedsession(session));
io.on("connect", socket => handleSocket(socket));

const db = require("./models");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true
  })
);

const routes = require("./routes");
app.use(routes);

db.sequelize.sync({ force: false }).then(() => {
  server.listen(PORT, () => console.log(`server is listening on ${PORT}`));
});

function handleSocket(socket) {
  // Accept a login event with user's data
  socket.on("login", function(userdata) {
    socket.handshake.session.userdata = userdata;
    socket.handshake.session.save();
  });

  socket.on("logout", function(userdata) {
    if (socket.handshake.session.userdata) {
      delete socket.handshake.session.userdata;
      socket.handshake.session.save();
    }
  });

  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    socket.join(user.room);

    socket.emit("message", { user: "admin", text: `${user.name}, welcome to room ${user.room}.` });
    socket.broadcast.to(user.room).emit("message", { user: "admin", text: `${user.name} has joined!` });

    io.to(user.room).emit("roomData", { room: user.room, users: getUsersInRoom(user.room) });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message });

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", { user: "Admin", text: `${user.name} has left.` });
      io.to(user.room).emit("roomData", { room: user.room, users: getUsersInRoom(user.room) });
    }
  });
}
