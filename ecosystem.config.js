module.exports = {
  apps: [
    {
      name: "revindex",
      script: "server/server.js",
      cwd: "/home/ubuntu/revindex",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],
};
