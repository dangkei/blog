var crypto = require('crypto'),
    //fs = require('fs'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');

module.exports = function(app){

/* GET home page. */
app.get('/', function(req, res) {
    var page = req.query.p? parseInt(req.query.p) :1;
     Post.getN(null,page,2,function(err,posts,total){
      if(err){
        posts = [];
      } 
      res.render('index', { 
        title: '博客首页',
        user: req.session.user,
        posts : posts,
        page:page,
        isFirstPage:(page-1) ==0,
        isLastPage:((page-1)*10 + posts.length) == total,
        success: req.flash('success').toString(),
        error: req.flash('error').toString() 
      });
    });
});

//route reg
app.get('/reg',checkNotLogin,function(req,res,next){
  res.render('reg',{
  	title:'用户注册',
  	user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString() 
  });
});

app.post('/reg',checkNotLogin,function(req,res){
    var name = req.body.username,
    password = req.body.password,
    password_re = req.body['password-repeat'];
  //检验用户两次输入的密码是否一致
  if (password_re != password) {
    req.flash('error' ,'两次输入的密码不一致!'); 
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
      req.flash('error', err);
      return res.redirect('/');
    }
    if (user) {
      req.flash('error', '用户已存在!');
      return res.redirect('/reg');//返回注册页
    }
    //如果不存在则新增用户
    newUser.save(function (err, user) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/reg');//注册失败返回主册页
      }
      req.session.user = user;//用户信息存入 session
      req.flash('success', '注册成功!');
      res.redirect('/');//注册成功后返回主页
    });
  });
});
//route reg
app.get('/login',checkNotLogin,function(req,res,next){
  res.render('login',{
  		title:'用户登录',
  		user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
});

app.post('/login',checkNotLogin,function(req,res){
//生成密码的 md5 值
  var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
  //检查用户是否存在
  User.get(req.body.username, function (err, user) {
    if (!user) {
      req.flash('error', '用户不存在!');
      return res.redirect('/login');//用户不存在则跳转到登录页
    }
    //检查密码是否一致
    if (user.password != password) {
      req.flash('error', '密码错误!'); 
      return res.redirect('/login');//密码错误则跳转到登录页
    }
    //用户名密码都匹配后，将用户信息存入 session
    req.session.user = user;
    req.flash('success', '登陆成功!');
    res.redirect('/');//登陆成功后跳转到主页
  });
});
//route reg
app.get('/post',checkLogin,function(req,res,next){
     var page = req.query.p? parseInt(req.query.p):1;
     Post.getTen(null,page,function(err,posts){
      if(err){
        posts = [];
      } 
      res.render('post',{title:'发表文章',
      user: req.session.user,
      posts: posts,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
      });
    });
});

app.post('/post',checkLogin,function(req,res){
    var currentUser = req.session.user,
        tags = req.body.tags.split(","),
        post = new Post(currentUser.name, req.body.title,tags, req.body.post);
    post.save(function (err) {
      if (err) {
        req.flash('error', err);  
        return res.redirect('/');
      }
      req.flash('success', '发布成功!');
      res.redirect('/');//发表成功跳转到主页
    });
});
//route logout
app.get('/logout',checkLogin,function(req,res,next){
  req.session.user = null;
  req.flash('success', '登出成功!');
  res.redirect('/');
});


app.get('/upload',checkLogin, function (req, res) {
  res.render('upload', {
    title: '文件上传',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('success').toString(),
  });
});

app.post('/upload', checkLogin,function (req, res) {
  req.flash('success', '文件上传成功!');
  res.redirect('/upload');
});

//存档页面 
app.get('/archive', function (req, res) {
  Post.getArchive(function (err, posts) {
    if (err) {
      req.flash('error', err); 
      return res.redirect('/');
    }
    res.render('archive', {
      title: '存档',
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('success').toString()
    });
  });
});

//浏览标签页面
app.get('/tags',function(req, res){
  Post.getTags(function(err,posts){
    if (err) {
      res.render('error',{error:err});
    }
    console.log('posts= '+posts);
    res.render('tags',{
      title:'标签',
      posts:posts,
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
});

//浏览特定标签页
app.get('/tags/:tag',function(req,res){
  Post.getTag(req.params.tag,function(err,posts){
    if(err){
      res.render('error',{error:err});
    }
    res.render('tag',{
      title:'TAG:' +   req.params.tag,
      posts:posts,
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
});

//搜索结果页面
app.get('/search', function (req, res) {
  Post.search(req.query.keyword, function (err, posts) {
    if (err) {
      // req.flash('error', err); 
      // return res.redirect('/');
      res.render('error',{error:err});
    }
    res.render('search', {
      title: "SEARCH:" + req.query.keyword,
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});
app.get('/u/:name', function (req, res) {
  var page = req.query.p? parseInt(req.query.p):1;
  //检查用户是否存在
  User.get(req.params.name, function (err, user) {
    if (!user) {
      req.flash('error', '用户不存在')
      return res.redirect('/');//用户不存在则跳转到主页
    }
    //查询并返回该用户的所有文章
    var number = 8;
    Post.getN(user.name,page, number, function (err, posts,total) {
      if (err) {
        req.flash('error', err) 
        return res.redirect('/');
      } 
      res.render('user', {
        title: user.name,
        posts: posts,
        page:page,
        isFirstPage:(page-1) ==0,
        isLastPage:((page-1)*number + posts.length) == total,
        user : req.session.user,
        success : req.flash('success').toString(),
        error : req.flash('error').toString()
      });
    });
  }); 
});

app.get('/u/:name/:day/:Guid', function (req, res) {
  Post.getOne(req.params.name, req.params.day, req.params.Guid, function (err, post) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }

    res.render('article', {
      Guid: post.Guid,
      title: "文章",
      post: post,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});

app.post('/u/:name/:day/:Guid', function (req, res) {
  var date = new Date(),
      time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
             date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
  var comment = {
      name: req.body.name,
      email: req.body.email,
      website: req.body.website,
      time: time,
      content: req.body.content
  };
  var newComment = new Comment(req.params.name, req.params.day, req.params.Guid, comment);
  newComment.save(function (err) {
    if (err) {
      req.flash('error', err.statu); 
      return res.redirect('back');
    }
    user: req.session.user,
    req.flash('success','修改成功!');
    res.redirect('back');
  });
});



app.get('/edit/:name/:day/:Guid',checkLogin, function (req, res) {
  var currentUser = req.session.user;
  Post.edit(currentUser.name, req.params.day, req.params.Guid, function (err, post) {
    if (err) {
      req.flash('error', err); 
      return res.redirect('back');
    }
    res.render('edit', {
      title: '编辑',
      post: post,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});


app.post('/edit/:name/:day/:Guid',checkLogin, function (req, res) {
  var currentUser = req.session.user;
  var tags = req.body.tags.split(",");
  Post.update(req.params.Guid, req.body.post, tags ,function (err) {
    var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.Guid);
    if (err) {
      req.flash('error', err); 
      return res.redirect(url);//出错！返回文章页
    }
    req.flash('success','修改成功!');
    res.redirect(url);//成功！返回文章页
  });
});

app.get('/delete/:name/:day/:Guid', checkLogin, function (req,res) {
  var currentUser = req.session.user;
  Post.remove(req.params.Guid, function (err) {
    if (err) {
      req.flash('error', err);
      return res.redirect('back');
      // res.render('error',{
      //   error:err,
      //   message:err.message
      // });
    }
    req.flash('success', '删除成功!');;
    return res.redirect('/');
  });
});

app.use(function (req, res) {
  res.render("404");
});

  function checkLogin(req, res, next) {
    if (!req.session.user) {
      req.flash('error', '未登录!'); 
      res.redirect('/login');
    }
    next();
  }

  function checkNotLogin(req, res, next) {
    if (req.session.user) {
      req.flash('error', '已登录!');  
      res.redirect('back');
    }
    next();
  }
}

// module.exports = function(app){
// 	app.get('/', function(req, res, next) {
// 	  res.render('index', { title: 'Express' });
// 	});	
// };
