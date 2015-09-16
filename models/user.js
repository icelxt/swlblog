var mongodb = require('mongodb').Db;
var settings = require('../settings');
var crypto = require('crypto');
var async = require('async');

function User(user) {
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
}
module.exports = User;

//存储用户信息
User.prototype.save = function(callback) {
	//要存入数据库的用户文档
	var md5 = crypto.createHash('md5'),
		email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
		head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
	var user = {
		name:this.name,
		password:this.password,
		email:this.email,
		head:head
	}
	//打开数据库
	/*mongodb.connect(settings.url, function(err, db) {
		if(err) {
			return callback(err);//错误，返回err信息
		}
		//读取users集合
		db.collection('users', function(err, collection) {
			if(err) {
				db.close();
				return callback(err);//错误，返回err信息
			}
			//将用户数据插入users集合
			collection.insert(user, {
				safe:true
			}, function(err, user) {
				db.close();
				if(err) {
					return callback(err);
				}
				callback(null, user[0]);//成功！err为空，并返回存储后的用户文档
			});
		});
	});*/
	async.waterfall([
		function(callback) {
			mongodb.connect(settings.url, function(err, db) {
				callback(err, db);
			});
		}, function(db, callback) {
			db.collection('users', function(err, db, collection) {
				callback(err, db, collection);
			});
		}, function(db, collection, callback) {
			collection.insert(user, {
				safe:true
			}, function(err, user) {
				callback(err, db, user);
			});
		}
		], function(err, db, user) {
			db.close();
			callback(err, user[0]);
		});
};

//读取用户文档
User.get = function(name, callback) {
	/*mongodb.connect(settings.url, function(err, db){
		if(err) {
			return callback(err);
		}
		db.collection('users', function(err, collection) {
			if(err) {
				db.close();
				return callback(err);
			}
			//查找用户名（name键）值为name一个文档
			collection.findOne({
				name:name
			},function(err, user) {
				db.close();
				if(err) {
					return callback(err);
				}
				callback(null, user);//成功！返回查询用户信息
			});
		});
	});*/
	async.waterfall([
		function(cb) {
			mongodb.connect(settings.url, function(err, db) {
				cb(err, db);
			});
		},
		function(db, cb) {
			db.collection('users', function(err, collection) {
				cb(err, db, collection);
			});
		},
		function(db, collection, cb) {
			collection.findOne({
				name:name
			}, function(err, user) {
				cb(err, db, user);
			});
		}
	], function(err, db, user) {
		db.close();// 此处db并没有关闭，问题？有一个属性：openCalled检测数据库是否已經被打开
		callback(err, user);
	});
};