const express = require("express");
const productRoutes=require('./routes/ProductRoutes')
const orderRoutes=require('./routes/OrderRoutes')

const UserRoutes=require('./routes/UserRoutes')
const path = require('path'); 
module.exports = async (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'build')));
  app.use("/uploads", express.static("uploads"));
  app.use('/product',productRoutes)
  app.use('/order',orderRoutes)
  app.use('/user',UserRoutes)


  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
  app.get('/order', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
};
