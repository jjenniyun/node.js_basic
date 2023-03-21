const express = require('express')
const app = express()
const port = 5000

//const mongoose

//mongodb+srv://hjkjj1847:qwer1234@cluster0.v2qcdip.mongodb.net/node_js?retryWrites=true&w=majority

app.get('/', (req, res) => res.send('Hello World!~~안녕하세요~ '))
app.listen(port, () => console.log('Example app listening on port ${port}!'))

app.listen(8080, function () {
    console.log('listening on 8080')
});

app.get('/pet', function (req, res) {
    res.send('펫 용품 쇼핑할 수 있는 페이지입니다.')
});

app.get('/beauty', function (req, res) {
    res.send('뷰티 용품 쇼핑할 수 있는 페이지입니다.')
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html')
});

app.get('/write', function (req, res) {
    res.sendFile(__dirname + '/write.html')
});

app.post('/add', function (req, res) {
    res.send('전송완료');
    console.log(req.body.date);
    console.log(req.body.title);
    // db저장
});