import com.sun.jdi.*;
import com.sun.jdi.connect.*;
import com.sun.jdi.event.*;
import com.sun.jdi.request.*;
import java.util.*;

/** Classifies HTTP evidence inside the target VM. Never reads private String values or body bytes. */
public class HttpExceptionProbe {
  static VirtualMachine vm;
  static ThreadReference thread;
  static final String TYPE="androidx.media3.datasource.HttpDataSource$InvalidResponseCodeException";
  static Value field(ObjectReference object,String name) {
    if(object==null)return null;
    Field f=object.referenceType().fieldByName(name);
    return f==null?null:object.getValue(f);
  }
  static ObjectReference object(Value v){return v instanceof ObjectReference r?r:null;}
  static ObjectReference invoke(ObjectReference o,String name,String signature,List<? extends Value> args)throws Exception {
    List<Method> methods=o.referenceType().methodsByName(name,signature);
    if(methods.isEmpty())throw new IllegalStateException();
    return object(o.invokeMethod(thread,methods.get(0),args,ObjectReference.INVOKE_SINGLE_THREADED));
  }
  static boolean contains(ObjectReference s,String text)throws Exception {
    List<Method> methods=s.referenceType().methodsByName("contains","(Ljava/lang/CharSequence;)Z");
    Value value=s.invokeMethod(thread,methods.get(0),List.of(vm.mirrorOf(text)),ObjectReference.INVOKE_SINGLE_THREADED);
    return value instanceof BooleanValue b&&b.value();
  }
  static boolean equalsTarget(ObjectReference a,ObjectReference b)throws Exception {
    if(a==null||b==null)return false;
    Method m=a.referenceType().methodsByName("equalsIgnoreCase","(Ljava/lang/String;)Z").get(0);
    return ((BooleanValue)a.invokeMethod(thread,m,List.of(b),ObjectReference.INVOKE_SINGLE_THREADED)).value();
  }
  static ObjectReference lower(ObjectReference s)throws Exception{return invoke(s,"toLowerCase","()Ljava/lang/String;",List.of());}
  static ObjectReference header(ObjectReference map,String name)throws Exception {
    if(map==null)return null;
    ObjectReference values=invoke(map,"get","(Ljava/lang/Object;)Ljava/lang/Object;",List.of(vm.mirrorOf(name)));
    if(values==null)return null;
    return invoke(values,"get","(I)Ljava/lang/Object;",List.of(vm.mirrorOf(0)));
  }
  static ObjectReference headerEither(ObjectReference map,String lower,String title)throws Exception {
    ObjectReference v=header(map,lower);return v!=null?v:header(map,title);
  }
  static Map<String,Object> classify(ObjectReference s,String[] words)throws Exception {
    Map<String,Object> result=new LinkedHashMap<>();
    ObjectReference lowered=lower(s);
    for(String word:words)result.put(word.replace(' ','_'),contains(lowered,word));
    return result;
  }
  static void arm(ReferenceType type){
    ExceptionRequest r=vm.eventRequestManager().createExceptionRequest(type,true,true);
    r.setSuspendPolicy(EventRequest.SUSPEND_EVENT_THREAD);r.enable();
  }
  static Map<String,Object> inspect(ExceptionEvent event) {
    Map<String,Object> out=new LinkedHashMap<>();
    out.put("status","HTTP_EXCEPTION_OBSERVED");
    ObjectReference ex=event.exception();
    Value code=field(ex,"responseCode");out.put("responseCode",code instanceof IntegerValue n?n.value():null);
    Value body=field(ex,"responseBody");
    out.put("responseBodyBytes",body instanceof ArrayReference a?a.length():null);
    try{
      ObjectReference headers=object(field(ex,"headerFields"));
      ObjectReference server=headerEither(headers,"server","Server"),contentType=headerEither(headers,"content-type","Content-Type");
      out.put("hasServerHeader",server!=null);out.put("hasContentTypeHeader",contentType!=null);
      if(server!=null)out.put("serverClassifiers",classify(server,new String[]{"nginx","cloudflare","apache","squid","envoy","microsoft"}));
      if(contentType!=null)out.put("contentTypeClassifiers",classify(contentType,new String[]{"text/html","text/plain","application/json","video/","application/octet-stream"}));
      out.put("hasLocationHeader",headerEither(headers,"location","Location")!=null);
      out.put("hasCloudflareRayHeader",headerEither(headers,"cf-ray","Cf-Ray")!=null);
      out.put("hasViaHeader",headerEither(headers,"via","Via")!=null);
    }catch(Exception e){out.put("headerInspectionErrorClass",e.getClass().getSimpleName());}
    try{
      if(body instanceof ArrayReference array&&array.length()>0&&array.length()<=131072){
        ClassType string=(ClassType)vm.classesByName("java.lang.String").get(0);
        Method constructor=string.methodsByName("<init>","([B)V").get(0);
        ObjectReference text=string.newInstance(thread,constructor,List.of(array),ClassType.INVOKE_SINGLE_THREADED);
        out.put("bodyClassifiers",classify(text,new String[]{"nginx","cloudflare","forbidden","access denied","unauthorized","expired","blocked","too many","connection limit","invalid","not allowed","token","ip address","not found","permission"}));
      }
    }catch(Exception e){out.put("bodyInspectionErrorClass",e.getClass().getSimpleName());}
    try{
      ObjectReference dataSpec=object(field(ex,"dataSpec")),originalUri=object(field(dataSpec,"uri"));
      ObjectReference originalHost=originalUri==null?null:invoke(originalUri,"getHost","()Ljava/lang/String;",List.of());
      ObjectReference originalScheme=originalUri==null?null:invoke(originalUri,"getScheme","()Ljava/lang/String;",List.of());
      ObjectReference response=null;
      for(StackFrame frame:thread.frames()){
        if(frame.location().declaringType().name().equals("androidx.media3.datasource.okhttp.OkHttpDataSource")){
          response=object(field(frame.thisObject(),"response"));if(response!=null)break;
        }
      }
      out.put("okHttpResponseObjectFound",response!=null);
      List<Map<String,Object>> hops=new ArrayList<>();
      for(int i=0;i<8&&response!=null;i++){
        Map<String,Object> hop=new LinkedHashMap<>();Value n=field(response,"code");hop.put("code",n instanceof IntegerValue v?v.value():null);
        ObjectReference request=object(field(response,"request")),url=object(field(request,"url"));
        if(url!=null){
          ObjectReference host=invoke(url,"host","()Ljava/lang/String;",List.of()),scheme=invoke(url,"scheme","()Ljava/lang/String;",List.of());
          hop.put("sameHostAsOriginal",equalsTarget(host,originalHost));hop.put("sameSchemeAsOriginal",equalsTarget(scheme,originalScheme));
        }
        hops.add(hop);response=object(field(response,"priorResponse"));
      }
      out.put("responseChainFinalFirst",hops);out.put("responseChainTruncated",response!=null);
    }catch(Exception e){out.put("responseChainInspectionErrorClass",e.getClass().getSimpleName());}
    return out;
  }
  static String json(Object o){
    if(o==null)return "null";if(o instanceof Boolean||o instanceof Number)return o.toString();
    if(o instanceof Map<?,?> m){StringJoiner j=new StringJoiner(",","{","}");for(var e:m.entrySet())j.add(json(e.getKey().toString())+":"+json(e.getValue()));return j.toString();}
    if(o instanceof List<?> l){StringJoiner j=new StringJoiner(",","[","]");for(var e:l)j.add(json(e));return j.toString();}
    return "\""+o.toString().replace("\\","\\\\").replace("\"","\\\"")+"\"";
  }
  public static void main(String[] args){
    try{
      int port=Integer.parseInt(args[0]);
      AttachingConnector connector=Bootstrap.virtualMachineManager().attachingConnectors().stream().filter(x->x.name().equals("com.sun.jdi.SocketAttach")).findFirst().orElseThrow();
      var a=connector.defaultArguments();a.get("hostname").setValue("127.0.0.1");a.get("port").setValue(Integer.toString(port));a.get("timeout").setValue("5000");vm=connector.attach(a);
      List<ReferenceType> types=vm.classesByName(TYPE);
      if(!types.isEmpty())arm(types.get(0));else{ClassPrepareRequest r=vm.eventRequestManager().createClassPrepareRequest();r.addClassFilter(TYPE);r.setSuspendPolicy(EventRequest.SUSPEND_EVENT_THREAD);r.enable();}
      System.out.println(json(Map.of("status","ARMED","classAlreadyLoaded",!types.isEmpty())));System.out.flush();
      long deadline=System.nanoTime()+90_000_000_000L;
      while(System.nanoTime()<deadline){EventSet events=vm.eventQueue().remove(1000);if(events==null)continue;boolean done=false;try{for(Event e:events){if(e instanceof ClassPrepareEvent p){arm(p.referenceType());p.request().disable();}else if(e instanceof ExceptionEvent x){x.request().disable();thread=x.thread();System.out.println(json(inspect(x)));System.out.flush();done=true;break;}}}finally{events.resume();}if(done)return;}
      System.out.println(json(Map.of("status","NO_MATCHING_EXCEPTION_WITHIN_OBSERVATION_WINDOW")));
    }catch(Exception e){System.out.println(json(Map.of("status","PROBE_FAILED","errorClass",e.getClass().getSimpleName())));}
    finally{if(vm!=null)try{vm.dispose();}catch(Exception ignored){}}
  }
}
