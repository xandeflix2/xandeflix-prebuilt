package com.xandeflix.prebuilt.player;
import org.junit.Test;
import static org.junit.Assert.*;
public class MobilePipPolicyTest {
 @Test public void mobileAndTabletOnlyDuringPlayback(){
  assertTrue(MobilePipPolicy.eligible(26,1,true,true,3,false));
  assertTrue(MobilePipPolicy.eligible(36,1,true,true,2,false));
  assertFalse(MobilePipPolicy.eligible(25,1,true,true,3,false));
  assertFalse(MobilePipPolicy.eligible(36,4,true,true,3,false));
  assertFalse(MobilePipPolicy.eligible(36,1,false,true,3,false));
  assertFalse(MobilePipPolicy.eligible(36,1,true,false,3,false));
  assertFalse(MobilePipPolicy.eligible(36,1,true,true,4,false));
  assertFalse(MobilePipPolicy.eligible(36,1,true,true,1,false));
  assertFalse(MobilePipPolicy.eligible(36,1,true,true,3,true));
 }
}
