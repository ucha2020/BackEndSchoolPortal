const { DataTypes} = require('sequelize');
const sequelize = require('../config/database');

  const bookInstance = sequelize.define(
    'bookInstance',
    {
        id:{
            type:DataTypes.INTEGER,
            allowNull:false,
            primaryKey: true,
        },
        imprint:{
            type:DataTypes.STRING,
            allowNull: false,
        },
        status:{
            type:DataTypes.ENUM('Available','Maintenance','Loaned','Reserved'),
            defaultValue: 'maintenance',
            allowNull: false,
        },
        url:{
            type:DataTypes.VIRTUAL,
            get(){
                return `/catalog/bookinstance/${this.id}`;
            },
            set(val){
                throw new Error('Not allowed to set this value');
            },
        },
    }
  )

  module.exports = bookInstance;