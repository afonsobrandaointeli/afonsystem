require('dotenv').config();

module.exports.datastores = {
  default: {
    adapter: 'sails-postgresql',
    url: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  },
};
