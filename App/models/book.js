const { DataTypes} = require('sequelize');
const sequelize = require('../config/database');
  const book = sequelize.define(
    'book',
    {
        id:{
            type:DataTypes.INTEGER,
            allowNull:false,
            primaryKey: true,
        },
        title:{
            type:DataTypes.STRING,
            allowNull: false,
        },
        summary:{
            type:DataTypes.STRING,
            allowNull: false, 
        },
        isbn:{
            type:DataTypes.STRING,
            allowNull:false,
        },
        url:{
            type:DataTypes.VIRTUAL,
            get(){
               return `/catalog/books/${this.id}`; 
            },
        },
    }
  )

  module.exports = book; 