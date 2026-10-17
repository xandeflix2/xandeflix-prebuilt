package com.xandeflix.prebuilt.player;

import android.app.Activity;
import android.app.Dialog;
import android.graphics.Color;
import android.view.KeyEvent;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import androidx.media3.ui.AspectRatioFrameLayout;
import androidx.media3.ui.PlayerView;
import com.xandeflix.prebuilt.R;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.DateFormat;
import java.util.Date;
import java.util.Locale;

/** Live metadata stays in RAM. Channel resolution and C9 remain in the JS owner. */
final class LivePlayerControls {
    interface Action { void accept(String action, String id, String channelId); }
    private final Activity activity;
    private final PlayerView view;
    private final Action action;
    private JSONObject context = new JSONObject();
    private Dialog dialog;
    private String panel;
    private ListView list;
    private TextView message;
    private Button previousPage, nextPage;
    private View returnFocus;
    private JSONArray rows = new JSONArray();
    private boolean disposing;
    private boolean fullscreen;
    private int shortcutKey = KeyEvent.KEYCODE_UNKNOWN;
    private Toast volumeToast;

    LivePlayerControls(Activity activity, PlayerView view, Action action, Runnable back) {
        this.activity=activity; this.view=view; this.action=action;
        view.findViewById(R.id.live_back).setOnClickListener(v -> back.run());
        bindAction(R.id.live_previous,"previous"); bindAction(R.id.live_next,"next");
        bindAction(R.id.live_favorite,"favorite");
        for(int id:new int[]{R.id.live_channels,R.id.live_categories,R.id.live_guide,R.id.live_favorites}) {
            String name=id==R.id.live_channels?"channels":id==R.id.live_categories?"categories":id==R.id.live_guide?"guide":"favorites";
            view.findViewById(id).setOnClickListener(v -> { openPanel(name,v); emit(name,null); });
        }
        view.findViewById(R.id.live_resize).setOnClickListener(v -> {
            boolean zoom=view.getResizeMode()!=AspectRatioFrameLayout.RESIZE_MODE_ZOOM;
            view.setResizeMode(zoom?AspectRatioFrameLayout.RESIZE_MODE_ZOOM:AspectRatioFrameLayout.RESIZE_MODE_FIT);
            ((Button)v).setText(zoom?"Ajustar tela":"Preencher tela");
        });
    }
    static String text(String value,int max) {
        if(value==null)return "";
        String clean=value.replaceAll("[\\p{Cntrl}]"," ").trim();
        if(clean.matches("(?is).*https?://.*"))return "";
        return clean.substring(0,Math.min(clean.length(),max));
    }
    static boolean validId(String value) { return value!=null&&!value.isEmpty()&&value.length()<=512&&!value.contains("://")&&!value.matches("(?s).*[\\p{Cntrl}].*"); }
    private void bindAction(int id,String name) { view.findViewById(id).setOnClickListener(v -> emit(name,null)); }
    private void emit(String name,String id) { if(!disposing&&(!context.optBoolean("busy")||"closePanel".equals(name))) action.accept(name,id,context.optString("channelId")); }
    void bind(JSONObject value) {
        if(value==null)return;
        context=value;
        ((TextView)view.findViewById(R.id.live_player_title)).setText(text(value.optString("name"),180));
        ((TextView)view.findViewById(R.id.live_player_group)).setText("● AO VIVO  ·  "+text(value.optString("groupName"),120));
        ((TextView)view.findViewById(R.id.live_player_status)).setText(value.optBoolean("busy")?"Carregando…":text(value.optString("message"),240));
        Button favorite=view.findViewById(R.id.live_favorite);
        favorite.setText(value.optBoolean("favorite")?"★ Favoritado":"☆ Favoritar");
        favorite.setContentDescription(value.optBoolean("favorite")?"Remover canal dos favoritos":"Adicionar canal aos favoritos");
        for(int id:new int[]{R.id.live_previous,R.id.live_next,R.id.live_favorite,R.id.live_channels,R.id.live_categories,R.id.live_guide,R.id.live_favorites})view.findViewById(id).setEnabled(!value.optBoolean("busy"));
        if(dialog!=null&&dialog.isShowing()&&list!=null)updatePanel();
    }
    void setFullscreen(boolean value) { fullscreen=value; if(!value){shortcutKey=KeyEvent.KEYCODE_UNKNOWN;if(volumeToast!=null){volumeToast.cancel();volumeToast=null;}dismissPanel();} }
    private int dp(int value){return Math.round(value*activity.getResources().getDisplayMetrics().density);}
    private Button button(String title){Button b=new Button(activity);b.setText(title);b.setTextColor(Color.WHITE);b.setTextSize(14);b.setAllCaps(false);b.setBackgroundResource(R.drawable.player_control_focus);return b;}
    private void openPanel(String name,View trigger) {
        if(context.optBoolean("busy"))return;
        close(false); panel=name; returnFocus=trigger;
        LinearLayout body=new LinearLayout(activity);body.setOrientation(LinearLayout.VERTICAL);body.setBackgroundColor(Color.rgb(14,18,27));body.setPadding(dp(16),dp(8),dp(16),dp(8));
        message=new TextView(activity);message.setTextColor(Color.WHITE);message.setTextSize(14);body.addView(message);
        list=new ListView(activity);list.setChoiceMode(ListView.CHOICE_MODE_SINGLE);list.setSelector(R.drawable.live_list_focus);list.setFocusable(true);
        int height=Math.min(dp(280),activity.getResources().getDisplayMetrics().heightPixels/2);
        body.addView(list,new LinearLayout.LayoutParams(-1,height));
        LinearLayout pages=new LinearLayout(activity);previousPage=button("Anterior");nextPage=button("Próxima");
        pages.addView(previousPage,new LinearLayout.LayoutParams(0,dp(48),1));pages.addView(nextPage,new LinearLayout.LayoutParams(0,dp(48),1));body.addView(pages);
        previousPage.setOnClickListener(v -> emit("categories".equals(panel)?"groupPrevious":"pagePrevious",null));
        nextPage.setOnClickListener(v -> emit("categories".equals(panel)?"groupNext":"pageNext",null));
        list.setOnItemClickListener((parent,v,position,id) -> {
            JSONObject row=rows.optJSONObject(position);if(row==null||context.optBoolean("busy"))return;
            if("categories".equals(panel)){emit("selectGroup",row.optString("id"));panel="channels";rows=new JSONArray();list.setAdapter(null);list.setEnabled(false);message.setText("Carregando…");}
            else if(!"guide".equals(panel)){emit("selectChannel",row.optString("id"));close(false);}
        });
        AlertDialog value=new AlertDialog.Builder(activity,androidx.appcompat.R.style.Theme_AppCompat_Dialog_Alert).setTitle("guide".equals(name)?"Guia de programação":"categories".equals(name)?"Categorias":"favorites".equals(name)?"Canais favoritos":"Canais")
            .setView(body).setNegativeButton("Voltar",(d,which)->{}).create();
        dialog=value;view.setControllerShowTimeoutMs(0);
        value.setOnDismissListener(d->{if(dialog!=value)return;dialog=null;list=null;panel=null;view.setControllerShowTimeoutMs(3000);if(fullscreen){view.showController();if(returnFocus!=null)returnFocus.requestFocus();}else view.hideController();emit("closePanel",null);});
        value.show();value.getButton(AlertDialog.BUTTON_NEGATIVE).setBackgroundResource(R.drawable.player_control_focus);value.getButton(AlertDialog.BUTTON_NEGATIVE).setTextColor(Color.WHITE);updatePanel();list.requestFocus();
    }
    private void updatePanel() {
        list.setEnabled(!context.optBoolean("busy"));
        boolean guide="guide".equals(panel), categories="categories".equals(panel);
        dialog.setTitle(guide?"Guia de programação":categories?"Categorias":"favorites".equals(panel)?"Canais favoritos":"Canais");
        JSONObject epg=context.optJSONObject("epg");
        JSONArray input=guide?(epg!=null?epg.optJSONArray("programs"):null):context.optJSONArray(categories?"groups":"channels");
        String previousFirst=rows.optJSONObject(0)!=null?rows.optJSONObject(0).optString("id"):"";
        rows=input!=null?input:new JSONArray();
        String first=rows.optJSONObject(0)!=null?rows.optJSONObject(0).optString("id"):"";
        boolean pageChanged=!guide&&!first.equals(previousFirst);
        int count=Math.min(rows.length(),guide?12:48), selected=-1, position=list.getSelectedItemPosition(), scroll=list.getFirstVisiblePosition();
        String[] labels=new String[count];DateFormat time=DateFormat.getDateTimeInstance(DateFormat.SHORT,DateFormat.SHORT,new Locale("pt","BR"));
        long now=System.currentTimeMillis();
        for(int i=0;i<count;i++) {JSONObject row=rows.optJSONObject(i);if(row==null){labels[i]="";continue;}
            if(guide){long start=row.optLong("start"),end=row.optLong("end");labels[i]=(start<=now&&now<end?"AGORA · ":"A SEGUIR · ")+time.format(new Date(start))+" – "+time.format(new Date(end))+"\n"+text(row.optString("title"),180)+"\n"+text(row.optString("description"),700);}
            else {labels[i]=(row.optBoolean("favorite")?"★ ":"")+text(row.optString("name"),180);if(row.optString("id").equals(context.optString("channelId")))selected=i;}
        }
        message.setText(context.optBoolean("busy")?"Carregando…":guide?(epg!=null?text(epg.optString("message"),240):"Carregando programação…"):!context.optString("message").isEmpty()?text(context.optString("message"),240):count==0?"Nenhum canal disponível nesta lista.":text(context.optString("browseName"),180));
        list.setAdapter(new ArrayAdapter<String>(activity,android.R.layout.simple_list_item_single_choice,labels){
            @Override public View getView(int p,View converted,android.view.ViewGroup parent){TextView v=(TextView)super.getView(p,converted,parent);v.setTextColor(Color.WHITE);v.setTextSize(15);v.setMinHeight(dp(48));return v;}
        });
        if(selected>=0)list.setItemChecked(selected,true);
        if(pageChanged)list.setSelection(0);else if(position>=0&&position<count)list.setSelection(position);else if(scroll>0)list.setSelection(scroll);else if(selected>=0)list.setSelection(selected);
        previousPage.setVisibility(guide?View.GONE:View.VISIBLE);nextPage.setVisibility(guide?View.GONE:View.VISIBLE);
        previousPage.setEnabled(!context.optBoolean("busy")&&context.optBoolean(categories?"previousGroups":"previousPage"));
        nextPage.setEnabled(!context.optBoolean("busy")&&context.optBoolean(categories?"nextGroups":"nextPage"));
        if(pageChanged&&count>0){list.requestFocus();list.setSelection(0);}
    }
    boolean dismissPanel(){if(dialog==null)return false;dialog.dismiss();return true;}
    boolean openRequestedPanel(String name) {
        int id="channels".equals(name)?R.id.live_channels:"categories".equals(name)?R.id.live_categories:"guide".equals(name)?R.id.live_guide:"favorites".equals(name)?R.id.live_favorites:0;
        if(id==0||disposing||context.optBoolean("busy"))return false;
        openPanel(name,view.findViewById(id));emit(name,null);return true;
    }
    static boolean isChannelKey(int key) {
        return key == KeyEvent.KEYCODE_CHANNEL_UP || key == KeyEvent.KEYCODE_CHANNEL_DOWN;
    }
    private void adjustVolume(int direction) {
        if(view.getPlayer()==null)return;
        float volume=Math.max(0f,Math.min(1f,view.getPlayer().getVolume()+direction*0.05f));
        view.getPlayer().setVolume(volume);
        if(volumeToast!=null)volumeToast.cancel();
        volumeToast=Toast.makeText(activity,"Volume do app: "+Math.round(volume*100)+"%",Toast.LENGTH_SHORT);
        volumeToast.show();
    }
    boolean dispatchKey(KeyEvent event) {
        int key=event.getKeyCode();
        if(shortcutKey!=KeyEvent.KEYCODE_UNKNOWN && shortcutKey==key && event.getAction()==KeyEvent.ACTION_UP){shortcutKey=KeyEvent.KEYCODE_UNKNOWN;return true;}
        if(shortcutKey!=KeyEvent.KEYCODE_UNKNOWN && shortcutKey==key && event.getAction()==KeyEvent.ACTION_DOWN && event.getRepeatCount()>0)return true;
        if(dialog!=null)return false;
        if(isChannelKey(key)) {
            if(event.getAction()==KeyEvent.ACTION_DOWN && event.getRepeatCount()==0)
                emit(key==KeyEvent.KEYCODE_CHANNEL_UP?"next":"previous",null);
            return true;
        }
        if(fullscreen && !view.isControllerFullyVisible() && (key==KeyEvent.KEYCODE_DPAD_LEFT||key==KeyEvent.KEYCODE_DPAD_RIGHT||key==KeyEvent.KEYCODE_DPAD_UP||key==KeyEvent.KEYCODE_DPAD_DOWN)) {
            if(event.getAction()==KeyEvent.ACTION_DOWN && event.getRepeatCount()==0) {
                shortcutKey=key;
                if(!disposing && !context.optBoolean("busy")) {
                    if(key==KeyEvent.KEYCODE_DPAD_LEFT||key==KeyEvent.KEYCODE_DPAD_RIGHT)emit(key==KeyEvent.KEYCODE_DPAD_LEFT?"previous":"next",null);
                    else adjustVolume(key==KeyEvent.KEYCODE_DPAD_UP?1:-1);
                }
            }
            return true;
        }
        if(event.getAction()==KeyEvent.ACTION_DOWN&&(key==KeyEvent.KEYCODE_DPAD_CENTER||key==KeyEvent.KEYCODE_ENTER||key==KeyEvent.KEYCODE_DPAD_UP||key==KeyEvent.KEYCODE_DPAD_DOWN||key==KeyEvent.KEYCODE_DPAD_LEFT||key==KeyEvent.KEYCODE_DPAD_RIGHT)) {
            if(!view.isControllerFullyVisible()||!view.hasFocus()){view.showController();view.findViewById(androidx.media3.ui.R.id.exo_play_pause).requestFocus();return true;}
        }
        return false;
    }
    private void close(boolean dispose){disposing=dispose;shortcutKey=KeyEvent.KEYCODE_UNKNOWN;if(volumeToast!=null){volumeToast.cancel();volumeToast=null;}if(dialog!=null){dialog.setOnDismissListener(null);dialog.dismiss();dialog=null;}list=null;panel=null;}
    void close(){close(true);context=new JSONObject();}
}
