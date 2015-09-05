var mongodb = require('mongodb').Db,
	settings = require('../settings'),
	markdown = require('markdown').markdown;

function Post(name, title, post) {
	this.name = name;
	this.title = title;
	this.post = post;
}

module.exports = Post;

//存储一篇文章及其相关信息
Post.prototype.save = function(callback) {
	var date = new Date();
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
		time : time,
		title : this.title,
		post : this.post
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
Post.get = function(name, callback) {
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
				docs.forEach(function(doc) {
					doc.post = markdown.toHTML(doc.post);
				});
				callback(null, docs);
			});
		});
	});
};