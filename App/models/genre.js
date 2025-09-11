const {DataTypes} = require('sequelize');
const sequelize = require('../config/database');

const genre = sequelize.define(
    'genre',
    {
        id:{
            type:DataTypes.INTEGER,
            allowNull:false,
            primaryKey: true,
        },
        name:{
            type:DataTypes.STRING,
            allowNull: false,
            validate:{
                len:{
                    args:[3,50],
                    msg: "the genre's name lenght is out of range 3-5 words",
                },
            },   
        },
        url:{
            type:DataTypes.VIRTUAL,
            get(){
                return `/catalog/genre/${this.id}`;
            },
        },
    }
  );

module.exports = genre;

