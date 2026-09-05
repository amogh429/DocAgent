const connection = process.env.REDIS_URL
  ? (() => {
      const { hostname, port, password } = new URL(process.env.REDIS_URL);
      return {
        host: hostname,
        port: Number(port),
        password,
        tls: {}
      };
    })()
  : { host: "127.0.0.1", port: 6379 };

export default connection;
