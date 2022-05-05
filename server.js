const express = require('express');
const { send } = require('express/lib/response');
const app = express();
const bodyParser = require('body-parser');
const res = require('express/lib/response');
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use('/publc', express.static('public'));


require('dotenv').config()
const bcrypt = require('bcrypt');
const saltRounds = 10;



var db;
MongoClient.connect(process.env.DB_URL, function (에러, client) {
  if (에러) return console.log(에러);
  db = client.db('todoapp');
  app.listen(process.env.PORT, function () {
    console.log('listening on 8080')
  });
})

app.get('/detail/:id', function (req, res) {
  db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (에러, 결과) {
    console.log(결과);
    res.render('detail.ejs', { data: 결과 });
  })
});

app.get('/edit/:id', function (req, res) {
  db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (에러, 결과) {
    console.log(결과);
    res.render('edit.ejs', { post: 결과 });
  })
});

app.put('/edit', function (req, res) {
  db.collection('post').updateOne({ _id: parseInt(req.body.id) },
    { $set: { 제목: req.body.title, 날짜: req.body.date } }, function (에러, 결과) {
      console.log('수정완료');
      res.redirect('/list');
    }) 
});

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {

  db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러)
    if (!결과) return done(null, false, { message: '존재하지 않는 아이디 입니다.' })
    bcrypt.compare(입력한비번, 결과.pw, function (에러, isMatch) {
      if (isMatch) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '잘못된 비밀번호입니다.' })
      }
    })
  })
}));

passport.serializeUser(function (user, done) {
  done(null, user.id)
});

passport.deserializeUser(function (아이디, done) {
  db.collection('login').findOne({ id: 아이디 }, function (에러, 결과) {
    done(null, 결과)
  })

});

app.post('/add', function (req, res) {
  db.collection('counter').findOne({ name: '게시물갯수' }, (에러, 결과) => {
    console.log(결과.totalPost)
    var 총게시물갯수 = 결과.totalPost;
    var 저장할정보 = { _id: 총게시물갯수 + 1, 제목: req.body.title, 날짜: req.body.date, 작성자: req.user._id };
    db.collection('post').insertOne(저장할정보, function (에러, 결과) {
      console.log('저장완료');
      db.collection('counter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (에러, 결과) {
        if (에러) { return console.log(에러) }
        console.log(결과)
      });
    });
    res.redirect('/list');
  });
  
});

app.delete('/delete', function (req, res) {
  req.body._id = parseInt(req.body._id)
  var 삭제할데이터 = {_id : req.body._id, 작성자 : req.user._id}
  db.collection('post').deleteOne(삭제할데이터, function (에러, 결과) {
    console.log('삭제완료');
    if(에러){console.log(에러)}
  })
  res.status(200).send({ message: '성공' });
});

app.get('/', function (req, res) {
  db.collection('post').find().toArray(function (에러, 결과) {
    console.log(결과);
    res.render('index.ejs', { posts: 결과 })
  });
});

app.get('/signupForm', function (req, res) {
  res.render('signupForm.ejs');
});

app.post('/signup', function (req, res) {
  db.collection('counter').findOne({ user: '아이디갯수' }, (에러, 결과) => {
    console.log(결과.totalUser)
    var 총아이디갯수 = 결과.totalUser;
  
  bcrypt.hash(req.body.pw, saltRounds, function (err, hash) {
    db.collection('login').insertOne({ _id: 총아이디갯수 + 1, name: req.body.name, id: req.body.id, pw: hash }, function (에러, 결과) {
        db.collection('counter').updateOne({ user: '아이디갯수' },{ $inc: { totalUser: 1 } }, function(에러, 결과){
          if(에러) { return console.log(에러)}
        });
        console.log(결과)
        }
    );
  });
});
res.redirect('/login')
});

app.get('/write', loginCheck, function (req, res) {
  db.collection('post').find().toArray(function (에러, 결과) {
    console.log(결과);
    res.render('write.ejs', { posts: 결과 })
  });
});

app.get('/login', function (req, res) {
  res.render('login.ejs')
});

app.post('/login', passport.authenticate('local', {
  failureRedirect: '/fail'
}), function (req, res) {
  res.redirect('/list');
});

app.get('/logout', function(req, res){
  req.logOut();
  res.redirect('/');
})

app.get('/mypage', loginCheck, function (req, res) {
  res.render('mypage.ejs', { 사용자: req.user })
});

app.get('/list', loginCheck, function (req, res) {
  db.collection('post').find().toArray(function (에러, 결과) {
    // console.log(결과);
    res.render('list.ejs', { posts: 결과 })
  })
});

app.get('/search', function (req, res) {
  var 검색조건 = [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: req.query.value,
          path: '제목'
        }
      }
    },
    {$sort : {_id : 1}}
] 
  db.collection('post').aggregate(검색조건).toArray((에러, 결과)=>{
    console.log(결과)
    res.render('search.ejs', {searchs : 결과})
  })
});

function loginCheck(req, res, next) {
  if (req.user) {
    next();
  } else {
    // res.send('먼저 로그인을 해주십시오.');
    res.redirect('/login');
  }
}

