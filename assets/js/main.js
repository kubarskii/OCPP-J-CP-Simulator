var tz,
 idTag,
 connectorId, meterStart, reservationId, meterStop, transactionData,
 chargePointVendor, chargePointModel, chargePointSerialNumber, chargeBoxSerialNumber,
 firmwareVersion, iccid, imsi, meterType, meterSerialNumber, datatrasfer;

 onAction();

function onAction() {
    idTag = $('#idTag').val().trim() || "IDTAG-1";
    connectorId = parseInt($('#connectorId').val());
    meterStart = $('#meterStart').val();
    reservationId = $('#reservationId').val();
    meterStop = $('#meterStop').val();
    transactionData = $('#transactionData').val();
    chargePointVendor = $('#chargePointVendor').val().trim() || "AVT-Company";
    chargePointModel = $('#chargePointModel').val().trim() || "AVT-Express";
    chargePointSerialNumber = $('#chargePointSerialNumber').val().trim() || "avt.001.13.1";
    chargeBoxSerialNumber = $('#chargeBoxSerialNumber').val().trim() || "avt.001.13.1.01";
    firmwareVersion = $('#firmwareVersion').val().trim() || "0.9.87";
    iccid = $('#iccid').val();
    imsi = $('#imsi').val();
    meterType = $('#meterType').val().trim() || "AVT NQC-ACDC";
    meterSerialNumber = $('#meterSerialNumber').val().trim() || "avt.001.13.1.01";
    datatrasfer = $('#datatrasfer').val();
}

try { //if (sessionStorage.getItem("TransactionId") !== undefined) {}else{}
    for (var i = 0; i < JSON.parse(sessionStorage.getItem("TransactionId")).length; i++) {
        if (JSON.parse(sessionStorage.getItem("TransactionId"))[i] == null) {
            continue;
        }
        $('#transactions').append(JSON.parse(sessionStorage.getItem("TransactionId"))[i] + "<br>");
    }
} catch (e) {
    $('#transactions').html('No transactions!')
}


//UI + 
var step = 1;
$(document).ready(function () {
    setInterval(function () {
        tz = parseInt($('#timeZone').val());
        $('#time').html(formatDate(new Date()))
    }
        , 1000);

    window.onmousemove = logMouseMove;

    function logMouseMove(e) {
        e = event || window.event;
        mousePos = { x: e.clientX, y: e.clientY };
        var w_width = $(window).width();
        var px;
        if ((w_width / 2) > e.clientX) {
            px = parseInt(((w_width / 2) - e.clientX) / 100);
            _px = parseInt(((w_width / 2) - e.clientX) / 60);
            $('#tesla').css('left', '' + parseInt(px + 210) + 'px');
            $('#charge_point').css('left', '' + parseInt(_px + 495) + 'px');

        } else {
            px = parseInt(((w_width / 2) - e.clientX) / 100);
            _px = parseInt(((w_width / 2) - e.clientX) / 60);
            $('#tesla').css('left', '' + parseInt(210 + px) + 'px');
            $('#charge_point').css('left', '' + parseInt(495 + _px) + 'px');
        }
    }

    $('#step2v1').hide();
    $('#step2v2').hide();
    $('#step3').hide();
    $('#back').hide();
    $('#sc').click(function () {
        $('#step1').hide();
        $('#step2v1').show();
        $('#back').show();
        step = 2;

    });
    $('#fc').click(function () {
        $('#step1').hide();
        $('#step2v2').show();
        $('#back').show();
        step = 2;
    });

    $('.step2').click(function () {
        $('#step2v1').hide();
        $('#step2v2').hide();
        $('#step3').show();
    });

    $('#back').click(function () {
        switch (step) {
            case 1:
                break;
            case 2:
                $('#step1').show();
                $('#step2v2').hide();
                $('#step2v1').hide();
                $('#step3').hide();
                $('#back').hide();
                break;
            case 3:
                $('#step1').show();
                $('#step2v2').hide();
                $('#step2v1').hide();
                $('#step3').hide();
                $('#back').hide();
                break;
            case 4:

                break;
            case 5:

                break;
            default:
                break;
        }

    });
});


