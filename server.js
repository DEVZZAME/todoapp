const express = require('express');
const { send } = require('express/lib/response');
const app = express();
const bodyParser = require('body-parser');
const res = require('express/lib/response');
app.use(bodyParser.urlencoded({extended : true}));
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');



var db;
MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.dsant.mongodb.net/todoapp?retryWrites=true&w=majority', function(에러, client){
  if (에러) return console.log(에러);
  db = client.db('todoapp');

  // db.collection('post').insertOne({이름 : '강한솔', 나이 : 30}, function(에러, 결과){
  //   console.log('저장완료');
  // });

  app.listen('8080', function(){
    console.log('listening on 8080')
  });
})

app.get('/pet', function(요청, 응답){
  응답.send('this is a page for pet.');
});

app.get('/beauty', function(req, res){
  res.send('this is a page for beauty.')
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html')
});

app.get('/write', function(req, res){
  res.sendFile(__dirname + '/write.html')
});

app.post('/add', function(req, res){
  res.send('전송완료');
  db.collection('counter').findOne({name : '게시물갯수'}, (에러, 결과)=>{
    console.log(결과.totalPost)
    var 총게시물갯수 = 결과.totalPost;
    
    db.collection('post').insertOne({_id : 총게시물갯수 + 1, 제목 : req.body.title, 날짜 : req.body.date}, function(에러, 결과){
    console.log('저장완료');
    db.collection('counter').updateOne({name:'게시물갯수'}, {$inc : {totalPost:1}}, function(에러, 결과){
      if(에러){return console.log(에러)}
      console.log(결과)
    });
  });

  });
});

app.get('/list', function(req, res){
  db.collection('post').find().toArray(function(에러, 결과){
    console.log(결과);
    res.render('list.ejs', {posts : 결과})
  });
  
});

app.delete('/delete', function(req, res){
  req.body._id = parseInt(req.body._id)
  db.collection('post').deleteOne(req.body, function(에러, 결과){
    console.log('삭제완료');
  })
  res.send('삭제완료');
  res.status(200).send({message : '성공'});
});

app.get('/detail/:id', function(req, res){
  db.collection('post').findOne({_id : parseInt(req.params.id)}, function(에러, 결과){
    console.log(결과);
    res.render('detail.ejs', { data : 결과 });
  })
  
});