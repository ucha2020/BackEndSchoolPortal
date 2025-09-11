const { DataTypes} = require('sequelize');
const sequelize = require('../config/database');
const author = sequelize.define(
    'author',
    {   
        id:{
            type:DataTypes.INTEGER,
            allowNull:false,
            primaryKey: true,
        },
        firstName:{
            type:DataTypes.STRING,
            allowNull: false,
            validate :{
                len:{
                    args: [,50],
                    msg: 'firstName must not be more than fifty-latter word',
                },
            },
        },
        
        lastName:{
            type:DataTypes.STRING,
            allowNull:false,
            validate: {
                len:{
                    args:[,50],
                    msg: 'lastName must not be more than fifty-latter word',
                },
            },
        },
        dateOfBirth:{type: DataTypes.STRING},
        dateOfDeath:{type: DataTypes.DATE},
        fullName: {
            type: DataTypes.VIRTUAL,
            get(){
                return `${this.firstName} ${this.lastName}`;
            },
            set(value){
                throw new Error('You are not allowed to set fullName');
            },
        },
        url:{
            type:DataTypes.VIRTUAL,
            get(){
                return `/catalog/author/${this.id}`;
            }
        }
    }
);

module.exports = author;