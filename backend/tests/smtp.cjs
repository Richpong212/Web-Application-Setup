const net = require("node:net");
const { appConfig } = require("../build/config/index.config");

// A local SMTP inbox captures real Nodemailer delivery without sending external mail.
const createInbox = async () => {
  const messages = [];
  const sockets = new Set();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.setEncoding("utf8");
    socket.write("220 localhost ESMTP test inbox\r\n");
    let buffer = "";
    let readingMessage = false;

    socket.on("data", (chunk) => {
      buffer += chunk;
      while (buffer.includes("\r\n")) {
        if (readingMessage) {
          const end = buffer.indexOf("\r\n.\r\n");
          if (end < 0) return;
          messages.push(buffer.slice(0, end));
          buffer = buffer.slice(end + 5);
          readingMessage = false;
          socket.write("250 Message accepted\r\n");
          continue;
        }

        const end = buffer.indexOf("\r\n");
        const command = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);

        if (/^(EHLO|HELO)/i.test(command)) socket.write("250 localhost\r\n");
        else if (/^DATA/i.test(command)) {
          readingMessage = true;
          socket.write("354 Send message\r\n");
        } else if (/^QUIT/i.test(command)) socket.end("221 Goodbye\r\n");
        else socket.write("250 OK\r\n");
      }
    });
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  appConfig.smtp.host = "127.0.0.1";
  appConfig.smtp.port = server.address().port;

  return {
    messages,
    close: () =>
      new Promise((resolve) => {
        for (const socket of sockets) socket.destroy();
        server.close(resolve);
      }),
  };
};

module.exports = { createInbox };
