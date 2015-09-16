var async = require('async');

async.waterfall([
	function(callback) {
		console.log('start');
		var one = 1;
		console.log('第一个函数：'+one);
		callback(null, one);
	},
	function(canshu, callback) {
		canshu = 2;
		console.log('第二个函数：'+canshu);
		callback(null, canshu);
	},
	function(canshu, callback) {
		console.log('第三个函数：'+canshu);
		callback(null, canshu);
	}
], function(err, result) {
	console.log('err=>' + err);
	console.log('result=>' + result);
});
