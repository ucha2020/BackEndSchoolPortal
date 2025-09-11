const { DataTypes} = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define(
    'course',
    {   
        name:{
            type:DataTypes.STRING,
            unique:{args:true,msg:'Name already existed'},
            allowNull: false,
            validate :{
                len:{
                    args: [2,100],
                    msg: 'firstName must not be less than two-letter word or more than hundred-latter word',
                },
            },
        },
           
        title:{
            type:DataTypes.STRING,
            unique: true,
            allowNull:false,
            validate: {
                len:{
                    args:[,30],
                    msg: 'lastName must not be more than thirty-latter word',
                },
            },   
        },

        level:{
            type:DataTypes.STRING,
            allowNull: false,    
        },
   
        creditUnit:{
            type:DataTypes.NUMBER,
            allowNull: false,
        },
        url:{
            type:DataTypes.VIRTUAL,
            get(){
                return `/course/${this.id}`;
            }
        }
    }
);

module.exports = Course;