var express = require('express');
var xml2js = require('xml2js');
var os = require('os');
var childprocess = require('child_process');
var fs = require('fs');

var app = express();
var builder = new xml2js.Builder();
var cpuCount = os.cpus().length;

function xmlFor(status, responseTime) {
    return builder.buildObject({
        pingdom_http_custom_check: {
            status: status,
            response_time: responseTime.toFixed(3)
        }
    }) + '\n';
}

function meminfo(cb) {
  fs.readFile('/proc/meminfo', {encoding: 'ascii'}, function (err, data) {
    if (err) {
        cb(err);
        return;
    }

    var info = {};

    data.trim().split("\n").forEach(function(line) {
        var parts = line.split(':');
        var key = parts[0];
        var value = parts[1].trim().split(' ')[0];

        info[key] = +value;
    });

    cb(null, info);
  });
}

app.get('/pingdom/load', function (req, res) {
    var load = os.loadavg();
    var load5min = load[1];
    var status = load5min >= cpuCount ? 'LOAD' : 'OK';

    console.log({load: {values: load, status: status}});

    res.send(xmlFor(status, load5min * 1000));
});

app.get('/pingdom/memory', function (req, res) {
    meminfo(function (err, info) {
        var total = info.MemTotal;
        var used = info.MemFree + info.Buffers + info.Cached;
        var pct = (used / total)*100;
        var status = pct > 60 ? 'MEMORY' : 'OK';

        console.log({memory: {total: total, used: used, pct: pct, status: status}});

        res.send(xmlFor(status, pct));
    });
});

app.get('/pingdom/disk', function (req, res) {
    childprocess.exec("df -k /", function(err, stdout, stderr) {
        if (err) {
            res.send(xmlFor('DISK_ERROR', 0));
        } else {
            var lines = stdout.trim().split("\n");
            var info = lines[lines.length - 1].replace(/[\s\n\r]+/g, ' ');
            var parts = info.split(' ');

            var used = +parts[2];
            var avail = +parts[3];
            var pct = (used / avail)*100;

            var status = pct > 50 ? 'DISK_USAGE' : 'OK';

            console.log({disk: {used: used, avail: avail, pct: pct}});

            res.send(xmlFor(status, pct));
        }
    });
});

var server = app.listen(+(process.env.HTTP_PORT || 3000), function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('pingdom-os listening at http://%s:%s', host, port);
});
