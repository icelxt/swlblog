var mongodb = require('mongodb').Db,
	settings = require('../settings');

function Pv(pv) {
	this.ip = pv.ip;
}

module.exports = Pv;

//储存一条留言信息
Pv.prototype.save = function(callback) {
	var date = new Date();
	var localTime = date.getTime();
	var localOffset = date.getTimezoneOffset() * 60000;
	var utc = localTime + localOffset;
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
	var pv = {
		ip:this.ip,
		time:time
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
	console.time('getAll');
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
	console.timeEnd('getAll');
};
