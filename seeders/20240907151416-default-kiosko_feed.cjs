const bcrypt = require("bcrypt");
require("dotenv").config();

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    const [user] = await queryInterface.bulkInsert('user', [{
      username: process.env.KIOSKO_USERNAME,
      email: process.env.KIOSKO_EMAIL,
      password: encrypt_password(process.env.KIOSKO_PASSWORD),
      created_at: new Date()
    }], { returning: true });

    const topics = await queryInterface.bulkInsert('topic', [
      { name: 'Colima', created_at: new Date()},
      { name: 'E-commerce', created_at: new Date()},
      { name: 'Retail', created_at: new Date()},
      { name: 'Services', created_at: new Date()},
      { name: 'Stock', created_at: new Date()}
    ], { returning: true });

    const topicsArray = topics.map(topic => ({
      id: topic.id,
      name: topic.name
    }));

    await queryInterface.bulkInsert('feed', [{
      name: 'Kiosko Feed',
      topics: JSON.stringify(topicsArray),
      is_favorite: false,
      is_public: true,
      user_id: user.id,
      created_at: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {

    await queryInterface.bulkDelete('feed', { name: 'Kiosko Feed' }, {});

    await queryInterface.bulkDelete('topic', {
      name: { [Sequelize.Op.in]: ['Colima', 'E-commerce', 'Retail', 'Services', 'Stock'] }
    }, {});

    await queryInterface.bulkDelete('user', { email: 'kiosko@kiosko.com' }, {});
  }
};

function encrypt_password(password) {
  return bcrypt.hashSync(password, 10);
}
