var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js');
var express = require('express');
var app = express();
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
     Post.get(null,function(err,posts){
      if(err){
        posts = [];
      } 
      res.render('index', { title: '博客首页',
      user: app.locals.user,
      posts : posts,
      success: app.locals.success,
      error: app.locals.error });
    });
});

//route reg
router.get('/reg',checkNotLogin,function(req,res,next){
  res.render('reg',{
  	title:'用户注册',
  	user: app.locals.user,
    success: app.locals.success,
    error: app.locals.error});
});

router.post('/reg',checkNotLogin,function(req,res){
    var name = req.body.username,
    password = req.body.password,
    password_re = req.body['password-repeat'];
  //检验用户两次输入的密码是否一致
  if (password_re != password) {
    app.locals.error = '两次输入的密码不一致!'; 
    return res.redirect('/reg');//返回注册页
  }
  //生成密码的 md5 值
  var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
  var newUser = new User({
      name: name,
      password: password,
      email: req.body.email
  });

  //检查用户名是否已经存在 
  User.get(newUser.name, function (err, user) {
    if (err) {
      app.locals.error = err;
      return res.redirect('/');
    }
    if (user) {
      app.locals.error= '用户已存在!';
      return res.redirect('/reg');//返回注册页
    }
    //如果不存在则新增用户
    newUser.save(function (err, user) {
      if (err) {
        app.locals.error= err;
        return res.redirect('/reg');//注册失败返回主册页
      }
      req.session.user = user;//用户信息存入 session
      app.locals.success= '注册成功!';
      res.redirect('/');//注册成功后返回主页
    });
  });
});
//route reg
router.get('/login',checkNotLogin,function(req,res,next){
  res.render('login',{
  		title:'用户登录',
  		user: app.locals.user,
      success: app.locals.success,
      error: app.locals.error});
});

router.post('/login',checkNotLogin,function(req,res){
//生成密码的 md5 值
  var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
  //检查用户是否存在
  User.get(req.body.username, function (err, user) {
    if (!user) {
      app.locals.error = '用户不存在!'; 
      return res.redirect('/login');//用户不存在则跳转到登录页
    }
    //检查密码是否一致
    if (user.password != password) {
      app.locals.error= '密码错误!'; 
      return res.redirect('/login');//密码错误则跳转到登录页
    }
    //用户名密码都匹配后，将用户信息存入 session
    app.locals.user = user;
    app.locals.success= '登陆成功!';
    res.redirect('/');//登陆成功后跳转到主页
  });
});
//route reg
router.get('/post',checkLogin,function(req,res,next){
     Post.get(null,function(err,posts){
      if(err){
        posts = [];
      } 
      res.render('post',{title:'发表文章',
      user: app.locals.user,
      posts: posts,
      success: app.locals.success,
      error: app.locals.error});
    });
});

router.post('/post',checkLogin,function(req,res){
    var currentUser = app.locals.user,
        post = new Post(currentUser.name, req.body.title, req.body.post);
    post.save(function (err) {
      if (err) {
        app.locals.error = err; 
        return res.redirect('/');
      }
      app.locals.success = '发布成功!';
      res.redirect('/');//发表成功跳转到主页
    });
});
//route logout
router.get('/logout',checkLogin,function(req,res,next){
  app.locals.user = null;
  app.locals.success = '登出成功';
  res.redirect('/');
});


router.get('/upload',checkLogin, function (req, res) {
  res.render('upload', {
    title: '文件上传',
    user: app.locals.user,
    success: app.locals.success,
    error: app.locals.error
  });
});

router.post('/upload', checkLogin,function (req, res) {
  app.locals.success = '文件上传成功!';
  res.redirect('/upload');
});

  function checkLogin(req, res, next) {
    if (!app.locals.user) {
      app.locals.error = '未登录!'; 
      res.redirect('/login');
    }
    next();
  }

  function checkNotLogin(req, res, next) {
    if (app.locals.user) {
      app.locals.error = '已登录!'; 
      res.redirect('back');
    }
    next();
  }


module.exports = router;
// module.exports = function(app){
// 	app.get('/', function(req, res, next) {
// 	  res.render('index', { title: 'Express' });
// 	});	
// };
