import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";

async function main() {
  // open the database file
  const db = await open({
    filename: "chat.db",
    driver: sqlite3.Database,
  });

  // create our 'messages' table (you can ignore the 'client_offset' column for now)
  await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_offset TEXT UNIQUE,
      content TEXT
  );
`);

  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    connectionStateRecovery: {
      maxDisconnectionDuration: 180000,
    },
  });

  const __dirname = dirname(fileURLToPath(import.meta.url));

  io.on("connection", async (socket) => {
    if (!socket.recovered) {
      try {
        await db.each(
          "SELECT id, content FROM messages WHERE id > ?",
          [socket.handshake.auth.serverOffset || 0],
          (_err, row) => {
            socket.emit("chat message", row.content, row.id);
          }
        );
      } catch (error) {
        console.error(error);
      }
    }

    socket.on("send message", async (msg, clientOffset, callback) => {
      let result;

      try {
        result = await db.run(
          "INSERT INTO messages (client_offset, content) VALUES (?, ?)",
          clientOffset,
          msg
        );
      } catch (error) {
        if (error.errno === 19) {
          callback();
        } else {
          console.error(error);
        }
        return;
      }
      io.emit("send message", msg, result.lastID);
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });

  app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "index.html"));
  });

  server.listen(3000, () => console.log("running at port 3000"));
}

main();
