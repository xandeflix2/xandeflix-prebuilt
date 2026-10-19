package com.xandeflix.prebuilt.player;

import android.app.Activity;
import android.app.Dialog;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.SeekBar;
import android.widget.TextView;
import androidx.appcompat.app.AlertDialog;
import androidx.media3.common.C;
import androidx.media3.common.Player;
import androidx.media3.ui.AspectRatioFrameLayout;
import androidx.media3.ui.PlayerView;
import androidx.media3.ui.TrackSelectionDialogBuilder;
import com.xandeflix.prebuilt.R;
import org.json.JSONArray;
import org.json.JSONObject;

/** Native controls share Media3's time bar/play controls, including track capabilities. */
final class PlayerControls {
    interface PlayerSource { Player get(); }
    interface EpisodeSelection { void accept(String id); }
    private final Activity activity;
    private final PlayerView view;
    private final PlayerSource player;
    private final EpisodeSelection selectEpisode;
    private final Runnable next;
    private JSONObject episodes;
    private boolean locked;
    private boolean transitioning;
    private Dialog dialog;
    private final boolean mobile;

    PlayerControls(Activity activity, PlayerView view, PlayerSource player, Runnable back,
            Runnable next, EpisodeSelection selectEpisode) {
        this.activity=activity;this.view=view;this.player=player;this.next=next;this.selectEpisode=selectEpisode;
        mobile=com.xandeflix.prebuilt.cast.CastController.mobile(activity);
        view.findViewById(R.id.player_back).setOnClickListener(v -> back.run());
        view.findViewById(R.id.player_next).setOnClickListener(v -> next.run());
        view.findViewById(R.id.player_episodes).setOnClickListener(v -> showEpisodes());
        view.findViewById(R.id.player_speed).setOnClickListener(v -> showSpeed());
        view.findViewById(R.id.player_tracks).setOnClickListener(v -> showTracks());
        view.findViewById(R.id.player_resize).setOnClickListener(v -> {
            boolean zoom=view.getResizeMode()!=AspectRatioFrameLayout.RESIZE_MODE_ZOOM;
            view.setResizeMode(zoom?AspectRatioFrameLayout.RESIZE_MODE_ZOOM:AspectRatioFrameLayout.RESIZE_MODE_FIT);
            ((Button)v).setText(zoom?"Ajustar tela":"Preencher tela");
        });
        view.findViewById(R.id.player_lock).setVisibility(mobile?View.VISIBLE:View.GONE);
        view.findViewById(R.id.player_brightness).setVisibility(mobile?View.VISIBLE:View.GONE);
        if(!mobile) {
            for(int id:new int[]{R.id.player_resize,R.id.player_speed,R.id.player_episodes,R.id.player_tracks,R.id.player_next})((Button)view.findViewById(id)).setTextSize(14);
        }
        view.findViewById(R.id.player_lock).setOnClickListener(v -> setLocked(!locked));
        if(mobile) {
            SeekBar brightness=view.findViewById(R.id.player_brightness_seek);
            float current=activity.getWindow().getAttributes().screenBrightness;
            if(current<0)try{current=android.provider.Settings.System.getInt(activity.getContentResolver(),android.provider.Settings.System.SCREEN_BRIGHTNESS)/255f;}catch(Exception ignored){current=0.5f;}
            brightness.setProgress(Math.round(current*100));
            brightness.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener(){
                @Override public void onProgressChanged(SeekBar bar,int progress,boolean user){if(user){WindowManager.LayoutParams lp=activity.getWindow().getAttributes();lp.screenBrightness=Math.max(0.05f,progress/100f);activity.getWindow().setAttributes(lp);}}
                @Override public void onStartTrackingTouch(SeekBar bar){view.setControllerShowTimeoutMs(0);}
                @Override public void onStopTrackingTouch(SeekBar bar){view.setControllerShowTimeoutMs(locked?0:NativePlayerActivity.AUTO_HIDE_CONTROLLER_MS);}
            });
        }
    }

    void bind(String title, String kind, JSONObject context) {
        episodes="series".equals(kind)?context:null;
        String prefix=episodes!=null?"T"+episodes.optInt("seasonNumber")+":E"+episodes.optInt("episodeNumber")+"  ":"";
        ((TextView)view.findViewById(R.id.player_title)).setText(prefix+title);
        view.findViewById(R.id.player_episodes).setVisibility(episodes!=null?View.VISIBLE:View.GONE);
        view.findViewById(R.id.player_next).setVisibility(hasNext()?View.VISIBLE:View.GONE);
        updateTracks();
        setTransitioning(false);
    }
    boolean hasNext(){return episodes!=null&&episodes.optBoolean("hasNext",false);}
    boolean containsEpisode(String id) {
        if(episodes==null||id==null||id.equals(episodes.optString("currentEpisodeId")))return false;
        JSONArray list=episodes.optJSONArray("episodes");
        if(list!=null)for(int i=0;i<list.length();i++){JSONObject ep=list.optJSONObject(i);if(ep!=null&&id.equals(ep.optString("id")))return true;}
        return false;
    }
    boolean dialogOpen(){return dialog!=null&&dialog.isShowing();}
    boolean locked(){return locked;}
    void setTransitioning(boolean pending) {
        transitioning=pending;
        view.findViewById(R.id.player_transition).setVisibility(pending?View.VISIBLE:View.GONE);
        for(int id:new int[]{R.id.player_next,R.id.player_episodes,androidx.media3.ui.R.id.exo_play_pause,androidx.media3.ui.R.id.exo_rew,androidx.media3.ui.R.id.exo_ffwd,androidx.media3.ui.R.id.exo_progress})view.findViewById(id).setEnabled(!pending);
        view.setControllerShowTimeoutMs(pending||locked?0:NativePlayerActivity.AUTO_HIDE_CONTROLLER_MS);
        if(pending)view.showController();
    }
    void updateTracks() {
        Player p=player.get();boolean tracks=false;
        if(p!=null)for(androidx.media3.common.Tracks.Group group:p.getCurrentTracks().getGroups())
            if(group.getType()==C.TRACK_TYPE_AUDIO||group.getType()==C.TRACK_TYPE_TEXT){tracks=true;break;}
        view.findViewById(R.id.player_tracks).setEnabled(tracks&&!transitioning);
    }
    private void setLocked(boolean value) {
        locked=value;
        for(int id:new int[]{R.id.player_back,R.id.player_title,R.id.player_cast_slot,R.id.player_center,R.id.player_bottom,R.id.player_brightness})view.findViewById(id).setVisibility(value?View.INVISIBLE:View.VISIBLE);
        ((Button)view.findViewById(R.id.player_lock)).setText(value?"Desbloquear":"Bloquear");
        view.setControllerShowTimeoutMs(value?0:NativePlayerActivity.AUTO_HIDE_CONTROLLER_MS);
        view.showController();
    }
    private void show(Dialog value) {
        if(transitioning||locked||activity.isFinishing())return;
        dialog=value;view.setControllerShowTimeoutMs(0);
        value.setOnDismissListener(d -> {if(dialog!=value)return;dialog=null;view.setControllerShowTimeoutMs(locked?0:NativePlayerActivity.AUTO_HIDE_CONTROLLER_MS);view.showController();});
        value.show();
    }
    private void showSpeed() {
        Player p=player.get();if(p==null)return;
        float[] speeds={0.5f,0.75f,1f,1.25f,1.5f,2f};String[] labels={"0,5x","0,75x","1x","1,25x","1,5x","2x"};int selected=2;
        for(int i=0;i<speeds.length;i++)if(p.getPlaybackParameters().speed==speeds[i])selected=i;
        show(new AlertDialog.Builder(activity).setTitle("Velocidade").setSingleChoiceItems(labels,selected,(d,which)->{
            p.setPlaybackSpeed(speeds[which]);((Button)view.findViewById(R.id.player_speed)).setText("Velocidade ("+labels[which]+")");d.dismiss();
        }).setNegativeButton("Voltar",null).create());
    }
    private void showEpisodes() {
        JSONArray list=episodes!=null?episodes.optJSONArray("episodes"):null;if(list==null||list.length()==0)return;
        String[] labels=new String[list.length()];int selected=-1;
        for(int i=0;i<list.length();i++) {JSONObject ep=list.optJSONObject(i);if(ep==null){labels[i]="";continue;}
            labels[i]="T"+ep.optInt("seasonNumber")+":E"+ep.optInt("episodeNumber")+"  "+ep.optString("title");
            if(ep.optString("id").equals(episodes.optString("currentEpisodeId")))selected=i;
        }
        show(new AlertDialog.Builder(activity).setTitle("Episódios").setSingleChoiceItems(labels,selected,(d,which)->{
            String id=list.optJSONObject(which).optString("id");d.dismiss();if(containsEpisode(id))selectEpisode.accept(id);
        }).setNegativeButton("Voltar",null).create());
    }
    private void showTracks() {
        Player p=player.get();if(p==null)return;
        show(new AlertDialog.Builder(activity).setTitle("Áudio e legendas").setItems(new String[]{"Áudio","Legendas"},(d,which)->{
            d.dismiss();int type=which==0?C.TRACK_TYPE_AUDIO:C.TRACK_TYPE_TEXT;
            show(new TrackSelectionDialogBuilder(activity,which==0?"Áudio":"Legendas",p,type)
                .setShowDisableOption(type==C.TRACK_TYPE_TEXT).setAllowMultipleOverrides(false).build());
        }).setNegativeButton("Voltar",null).create());
    }
    void close(){if(dialog!=null){dialog.setOnDismissListener(null);dialog.dismiss();dialog=null;}}
}
