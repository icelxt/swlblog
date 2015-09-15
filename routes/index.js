/*var express = require('express');
var router = express.Router();*/

/* GET home page. */
/*router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;*/
var crypto = require('crypto'),
	User = require('../models/user.js'),
	Post = require('../models/post.js'),
	Comment = require('../models/comment.js'),
	Pv = require('../models/pv.js');
module.exports = function(app) {
	app.get('/', function(req, res) {
		var ip = getClientIp(req),
			pv = new Pv({ip:ip});
		pv.save(function(err) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
		});
		//判断是否是第一页，并把请求的页数转换成number类型
		var page = req.query.p ? parseInt(req.query.p) : 1;
		var num = 5;
		Post.getNum(null, page, num, function(err, posts, total) {
			if(err) {
				posts = [];
			}
			res.render('index', {
				title:'主页',
				pvs:getVista(),
				posts:posts,
				page:page,
				isFirstPage:(page - 1) == 0,
				isLastPage:((page - 1) * num + posts.length) == total,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	app.get('/reg', checkLogin);
	app.get('/reg', function(req, res) {
		res.render('reg', {
			title:'注册',
			pvs:getVista(),
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.post('/reg', checkLogin);
	app.post('/reg', function(req, res) {
		var name = req.body.name,
			password = req.body.password,
			password_re = req.body['password-repeat'];
		//检验用户两次输入的密码是否一致
		if(password != password_re) {
			req.flash('error', '两次输入的密码不一致！');
			return res.redirect('/reg');//返回注册页
		}
		//生产密码的md5值
		var md5 = crypto.createHash('md5');
		password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name:name,
			password:password,
			email:req.body.email
		});
		//检查用户名是否已经存在
		User.get(newUser.name, function(err, user) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			if(user) {
				req.flash('error', '用户名已存在！');
				return res.redirect('/reg');
			}
			//如果不存在则新增用户
			newUser.save(function(err, user){
				if(err) {
					req.flash('error', err);
					return res.redirect('/reg');
				}
				req.session.user = user;//用户信息存入session
				req.flash('success', '注册成功！');
				res.redirect('/');
			});
		});
	});
	app.get('/login', checkNotLogin);
	app.get('/login', function(req, res) {
		res.render('login', {title:'登陆',pvs:getVista(),user:req.session.user,success:req.flash('success').toString(),error:req.flash('error').toString()});
	});
	app.post('/login', checkNotLogin);
	app.post('/login', function(req, res) {
		//生成密码的md5值
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		//检查用户是否存在
		User.get(req.body.name, function(err, user) {
			if(!user) {
				req.flash('error', '用户不存在！');
				return res.redirect('/login');
			}
			//检查密码是否一致
			if(user.password != password) {
				req.flash('error', '密码错误！');
				return res.redirect('/login');
			}
			//用户名密码都匹配后，将用户信息存入session
			req.session.user = user;
			req.flash('success', '登陆成功！');
			res.redirect('/');
		});
	});
	app.get('/post', checkLogin);
	app.get('/post', function(req, res) {
		res.render('post', {title:'发表',pvs:getVista(),user:req.session.user,success:req.flash('success').toString(),error:req.flash('error').toString()});
	});
	app.post('/post', checkLogin);
	app.post('/post', function(req, res) {
		var currentUser = req.session.user,
			tags = [req.body.tag1, req.body.tag2, req.body.tag3],
			post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
		post.save(function(err) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success', '发布成功！');
			res.redirect('/');
		});
	});
	app.get('/logout', checkLogin);
	app.get('/logout', function(req, res) {
		req.session.user = null;
		req.flash('success', '登出成功！');
		res.redirect('/');
	});
	app.get('/upload', checkLogin);
	app.get('/upload', function(req, res) {
		res.render('upload', {
			title:'文件上传',
			pvs:getVista(),
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.post('/upload', checkLogin);
	app.post('/upload', function(req, res) {
		req.flash('success', '上传成功！');
		res.redirect('/upload');
	});
	//存档模块
	app.get('/archive', function(req, res) {
		Post.getArchive(function(err, posts) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('archive', {
				title:'存档',
				pvs:getVista(),
				posts:posts,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	//标签模块
	app.get('/tags', function(req, res) {
		Post.getTags(function(err, posts) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('tags', {
				title:'标签',
				pvs:getVista(),
				posts:posts,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	app.get('/tags/:tag', function(req, res) {
		Post.getTag(req.params.tag, function(err, posts) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('tag', {
				title:'TAG:' + req.params.tag,
				pvs:getVista(),
				posts:posts,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	//友情链接
	app.get('/links', function(req, res) {
		res.render('links', {
			title:'友情链接',
			pvs:getVista(),
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	//文章检索
	app.get('/search', function(req, res) {
		Post.search(req.query.keyword, function(err, posts) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('search', {
				title:"SEARCH:" + req.query.keyword,
				pvs:getVista(),
				posts:posts,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	//关于我
	app.get('/aboutme', function(req, res) {
		res.render('aboutme', {
			title:'关于我',
			pvs:getVista(),
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.get('/u/:name', function(req, res){
		var page = req.query.p ? parseInt(req.query.p) : 1;
		var num = 10;
		//检查用户是否存在
		User.get(req.params.name, function(err, user) {
			if(!user) {
				req.flash('error', '用户不存在！');
				return res.redirect('/');
			}
			//查询并返回该用户的文章
			Post.getNum(user.name, page, num, function(err, posts, total){
				if(err) {
					req.flash('error', err);
					return res.redirect('/');
				}
				res.render('user', {
					title:user.name,
					pvs:getVista(),
					posts:posts,
					page:page,
					isFirstPage:(page - 1) == 0,
					isLastPage:((page - 1) * num + posts.length) == total,
					user:req.session.user,
					success:req.flash('success').toString(),
					error:req.flash('error').toString()
				});
			});
		});
	});
	app.get('/u/:name/:day/:title', function(req, res){
		Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('article', {
				title:req.params.title,
				pvs:getVista(),
				post:post,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	//留言模块
	app.post('/u/:name/:day/:title', function(req, res) {
		var date = new Date(),
			time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
		var md5 = crypto.createHash('md5'),
			email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
			head = req.session.user ? req.session.user.head : "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
		var comment = {
			name:req.body.name,
			head:head,
			eamil:req.body.eamil,
			website:req.body.website,
			time:time,
			content:req.body.content
		};
		var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
		newComment.save(function(err) {
			if(err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success', '留言成功!');
			res.redirect('back');
		})
	});
	app.get('/edit/:name/:day/:title', checkLogin);
	app.get('/edit/:name/:day/:title', function(req, res) {
		var currentUser = req.session.user;
		Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post) {
			if(err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			res.render('edit', {
				title:'编辑',
				pvs:getVista(),
				post:post,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	app.post('/edit/:name/:day/:title', checkLogin);
	app.post('/edit/:name/:day/:title', function(req, res) {
		var currentUser = req.session.user;
		Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err) {
			var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
			if(err) {
				req.flash('error', err);
				return res.redirect(url);
			}
			req.flash('success', '修改成功！');
			res.redirect(url);
		});
	});
	app.get('/remove/:name/:day/:title', checkLogin);
	app.get('/remove/:name/:day/:title', function(req, res) {
		var currentUser = req.session.user;
		Post.remove(currentUser.name, req.params.day, req.params.title, function(err) {
			if(err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success', '删除成功！');
			res.redirect('/');
		});
	});
	//404错误页
	app.use(function(req, res) {
		res.render("404");
	});
function checkLogin(req, res, next) {
	if(!req.session.user) {
		req.flash('error', '未登录！');
		res.redirect('/login');
	}
	next();
}
function checkNotLogin(req, res, next) {
	if(req.session.user) {
		req.flash('error', '已登陆！');
		res.redirect('back');
	}
	next();
}
//获取访问这的ip地址
function getClientIp(req) {
	return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
}
function getVista() {
	console.time('getVista');
	var visitors;
	Pv.getAll(function(err, pvs) {
		if(err) {
			visitors = 0;
		}
		visitors = pvs;
	});
	console.timeEnd('getVista');
	return visitors;
}
};