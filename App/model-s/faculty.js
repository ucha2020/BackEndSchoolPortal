const { DataTypes} = require('sequelize');
const sequelize = require('../config/database');

const Faculty = sequelize.define(
    'faculty',
    {
        name:{
            type:DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        
        url:{
            type:DataTypes.VIRTUAL,
            get(){
                return `/faculty/${this.id}`;
            }
        }
    }
)

module.exports = Faculty;