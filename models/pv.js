var mongodb = require('mongodb').Db,
	settings = require('../settings');

function Pv(pv) {
	this.ip = pv.ip;
}

module.exports = Pv;

//储存一条留言信息
Pv.prototype.save = function(callback) {
	var pv = {
		ip:this.ip
	}
	mongodb.connect(settings.url, function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('pvs', function(err, collection) {
			if(err) {
				db.close();
				return callback(err);
			}
			//将访问者ip插入pvs集合
			collection.insert(pv, {
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

//获取访问统计
Pv.getAll = function(callback) {
	mongodb.connect(settings.url, function(err, db) {
		db.collection('pvs', function(err, collection) {
			if(err) {
				db.close();
				return callback(err);
			}
			//db.userInfo.find({ip: {$exists: true}}).count();
			collection.find().count(function(err, pvs) {
				db.close();
				if(err) {
					return callback(err);
				}
				console.log('pvs getAll : ' + pvs);
				callback(null, pvs);
			});
		});
	});
};
