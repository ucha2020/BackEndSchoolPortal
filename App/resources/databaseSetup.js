const {Sequelize, DataTypes, JSON} = require('sequelize');
const sequelize = new Sequelize('mysql','root','mysql2020ok',{
    host: 'localhost',
    dialect: 'mysql'
  });
/*
  const User = sequelize.define(
    'User',
    {
      firstName: {
        type:DataTypes.STRING,
        allowNull: false,
      },
      lastName:{
        type: DataTypes.STRING,
        //allowNull defaults to true
      },
      favoriteColor:{
        type: DataTypes.TEXT,
        defaultValue: 'green',
      },
      age: DataTypes.INTEGER,
      cash:{
        type: DataTypes.INTEGER,
        allowNull: false,
      } 
    },
  )
  
  const Marketer = sequelize.define(
    'Marketer',
    {
      name:{
        type :DataTypes.STRING,
        allowNull: false,
      }, 
      age:{
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      activated:{
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      }, 
    },
  );

(async function main() {
    
    /* try{
      await sequelize.authenticate()
      console.log('Connection established successfully.')
    } catch(error){
      console.log('Something went wrong in connecting to database', error);
    }  
    
    const promis =  sequelize.close();   
    */

    /* await User.sync({force: true});
    await Marketer.sync();
    const Moses = User.build({
        firstName: 'Moses',
        lastName: "Anakwe",
        cash: 770,
    });
    console.log(Moses.toJSON());
    await Moses.save();
    console.log(Moses.toJSON());

    const James = await Marketer.create({
        name: 'James',
        age: 35,
    });
    console.log(James.activated, Moses.cash);
    console.log(Moses);
    James.activated = false;
    James.save().then(()=>console.log(James.toJSON()))
    console.log(James.toJSON());
    //console.log(JSON().stringify(James,null,4 ));
    
    })();

//setTimeout(()=> closeConnection(),20000);
*/
module.exports = sequelize;