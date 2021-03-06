var mongodb = require('./db'),
    markdown = require('markdown').markdown;

function Post(name, title,tags, post) {
  this.name = name;
  this.title = title;
  this.tags = tags;
  this.post = post;
  this.comments = [];
}
module.exports = Post;
//存储一篇文章及其相关信息
Post.prototype.save = function(callback) {
  var date = new Date();
  //存储各种时间格式，方便以后扩展 
  var time = {
      date: date,
      year : date.getFullYear(),
      month : date.getFullYear() + "-" + (date.getMonth() + 1),
      day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
      minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
      date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) 
  }
  //要存入数据库的文档
  var post = {
  	  Guid: Guid(),
      name: this.name,
      time: time,
      title: this.title,
      tags:this.tags,
      post: this.post,
      comments:[],
      pv:0
  };
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //将文档插入 posts 集合
      collection.insert(post, {
        safe: true
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);//失败！返回 err
        }
        callback(null);//返回 err 为 null
      });
    });
  });
};

//获取一篇文章
//Post.getOne ：根据用户名、发表日期及文章名精确获取一篇文章
Post.getOne = function(name, day, Guid, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据用户名、发表日期及文章名进行查询
      collection.findOne({
        "name": name,
        "time.day": day,
        "Guid": Guid
      }, function (err, doc) {      	
        if (err) {
            mongodb.close();
            return callback(err);
        }
        //每访问一次,pv增加1
        if(doc){
        	collection.update({
        		"name":name,
        		"time.day":day,
        		"Guid":Guid
        	},{
        		$inc:{"pv":1}
        	},function(err){
        		mongodb.close();
        		if(err){
        			return callback(err);
        		}
        	});
        
        //解析 markdown 为 html
      
		  doc.post = markdown.toHTML(doc.post);
		  if(doc.comments){
		  	doc.comments.forEach(function (comment) {
		    	comment.content = markdown.toHTML(comment.content);
		  	});
		  }
		}
        callback(null, doc);//返回查询的一篇文章
      });
    });
  });
};
//读取文章及其相关信息
Post.getTen = function(name, page, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      //使用 count 返回特定查询的文档数 total
      collection.count(query, function (err, total) {
        //根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
        collection.find(query, {
          skip: (page - 1)*10,
          limit: 10
        }).sort({
          time: -1
        }).toArray(function (err, docs) {
          mongodb.close();
          if (err) {
            return callback(err);
          }
          //解析 markdown 为 html
          docs.forEach(function (doc) {
            doc.post = markdown.toHTML(doc.post);
          });  
          callback(null, docs, total);
        });
      });
    });
  });
};

// 得到N条记录
//读取文章及其相关信息
Post.getN = function(name, page, number, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      //使用 count 返回特定查询的文档数 total
      collection.count(query, function (err, total) {
        //根据 query 对象查询，并跳过前 (page-1)*N 个结果，返回之后的 N 个结果
        collection.find(query, {
          skip: (page - 1)*number,
          limit: number
        }).sort({
          time: -1
        }).toArray(function (err, docs) {
          mongodb.close();
          if (err) {
            return callback(err);
          }
          //解析 markdown 为 html
          docs.forEach(function (doc) {
            doc.post = markdown.toHTML(doc.post);
          });  
          callback(null, docs, total);
        });
      });
    });
  });
};

//返回原始发表的内容（markdown 格式）
Post.edit = function(name, day, Guid, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据用户名、发表日期及文章名进行查询
    collection.findOne({
        "name": name,
        "time.day": day,
        "Guid": Guid
      }, function (err, doc) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, doc);//返回查询的一篇文章（markdown 格式）
      });
    });
  });
};

//更新一篇文章及其相关信息
Post.update = function(Guid, post, tags, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //更新文章内容
      collection.update({
        "Guid": Guid
      }, {
        $set: {
          post: post,
          tags:tags,
        }
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};

Post.remove = function(Guid, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据用户名、日期和标题查找并删除一篇文章
      collection.remove({
        "Guid": Guid
      }, {
        w: 1
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null,{});
      });
    });
  });
};

//返回所有文章存档信息
Post.getArchive = function(callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //返回只包含 name、time、title 属性的文档组成的存档数组
      collection.find({}, {
      	"Guid": 1,
        "name": 1,
        "time": 1,
        "title": 1
      }).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};
//返回通过标题关键字查询的所有文章信息
Post.search = function(keyword, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var pattern = new RegExp(keyword, "i");
      collection.find({
        "title": pattern
      }, {
      	"Guid": 1,
        "name": 1,
        "time": 1,
        "title": 1
      }).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
         return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};

//取得所有的标签分类
Post.getTags =function(callback){
  mongodb.open(function(err,db){
    if(err){
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      if (err) {
        mongodb.close();
        callback(err);
      };
      //distinct 找出不重复的值
      collection.distinct('tags',function(err,docs){
        mongodb.close();
        if(err){
          return callback(err);
        }
        callback(null,docs);
      });
    });
  });
};

//取得包含指定标签的所有文档
Post.getTag = function(tag,callback){
  mongodb.open(function(err,db){
    if(err){
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      if(err){
        return callback(err);
      }
      collection.find({
        "tags":tag
      },{
        "Guid":1,
        "name":1,
        "time":1,
        "title":1
      }).sort({
          time:-1
        }).toArray(function(err,docs){
          mongodb.close();
          if (err) {
            return callback(err);
          }
          callback(null,docs);
      });  
    });
  });
};


//生成一个Guid
function Guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}