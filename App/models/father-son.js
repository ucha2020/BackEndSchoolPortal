const { DataTypes} = require('sequelize');
const sequelize = require('../config/database');

const Father =  sequelize.define(
    'Father',
    {
        firstName:{
            type:DataTypes.STRING,
            allowNull: false,
        },
        lastName:{
            type:DataTypes.STRING,
            allowNull: false, 
        },
        
        url:{
            type:DataTypes.VIRTUAL,
            get(){
               return `/catalog/books/${this.id}`; 
            },
        },
    }
  )

  const Son =  sequelize.define(
    'Son',
    {
        firstName:{
            type:DataTypes.STRING,
            allowNull: false,
        },
        lastName:{
            type:DataTypes.STRING,
            allowNull: false, 
        },
        
        url:{
            type:DataTypes.VIRTUAL,
            get(){
               return `/catalog/books/${this.id}`; 
            },
        },
    }
  )
  
Father.hasMany(Son);
Son.belongsTo(Father);

module.exports = [Father,Son];