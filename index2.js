var spawn = require('child_process').spawn,
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 9999 }),
    ffmpeg = spawn('ffmpeg', ['-i', 'rtsp://admin:123456@10.144.183.183:80/', '-loglevel', 'quiet', '-q:v', '10', '-f', 'image2pipe', '-']),
    //ffmpeg = spawn('ffmpeg', ['-i', 'rtsp://admin:123456@10.144.183.183:80/', '-loglevel', 'quiet', '-q:v', '10', '-f', 'image2pipe', '-vcodec', 'png', '-']),
    buffer = '',
    counter = 0;
var PNG_HEADER_BUF = new Buffer([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    PNG_HEADER_STRING = PNG_HEADER_BUF.toString('binary'),
    JPEG_HEADER_BUF = new Buffer([0xff, 0xd8]),
    JPEG_HEADER_STRING = JPEG_HEADER_BUF.toString('binary'),
    IMAGEHEADER = JPEG_HEADER_STRING

var max = 0, mean = 0, min = 10000000, total = 0, lastJitter = 0, Jitter = 0, differLenth=0, lastFileLength = 0, FileLength = 0, motionFlag = 0;
var util = require('util');

ffmpeg.stdout.on('data', function (data) {
    //console.log(new Date());

    buffer += data.toString('binary');

    // trim to header
    var headerPosition = buffer.indexOf(IMAGEHEADER);
    if (headerPosition > 0)
        buffer = buffer.substr(headerPosition);

    // search for image
    var contentList = buffer.split(IMAGEHEADER);
    if (contentList.length > 2) {
        var fileContents = new Buffer(IMAGEHEADER + contentList[1], 'binary');
        var now = new Date();
        // websocket broadcast
        var FileLength = fileContents.length;
        differLenth = FileLength - lastFileLength;
        
        Jitter = (lastJitter) * 99 / 100 + Math.abs(differLenth) / 100;
        buffer = IMAGEHEADER + contentList.slice(2).join(IMAGEHEADER);

        counter++;
        

        //if (max < FileLength)
        //    max = FileLength;

        //if (FileLength < min)
        //    min = FileLength;

        if (Jitter > lastJitter)
            motionFlag++;
        else if (motionFlag > 0)
            motionFlag--;
        //mean = (total + fileLength) / counter;
        //total += fileLength;

        console.log(util.format('count=%d, this=%d, jitter=%d, %d', counter, FileLength, Jitter, motionFlag));
        lastFileLength = FileLength;
        lastJitter = Jitter;
    }

});

ffmpeg.on('close', function (code) {
    console.log('ffmpeg child process exited with code ' + code);
});
ffmpeg.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
});



