var router = require('express').Router();

function loginpls(req, res, next) {
    if (req.user) {
        next()
    } else { // req.user없으면 경고메시지 응답
        res.send('로그인 부탁드립니다.')
    }
}
// 특정 url에만 적용한 미들웨어
router.use('/shirts', loginpls);
//router.use(loginpls); // 여기있는 모든 url에 적용할 미들웨어

router.get('/shirts', function (req, res) {
    res.send('셔츠파는 페이지입이다.');
});

router.get('/pants', function (req, res) {
    res.send('바지 파는 페이지입이다.');
});

module.exports = router;