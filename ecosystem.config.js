module.exports = {
  apps: [{
    name: "viel-backend",
    script: "dist/server.js",
    env: {
      NODE_ENV: "production"
    },
    env_file: ".env"
  }],
};