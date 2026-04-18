module.exports = {
  apps: [
    {
      name: 'canteeners-backend',

      script: 'src/main.ts',

      exec_mode: 'fork',

      autorestart: true,
      watch: false,
      max_memory_restart: '1G',

      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Logging
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
