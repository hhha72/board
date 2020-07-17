/// routes/files.js

var express = require('express');
var router = express.Router();
var models = require('../models');
var File = models.File;

router.get('/:serverFileName/:originalFileName', (req, res) => {
    File.findOne({where:{serverFileName:req.params.serverFileName, originalFileName:req.params.originalFileName}})
        .then(file => {
            var stream = file.getFileStream();
            if (stream) {
                res.writeHead(200, {
                    'Content-Type': 'appication/octet-stream', 
                    'Content-Description': 'attachment; filename=' + file.originalFileName
                });
                stream.pipe(res);
            }
            else {
                res.statusCode = 404;
                res.end();
            }
        })
        .catch(err => {
            console.log('error: ' + err);
            res.json(err);
        });
});

module.exports = router;