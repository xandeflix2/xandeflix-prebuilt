import * as content from '../../src/parental/parental-content.ts';
import {isAdultLiveChannel} from '../../src/playback/content-adult-policy.ts';
import * as store from '../../src/parental/parental-control.store.ts';
import {parentalStorage} from '../../src/parental/parental-storage.ts';
const snapshot=Object.freeze({status:'unconfigured',policy:{maxAge:18,allowAdult:false},admin:false,adultSession:false,busy:false,revision:0,contentRevision:0,lockRevision:0,prompt:null});
export function parentalFixtureBindings(name){
 if(name.endsWith('parental-content.ts'))return content;
 if(name.endsWith('useParentalControl.ts'))return{useParentalControl:()=>snapshot};
 if(name.endsWith('useParentalClassification.ts'))return{useParentalClassification:()=>{}};
 if(name.endsWith('ParentalPinDialog.tsx'))return{ParentalPinDialog:()=>null};
 if(name.endsWith('parental-control.store.ts'))return{...store,parentalControl:{getSnapshot:()=>snapshot,adultVisible:()=>false,rule:()=>undefined,load:async()=>{},subscribe:()=>()=>{},lock(){},cancelPrompt(){}}};
 if(name.endsWith('parental-access.ts'))return{authorizeParentalItem:async item=>!content.isAdultView(item),authorizeParentalLive:async(c,cat)=>!isAdultLiveChannel(c,cat),parentalLiveNeedsPin:()=>false,parentalErrorMessage:()=> 'Parental fixture denied'};
}
export function installUnconfiguredParentalFixture(){parentalStorage.read=async()=>null;parentalStorage.write=async()=>{throw Error('UNEXPECTED_PARENTAL_CONFIGURATION_WRITE')};}
