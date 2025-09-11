const {Sequelize} = require('sequelize');
const {SqliteDialect} = require('@sequelize/sqlite3');
const n =76;
const sequelize = new Sequelize({
    dialect : 'sqlite',
    storage : '../sequelize.sqlite3',
});

module.exports = sequelize;