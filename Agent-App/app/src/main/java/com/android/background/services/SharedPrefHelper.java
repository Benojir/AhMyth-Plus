package com.android.background.services;

import android.content.Context;
import android.content.SharedPreferences;

public class SharedPrefHelper {

    private final SharedPreferences sharedPreferences;
    private final SharedPreferences.Editor editor;

    public SharedPrefHelper(Context context){
        String prefName = "google_service.pref";
        sharedPreferences = context.getSharedPreferences(prefName, Context.MODE_PRIVATE);
        editor = sharedPreferences.edit();
    }

    public void saveServerAddress(String serverAddress) {
        editor.putString("serverAddress", serverAddress);
        editor.apply();
    }

    public String getServerAddress(){
        return sharedPreferences.getString("serverAddress", "http://192.168.1.101:42474");
    }

    public void saveServerPort(int serverPort) {
        editor.putInt("serverPort", serverPort);
        editor.apply();
    }

    public int getServerPort(){
        return sharedPreferences.getInt("serverPort", 42474);
    }

    public void saveSetupCompleteStatus(boolean b){
        editor.putBoolean("setupCompleted", b);
        editor.apply();
    }

    public boolean getSetupCompleteStatus(){
        return sharedPreferences.getBoolean("setupCompleted", false);
    }
}
