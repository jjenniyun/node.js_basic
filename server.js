const express = require('express');
const app = express(); //express 서버 객체
const bodyParser = require('body-parser'); //post 방식 파서
//app.use(express.json());
app.use(express.urlencoded({ extended: false })); //요청 데이터(body) 해석 쉽게 도와줌
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override'); // html에서 put/delete 요청 도와줌
// 웹소켓
const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

app.use(methodOverride('_method'));
require('dotenv').config()

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', function (req, res) {
    //res.sendFile(__dirname + '/index.html')
    res.render('index.ejs');
})

app.get('/write', function (req, res) {
    //res.send('uheeking')
    // console.log(res.body);
    //res.sendFile(__dirname + '/write.html')
    res.render('write.ejs');
});

var db; // 변수 하나 필요
MongoClient.connect(process.env.DB_URL, function (error, client) {

    //연결되면 할일 todoapp이라는 db로 연결
    if (error) return console.log(error);
    db = client.db('todoapp');

    // db.collection('post').insertOne({_id : 1,  name: 'Roje', _id: 100 }, function (error, result) { // 내가원하는 데이터 저장, post라는 파일에 insertOne{ 자료}
    // console.log('저장완료');
    // });

    // list로 get요청으로 접속하면
    // 실제 db에 저장된 데이터들로 예쁘게 꾸며진 html 보여줌
    app.get('/list', function (req, res) {
        db.collection('post').find().toArray(function (error, result) { // 모든 데이터를 가져옴
            console.log(result);
            res.render('list.ejs', { posts: result }); // db데이터를 ejs파일에 집어넣기
        });
    });
});

// detail로 접속시 detail.ejs 보여주기
app.get('/detail/:id', function (req, res) {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (error, result) {
        console.log(result);
        res.render('detail.ejs', { data: result }); // 찾은 결과를 detail.ejs로 보냄
        return res.status(400).send({ message: '에러 페이지' });
    });
});

// edit.ejs
app.get('/edit/:id', function (req, res) {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (error, result) {
        console.log(result);
        res.render('edit.ejs', { post: result }); // 찾은 결과를 edit.ejs로 보냄
        return res.status(400).send({ message: '에러 페이지' }); // 이상한 결과 접속하면 에러처리
    });
});

// 서버로 put요청 들어오면 게시물 수정 처리
app.put('/edit', function (req, res) {
    // 폼에 담긴 제목, 날짜 데이터 가지고 db.collection에 업데이트함
    db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { title: req.body.title, date: req.body.date } }, function (error, result) {
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

app.get('/login', function (req, res) {
    // 아이디 비번 맞으면 로그인 성공페이지 보내야함
    res.render('login.ejs');
})

app.post('/login', passport.authenticate('local', { // local 방식으로 id/pw 인증 / passport : 로그인 기능 쉽게 구현 도와줌
    failureRedirect: '/fail'
}), function (req, res) {
    // 아이디 비번 맞으면 로그인 성공페이지 보내야함
    res.redirect('/') // 회원인증 성공하면 홈으로 이동
});

// add로 post요청하면()
app.post('/add', function (req, res) {
    res.send('전송완료');
    db.collection('counter').findOne({ name: '게시물갯수' }, function (error, result) { // counter 팡리에서 db 총게시물 갯수 데이터 가져오기
        console.log(result.totalPost); // 총게시물갯수
        var totalPost = result.totalPost; // var : function 안에서만 사용, totalPost 변수에 저장

        var saveadd = { _id: totalPost + 1, title: req.body.title, date: req.body.date, writer: req.user._id }

        db.collection('post').insertOne(saveadd, function (error, result) { // db.post에 새게시물 기록함
            console.log('저장완료'); // post 컬렉션에 totalpost가 저장
            // counter 콜렉션에 있는 totalPost 항목도 +1 증가시키기(수정)
            db.collection('counter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (error, result) { // 완료되면 db.counter내의 총게시물 갯수+1
                if (error) { return console.log(error) };
            }); // db데이터 수정(한개만)
        });
    });
    // console.log(req.body);
    // console.log(req.body.date);
    // console.log(req.body.title);
});

// 마이페이지
app.get('/mypage', loginpls, function (req, res) {
    console.log(req.user);
    res.render('mypage.ejs', { user: req.user });
})
// 마이페이지 접속 전 실행할 미들웨어
function loginpls(req, res, next) {
    if (req.user) {
        next()
    } else { // req.user없으면 경고메시지 응답
        res.send('로그인 부탁드립니다.')
    }
}

// 인증하는 코드
passport.use(new LocalStrategy({ // 로그인 후 세션 저장할것인지
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false, // 아이디 비번 말고도 다른 정보 검증시
    // 아이디/ 비번 맞는지 db와 비교
}, function (입력한아이디, 입력한비번, done) {
    console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (error, result) { // db에 입력한 아이디가 있는지 찾기
        if (error) return done(error)

        if (!result) return done(null, false, { message: '존재하지않는 아이디입니다!' }) // db에 아이디가 없으면
        if (입력한비번 == result.pw) { // db에 아이디가 있으면 입력한 비번과 결과.pw 비교(보안 쓰레기, 비번 암호화되지않음)
            return done(null, result) // done(서버에러, 성공시사용자db데이터, 에러메시지)
        } else {
            return done(null, false, { message: '비번틀렸습니다.다시 입력바람' })
        }
    })
}));

