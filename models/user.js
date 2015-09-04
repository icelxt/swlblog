var mongodb = require('mongodb').Db;
var settings = require('../settings');
function User(user) {
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
}
module.exports = User;

//存储用户信息
User.prototype.save = function(callback) {
	//要存入数据库的用户文档
	var user = {
		name:this.name,
		password:this.password,
		email:this.email
	}
	//打开数据库
	mongodb.connect(settings.url, function(err, db) {
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
	});
};

//读取用户文档
User.get = function(name, callback) {
	mongodb.connect(settings.url, function(err, db){
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
	});
};