$('.indicator').hide();
$('#red').show();
//UI -
function formatDate(date) {

    var day = String(date.getDate());
    if (day.length < 2) {
        day = ('0' + day.slice(-2));
    }


    var monthIndex = String(date.getMonth());
    if (monthIndex.length < 2) {
        monthIndex = ('0' + monthIndex.slice(-2));
    }
    var year = date.getFullYear();
    var h = date.getHours();
    if (h < Math.abs(tz)) {
        h = 24 - h;
    }
    h = String(h + tz);
    if (h.length < 2) {
        h = ('0' + h.slice(-2));
    }
    var m = String(date.getMinutes());

    var s = String(date.getSeconds());
    if (m.length < 2) {
        m = ('0' + m.slice(-2));
    }
    if (s.length < 2) {
        s = ('0' + s.slice(-2));
    }
    return year + '-' + monthIndex + '-' + day + "T" + h + ":" + m + ":" + s + "Z";
}

var c = 0;

var connecting;

var start_id = "";
var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var id = randomId();
var _websocket = null;

var connector_locked = false;

function randomId() {
    id = "";
    for (var i = 0; i < 36; i++) {
        id += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return id;
}

function wsConnect() {

    var wsurl = $('#endp').val();
    var CP = $('#CP').val();

    if (_websocket) {
        $('#red').show();
        _websocket.close(3001);
    } else {
        _websocket = new WebSocket(wsurl + "" + CP, ["ocpp1.6", "ocpp1.5"]);
        _websocket.onopen = function (authorizationData) {
            sessionStorage.setItem('connecting', null);

            sessionStorage.setItem('LastAction', "BootNotification");
            $('#yellow').show();
            BootNotification();

            $('#connect').text('Disconnect').css('background', 'green');

        };

        _websocket.onmessage = function (msg) {
            c++;
            var ddata = (JSON.parse(msg.data));

            if (c == 1) {
                var hb_interval = handleData(ddata);
                sessionStorage.setItem("Confriguration", hb_interval);
                startHB(hb_interval * 1000);
            }

            if (ddata[0] === 3) {
                la = getLastAction();

                if (la == "startTransaction") {

                    ddata = ddata[2];
                    //logMsg("Data exchange successful!");

                    var array = $.map(ddata, function (value, index) {
                        return [value];
                    });
                    var TransactionId = (array[0]);
                    try {
                        var arr = JSON.parse(sessionStorage.getItem("TransactionId"));
                        arr.push(TransactionId);
                        sessionStorage.setItem('TransactionId', JSON.stringify(arr));
                    } catch (e) {
                        sessionStorage.setItem('TransactionId', JSON.stringify([TransactionId]));
                    }
                    $('#transactions').html('');

                    for (var i = 0; i < JSON.parse(sessionStorage.getItem("TransactionId")).length; i++) {
                        if (JSON.parse(sessionStorage.getItem("TransactionId"))[i] == null) {
                            continue;
                        }
                        $('#transactions').append(JSON.parse(sessionStorage.getItem("TransactionId"))[i] + "<br>");
                    }
                    $('#TransToStp').val(TransactionId);
                    //logMsg(TransactionId);
                }
                logMsg("Response recieved successfully!");

                logMsg(JSON.stringify(ddata));
            } else if ((JSON.parse(msg.data))[0] === 4) {
                logMsg("Data exchange failed - JSON is not accepted!");
            } else if ((JSON.parse(msg.data))[0] === 2) {
                logMsg((JSON.parse(msg.data))[2]);
                logMsg((msg.data));
                id = (JSON.parse(msg.data))[1];
                switch (ddata[2]) {
                    case "Reset":
                        //Reset type SOFT, HARD
                        var ResetS = JSON.stringify([3, id, { "status": "Accepted" }]);
                        _websocket.send(ResetS);
                        location.reload();
                        break;
                    case "RemoteStopTransaction":
                        //TransactionID
                        var remStp = JSON.stringify([3, id, { "status": "Accepted" }]);
                        _websocket.send(remStp);
                        var stop_id = (JSON.parse(msg.data)[3].transactionId);
                        stopTransaction(stop_id);
                        $('.indicator').hide();
                        $('#yellow').show();
                        break;
                    case "RemoteStartTransaction":
                        //Need idTag, connectorId (map - ddata[3])
                        var remStrt = JSON.stringify([3, id, { "status": "Accepted" }]);
                        _websocket.send(remStrt);
                        startTransaction();

                        break;
                    case "UnlockConnector":
                        //connectorId
                        var UC = JSON.stringify([3, id, { "status": "Unlocked" }]);
                        _websocket.send(UC);
                        break;
                    case "ChangeAvailability":
                        //connectorId
                        var CA = JSON.stringify([3, id, { "status": "Accepted" }]);
                        _websocket.send(CA);
                        break;
                    case "ChangeConfiguration":
                        //connectorId
                        var CC = JSON.stringify([3, id, { "status": "Accepted" }]);
                        _websocket.send(CC);
                        break;
                    case "ClearCache":
                        //connectorId
                        var CCache = JSON.stringify([3, id, { "status": "Accepted" }]);
                        _websocket.send(CCache);
                        break;
                    case "GetConfiguration":
                        //connectorId
                        var GC = JSON.stringify([3, id, {}]);
                        _websocket.send(GC);
                        break;
                    //17
                    default:
                        var error = JSON.stringify([4, id]);
                        _websocket.send(error);
                        break;
                }

            }


            // Получение данных из sessionStorage
            //var data = sessionStorage.getItem('key');
        };

        _websocket.onclose = function (evt) {
            $('#connect').text('Connect').css('background', '#369');
            if (evt.code == 3001) {
                logMsg('ws closed');
                _websocket = null;
            } else {
                logMsg('ws connection error: ' + evt.code);
                $('#console').html("");
                $('#connect').text('Connect').css('background', '#369');
                $('.indicator').hide();
                $('#red').show();
                _websocket = null;
                //wsConnect();
            }
            //
        };

        _websocket.onerror = function (evt) {
            if (_websocket.readyState == 1) {
                $('#red').show();
                logMsg('ws normal error: ' + evt.type);
            }
        };
    }
}

function logMsg(err) {
    console.log(err);
    $('#console').append('<li>' + err + '</li>');
}

function Authorize() {
    onAction();

    sessionStorage.setItem('LastAction', "Authorize");
    var Auth = JSON.stringify([2, id, "Authorize", { "idTag": idTag }]);
    _websocket.send(Auth);

}

function startTransaction() {
    onAction();

    sessionStorage.setItem('LastAction', "startTransaction");
    $('.indicator').hide();
    $('#green').show();
    connector_locked = true;
    logMsg("Connector status changed to: " + connector_locked);
    var strtT = JSON.stringify([2, id, "StartTransaction", {
        "connectorId": connectorId,
        "idTag": idTag,
        "timestamp": formatDate(new Date()),
        "meterStart": 0,
        "reservationId": 0
    }]);
    _websocket.send(strtT);
}

function stopTransaction(transaction_id = false) {
    onAction();

    sessionStorage.setItem('LastAction', "stopTransaction");
    var ssid = transaction_id == false ? sessionStorage.getItem('TransactionId') : transaction_id;

    $('.indicator').hide();

    connector_locked = false;
    logMsg("Connector status changed to: " + connector_locked);
    $('#yellow').show();

    if ((transaction_id === false) && ($('#TransToStp').val() != '')) {
        ssid = $('#TransToStp').val();
    }
    var stpT = JSON.stringify([2, id, "StopTransaction", {
        "transactionId": parseInt(ssid),
        "idTag": idTag,
        "timestamp": formatDate(new Date()),
        "meterStop": 20
    }]);

    var arr = JSON.parse(sessionStorage.getItem("TransactionId"));

    delete arr[arr.indexOf(parseInt(ssid))];
    sessionStorage.setItem('TransactionId', JSON.stringify(arr));
    
    $('#transactions').html('');
    
    for (var i = 0; i < JSON.parse(sessionStorage.getItem("TransactionId")).length; i++) {
        if (JSON.parse(sessionStorage.getItem("TransactionId"))[i] == null) {
            continue;
        }
        $('#transactions').append(JSON.parse(sessionStorage.getItem("TransactionId"))[i] + "<br>");
    }

    _websocket.send(stpT);
}

function getConfiguration() {

}

function handleData(data, request = false) {
    var lastAction = getLastAction();
    if (lastAction = "BootNotification") {
        data = data[2];
        heartbeat_interval = data.interval;
        return heartbeat_interval;
    } else if (lastAction = "StartTransaction") {
        return "StartTransaction";
    } else if (1 == 2) {
        alert("else");
    }

}

function getLastAction() {
    var LastAction = sessionStorage.getItem("LastAction");
    return LastAction;
}

function BootNotification() {
    onAction();

    var BN = JSON.stringify([2, id, "BootNotification", {
        "chargePointVendor": chargePointVendor,
        "chargePointModel": chargePointModel,
        "chargePointSerialNumber": chargePointSerialNumber,
        "chargeBoxSerialNumber": chargeBoxSerialNumber,
        "firmwareVersion": firmwareVersion,
        "iccid": iccid,
        "imsi": imsi,
        "meterType": meterType,
        "meterSerialNumber": meterSerialNumber,
    }]);

    logMsg('ws connected');

    _websocket.send(BN);
}

function startHB(interval) {
    setInterval(send_heartbeat, interval);
}

function send_heartbeat() {
    sessionStorage.setItem('LastAction', "Heartbeat");
    var HB = JSON.stringify([2, id, "Heartbeat", {}]);
    _websocket.send(HB);
}

function getConnecting() {
    return sessionStorage.getItem('connecting');
}

//bind controls
$('#connect').click(function () {

    onAction();

    $('.indicator').hide();
    //alert(_websocket);
    if (_websocket == null) {
        sessionStorage.setItem('connecting', 'true');
    }


    showBlue();

    function showBlue() {
        connecting = getConnecting();
        if (connecting == 'true') {
            setTimeout(function () { $('#blue').show(); hideBlue() }, 500);
        }
    }

    function hideBlue() {
        connecting = getConnecting();
        setTimeout(function () { $('#blue').hide(); showBlue() }, 500);
    }


    $('#console').html("");
    wsConnect();
});

$('#send').click(function () {
    onAction();
    Authorize();

});

$('#start').click(function () {
    onAction();
    startTransaction();

});

$('#stop').click(function () {
    onAction();
    stopTransaction();
});

$('#mv').click(function () {
    onAction();
    sessionStorage.setItem('LastAction', "MeterValues");
    var MV = JSON.stringify([2, id, "MeterValues", { "connectorId": 1 }]);
    _websocket.send(MV);

});
$('#heartbeat').click(function () {
    send_heartbeat();


});

$('#status').click(function () {
    onAction();
    sessionStorage.setItem('LastAction', "StatusNotification");
    var SN = JSON.stringify([2, id, "StatusNotification", {
        "connectorId": connectorId,
        "status": "Available",
        "errorCode": "NoError",
        "info": "",
        "timestamp": formatDate(new Date()),
        "vendorId": "",
        "vendorErrorCode": ""
    }]);
    _websocket.send(SN);

});

$('#data_transfer').click(function () {
    onAction();
    datatrasfer = $('#datatrasfer').val();
    sessionStorage.setItem('LastAction', "DataTransfer");
    var DT = JSON.stringify([2, id, "DataTransfer", {
        "vendorId": "rus.avt.cp",
        "messageId": "1",
        "data": datatrasfer
    }]);
    logMsg(DT);
    _websocket.send(DT);

});

$('#connect').on('change', function () {
    onAction();
    if (_websocket) {
        _websocket.close(3001);

    }
});