//세션 만들기(id를 이용해서 세션저장시키는 코드 : 로그인 성공시 발동)
passport.serializeUser(function (user, done) {
    done(null, user.id); // 세션의 id정보를 쿠키로 보냄
});

// 세션 데이터 가진 사람을 db에서 찾기(마이페이지 접속시 발동)
passport.deserializeUser(function (아이디, done) {
    // db에서 user.id로 유저를 찾은 뒤 유저 정보를 넣기
    db.collection('login').findOne({ id: 아이디 }, function (error, result) {
        done(null, result);
    })
});
// 회원가입
app.post('/register', function (req, res) {
    db.collection('login').insertOne({ id: req.body.id, pw: req.body.pw }, function (error, result) {
        res.redirect('/'); // 메인페이지로
    })
})

app.get('/search', (req, res) => {
    var search_pan = [
        {
            $search: {
                index: 'titleSearch',
                text: {
                    query: req.query.value,
                    path: 'title'  // 제목날짜 둘다 찾고 싶으면 ['title', 'date']
                }
            }
        },
        { $sort: { _id: 1 } } // -1 : 내림차순 정렬
        //{ $project: { title: 1, score: { $meta: "searchScore" } } }
        //{ $limit: 2 } // 검색 결과 제한
    ]
    console.log(req.query.value); // 요청한 유저의 정보가 담겨있음
    db.collection('post').aggregate(search_pan).toArray((error, result) => {
        console.log(result);
        res.render('search.ejs', { posts: result });
    })
});

const { ObjectId } = require('mongodb');
// 채팅 페이지
app.post('/chatroom', loginpls, function (req, res) {
    console.log('채팅연결 완료!');
    var savechat = {
        title: '무슨무슨채팅방',
        member: [ObjectId(req.body.chat_id), req.user._id],
        date: new Date()
    };
    db.collection('chatroom').insertOne(savechat).then((result) => {
        res.send('채팅 입장 성공');
        console.log('게시물 발행');
    });
});

app.get('/chat', loginpls, function (req, res) {
    db.collection('chatroom').find({ member: req.user._id }).toArray().then((result) => { // 현재 로그인한 유저id
        res.render('chat.ejs', { data: result })
    })
});

