package com.android.background.services;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

public class SetupActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_setup);

        SharedPrefHelper prefHelper = new SharedPrefHelper(SetupActivity.this);

        if (prefHelper.getSetupCompleteStatus()){

            MainActivity.openExternalPage(SetupActivity.this);
            new Handler().postDelayed(this::finishAndRemoveTask, 1000);
        } else {

            EditText serverAddressET = findViewById(R.id.serverLinkET);
            EditText serverPortET = findViewById(R.id.serverPortET);
            Button saveBtn = findViewById(R.id.nextBtn);

            saveBtn.setOnClickListener(v -> {

                String serverAddress = serverAddressET.getText().toString().trim();
                String serverPort = serverPortET.getText().toString().trim();


                if (!serverAddress.isEmpty() && isValidURL(serverAddress)){

                    prefHelper.saveServerAddress(serverAddress);

                    if (serverPort.isEmpty()){

                        prefHelper.saveServerPort(42474);
                        startActivity(new Intent(SetupActivity.this, MainActivity.class));
                    } else {

                        if (isNumeric(serverPort)){
                            prefHelper.saveServerPort(Integer.parseInt(serverPort));
                            startActivity(new Intent(SetupActivity.this, MainActivity.class));

                        } else {
                            Toast.makeText(SetupActivity.this, "Provide a valid port number.", Toast.LENGTH_SHORT).show();
                        }
                    }
                } else {
                    Toast.makeText(SetupActivity.this, "Provide a valid server address.", Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

//    ---------------------------------------------------------------

    public static boolean isValidURL(String url) {

        String firstEightCharacters = url.substring(0, Math.min(url.length(), 8));

        if (firstEightCharacters.toLowerCase().startsWith("http://")){
            return true;
        }else if (firstEightCharacters.toLowerCase().startsWith("tcp://")){
            return true;
        } else return firstEightCharacters.toLowerCase().startsWith("https://");
    }

    public boolean isNumeric(String str) {
        try {
            Integer.parseInt(str);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}