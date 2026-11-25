package com.colourlens.blind;
import android.Manifest;
import android.app.Activity;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.*;
import android.speech.tts.TextToSpeech;
import android.view.WindowInsets;
import android.webkit.*;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class MainActivity extends Activity {
 private static final String HOST="appassets.androidplatform.net", START="https://"+HOST+"/assets/index.html";
 private static final int CAMERA=101,PICK=102,EXPORT=103;
 private WebView web;
 private PermissionRequest pendingCamera;
 private ValueCallback<Uri[]> fileCallback;
 private TextToSpeech tts;
 private boolean speechReady;
 private String pendingCsv;
 @Override public void onCreate(Bundle state){
  super.onCreate(state);
  web=new WebView(this);web.setBackgroundColor(Color.rgb(16,23,29));
  getWindow().setStatusBarColor(Color.rgb(16,23,29));getWindow().setNavigationBarColor(Color.rgb(16,23,29));
  setContentView(web);
  if(Build.VERSION.SDK_INT>=35){
   getWindow().setDecorFitsSystemWindows(false);
   web.setOnApplyWindowInsetsListener((v,i)->{android.graphics.Insets b=i.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout()|WindowInsets.Type.ime());v.setPadding(b.left,b.top,b.right,b.bottom);return i;});
  }
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setMediaPlaybackRequiresUserGesture(false);s.setSupportMultipleWindows(false);s.setJavaScriptCanOpenWindowsAutomatically(false);
  WebView.setWebContentsDebuggingEnabled(false);
  WebViewAssetLoader loader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
  web.setWebViewClient(new WebViewClientCompat(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){
    if(local(r.getUrl())){WebResourceResponse res=loader.shouldInterceptRequest(r.getUrl());if(res!=null)return res;}
    return new WebResourceResponse("text/plain","UTF-8",403,"Blocked",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));
   }
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return !local(r.getUrl());}
  });
  web.setWebChromeClient(new WebChromeClient(){
   @Override public void onPermissionRequest(PermissionRequest r){runOnUiThread(()->{
    if(!local(r.getOrigin())||!Arrays.asList(r.getResources()).contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)){r.deny();return;}
    if(checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED)r.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
    else{if(pendingCamera!=null)pendingCamera.deny();pendingCamera=r;requestPermissions(new String[]{Manifest.permission.CAMERA},CAMERA);}
   });}
   @Override public void onPermissionRequestCanceled(PermissionRequest r){runOnUiThread(()->{if(pendingCamera==r)pendingCamera=null;});}
   @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams params){
    if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=cb;
    try{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("image/*");startActivityForResult(i,PICK);}
    catch(Exception e){fileCallback.onReceiveValue(null);fileCallback=null;toast("Photo picker unavailable.");}return true;
   }
  });
  tts=new TextToSpeech(this,result->runOnUiThread(()->{if(result==TextToSpeech.SUCCESS&&tts!=null){int lang=tts.setLanguage(new Locale("en","IN"));if(lang<0)lang=tts.setLanguage(Locale.ENGLISH);speechReady=lang>=0;}}));
  web.addJavascriptInterface(new NativeBridge(),"BlindNative");web.loadUrl(START);
 }
 private boolean local(Uri u){return u!=null&&"https".equals(u.getScheme())&&HOST.equals(u.getHost())&&(u.getPort()==-1||u.getPort()==443)&&(u.getPath()==null||u.getPath().isEmpty()||"/".equals(u.getPath())||u.getPath().startsWith("/assets/"));}
 private void toast(String s){Toast.makeText(this,s,Toast.LENGTH_SHORT).show();}
 private final class NativeBridge{
  @JavascriptInterface public void speak(String text){runOnUiThread(()->{if(speechReady&&tts!=null&&text!=null)tts.speak(text.substring(0,Math.min(3000,text.length())),TextToSpeech.QUEUE_FLUSH,null,"blind-colour");else toast("Text-to-speech unavailable. Check Android speech settings.");});}
  @JavascriptInterface public void stopSpeech(){runOnUiThread(()->{if(tts!=null)tts.stop();});}
  @JavascriptInterface public void copyText(String text){runOnUiThread(()->{ClipboardManager cm=(ClipboardManager)getSystemService(Context.CLIPBOARD_SERVICE);if(cm!=null)cm.setPrimaryClip(ClipData.newPlainText("Colour Lens",text));});}
  @JavascriptInterface public void exportCsv(String csv){runOnUiThread(()->{if(csv==null||pendingCsv!=null)return;pendingCsv=csv;try{Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.setType("text/csv");i.addCategory(Intent.CATEGORY_OPENABLE);i.putExtra(Intent.EXTRA_TITLE,"colour-lens-palette.csv");startActivityForResult(i,EXPORT);}catch(Exception e){pendingCsv=null;toast("File export unavailable.");}});}
 }
 @Override public void onRequestPermissionsResult(int req,String[] permissions,int[] results){super.onRequestPermissionsResult(req,permissions,results);if(req==CAMERA&&pendingCamera!=null){PermissionRequest p=pendingCamera;pendingCamera=null;if(results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED)p.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});else p.deny();}}
 @Override protected void onActivityResult(int req,int result,Intent data){super.onActivityResult(req,result,data);if(req==PICK&&fileCallback!=null){fileCallback.onReceiveValue(result==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null);fileCallback=null;}else if(req==EXPORT){String csv=pendingCsv;pendingCsv=null;if(result==RESULT_OK&&data!=null&&data.getData()!=null&&csv!=null){try(OutputStream out=getContentResolver().openOutputStream(data.getData(),"w")){if(out==null)throw new IOException();out.write(csv.getBytes(StandardCharsets.UTF_8));toast("Palette exported.");}catch(Exception e){toast("Could not save palette.");}}}}
 @Override protected void onStop(){if(web!=null)web.evaluateJavascript("if(typeof mode!=='undefined'&&mode==='camera')document.getElementById('clearView').click();if(typeof stopSpeech==='function')stopSpeech();",null);if(tts!=null)tts.stop();super.onStop();}
 @Override protected void onPause(){super.onPause();if(web!=null)web.onPause();}
 @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
 @Override public void onBackPressed(){if(web!=null&&web.canGoBack())web.goBack();else super.onBackPressed();}
 @Override protected void onDestroy(){if(pendingCamera!=null){pendingCamera.deny();pendingCamera=null;}if(fileCallback!=null){fileCallback.onReceiveValue(null);fileCallback=null;}if(tts!=null){tts.stop();tts.shutdown();tts=null;}if(web!=null){web.removeJavascriptInterface("BlindNative");web.destroy();web=null;}super.onDestroy();}
}