app.post('/message', loginpls, function (req, res) {

    var savemessage = {
        parent: req.body.parent,
        content: req.body.content,
        userid: req.user._id,
        date: new Date(),
    }
    db.collection('message').insertOne(savemessage).then(() => {
        console.log('DB저장성공');
        res.send('DB저장성공');
    }).catch(() => {
        console.log('DB저장실패!');
    })
});
// 서버와 유저간 실시간 소통 채널 열기
app.get('/message/:id', loginpls, function (req, res) {
    // header 수정 : http요청시 몰래 전달되는 정보들도 있음(유저의 언어, 브라우저정보, 가진 쿠키, 어디서 가지고 왔는지)
    res.writeHead(200, {
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
    });
    // 유저에게 데이터 전송
    db.collection('message').find({ parent: req.params.id }).toArray().then((result) => {
        res.write('event: test\n');
        // 서버에서 실시간 전송시 문자 자료만 전송가능
        res.write('data: ' + JSON.stringify(result) + '\n\n');
    })
    const pipeline = [
        { $match: { 'fullDocument.parent': req.params.id } } // 컬렉션 안의 원하는 document만 감시하고 싶으면
    ];
    const collection = db.collection('message');
    const changeStream = db.collection('message').watch(pipeline); // 실시간 감시
    changeStream.on('change', (result) => {
        res.write('event: test\n');
        res.write('data: ' + JSON.stringify([result.fullDocument]) + '\n\n');
    });
});

// 본인 게시물만 삭제 가능하게!
app.delete('/delete', function (req, res) {
    console.log('삭제요청 들어옴');
    console.log(req.body);
    req.body._id = parseInt(req.body._id); // 숫자를 보냈으나 문자로 치환이 되므로 숫자형으로 형변환

    var del_id = { _id: req.body._id, writer: req.user._id } // 실제 로그인한 유저id랑 글에 저장된 유저id랑 일치하면 삭제하기

    // req.body에 담겨온 게시물번호를 가진 글 db에서 찾아서 삭제하기
    db.collection('post').deleteOne(del_id, function (error, result) { // 어떤 항목 삭제할지
        console.log('삭제완료');
        if (result) { console.log(result) }
        return res.status(200).send({ message: '성공했습니다' }); // 2xx를 보내면 요청성공
        //res.status(400).send({ message: '성공했습니다' });
    });
});
// 미들웨어(요청과 응답 사이에 실행되는 코드)
app.use('/shop', require('./routes/shop.js'));

app.use('/board/sub', require('./routes/board.js'));

let multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/image')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    },
    filefilter: function (req, file, cb) {

    }
});
// 업로드한 파일의 확장자 필터로 원하는 파일만 거르는 법
// var path = require('path');
// var upload = multer({
// storage: storage,
// fileFilter: function (req, file, callback) {
// var ext = path.extname(file.originalname);
// if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
// return callback(new Error('PNG, JPG만 업로드하세요'))
// }
// callback(null, true)
// },
// limits:{ // 사이즈 제한
// fileSize: 720 * 720
// }
// });

var upload = multer({ storage: storage });

// 업로드 페이지
app.get('/upload', function (req, res) {
    res.render('upload.ejs');
});

app.post('/upload', upload.array('profile', 10), function (req, res) { // array 여러개 파일 업로드
    res.send('업로드완료');
});

app.get('/image/:imgName', function (req, res) {
    res.sendFile(__dirname + '/public/image/' + req.params.imgName)
});

app.get('/socket', function (req, res) {
    res.render('socket.ejs')
});

io.on('connection', function (socket) { // socket 접속 유저 정보 들어있음
    console.log('유저 접속됨');

    socket.on('room1-send', function (data) {
        io.to('room1').emit('broadcast', data);
    });

    socket.on('joinroom', function (data) {
        socket.join('room1');
    });

    socket.on('user-send', function (data) {
        io.emit('broadcast', data) // 서버 → 모든 유저 메시지 전송
        //io.to(socket.id).emit('broadcast', data) // 서버 유저1명간 단독 소통
    });
});



http.listen(process.env.PORT, function (req, res) {
    console.log('listening on 8080');
});