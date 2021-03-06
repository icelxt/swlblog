var mongodb = require('mongodb').Db,
	settings = require('../settings')/*,
	markdown = require('markdown').markdown*/;

function Post(name, head, title, tags, post) {
	this.name = name;
	this.head = head;
	this.title = title;
	this.tags = tags;
	this.post = post;
}

module.exports = Post;

//存储一篇文章及其相关信息
Post.prototype.save = function(callback) {
	var date = new Date();
	var localTime = date.getTime();
	var localOffset = date.getTimezoneOffset() * 60000;
	var utc = localTime + localOffset; //得到国际标准时间
	var offset = 8;
	var calctime = utc + (3600000*offset);
	date = new Date(calctime);
	var time = {
		date:date,
		year:date.getFullYear(),
		month:date.getFullYear() + "-" + (date.getMonth() + 1),
		day:date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
		minute:date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	}
	//要存入数据库的文档
	var post = {
		name : this.name,
		head : this.head,
		time : time,
		title : this.title,
		tags : this.tags,
		post : this.post,
		//comments:[],
		pv:0
	};
	//打开数据库
	mongodb.connect(settings.url, function(err, db) {
		if(err) {
			return callback(err);
		}
		//读取posts集合
		db.collection('posts', function(err, collection) {
			if(err) {
				db.close();
				return callback(err);
			}
			//将文档插入posts集合
			collection.insert(post, {
				safe:true
			}, function(err) {
				db.close();
				if(err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

//读取文章及其相关信息
Post.getAll = function(name, callback) {
	mongodb.connect(settings.url, function(err, db) {
		db.collection('posts', function(err, collection) {
			if(err) {
				db.close();
				return callback(err);
			}
			var query = {};
			if(name) {
				query.name = name;
			}
			//根据query对象查询文章
			collection.find(query).sort({
				time:-1
			}).toArray(function(err, docs) {
				db.close();
				if(err) {
					return callback(err);
				}
				/*docs.forEach(function(doc) {
					doc.post = markdown.toHTML(doc.post);
				});*/
				callback(null, docs);
			});
		});
	});
};

//分页
Post.getNum = function(name, page, num, callback) {
	mongodb.connect(settings.url, function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				db.close();
				return callback(err);
			}
			var query = {};
			if(name) {
				query.name = name;
			}
			//使用count返回特定查询的文档数total
			collection.count(query, function(err, total) {
				//根据query对象查询，并跳过前(page-1)*num个结果，返回之后的10个结果
				collection.find(query, {
					skip:(page - 1) * num,
					limit:num
				}).sort({
					time:-1
				}).toArray(function(err, docs) {
					db.close();
					if(err) {
						return callback(err);
					}
					/*docs.forEach(function(doc) {
						doc.post = markdown.toHTML(doc.post);
					});*/
					//列表中摘要,只有首页这样显示
					if(num == 5){
						docs.forEach(function(doc) {
							doc.post = doc.post.replace(/<[^>]*>/g, "");
							doc.post = doc.post.substr(0, 100) + " .....";
						});
					}
					callback(null, docs, total);
				});
			});
		});
	});
};

//获取一篇文章
Post.getOne = function(name, day, title, callback) {
	//打开数据库
	mongodb.connect(settings.url, function(err, db) {
		if(err) {
			return callback(err);
		}
		//读取posts集合
		db.collection('posts', function(err, collection) {
			if(err) {
				db.close();
				return callback(err);
			}
			//根据用户名，发表日期及文章名进行查询
			collection.findOne({
				"name":name,
				"time.day":day,
				"title":title
			}, function(err, doc) {
				if(err) {
					db.close();
					return callback(err);
				}
				//解析markdown为html
				//doc.post = markdown.toHTML(doc.post);
				if(doc) {
					//每访问一次，pv++
					collection.update({
						"name":name,
						"time.day":day,
						"title":title
					}, {
						$inc:{"pv":1}
					}, function(err) {
						db.close();
						if(err) {
							return callback(err);
						}
					});
					/*doc.post = markdown.toHTML(doc.post);*/
					/*doc.comments.forEach(function(comment) {
						comment.content = markdown.toHTML(comment.content);
					});*/
				}
				callback(null, doc);
			});
		});
	});
};

//返回原始发表的内容（markdown格式）
Post.edit = function(name, day, title, callback) {
	mongodb.connect(settings.url, function(err, db) {
		if(err) {
			return callback(err);
		}
		//读取posts集合
		db.collection('posts', function(err, collection) {
			if(err) {
				db.close();
				return callback(err);
			}
			//根据用户名、发表日期及文章名进行查询
			collection.findOne({
				"name":name,
				"time.day":day,
				"title":title
			}, function(err, doc) {
				db.close();
				if(err) {
					return callback(err);
				}
				callback(null, doc);
			});
		});
	});
};

//更新一篇文章及其相关信息
Post.update = function(name, day, title, post, callback) {
	mongodb.connect(settings.url, function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				db.close();
				return callback(err);
			}
			collection.update({
				"name":name,
				"time.day":day,
				"title":title
			}, {
				$set:{post:post}
			}, function(err) {
				db.close();
				if(err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

//删除一篇文章
Post.remove = function(name, day, title, callback) {
	mongodb.connect(settings.url, function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				db.close();
				return callback(err);
			}
			collection.remove({
				"name":name,
				"time.day":day,
				"title":title
			}, {
				w:1
			}, function(err) {
				db.close();
				if(err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

//返回所有文章存档信息
Post.getArchive = function(callback) {
	mongodb.connect(settings.url, function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				db.close();
				return callback(err);
			}
			//返回只包含name、time、title属性的文档组成的存档数组
			collection.find({}, {
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time:-1
			}).toArray(function(err, docs) {
				db.close();
				if(err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

//返回所有标签
Post.getTags = function(callback) {
	mongodb.connect(settings.url, function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				db.close();
				return callback(err);
			}
			//distinct 用来找出给定键的所有不同值，繁琐：消除重复行
			collection.distinct('tags', function(err, docs) {
				db.close();
				if(err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

//返回含有特定标签的所有文章
Post.getTag = function(tag, callback) {
	mongodb.connect(settings.url, function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				db.close();
				return callback(err);
			}
			//查询所有含有tags数组内包含tag的文档，并返回只含有name、time、title组成的数组
			collection.find({
				"tags":tag
			}, {
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time:-1
			}).toArray(function(err, docs) {
				db.close();
				if(err) {
					return callback(err);
				}
				console.log("message:"+docs);
				callback(null, docs);
			});
		});
	});
};

//返回含有特定标签的文章--分页
Post.getTagNum = function(tag, num, callback) {
	mongodb.connect(settings.url, function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				db.close();
				return callback(err);
			}
			//查询所有含有tags数组内包含tag的文档，并返回只含有name、time、title组成的数组
			collection.find({
				"tags":tag
			}, {
				"name":1,
				"time":1,
				"title":1,
				skip:(page - 1) * num,
				limit:num
			}).sort({
				time:-1
			}).toArray(function(err, docs) {
				db.close();
				if(err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

//返回通过标题关键字查询的所有文章信息
Post.search = function(keyword, callback) {
	mongodb.connect(settings.url, function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				db.close();
				return callback(err);
			}
			var pattern = new RegExp(keyword, "i");
			collection.find({
				"title":pattern
			}, {
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time:-1
			}).toArray(function(err, docs) {
				db.close();
				if(err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};