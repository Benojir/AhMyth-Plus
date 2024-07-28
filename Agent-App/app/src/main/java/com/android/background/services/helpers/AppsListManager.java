package com.android.background.services.helpers;

import android.content.Context;
import android.content.pm.PackageInfo;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class AppsListManager {

    public static JSONObject getAppLists(Context context){

        try {
            JSONObject AppLists = new JSONObject();
            JSONArray appInfoList = new JSONArray();

            List<PackageInfo> packs = context.getPackageManager().getInstalledPackages(0);

            for(int i=0;i < packs.size();i++) {

                PackageInfo packageInfo = packs.get(i);

                try {
                    String appName = packageInfo.applicationInfo.loadLabel(context.getPackageManager()).toString();
                    String packageName = packageInfo.packageName;
                    String versionName = packageInfo.versionName;

                    JSONObject app = new JSONObject();

                    app.put("appName", appName);
                    app.put("packageName", packageName);
                    app.put("versionName", versionName);

                    appInfoList.put(app);

                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            Comparator<JSONObject> appNameComparator = new Comparator<JSONObject>() {
                @Override
                public int compare(JSONObject obj1, JSONObject obj2) {
                    String appName1 = obj1.optString("appName", "");
                    String appName2 = obj2.optString("appName", "");
                    return appName1.compareTo(appName2);
                }
            };

            // Convert the JSONArray to a List of JSONObjects for sorting
            List<JSONObject> appInfoListAsList = new ArrayList<>();
            for (int i = 0; i < appInfoList.length(); i++) {
                appInfoListAsList.add(appInfoList.getJSONObject(i));
            }

            // Sort the list using the custom comparator
            appInfoListAsList.sort(appNameComparator);

            // Convert the sorted list back to a JSONArray
            appInfoList = new JSONArray(appInfoListAsList);

            AppLists.put("appsList", appInfoList);

            return AppLists;

        } catch (JSONException e) {
            e.printStackTrace();
            return null;
        }
    }
}
